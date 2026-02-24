"use client"

import { useState } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import SectionHeader from "@/components/website/shared/section-header"
import VideoCard from "@/components/website/shared/video-card"
import VideoModal from "@/components/website/shared/video-modal"
import { cn } from "@/lib/utils"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface VideoThumbnailData {
  id: string
  title: string
  youtubeId: string
  duration: string
  category: string
  datePublished: string
  description: string
}

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

interface MediaGridContent {
  heading: string
  ctaLabel?: string
  ctaHref?: string
  videos: VideoThumbnailData[]
}

interface Props {
  content: MediaGridContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  videos?: Video[]
}

export default function MediaGridSection({ content, enableAnimations, colorScheme = "light", videos }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} className="!pt-0">
      <div className="flex flex-col gap-8">
        <div className={cn(animate && "animate-hero-fade-up")}>
          <SectionHeader
            heading={content.heading}
            ctaLabel={content.ctaLabel}
            ctaHref={content.ctaHref}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.videos.map((video, i) => (
            <div key={video.id} className={cn(animate && "animate-hero-fade-up-delayed")}>
              <VideoCard
                video={video}
                onClick={
                  videos && videos[i]
                    ? () => setSelectedVideo(videos[i])
                    : () => {}
                }
              />
            </div>
          ))}
        </div>
      </div>

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
