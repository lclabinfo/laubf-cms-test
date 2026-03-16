import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { getChurchId } from "@/lib/tenant/context"
import { getMessageBySlug } from "@/lib/dal/messages"
import { resolveHref } from "@/lib/website/resolve-href"
import { contentToHtml } from "@/lib/tiptap"
import {
  IconChevronLeft,
  IconCalendar,
  IconArrowRight,
  IconBookOpen,
  IconFileText,
} from "@/components/website/shared/icons"
import TranscriptPanel from "./transcript-panel"
import ShareMessageButton from "./share-message-button"

interface PageProps {
  params: Promise<{ slug: string }>
}

/* ── Helpers ── */

/** Convert a Vimeo watch URL to its embeddable player URL. */
function toEmbedUrl(url: string): string {
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  return url
}

function formatDate(date: Date): string {
  return date
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()
}

/* ── Metadata ── */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const churchId = await getChurchId()
  const message = await getMessageBySlug(churchId, slug)

  if (!message) return { title: "Message Not Found" }

  return {
    title: message.videoTitle || message.title,
    description: message.videoDescription || `Listen to ${message.title}`,
  }
}

/* ── Page ── */

export default async function MessageDetailPage({ params }: PageProps) {
  const { slug } = await params
  const churchId = await getChurchId()
  const message = await getMessageBySlug(churchId, slug)

  if (!message) {
    notFound()
  }

  const seriesName = message.messageSeries?.[0]?.series?.name
  const speakerName = message.speaker?.name

  // Pre-convert transcripts from TipTap JSON / plain text to HTML
  // Fall back to related study transcript when message-level transcripts are empty
  const liveTranscriptHtml = contentToHtml(message.liveTranscript)
  const rawTranscriptHtml = contentToHtml(message.rawTranscript)
    || contentToHtml(message.relatedStudy?.transcript)

  // Determine whether the right column has any content
  const hasTranscript = !!(liveTranscriptHtml || rawTranscriptHtml)
  const hasStudyGuide = !!(message.relatedStudy && message.relatedStudy.status === "PUBLISHED")
  const hasRightColumn = hasTranscript || hasStudyGuide

  return (
    <main className="bg-white-1 min-h-screen">
      {/* Sub-navigation bar */}
      <div className="py-4">
        <div className="container-standard flex items-center justify-between">
          <Link
            href={resolveHref("/messages")}
            className="flex items-center gap-2 text-[14px] font-bold text-black-3 uppercase tracking-wide hover:text-black-1 transition-colors"
          >
            <IconChevronLeft className="size-4" />
            Back to Messages
          </Link>
          <div className="flex items-center gap-4">
            {seriesName && (
              <span className="text-[12px] font-bold text-black-3 uppercase tracking-[1.2px] hidden sm:block">
                {seriesName}
              </span>
            )}
            <ShareMessageButton title={message.title} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`container-standard pt-2 pb-20 ${hasRightColumn ? "grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10" : "max-w-4xl mx-auto"}`}>
        {/* ── Left column: Video + Metadata ── */}
        <div>
          {/* YouTube Embed */}
          {message.hasVideo && message.youtubeId ? (
            <div className="aspect-video rounded-[24px] overflow-hidden bg-black-1 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <iframe
                src={`https://www.youtube.com/embed/${message.youtubeId}`}
                title={message.videoTitle || message.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : message.hasVideo && message.videoUrl ? (
            <div className="aspect-video rounded-[24px] overflow-hidden bg-black-1 shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]">
              <iframe
                src={toEmbedUrl(message.videoUrl)}
                title={message.videoTitle || message.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-[24px] overflow-hidden bg-gradient-to-br from-white-2 to-white-1-5 flex items-center justify-center">
              <div className="text-center">
                <div className="size-16 mx-auto rounded-full bg-white-2-5/60 flex items-center justify-center mb-3">
                  <IconBookOpen className="size-7 text-black-3/40" />
                </div>
                <p className="text-[14px] text-black-3">No video available</p>
              </div>
            </div>
          )}

          {/* Series badge + Date */}
          <div className={`flex items-center gap-4 mt-8 ${!hasRightColumn ? "justify-center" : ""}`}>
            {seriesName && (
              <span className="bg-accent-blue text-white-0 text-[12px] font-bold uppercase tracking-[0.6px] px-3 py-1 rounded-[10px]">
                {seriesName}
              </span>
            )}
            <div className="flex items-center gap-2">
              <IconCalendar className="size-3 text-black-3" />
              <span className="text-[14px] font-bold text-black-3 uppercase tracking-wide">
                {formatDate(message.dateFor)}
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className={`text-[36px] md:text-[48px] font-black leading-[1.15] tracking-[-0.85px] text-black-1 uppercase mt-4 text-balance ${!hasRightColumn ? "text-center" : ""}`}>
            {message.videoTitle || message.title}
          </h1>

          {/* Passage + Speaker */}
          <div className={`flex flex-col gap-1 mt-4 pb-6 border-b border-white-2 ${!hasRightColumn ? "items-center text-center" : ""}`}>
            {message.passage && (
              <p className="text-[18px] font-bold text-black-1 tracking-[-0.44px]">
                {message.passage}
              </p>
            )}
            {speakerName && (
              <p className="text-[16px] text-black-3 tracking-[-0.31px]">
                Message by{" "}
                <span className="font-bold text-black-1">{speakerName}</span>
              </p>
            )}
          </div>

          {/* Duration */}
          {message.duration && (
            <p className={`text-[14px] text-black-3 mt-4 ${!hasRightColumn ? "text-center" : ""}`}>
              Duration: {message.duration}
            </p>
          )}

          {/* Video Description */}
          {message.videoDescription && (
            <div className="mt-8">
              <p className={`text-[16px] text-black-2 leading-[1.5] tracking-[-0.31px] ${!hasRightColumn ? "text-center" : ""}`}>
                {message.videoDescription}
              </p>
            </div>
          )}

          {/* Attachments — merge message-level JSON attachments + related study DB attachments */}
          {(() => {
            // Message-level attachments (JSON field)
            const msgAttachments = Array.isArray(message.attachments)
              ? (message.attachments as { id: string; name: string; type: string; url?: string }[]).filter((a) => a.url)
              : []
            // Related study attachments (DB relation)
            const studyAttachments = (message.relatedStudy?.attachments ?? []).map((att) => ({
              id: att.id,
              name: att.name,
              type: att.type,
              url: att.url,
            }))
            // De-duplicate by URL
            const seen = new Set<string>()
            const allAttachments = [...msgAttachments, ...studyAttachments].filter((a) => {
              if (!a.url || seen.has(a.url)) return false
              seen.add(a.url)
              return true
            })
            if (allAttachments.length === 0) return null
            return (
              <div className="mt-8 pt-6 border-t border-white-2">
                <h3 className="text-[12px] font-black text-black-3 uppercase tracking-[1.1px] mb-4">
                  Attachments
                </h3>
                <div className="flex flex-col gap-2">
                  {allAttachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-3 rounded-[14px] bg-white-1-5 border border-white-2 px-4 py-3 hover:bg-white-2/60 transition-colors group"
                    >
                      <IconFileText className="size-5 text-accent-blue shrink-0" />
                      <span className="text-[14px] font-medium text-black-1 truncate">
                        {att.name}
                      </span>
                      <span className="ml-auto text-[12px] text-black-3 uppercase shrink-0">
                        {att.type}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* ── Right column: Transcript + Study Guide ── */}
        {hasRightColumn && (
          <aside className="flex flex-col gap-6 lg:sticky lg:top-[96px] h-fit">
            {hasTranscript && (
              <TranscriptPanel
                liveTranscript={liveTranscriptHtml || null}
                rawTranscript={rawTranscriptHtml || null}
              />
            )}

            {/* Study Guide Card — only show when study is published */}
            {hasStudyGuide && message.relatedStudy && (
              <Link
                href={resolveHref(`/bible-study/${message.relatedStudy.slug}`)}
                className="group relative rounded-[24px] bg-white-0 border border-accent-blue/20 overflow-hidden p-5 shadow-[0px_10px_15px_-3px_rgba(28,57,142,0.05),0px_4px_6px_-4px_rgba(28,57,142,0.05)] hover:shadow-[0px_10px_15px_-3px_rgba(28,57,142,0.1)] transition-shadow"
              >
                {/* Blue glow */}
                <div
                  aria-hidden="true"
                  className="absolute -top-12 -right-12 size-24 rounded-full bg-accent-blue/10 blur-[40px]"
                />
                <p className="text-[10px] font-black text-accent-blue uppercase tracking-[1.1px] mb-1">
                  Preparation
                </p>
                <p className="text-[14px] font-bold text-black-1 tracking-[-0.15px] mb-3">
                  Study Guide Available
                </p>
                <div className="flex items-center justify-center gap-2 w-full rounded-[14px] bg-accent-blue text-white-0 py-3 text-[12px] font-bold uppercase tracking-[0.3px] transition-colors group-hover:bg-accent-blue/90">
                  Open Guide
                  <IconArrowRight className="size-4" />
                </div>
              </Link>
            )}
          </aside>
        )}
      </div>
    </main>
  )
}
