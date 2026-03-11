/*
 * CMS SETTINGS (per card):
 * - title: string -- event name
 * - date: string -- formatted date/time string
 * - location: string -- venue name
 * - imageUrl: string -- card background image
 * - badge: string -- optional badge text (e.g. "UPCOMING")
 * - href: string -- link to event detail page
 * Size: 'large' (590x500 primary) or 'small' (590x240 secondary)
 */
import { cn } from "@/lib/utils"
import Image from "next/image"
import { resolveHref } from "@/lib/website/resolve-href"
import EventBadge from "./event-badge"
import ArrowButton from "./arrow-button"

interface EventCardData {
  title: string
  date: string
  location?: string
  imageUrl?: string
  imageAlt?: string
  imageObjectPosition?: string
  badge?: string
  href?: string
}

export default function EventCard({ data, size, className }: { data: EventCardData; size: "large" | "small"; className?: string }) {
  return (
    <a
      href={resolveHref(data.href)}
      className={cn(
        "group relative block overflow-hidden rounded-xl bg-black-1 h-full",
        size === "large" ? "min-h-[280px]" : "min-h-[240px] sm:min-h-[280px] lg:h-[240px]",
        className
      )}
    >
      {data.imageUrl ? (
        <Image
          src={data.imageUrl}
          alt={data.imageAlt ?? data.title}
          fill
          className="object-cover transition-transform duration-500 ease-smooth group-hover:scale-105"
          style={{ objectPosition: data.imageObjectPosition }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#1a1a2e]">
          {/* Mesh gradient backdrop */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 60% 50% at 15% 80%, rgba(99,102,241,0.25) 0%, transparent 70%),' +
                'radial-gradient(ellipse 50% 60% at 85% 20%, rgba(168,85,247,0.2) 0%, transparent 70%),' +
                'radial-gradient(ellipse 40% 40% at 50% 50%, rgba(59,130,246,0.12) 0%, transparent 60%)',
            }}
          />
          {/* Subtle noise texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />
          {/* Calendar icon watermark */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] text-white/[0.06] transition-all duration-500 group-hover:text-white/[0.09] group-hover:scale-110"
            style={{ width: size === "large" ? "40%" : "35%", height: "auto" }}
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between p-6 lg:p-8">
        <div className="flex flex-col gap-3">
          {data.badge && <EventBadge label={data.badge} />}
          <div className="flex flex-col gap-2">
            <h3 className="text-h4 font-medium text-white-1">
              {data.title}
            </h3>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-body-3 text-white-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                  <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.4A6.41 6.41 0 013.6 10 6.41 6.41 0 0110 3.6 6.41 6.41 0 0116.4 10 6.41 6.41 0 0110 16.4zm.4-10.4H9.2v5l4.4 2.6.6-1-3.8-2.2V6z" fill="currentColor" />
                </svg>
                <span>{data.date}</span>
              </div>
              {data.location && (
                <div className="flex items-center gap-2 text-body-3 text-white-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                    <path d="M10 2C6.69 2 4 4.69 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.31-2.69-6-6-6zm0 8.2a2.2 2.2 0 110-4.4 2.2 2.2 0 010 4.4z" fill="currentColor" />
                  </svg>
                  <span>{data.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="hidden lg:block shrink-0">
          <ArrowButton size={56} />
        </div>
      </div>
    </a>
  )
}
