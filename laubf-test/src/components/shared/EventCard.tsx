/*
 * CMS SETTINGS (per card):
 * - title: string — event name
 * - date: string — formatted date/time string
 * - location: string — venue name
 * - imageUrl: string — card background image
 * - badge: string — optional badge text (e.g. "UPCOMING")
 * - href: string — link to event detail page
 * Size: 'large' (590×500 primary) or 'small' (590×240 secondary)
 */
import type { EventCardProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import Image from "next/image";
import EventBadge from "./EventBadge";
import ArrowButton from "./ArrowButton";

export default function EventCard({ data, size, className }: EventCardProps) {
  return (
    <a
      href={data.href ?? "#"}
      className={cn(
        "group relative block overflow-hidden rounded-xl bg-black-1 h-full",
        size === "large" ? "min-h-[280px]" : "min-h-[280px] lg:h-[240px]",
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
        <div className="absolute inset-0 bg-white-2" />
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="shrink-0"
                >
                  <path
                    d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.4A6.41 6.41 0 013.6 10 6.41 6.41 0 0110 3.6 6.41 6.41 0 0116.4 10 6.41 6.41 0 0110 16.4zm.4-10.4H9.2v5l4.4 2.6.6-1-3.8-2.2V6z"
                    fill="currentColor"
                  />
                </svg>
                <span>{data.date}</span>
              </div>
              {data.location && (
                <div className="flex items-center gap-2 text-body-3 text-white-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M10 2C6.69 2 4 4.69 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.31-2.69-6-6-6zm0 8.2a2.2 2.2 0 110-4.4 2.2 2.2 0 010 4.4z"
                      fill="currentColor"
                    />
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
  );
}
