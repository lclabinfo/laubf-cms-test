"use client";

import Image from "next/image";
import Link from "next/link";
import type { Event } from "@/lib/types/events";
import { getEventBadge } from "@/lib/types/events";
import { IconClock, IconMapPin } from "@/components/layout/icons";

const MAX_VISIBLE_TAGS = 3;

export default function EventGridCard({ event }: { event: Event }) {
  const badge = getEventBadge(event);
  const visibleTags = event.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = event.tags.length - MAX_VISIBLE_TAGS;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col bg-white-0 rounded-[20px] border border-white-2-5 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.05)] overflow-clip transition-shadow hover:shadow-[0px_16px_32px_0px_rgba(0,0,0,0.10)] h-full"
    >
      {/* Image */}
      <div className="relative h-[160px] w-full overflow-clip shrink-0 bg-white-2">
        {event.image.src ? (
          <Image
            src={event.image.src}
            alt={event.image.alt}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ objectPosition: event.image.objectPosition }}
          />
        ) : (
          <div className="w-full h-full bg-white-2" />
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
              {new Date(event.dateStart + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "short", month: "short", day: "numeric" },
              )}{" "}
              @ {event.time.split(" - ")[0]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconMapPin className="size-4 text-black-2 shrink-0" />
            <span className="text-body-3 text-black-2 line-clamp-1">
              {event.location}
            </span>
          </div>
        </div>

        {/* Tags — pinned to bottom edge */}
        {event.tags.length > 0 && (
          <div className="flex items-center justify-between mt-auto pt-1">
            <div className="flex gap-2 items-center overflow-clip flex-1 min-w-0">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="shrink-0 bg-white-2 text-black-3 text-[12px] tracking-[0.24px] font-medium leading-none text-center px-2 py-1.5 rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
            {overflowCount > 0 && (
              <span className="shrink-0 bg-white-2 text-black-3 text-[12px] tracking-[0.24px] font-medium leading-none text-center px-2 py-1.5 rounded-lg ml-2">
                +{overflowCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
