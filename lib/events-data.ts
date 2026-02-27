import type { ContentStatus } from "@/lib/status"

export type EventType = "event" | "meeting" | "program"

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly" | "weekday" | "custom"

export type MonthlyRecurrenceType = "day-of-month" | "day-of-week"

export type LocationType = "in-person" | "online"

export type DayOfWeek = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat"

export type RecurrenceEndType = "never" | "on-date" | "after"

export type CustomRecurrence = {
  interval: number
  days: DayOfWeek[]
  endType: RecurrenceEndType
  endDate?: string
  endAfter?: number
}

/* ── Ministry & Campus types (aligned with website) ── */

export type MinistryTag =
  | "young-adult"
  | "adult"
  | "children"
  | "high-school"
  | "church-wide"

export type CampusTag =
  | "lbcc"
  | "csulb"
  | "csuf"
  | "ucla"
  | "usc"
  | "csudh"
  | "ccc"
  | "mt-sac"
  | "golden-west"
  | "cypress"
  | "cal-poly-pomona"
  | "all"

export type EventLink = {
  label: string
  href: string
  external?: boolean
}

export type ChurchEvent = {
  id: string
  slug: string
  title: string
  type: EventType
  date: string
  endDate: string
  startTime: string
  endTime: string
  recurrence: Recurrence
  recurrenceDays: DayOfWeek[]
  recurrenceEndType: RecurrenceEndType
  recurrenceEndDate?: string
  customRecurrence?: CustomRecurrence
  locationType: LocationType
  location: string
  address?: string
  directionsUrl?: string
  meetingUrl?: string
  monthlyType?: MonthlyRecurrenceType
  ministry: MinistryTag
  campus?: CampusTag
  status: ContentStatus
  isFeatured: boolean
  // Detail fields
  shortDescription?: string
  description?: string
  welcomeMessage?: string
  contacts?: string[]
  coverImage?: string
  imageAlt?: string
  tags: string[]
  registrationUrl?: string
  links: EventLink[]
}

export const eventTypeDisplay: Record<EventType, string> = {
  event: "Event",
  meeting: "Meeting",
  program: "Program",
}

export const recurrenceDisplay: Record<Recurrence, string> = {
  none: "Does not repeat",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  weekday: "Weekday (Mon\u2013Fri)",
  custom: "Custom",
}

export const ministryOptions: { value: MinistryTag; label: string }[] = [
  { value: "young-adult", label: "Young Adult" },
  { value: "adult", label: "Adult" },
  { value: "children", label: "Children" },
  { value: "high-school", label: "Middle & High School" },
  { value: "church-wide", label: "Church-wide" },
]

export const ministryDisplay: Record<MinistryTag, string> = {
  "young-adult": "Young Adult",
  adult: "Adult",
  children: "Children",
  "high-school": "Middle & High School",
  "church-wide": "Church-wide",
}

export const campusOptions: { value: CampusTag; label: string }[] = [
  { value: "all", label: "All Campuses" },
  { value: "lbcc", label: "LBCC" },
  { value: "csulb", label: "CSULB" },
  { value: "csuf", label: "CSUF" },
  { value: "ucla", label: "UCLA" },
  { value: "usc", label: "USC" },
  { value: "csudh", label: "CSUDH" },
  { value: "ccc", label: "CCC" },
  { value: "mt-sac", label: "Mt. SAC" },
  { value: "golden-west", label: "Golden West" },
  { value: "cypress", label: "Cypress" },
  { value: "cal-poly-pomona", label: "Cal Poly Pomona" },
]

export const dayLabels: Record<DayOfWeek, { short: string; full: string }> = {
  sun: { short: "S", full: "Sunday" },
  mon: { short: "M", full: "Monday" },
  tue: { short: "T", full: "Tuesday" },
  wed: { short: "W", full: "Wednesday" },
  thu: { short: "T", full: "Thursday" },
  fri: { short: "F", full: "Friday" },
  sat: { short: "S", full: "Saturday" },
}

export const allDays: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

/** Common tag suggestions for the tag input */
export const tagSuggestions = [
  "#YAM",
  "#HBF",
  "#JBF",
  "#BIBLE STUDY",
  "#WORSHIP",
  "#FELLOWSHIP",
  "#OUTREACH",
  "#CONFERENCE",
  "#CAMPUS",
  "#RECURRING",
  "#OPEN EVENT",
  "#PRAYER",
  "#DEVOTIONAL",
  "#DISCIPLESHIP",
  "#CHILDREN",
] as const

/* ── Helper: generate slug from title ── */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/* ── Helper: compute recurrence schedule label ── */
export function computeRecurrenceSchedule(event: ChurchEvent): string | undefined {
  if (event.recurrence === "none") return undefined

  const dayFull: Record<DayOfWeek, string> = {
    sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday",
    thu: "Thursday", fri: "Friday", sat: "Saturday",
  }

  const days = event.recurrence === "custom"
    ? event.customRecurrence?.days ?? []
    : event.recurrenceDays

  const endSuffix = event.recurrenceEndType === "on-date" && event.recurrenceEndDate
    ? ` (until ${event.recurrenceEndDate})`
    : ""

  if (event.recurrence === "daily") {
    return `Daily${endSuffix}`
  }

  if (event.recurrence === "weekday") {
    return `Weekday (Mon\u2013Fri)${endSuffix}`
  }

  if (event.recurrence === "weekly") {
    if (days.length === 0) return `Weekly${endSuffix}`
    if (days.length === 1) return `Every ${dayFull[days[0]]}${endSuffix}`
    return `Weekly on ${days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}${endSuffix}`
  }

  if (event.recurrence === "monthly") {
    return `Monthly${endSuffix}`
  }

  if (event.recurrence === "yearly") {
    return `Yearly${endSuffix}`
  }

  if (event.recurrence === "custom" && event.customRecurrence) {
    const cr = event.customRecurrence
    const dayStr = cr.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
    return `Every ${cr.interval} week(s) on ${dayStr}${endSuffix}`
  }

  return undefined
}
