/*
 * CMS SETTINGS:
 * ── Content (BASIC) ──
 *   heading: string — "Schedule"
 * ── Buttons (BASIC) ──
 *   ctaButtons[]: { label, href, icon? }
 * ── Animation (ADVANCED) ──
 *   enableAnimations?: boolean (default true) — toggle scroll-reveal animations
 *     Animations: heading fades up on scroll.
 * ── Layout (ADVANCED) ──
 *   paddingY, colorScheme
 *
 * DB SCHEMA: Fetched from events collection
 *   events (id, title, start_date, end_date, time, type, location, slug)
 */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import SectionContainer from "@/components/shared/SectionContainer";
import AnimateOnScroll from "@/components/shared/AnimateOnScroll";
import CTAButton from "@/components/shared/CTAButton";
import EventCalendarGrid from "@/components/shared/EventCalendarGrid";
import EventListItem from "@/components/shared/EventListItem";
import type { EventCalendarSectionProps } from "@/lib/types/sections";
import type { Event } from "@/lib/types/events";
import { toEventListItemData } from "@/lib/types/events";
import {
  IconChevronLeft,
  IconChevronRight,
  IconListView,
  IconCalendar,
} from "@/components/layout/icons";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "calendar";
type FilterType = "all" | "event" | "meeting" | "program";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "event", label: "Events" },
  { value: "meeting", label: "Meetings" },
  { value: "program", label: "Programs" },
];

export default function EventCalendarSection(props: {
  settings: EventCalendarSectionProps;
  events: Event[];
}) {
  const { settings, events } = props;
  const { content } = settings;
  const animate = settings.enableAnimations !== false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  /* ── Filtered events ── */
  const filteredEvents = useMemo(() => {
    let filtered = events;
    if (activeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === activeFilter);
    }
    return filtered;
  }, [events, activeFilter]);

  /* ── Events for current month (list view), sorted ascending by date ── */
  const monthEvents = useMemo(() => {
    const monthStr = String(currentMonth + 1).padStart(2, "0");
    const yearStr = String(currentYear);
    return filteredEvents
      .filter((e) => {
        const start = e.dateStart;
        const end = e.dateEnd || e.dateStart;
        const monthStart = `${yearStr}-${monthStr}-01`;
        const monthEnd = `${yearStr}-${monthStr}-31`;
        return start <= monthEnd && end >= monthStart;
      })
      .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
  }, [filteredEvents, currentMonth, currentYear]);

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const upcomingMonthName = new Date(
    currentYear,
    currentMonth,
    1,
  ).toLocaleDateString("en-US", { month: "long" });

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  return (
    <SectionContainer settings={settings} className="!pt-0 !pb-24 lg:!pb-30">
      <div className="flex flex-col gap-10">
        {/* Schedule heading */}
        <AnimateOnScroll animation="fade-up" enabled={animate}>
          <h2 className="text-h2 text-black-1">{content.heading}</h2>
        </AnimateOnScroll>

        {/* Calendar/List container */}
        <div className="flex flex-col gap-5">
          {/* Header row: month toggle + view toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Month navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={goToPrevMonth}
                className="flex size-8 items-center justify-center rounded-full border border-white-2 text-black-2 transition-colors hover:bg-white-1-5"
                aria-label="Previous month"
              >
                <IconChevronLeft className="size-4" />
              </button>
              <h3 className="min-w-[180px] text-center text-[16px] font-medium uppercase tracking-wide text-black-1">
                {monthLabel}
              </h3>
              <button
                onClick={goToNextMonth}
                className="flex size-8 items-center justify-center rounded-full border border-white-2 text-black-2 transition-colors hover:bg-white-1-5"
                aria-label="Next month"
              >
                <IconChevronRight className="size-4" />
              </button>
            </div>

            {/* List / Month toggle */}
            <div className="flex rounded-[14px] bg-white-2 p-1">
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[14px] font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-white-0 text-black-1 shadow-sm"
                    : "text-black-3 hover:text-black-2",
                )}
              >
                <IconListView className="size-4" />
                <span>List</span>
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[14px] font-medium transition-colors",
                  viewMode === "calendar"
                    ? "bg-white-0 text-black-1 shadow-sm"
                    : "text-black-3 hover:text-black-2",
                )}
              >
                <IconCalendar className="size-4" />
                <span>Month</span>
              </button>
            </div>
          </div>

          {/* Filter pills + upcoming count */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium tracking-wide transition-colors",
                    activeFilter === filter.value
                      ? "bg-black-1 text-white-0"
                      : "bg-white-2 text-black-3 hover:bg-white-2-5 hover:text-black-2",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {viewMode === "list" && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[14px] text-black-3">
                  Upcoming in {upcomingMonthName}
                </span>
                <span className="flex size-[26px] items-center justify-center rounded-full bg-black-1 text-[12px] font-medium text-white-0">
                  {monthEvents.length}
                </span>
              </div>
            )}
          </div>

          {/* Content: List or Calendar */}
          {viewMode === "list" ? (
            <EventListView events={monthEvents} filteredAll={filteredEvents} />
          ) : (
            <EventCalendarGrid events={filteredEvents} month={currentMonth} year={currentYear} />
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {content.ctaButtons.map((btn) => (
            <CTAButton
              key={btn.label}
              label={btn.label}
              href={btn.href}
              variant={btn.icon ? "primary" : "secondary"}
              target={btn.href.startsWith("http") ? "_blank" : undefined}
              rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
              icon={
                btn.icon ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="ml-2"
                  >
                    <path
                      d="M5 13l8-8M13 5v8M13 5H5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}

/* ── List view with UPCOMING / RECURRING groups ── */

const UPCOMING_LIMIT = 5;
const RECURRING_LIMIT = 3;

function EventListView({
  events,
  filteredAll,
}: {
  events: Event[];
  filteredAll: Event[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];

  // Sort ascending by dateStart (soonest first), only future/today events
  const upcomingEvents = events
    .filter((e) => !e.isRecurring && e.dateStart >= todayISO)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart));

  const recurringEvents = filteredAll
    .filter((e) => e.isRecurring)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart));

  const totalUpcoming = upcomingEvents.length;
  const totalRecurring = recurringEvents.length;
  const shownUpcoming = upcomingEvents.slice(0, UPCOMING_LIMIT);
  const shownRecurring = recurringEvents.slice(0, RECURRING_LIMIT);
  const moreUpcoming = totalUpcoming - UPCOMING_LIMIT;
  const moreRecurring = totalRecurring - RECURRING_LIMIT;

  const hasUpcoming = upcomingEvents.length > 0;
  const hasRecurring = recurringEvents.length > 0;

  if (!hasUpcoming && !hasRecurring) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-body-2 text-black-3">No events this month.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* UPCOMING group */}
      {hasUpcoming && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className="text-body-1 text-black-3 uppercase tracking-wide">
              Upcoming
            </p>
            <span className="flex size-[22px] items-center justify-center rounded-full bg-black-1 text-[11px] font-medium text-white-0">
              {totalUpcoming}
            </span>
          </div>
          <div className="relative">
            <div className="flex flex-col border-t border-white-2-5">
              {shownUpcoming.map((event) => {
                const data = toEventListItemData(event);
                return <EventListItem key={event.slug} data={data} />;
              })}
            </div>
            {moreUpcoming > 0 && (
              <div className="relative -mt-4">
                <div className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-white-1 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between rounded-[12px] border border-white-2-5 bg-white-0 px-4 py-3">
                  <span className="text-[14px] text-black-3">
                    {moreUpcoming} more upcoming event{moreUpcoming !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href="/events"
                    className="text-[14px] font-medium text-black-1 hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RECURRING group */}
      {hasRecurring && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className="text-body-1 text-black-3 uppercase tracking-wide">
              Recurring
            </p>
            <span className="flex size-[22px] items-center justify-center rounded-full bg-black-1 text-[11px] font-medium text-white-0">
              {totalRecurring}
            </span>
          </div>
          <div className="relative">
            <div className="flex flex-col border-t border-white-2-5">
              {shownRecurring.map((event) => {
                const data = toEventListItemData(event);
                return <EventListItem key={event.slug} data={data} />;
              })}
            </div>
            {moreRecurring > 0 && (
              <div className="relative -mt-4">
                <div className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-white-1 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between rounded-[12px] border border-white-2-5 bg-white-0 px-4 py-3">
                  <span className="text-[14px] text-black-3">
                    {moreRecurring} more recurring event{moreRecurring !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href="/events"
                    className="text-[14px] font-medium text-black-1 hover:underline"
                  >
                    View all
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
