"use client"

import Image from "next/image"
import Link from "next/link"
import { resolveHref } from "@/lib/website/resolve-href"
import { IconClock, IconMapPin } from "@/components/website/shared/icons"
import { formatTime } from "@/lib/website/format-time"

interface EventGridCardEvent {
  slug: string
  title: string
  type: string
  dateStart: string
  dateEnd?: string
  timeStart: string
  location: string
  thumbnailUrl?: string
  isFeatured: boolean
  isRecurring?: boolean
  recurrenceSchedule?: string
  image?: { src: string; alt: string; objectPosition?: string }
}

function getEventBadge(event: EventGridCardEvent): string | null {
  if (event.isFeatured) return "FEATURED"
  return null
}

const fmtDate = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

export default function EventGridCard({ event }: { event: EventGridCardEvent }) {
  const badge = getEventBadge(event)

  const imageSrc = event.image?.src ?? event.thumbnailUrl
  const imageAlt = event.image?.alt ?? event.title

  return (
    <Link
      href={resolveHref(`/events/${event.slug}`)}
      className="group flex flex-col bg-white-0 rounded-[20px] border border-white-2-5 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.05)] overflow-clip transition-shadow hover:shadow-[0px_16px_32px_0px_rgba(0,0,0,0.10)] h-full"
    >
      {/* Image */}
      <div className="relative h-[160px] w-full overflow-clip shrink-0 bg-white-2">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: event.image?.objectPosition }}
          />
        ) : (
          <div className="w-full h-full bg-[#1a1a2e]">
            <div
              className="absolute inset-0 opacity-80"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 60% 50% at 15% 80%, rgba(99,102,241,0.25) 0%, transparent 70%),' +
                  'radial-gradient(ellipse 50% 60% at 85% 20%, rgba(168,85,247,0.2) 0%, transparent 70%),' +
                  'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(59,130,246,0.12) 0%, transparent 60%)',
              }}
            />
            {/* Calendar icon watermark */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] text-white/[0.06]"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        )}
        {badge && (
          <span className="absolute top-4 right-4 bg-black-1 border-[0.5px] border-white-2 text-white-1 text-[12px] tracking-[0.24px] font-medium leading-none px-5 py-3 rounded-full uppercase">
            {badge}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-3 pt-[18px] pb-5 px-5 lg:px-7 flex-1">
        {/* Type + Title */}
        <div className="flex flex-col gap-3 items-start">
          <span
            className={`text-white-1 text-[12px] tracking-[0.24px] font-medium leading-none px-2 py-1.5 rounded-lg uppercase ${
              event.type === "meeting"
                ? "bg-accent-green"
                : event.type === "event"
                  ? "bg-accent-blue"
                  : "bg-black-3"
            }`}
          >
            {event.type}
          </span>

          <p className="text-[16px] lg:text-[20px] font-medium text-black-1 leading-none tracking-[-0.4px] truncate w-full pb-0.5">
            {event.title}
          </p>
        </div>

        {/* Time & Location */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconClock className="size-4 text-black-2 shrink-0" />
            <span className="text-body-3 text-black-2">
              {event.isRecurring && event.recurrenceSchedule ? (
                event.recurrenceSchedule
              ) : (
                <>
                  {fmtDate(event.dateStart)}
                  {event.dateEnd && event.dateEnd !== event.dateStart && (
                    <> – {fmtDate(event.dateEnd)}</>
                  )}
                  {formatTime(event.timeStart) && (
                    <> @ {formatTime(event.timeStart)}</>
                  )}
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconMapPin className="size-4 text-black-2 shrink-0" />
            <span className="text-body-3 text-black-2 line-clamp-1">
              {event.location}
            </span>
          </div>
        </div>

      </div>
    </Link>
  )
}
