"use client"

import { useState, useRef, useEffect } from "react"
import { IconShare, IconCalendar } from "@/components/website/shared/icons"

interface EventData {
  title: string
  dateStart: string // ISO date string e.g. "2026-05-17"
  dateEnd?: string | null
  startTime?: string | null // e.g. "7:00 PM" or "19:00"
  endTime?: string | null
  location?: string | null
  shortDescription?: string | null
  coverImage?: string | null
  // Recurrence
  isRecurring?: boolean
  recurrence?: string | null // "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "WEEKDAY" | "CUSTOM" | "NONE"
  recurrenceDays?: string[] | null // ["MON", "TUE", ...] for WEEKLY
  recurrenceEndType?: string | null // "NEVER" | "ON_DATE" | "AFTER"
  recurrenceEndDate?: string | null // ISO date string
  recurrenceEndAfter?: number | null
}

/* ── Helpers ── */

/** Convert "7:00 PM" or "19:00" to { hours, minutes } in 24h */
function parseTime(time: string): { hours: number; minutes: number } | null {
  if (!time) return null
  // Try 24h format first (HH:MM)
  const match24 = time.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) {
    return { hours: parseInt(match24[1]), minutes: parseInt(match24[2]) }
  }
  // Try 12h format (H:MM AM/PM)
  const match12 = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (match12) {
    let hours = parseInt(match12[1])
    const minutes = parseInt(match12[2])
    const period = match12[3].toUpperCase()
    if (period === "PM" && hours !== 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0
    return { hours, minutes }
  }
  return null
}

/** Map recurrence day abbreviations to iCal BYDAY values */
const DAY_MAP: Record<string, string> = {
  SUN: "SU", MON: "MO", TUE: "TU", WED: "WE", THU: "TH", FRI: "FR", SAT: "SA",
}

/** Map JS getDay() (0=Sun) to our day codes */
const JS_DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

/**
 * For recurring events, compute the effective start date:
 * - If dateStart is today or in the future, use it as-is
 * - Otherwise, find the next valid occurrence day from today
 */
function getEffectiveStartDate(event: EventData): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(event.dateStart + "T00:00:00")
  start.setHours(0, 0, 0, 0)

  if (!event.isRecurring || start >= today) return event.dateStart

  // Recurring event with a past start date — use next valid day
  if (event.recurrenceDays && event.recurrenceDays.length > 0) {
    // Find next day that matches one of the recurrence days
    const validDays = new Set(event.recurrenceDays)
    const candidate = new Date(today)
    for (let i = 0; i < 7; i++) {
      const dayCode = JS_DAY_CODES[candidate.getDay()]
      if (validDays.has(dayCode)) {
        return candidate.toISOString().split("T")[0]
      }
      candidate.setDate(candidate.getDate() + 1)
    }
  }

  // Fallback: use today
  return today.toISOString().split("T")[0]
}

/**
 * Build an iCalendar RRULE string from event recurrence data.
 * Returns null if the event is not recurring.
 */
function buildRRule(event: EventData): string | null {
  if (!event.isRecurring || !event.recurrence || event.recurrence === "NONE") return null

  const parts: string[] = []

  switch (event.recurrence) {
    case "DAILY":
      parts.push("FREQ=DAILY")
      break
    case "WEEKLY":
      parts.push("FREQ=WEEKLY")
      if (event.recurrenceDays && event.recurrenceDays.length > 0) {
        const byDay = event.recurrenceDays.map((d) => DAY_MAP[d] || d).join(",")
        parts.push(`BYDAY=${byDay}`)
      }
      break
    case "MONTHLY":
      parts.push("FREQ=MONTHLY")
      break
    case "YEARLY":
      parts.push("FREQ=YEARLY")
      break
    case "WEEKDAY":
      parts.push("FREQ=WEEKLY")
      parts.push("BYDAY=MO,TU,WE,TH,FR")
      break
    default:
      return null
  }

  if (event.recurrenceEndType === "ON_DATE" && event.recurrenceEndDate) {
    parts.push(`UNTIL=${event.recurrenceEndDate.replace(/-/g, "")}T235959Z`)
  } else if (event.recurrenceEndType === "AFTER" && event.recurrenceEndAfter) {
    parts.push(`COUNT=${event.recurrenceEndAfter}`)
  }

  return parts.join(";")
}

/** Format date as YYYYMMDD for calendar URLs */
function toCalDate(dateStr: string): string {
  return dateStr.replace(/-/g, "")
}

/** Format date+time as YYYYMMDDTHHmmssZ (UTC) for Google Calendar */
function toCalDateTime(dateStr: string, timeStr?: string | null): string {
  const parsed = timeStr ? parseTime(timeStr) : null
  if (parsed) {
    const d = new Date(`${dateStr}T00:00:00`)
    d.setHours(parsed.hours, parsed.minutes, 0, 0)
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  }
  // All-day: just the date
  return toCalDate(dateStr)
}

/** Build Outlook.com calendar URL */
function buildOutlookCalendarUrl(event: EventData): string {
  const params = new URLSearchParams()
  params.set("rru", "addevent")
  params.set("subject", event.title)

  const effectiveDate = getEffectiveStartDate(event)
  const hasTime = !!event.startTime
  // Outlook uses ISO 8601 format
  if (hasTime) {
    const startParsed = parseTime(event.startTime!)
    if (startParsed) {
      const sd = new Date(`${effectiveDate}T00:00:00`)
      sd.setHours(startParsed.hours, startParsed.minutes, 0, 0)
      params.set("startdt", sd.toISOString())

      if (!event.isRecurring && event.dateEnd && event.endTime) {
        const ed = new Date(`${event.dateEnd}T00:00:00`)
        const endParsed = parseTime(event.endTime)!
        ed.setHours(endParsed.hours, endParsed.minutes, 0, 0)
        params.set("enddt", ed.toISOString())
      } else if (event.endTime) {
        const ed = new Date(`${effectiveDate}T00:00:00`)
        const endParsed = parseTime(event.endTime)!
        ed.setHours(endParsed.hours, endParsed.minutes, 0, 0)
        params.set("enddt", ed.toISOString())
      } else {
        const ed = new Date(sd)
        ed.setHours(ed.getHours() + 1)
        params.set("enddt", ed.toISOString())
      }
    }
  } else {
    params.set("startdt", `${effectiveDate}T00:00:00`)
    params.set("enddt", `${effectiveDate}T23:59:00`)
    params.set("allday", "true")
  }

  if (event.location) params.set("location", event.location)
  if (event.shortDescription) params.set("body", event.shortDescription)

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}

/** Build Google Calendar URL */
function buildGoogleCalendarUrl(event: EventData): string {
  const params = new URLSearchParams()
  params.set("action", "TEMPLATE")
  params.set("text", event.title)

  const effectiveDate = getEffectiveStartDate(event)
  const hasTime = !!event.startTime
  const start = toCalDateTime(effectiveDate, event.startTime)

  let end: string
  if (!event.isRecurring && event.dateEnd) {
    end = toCalDateTime(event.dateEnd, event.endTime || event.startTime)
  } else if (event.endTime) {
    end = toCalDateTime(effectiveDate, event.endTime)
  } else if (hasTime) {
    // Default 1 hour duration
    const d = new Date(`${effectiveDate}T00:00:00`)
    const parsed = parseTime(event.startTime!)!
    d.setHours(parsed.hours + 1, parsed.minutes, 0, 0)
    end = d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  } else {
    // All-day: end is next day for Google Calendar
    const d = new Date(effectiveDate)
    d.setDate(d.getDate() + 1)
    end = d.toISOString().split("T")[0].replace(/-/g, "")
  }

  params.set("dates", `${start}/${end}`)
  if (event.location) params.set("location", event.location)
  if (event.shortDescription) params.set("details", event.shortDescription)

  // Add recurrence rule
  const rrule = buildRRule(event)
  if (rrule) params.set("recur", `RRULE:${rrule}`)

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** Build .ics file content */
function buildIcsContent(event: EventData, url: string): string {
  const uid = `${event.dateStart}-${event.title.replace(/\s+/g, "-").toLowerCase()}@event`
  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")

  const effectiveDate = getEffectiveStartDate(event)
  const hasTime = !!event.startTime
  let dtStart: string
  let dtEnd: string

  if (hasTime) {
    dtStart = `DTSTART:${toCalDateTime(effectiveDate, event.startTime)}`
    if (!event.isRecurring && event.dateEnd) {
      dtEnd = `DTEND:${toCalDateTime(event.dateEnd, event.endTime || event.startTime)}`
    } else if (event.endTime) {
      dtEnd = `DTEND:${toCalDateTime(effectiveDate, event.endTime)}`
    } else {
      const d = new Date(`${effectiveDate}T00:00:00`)
      const parsed = parseTime(event.startTime!)!
      d.setHours(parsed.hours + 1, parsed.minutes, 0, 0)
      dtEnd = `DTEND:${d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`
    }
  } else {
    // All-day event
    dtStart = `DTSTART;VALUE=DATE:${toCalDate(effectiveDate)}`
    const endDate = new Date(effectiveDate)
    endDate.setDate(endDate.getDate() + 1)
    dtEnd = `DTEND;VALUE=DATE:${endDate.toISOString().split("T")[0].replace(/-/g, "")}`
  }

  const rrule = buildRRule(event)

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DigitalChurch//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStart,
    dtEnd,
    rrule ? `RRULE:${rrule}` : "",
    `SUMMARY:${escapeIcs(event.title)}`,
    event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
    event.shortDescription ? `DESCRIPTION:${escapeIcs(event.shortDescription)}` : "",
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)

  return lines.join("\r\n")
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n")
}

function downloadIcs(event: EventData, url: string) {
  const content = buildIcsContent(event, url)
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `${event.title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/* ── Component ── */

export default function EventActions({ event, shareUrl }: { event: EventData; shareUrl?: string }) {
  const [calOpen, setCalOpen] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalOpen(false)
      }
    }
    if (calOpen) {
      document.addEventListener("mousedown", handleClick)
      return () => document.removeEventListener("mousedown", handleClick)
    }
  }, [calOpen])

  // Build URL from window.location to ensure we always use the full current page URL
  const currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.origin + window.location.pathname : "")

  function handleGoogleCalendar() {
    window.open(buildGoogleCalendarUrl(event), "_blank", "noopener,noreferrer")
    setCalOpen(false)
  }

  function handleOutlookCalendar() {
    window.open(buildOutlookCalendarUrl(event), "_blank", "noopener,noreferrer")
    setCalOpen(false)
  }

  function handleAppleCalendar() {
    downloadIcs(event, currentUrl)
    setCalOpen(false)
  }

  async function handleShare() {
    const shareText = `I'd love for you to join us for ${event.title}! Here are the details:`
    const shareData = {
      title: event.title,
      text: shareText,
      url: currentUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2000)
        return // Only return on successful share
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return // User cancelled — exit silently
        // Other error — fall through to clipboard fallback
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${currentUrl}`)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    } catch {
      // Ignore clipboard errors
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add to Calendar */}
      <div className="relative" ref={calRef}>
        <button
          onClick={() => setCalOpen(!calOpen)}
          className="flex items-center justify-center gap-2.5 w-full rounded-full bg-black-1 text-white-1 py-4 text-button-1 transition-colors hover:bg-black-2"
        >
          <IconCalendar className="size-[18px]" />
          Add to Calendar
        </button>

        {/* Dropdown */}
        {calOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white-0 border border-white-2-5 rounded-[14px] shadow-[0px_12px_24px_rgba(0,0,0,0.1)] overflow-hidden z-20">
            <button
              onClick={handleGoogleCalendar}
              className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-black-1 hover:bg-white-1-5 transition-colors text-left"
            >
              <GoogleIcon />
              Google Calendar
            </button>
            <button
              onClick={handleOutlookCalendar}
              className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-black-1 hover:bg-white-1-5 transition-colors text-left border-t border-white-2/50"
            >
              <OutlookIcon />
              Outlook
            </button>
            <button
              onClick={handleAppleCalendar}
              className="flex items-center gap-3 w-full px-4 py-3 text-[14px] text-black-1 hover:bg-white-1-5 transition-colors text-left border-t border-white-2/50"
            >
              <AppleIcon />
              Apple Calendar
            </button>
          </div>
        )}
      </div>

      {/* Share Event */}
      <div className="relative">
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2.5 w-full rounded-full border border-white-2-5 bg-white-0 text-black-1 py-4 text-button-1 transition-colors hover:bg-white-1-5"
        >
          <IconShare className="size-[18px]" />
          Share Event
        </button>

        {/* Copied toast */}
        {shareToast && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-black-1 text-white-0 text-[12px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg">
            Link copied!
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Inline SVG icons for dropdown ── */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function OutlookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 0 1-.588.234h-8.522v-12.7h8.522c.234 0 .43.08.588.234A.778.778 0 0 1 24 6.8v.587z" fill="#0364B8" />
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 0 1-.588.234h-8.522V5.975h8.522c.234 0 .43.08.588.234A.778.778 0 0 1 24 6.8v.587zM16.956 5.975V18.4l-2.304.825L1.044 15.3A.482.482 0 0 1 .7 14.843V4.413c0-.156.05-.29.15-.4a.502.502 0 0 1 .369-.19L14.652 0l2.304 5.975z" fill="#0A2767" />
      <path d="M14.652 5.975h-5.87v3.261l5.87 2.717V5.975z" fill="#28A8EA" />
      <path d="M8.783 5.975H14.652V0L8.783 5.975z" fill="#0078D4" />
      <path d="M14.652 5.975v5.978l2.304 1.087V5.975h-2.304z" fill="#50D9FF" />
      <path d="M14.652 11.953l-5.87-2.717v9.726l5.87 2.717v-9.726z" fill="#0364B8" />
      <path d="M14.652 21.679l2.304-3.279V12.04l-2.304-1.087v10.726z" fill="#0078D4" />
      <path d="M8.783 18.962v2.717l5.87 2.717-.001-2.717-5.87-2.717z" fill="#064A8C" />
      <ellipse cx="5.87" cy="12" rx="4" ry="4.5" fill="#0078D4" />
      <path d="M7.5 10.2H5.1c-.83 0-1.5.15-1.5.7v2.2c0 .55.67 1 1.5 1H7.5c.83 0 1.5-.45 1.5-1V10.9c0-.55-.67-.7-1.5-.7z" fill="white" fillOpacity="0.9" />
    </svg>
  )
}
