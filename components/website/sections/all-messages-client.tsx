"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import MessageCard from "@/components/website/shared/message-card"
import FilterToolbar from "@/components/website/shared/filter-toolbar"
import { IconGrid, IconListView, IconBookOpen, IconUser, IconVideo, IconFileText, IconChevronRight, IconFolder } from "@/components/website/shared/icons"
import { useSectionTheme } from "@/components/website/shared/theme-context"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { resolveHref } from "@/lib/website/resolve-href"

interface SimpleMessage {
  id: string
  slug: string
  title: string
  videoTitle?: string | null
  passage: string
  speaker: string
  series: string
  dateFor: string
  youtubeId: string
  videoUrl: string
  thumbnailUrl: string
  duration: string
  hasVideo: boolean
  description?: string
  rawTranscript?: string | null
  liveTranscript?: string | null
}

type TabView = "all" | "series"
type ViewMode = "card" | "list"

interface MessageFilters {
  series?: string
  speaker?: string
  dateFrom?: string
  dateTo?: string
}

// Column count -> Tailwind grid class mapping
const DESKTOP_COLS: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}
const TABLET_COLS: Record<number, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
}
const MOBILE_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
}
const GAP_MAP: Record<string, string> = {
  tight: 'gap-3',
  default: 'gap-5',
  spacious: 'gap-8',
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface LayoutConfig {
  columns: { desktop: number; tablet: number; mobile: number }
  cardGap: 'tight' | 'default' | 'spacious'
  itemsPerPage: number
  showDate: boolean
  showSeriesPill: boolean
  showSpeaker: boolean
  showPassage: boolean
  showDuration: boolean
}

interface FilterMeta {
  years: number[]
  series: { name: string; count: number }[]
  speakers: { name: string; count: number }[]
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Props {
  messages: SimpleMessage[]
  layout: LayoutConfig
  colorScheme?: string
  paddingY?: string
  containerWidth?: string
  filterMeta?: FilterMeta
  pagination?: PaginationInfo
}

/**
 * Build the API query string for fetching messages with current filters.
 */
function buildApiUrl(params: {
  page: number
  pageSize: number
  filters: MessageFilters
  sortBy: string
  sortDir: 'asc' | 'desc'
  search?: string
}): string {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('pageSize', String(params.pageSize))
  sp.set('videoPublished', 'true')

  // Map sort field names: client uses "date" but API uses "dateFor"
  const sortByApi = params.sortBy === 'date' ? 'dateFor' : params.sortBy
  sp.set('sortBy', sortByApi)
  sp.set('sortDir', params.sortDir)

  if (params.filters.series) sp.set('seriesName', params.filters.series)
  if (params.filters.speaker) sp.set('speakerName', params.filters.speaker)
  if (params.filters.dateFrom) sp.set('dateFrom', params.filters.dateFrom)
  if (params.filters.dateTo) sp.set('dateTo', params.filters.dateTo)
  if (params.search) sp.set('search', params.search)

  return `/api/v1/messages?${sp.toString()}`
}

/**
 * Transform raw API response data to SimpleMessage shape.
 */
function transformApiMessages(data: Record<string, unknown>[]): SimpleMessage[] {
  return data
    .filter((m) => m.youtubeId || m.videoUrl)
    .map((m) => {
      const speaker = m.speaker as { preferredName?: string; firstName?: string; lastName?: string } | null
      const messageSeries = m.messageSeries as { series: { name: string } }[] | undefined
      return {
        id: m.id as string,
        slug: m.slug as string,
        title: m.title as string,
        videoTitle: (m.videoTitle as string) || undefined,
        passage: (m.passage as string) || '',
        speaker: speaker
          ? (speaker.preferredName
            ? `${speaker.preferredName} ${speaker.lastName}`
            : `${speaker.firstName} ${speaker.lastName}`)
          : 'Unknown',
        series: messageSeries?.[0]?.series?.name || '',
        dateFor: m.dateFor ? String(m.dateFor).split('T')[0] : '',
        youtubeId: (m.youtubeId as string) || '',
        videoUrl: (m.videoUrl as string) || '',
        thumbnailUrl: (m.thumbnailUrl as string) || (m.youtubeId ? `https://img.youtube.com/vi/${m.youtubeId}/hqdefault.jpg` : ''),
        duration: (m.duration as string) || '',
        hasVideo: m.hasVideo as boolean,
      }
    })
}

export default function AllMessagesClient({
  messages: initialMessages,
  layout,
  colorScheme = 'light',
  paddingY = 'none',
  containerWidth = 'standard',
  filterMeta,
  pagination,
}: Props) {
  const t = useSectionTheme()

  /* ---- State ---- */
  const [tab, setTab] = useState<TabView>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<MessageFilters>({})
  const [yearFilter, setYearFilter] = useState("")
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  /* ---- Server-filtered messages state ---- */
  const [messages, setMessages] = useState<SimpleMessage[]>(initialMessages)
  const [serverTotal, setServerTotal] = useState(pagination?.total ?? initialMessages.length)
  const [currentPage, setCurrentPage] = useState(pagination?.page ?? 1)
  const [isFiltering, setIsFiltering] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const pageSize = pagination?.pageSize ?? layout.itemsPerPage

  // Abort controller ref for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null)
  // Search debounce timer ref
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Content area ref for min-height preservation during filtering (prevents scroll jump)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentMinHeight, setContentMinHeight] = useState<number | undefined>()

  /**
   * Fetch filtered messages from the API. Replaces current messages (page 1).
   */
  const fetchFiltered = useCallback(async (
    newFilters: MessageFilters,
    searchText: string,
    sort: { field: string; dir: 'asc' | 'desc' },
  ) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Capture current content height to prevent scroll jump during loading
    if (contentRef.current) {
      setContentMinHeight(contentRef.current.offsetHeight)
    }
    setIsFiltering(true)

    try {
      const url = buildApiUrl({
        page: 1,
        pageSize,
        filters: newFilters,
        sortBy: sort.field,
        sortDir: sort.dir,
        search: searchText || undefined,
      })
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      if (!json.success) throw new Error('API returned failure')

      const transformed = transformApiMessages(json.data ?? [])
      // Small delay so the fade-out is visible before swapping content
      await new Promise((r) => setTimeout(r, 150))
      setMessages(transformed)
      setServerTotal(json.pagination?.total ?? transformed.length)
      setCurrentPage(1)
      // Let React render new content before fading in
      requestAnimationFrame(() => {
        setIsFiltering(false)
        setContentMinHeight(undefined)
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('[AllMessagesClient] fetchFiltered error:', err)
      if (!controller.signal.aborted) {
        setIsFiltering(false)
        setContentMinHeight(undefined)
      }
    }
  }, [pageSize])

  /**
   * Load more: fetch the next page with the same filters applied, appending results.
   */
  const loadMore = useCallback(async () => {
    const nextPage = currentPage + 1
    setIsLoadingMore(true)

    try {
      const url = buildApiUrl({
        page: nextPage,
        pageSize,
        filters,
        sortBy: sortField,
        sortDir: sortDirection,
        search: search || undefined,
      })
      const res = await fetch(url)
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      if (!json.success) throw new Error('API returned failure')

      const transformed = transformApiMessages(json.data ?? [])
      if (transformed.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const unique = transformed.filter((m) => !existingIds.has(m.id))
          return [...prev, ...unique]
        })
        setCurrentPage(nextPage)
      }
    } catch (err) {
      console.error('[AllMessagesClient] loadMore error:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [currentPage, pageSize, filters, sortField, sortDirection, search])

  /**
   * Trigger an API fetch when discrete filters (series, speaker, year, dateFrom, dateTo)
   * or sort changes. Search has its own debounced handler.
   */
  const triggerFilterFetch = useCallback((
    newFilters: MessageFilters,
    searchText: string,
    sort: { field: string; dir: 'asc' | 'desc' },
  ) => {
    // If no filters and no search, reset to initial data
    const hasFilters = !!(newFilters.series || newFilters.speaker || newFilters.dateFrom || newFilters.dateTo || searchText)
    const isDefaultSort = sort.field === 'date' && sort.dir === 'desc'

    if (!hasFilters && isDefaultSort) {
      // Reset to server-rendered initial data
      if (abortRef.current) abortRef.current.abort()
      setMessages(initialMessages)
      setServerTotal(pagination?.total ?? initialMessages.length)
      setCurrentPage(pagination?.page ?? 1)
      setIsFiltering(false)
      setContentMinHeight(undefined)
      return
    }

    fetchFiltered(newFilters, searchText, sort)
  }, [fetchFiltered, initialMessages, pagination])

  /* ---- Dropdown/filter data from filterMeta ---- */
  const seriesList = useMemo(() => {
    if (!filterMeta?.series) return []
    return filterMeta.series.map((s) => ({ name: s.name, count: s.count, lastDate: '' }))
  }, [filterMeta])

  const speakerList = useMemo(() => {
    if (filterMeta?.speakers) {
      return filterMeta.speakers.map((s) => s.name).sort()
    }
    return []
  }, [filterMeta])

  const seriesOptions = useMemo(() => {
    if (filterMeta?.series) {
      return filterMeta.series.map((s) => ({ value: s.name, label: s.name }))
    }
    return []
  }, [filterMeta])

  const speakerOptions = useMemo(
    () => speakerList.map((s) => ({ value: s, label: s })),
    [speakerList],
  )

  const availableYears = useMemo(() => {
    if (filterMeta?.years) return filterMeta.years
    return []
  }, [filterMeta])

  /* ---- Filter/sort change handlers ---- */
  function updateFilter<K extends keyof MessageFilters>(
    key: K,
    value: MessageFilters[K],
  ) {
    const newFilters = { ...filters, [key]: value }
    if (key === "dateFrom" || key === "dateTo") setYearFilter("")
    setFilters(newFilters)
    triggerFilterFetch(newFilters, search, { field: sortField, dir: sortDirection })
  }

  function handleYearChange(year: string) {
    setYearFilter(year)
    let newFilters: MessageFilters
    if (year && year !== "all") {
      newFilters = { ...filters, dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` }
    } else {
      newFilters = { ...filters, dateFrom: undefined, dateTo: undefined }
    }
    setFilters(newFilters)
    triggerFilterFetch(newFilters, search, { field: sortField, dir: sortDirection })
  }

  function handleSortChange(value: string, dir: 'asc' | 'desc') {
    setSortField(value)
    setSortDirection(dir)
    triggerFilterFetch(filters, search, { field: value, dir })
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    // Debounce search by 300ms
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      triggerFilterFetch(filters, value, { field: sortField, dir: sortDirection })
    }, 300)
  }

  function handleReset() {
    setSearch("")
    setFilters({})
    setYearFilter("")
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    // Reset to initial server-rendered data
    if (abortRef.current) abortRef.current.abort()
    setMessages(initialMessages)
    setServerTotal(pagination?.total ?? initialMessages.length)
    setCurrentPage(pagination?.page ?? 1)
    setIsFiltering(false)
    setContentMinHeight(undefined)
  }

  /** Switch to "all" tab with a specific filter pre-applied */
  function switchToAllWithFilter(key: keyof MessageFilters, value: string) {
    const newFilters: MessageFilters = { [key]: value }
    setTab("all")
    setFilters(newFilters)
    setYearFilter("")
    setSearch("")
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    triggerFilterFetch(newFilters, "", { field: sortField, dir: sortDirection })
  }

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const hasMore = messages.length < serverTotal

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All Messages" },
    { key: "series", label: "Series" },
  ]

  return (
    <SectionContainer
      colorScheme={colorScheme as 'light' | 'dark' | 'brand' | 'muted'}
      paddingY={paddingY as 'none' | 'compact' | 'default' | 'spacious'}
      containerWidth={containerWidth as 'standard' | 'narrow' | 'full'}
      className="pb-24 lg:pb-30"
    >
      {/* Filter toolbar */}
      <FilterToolbar
        tabs={{
          options: tabs,
          active: tab,
          onChange: (key) => {
            setTab(key as TabView)
            setFilters({})
            setSearch("")
            setYearFilter("")
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
            // Reset to initial data when switching tabs
            if (abortRef.current) abortRef.current.abort()
            setMessages(initialMessages)
            setServerTotal(pagination?.total ?? initialMessages.length)
            setCurrentPage(pagination?.page ?? 1)
            setIsFiltering(false)
          },
        }}
        viewModes={tab === "all" ? {
          options: [
            { value: "card", label: "Card", icon: <IconGrid className="size-4" /> },
            { value: "list", label: "List", icon: <IconListView className="size-4" /> },
          ],
          active: viewMode,
          onChange: (v) => setViewMode(v as ViewMode),
        } : undefined}
        search={tab === "all" ? {
          value: search,
          onChange: handleSearchChange,
          placeholder: "Search messages, speakers, passages...",
        } : undefined}
        filters={tab === "all" ? [
          ...(seriesOptions.length > 0
            ? [{
                id: "series",
                label: "Series",
                value: filters.series ?? "all",
                options: [
                  { value: "all", label: "All Series" },
                  ...seriesOptions,
                ],
                onChange: (v: string) =>
                  updateFilter("series", v === "all" ? undefined : v),
              }]
            : []),
          ...(speakerOptions.length > 0
            ? [{
                id: "speaker",
                label: "Speaker",
                value: filters.speaker ?? "all",
                options: [
                  { value: "all", label: "All Speakers" },
                  ...speakerOptions,
                ],
                onChange: (v: string) =>
                  updateFilter("speaker", v === "all" ? undefined : v),
              }]
            : []),
        ] : undefined}
        yearFilter={tab === "all" ? {
          value: yearFilter,
          years: availableYears,
          onChange: handleYearChange,
        } : undefined}
        dateRange={tab === "all" ? {
          fromLabel: "From",
          toLabel: "To",
          fromValue: filters.dateFrom ?? "",
          toValue: filters.dateTo ?? "",
          onFromChange: (v) => updateFilter("dateFrom", v || undefined),
          onToChange: (v) => updateFilter("dateTo", v || undefined),
        } : undefined}
        sort={tab === "all" ? {
          options: [
            { value: "date", label: "Date (Newest)", direction: "desc" },
            { value: "date", label: "Date (Oldest)", direction: "asc" },
            { value: "title", label: "Title (A-Z)", direction: "asc" },
            { value: "title", label: "Title (Z-A)", direction: "desc" },
            { value: "speaker", label: "Speaker (A-Z)", direction: "asc" },
            { value: "speaker", label: "Speaker (Z-A)", direction: "desc" },
          ],
          active: sortField,
          direction: sortDirection,
          onChange: handleSortChange,
        } : undefined}
        onReset={tab === "all" ? handleReset : undefined}
        className="mb-8"
      />

      {/* ---- All Messages Tab ---- */}
      {tab === "all" && (
        <>
          <div ref={contentRef} className="relative" style={{ minHeight: contentMinHeight ? `${contentMinHeight}px` : undefined }}>
            <div className={cn("transition-opacity duration-500 ease-in-out", isFiltering ? "opacity-30 pointer-events-none" : "opacity-100")}>
              {messages.length === 0 && !isFiltering ? (
                <div className="flex flex-col items-center py-20">
                  <p className={cn("text-body-1", t.textSecondary)}>
                    No messages found matching your criteria.
                  </p>
                  <button
                    onClick={handleReset}
                    className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : viewMode === "card" ? (
                <CardGrid messages={messages} columns={layout.columns} cardGap={layout.cardGap} />
              ) : (
                <MessageListView messages={messages} t={t} />
              )}
            </div>
          </div>

          {/* Load more */}
          {!isFiltering && hasMore && (
            <>
              {isLoadingMore && (
                <div className={`grid ${MOBILE_COLS[layout.columns.mobile] ?? 'grid-cols-1'} ${TABLET_COLS[layout.columns.tablet] ?? 'md:grid-cols-2'} ${DESKTOP_COLS[layout.columns.desktop] ?? 'lg:grid-cols-3'} ${GAP_MAP[layout.cardGap] ?? 'gap-5'} mt-5`}>
                  {Array.from({ length: layout.columns.desktop }).map((_, i) => (
                    <MessageCardSkeleton key={i} />
                  ))}
                </div>
              )}
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full border px-8 py-4 text-button-1 transition-colors",
                    t.btnOutlineBorder, t.btnOutlineText,
                    isLoadingMore && "opacity-60 cursor-not-allowed",
                  )}
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "size-4 border-2 border-current border-t-transparent rounded-full animate-spin",
                      )} />
                      Loading...
                    </span>
                  ) : (
                    "Load More Messages"
                  )}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ---- Series Tab ---- */}
      {tab === "series" && (
        <>
          <h2 className={cn("text-h2 mb-8", t.textPrimary)}>Series</h2>
          <div className={`grid ${MOBILE_COLS[layout.columns.mobile] ?? 'grid-cols-1'} ${TABLET_COLS[layout.columns.tablet] ?? 'md:grid-cols-2'} ${DESKTOP_COLS[layout.columns.desktop] ?? 'lg:grid-cols-3'} ${GAP_MAP[layout.cardGap] ?? 'gap-5'}`}>
            {seriesList.map((s) => (
              <button
                key={s.name}
                onClick={() => switchToAllWithFilter("series", s.name)}
                className={cn(
                  "group relative rounded-[20px] p-7 min-h-[180px] flex flex-col text-left cursor-pointer transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]",
                  t.surfaceBgSubtle,
                )}
              >
                <div className="mb-4">
                  <div className={cn("inline-flex items-center p-[8px] rounded-[8px]", t.surfaceBg)}>
                    <IconFolder className={cn("size-[16px]", t.textSecondary)} />
                  </div>
                </div>
                <h3 className={cn("text-[20px] font-medium tracking-[-0.4px] mb-2", t.textPrimary)}>
                  {s.name}
                </h3>
                <p className={cn("text-[13px] mb-4", t.textMuted)}>
                  {s.count} {s.count === 1 ? "Message" : "Messages"}
                </p>
                <p className="mt-auto text-[12px] font-semibold text-accent-blue tracking-[0.24px] uppercase">
                  VIEW COLLECTION
                </p>
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 pointer-events-none rounded-[20px] border shadow-[0px_4px_12px_0px_rgba(0,0,0,0.04)] transition-shadow group-hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]",
                    t.cardBorder,
                  )}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </SectionContainer>
  )
}

/* ---- Card Grid ---- */

function CardGrid({
  messages,
  columns,
  cardGap,
}: {
  messages: SimpleMessage[]
  columns: { desktop: number; tablet: number; mobile: number }
  cardGap: string
}) {
  const gridClass = [
    MOBILE_COLS[columns.mobile] ?? 'grid-cols-1',
    TABLET_COLS[columns.tablet] ?? 'md:grid-cols-2',
    DESKTOP_COLS[columns.desktop] ?? 'lg:grid-cols-3',
    GAP_MAP[cardGap] ?? 'gap-5',
  ].join(' ')

  return (
    <div className={`grid ${gridClass}`}>
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
    </div>
  )
}

/* ---- Skeleton Components ---- */

function MessageCardSkeleton() {
  return (
    <div className="rounded-[24px] p-3 bg-muted/30">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video w-full rounded-[16px]" />
      {/* Content area */}
      <div className="pt-5 px-2 pb-3 space-y-3">
        {/* Date + series pill row */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-6 w-20 rounded-[8px]" />
        </div>
        {/* Title */}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        {/* Speaker + passage */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageListItemSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 py-5 -mx-4 px-4">
      {/* Mini thumbnail -- desktop only */}
      <Skeleton className="w-[120px] aspect-video rounded-[8px] shrink-0 hidden sm:block" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-20 rounded-[6px]" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <Skeleton className="h-5 w-5 rounded shrink-0 hidden sm:block" />
    </div>
  )
}

function MessageCardSkeletonGrid({
  columns,
  cardGap,
}: {
  columns: { desktop: number; tablet: number; mobile: number }
  cardGap: string
}) {
  const gridClass = [
    MOBILE_COLS[columns.mobile] ?? 'grid-cols-1',
    TABLET_COLS[columns.tablet] ?? 'md:grid-cols-2',
    DESKTOP_COLS[columns.desktop] ?? 'lg:grid-cols-3',
    GAP_MAP[cardGap] ?? 'gap-5',
  ].join(' ')

  return (
    <div className={`grid ${gridClass}`}>
      {Array.from({ length: columns.desktop * 2 }).map((_, i) => (
        <MessageCardSkeleton key={i} />
      ))}
    </div>
  )
}

function MessageListSkeletonGrid() {
  return (
    <div className="flex flex-col divide-y divide-muted">
      {Array.from({ length: 8 }).map((_, i) => (
        <MessageListItemSkeleton key={i} />
      ))}
    </div>
  )
}

/* ---- List View ---- */

function MessageListView({ messages, t }: { messages: SimpleMessage[]; t: import("@/components/website/shared/theme-tokens").ThemeTokens }) {
  return (
    <div className={cn("flex flex-col divide-y", t.borderSubtle)}>
      {messages.map((message) => (
        <Link
          key={message.id}
          href={resolveHref(`/messages/${message.slug}`)}
          className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 py-5 transition-colors -mx-4 px-4 rounded-[12px]"
        >
          {/* Mini thumbnail -- desktop only */}
          <div className="relative w-[120px] aspect-video rounded-[8px] overflow-hidden bg-black-1 shrink-0 hidden sm:block">
            {message.hasVideo && message.youtubeId ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://img.youtube.com/vi/${message.youtubeId}/mqdefault.jpg`}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center justify-center rounded-full bg-white-0/80 size-7">
                    <svg viewBox="0 0 24 24" fill="none" className="size-3 ml-0.5 text-black-1">
                      <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </>
            ) : message.hasVideo ? (
              <div className="absolute inset-0 bg-gradient-to-br from-white-2 to-white-1-5 flex items-center justify-center">
                <div className="flex items-center justify-center rounded-full bg-white-0/80 size-7">
                  <svg viewBox="0 0 24 24" fill="none" className="size-3 ml-0.5 text-black-1">
                    <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-white-2 to-white-1-5 flex items-center justify-center">
                <IconBookOpen className="size-5 text-black-3/40" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {message.series && (
                <span className={cn("px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium tracking-[0.22px] shrink-0", t.surfaceBg, t.textMuted)}>
                  {message.series}
                </span>
              )}
              <span className={cn("text-[13px] whitespace-nowrap", t.textMuted)}>
                {formatDate(message.dateFor)}
              </span>
            </div>
            <h3 className={cn("text-[18px] font-medium mb-1 sm:truncate", t.textPrimary)}>
              {message.videoTitle || message.title}
            </h3>
            {message.videoTitle && message.videoTitle !== message.title && (
              <p className={cn("text-[13px] mb-1 sm:truncate", t.textMuted)}>
                {message.title}
              </p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <div className="flex items-center gap-2">
                <IconUser className={cn("size-[14px] shrink-0", t.textMuted)} />
                <span className={cn("text-[14px]", t.textMuted)}>{message.speaker}</span>
              </div>
              {message.passage && (
                <div className="flex items-center gap-2">
                  <IconBookOpen className={cn("size-[14px] shrink-0", t.textMuted)} />
                  <span className={cn("text-[14px]", t.textMuted)}>{message.passage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Icons + arrow */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="flex gap-1.5">
              <div className={cn("p-[6px] rounded-[6px]", t.surfaceBg)}>
                <IconVideo className={cn("size-[14px]", t.textSecondary)} />
              </div>
              {message.liveTranscript && (
                <div className={cn("p-[6px] rounded-[6px]", t.surfaceBg)}>
                  <IconFileText className={cn("size-[14px]", t.textSecondary)} />
                </div>
              )}
            </div>
            <IconChevronRight className={cn("size-5 transition-transform group-hover:translate-x-1", t.textMuted)} />
          </div>
        </Link>
      ))}
    </div>
  )
}
