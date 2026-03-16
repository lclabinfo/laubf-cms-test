"use client"

import { useState } from "react"
import SectionContainer from "@/components/website/shared/section-container"
import VideoThumbnail from "@/components/website/shared/video-thumbnail"
import VideoModal from "@/components/website/shared/video-modal"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import { themeTokens, type SectionTheme } from "@/components/website/shared/theme-tokens"
import Link from "next/link"
import { resolveHref } from "@/lib/website/resolve-href"

function extractYouTubeId(url?: string): string | null {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/)
  return match?.[1] ?? null
}

interface SpotlightMediaContent {
  sectionHeading: string
  sermon?: {
    slug?: string
    title: string
    speaker: string
    date: string
    series?: string
    thumbnailUrl?: string | null
    videoUrl?: string
  }
}

interface Props {
  content: SpotlightMediaContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
}

export default function SpotlightMediaSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth }: Props) {
  const sermon = content.sermon
  const t = themeTokens[colorScheme]
  const animate = enableAnimations !== false
  const [showModal, setShowModal] = useState(false)

  if (!sermon) return null

  const sermonHref = sermon.slug ? resolveHref(`/messages/${sermon.slug}`) : undefined
  const youtubeId = extractYouTubeId(sermon.videoUrl)

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div className="flex flex-col gap-10">
        {/* Section heading + title */}
        <AnimateOnScroll animation="fade-up" enabled={animate} className="flex flex-col gap-2">
          <span className={`text-body-1 ${t.textSecondary}`}>
            {content.sectionHeading}
          </span>
          {sermonHref ? (
            <Link href={sermonHref} className="hover:opacity-80 transition-opacity">
              <h2 className={`text-h2 text-balance ${t.textPrimary}`}>
                {sermon.title}
              </h2>
            </Link>
          ) : (
            <h2 className={`text-h2 text-balance ${t.textPrimary}`}>
              {sermon.title}
            </h2>
          )}
        </AnimateOnScroll>

        {/* Speaker + metadata */}
        <AnimateOnScroll animation="fade-up" staggerIndex={1} enabled={animate} className="flex flex-col gap-1">
          <span className={`text-h4 ${t.textPrimary}`}>{sermon.speaker}</span>
          <span className={`text-h4 ${t.textMuted} uppercase`}>
            {sermon.series} &bull; {sermon.date}
          </span>
        </AnimateOnScroll>

        {/* Video player — click opens modal if YouTube ID available, otherwise navigate to message */}
        <AnimateOnScroll animation="scale-up" staggerIndex={2} enabled={animate}>
          {youtubeId ? (
            <VideoThumbnail
              data={{
                id: "sermon-video",
                title: sermon.title,
                thumbnailUrl: sermon.thumbnailUrl,
                videoUrl: sermon.videoUrl,
              }}
              size="featured"
              onClick={() => setShowModal(true)}
            />
          ) : sermonHref ? (
            <Link href={sermonHref} className="block">
              <VideoThumbnail
                data={{
                  id: "sermon-video",
                  title: sermon.title,
                  thumbnailUrl: sermon.thumbnailUrl,
                  videoUrl: sermon.videoUrl,
                }}
                size="featured"
              />
            </Link>
          ) : (
            <VideoThumbnail
              data={{
                id: "sermon-video",
                title: sermon.title,
                thumbnailUrl: sermon.thumbnailUrl,
                videoUrl: sermon.videoUrl,
              }}
              size="featured"
            />
          )}
        </AnimateOnScroll>
      </div>

      {/* Video preview modal */}
      {showModal && youtubeId && (
        <VideoModal
          video={{
            id: "sermon-video",
            title: sermon.title,
            youtubeId,
            duration: "",
            category: sermon.series || "Message",
            datePublished: sermon.date,
            description: "",
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </SectionContainer>
  )
}
