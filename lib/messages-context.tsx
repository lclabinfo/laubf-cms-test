"use client"

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react"
import { useSessionState } from "@/lib/hooks/use-session-state"
import type {
  Series,
  Message,
  StudySection,
  Attachment,
} from "./messages-data"
import { generateSlug } from "@/lib/utils"

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SortBy = 'dateFor' | 'title' | 'speaker'
export type SortDir = 'asc' | 'desc'

interface MessagesContextValue {
  series: Series[]
  messages: Message[]
  loading: boolean
  /** True when refetching with existing data (filter/page change). Use for subtle loading indicators instead of skeletons. */
  reloading: boolean
  error: string | null
  pagination: PaginationInfo
  search: string
  dateFrom: string
  dateTo: string
  seriesFilter: string | undefined
  sortBy: SortBy
  sortDir: SortDir
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearch: (search: string) => void
  setDateFrom: (dateFrom: string) => void
  setDateTo: (dateTo: string) => void
  setSeriesFilter: (seriesId: string | undefined) => void
  setSort: (sortBy: SortBy, sortDir: SortDir) => void
  refetch: () => void
  fetchMessageById: (id: string) => Promise<Message | null>
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

// Synthesize studySections from BibleStudy data when Message.studySections is null
// (legacy migrated entries store content in BibleStudy.questions/answers/transcript)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function synthesizeStudySections(relatedStudy: any): StudySection[] | undefined {
  if (!relatedStudy) return undefined
  const hasAnyContent = relatedStudy.questions || relatedStudy.answers || relatedStudy.transcript
  if (!hasAnyContent) return undefined
  const sections: StudySection[] = [
    {
      id: `legacy-q-${relatedStudy.id}`,
      title: "Questions",
      content: relatedStudy.questions || "",
    },
    {
      id: `legacy-a-${relatedStudy.id}`,
      title: "Answers",
      content: relatedStudy.answers || "",
    },
  ]
  if (relatedStudy.transcript) {
    sections.push({
      id: `legacy-t-${relatedStudy.id}`,
      title: "Transcript",
      content: relatedStudy.transcript,
    })
  }
  return sections
}

// Synthesize attachments from BibleStudy.attachments when Message.attachments is null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function synthesizeAttachments(relatedStudy: any): Attachment[] | undefined {
  if (!relatedStudy?.attachments?.length) return undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return relatedStudy.attachments.map((att: any) => ({
    id: att.id,
    name: att.name,
    size: att.fileSize ? formatFileSize(att.fileSize) : "",
    type: att.type ?? "",
    url: att.url ?? undefined,
    fileSize: att.fileSize ?? undefined,
  }))
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiMessageToCms(apiMsg: any): Message {
  let videoUrl: string | undefined = apiMsg.videoUrl ?? undefined
  if (!videoUrl && apiMsg.youtubeId) {
    videoUrl = `https://www.youtube.com/watch?v=${apiMsg.youtubeId}`
  }

  return {
    id: apiMsg.id,
    slug: apiMsg.slug ?? "",
    title: apiMsg.title,
    videoTitle: apiMsg.videoTitle ?? undefined,
    passage: apiMsg.passage ?? "",
    bibleVersion: apiMsg.bibleVersion ?? "ESV",
    speaker: apiMsg.speaker?.name ?? "",
    speakerId: apiMsg.speaker?.id ?? undefined,
    seriesId: (apiMsg.messageSeries ?? []).length > 0 ? apiMsg.messageSeries[0].series.id : null,
    date: apiMsg.dateFor ? new Date(apiMsg.dateFor).toISOString().slice(0, 10) : "",
    publishedAt: apiMsg.publishedAt ? new Date(apiMsg.publishedAt).toISOString() : undefined,
    hasVideo: apiMsg.hasVideo ?? false,
    hasStudy: apiMsg.hasStudy ?? false,
    videoPublished: apiMsg.hasVideo ?? false,
    studyPublished: apiMsg.hasStudy ?? false,
    videoUrl,
    videoDescription: apiMsg.videoDescription ?? undefined,
    youtubeId: apiMsg.youtubeId ?? undefined,
    thumbnailUrl: apiMsg.thumbnailUrl ?? undefined,
    duration: apiMsg.duration ?? undefined,
    audioUrl: apiMsg.audioUrl ?? undefined,
    rawTranscript: apiMsg.rawTranscript ?? undefined,
    liveTranscript: apiMsg.liveTranscript ?? undefined,
    transcriptSegments: apiMsg.transcriptSegments ?? undefined,
    studySections: apiMsg.studySections ?? synthesizeStudySections(apiMsg.relatedStudy),
    attachments: apiMsg.attachments ?? synthesizeAttachments(apiMsg.relatedStudy),
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
    videoTitle: data.videoTitle || null,
    slug: generateSlug(data.title),
    passage: data.passage || null,
    bibleVersion: data.bibleVersion || "ESV",
    dateFor: data.date ? new Date(data.date + "T00:00:00").toISOString() : new Date().toISOString(),
    hasVideo: data.videoPublished,
    hasStudy: data.studyPublished,
    videoUrl: data.videoUrl || null,
    videoDescription: data.videoDescription || null,
    youtubeId: youtubeId || data.youtubeId || null,
    thumbnailUrl: data.thumbnailUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null),
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
  if (data.videoTitle !== undefined) payload.videoTitle = data.videoTitle || null
  if (data.slug !== undefined) payload.slug = data.slug
  if (data.passage !== undefined) payload.passage = data.passage || null
  if (data.bibleVersion !== undefined) payload.bibleVersion = data.bibleVersion || "ESV"
  if (data.date !== undefined) payload.dateFor = new Date(data.date + "T00:00:00").toISOString()
  if (data.hasVideo !== undefined) payload.hasVideo = data.hasVideo
  if (data.hasStudy !== undefined) payload.hasStudy = data.hasStudy
  if (data.videoUrl !== undefined) {
    payload.videoUrl = data.videoUrl || null
    const ytId = data.videoUrl ? extractYouTubeId(data.videoUrl) : null
    if (ytId) {
      payload.youtubeId = ytId
      payload.thumbnailUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    }
  }
  if (data.videoPublished !== undefined || data.studyPublished !== undefined) {
    const hasVideoSource = !!(data.videoUrl ?? payload.videoUrl ?? payload.youtubeId)
    const vp = (data.videoPublished ?? false) && hasVideoSource
    const sp = data.studyPublished ?? false
    payload.hasVideo = vp
    payload.hasStudy = sp
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

const DEFAULT_PAGE_SIZE = 50

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<Series[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const hasLoadedRef = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 0,
  })
  const [search, setSearchState] = useSessionState("cms:messages:search", "")
  const [dateFrom, setDateFromState] = useSessionState("cms:messages:dateFrom", "")
  const [dateTo, setDateToState] = useSessionState("cms:messages:dateTo", "")
  const [seriesFilter, setSeriesFilterState] = useSessionState<string | undefined>("cms:messages:seriesFilter", undefined)
  const [sortBy, setSortByState] = useSessionState<SortBy>("cms:messages:sortBy", "dateFor")
  const [sortDir, setSortDirState] = useSessionState<SortDir>("cms:messages:sortDir", "desc")

  // Debounce timer for search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  // Track current fetch to avoid stale responses
  const fetchIdRef = useRef(0)

  const fetchMessages = useCallback(async (params: {
    page: number
    pageSize: number
    search?: string
    dateFrom?: string
    dateTo?: string
    seriesId?: string
    sortBy?: string
    sortDir?: string
  }) => {
    const fetchId = ++fetchIdRef.current
    try {
      // First load: show skeleton. Subsequent loads: keep stale data visible with reloading flag.
      if (!hasLoadedRef.current) {
        setLoading(true)
      } else {
        setReloading(true)
      }
      setError(null)

      const qs = new URLSearchParams()
      qs.set("page", String(params.page))
      qs.set("pageSize", String(params.pageSize))
      if (params.search) qs.set("search", params.search)
      if (params.dateFrom) qs.set("dateFrom", params.dateFrom)
      if (params.dateTo) qs.set("dateTo", params.dateTo)
      if (params.seriesId) qs.set("seriesId", params.seriesId)
      if (params.sortBy) qs.set("sortBy", params.sortBy)
      if (params.sortDir) qs.set("sortDir", params.sortDir)

      const res = await fetch(`/api/v1/messages?${qs.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch messages")

      const json = await res.json()
      if (fetchId !== fetchIdRef.current) return // stale

      setMessages((json.data ?? []).map(apiMessageToCms))
      setPagination(json.pagination ?? {
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: 0,
      })
      hasLoadedRef.current = true
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return
      console.error("MessagesProvider fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to load messages")
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
        setReloading(false)
      }
    }
  }, [])

  // Fetch series once on mount
  useEffect(() => {
    fetch("/api/v1/series")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch series")
        return res.json()
      })
      .then((json) => {
        setSeries((json.data ?? []).map(apiSeriesToCms))
      })
      .catch((err) => {
        console.error("Series fetch error:", err)
      })
  }, [])

  // Fetch messages when page/filters/sort change
  useEffect(() => {
    fetchMessages({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
      dateFrom,
      dateTo,
      seriesId: seriesFilter,
      sortBy,
      sortDir,
    })
  }, [fetchMessages, pagination.page, pagination.pageSize, search, dateFrom, dateTo, seriesFilter, sortBy, sortDir])

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, page: 1, pageSize }))
  }, [])

  const setSearch = useCallback((value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearchState(value)
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 300)
  }, [setSearchState])

  const setDateFrom = useCallback((value: string) => {
    setDateFromState(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setDateFromState])

  const setDateTo = useCallback((value: string) => {
    setDateToState(value)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setDateToState])

  const setSeriesFilterCb = useCallback((seriesId: string | undefined) => {
    setSeriesFilterState(seriesId)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setSeriesFilterState])

  const setSort = useCallback((newSortBy: SortBy, newSortDir: SortDir) => {
    setSortByState(newSortBy)
    setSortDirState(newSortDir)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [setSortByState, setSortDirState])

  const refetch = useCallback(() => {
    fetchMessages({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search,
      dateFrom,
      dateTo,
      seriesId: seriesFilter,
      sortBy,
      sortDir,
    })
  }, [fetchMessages, pagination.page, pagination.pageSize, search, dateFrom, dateTo, seriesFilter, sortBy, sortDir])

  const fetchMessageById = useCallback(async (id: string): Promise<Message | null> => {
    // Always fetch from API to get full detail data (including relatedStudy).
    // The local messages list uses lightweight includes that omit heavy fields.
    try {
      const res = await fetch(`/api/v1/messages/${id}`)
      if (!res.ok) return null
      const json = await res.json()
      if (json.success && json.data) {
        return apiMessageToCms(json.data)
      }
      return null
    } catch {
      return null
    }
  }, [])

  const addSeries = useCallback((data: { name: string; imageUrl?: string }) => {
    const tempSeries: Series = {
      id: `s${Date.now()}`,
      name: data.name,
      imageUrl: data.imageUrl,
    }
    setSeries((prev) => [...prev, tempSeries])

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
        setSeries((prev) => prev.filter((s) => s.id !== tempSeries.id))
      })

    return tempSeries
  }, [])

  const updateSeries = useCallback((id: string, data: { name: string; imageUrl?: string }) => {
    let snapshot: Series | undefined
    setSeries((prev) => {
      snapshot = prev.find((s) => s.id === id)
      return prev.map((s) => (s.id === id ? { ...s, name: data.name, imageUrl: data.imageUrl } : s))
    })

    fetch(`/api/v1/series/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, imageUrl: data.imageUrl || null }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to update series (${res.status})`)
        return res.json()
      })
      .then((json) => {
        if (json.success && json.data) {
          setSeries((prev) =>
            prev.map((s) => (s.id === id ? apiSeriesToCms(json.data) : s))
          )
        }
      })
      .catch((err) => {
        console.error("updateSeries error:", err)
        if (snapshot) {
          setSeries((prev) => prev.map((s) => (s.id === id ? snapshot! : s)))
        }
      })
  }, [])

  const deleteSeries = useCallback((id: string) => {
    let deletedSeries: Series | undefined
    setSeries((prev) => {
      deletedSeries = prev.find((s) => s.id === id)
      return prev.filter((s) => s.id !== id)
    })
    setMessages((prev) =>
      prev.map((m) =>
        m.seriesId === id ? { ...m, seriesId: null } : m
      )
    )

    fetch(`/api/v1/series/${id}`, { method: "DELETE" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to delete series (${res.status})`)
      })
      .catch((err) => {
        console.error("deleteSeries error:", err)
        if (deletedSeries) {
          setSeries((prev) => [...prev, deletedSeries!])
        }
      })
  }, [])

  const setSeriesMessages = useCallback((seriesId: string, messageIds: string[]) => {
    let snapshot: Message[] = []
    setMessages((prev) => {
      snapshot = prev
      return prev.map((m) => {
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
    })

    fetch(`/api/v1/series/${seriesId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageIds }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to update series messages (${res.status})`)
      })
      .catch((err) => {
        console.error("setSeriesMessages error:", err)
        setMessages(snapshot)
      })
  }, [])

  const addMessage = useCallback((data: Omit<Message, "id">) => {
    const slug = data.slug || generateSlug(data.title)
    const tempMessage: Message = {
      ...data,
      id: `m${Date.now()}`,
      slug,
    }
    setMessages((prev) => [tempMessage, ...prev])
    setPagination((prev) => ({ ...prev, total: prev.total + 1 }))

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
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
      })

    return tempMessage
  }, [])

  const updateMessage = useCallback((id: string, data: Partial<Omit<Message, "id">>) => {
    let snapshot: Message | undefined
    setMessages((prev) => {
      snapshot = prev.find((m) => m.id === id)
      return prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    })

    const originalSlug = snapshot?.slug
    if (!originalSlug) return

    fetch(`/api/v1/messages/${originalSlug}`, {
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
        if (snapshot) {
          setMessages((p) => p.map((m) => (m.id === id ? snapshot! : m)))
        }
      })
  }, [])

  const deleteMessage = useCallback((id: string) => {
    let deleted: Message | undefined
    setMessages((prev) => {
      deleted = prev.find((m) => m.id === id)
      return prev.filter((m) => m.id !== id)
    })
    setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))

    if (deleted?.slug) {
      fetch(`/api/v1/messages/${deleted.slug}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to delete message (${res.status})`)
        })
        .catch((err) => {
          console.error("deleteMessage error:", err)
          if (deleted) {
            setMessages((prev) => [deleted!, ...prev])
            setPagination((prev) => ({ ...prev, total: prev.total + 1 }))
          }
        })
    }
  }, [])

  const value = useMemo(
    () => ({
      series,
      messages,
      loading,
      reloading,
      error,
      pagination,
      search,
      dateFrom,
      dateTo,
      seriesFilter,
      sortBy,
      sortDir,
      setPage,
      setPageSize,
      setSearch,
      setDateFrom,
      setDateTo,
      setSeriesFilter: setSeriesFilterCb,
      setSort,
      refetch,
      fetchMessageById,
      addSeries,
      updateSeries,
      deleteSeries,
      setSeriesMessages,
      addMessage,
      updateMessage,
      deleteMessage,
    }),
    [series, messages, loading, reloading, error, pagination, search, dateFrom, dateTo, seriesFilter, sortBy, sortDir, setPage, setPageSize, setSearch, setDateFrom, setDateTo, setSeriesFilterCb, setSort, refetch, fetchMessageById, addSeries, updateSeries, deleteSeries, setSeriesMessages, addMessage, updateMessage, deleteMessage]
  )

  return <MessagesContext value={value}>{children}</MessagesContext>
}

export function useMessages() {
  const ctx = useContext(MessagesContext)
  if (!ctx) throw new Error("useMessages must be used within MessagesProvider")
  return ctx
}
