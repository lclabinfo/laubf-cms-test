"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react"
import type {
  Series,
  Message,
  MessageStatus,
} from "./messages-data"

interface MessagesContextValue {
  series: Series[]
  messages: Message[]
  loading: boolean
  error: string | null
  addSeries: (data: { name: string; imageUrl?: string }) => Series
  updateSeries: (id: string, data: { name: string; imageUrl?: string }) => void
  deleteSeries: (id: string) => void
  setSeriesMessages: (seriesId: string, messageIds: string[]) => void
  addMessage: (data: Omit<Message, "id">) => Message
  updateMessage: (id: string, data: Partial<Omit<Message, "id">>) => void
  deleteMessage: (id: string) => void
}

const MessagesContext = createContext<MessagesContextValue | null>(null)

// --- Adapter: API response -> CMS Message type ---

const statusFromApi: Record<string, MessageStatus> = {
  PUBLISHED: "published",
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  ARCHIVED: "archived",
}

const statusToApi: Record<string, string> = {
  published: "PUBLISHED",
  draft: "DRAFT",
  scheduled: "SCHEDULED",
  archived: "ARCHIVED",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiMessageToCms(apiMsg: any): Message {
  return {
    id: apiMsg.id,
    slug: apiMsg.slug ?? "",
    title: apiMsg.title,
    passage: apiMsg.passage ?? "",
    description: apiMsg.description ?? undefined,
    speaker: apiMsg.speaker?.name ?? "",
    speakerId: apiMsg.speaker?.id ?? undefined,
    seriesId: (apiMsg.messageSeries ?? []).length > 0 ? apiMsg.messageSeries[0].series.id : null,
    date: apiMsg.dateFor ? new Date(apiMsg.dateFor).toISOString().slice(0, 10) : "",
    publishedAt: apiMsg.publishedAt ? new Date(apiMsg.publishedAt).toISOString() : undefined,
    status: statusFromApi[apiMsg.status] ?? "draft",
    hasVideo: apiMsg.hasVideo ?? false,
    hasStudy: apiMsg.hasStudy ?? false,
    videoUrl: apiMsg.videoUrl ?? undefined,
    videoDescription: apiMsg.videoDescription ?? undefined,
    youtubeId: apiMsg.youtubeId ?? undefined,
    thumbnailUrl: apiMsg.thumbnailUrl ?? undefined,
    duration: apiMsg.duration ?? undefined,
    audioUrl: apiMsg.audioUrl ?? undefined,
    rawTranscript: apiMsg.rawTranscript ?? undefined,
    liveTranscript: apiMsg.liveTranscript ?? undefined,
    transcriptSegments: apiMsg.transcriptSegments ?? undefined,
    studySections: apiMsg.studySections ?? undefined,
    attachments: apiMsg.attachments ?? undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiSeriesToCms(apiSeries: any): Series {
  return {
    id: apiSeries.id,
    name: apiSeries.name,
    imageUrl: apiSeries.imageUrl ?? undefined,
  }
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
  return match?.[1] ?? null
}

function cmsMessageToApiCreate(data: Omit<Message, "id">) {
  const youtubeId = data.videoUrl ? extractYouTubeId(data.videoUrl) : null
  return {
    title: data.title,
    slug: data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
    passage: data.passage || null,
    description: data.description || null,
    dateFor: data.date ? new Date(data.date + "T00:00:00").toISOString() : new Date().toISOString(),
    status: statusToApi[data.status] ?? "DRAFT",
    hasVideo: data.hasVideo,
    hasStudy: data.hasStudy,
    videoUrl: data.videoUrl || null,
    videoDescription: data.videoDescription || null,
    youtubeId: youtubeId || data.youtubeId || null,
    thumbnailUrl: data.thumbnailUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null),
    duration: data.duration || null,
    audioUrl: data.audioUrl || null,
    rawTranscript: data.rawTranscript || null,
    liveTranscript: data.liveTranscript || null,
    transcriptSegments: data.transcriptSegments || null,
    studySections: data.studySections || null,
    attachments: data.attachments || null,
    publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
    speakerId: data.speakerId || null,
    seriesId: data.seriesId || null,
  }
}

function cmsMessageToApiUpdate(data: Partial<Omit<Message, "id">>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {}
  if (data.title !== undefined) payload.title = data.title
  if (data.passage !== undefined) payload.passage = data.passage || null
  if (data.description !== undefined) payload.description = data.description || null
  if (data.date !== undefined) payload.dateFor = new Date(data.date + "T00:00:00").toISOString()
  if (data.status !== undefined) payload.status = statusToApi[data.status] ?? "DRAFT"
  if (data.hasVideo !== undefined) payload.hasVideo = data.hasVideo
  if (data.hasStudy !== undefined) payload.hasStudy = data.hasStudy
  if (data.videoUrl !== undefined) {
    payload.videoUrl = data.videoUrl || null
    // Auto-extract youtubeId and thumbnailUrl from video URL
    const ytId = data.videoUrl ? extractYouTubeId(data.videoUrl) : null
    if (ytId) {
      payload.youtubeId = ytId
      payload.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`
    }
  }
  if (data.videoDescription !== undefined) payload.videoDescription = data.videoDescription || null
  if (data.duration !== undefined) payload.duration = data.duration || null
  if (data.audioUrl !== undefined) payload.audioUrl = data.audioUrl || null
  if (data.rawTranscript !== undefined) payload.rawTranscript = data.rawTranscript || null
  if (data.liveTranscript !== undefined) payload.liveTranscript = data.liveTranscript || null
  if (data.transcriptSegments !== undefined) payload.transcriptSegments = data.transcriptSegments || null
  if (data.studySections !== undefined) payload.studySections = data.studySections || null
  if (data.attachments !== undefined) payload.attachments = data.attachments || null
  if (data.publishedAt !== undefined) payload.publishedAt = data.publishedAt ? new Date(data.publishedAt).toISOString() : null
  if (data.speakerId !== undefined) payload.speakerId = data.speakerId || null
  if (data.seriesId !== undefined) payload.seriesId = data.seriesId || null
  return payload
}

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<Series[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch messages and series from API on mount
  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        const [messagesRes, seriesRes] = await Promise.all([
          fetch("/api/v1/messages?pageSize=100&status="),
          fetch("/api/v1/series"),
        ])

        if (!messagesRes.ok || !seriesRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const messagesJson = await messagesRes.json()
        const seriesJson = await seriesRes.json()

        if (cancelled) return

        setMessages((messagesJson.data ?? []).map(apiMessageToCms))
        setSeries((seriesJson.data ?? []).map(apiSeriesToCms))
      } catch (err) {
        if (!cancelled) {
          console.error("MessagesProvider fetch error:", err)
          setError(err instanceof Error ? err.message : "Failed to load messages")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  const addSeries = useCallback((data: { name: string; imageUrl?: string }) => {
    const tempSeries: Series = {
      id: `s${Date.now()}`,
      name: data.name,
      imageUrl: data.imageUrl,
    }
    setSeries((prev) => [...prev, tempSeries])

    // Fire API call in background
    fetch("/api/v1/series", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        slug: data.name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
        imageUrl: data.imageUrl || null,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to create series (${res.status})`)
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setSeries((prev) =>
            prev.map((s) => (s.id === tempSeries.id ? apiSeriesToCms(json.data) : s))
          )
        }
      })
      .catch((err) => {
        console.error("addSeries error:", err)
        // Rollback: remove temp series
        setSeries((prev) => prev.filter((s) => s.id !== tempSeries.id))
      })

    return tempSeries
  }, [])

  const updateSeries = useCallback((id: string, data: { name: string; imageUrl?: string }) => {
    setSeries((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: data.name, imageUrl: data.imageUrl } : s))
    )
    // TODO: Call PATCH /api/v1/series/[slug] when the route exists
  }, [])

  const deleteSeries = useCallback((id: string) => {
    setSeries((prev) => prev.filter((s) => s.id !== id))
    setMessages((prev) =>
      prev.map((m) =>
        m.seriesId === id ? { ...m, seriesId: null } : m
      )
    )
    // TODO: Call DELETE /api/v1/series/[slug] when the route exists
  }, [])

  const setSeriesMessages = useCallback((seriesId: string, messageIds: string[]) => {
    setMessages((prev) =>
      prev.map((m) => {
        const inSelection = messageIds.includes(m.id)
        const inSeries = m.seriesId === seriesId
        if (inSelection && !inSeries) {
          return { ...m, seriesId }
        }
        if (!inSelection && inSeries) {
          return { ...m, seriesId: null }
        }
        return m
      })
    )
    // TODO: Update MessageSeries join records via API
  }, [])

  const addMessage = useCallback((data: Omit<Message, "id">) => {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
    const tempMessage: Message = {
      ...data,
      id: `m${Date.now()}`,
      slug,
    }
    setMessages((prev) => [tempMessage, ...prev])

    // Fire API call in background
    fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cmsMessageToApiCreate(data)),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to create message (${res.status})`)
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMessage.id ? apiMessageToCms(json.data) : m))
          )
        }
      })
      .catch((err) => {
        console.error("addMessage error:", err)
        // Rollback: remove temp message
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      })

    return tempMessage
  }, [])

  const updateMessage = useCallback((id: string, data: Partial<Omit<Message, "id">>) => {
    // Capture pre-update snapshot for rollback, then optimistic update
    let snapshot: Message | undefined
    setMessages((prev) => {
      snapshot = prev.find((m) => m.id === id)
      return prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    })

    // Find the message slug from current state
    setMessages((prev) => {
      const msg = prev.find((m) => m.id === id)
      if (!msg?.slug) return prev

      fetch(`/api/v1/messages/${msg.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cmsMessageToApiUpdate(data)),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to update message (${res.status})`)
          return res.json()
        })
        .then((json) => {
          if (json.success && json.data) {
            setMessages((p) =>
              p.map((m) => (m.id === id ? apiMessageToCms(json.data) : m))
            )
          }
        })
        .catch((err) => {
          console.error("updateMessage error:", err)
          // Rollback to snapshot
          if (snapshot) {
            setMessages((p) => p.map((m) => (m.id === id ? snapshot! : m)))
          }
        })

      return prev // no state change in this call, just reading slug
    })
  }, [])

  const deleteMessage = useCallback((id: string) => {
    let deleted: Message | undefined
    setMessages((prev) => {
      deleted = prev.find((m) => m.id === id)
      return prev.filter((m) => m.id !== id)
    })

    if (deleted?.slug) {
      fetch(`/api/v1/messages/${deleted.slug}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to delete message (${res.status})`)
        })
        .catch((err) => {
          console.error("deleteMessage error:", err)
          // Rollback: re-add deleted message
          if (deleted) {
            setMessages((prev) => [deleted!, ...prev])
          }
        })
    }
  }, [])

  const value = useMemo(
    () => ({
      series,
      messages,
      loading,
      error,
      addSeries,
      updateSeries,
      deleteSeries,
      setSeriesMessages,
      addMessage,
      updateMessage,
      deleteMessage,
    }),
    [series, messages, loading, error, addSeries, updateSeries, deleteSeries, setSeriesMessages, addMessage, updateMessage, deleteMessage]
  )

  return <MessagesContext value={value}>{children}</MessagesContext>
}

export function useMessages() {
  const ctx = useContext(MessagesContext)
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider")
  return ctx
}
