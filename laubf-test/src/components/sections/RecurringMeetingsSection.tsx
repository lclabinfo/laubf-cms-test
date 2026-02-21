/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (e.g. "Recurring Meetings & Programs")
 *   maxVisible?: number (default 4) -- max items before "View all" overflow
 *   viewAllHref?: string (default "/events") -- destination for overflow link
 * -- Data --
 *   events: Event[] -- recurring events from database (filtered by isRecurring)
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: recurring_meetings_sections (id, heading, max_visible, view_all_href, visible, color_scheme)
 * Events fetched from events table where is_recurring = true
 *
 * DESIGN SPECS (from Figma):
 *   Section: pt-[40px] pb-[80px], 48px gap between heading and list
 *   Card: bg-white-0, border-white-2-5, rounded-[24px], shadow 0 12 20 rgba(0,0,0,0.03)
 *   Card padding: desktop px-[24px] py-[20px], mobile p-[20px]
 *   Title: 20px medium tracking-[-0.4px], truncate on desktop, wrap on mobile
 *   Buttons: text-button-2 (14px medium tracking-[-0.42px]), sentence case
 *   Join btn: bg-black-1 border-black-1 text-white-1, px-[21px] py-[17px]
 *   View btn: bg-white-1 border-white-2-5 text-black-2, px-[21px] py-[17px]
 *   Logistics: text-body-3 (14px regular tracking-[-0.28px]) text-black-3
 *
 * ITEM LAYOUT (desktop ≥1024px):
 *   [TypePill] [Title ···truncated···]          [Join online meeting] [View detail →]
 *              [📅 schedule] [🕐 time]
 *
 * ITEM LAYOUT (mobile <1024px):
 *   [TypePill] [Title ···truncated···]
 *              [📅 schedule] [🕐 time]
 *   [Join online meeting — flex-1] [View event detail — flex-1]
 */
"use client";

import Link from "next/link";
import SectionContainer from "@/components/shared/SectionContainer";
import TypePill from "@/components/shared/TypePill";
import type { RecurringMeetingsSectionProps } from "@/lib/types/sections";
import type { Event } from "@/lib/types/events";
import {
  IconCalendar,
  IconClock,
  IconVideo,
  IconArrowUpRight,
} from "@/components/layout/icons";

const DEFAULT_MAX_VISIBLE = 4;

export default function RecurringMeetingsSection({
  settings,
  events,
}: {
  settings: RecurringMeetingsSectionProps;
  events: Event[];
}) {
  const { content } = settings;
  const maxVisible = content.maxVisible ?? DEFAULT_MAX_VISIBLE;
  const viewAllHref = content.viewAllHref ?? "/events";

  const recurringEvents = events.filter((e) => e.isRecurring);
  const visibleEvents = recurringEvents.slice(0, maxVisible);
  const overflowCount = recurringEvents.length;
  const hasOverflow = recurringEvents.length > maxVisible;

  return (
    <SectionContainer settings={settings} className="pt-[40px] pb-[80px]">
      {/* Heading — h2 desktop: 48px medium, tracking -1.44px */}
      <h2 className="text-h2 text-black-1 text-center mb-[48px]">
        {content.heading}
      </h2>

      {/* Meeting list — 860px max, 16px gap between cards */}
      <div className="mx-auto max-w-[860px] flex flex-col gap-[16px]">
        {visibleEvents.map((event) => (
          <MeetingItem key={event.slug} event={event} />
        ))}
      </div>

      {/* View all overflow */}
      {hasOverflow && (
        <div className="flex justify-center mt-[32px]">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 text-button-1 text-black-2 transition-colors hover:text-black-1 hover:underline transition-all duration-3000 ease-in-out"
          >
            View all ({overflowCount})
            <IconArrowUpRight className="size-5" />
          </Link>
        </div>
      )}
    </SectionContainer>
  );
}

/* ── Meeting Item Card ─────────────────────────────────────────────── */

function MeetingItem({ event }: { event: Event }) {
  const schedule = event.recurrenceSchedule;
  const hasOnlineMeeting = !!event.meetingUrl;

  return (
    <div className="bg-white-0 border border-white-2-5 rounded-[24px] shadow-[0px_12px_20px_0px_rgba(0,0,0,0.03)]">
      {/* Desktop layout: single row with buttons on right */}
      {/* Mobile layout: content stacked, buttons below */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-[20px] px-[20px] py-[20px] lg:px-[24px]">
        {/* Left: Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-[8px]">
          {/* Header row: TypePill + Title */}
          <div className="flex gap-2 lg:gap-3 items-center justify-center">
            <TypePill type={event.type} className="shrink-0" />
            <Link
              href={`/events/${event.slug}`}
              className="flex-1 min-w-0 text-[16px] lg:text-[18px] font-medium text-black-1 leading-snug tracking-[-0.4px] hover:underline"
            >
              {event.title}
            </Link>
          </div>

          {/* Logistics row: schedule + time */}
          <div className="flex gap-[12px] items-center px-[8px]">
            {schedule && (
              <span className="inline-flex items-center gap-[6px] text-body-2 text-black-3">
                <IconCalendar className="size-[16px] shrink-0" />
                {schedule}
              </span>
            )}
            <span className="inline-flex items-center gap-[6px] text-body-2 text-black-3">
              <IconClock className="size-[16px] shrink-0" />
              {event.time}
            </span>
          </div>
        </div>

        {/* Right: Action buttons */}
        {/* Desktop: inline row, shrink-0 */}
        {/* Mobile: single column, stacked buttons full width */}
        <div className="flex flex-col lg:flex-row gap-[12px] items-stretch lg:items-center lg:shrink-0 w-full lg:w-auto">
          {hasOnlineMeeting && (
            <a
              href={event.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full lg:w-auto flex-1 lg:flex-initial inline-flex items-center justify-center gap-[8px] rounded-full bg-black-1 border border-black-1 px-[21px] py-[17px] text-button-2 text-white-1 whitespace-nowrap transition-colors hover:bg-black-2 hover:border-black-2"
            >
              <IconVideo className="size-[14px]" />
              Join online meeting
            </a>
          )}
          <Link
            href={`/events/${event.slug}`}
            className="w-full lg:w-auto flex-1 lg:flex-initial inline-flex items-center justify-center gap-[8px] rounded-full bg-white-1 border border-white-2-5 px-[21px] py-[17px] text-button-2 text-black-2 whitespace-nowrap transition-colors hover:bg-white-2"
          >
            View detail
            <IconArrowUpRight className="size-[14px]" />
          </Link>
        </div>
      </div>
    </div>
  );
}
