"use client"

import { useState, useMemo } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import VideoCard from "@/components/website/shared/video-card"
import VideoModal from "@/components/website/shared/video-modal"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { IconSearch } from "@/components/website/shared/icons"

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
  videos?: Video[]
}

export default function AllVideosSection({ content, enableAnimations, colorScheme = "light", videos = [] }: Props) {
  const t = themeTokens[colorScheme]

  const [search, setSearch] = useState("")
  const [displayCount, setDisplayCount] = useState(INITIAL_COUNT)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

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
    return [...result].sort((a, b) => {
      const cmp = a.datePublished.localeCompare(b.datePublished)
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [videos, search, sortDirection])

  const visibleVideos = filteredVideos.slice(0, displayCount)
  const hasMore = displayCount < filteredVideos.length

  return (
    <SectionContainer colorScheme={colorScheme} className="pt-0 py-30">
      {/* Search bar */}
      <div className="mb-8 flex flex-col gap-4">
        <div className="relative max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black-3" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setDisplayCount(INITIAL_COUNT)
            }}
            className="w-full pl-10 pr-4 py-3 bg-white-1-5 border border-white-2 rounded-lg text-body-2 text-black-1 placeholder:text-white-3 outline-none focus:border-brand-1 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
            className="text-[13px] font-medium text-black-3 hover:text-black-1 transition-colors"
          >
            Date: {sortDirection === "desc" ? "Newest first" : "Oldest first"}
          </button>
          <span className="text-[13px] text-black-3">
            {filteredVideos.length} {filteredVideos.length === 1 ? "video" : "videos"}
          </span>
        </div>
      </div>

      {/* Videos grid */}
      {filteredVideos.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <p className={`text-body-1 ${t.textSecondary}`}>
            No videos found matching your criteria.
          </p>
          <button
            onClick={() => {
              setSearch("")
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
