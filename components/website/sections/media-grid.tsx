"use client"

import { useState } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import SectionHeader from "@/components/website/shared/section-header"
import VideoThumbnail from "@/components/website/shared/video-thumbnail"
import VideoModal from "@/components/website/shared/video-modal"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import type { SectionTheme } from "@/components/website/shared/theme-tokens"

interface VideoThumbnailData {
  id: string
  title: string
  thumbnailUrl?: string | null
  videoUrl?: string
  duration?: string
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
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
  videos?: Video[]
}

export default function MediaGridSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth, videos }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const animate = enableAnimations !== false

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth} className="!pt-0">
      <div className="flex flex-col gap-8">
        <AnimateOnScroll animation="fade-up" enabled={animate}>
          <SectionHeader
            heading={content.heading}
            ctaLabel={content.ctaLabel}
            ctaHref={content.ctaHref}
          />
        </AnimateOnScroll>

        <div className={`flex flex-wrap gap-5 ${(content.videos ?? []).length < 3 ? "justify-center" : ""}`}>
          {(content.videos ?? []).map((video, i) => (
            <AnimateOnScroll
              key={video.id}
              animation="fade-up"
              staggerIndex={i}
              enabled={animate}
              className="w-full sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.875rem)]"
            >
              <VideoThumbnail
                data={video}
                size="grid"
                onClick={
                  videos && videos[i]
                    ? () => setSelectedVideo(videos[i])
                    : undefined
                }
              />
            </AnimateOnScroll>
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
