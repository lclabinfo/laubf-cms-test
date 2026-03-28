"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import BibleStudyCard from "@/components/website/shared/bible-study-card"
import FilterToolbar from "@/components/website/shared/filter-toolbar"
import { IconGrid, IconListView, IconBookOpen, IconFileText, IconHelpCircle, IconVideo, IconChevronRight, IconFolder } from "@/components/website/shared/icons"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { resolveHref } from "@/lib/website/resolve-href"
import { bibleBookLabel, bibleBookFromLabel } from "@/lib/website/bible-book-labels"

interface BibleStudy {
  id: string
  slug: string
  title: string
  passage: string
  series: string
  dateFor: string
  hasQuestions: boolean
  hasAnswers: boolean
  hasTranscript: boolean
  book?: string
}

type TabView = "all" | "series" | "books"
type ViewMode = "card" | "list"

interface BibleStudyFilters {
  series?: string
  seriesId?: string
  book?: string
  dateFrom?: string
  dateTo?: string
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PAGE_SIZE = 50

/* ---- Bible books data for Books tab ---- */

interface BibleBookInfo {
  name: string
  chapters: number
  testament: "old" | "new"
}

const BIBLE_BOOKS: BibleBookInfo[] = [
  // Old Testament
  { name: "Genesis", chapters: 50, testament: "old" },
  { name: "Exodus", chapters: 40, testament: "old" },
  { name: "Leviticus", chapters: 27, testament: "old" },
  { name: "Numbers", chapters: 36, testament: "old" },
  { name: "Deuteronomy", chapters: 34, testament: "old" },
  { name: "Joshua", chapters: 24, testament: "old" },
  { name: "Judges", chapters: 21, testament: "old" },
  { name: "Ruth", chapters: 4, testament: "old" },
  { name: "1 Samuel", chapters: 31, testament: "old" },
  { name: "2 Samuel", chapters: 24, testament: "old" },
  { name: "1 Kings", chapters: 22, testament: "old" },
  { name: "2 Kings", chapters: 25, testament: "old" },
  { name: "1 Chronicles", chapters: 29, testament: "old" },
  { name: "2 Chronicles", chapters: 36, testament: "old" },
  { name: "Ezra", chapters: 10, testament: "old" },
  { name: "Nehemiah", chapters: 13, testament: "old" },
  { name: "Esther", chapters: 10, testament: "old" },
  { name: "Job", chapters: 42, testament: "old" },
  { name: "Psalms", chapters: 150, testament: "old" },
  { name: "Proverbs", chapters: 31, testament: "old" },
  { name: "Ecclesiastes", chapters: 12, testament: "old" },
  { name: "Song of Solomon", chapters: 8, testament: "old" },
  { name: "Isaiah", chapters: 66, testament: "old" },
  { name: "Jeremiah", chapters: 52, testament: "old" },
  { name: "Lamentations", chapters: 5, testament: "old" },
  { name: "Ezekiel", chapters: 48, testament: "old" },
  { name: "Daniel", chapters: 12, testament: "old" },
  { name: "Hosea", chapters: 14, testament: "old" },
  { name: "Joel", chapters: 3, testament: "old" },
  { name: "Amos", chapters: 9, testament: "old" },
  { name: "Obadiah", chapters: 1, testament: "old" },
  { name: "Jonah", chapters: 4, testament: "old" },
  { name: "Micah", chapters: 7, testament: "old" },
  { name: "Nahum", chapters: 3, testament: "old" },
  { name: "Habakkuk", chapters: 3, testament: "old" },
  { name: "Zephaniah", chapters: 3, testament: "old" },
  { name: "Haggai", chapters: 2, testament: "old" },
  { name: "Zechariah", chapters: 14, testament: "old" },
  { name: "Malachi", chapters: 4, testament: "old" },
  // New Testament
  { name: "Matthew", chapters: 28, testament: "new" },
  { name: "Mark", chapters: 16, testament: "new" },
  { name: "Luke", chapters: 24, testament: "new" },
  { name: "John", chapters: 21, testament: "new" },
  { name: "Acts", chapters: 28, testament: "new" },
  { name: "Romans", chapters: 16, testament: "new" },
  { name: "1 Corinthians", chapters: 16, testament: "new" },
  { name: "2 Corinthians", chapters: 13, testament: "new" },
  { name: "Galatians", chapters: 6, testament: "new" },
  { name: "Ephesians", chapters: 6, testament: "new" },
  { name: "Philippians", chapters: 4, testament: "new" },
  { name: "Colossians", chapters: 4, testament: "new" },
  { name: "1 Thessalonians", chapters: 5, testament: "new" },
  { name: "2 Thessalonians", chapters: 3, testament: "new" },
  { name: "1 Timothy", chapters: 6, testament: "new" },
  { name: "2 Timothy", chapters: 4, testament: "new" },
  { name: "Titus", chapters: 3, testament: "new" },
  { name: "Philemon", chapters: 1, testament: "new" },
  { name: "Hebrews", chapters: 13, testament: "new" },
  { name: "James", chapters: 5, testament: "new" },
  { name: "1 Peter", chapters: 5, testament: "new" },
  { name: "2 Peter", chapters: 3, testament: "new" },
  { name: "1 John", chapters: 5, testament: "new" },
  { name: "2 John", chapters: 1, testament: "new" },
  { name: "3 John", chapters: 1, testament: "new" },
  { name: "Jude", chapters: 1, testament: "new" },
  { name: "Revelation", chapters: 22, testament: "new" },
]

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

interface FilterMeta {
  years: number[]
  series: { id?: string; name: string; count: number }[]
  books: { book: string; count: number }[]
}

interface Props {
  studies: BibleStudy[]
  heading: string
  pagination?: PaginationInfo
  filterMeta?: FilterMeta
}

/**
 * Build API URL with current filter params.
 */
function buildApiUrl(page: number, filters: BibleStudyFilters, search: string): string {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(PAGE_SIZE))
  if (filters.seriesId) params.set('seriesId', filters.seriesId)
  else if (filters.series) params.set('seriesName', filters.series)
  if (filters.book) {
    // Convert display label to enum value for API
    const enumVal = bibleBookFromLabel(filters.book)
    if (enumVal) params.set('book', enumVal)
  }
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (search) params.set('search', search)
  return `/api/v1/bible-studies?${params.toString()}`
}

/**
 * Transform API response data into the shape this component expects.
 */
function transformApiStudies(data: Record<string, unknown>[]): BibleStudy[] {
  return data.map((s) => ({
    id: s.id as string,
    slug: s.slug as string,
    title: s.title as string,
    passage: (s.passage as string) || '',
    series: (s.series as { name?: string } | null)?.name || '',
    dateFor: s.dateFor ? String(s.dateFor).split('T')[0] : '',
    hasQuestions: s.hasQuestions as boolean,
    hasAnswers: s.hasAnswers as boolean,
    hasTranscript: s.hasTranscript as boolean,
    book: s.book ? bibleBookLabel(s.book as string) : undefined,
  }))
}

export default function AllBibleStudiesClient({ studies: initialStudies, heading, pagination, filterMeta }: Props) {
  /* ---- State ---- */
  const [tab, setTab] = useState<TabView>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<BibleStudyFilters>({})
  const [yearFilter, setYearFilter] = useState("")
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  /* ---- Server-side filtered data state ---- */
  const [studies, setStudies] = useState<BibleStudy[]>(initialStudies)
  const [totalResults, setTotalResults] = useState(pagination?.total ?? initialStudies.length)
  const [currentPage, setCurrentPage] = useState(pagination?.page ?? 1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Debounce timer ref for search
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Abort controller for in-flight requests
  const abortRef = useRef<AbortController | null>(null)

  /**
   * Fetch filtered studies from the API. Replaces current results (page 1)
   * or appends (page > 1 for "Load More").
   */
  const fetchStudies = useCallback(async (
    page: number,
    currentFilters: BibleStudyFilters,
    currentSearch: string,
    append: boolean,
  ) => {
    // Abort any in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (append) setIsLoadingMore(true)
    else setIsLoading(true)

    try {
      const url = buildApiUrl(page, currentFilters, currentSearch)
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) return
      const json = await res.json()
      if (!json.success || !json.data) return

      const newStudies = transformApiStudies(json.data)
      if (append) {
        setStudies((prev) => {
          const existingIds = new Set(prev.map((s) => s.id))
          const unique = newStudies.filter((s) => !existingIds.has(s.id))
          return [...prev, ...unique]
        })
      } else {
        setStudies(newStudies)
      }
      setTotalResults(json.pagination.total)
      setCurrentPage(json.pagination.page)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      console.error('[AllBibleStudiesClient] fetch error:', err)
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [])

  /**
   * Trigger a filtered fetch (page 1) whenever filters or search change.
   * For search, debounce 300ms. For dropdown filters, fetch immediately.
   */
  const triggerFilteredFetch = useCallback((
    newFilters: BibleStudyFilters,
    newSearch: string,
    debounce: boolean = false,
  ) => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
      searchTimerRef.current = null
    }

    // If no filters/search active, reset to initial server data
    const isActive = !!(newFilters.series || newFilters.seriesId || newFilters.book || newFilters.dateFrom || newFilters.dateTo || newSearch)
    if (!isActive) {
      if (abortRef.current) abortRef.current.abort()
      setStudies(initialStudies)
      setTotalResults(pagination?.total ?? initialStudies.length)
      setCurrentPage(pagination?.page ?? 1)
      setIsLoading(false)
      return
    }

    if (debounce) {
      setIsLoading(true) // Show loading state immediately for perceived responsiveness
      searchTimerRef.current = setTimeout(() => {
        fetchStudies(1, newFilters, newSearch, false)
      }, 300)
    } else {
      fetchStudies(1, newFilters, newSearch, false)
    }
  }, [fetchStudies, initialStudies, pagination])

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  /* ---- Derived data from filterMeta (for dropdowns, series/books tabs) ---- */
  const seriesList = useMemo(() => {
    // Build from filterMeta (complete data from server)
    if (filterMeta?.series) {
      return filterMeta.series.map((s) => ({
        name: s.name,
        id: s.id,
        count: s.count,
        lastDate: '', // filterMeta doesn't include lastDate; filled from loaded studies below
      }))
    }
    return [] as { name: string; id?: string; count: number; lastDate: string }[]
  }, [filterMeta])

  // Augment seriesList with lastDate from currently loaded studies
  const seriesListWithDates = useMemo(() => {
    const dateMap = new Map<string, string>()
    studies.forEach((s) => {
      if (!s.series) return
      const existing = dateMap.get(s.series)
      if (!existing || s.dateFor > existing) dateMap.set(s.series, s.dateFor)
    })
    return seriesList.map((s) => ({
      ...s,
      lastDate: dateMap.get(s.name) || s.lastDate,
    }))
  }, [seriesList, studies])

  const bookCounts = useMemo(() => {
    // Prefer filterMeta for complete counts
    if (filterMeta?.books) {
      const counts = new Map<string, number>()
      for (const b of filterMeta.books) counts.set(b.book, b.count)
      return counts
    }
    const counts = new Map<string, number>()
    studies.forEach((s) => {
      if (!s.book) return
      counts.set(s.book, (counts.get(s.book) ?? 0) + 1)
    })
    return counts
  }, [studies, filterMeta])

  // Build a name->id map from filterMeta for series lookups
  const seriesIdMap = useMemo(() => {
    const map = new Map<string, string>()
    if (filterMeta?.series) {
      for (const s of filterMeta.series) {
        if (s.id) map.set(s.name, s.id)
      }
    }
    return map
  }, [filterMeta])

  const seriesOptions = useMemo(() => {
    // Prefer filterMeta for complete series list
    if (filterMeta?.series) {
      return filterMeta.series.map((s) => ({ value: s.name, label: s.name }))
    }
    return seriesList.map((s) => ({ value: s.name, label: s.name }))
  }, [seriesList, filterMeta])

  const bookOptions = useMemo(() => {
    return BIBLE_BOOKS.map((b) => ({
      value: b.name,
      label: `${b.name} (${bookCounts.get(b.name) ?? 0})`,
    }))
  }, [bookCounts])

  const availableYears = useMemo(() => {
    // Prefer filterMeta for complete year list
    if (filterMeta?.years) return filterMeta.years
    const years = new Set<number>()
    studies.forEach((s) => {
      const y = parseInt(s.dateFor.slice(0, 4), 10)
      if (!isNaN(y)) years.add(y)
    })
    return Array.from(years).sort((a, b) => b - a)
  }, [studies, filterMeta])

  /* ---- Sorting (client-side on loaded results) ---- */
  const sortedStudies = useMemo(() => {
    return [...studies].sort((a, b) => {
      let cmp = 0
      if (sortField === "date") {
        cmp = a.dateFor.localeCompare(b.dateFor)
      } else if (sortField === "book") {
        cmp = (a.book ?? "").localeCompare(b.book ?? "")
      } else {
        cmp = a.title.localeCompare(b.title)
      }
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [studies, sortField, sortDirection])

  const hasMore = studies.length < totalResults

  function updateFilter<K extends keyof BibleStudyFilters>(
    key: K,
    value: BibleStudyFilters[K],
  ) {
    const newFilters = { ...filters, [key]: value }
    // When setting series by name, also set seriesId if available
    if (key === "series") {
      if (value && typeof value === 'string') {
        newFilters.seriesId = seriesIdMap.get(value)
      } else {
        newFilters.seriesId = undefined
      }
    }
    if (key === "dateFrom" || key === "dateTo") setYearFilter("")
    setFilters(newFilters)
    triggerFilteredFetch(newFilters, search)
  }

  function handleYearChange(year: string) {
    setYearFilter(year)
    let newFilters: BibleStudyFilters
    if (year && year !== "all") {
      newFilters = { ...filters, dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` }
    } else {
      newFilters = { ...filters, dateFrom: undefined, dateTo: undefined }
    }
    setFilters(newFilters)
    triggerFilteredFetch(newFilters, search)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    triggerFilteredFetch(filters, value, true /* debounce */)
  }

  /** Switch to "all" tab with a specific filter pre-applied */
  const switchToAllWithFilter = useCallback((key: keyof BibleStudyFilters, value: string) => {
    setTab("all")
    const newFilters: BibleStudyFilters = { [key]: value }
    // Resolve seriesId when switching by series name
    if (key === "series") {
      newFilters.seriesId = seriesIdMap.get(value)
    }
    setFilters(newFilters)
    setYearFilter("")
    setSearch("")
    triggerFilteredFetch(newFilters, "")
  }, [seriesIdMap, triggerFilteredFetch])

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All Studies" },
    { key: "series", label: "Series" },
    { key: "books", label: "Books" },
  ]

  return (
    <SectionContainer colorScheme="light" paddingY="none" className="pb-24 lg:pb-30">
      {/* Filter toolbar */}
      <FilterToolbar
        tabs={{
          options: tabs,
          active: tab,
          onChange: (key) => {
            setTab(key as TabView)
            setFilters({})
            setSearch("")
            triggerFilteredFetch({}, "", false)
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
          onChange: (v) => handleSearchChange(v),
          placeholder: "Search studies, passages, series...",
        } : undefined}
        filters={tab === "all" ? [
          {
            id: "series",
            label: "Series",
            value: filters.series ?? "all",
            options: [
              { value: "all", label: "All Series" },
              ...seriesOptions,
            ],
            onChange: (v: string) =>
              updateFilter("series", v === "all" ? undefined : v),
          },
          {
            id: "book",
            label: "Book",
            value: filters.book ?? "all",
            options: [
              { value: "all", label: "All Books" },
              ...bookOptions,
            ],
            onChange: (v: string) =>
              updateFilter("book", v === "all" ? undefined : v),
          },
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
            { value: "book", label: "Book (A-Z)", direction: "asc" },
            { value: "book", label: "Book (Z-A)", direction: "desc" },
          ],
          active: sortField,
          direction: sortDirection,
          onChange: (value, dir) => {
            setSortField(value)
            setSortDirection(dir)
          },
        } : undefined}
        onReset={tab === "all" ? () => {
          setSearch("")
          setFilters({})
          setYearFilter("")
          triggerFilteredFetch({}, "", false)
        } : undefined}
        className="mb-8"
      />

      {/* ---- All Studies Tab ---- */}
      {tab === "all" && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black-1 mb-4" />
              <p className="text-body-1 text-black-3">Loading studies...</p>
            </div>
          ) : sortedStudies.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <p className="text-body-1 text-black-2">
                No studies found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearch("")
                  setFilters({})
                  setYearFilter("")
                  triggerFilteredFetch({}, "", false)
                }}
                className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === "card" ? (
            <CardGrid studies={sortedStudies} />
          ) : (
            <StudyListView studies={sortedStudies} />
          )}

          {/* Load more -- fetches next page with current filters */}
          {hasMore && !isLoading && (
            <div className="flex justify-center mt-10">
              <button
                disabled={isLoadingMore}
                onClick={() => {
                  fetchStudies(currentPage + 1, filters, search, true)
                }}
                className="inline-flex items-center justify-center rounded-full border border-black-1/30 px-8 py-4 text-button-1 text-black-1 transition-colors hover:bg-black-1 hover:text-white-1 disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : 'Load More Studies'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ---- Series Tab ---- */}
      {tab === "series" && (
        <>
          <h2 className="text-h2 text-black-1 mb-8">Series</h2>
          <SeriesGrid
            series={seriesListWithDates}
            onSeriesClick={(name) => switchToAllWithFilter("series", name)}
          />
        </>
      )}

      {/* ---- Books Tab ---- */}
      {tab === "books" && (
        <>
          <h2 className="text-h2 text-black-1 mb-8">Books</h2>
          <BooksView
            bookCounts={bookCounts}
            onBookClick={(name) => switchToAllWithFilter("book", name)}
          />
        </>
      )}
    </SectionContainer>
  )
}

/* ---- Card Grid (All Studies) ---- */

function CardGrid({ studies }: { studies: BibleStudy[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {studies.map((study) => (
        <BibleStudyCard key={study.id} study={study} />
      ))}
    </div>
  )
}

/* ---- List View (All Studies) ---- */

function StudyListView({ studies }: { studies: BibleStudy[] }) {
  return (
    <div className="flex flex-col divide-y divide-white-2/50">
      {studies.map((study) => (
        <Link
          key={study.id}
          href={resolveHref(`/bible-study/${study.slug}`)}
          className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-6 py-5 transition-colors hover:bg-white-1-5 -mx-4 px-4 rounded-[12px]"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[13px] text-black-3 whitespace-nowrap">
                {formatDate(study.dateFor)}
              </span>
              {study.series && (
                <span className="bg-white-2 px-[8px] py-[4px] rounded-[6px] text-[11px] font-medium text-black-3 tracking-[0.22px] shrink-0">
                  {study.series}
                </span>
              )}
            </div>
            <h3 className="text-[18px] font-medium text-black-1 mb-1 sm:truncate">
              {study.title}
            </h3>
            <div className="flex items-center gap-2">
              <IconBookOpen className="size-[14px] text-black-3 shrink-0" />
              <span className="text-[14px] text-black-3">{study.passage}</span>
            </div>
          </div>

          {/* Icons + arrow */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="flex gap-1.5">
              {study.hasQuestions && (
                <div className="bg-white-1-5 p-[6px] rounded-[6px]">
                  <IconFileText className="size-[14px] text-black-2" />
                </div>
              )}
              {study.hasAnswers && (
                <div className="bg-white-1-5 p-[6px] rounded-[6px]">
                  <IconHelpCircle className="size-[14px] text-black-2" />
                </div>
              )}
              {study.hasTranscript && (
                <div className="bg-white-1-5 p-[6px] rounded-[6px]">
                  <IconVideo className="size-[14px] text-black-2" />
                </div>
              )}
            </div>
            <IconChevronRight className="size-5 text-black-3 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  )
}

/* ---- Series Grid ---- */

function SeriesGrid({
  series,
  onSeriesClick,
}: {
  series: { name: string; count: number; lastDate: string }[]
  onSeriesClick: (name: string) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {series.map((s) => (
        <button
          key={s.name}
          onClick={() => onSeriesClick(s.name)}
          className="group relative rounded-[20px] bg-white-0 p-7 min-h-[180px] flex flex-col text-left cursor-pointer transition-all hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
        >
          {/* Folder icon */}
          <div className="mb-4">
            <div className="bg-white-1-5 inline-flex items-center p-[8px] rounded-[8px]">
              <IconFolder className="size-[16px] text-black-2" />
            </div>
          </div>

          <h3 className="text-[20px] font-medium text-black-1 tracking-[-0.4px] mb-2">
            {s.name}
          </h3>

          <p className="text-[13px] text-black-3 mb-4">
            {s.count} {s.count === 1 ? "Study" : "Studies"} · Last updated {formatDate(s.lastDate)}
          </p>

          <p className="mt-auto text-[12px] font-semibold text-accent-blue tracking-[0.24px] uppercase">
            VIEW COLLECTION
          </p>

          <div
            aria-hidden="true"
            className="absolute border border-white-2-5 inset-0 pointer-events-none rounded-[20px] shadow-[0px_4px_12px_0px_rgba(0,0,0,0.04)] transition-shadow group-hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]"
          />
        </button>
      ))}
    </div>
  )
}

/* ---- Books View ---- */

function BooksView({
  bookCounts,
  onBookClick,
}: {
  bookCounts: Map<string, number>
  onBookClick: (name: string) => void
}) {
  const otBooks = BIBLE_BOOKS.filter((b) => b.testament === "old")
  const ntBooks = BIBLE_BOOKS.filter((b) => b.testament === "new")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Old Testament */}
      <div>
        <h3 className="text-[22px] font-semibold text-black-1 tracking-[-0.44px] mb-1">
          Old Testament
        </h3>
        <p className="text-[13px] text-black-3 mb-6">
          39 Books · Genesis through Malachi
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
          {otBooks.map((book) => (
            <BookRow
              key={book.name}
              name={book.name}
              chapters={book.chapters}
              studyCount={bookCounts.get(book.name) ?? 0}
              onClick={() => onBookClick(book.name)}
            />
          ))}
        </div>
      </div>

      {/* New Testament */}
      <div>
        <h3 className="text-[22px] font-semibold text-black-1 tracking-[-0.44px] mb-1">
          New Testament
        </h3>
        <p className="text-[13px] text-black-3 mb-6">
          27 Books · Matthew through Revelation
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
          {ntBooks.map((book) => (
            <BookRow
              key={book.name}
              name={book.name}
              chapters={book.chapters}
              studyCount={bookCounts.get(book.name) ?? 0}
              onClick={() => onBookClick(book.name)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function BookRow({
  name,
  chapters,
  studyCount,
  onClick,
}: {
  name: string
  chapters: number
  studyCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-3 border-b border-white-2-5 w-full text-left",
        studyCount > 0
          ? "cursor-pointer hover:bg-white-1-5 -mx-2 px-2 rounded-[8px]"
          : "opacity-50",
      )}
    >
      <div className="bg-white-1-5 flex items-center p-[6px] rounded-[6px] shrink-0">
        <IconBookOpen className="size-[14px] text-black-3" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-black-1 truncate">{name}</p>
        <p className="text-[12px] text-white-3">
          {chapters} {chapters === 1 ? "chapter" : "chapters"}
        </p>
      </div>

      {studyCount > 0 && (
        <span className="flex items-center justify-center min-w-[24px] h-[24px] rounded-full bg-accent-blue text-white-0 text-[12px] font-semibold px-1.5">
          {studyCount}
        </span>
      )}
    </button>
  )
}
