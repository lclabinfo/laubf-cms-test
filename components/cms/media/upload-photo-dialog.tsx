"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { MediaItem } from "@/lib/media-data"
import { mediaAssetToItem } from "@/lib/media-data"

const ACCEPTED_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,audio/mpeg,video/mp4,application/pdf"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

interface UploadPhotoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (assets: MediaItem[]) => void
  currentFolder?: string | null
}

type FileStatus = "pending" | "uploading" | "done" | "error"

interface TrackedFile {
  file: File
  status: FileStatus
  error?: string
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

export function UploadPhotoDialog({
  open,
  onOpenChange,
  onSubmit,
  currentFolder,
}: UploadPhotoDialogProps) {
  if (!open) return null
  return (
    <UploadPhotoDialogInner
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      currentFolder={currentFolder}
    />
  )
}

function UploadPhotoDialogInner({
  onOpenChange,
  onSubmit,
  currentFolder,
}: Omit<UploadPhotoDialogProps, "open">) {
  const [trackedFiles, setTrackedFiles] = useState<TrackedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles: TrackedFile[] = Array.from(e.target.files).map(
        (file) => {
          if (file.size > MAX_FILE_SIZE) {
            return {
              file,
              status: "error" as const,
              error: `File exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`,
            }
          }
          return { file, status: "pending" as const }
        }
      )
      setTrackedFiles(newFiles)
    }
  }

  const updateFileStatus = useCallback(
    (index: number, status: FileStatus, error?: string) => {
      setTrackedFiles((prev) =>
        prev.map((tf, i) =>
          i === index ? { ...tf, status, error } : tf
        )
      )
    },
    []
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pendingFiles = trackedFiles.filter((tf) => tf.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)
    const createdItems: MediaItem[] = []

    const folder = currentFolder ?? "/"

    for (let i = 0; i < trackedFiles.length; i++) {
      const tf = trackedFiles[i]
      if (tf.status !== "pending") continue

      updateFileStatus(i, "uploading")

      try {
        // 1. Get presigned URL
        const urlRes = await fetch("/api/v1/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: tf.file.name,
            contentType: tf.file.type,
            fileSize: tf.file.size,
            context: "media",
          }),
        })

        const urlJson = await urlRes.json()
        if (!urlJson.success) {
          const msg =
            urlRes.status === 413
              ? "Storage quota exceeded"
              : urlJson.error ?? "Failed to get upload URL"
          updateFileStatus(i, "error", msg)
          continue
        }

        const { uploadUrl, publicUrl } = urlJson.data

        // 2. PUT to R2
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: tf.file,
          headers: { "Content-Type": tf.file.type },
        })

        if (!putRes.ok) {
          updateFileStatus(i, "error", "Upload to storage failed")
          continue
        }

        // 3. Get image dimensions (for images)
        let width: number | undefined
        let height: number | undefined
        if (tf.file.type.startsWith("image/")) {
          const dims = await getImageDimensions(tf.file)
          width = dims.width
          height = dims.height
        }

        // 4. Create media record (promotes from staging)
        const createRes = await fetch("/api/v1/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: tf.file.name,
            url: publicUrl,
            mimeType: tf.file.type,
            fileSize: tf.file.size,
            width,
            height,
            folder,
          }),
        })

        const createJson = await createRes.json()
        if (!createJson.success) {
          updateFileStatus(
            i,
            "error",
            createJson.error ?? "Failed to create media record"
          )
          continue
        }

        createdItems.push(mediaAssetToItem(createJson.data))
        updateFileStatus(i, "done")
      } catch {
        updateFileStatus(i, "error", "Network error")
      }
    }

    setIsUploading(false)

    if (createdItems.length > 0) {
      onSubmit(createdItems)
      toast.success(
        `Uploaded ${createdItems.length} file${createdItems.length > 1 ? "s" : ""}`
      )
    }

    const errorCount = trackedFiles.filter((tf) => tf.status === "error").length
    if (errorCount > 0 && createdItems.length === 0) {
      toast.error("All uploads failed")
    }

    // Close dialog if everything succeeded
    if (errorCount === 0) {
      onOpenChange(false)
    }
  }

  const pendingCount = trackedFiles.filter(
    (tf) => tf.status === "pending"
  ).length
  const hasFiles = trackedFiles.length > 0

  return (
    <Dialog open onOpenChange={isUploading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Select files to upload to your media library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />

          {!hasFiles ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center hover:border-foreground/30 transition-colors"
            >
              <Upload className="size-8 text-muted-foreground/50 mb-2" />
              <span className="text-sm font-medium">
                Click to select files
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Images, videos, audio, and PDFs supported (max{" "}
                {formatFileSize(MAX_FILE_SIZE)} each)
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                {trackedFiles.map((tf, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm gap-2"
                  >
                    <span className="truncate font-medium flex items-center gap-2 min-w-0">
                      {tf.status === "uploading" && (
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
                      )}
                      {tf.status === "done" && (
                        <CheckCircle2 className="size-3.5 shrink-0 text-green-600" />
                      )}
                      {tf.status === "error" && (
                        <AlertCircle className="size-3.5 shrink-0 text-destructive" />
                      )}
                      <span className="truncate">{tf.file.name}</span>
                    </span>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {tf.error ? (
                        <span className="text-destructive">{tf.error}</span>
                      ) : (
                        formatFileSize(tf.file.size)
                      )}
                    </span>
                  </div>
                ))}
              </div>
              {!isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTrackedFiles([])
                    if (inputRef.current) inputRef.current.value = ""
                  }}
                >
                  Clear selection
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pendingCount === 0 || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>Upload {pendingCount > 0 && `(${pendingCount})`}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
