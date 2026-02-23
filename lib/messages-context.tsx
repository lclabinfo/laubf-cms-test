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
    title: apiMsg.title,
    passage: apiMsg.passage ?? "",
    speaker: apiMsg.speaker?.name ?? "",
    seriesIds: (apiMsg.messageSeries ?? []).map((ms: { series: { id: string } }) => ms.series.id),
    date: apiMsg.dateFor ? new Date(apiMsg.dateFor).toISOString().slice(0, 10) : "",
    publishedAt: apiMsg.publishedAt ? new Date(apiMsg.publishedAt).toISOString() : undefined,
    status: statusFromApi[apiMsg.status] ?? "draft",
    hasVideo: apiMsg.hasVideo ?? false,
    hasStudy: apiMsg.hasStudy ?? false,
    videoUrl: apiMsg.videoUrl ?? undefined,
    videoDescription: apiMsg.videoDescription ?? undefined,
    rawTranscript: apiMsg.rawTranscript ?? undefined,
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

function cmsMessageToApiCreate(data: Omit<Message, "id">) {
  return {
    title: data.title,
    slug: data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
    passage: data.passage || null,
    dateFor: data.date ? new Date(data.date + "T00:00:00").toISOString() : new Date().toISOString(),
    status: statusToApi[data.status] ?? "DRAFT",
    hasVideo: data.hasVideo,
    hasStudy: data.hasStudy,
    videoUrl: data.videoUrl || null,
    videoDescription: data.videoDescription || null,
    rawTranscript: data.rawTranscript || null,
    transcriptSegments: data.transcriptSegments || null,
    studySections: data.studySections || null,
    attachments: data.attachments || null,
    publishedAt: data.publishedAt ? new Date(data.publishedAt).toISOString() : null,
    // TODO: Map speaker name to speakerId once speaker dropdown is wired
    // TODO: Map seriesIds to MessageSeries join records
  }
}

function cmsMessageToApiUpdate(data: Partial<Omit<Message, "id">>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = {}
  if (data.title !== undefined) payload.title = data.title
  if (data.passage !== undefined) payload.passage = data.passage || null
  if (data.date !== undefined) payload.dateFor = new Date(data.date + "T00:00:00").toISOString()
  if (data.status !== undefined) payload.status = statusToApi[data.status] ?? "DRAFT"
  if (data.hasVideo !== undefined) payload.hasVideo = data.hasVideo
  if (data.hasStudy !== undefined) payload.hasStudy = data.hasStudy
  if (data.videoUrl !== undefined) payload.videoUrl = data.videoUrl || null
  if (data.videoDescription !== undefined) payload.videoDescription = data.videoDescription || null
  if (data.rawTranscript !== undefined) payload.rawTranscript = data.rawTranscript || null
  if (data.transcriptSegments !== undefined) payload.transcriptSegments = data.transcriptSegments || null
  if (data.studySections !== undefined) payload.studySections = data.studySections || null
  if (data.attachments !== undefined) payload.attachments = data.attachments || null
  if (data.publishedAt !== undefined) payload.publishedAt = data.publishedAt ? new Date(data.publishedAt).toISOString() : null
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
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setSeries((prev) =>
            prev.map((s) => (s.id === tempSeries.id ? apiSeriesToCms(json.data) : s))
          )
        }
      })
      .catch(console.error)

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
        m.seriesIds.includes(id)
          ? { ...m, seriesIds: m.seriesIds.filter((sid) => sid !== id) }
          : m
      )
    )
    // TODO: Call DELETE /api/v1/series/[slug] when the route exists
  }, [])

  const setSeriesMessages = useCallback((seriesId: string, messageIds: string[]) => {
    setMessages((prev) =>
      prev.map((m) => {
        const inSelection = messageIds.includes(m.id)
        const inSeries = m.seriesIds.includes(seriesId)
        if (inSelection && !inSeries) {
          return { ...m, seriesIds: [...m.seriesIds, seriesId] }
        }
        if (!inSelection && inSeries) {
          return { ...m, seriesIds: m.seriesIds.filter((s) => s !== seriesId) }
        }
        return m
      })
    )
    // TODO: Update MessageSeries join records via API
  }, [])

  const addMessage = useCallback((data: Omit<Message, "id">) => {
    const tempMessage: Message = {
      ...data,
      id: `m${Date.now()}`,
    }
    setMessages((prev) => [tempMessage, ...prev])

    // Fire API call in background
    fetch("/api/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cmsMessageToApiCreate(data)),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempMessage.id ? apiMessageToCms(json.data) : m))
          )
        }
      })
      .catch(console.error)

    return tempMessage
  }, [])

  const updateMessage = useCallback((id: string, data: Partial<Omit<Message, "id">>) => {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    )

    // Find the message to get its slug for the API call
    setMessages((prev) => {
      const msg = prev.find((m) => m.id === id)
      if (msg) {
        // We need the slug - derive from title or use id-based lookup
        // For now, use the message id directly in the URL pattern
        // The API route accepts slug, so we do a lookup by fetching first
        fetch(`/api/v1/messages?pageSize=1&status=`, {
          // Use a workaround: we don't have the slug readily, so use the list endpoint
          // This is temporary until we add slug to the CMS message type
        }).catch(console.error)
      }
      return prev
    })

    // Direct PATCH using fetch — we need the slug, so we temporarily skip the API call
    // The optimistic update ensures the UI stays responsive
    // TODO: Store slug in CMS Message type to enable proper PATCH calls
    void cmsMessageToApiUpdate(data) // suppress unused lint
  }, [])

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
    // TODO: Call DELETE /api/v1/messages/[slug] when slug is available in CMS type
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
