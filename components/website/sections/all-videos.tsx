"use client"

import { useState, useMemo, useEffect, useRef, useTransition } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import VideoCard from "@/components/website/shared/video-card"
import VideoModal from "@/components/website/shared/video-modal"
import FilterToolbar from "@/components/website/shared/filter-toolbar"
import { Skeleton } from "@/components/ui/skeleton"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"

interface Video {
  id: string
  title: string
  youtubeId: string
  duration: string
  category: string
  datePublished: string
  description: string
  isShort?: boolean
}

const PAGE_SIZE = 9

interface AllVideosContent {
  heading?: string
}

interface FilterMeta {
  categories: string[]
}

interface PaginationInfo {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface Props {
  content: AllVideosContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
  videos?: Video[]
  filterMeta?: FilterMeta
  pagination?: PaginationInfo
}

/** Map UI sort field names to API parameter names */
function mapSortField(field: string): string {
  return field === "date" ? "datePublished" : field
}

/** Build query string for the videos API based on current filters */
function buildApiUrl(params: {
  page: number
  pageSize: number
  search?: string
  category?: string
  sortBy?: string
  sortDir?: string
}): string {
  const qs = new URLSearchParams()
  qs.set("page", String(params.page))
  qs.set("pageSize", String(params.pageSize))
  if (params.search) qs.set("search", params.search)
  if (params.category) qs.set("category", params.category)
  if (params.sortBy) qs.set("sortBy", params.sortBy)
  if (params.sortDir) qs.set("sortDir", params.sortDir)
  return `/api/v1/videos?${qs.toString()}`
}

/** Fetch videos from the API and transform to the component's Video shape */
async function fetchVideos(url: string): Promise<{ videos: Video[]; pagination: PaginationInfo }> {
  const res = await fetch(url)
  if (!res.ok) return { videos: [], pagination: { total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 } }
  const json = await res.json()
  if (!json.success || !json.data) return { videos: [], pagination: { total: 0, page: 1, pageSize: PAGE_SIZE, totalPages: 0 } }
  const videos: Video[] = json.data.map((v: Record<string, unknown>) => ({
    id: v.id as string,
    title: v.title as string,
    youtubeId: (v.youtubeId as string) || "",
    duration: (v.duration as string) || "",
    category: (v.category as string) || "",
    datePublished: v.datePublished ? String(v.datePublished).split("T")[0] : "",
    description: (v.description as string) || "",
    isShort: v.isShort as boolean | undefined,
  }))
  return { videos, pagination: json.pagination }
}

function VideoCardSkeleton() {
  return (
    <div className="rounded-[16px]">
      {/* Thumbnail skeleton */}
      <Skeleton className="aspect-video w-full rounded-[16px]" />
      {/* Content area */}
      <div className="pt-3 pb-1 px-1 space-y-2">
        {/* Category + date */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="size-[3px] rounded-full" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        {/* Title */}
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  )
}

export default function AllVideosSection({ colorScheme = "light", containerWidth, videos: initialVideos = [], filterMeta, pagination: initialPagination }: Props) {
  const t = themeTokens[colorScheme]

  const [search, setSearch] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterCategory, setFilterCategory] = useState<string | undefined>()

  /* ---- Server-side filtered data ---- */
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [totalCount, setTotalCount] = useState(initialPagination?.total ?? initialVideos.length)
  const [currentPage, setCurrentPage] = useState(initialPagination?.page ?? 1)
  const [isFiltering, startFiltering] = useTransition()
  const [isLoadingMore, startLoadingMore] = useTransition()
  // Content area ref for min-height preservation during filtering (prevents scroll jump)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentMinHeight, setContentMinHeight] = useState<number | undefined>()

  const categoryOptions = useMemo(() => {
    if (filterMeta?.categories) {
      return filterMeta.categories.map((c) => ({ value: c, label: c }))
    }
    const cats = new Set<string>()
    initialVideos.forEach((v) => { if (v.category) cats.add(v.category) })
    return Array.from(cats).sort().map((c) => ({ value: c, label: c }))
  }, [initialVideos, filterMeta])

  /* ---- Debounced search ---- */
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [search])

  /* ---- Re-fetch when filters change ---- */
  const prevFiltersRef = useRef("")
  useEffect(() => {
    const filterKey = JSON.stringify({ search: debouncedSearch, category: filterCategory, sortField, sortDirection })
    if (filterKey === prevFiltersRef.current) return
    prevFiltersRef.current = filterKey

    // Skip API call on initial render with default filters
    if (!debouncedSearch && !filterCategory && sortField === "date" && sortDirection === "desc") {
      setVideos(initialVideos)
      setTotalCount(initialPagination?.total ?? initialVideos.length)
      setCurrentPage(initialPagination?.page ?? 1)
      return
    }

    const url = buildApiUrl({
      page: 1,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category: filterCategory,
      sortBy: mapSortField(sortField),
      sortDir: sortDirection,
    })

    // Capture current content height to prevent scroll jump during loading
    if (contentRef.current) {
      setContentMinHeight(contentRef.current.offsetHeight)
    }
    startFiltering(async () => {
      const result = await fetchVideos(url)
      // Small delay so the fade-out is visible before swapping content
      await new Promise((r) => setTimeout(r, 150))
      setVideos(result.videos)
      setTotalCount(result.pagination.total)
      setCurrentPage(1)
      requestAnimationFrame(() => setContentMinHeight(undefined))
    })
  }, [debouncedSearch, filterCategory, sortField, sortDirection, initialVideos, initialPagination])

  /* ---- Load More ---- */
  const hasMore = videos.length < totalCount

  function handleLoadMore() {
    const nextPage = currentPage + 1
    const url = buildApiUrl({
      page: nextPage,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
      category: filterCategory,
      sortBy: mapSortField(sortField),
      sortDir: sortDirection,
    })
    startLoadingMore(async () => {
      const result = await fetchVideos(url)
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id))
        const unique = result.videos.filter((v) => !existingIds.has(v.id))
        return [...prev, ...unique]
      })
      setCurrentPage(nextPage)
      setTotalCount(result.pagination.total)
    })
  }

  return (
    <SectionContainer colorScheme={colorScheme} paddingY="none" containerWidth={containerWidth} className="pb-24 lg:pb-30">
      {/* Filter toolbar -- matches Messages and Bible Studies pages */}
      <FilterToolbar
        tabs={{
          options: [{ key: "all", label: "All Videos" }],
          active: "all",
          onChange: () => {},
        }}
        search={{
          value: search,
          onChange: (v) => setSearch(v),
          placeholder: "Search videos...",
        }}
        filters={categoryOptions.length > 0 ? [
          {
            id: "category",
            label: "Category",
            value: filterCategory ?? "all",
            options: [
              { value: "all", label: "All Categories" },
              ...categoryOptions,
            ],
            onChange: (v: string) => {
              setFilterCategory(v === "all" ? undefined : v)
            },
          },
        ] : undefined}
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
          setFilterCategory(undefined)
          setSortField("date")
          setSortDirection("desc")
        }}
        className="mb-8"
      />

      {/* Content area with min-height preservation to prevent scroll jump */}
      <div ref={contentRef} className="relative" style={{ minHeight: contentMinHeight ? `${contentMinHeight}px` : undefined }}>
        <div className={`transition-opacity duration-500 ease-in-out ${isFiltering ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
          {videos.length === 0 && !isFiltering ? (
            <div className="flex flex-col items-center py-20">
              <p className={`text-body-1 ${t.textSecondary}`}>
                No videos found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSearch("")
                  setFilterCategory(undefined)
                  setSortField("date")
                  setSortDirection("desc")
                }}
                className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => setSelectedVideo(video)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Load more */}
      {hasMore && !isFiltering && (
        <>
          {isLoadingMore && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
              {Array.from({ length: 3 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          )}
          <div className="flex justify-center mt-10">
            <button
              disabled={isLoadingMore}
              onClick={handleLoadMore}
              className="inline-flex items-center justify-center rounded-full border border-black-1/30 px-8 py-4 text-button-1 text-black-1 transition-colors hover:bg-black-1 hover:text-white-1 disabled:opacity-50"
            >
              {isLoadingMore ? "Loading..." : "Load More Videos"}
            </button>
          </div>
        </>
      )}

      {/* Video modal */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </SectionContainer>
  )
}
