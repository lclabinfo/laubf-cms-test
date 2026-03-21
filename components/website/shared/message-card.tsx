"use client"
/*
 * MessageCard -- Card component for Sunday message/sermon entries
 *
 * Inner-padded card with video thumbnail, series pill, date,
 * title, speaker, and passage. Hover changes background color.
 * Supports YouTube thumbnails, Vimeo placeholder, and no-video state.
 */
import Link from "next/link"
import { resolveHref } from "@/lib/website/resolve-href"
import {
  IconBookOpen,
  IconUser,
} from "@/components/website/shared/icons"
import { useSectionTheme } from "@/components/website/shared/theme-tokens"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  slug: string
  title: string
  videoTitle?: string | null
  youtubeId: string
  videoUrl?: string
  hasVideo?: boolean
  speaker: string
  series: string
  passage: string
  dateFor: string
  description?: string
  rawTranscript?: string | null
  liveTranscript?: string | null
  relatedStudyId?: string
  duration?: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  const month = date
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase()
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

export default function MessageCard({ message }: { message: Message }) {
  const t = useSectionTheme()
  const hasYouTube = message.hasVideo && !!message.youtubeId
  const hasVimeo = message.hasVideo && !hasYouTube && !!message.videoUrl
  const hasAnyVideo = message.hasVideo && (hasYouTube || hasVimeo)
  const displayTitle = message.videoTitle || message.title
  const showSubtitle = message.videoTitle && message.videoTitle !== message.title

  return (
    <Link
      href={resolveHref(`/messages/${message.slug}`)}
      className={cn(
        "group relative rounded-[24px] p-3 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0px_8px_16px_0px_rgba(0,0,0,0.06)]",
        t.surfaceBgSubtle,
      )}
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video rounded-[16px] overflow-hidden bg-black-1">
        {hasYouTube ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${message.youtubeId}/hqdefault.jpg`}
              alt={displayTitle}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
          </>
        ) : hasAnyVideo ? (
          /* Vimeo or other video -- gradient placeholder */
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
        ) : (
          /* No video at all */
          <div className="absolute inset-0 bg-gradient-to-br from-white-2 to-white-1-5" />
        )}

        {/* Play button (show for any video) */}
        {hasAnyVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center rounded-full bg-white-0/90 backdrop-blur-sm size-12 transition-transform group-hover:scale-110">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5 ml-0.5 text-black-1"
              >
                <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
              </svg>
            </div>
          </div>
        )}

        {/* No-video icon */}
        {!hasAnyVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <IconBookOpen className="size-8 text-black-3/30" />
          </div>
        )}

        {/* Duration badge */}
        {message.duration && (
          <span className="absolute bottom-2 right-2 bg-black-1/80 text-white-0 text-[12px] font-medium px-2 py-0.5 rounded-[6px]">
            {message.duration}
          </span>
        )}

        {/* Vimeo badge */}
        {hasVimeo && (
          <span className="absolute top-2 left-2 bg-white-0/80 text-black-1 text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider backdrop-blur-sm">
            Vimeo
          </span>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-col items-start pt-5 px-2 pb-3">
        {/* Date + Series pill row */}
        <div className="flex items-center justify-between w-full mb-[12px]">
          <p className={cn("font-medium leading-none text-[14px] tracking-[-0.42px] whitespace-nowrap", t.textMuted)}>
            {formatDate(message.dateFor)}
          </p>
          {message.series && (
            <div className={cn("flex flex-col items-start px-[8px] py-[6px] rounded-[8px] shrink-0", t.surfaceBg)}>
              <p className={cn("font-medium leading-none text-[12px] text-center tracking-[0.24px]", t.textMuted)}>
                {message.series}
              </p>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="w-full mb-[12px]">
          <p className={cn("font-medium leading-[1.2] text-[18px] sm:text-[24px] tracking-[-0.72px] line-clamp-2", t.textPrimary)}>
            {displayTitle}
          </p>
          {showSubtitle && (
            <p className={cn("font-medium leading-[1.3] text-[13px] sm:text-[14px] tracking-[-0.28px] mt-1 line-clamp-1", t.textMuted)}>
              {message.title}
            </p>
          )}
        </div>

        {/* Speaker + Passage */}
        <div className="flex flex-col gap-[6px] w-full">
          <div className="flex gap-[8px] items-center">
            <IconUser className={cn("shrink-0 size-[16px]", t.textMuted)} />
            <p className={cn("leading-[1.4] text-[14px] sm:text-[16px] tracking-[-0.32px]", t.textMuted)}>
              {message.speaker}
            </p>
          </div>
          <div className="flex gap-[8px] items-center">
            <IconBookOpen className={cn("shrink-0 size-[16px]", t.textMuted)} />
            <p className={cn("leading-[1.4] text-[14px] sm:text-[16px] tracking-[-0.32px]", t.textMuted)}>
              {message.passage}
            </p>
          </div>
        </div>
      </div>

      {/* Border overlay */}
      <div
        aria-hidden="true"
        className={cn("absolute inset-0 pointer-events-none rounded-[24px] border", t.cardBorder)}
      />
    </Link>
  )
}
