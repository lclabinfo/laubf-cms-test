"use client"

import { useState, useMemo, useCallback, useEffect, useRef, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SectionContainer from "@/components/website/shared/section-container"
import EventGridCard from "@/components/website/shared/event-grid-card"
import EventListItem from "@/components/website/shared/event-list-item"
import EventCalendarGrid from "@/components/website/shared/event-calendar-grid"
import FilterToolbar from "@/components/website/shared/filter-toolbar"
import { IconGrid, IconListView, IconCalendar } from "@/components/website/shared/icons"
import { Skeleton } from "@/components/ui/skeleton"
import { resolveHref } from "@/lib/website/resolve-href"
import { formatTimeRange } from "@/lib/website/format-time"

interface SimpleEvent {
  id: string
  slug: string
  title: string
  description: string
  type: "event" | "meeting" | "program"
  dateStart: string
  dateEnd: string | null
  timeStart: string
  timeEnd: string
  location: string
  locationDetail: string
  ministry: string
  campus: string
  thumbnailUrl: string
  isFeatured: boolean
  isRecurring: boolean
  recurrenceSchedule: string
}

type TabView = "event" | "meeting" | "program"
type ViewMode = "card" | "list" | "calendar"

interface EventFilters {
  search?: string
  type?: string
  ministry?: string
  campus?: string
  dateFrom?: string
  dateTo?: string
}

const VALID_TABS: TabView[] = ["event", "meeting", "program"]
const PAGE_SIZE = 48

interface FilterMeta {
  years: number[]
  ministries: string[]
  campuses: string[]
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Props {
  events: SimpleEvent[]
  heading: string
  filterMeta?: FilterMeta
  pagination?: PaginationInfo
}

/** Map UI sort field to API param */
function mapSortField(field: string): string {
  return field === "date" ? "dateStart" : field
}

/** Build API query string for events */
function buildApiUrl(params: {
  page: number
  pageSize: number
  type?: string
  search?: string
  ministryName?: string
  campusName?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortDir?: string
}): string {
  const qs = new URLSearchParams()
  qs.set("page", String(params.page))
  qs.set("pageSize", String(params.pageSize))
  if (params.type) qs.set("type", params.type.toUpperCase())
  if (params.search) qs.set("search", params.search)
  if (params.ministryName) qs.set("ministryName", params.ministryName)
  if (params.campusName) qs.set("campusName", params.campusName)
  if (params.dateFrom) qs.set("dateFrom", params.dateFrom)
  if (params.dateTo) qs.set("dateTo", params.dateTo)
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  if (params.sortDir) qs.set("sortDir", params.sortDir)
  return `/api/v1/events?${qs.toString()}`
}

/** Fetch events from the API and transform to SimpleEvent shape */
async function fetchEvents(url: string): Promise<{ events: SimpleEvent[]; pagination: PaginationInfo }> {
  const res = await fetch(url)
  if (!res.ok) return { events: [], pagination: { total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 } }
  const json = await res.json()
  if (!json.success || !json.data) return { events: [], pagination: { total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 } }
  const events: SimpleEvent[] = json.data.map((e: Record<string, unknown>) => {
    const ministry = e.ministry as { name?: string } | null
    const campus = e.campus as { name?: string } | null
    const dateStartRaw = e.dateStart ? String(e.dateStart) : ""
    const dateEndRaw = e.dateEnd ? String(e.dateEnd) : null
    return {
      id: e.id as string,
      slug: e.slug as string,
      title: e.title as string,
      description: (e.description as string) || "",
      type: (e.type as string).toLowerCase() as "event" | "meeting" | "program",
      dateStart: dateStartRaw.length > 10 ? dateStartRaw.slice(0, 10) : dateStartRaw,
      dateEnd: dateEndRaw ? (dateEndRaw.length > 10 ? dateEndRaw.slice(0, 10) : dateEndRaw) : null,
      timeStart: (e.startTime as string) || "",
      timeEnd: (e.endTime as string) || "",
      location: (e.location as string) || "",
      locationDetail: (e.address as string) || "",
      ministry: ministry?.name || "",
      campus: campus?.name || "",
      thumbnailUrl: (e.coverImage as string) || "",
      isFeatured: e.isFeatured as boolean,
      isRecurring: e.isRecurring as boolean,
      recurrenceSchedule: (e.recurrenceSchedule as string) || "",
    }
  })
  return { events, pagination: json.pagination }
}

export default function AllEventsClient({ events: initialEvents, filterMeta, pagination: initialPagination }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  /* -- Derive tab from URL so navbar clicks always sync -- */
  const urlTab = searchParams.get("tab")
  const activeTab: TabView =
    VALID_TABS.includes(urlTab as TabView) ? (urlTab as TabView) : "event"

  /* -- State -- */
  const [tab, setTab] = useState<TabView>(activeTab)
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<EventFilters>({})
  const [yearFilter, setYearFilter] = useState("")
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  /* -- Server-side filtered data -- */
  const [events, setEvents] = useState<SimpleEvent[]>(initialEvents)
  const [totalCount, setTotalCount] = useState(initialPagination?.total ?? initialEvents.length)
  const [currentPage, setCurrentPage] = useState(initialPagination?.page ?? 1)
  const [isFiltering, startFiltering] = useTransition()
  const [isLoadingMore, startLoadingMore] = useTransition()
  // Content area ref for min-height preservation during filtering (prevents scroll jump)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentMinHeight, setContentMinHeight] = useState<number | undefined>()

  /* -- Sync tab when URL changes (e.g. navbar click while already on page) -- */
  useEffect(() => {
    if (activeTab !== tab) {
      setTab(activeTab)
      setFilters({})
      setYearFilter("")
      setSearch("")
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  /* -- URL sync -- */
  const updateTabInUrl = useCallback(
    (newTab: TabView) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", newTab)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router],
  )

  /* -- Filter meta for dropdowns (from server, complete) -- */
  const ministryOptions = useMemo(() => {
    if (filterMeta?.ministries) return filterMeta.ministries
    const ministries = new Set<string>()
    initialEvents.forEach((e) => { if (e.ministry) ministries.add(e.ministry) })
    return Array.from(ministries).sort()
  }, [initialEvents, filterMeta])

  const campusOptions = useMemo(() => {
    if (filterMeta?.campuses) return filterMeta.campuses
    const campuses = new Set<string>()
    initialEvents.forEach((e) => { if (e.campus) campuses.add(e.campus) })
    return Array.from(campuses).sort()
  }, [initialEvents, filterMeta])

  const availableYears = useMemo(() => {
    if (filterMeta?.years) return filterMeta.years
    const years = new Set<number>()
    initialEvents.forEach((e) => {
      const y = parseInt(e.dateStart.slice(0, 4), 10)
      if (!isNaN(y)) years.add(y)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [initialEvents, filterMeta])

  /* -- Debounced search -- */
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [search])

  /* -- Re-fetch when filters change -- */
  const prevFiltersRef = useRef("")
  useEffect(() => {
    const filterKey = JSON.stringify({
      search: debouncedSearch,
      tab,
      ministry: filters.ministry,
      campus: filters.campus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortField,
      sortDirection,
    })
    if (filterKey === prevFiltersRef.current) return
    prevFiltersRef.current = filterKey

    // On initial render with no active filters and matching tab, use SSR data
    const isDefaultFilters = !debouncedSearch && !filters.ministry && !filters.campus &&
      !filters.dateFrom && !filters.dateTo && sortField === "date" && sortDirection === "desc"
    if (isDefaultFilters && tab === activeTab) {
      // Filter initial events by tab type client-side (they were loaded with all types)
      const tabEvents = initialEvents.filter((e) => e.type === tab)
      setEvents(tabEvents)
      setTotalCount(tabEvents.length)
      setCurrentPage(1)
      return
    }

    const url = buildApiUrl({
      page: 1,
      pageSize: PAGE_SIZE,
      type: tab,
      search: debouncedSearch || undefined,
      ministryName: filters.ministry,
      campusName: filters.campus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortBy: mapSortField(sortField),
      sortDir: sortDirection,
    })

    // Capture current content height to prevent scroll jump during loading
    if (contentRef.current) {
      setContentMinHeight(contentRef.current.offsetHeight)
    }
    startFiltering(async () => {
      const result = await fetchEvents(url)
      // Small delay so the fade-out is visible before swapping content
      await new Promise((r) => setTimeout(r, 150))
      setEvents(result.events)
      setTotalCount(result.pagination.total)
      setCurrentPage(1)
      requestAnimationFrame(() => setContentMinHeight(undefined))
    })
  }, [debouncedSearch, tab, filters, sortField, sortDirection, initialEvents, activeTab])

  /* -- Load More -- */
  const hasMore = events.length < totalCount

  function handleLoadMore() {
    const nextPage = currentPage + 1
    const url = buildApiUrl({
      page: nextPage,
      pageSize: PAGE_SIZE,
      type: tab,
      search: debouncedSearch || undefined,
      ministryName: filters.ministry,
      campusName: filters.campus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      sortBy: mapSortField(sortField),
      sortDir: sortDirection,
    })
    startLoadingMore(async () => {
      const result = await fetchEvents(url)
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id))
        const unique = result.events.filter((e) => !existingIds.has(e.id))
        return [...prev, ...unique]
      })
      setCurrentPage(nextPage)
      setTotalCount(result.pagination.total)
    })
  }

  function updateFilter<K extends keyof EventFilters>(
    key: K,
    value: EventFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    if (key === "dateFrom" || key === "dateTo") setYearFilter("")
  }

  function handleYearChange(year: string) {
    setYearFilter(year)
    if (year && year !== "all") {
      setFilters((prev) => ({ ...prev, dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` }))
    } else {
      setFilters((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined }))
    }
  }

  const tabs: { key: TabView; label: string }[] = [
    { key: "event", label: "Events" },
    { key: "meeting", label: "Meetings" },
    { key: "program", label: "Programs" },
  ]

  return (
    <SectionContainer colorScheme="light" paddingY="none" className="pb-24 lg:pb-30">
      {/* Filter toolbar */}
      <FilterToolbar
        tabs={{
          options: tabs,
          active: tab,
          onChange: (key) => {
            const newTab = key as TabView
            setTab(newTab)
            updateTabInUrl(newTab)
            setFilters({})
            setSearch("")
            setYearFilter("")
          },
        }}
        viewModes={{
          options: [
            { value: "card", label: "Card", icon: <IconGrid className="size-4" /> },
            { value: "list", label: "List", icon: <IconListView className="size-4" /> },
            { value: "calendar", label: "Calendar", icon: <IconCalendar className="size-4" /> },
          ],
          active: viewMode,
          onChange: (v) => setViewMode(v as ViewMode),
        }}
        search={{
          value: search,
          onChange: (v) => setSearch(v),
          placeholder: "Search events, meetings, programs...",
        }}
        filters={[
          ...(ministryOptions.length > 0
            ? [
                {
                  id: "ministry",
                  label: "Ministry",
                  value: filters.ministry ?? "all",
                  options: [
                    { value: "all", label: "All Ministries" },
                    ...ministryOptions.map((m) => ({ value: m, label: m })),
                  ],
                  onChange: (v: string) =>
                    updateFilter("ministry", v === "all" ? undefined : v),
                },
              ]
            : []),
          ...(campusOptions.length > 0
            ? [
                {
                  id: "campus",
                  label: "Campus",
                  value: filters.campus ?? "all",
                  options: [
                    { value: "all", label: "All Campuses" },
                    ...campusOptions.map((c) => ({ value: c, label: c })),
                  ],
                  onChange: (v: string) =>
                    updateFilter("campus", v === "all" ? undefined : v),
                },
              ]
            : []),
        ]}
        yearFilter={{
          value: yearFilter,
          years: availableYears,
          onChange: handleYearChange,
        }}
        dateRange={{
          fromLabel: "From",
          toLabel: "To",
          fromValue: filters.dateFrom ?? "",
          toValue: filters.dateTo ?? "",
          onFromChange: (v) => updateFilter("dateFrom", v || undefined),
          onToChange: (v) => updateFilter("dateTo", v || undefined),
        }}
        sort={{
          options: [
            { value: "date", label: "Date (Newest)", direction: "desc" },
            { value: "date", label: "Date (Oldest)", direction: "asc" },
            { value: "title", label: "Title (A-Z)", direction: "asc" },
            { value: "title", label: "Title (Z-A)", direction: "desc" },
          ],
          active: sortField,
          direction: sortDirection,
          onChange: (value, dir) => {
            setSortField(value)
            setSortDirection(dir)
          },
        }}
        onReset={() => {
          setSearch("")
          setFilters({})
          setYearFilter("")
          setSortField("date")
          setSortDirection("desc")
        }}
        className="mb-8"
      />

      {/* Events display with min-height preservation to prevent scroll jump */}
      <div ref={contentRef} className="relative" style={{ minHeight: contentMinHeight ? `${contentMinHeight}px` : undefined }}>
        <div className={`transition-opacity duration-500 ease-in-out ${isFiltering ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
          {events.length === 0 && !isFiltering ? (
            <div className="flex flex-col items-center py-20">
              <p className="text-body-1 text-black-2">
                No events found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearch("")
                  setFilters({})
                  setYearFilter("")
                  setSortField("date")
                  setSortDirection("desc")
                }}
                className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "card" ? (
            <CardView events={events} />
          ) : viewMode === "list" ? (
            <ListView events={events} />
          ) : (
            <CalendarView events={events} />
          )}
        </div>
      </div>

      {/* Load more (hidden in calendar view since calendar shows all events for the month) */}
      {hasMore && viewMode !== "calendar" && !isFiltering && (
        <>
          {isLoadingMore && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-10">
            <button
              disabled={isLoadingMore}
              onClick={handleLoadMore}
              className="inline-flex items-center justify-center rounded-full border border-black-1/30 px-8 py-4 text-button-1 text-black-1 transition-colors hover:bg-black-1 hover:text-white-1 disabled:opacity-50"
            >
              {isLoadingMore ? "Loading..." : "Load More Events"}
            </button>
          </div>
        </>
      )}
    </SectionContainer>
  )
}

/* -- Skeleton Components -- */

function EventCardSkeleton() {
  return (
    <div className="flex flex-col rounded-[20px] border border-muted overflow-clip h-full">
      {/* Image area */}
      <Skeleton className="h-[160px] w-full rounded-none" />
      {/* Details */}
      <div className="flex flex-col gap-3 pt-[18px] pb-5 px-5 lg:px-7 flex-1">
        {/* Type badge + title */}
        <div className="flex flex-col gap-3 items-start">
          <Skeleton className="h-6 w-16 rounded-lg" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        {/* Time & location */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3.5 w-40" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded-full" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EventListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-muted">
      <Skeleton className="size-12 rounded-[8px] shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-14 rounded-lg shrink-0" />
    </div>
  )
}

function EventCardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

function EventListSkeletonGrid() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 8 }).map((_, i) => (
        <EventListItemSkeleton key={i} />
      ))}
    </div>
  )
}

/* -- Card View -- */

function CardView({ events }: { events: SimpleEvent[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((event) => (
        <EventGridCard
          key={event.id}
          event={{
            slug: event.slug,
            title: event.title,
            type: event.type,
            dateStart: toDateKey(event.dateStart),
            dateEnd: event.dateEnd ? toDateKey(event.dateEnd) : undefined,
            timeStart: event.timeStart,
            location: event.location,
            thumbnailUrl: event.thumbnailUrl || undefined,
            isFeatured: event.isFeatured,
            isRecurring: event.isRecurring,
            recurrenceSchedule: event.recurrenceSchedule,
          }}
        />
      ))}
    </div>
  )
}

/* -- List View -- */

function ListView({ events }: { events: SimpleEvent[] }) {
  return (
    <div className="flex flex-col">
      {events.map((event) => (
        <EventListItem
          key={event.id}
          data={{
            title: event.title,
            dateStart: new Date(event.dateStart),
            dateEnd: event.dateEnd ? new Date(event.dateEnd) : undefined,
            time: formatTimeRange(event.timeStart, event.timeEnd),
            type: event.type,
            href: resolveHref(`/events/${event.slug}`),
          }}
        />
      ))}
    </div>
  )
}

/* -- Calendar View -- */

function CalendarView({ events }: { events: SimpleEvent[] }) {
  const calendarEvents = events.map((event) => ({
    slug: event.slug,
    title: event.title,
    dateStart: toDateKey(event.dateStart),
    dateEnd: event.dateEnd ? toDateKey(event.dateEnd) : undefined,
    time: formatTimeRange(event.timeStart, event.timeEnd),
    type: event.type,
    location: event.location || undefined,
    description: event.description || undefined,
  }))

  return <EventCalendarGrid events={calendarEvents} />
}

/* -- Helpers -- */

/** Convert ISO date string to YYYY-MM-DD key */
function toDateKey(dateStr: string): string {
  if (dateStr.length === 10) return dateStr // already YYYY-MM-DD
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
