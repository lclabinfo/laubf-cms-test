/*
 * CMS SETTINGS (per list item):
 * - title: string — event name
 * - dateStart: Date — start date
 * - dateEnd: Date — optional end date
 * - time: string — formatted time range
 * - type: 'meeting' | 'event' — determines type pill color
 * - href: string — link to event detail
 */
import type { EventListItemProps } from "@/lib/types/shared";
import { cn } from "@/lib/utils";
import TypePill from "./TypePill";

function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
}

function formatDay(date: Date): string {
  return date.getDate().toString();
}

function formatMobileDate(dateStart: Date, dateEnd?: Date): string {
  const start = dateStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (dateEnd && dateStart.toDateString() !== dateEnd.toDateString()) {
    const end = dateEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${start} – ${end}`;
  }
  return start;
}

export default function EventListItem({
  data,
  className,
}: EventListItemProps) {
  const hasDateRange =
    data.dateEnd &&
    data.dateStart.toDateString() !== data.dateEnd.toDateString();

  return (
    <a
      href={data.href ?? "#"}
      className={cn(
        "group flex items-center gap-4 sm:gap-6 border-b border-border-light py-3 transition-colors hover:bg-white-1-5",
        className
      )}
    >
      {/* Date column — hidden on mobile */}
      <div className="hidden sm:flex items-center gap-0">
        <div className="flex w-12 flex-col items-center">
          <span className="text-pill text-black-3">
            {formatMonth(data.dateStart)}
          </span>
          <span className="text-body-1 font-medium text-black-1">
            {formatDay(data.dateStart)}
          </span>
        </div>
        {hasDateRange && data.dateEnd && (
          <>
            <div className="mx-1 h-[2px] w-2 bg-black-3" />
            <div className="flex w-12 flex-col items-center">
              <span className="text-pill text-black-3">
                {formatMonth(data.dateEnd)}
              </span>
              <span className="text-body-1 font-medium text-black-1">
                {formatDay(data.dateEnd)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Info column */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <TypePill type={data.type} />
            {data.recurrenceSchedule ? (
              <span className="text-body-3 text-black-3 whitespace-nowrap">
                {data.recurrenceSchedule}
              </span>
            ) : (
              <>
                {/* Mobile inline date */}
                <span className="sm:hidden text-body-3 text-black-3 whitespace-nowrap">
                  {formatMobileDate(data.dateStart, data.dateEnd ?? undefined)}
                </span>
              </>
            )}
          </div>
          {/* Time — stacks below pill row on mobile */}
          {!data.recurrenceSchedule && data.time && (
            <span className="text-body-3 text-black-3 whitespace-nowrap">{data.time}</span>
          )}
        </div>
        <p className="text-body-1 text-black-1 line-clamp-1">
          {data.title}
        </p>
      </div>

      {/* Arrow */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0 text-black-3 transition-transform group-hover:translate-x-1"
      >
        <path
          d="M6 3l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
