"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type {
  UploadJob,
  UploadQueueContextValue,
} from "@/lib/upload-queue"
import { MAX_UPLOAD_SIZE } from "@/lib/upload-constants"
import { UploadProgressPanel } from "@/components/cms/upload-progress-panel"

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null)

export function useUploadQueue(): UploadQueueContextValue {
  const ctx = useContext(UploadQueueContext)
  if (!ctx) throw new Error("useUploadQueue must be used within UploadQueueProvider")
  return ctx
}

// Dimension extraction helpers (same as upload-media.ts but inlined to avoid import issues)
function getMediaDimensions(file: File): Promise<{ width: number; height: number }> {
  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.preload = "metadata"
      const url = URL.createObjectURL(file)
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight })
        URL.revokeObjectURL(url)
      }
      video.onerror = () => {
        resolve({ width: 0, height: 0 })
        URL.revokeObjectURL(url)
      }
      video.src = url
    })
  }
  return new Promise((resolve) => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export function UploadQueueProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<UploadJob[]>([])
  const xhrMap = useRef(new Map<string, XMLHttpRequest>())
  const abortMap = useRef(new Map<string, AbortController>())
  const completeCbs = useRef(new Set<(job: UploadJob) => void>())
  const processingRef = useRef(false)

  // --- Job state helpers ---
  const updateJob = useCallback((id: string, patch: Partial<UploadJob>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }, [])

  const getJob = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs],
  )

  // --- Process a single job ---
  const processJob = useCallback(
    async (job: UploadJob) => {
      const { id, file, folder } = job

      try {
        // Step 1: Get presigned URL
        updateJob(id, { status: "getting-url" })
        const ac1 = new AbortController()
        abortMap.current.set(id, ac1)

        const urlRes = await fetch("/api/v1/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
            context: "media",
          }),
          signal: ac1.signal,
        })
        const urlJson = await urlRes.json()
        if (!urlJson.success) {
          const msg =
            urlRes.status === 413
              ? "Storage quota exceeded"
              : urlJson.error?.message ?? "Failed to get upload URL"
          updateJob(id, { status: "error", error: msg })
          return
        }

        const { uploadUrl, publicUrl } = urlJson.data

        // Step 2: PUT to R2 via XMLHttpRequest (progress tracking)
        updateJob(id, { status: "uploading", progress: 0 })

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhrMap.current.set(id, xhr)

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              updateJob(id, { progress: pct })
            }
          }
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
          xhr.onerror = () => reject(new Error("Network error"))
          xhr.onabort = () => reject(new Error("Cancelled"))

          xhr.open("PUT", uploadUrl)
          xhr.setRequestHeader("Content-Type", file.type)
          xhr.send(file)
        })

        xhrMap.current.delete(id)

        // Step 3: Create media record
        updateJob(id, { status: "creating-record", progress: 100 })
        const ac2 = new AbortController()
        abortMap.current.set(id, ac2)

        // Ensure folder exists (fire-and-forget)
        if (folder !== "/") {
          fetch("/api/v1/media/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: folder }),
          }).catch(() => {})
        }

        const dims = await getMediaDimensions(file)

        const createRes = await fetch("/api/v1/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            url: publicUrl,
            mimeType: file.type,
            fileSize: file.size,
            width: dims.width || undefined,
            height: dims.height || undefined,
            folder,
          }),
          signal: ac2.signal,
        })

        const createJson = await createRes.json().catch(() => null)
        if (!createRes.ok || !createJson?.success) {
          updateJob(id, {
            status: "error",
            error: createJson?.error?.message ?? `Upload failed (${createRes.status})`,
          })
          return
        }

        const result = {
          mediaId: createJson.data.id,
          url: createJson.data.url,
          filename: file.name,
          folder,
        }

        updateJob(id, { status: "done", progress: 100, result })

        // Notify completion listeners
        const doneJob: UploadJob = {
          ...job,
          status: "done",
          progress: 100,
          result,
        }
        for (const cb of completeCbs.current) {
          try {
            cb(doneJob)
          } catch {
            // ignore callback errors
          }
        }
      } catch (err) {
        // Check if this was a cancellation
        const currentJob = jobs.find((j) => j.id === id)
        if (currentJob?.status === "cancelled") return

        const message =
          err instanceof Error ? err.message : "Upload failed"
        if (message === "Cancelled") {
          updateJob(id, { status: "cancelled" })
        } else {
          updateJob(id, { status: "error", error: message })
        }
      } finally {
        xhrMap.current.delete(id)
        abortMap.current.delete(id)
      }
    },
    [updateJob, jobs],
  )

  // --- Queue processor ---
  useEffect(() => {
    if (processingRef.current) return

    const nextJob = jobs.find((j) => j.status === "queued")
    if (!nextJob) return

    processingRef.current = true

    processJob(nextJob).finally(() => {
      processingRef.current = false
    })
  }, [jobs, processJob])

  // --- beforeunload warning ---
  useEffect(() => {
    const hasActive = jobs.some(
      (j) =>
        j.status === "queued" ||
        j.status === "getting-url" ||
        j.status === "uploading" ||
        j.status === "creating-record",
    )

    if (hasActive) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault()
      }
      window.addEventListener("beforeunload", handler)
      return () => window.removeEventListener("beforeunload", handler)
    }
  }, [jobs])

  // --- Context methods ---
  const enqueue = useCallback((files: File[], folder: string) => {
    const newJobs: UploadJob[] = files
      .filter((f) => f.size <= MAX_UPLOAD_SIZE)
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        folder,
        status: "queued" as const,
        progress: 0,
        createdAt: Date.now(),
      }))

    if (newJobs.length > 0) {
      setJobs((prev) => [...prev, ...newJobs])
    }
  }, [])

  const cancel = useCallback(
    (jobId: string) => {
      const job = getJob(jobId)
      if (!job) return

      // Abort in-flight requests
      const xhr = xhrMap.current.get(jobId)
      if (xhr) {
        xhr.abort()
        xhrMap.current.delete(jobId)
      }
      const ac = abortMap.current.get(jobId)
      if (ac) {
        ac.abort()
        abortMap.current.delete(jobId)
      }

      updateJob(jobId, { status: "cancelled" })
    },
    [getJob, updateJob],
  )

  const dismiss = useCallback((jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
  }, [])

  const dismissAll = useCallback(() => {
    setJobs((prev) =>
      prev.filter(
        (j) =>
          j.status !== "done" &&
          j.status !== "error" &&
          j.status !== "cancelled",
      ),
    )
  }, [])

  const retry = useCallback(
    (jobId: string) => {
      updateJob(jobId, {
        status: "queued",
        progress: 0,
        error: undefined,
      })
    },
    [updateJob],
  )

  const onComplete = useCallback(
    (cb: (job: UploadJob) => void) => {
      completeCbs.current.add(cb)
      return () => {
        completeCbs.current.delete(cb)
      }
    },
    [],
  )

  const value: UploadQueueContextValue = {
    jobs,
    enqueue,
    cancel,
    dismiss,
    dismissAll,
    retry,
    onComplete,
  }

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
      <UploadProgressPanel />
    </UploadQueueContext.Provider>
  )
}
