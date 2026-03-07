"use client"

import { useState, useMemo } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import VideoCard from "@/components/website/shared/video-card"
import VideoModal from "@/components/website/shared/video-modal"
import FilterToolbar from "@/components/website/shared/filter-toolbar"
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

const INITIAL_COUNT = 9
const LOAD_MORE_COUNT = 9

interface AllVideosContent {
  heading?: string
}

interface Props {
  content: AllVideosContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
  videos?: Video[]
}

export default function AllVideosSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth, videos = [] }: Props) {
  const t = themeTokens[colorScheme]

  const [search, setSearch] = useState("")
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [sortField, setSortField] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [filterCategory, setFilterCategory] = useState<string | undefined>()

  const categoryOptions = useMemo(() => {
    const cats = new Set<string>()
    videos.forEach((v) => { if (v.category) cats.add(v.category) })
    return Array.from(cats).sort().map((c) => ({ value: c, label: c }))
  }, [videos])

  const filteredVideos = useMemo(() => {
    let result = videos
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.category && v.category.toLowerCase().includes(q)),
      )
    }
    if (filterCategory) {
      result = result.filter((v) => v.category === filterCategory)
    }
    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortField === "date") {
        cmp = a.datePublished.localeCompare(b.datePublished)
      } else {
        cmp = a.title.localeCompare(b.title)
      }
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [videos, search, filterCategory, sortField, sortDirection])

  const visibleVideos = filteredVideos.slice(0, displayCount)
  const hasMore = displayCount < filteredVideos.length

  return (
    <SectionContainer colorScheme={colorScheme} paddingY="none" containerWidth={containerWidth} className="pb-24 lg:pb-30">
      {/* Filter toolbar — matches Messages and Bible Studies pages */}
      <FilterToolbar
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v)
            setDisplayCount(INITIAL_COUNT)
          },
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
              setDisplayCount(INITIAL_COUNT)
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
          setDisplayCount(INITIAL_COUNT)
        }}
        className="mb-8"
      />

      {/* Videos grid */}
      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <p className={`text-body-1 ${t.textSecondary}`}>
            No videos found matching your criteria.
          </p>
          <button
            onClick={() => {
              setSearch("")
              setFilterCategory(undefined)
              setDisplayCount(INITIAL_COUNT)
            }}
            className="mt-4 text-accent-blue text-[14px] font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setDisplayCount((c) => c + LOAD_MORE_COUNT)}
            className="inline-flex items-center justify-center rounded-full border border-black-1/30 px-8 py-4 text-button-1 text-black-1 transition-colors hover:bg-black-1 hover:text-white-1"
          >
            Load More Videos
          </button>
        </div>
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
