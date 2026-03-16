/*
 * EventCalendarGrid -- Interactive month calendar with Google-Calendar-style event blocks
 *
 * Features:
 * - Full month grid (Sun-Sat) with optional external month control
 * - Desktop: colored rectangular blocks spanning multi-day ranges
 * - Mobile: colored dots per day cell, tap to open day popover
 * - Collision detection & vertical stacking for overlapping events (desktop)
 * - Fixed row heights with per-day "+N more" overflow (desktop)
 * - Click an event block to open a popover with quick info
 * - "View Full Details" CTA in popover links to /events/[slug]
 *
 * Props:
 *   events -- array of CalendarEvent objects
 *   month/year -- optional controlled month/year from parent (hides internal nav)
 *
 * Used by: AllEventsSection (uncontrolled), EventCalendarSection (controlled by parent)
 */
"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconMapPin,
  IconClose,
  IconArrowRight,
} from "@/components/website/shared/icons"
import Link from "next/link"
import { resolveHref } from "@/lib/website/resolve-href"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"]

/* Color tokens per event type */
const TYPE_BLOCK_COLORS: Record<string, string> = {
  meeting: "bg-accent-green text-white-0",
  event: "bg-accent-blue text-white-0",
  program: "bg-black-3 text-white-0",
}

/* Subtle/faint colors for recurring events */
const TYPE_BLOCK_COLORS_RECURRING: Record<string, string> = {
  meeting: "bg-accent-green/20 text-accent-green",
  event: "bg-accent-blue/20 text-accent-blue",
  program: "bg-black-3/15 text-black-3",
}

const TYPE_PILL_COLORS: Record<string, string> = {
  meeting: "bg-accent-green",
  event: "bg-accent-blue",
  program: "bg-black-3",
}

const TYPE_PILL_COLORS_RECURRING: Record<string, string> = {
  meeting: "bg-accent-green/40",
  event: "bg-accent-blue/40",
  program: "bg-black-3/30",
}

/* ---- Types ---- */

interface CalendarEvent {
  slug: string
  title: string
  dateStart: string
  dateEnd?: string
  time: string
  timeStart?: string
  type: string
  location?: string
  description?: string
  isRecurring?: boolean
  recurrenceSchedule?: string
  recurrenceDays?: string[]
  meetingUrl?: string
}

interface CalendarDay {
  date: number
  key: string // YYYY-MM-DD
  isCurrentMonth: boolean
  isToday: boolean
  dayOfWeek: number // 0=Sun
}

interface EventSpan {
  event: CalendarEvent
  startCol: number // 0-6 within the week
  span: number // columns to occupy
  row: number // stacking row
  isContinuation: boolean // starts from a prior week
  isContinued: boolean // extends into next week
}

/* Desktop constants */
const MAX_VISIBLE_ROWS = 3
const EVENT_ROW_H = 26
const FIXED_EVENT_AREA_H = MAX_VISIBLE_ROWS * EVENT_ROW_H + 20

/* Mobile: max dots to show per day */
const MOBILE_MAX_DOTS = 3

/* ---- Hook ---- */

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [breakpoint])
  return isMobile
}

/* ---- Component ---- */

interface EventCalendarGridProps {
  events: CalendarEvent[]
  /** When provided with `year`, the grid uses these instead of internal state and hides its own nav. */
  month?: number
  year?: number
}

export default function EventCalendarGrid({ events: rawEvents, month: controlledMonth, year: controlledYear }: EventCalendarGridProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isMobile = useIsMobile()

  // Normalize: resolver provides `timeStart`, but component uses `time`
  const events = useMemo(() =>
    rawEvents.map((e) => ({ ...e, time: e.time || e.timeStart || "" })),
    [rawEvents],
  )

  const isControlled = controlledMonth !== undefined && controlledYear !== undefined

  const [internalMonth, setInternalMonth] = useState(today.getMonth())
  const [internalYear, setInternalYear] = useState(today.getFullYear())

  const activeMonth = isControlled ? controlledMonth : internalMonth
  const activeYear = isControlled ? controlledYear : internalYear

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [expandedDayKey, setExpandedDayKey] = useState<string | null>(null)
  // "all" = show all events + recurring for that day, "recurring" = only recurring meetings
  const [expandedDayMode, setExpandedDayMode] = useState<"all" | "recurring">("all")
  const popoverRef = useRef<HTMLDivElement>(null)
  const dayPopoverRef = useRef<HTMLDivElement>(null)

  // Close event popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSelectedEvent(null)
      }
    }
    if (selectedEvent) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedEvent])

  // Close day popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dayPopoverRef.current && !dayPopoverRef.current.contains(e.target as Node)) {
        setExpandedDayKey(null)
      }
    }
    if (expandedDayKey) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [expandedDayKey])

  /* ---- Calendar grid computation ---- */
  const calendarDays = useMemo(() => {
    const firstDay = new Date(activeYear, activeMonth, 1)
    const lastDay = new Date(activeYear, activeMonth + 1, 0)
    const startWeekday = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: CalendarDay[] = []

    // Previous month padding
    const prevMonthLast = new Date(activeYear, activeMonth, 0).getDate()
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthLast - i
      const prevMonth = activeMonth === 0 ? 11 : activeMonth - 1
      const prevYear = activeMonth === 0 ? activeYear - 1 : activeYear
      const key = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      days.push({ date: d, key, isCurrentMonth: false, isToday: false, dayOfWeek: days.length % 7 })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${activeYear}-${String(activeMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      const isToday2 =
        d === today.getDate() &&
        activeMonth === today.getMonth() &&
        activeYear === today.getFullYear()
      days.push({ date: d, key, isCurrentMonth: true, isToday: isToday2, dayOfWeek: days.length % 7 })
    }

    // Next month padding
    const remaining = 7 - (days.length % 7)
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextMonth = activeMonth === 11 ? 0 : activeMonth + 1
        const nextYear = activeMonth === 11 ? activeYear + 1 : activeYear
        const key = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        days.push({ date: d, key, isCurrentMonth: false, isToday: false, dayOfWeek: days.length % 7 })
      }
    }

    return days
  }, [activeMonth, activeYear, today])

  // Chunk into weeks
  const weeks = useMemo(() => {
    const result: CalendarDay[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  /* ---- Expand recurring events into per-day synthetic entries ---- */
  const expandedEvents = useMemo(() => {
    const DAY_MAP: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 }
    const nonRecurring = events.filter((e) => !e.isRecurring)
    const recurring = events.filter((e) => e.isRecurring && e.recurrenceDays && e.recurrenceDays.length > 0)

    const synthetics: CalendarEvent[] = []
    if (calendarDays.length === 0) return nonRecurring

    for (const evt of recurring) {
      const targetDays = new Set(evt.recurrenceDays!.map((d) => DAY_MAP[d]).filter((n) => n !== undefined))
      for (const day of calendarDays) {
        const dayDate = new Date(day.key + "T00:00:00")
        if (targetDays.has(dayDate.getDay())) {
          synthetics.push({
            ...evt,
            slug: `${evt.slug}--${day.key}`,
            dateStart: day.key,
            dateEnd: undefined,
          })
        }
      }
    }

    return [...nonRecurring, ...synthetics]
  }, [events, calendarDays])

  /* ---- Non-recurring expanded events (for desktop event blocks) ---- */
  const nonRecurringExpandedEvents = useMemo(() => {
    return expandedEvents.filter((e) => !e.isRecurring)
  }, [expandedEvents])

  /* ---- Build event spans per week (desktop only — non-recurring events as blocks) ---- */
  const weekEventSpans = useMemo(() => {
    return weeks.map((week) => {
      const weekStartKey = week[0].key
      const weekEndKey = week[6].key

      const overlapping = nonRecurringExpandedEvents.filter((evt) => {
        const evtStart = evt.dateStart
        const evtEnd = evt.dateEnd || evt.dateStart
        return evtStart <= weekEndKey && evtEnd >= weekStartKey
      })

      const spans: Omit<EventSpan, "row">[] = overlapping.map((evt) => {
        const evtStart = evt.dateStart
        const evtEnd = evt.dateEnd || evt.dateStart
        const clampedStart = evtStart < weekStartKey ? weekStartKey : evtStart
        const clampedEnd = evtEnd > weekEndKey ? weekEndKey : evtEnd
        const startCol = week.findIndex((d) => d.key === clampedStart)
        const endCol = week.findIndex((d) => d.key === clampedEnd)
        const span = endCol - startCol + 1

        return {
          event: evt,
          startCol: startCol === -1 ? 0 : startCol,
          span: span < 1 ? 1 : span,
          isContinuation: evtStart < weekStartKey,
          isContinued: evtEnd > weekEndKey,
        }
      })

      spans.sort((a, b) => {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol
        return b.span - a.span
      })

      const rows: boolean[][] = []
      const placed: EventSpan[] = []

      for (const s of spans) {
        let rowIndex = 0
        let isPlaced = false

        while (!isPlaced) {
          if (!rows[rowIndex]) rows[rowIndex] = new Array(7).fill(false)

          let collision = false
          for (let c = s.startCol; c < s.startCol + s.span; c++) {
            if (rows[rowIndex][c]) {
              collision = true
              break
            }
          }

          if (!collision) {
            for (let c = s.startCol; c < s.startCol + s.span; c++) {
              rows[rowIndex][c] = true
            }
            placed.push({ ...s, row: rowIndex })
            isPlaced = true
          } else {
            rowIndex++
          }
        }
      }

      const dayOverflows: number[] = Array(7).fill(0)
      const hiddenSpans = placed.filter((s) => s.row >= MAX_VISIBLE_ROWS)
      for (const s of hiddenSpans) {
        for (let c = s.startCol; c < s.startCol + s.span; c++) {
          dayOverflows[c]++
        }
      }

      return { spans: placed, dayOverflows }
    })
  }, [weeks, nonRecurringExpandedEvents])

  /* ---- Per-day event map (for mobile dots) ---- */
  const dayEventsMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const day of calendarDays) {
      const dayEvents = expandedEvents.filter((e) => {
        const end = e.dateEnd || e.dateStart
        return e.dateStart <= day.key && end >= day.key
      })
      if (dayEvents.length > 0) {
        map[day.key] = dayEvents
      }
    }
    return map
  }, [calendarDays, expandedEvents])

  /* ---- Recurring events per day (for desktop dot clusters) ---- */
  const dayRecurringMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const day of calendarDays) {
      const recurring = expandedEvents.filter((e) => {
        if (!e.isRecurring) return false
        const end = e.dateEnd || e.dateStart
        return e.dateStart <= day.key && end >= day.key
      })
      if (recurring.length > 0) {
        map[day.key] = recurring
      }
    }
    return map
  }, [calendarDays, expandedEvents])

  /* ---- Events for expanded day ---- */
  const expandedDayEvents = useMemo(() => {
    if (!expandedDayKey) return []
    const allForDay = expandedEvents
      .filter((e) => {
        const end = e.dateEnd || e.dateStart
        return e.dateStart <= expandedDayKey && end >= expandedDayKey
      })
      .sort((a, b) => a.time.localeCompare(b.time))
    if (expandedDayMode === "recurring") {
      return allForDay.filter((e) => e.isRecurring)
    }
    return allForDay
  }, [expandedEvents, expandedDayKey, expandedDayMode])

  const expandedDayLabel = expandedDayKey
    ? new Date(expandedDayKey + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : ""

  /* ---- Internal navigation (only used when uncontrolled) ---- */
  const monthLabel = new Date(activeYear, activeMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  )

  function goToPrevMonth() {
    setSelectedEvent(null)
    setExpandedDayKey(null)
    if (internalMonth === 0) {
      setInternalMonth(11)
      setInternalYear((y) => y - 1)
    } else {
      setInternalMonth((m) => m - 1)
    }
  }

  function goToNextMonth() {
    setSelectedEvent(null)
    setExpandedDayKey(null)
    if (internalMonth === 11) {
      setInternalMonth(0)
      setInternalYear((y) => y + 1)
    } else {
      setInternalMonth((m) => m + 1)
    }
  }

  function goToToday() {
    setSelectedEvent(null)
    setExpandedDayKey(null)
    setInternalMonth(today.getMonth())
    setInternalYear(today.getFullYear())
  }

  const dayHeaders = isMobile ? WEEKDAYS_SHORT : WEEKDAYS

  return (
    <div className="flex flex-col gap-4">
      {/* Month navigation -- only shown when grid controls its own month */}
      {!isControlled && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={goToPrevMonth}
              className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-white-2 text-black-2 transition-colors hover:bg-white-1-5"
              aria-label="Previous month"
            >
              <IconChevronLeft className="size-4" />
            </button>
            <h3 className="text-[16px] sm:text-[20px] font-medium text-black-1 min-w-[160px] sm:min-w-[200px] text-center">
              {monthLabel}
            </h3>
            <button
              onClick={goToNextMonth}
              className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-white-2 text-black-2 transition-colors hover:bg-white-1-5"
              aria-label="Next month"
            >
              <IconChevronRight className="size-4" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="text-[13px] sm:text-[14px] font-medium text-accent-blue hover:underline"
          >
            Today
          </button>
        </div>
      )}

      {/* Calendar grid */}
      <div className="rounded-[16px] sm:rounded-[20px] border border-white-2-5 bg-white-0 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white-2">
          {dayHeaders.map((day, i) => (
            <div
              key={`${day}-${i}`}
              className="py-2 sm:py-3 text-center text-[11px] sm:text-[13px] font-medium text-black-3 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, weekIndex) => {
          const { spans, dayOverflows } = weekEventSpans[weekIndex]
          const visibleSpans = spans.filter((s) => s.row < MAX_VISIBLE_ROWS)

          return (
            <div
              key={weekIndex}
              className="relative border-b border-white-2/50 last:border-b-0"
              style={!isMobile ? { minHeight: `${44 + FIXED_EVENT_AREA_H}px` } : undefined}
            >
              {/* Day cells */}
              <div className="grid grid-cols-7">
                {week.map((day) => {
                  const dayEvents = dayEventsMap[day.key] || []
                  const dotEvents = dayEvents.slice(0, MOBILE_MAX_DOTS)
                  const overflowCount = dayEvents.length - MOBILE_MAX_DOTS
                  const hasAnyEvents = dayEvents.length > 0

                  const cellClickHandler = hasAnyEvents
                    ? () => { setExpandedDayMode("all"); setExpandedDayKey(day.key) }
                    : undefined

                  return (
                    <div
                      key={day.key}
                      onClick={cellClickHandler}
                      role={hasAnyEvents ? "button" : undefined}
                      tabIndex={hasAnyEvents ? 0 : undefined}
                      onKeyDown={hasAnyEvents ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cellClickHandler?.() } } : undefined}
                      className={`border-r border-white-2/50 last:border-r-0 ${
                        !day.isCurrentMonth ? "bg-white-1-5" : ""
                      } ${isMobile ? "px-0.5 pt-1.5 pb-2" : "px-2 pt-2 pb-1"} ${
                        hasAnyEvents ? "cursor-pointer transition-colors hover:bg-white-1-5/80" : ""
                      }`}
                    >
                      {/* Day number */}
                      <span
                        className={`flex items-center justify-center rounded-full text-[12px] sm:text-[14px] mx-auto ${
                          isMobile ? "size-6" : "size-7"
                        } ${
                          day.isToday
                            ? "bg-black-1 text-white-0 font-medium"
                            : day.isCurrentMonth
                              ? "text-black-1"
                              : "text-black-3/40"
                        }`}
                      >
                        {day.date}
                      </span>

                      {/* Desktop: recurring meeting dot clusters (visual indicator only) */}
                      {!isMobile && (() => {
                        const recurringForDay = dayRecurringMap[day.key]
                        if (!recurringForDay || recurringForDay.length === 0) return null
                        const MAX_DOTS = 2
                        const visibleDots = recurringForDay.slice(0, MAX_DOTS)
                        const extraCount = recurringForDay.length - MAX_DOTS
                        return (
                          <div
                            className="flex items-center justify-center mt-0.5 gap-0"
                            title={`${recurringForDay.length} recurring meeting${recurringForDay.length !== 1 ? "s" : ""}`}
                          >
                            <span className="flex items-center -space-x-1">
                              {visibleDots.map((evt, i) => (
                                <span
                                  key={`${evt.slug}-dot-${i}`}
                                  className={`size-[8px] rounded-full border border-white-0 ${
                                    TYPE_PILL_COLORS[evt.type] ?? "bg-black-3"
                                  }`}
                                />
                              ))}
                            </span>
                            {extraCount > 0 && (
                              <span className="text-[9px] font-medium text-black-3 leading-none ml-0.5">
                                +{extraCount}
                              </span>
                            )}
                          </div>
                        )
                      })()}

                      {/* Mobile: colored dots below day number (visual indicator only) */}
                      {isMobile && dayEvents.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center gap-[3px] mt-1">
                          {dotEvents.map((evt, i) => (
                            <span
                              key={`${evt.slug}-${i}`}
                              className={`size-[6px] rounded-full ${
                                evt.isRecurring
                                  ? (TYPE_PILL_COLORS_RECURRING[evt.type] ?? "bg-black-3/30")
                                  : (TYPE_PILL_COLORS[evt.type] ?? "bg-black-3")
                              }`}
                            />
                          ))}
                          {overflowCount > 0 && (
                            <span className="text-[8px] font-medium text-black-3 leading-none">
                              +{overflowCount}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Desktop: Event blocks layer */}
              {!isMobile && (
                <div className="relative w-full" style={{ height: `${FIXED_EVENT_AREA_H}px` }}>
                  {/* Background column separators — also clickable to open day popover */}
                  <div className="absolute inset-0 grid grid-cols-7">
                    {week.map((day) => {
                      const dayEvents = dayEventsMap[day.key] || []
                      const hasAnyEvents = dayEvents.length > 0
                      return (
                        <div
                          key={day.key}
                          onClick={hasAnyEvents ? () => { setExpandedDayMode("all"); setExpandedDayKey(day.key) } : undefined}
                          className={`border-r border-white-2/50 last:border-r-0 ${
                            !day.isCurrentMonth ? "bg-white-1-5" : ""
                          } ${hasAnyEvents ? "cursor-pointer" : ""}`}
                        />
                      )
                    })}
                  </div>

                  {/* Positioned event spans */}
                  {visibleSpans.map((s, i) => {
                    const isRecurring = s.event.isRecurring
                    const blockColors = isRecurring
                      ? (TYPE_BLOCK_COLORS_RECURRING[s.event.type] ?? "bg-black-3/15 text-black-3")
                      : (TYPE_BLOCK_COLORS[s.event.type] ?? "bg-black-3 text-white-0")
                    return (
                    <button
                      key={`${s.event.slug}-${weekIndex}-${i}`}
                      onClick={() => setSelectedEvent(s.event)}
                      className={`absolute h-[22px] rounded px-2 text-[11px] font-medium leading-[22px] truncate cursor-pointer transition-all hover:brightness-90 z-10 ${blockColors} ${s.isContinuation ? "rounded-l-none" : ""} ${s.isContinued ? "rounded-r-none" : ""}`}
                      style={{
                        top: `${s.row * EVENT_ROW_H + 2}px`,
                        left: `calc(${(s.startCol / 7) * 100}% + 2px)`,
                        width: `calc(${(s.span / 7) * 100}% - 4px)`,
                      }}
                    >
                      {!s.isContinuation && (
                        <>
                          <span className="opacity-75">{s.event.time.split(" - ")[0]}</span>{" "}
                          {s.event.title}
                        </>
                      )}
                      {s.isContinuation && s.event.title}
                    </button>
                    )
                  })}

                  {/* Per-day overflow indicators */}
                  {dayOverflows.map((count, colIndex) =>
                    count > 0 ? (
                      <button
                        key={`overflow-${colIndex}`}
                        onClick={() => { setExpandedDayMode("all"); setExpandedDayKey(week[colIndex].key) }}
                        className="absolute text-[11px] font-medium text-accent-blue hover:underline cursor-pointer z-10"
                        style={{
                          top: `${MAX_VISIBLE_ROWS * EVENT_ROW_H + 2}px`,
                          left: `calc(${(colIndex / 7) * 100}% + 4px)`,
                        }}
                      >
                        +{count} more
                      </button>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Event detail popover/modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black-1/40 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />
          <div
            ref={popoverRef}
            className="relative w-full max-w-[480px] bg-white-0 rounded-[24px] shadow-[0px_24px_48px_rgba(0,0,0,0.15)] p-6 sm:p-8 z-10"
          >
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 sm:top-5 right-4 sm:right-5 flex size-8 items-center justify-center rounded-full text-black-3 transition-colors hover:bg-white-2 hover:text-black-1"
              aria-label="Close"
            >
              <IconClose className="size-5" />
            </button>

            <span
              className={`inline-block text-white-0 text-[12px] tracking-[0.24px] font-medium px-3 py-1 rounded-full uppercase mb-4 ${TYPE_PILL_COLORS[selectedEvent.type] ?? "bg-black-3"}`}
            >
              {selectedEvent.type}
            </span>

            <h3 className="text-h3 text-black-1 mb-1 pr-8">
              {selectedEvent.title}
            </h3>

            <p className="text-body-2 text-black-3 mb-5">
              {new Date(selectedEvent.dateStart + "T00:00:00").toLocaleDateString(
                "en-US",
                { weekday: "long", month: "long", day: "numeric" },
              )}
              {selectedEvent.dateEnd && (
                <>
                  {" — "}
                  {new Date(selectedEvent.dateEnd + "T00:00:00").toLocaleDateString(
                    "en-US",
                    { weekday: "long", month: "long", day: "numeric" },
                  )}
                </>
              )}
            </p>

            <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-accent-blue/10">
                  <IconClock className="size-4 text-accent-blue" />
                </div>
                <span className="text-body-1 text-black-1">
                  {selectedEvent.time.split(" - ")[0]}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-accent-blue/10">
                  <IconMapPin className="size-4 text-accent-blue" />
                </div>
                <span className="text-body-1 text-black-1">
                  {selectedEvent.location}
                </span>
              </div>
            </div>

            <p className="text-body-2 text-black-2 mb-6 line-clamp-3">
              {selectedEvent.description}
            </p>

            <Link
              href={resolveHref(`/events/${selectedEvent.slug}`)}
              className="flex items-center justify-center gap-2 w-full rounded-full bg-black-1 text-white-1 py-4 text-button-1 transition-colors hover:bg-black-2"
            >
              VIEW FULL DETAILS
              <IconArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Day events popover */}
      {expandedDayKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black-1/20 backdrop-blur-sm"
            onClick={() => setExpandedDayKey(null)}
          />
          <div
            ref={dayPopoverRef}
            className="relative w-full max-w-[360px] bg-white-0 rounded-[20px] shadow-[0px_24px_48px_rgba(0,0,0,0.15)] p-5 sm:p-6 z-10"
          >
            <button
              onClick={() => setExpandedDayKey(null)}
              className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full text-black-3 transition-colors hover:bg-white-2 hover:text-black-1"
              aria-label="Close"
            >
              <IconClose className="size-4" />
            </button>

            <h4 className="text-[16px] font-medium text-black-1 mb-1 pr-8">
              {expandedDayLabel}
            </h4>
            <p className="text-[12px] text-black-3 mb-3">
              {expandedDayEvents.length} event{expandedDayEvents.length !== 1 ? "s" : ""}
            </p>

            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
              {expandedDayEvents.map((evt) => (
                <button
                  key={evt.slug}
                  onClick={() => {
                    setExpandedDayKey(null)
                    setSelectedEvent(evt)
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white-1-5"
                >
                  <span
                    className={`size-2.5 rounded-full shrink-0 ${
                      evt.isRecurring
                        ? (TYPE_PILL_COLORS_RECURRING[evt.type] ?? "bg-black-3/30")
                        : (TYPE_PILL_COLORS[evt.type] ?? "bg-black-3")
                    }`}
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13px] font-medium text-black-1 truncate">
                      {evt.title}
                    </span>
                    <span className="text-[12px] text-black-3">
                      {evt.time.split(" - ")[0]}
                      {evt.location && ` · ${evt.location}`}
                      {" · "}
                      <span className="capitalize">{evt.type}</span>
                      {evt.isRecurring && " (recurring)"}
                    </span>
                  </div>
                </button>
              ))}
              {expandedDayEvents.length === 0 && (
                <p className="text-[13px] text-black-3 py-2">No events</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
