"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import SectionContainer from "@/components/website/shared/section-container"
import AnimateOnScroll from "@/components/website/shared/animate-on-scroll"
import CTAButton from "@/components/website/shared/cta-button"
import EventCalendarGrid from "@/components/website/shared/event-calendar-grid"
import EventListItem from "@/components/website/shared/event-list-item"
import {
  IconChevronLeft,
  IconChevronRight,
  IconListView,
  IconCalendar,
} from "@/components/website/shared/icons"
import { cn } from "@/lib/utils"
import { resolveHref } from "@/lib/website/resolve-href"
import { themeTokens, isDarkScheme, type SectionTheme } from "@/components/website/shared/theme-tokens"
import { formatTime } from "@/lib/website/format-time"

interface Event {
  slug: string
  title: string
  dateStart: string
  dateEnd?: string
  time?: string
  timeStart?: string
  type: string
  location?: string
  description?: string
  isRecurring?: boolean
  recurrenceSchedule?: string
  recurrenceDays?: string[]
  meetingUrl?: string
}

type ViewMode = "list" | "calendar"
type FilterType = "all" | "event" | "meeting" | "program"

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "event", label: "Events" },
  { value: "meeting", label: "Meetings" },
  { value: "program", label: "Programs" },
]

interface EventCalendarContent {
  heading: string
  ctaButtons: { label: string; href: string; icon?: boolean }[]
}

interface Props {
  content: EventCalendarContent
  enableAnimations: boolean
  colorScheme?: SectionTheme
  paddingY?: "none" | "compact" | "default" | "spacious"
  containerWidth?: "standard" | "narrow" | "full"
  events?: Event[]
}

export default function EventCalendarSection({ content, enableAnimations, colorScheme = "light", paddingY, containerWidth, events: rawEvents = [] }: Props) {
  const animate = enableAnimations !== false
  const t = themeTokens[colorScheme]
  const dark = isDarkScheme(colorScheme)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Normalize: resolver provides `timeStart`, but component uses `time`
  const events = useMemo(() =>
    rawEvents.map((e) => ({ ...e, time: e.time || e.timeStart || "" })),
    [rawEvents],
  )

  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const filteredEvents = useMemo(() => {
    let filtered = events
    if (activeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === activeFilter)
    }
    return filtered
  }, [events, activeFilter])

  const monthEvents = useMemo(() => {
    const monthStr = String(currentMonth + 1).padStart(2, "0")
    const yearStr = String(currentYear)
    return filteredEvents
      .filter((e) => {
        const start = e.dateStart
        const end = e.dateEnd || e.dateStart
        const monthStart = `${yearStr}-${monthStr}-01`
        const monthEnd = `${yearStr}-${monthStr}-31`
        return start <= monthEnd && end >= monthStart
      })
      .sort((a, b) => a.dateStart.localeCompare(b.dateStart))
  }, [filteredEvents, currentMonth, currentYear])

  const monthLabel = new Date(currentYear, currentMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  )

  const upcomingMonthName = new Date(
    currentYear,
    currentMonth,
    1,
  ).toLocaleDateString("en-US", { month: "long" })

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  return (
    <SectionContainer colorScheme={colorScheme} paddingY={paddingY} containerWidth={containerWidth}>
      <div className="flex flex-col gap-6">
        {/* Schedule heading */}
        <AnimateOnScroll animation="fade-up" enabled={animate}>
          <h2 className={cn("text-h2", t.textPrimary)}>{content.heading}</h2>
        </AnimateOnScroll>

        {/* Calendar/List container */}
        <div className="flex flex-col gap-5">
          {/* Header row: view toggle (left) + month nav (right, calendar only) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* List / Month toggle */}
            <div className={cn("flex rounded-[14px] p-1", dark ? "bg-white/10" : "bg-black/5")}>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[14px] font-medium transition-colors",
                  viewMode === "list"
                    ? cn(dark ? "bg-white/15 shadow-sm" : "bg-white shadow-sm", t.textPrimary)
                    : cn(t.textMuted, dark ? "hover:text-white-2" : "hover:text-black-2"),
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
                    ? cn(dark ? "bg-white/15 shadow-sm" : "bg-white shadow-sm", t.textPrimary)
                    : cn(t.textMuted, dark ? "hover:text-white-2" : "hover:text-black-2"),
                )}
              >
                <IconCalendar className="size-4" />
                <span>Month</span>
              </button>
            </div>

            {/* Month navigation — only visible in calendar view */}
            {viewMode === "calendar" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPrevMonth}
                  className={cn("flex size-8 items-center justify-center rounded-full border transition-colors", t.borderColor, t.textSecondary, dark ? "hover:bg-white/5" : "hover:bg-black/5")}
                  aria-label="Previous month"
                >
                  <IconChevronLeft className="size-4" />
                </button>
                <h3 className={cn("min-w-[180px] text-center text-[16px] font-medium uppercase tracking-wide", t.textPrimary)}>
                  {monthLabel}
                </h3>
                <button
                  onClick={goToNextMonth}
                  className={cn("flex size-8 items-center justify-center rounded-full border transition-colors", t.borderColor, t.textSecondary, dark ? "hover:bg-white/5" : "hover:bg-black/5")}
                  aria-label="Next month"
                >
                  <IconChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>

          {/* Filter pills + recurring toggle + upcoming count */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium tracking-wide transition-colors",
                    activeFilter === filter.value
                      ? cn(t.btnPrimaryBg, t.btnPrimaryText)
                      : cn(dark ? "bg-white/10 hover:bg-white/15" : "bg-black/5 hover:bg-black/10", t.textMuted, dark ? "hover:text-white-2" : "hover:text-black-2"),
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {viewMode === "calendar" && (
              <div className="hidden sm:flex items-center gap-2">
                <span className={cn("text-[14px]", t.textMuted)}>
                  Events in {upcomingMonthName}
                </span>
                <span className={cn("flex size-[26px] items-center justify-center rounded-full text-[12px] font-medium", t.btnPrimaryBg, t.btnPrimaryText)}>
                  {monthEvents.length}
                </span>
              </div>
            )}
          </div>

          {/* Content: List or Calendar */}
          {viewMode === "list" ? (
            <EventListView events={filteredEvents} filteredAll={filteredEvents} colorScheme={colorScheme} />
          ) : (
            <EventCalendarGrid events={filteredEvents} month={currentMonth} year={currentYear} />
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {(content.ctaButtons ?? []).map((btn) => (
            <CTAButton
              key={btn.label}
              label={btn.label}
              href={btn.href}
              variant={btn.icon ? "primary" : "secondary"}
              target={btn.href.startsWith("http") ? "_blank" : undefined}
              rel={btn.href.startsWith("http") ? "noopener noreferrer" : undefined}
              icon={
                btn.icon ? (
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="ml-2">
                    <path d="M5 13l8-8M13 5v8M13 5H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : undefined
              }
            />
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}

/* ── List view with UPCOMING / RECURRING groups ── */

const UPCOMING_LIMIT = 5
const RECURRING_LIMIT = 4

function EventListView({
  events,
  filteredAll,
  colorScheme,
}: {
  events: Event[]
  filteredAll: Event[]
  colorScheme: SectionTheme
}) {
  const t = themeTokens[colorScheme]
  const dark = isDarkScheme(colorScheme)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString().split("T")[0]

  const upcomingEvents = events
    .filter((e) => !e.isRecurring && e.dateStart >= todayISO)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))

  const recurringEvents = filteredAll
    .filter((e) => e.isRecurring)
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart))

  const totalUpcoming = upcomingEvents.length
  const totalRecurring = recurringEvents.length
  const shownUpcoming = upcomingEvents.slice(0, UPCOMING_LIMIT)
  const shownRecurring = recurringEvents.slice(0, RECURRING_LIMIT)
  const moreUpcoming = totalUpcoming - UPCOMING_LIMIT
  const moreRecurring = totalRecurring - RECURRING_LIMIT

  const hasUpcoming = upcomingEvents.length > 0
  const hasRecurring = recurringEvents.length > 0

  if (!hasUpcoming && !hasRecurring) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className={cn("text-body-2", t.textMuted)}>No upcoming events.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* UPCOMING group */}
      {hasUpcoming && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p className={cn("text-body-1 uppercase tracking-wide", t.textMuted)}>
              Upcoming
            </p>
            <span className={cn("flex size-[22px] items-center justify-center rounded-full text-[11px] font-medium", t.btnPrimaryBg, t.btnPrimaryText)}>
              {totalUpcoming}
            </span>
          </div>
          <div className="relative">
            <div className={cn("flex flex-col border-t", t.borderSubtle)}>
              {shownUpcoming.map((event) => (
                <EventListItem
                  key={event.slug}
                  data={{
                    title: event.title,
                    dateStart: new Date(event.dateStart + "T00:00:00"),
                    dateEnd: event.dateEnd ? new Date(event.dateEnd + "T00:00:00") : undefined,
                    time: formatTime(event.time),
                    type: event.type,
                    href: resolveHref(`/events/${event.slug}`),
                    recurrenceSchedule: event.recurrenceSchedule,
                  }}
                />
              ))}
            </div>
            {moreUpcoming > 0 && (
              <div className="relative -mt-4">
                <div className={cn("absolute inset-x-0 -top-16 h-16 pointer-events-none", dark ? "bg-gradient-to-t from-black-1 to-transparent" : "bg-gradient-to-t from-white-1 to-transparent")} />
                <div className={cn("relative flex items-center justify-between rounded-[12px] border px-4 py-3", t.borderSubtle, t.surfaceBg)}>
                  <span className={cn("text-[14px]", t.textMuted)}>
                    {moreUpcoming} more upcoming event{moreUpcoming !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={resolveHref("/events")}
                    className={cn("text-[14px] font-medium hover:underline", t.textPrimary)}
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
            <p className={cn("text-body-1 uppercase tracking-wide", t.textMuted)}>
              Recurring
            </p>
            <span className={cn("flex size-[22px] items-center justify-center rounded-full text-[11px] font-medium", t.btnPrimaryBg, t.btnPrimaryText)}>
              {totalRecurring}
            </span>
          </div>
          <div className="relative">
            <div className={cn("flex flex-col border-t", t.borderSubtle)}>
              {shownRecurring.map((event) => (
                <EventListItem
                  key={event.slug}
                  data={{
                    title: event.title,
                    dateStart: new Date(event.dateStart + "T00:00:00"),
                    dateEnd: event.dateEnd ? new Date(event.dateEnd + "T00:00:00") : undefined,
                    time: formatTime(event.time),
                    type: event.type,
                    href: resolveHref(`/events/${event.slug}`),
                    recurrenceSchedule: event.recurrenceSchedule,
                  }}
                />
              ))}
            </div>
            {moreRecurring > 0 && (
              <div className="relative -mt-4">
                <div className={cn("absolute inset-x-0 -top-16 h-16 pointer-events-none", dark ? "bg-gradient-to-t from-black-1 to-transparent" : "bg-gradient-to-t from-white-1 to-transparent")} />
                <div className={cn("relative flex items-center justify-between rounded-[12px] border px-4 py-3", t.borderSubtle, t.surfaceBg)}>
                  <span className={cn("text-[14px]", t.textMuted)}>
                    {moreRecurring} more recurring event{moreRecurring !== 1 ? "s" : ""}
                  </span>
                  <Link
                    href={resolveHref("/events")}
                    className={cn("text-[14px] font-medium hover:underline", t.textPrimary)}
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
  )
}
