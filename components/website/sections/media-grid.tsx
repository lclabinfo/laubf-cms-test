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

export default function MediaGridSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth, videos: videosProp }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const animate = enableAnimations !== false

  // Build Video objects for the modal from content.videos data (which includes youtubeId)
  // Fall back to the videos prop if provided separately via resolvedData
  const contentVideos = content.videos ?? []
  const modalVideos: Video[] = videosProp ?? contentVideos
    .filter((v) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !!(v as any).youtubeId
    })
    .map((v) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = v as any
      return {
        id: v.id,
        title: v.title,
        youtubeId: raw.youtubeId as string,
        duration: (raw.duration as string) || "",
        category: (raw.category as string) || "",
        datePublished: (raw.datePublished as string) || "",
        description: (raw.description as string) || "",
      }
    })

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

        <div className={`flex flex-wrap gap-5 ${contentVideos.length < 3 ? "justify-center" : ""}`}>
          {contentVideos.map((video, i) => {
            const modalVideo = modalVideos.find((mv) => mv.id === video.id) ?? modalVideos[i]
            return (
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
                    modalVideo
                      ? () => setSelectedVideo(modalVideo)
                      : undefined
                  }
                />
              </AnimateOnScroll>
            )
          })}
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
