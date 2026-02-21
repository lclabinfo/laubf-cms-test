/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   heading: string -- section heading (e.g. "Quick Links")
 *   subtitle?: string -- supporting text
 * -- Data --
 *   meetings: fetched from RECURRING_MEETINGS (Event[])
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: header fades up, meeting cards stagger in.
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: quick_links_sections (id, heading, subtitle, visible, color_scheme)
 * Meetings come from events table WHERE is_recurring = true
 */
"use client";

import { useRef, useState } from "react";
import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import { themeTokens, eventTypeColors, EVENT_TYPE_FALLBACK_COLOR } from "@/lib/theme";
import type { QuickLinksSectionProps } from "@/lib/types/sections";
import type { Event } from "@/lib/types/events";
import {
  IconClock,
  IconCalendar,
  IconLink,
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
} from "@/components/layout/icons";
import Link from "next/link";


export default function QuickLinksSection(props: {
  settings: QuickLinksSectionProps;
  meetings: Event[];
}) {
  const { settings, meetings } = props;
  const { content } = settings;
  const t = themeTokens[settings.colorScheme];
  const animate = settings.enableAnimations !== false;
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <SectionContainer settings={settings}>
      {/* Header — left aligned with nav arrows (arrows desktop only) */}
      <AnimateOnScroll animation="fade-up" enabled={animate} className="flex items-end justify-between mb-8">
        <div>
          <h2 className={`text-h2 ${t.textPrimary}`}>{content.heading}</h2>
          {content.subtitle && (
            <p className={`text-body-1 ${t.textSecondary} mt-2 max-w-[600px]`}>
              {content.subtitle}
            </p>
          )}
        </div>

        {/* Carousel nav arrows — desktop only */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => scrollBy("left")}
            className="flex size-10 items-center justify-center rounded-full border border-white-2 text-black-2 transition-colors hover:bg-white-1-5"
            aria-label="Scroll left"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollBy("right")}
            className="flex size-10 items-center justify-center rounded-full border border-white-2 text-black-2 transition-colors hover:bg-white-1-5"
            aria-label="Scroll right"
          >
            <IconChevronRight className="size-4" />
          </button>
        </div>
      </AnimateOnScroll>

      {/* Desktop: Horizontal scrolling carousel */}
      <div
        ref={scrollRef}
        className="hidden lg:flex gap-5 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-8 px-8 pt-4 -mt-4 pb-10 -mb-10"
      >
        {meetings.map((meeting) => (
          <DesktopMeetingCard key={meeting.slug} meeting={meeting} />
        ))}
      </div>

      {/* Mobile: Compact expandable list */}
      <div className="lg:hidden">
        <MobileQuickLinksList meetings={meetings} />
      </div>
    </SectionContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop card — full card with CTA buttons (unchanged)              */
/* ------------------------------------------------------------------ */

function DesktopMeetingCard({ meeting }: { meeting: Event }) {
  return (
    <div className="min-w-[280px] max-w-[300px] shrink-0 snap-start bg-white-0 rounded-[20px] border border-white-2-5 shadow-[0px_12px_20px_0px_rgba(0,0,0,0.05)] p-6 flex flex-col">
      {/* Type pill */}
      <span
        className={`self-start text-white-0 text-[11px] tracking-[0.24px] font-medium px-2.5 py-0.5 rounded-full uppercase mb-2 ${eventTypeColors[meeting.type] ?? EVENT_TYPE_FALLBACK_COLOR}`}
      >
        {meeting.type}
      </span>

      {/* Title — max 2 lines */}
      <h3 className="text-[18px] font-medium text-black-1 leading-snug line-clamp-2 mb-3">
        {meeting.title}
      </h3>

      {/* Date & time */}
      <div className="flex flex-col gap-1.5 mb-5">
        {meeting.recurrenceSchedule && (
          <div className="flex items-center gap-2">
            <IconCalendar className="size-4 text-black-3 shrink-0" />
            <span className="text-[14px] text-black-2">{meeting.recurrenceSchedule}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <IconClock className="size-4 text-black-3 shrink-0" />
          <span className="text-[14px] text-black-2">{meeting.time}</span>
        </div>
      </div>

      {/* Spacer + actions */}
      <div className="mt-auto flex flex-col gap-2">
        {meeting.meetingUrl && (
          <a
            href={meeting.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-black-1 px-4 py-2.5 text-[14px] font-medium text-white-0 transition-colors hover:bg-black-2"
          >
            <IconLink className="size-4" />
            Join online meeting
          </a>
        )}
        <Link
          href={`/events/${meeting.slug}`}
          className="flex items-center justify-center gap-1 text-[14px] font-medium text-black-2 transition-colors hover:text-black-1 py-2"
        >
          View event detail
          <IconArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile list — compact rows, expandable after 4 items               */
/* ------------------------------------------------------------------ */

const MOBILE_VISIBLE_COUNT = 4;

function MobileQuickLinksList({ meetings }: { meetings: Event[] }) {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = meetings.length > MOBILE_VISIBLE_COUNT;
  const visible = expanded ? meetings : meetings.slice(0, MOBILE_VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-2">
      {visible.map((meeting) => (
        <div
          key={meeting.slug}
          className="flex items-center gap-4 rounded-2xl border border-white-2-5 bg-white-0 px-4 py-4"
        >
          {/* Left: pill, title, date & time — stacked vertically */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* Type pill */}
            <span
              className={`self-start text-white-0 text-[10px] tracking-[0.2px] font-medium px-2 py-0.5 rounded-full uppercase ${eventTypeColors[meeting.type] ?? EVENT_TYPE_FALLBACK_COLOR}`}
            >
              {meeting.type}
            </span>

            {/* Title */}
            <h3 className="text-[15px] font-medium text-black-1 leading-snug truncate">
              {meeting.title}
            </h3>

            {/* Date & time row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {meeting.recurrenceSchedule && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-black-3">
                  <IconCalendar className="size-3 shrink-0" />
                  {meeting.recurrenceSchedule}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[13px] text-black-3">
                <IconClock className="size-3 shrink-0" />
                {meeting.time}
              </span>
            </div>
          </div>

          {/* Right: link button */}
          <a
            href={meeting.meetingUrl ?? `/events/${meeting.slug}`}
            target={meeting.meetingUrl ? "_blank" : undefined}
            rel={meeting.meetingUrl ? "noopener noreferrer" : undefined}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-black-1 text-white-0 transition-colors hover:bg-black-2"
            aria-label={meeting.meetingUrl ? "Join online meeting" : "View event detail"}
          >
            <IconLink className="size-4" />
          </a>
        </div>
      ))}

      {/* Show more / Show less toggle */}
      {needsExpand && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-white-2 py-3 text-[14px] font-medium text-black-3 transition-colors hover:text-black-1 hover:border-black-2"
        >
          <span>{expanded ? "Show less" : `Show ${meetings.length - MOBILE_VISIBLE_COUNT} more`}</span>
          <IconChevronDown
            className={`size-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
