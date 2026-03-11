import type { ContentStatus } from "@/lib/status"

export type EventType = "event" | "meeting" | "program"

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly" | "weekday" | "custom"

export type MonthlyRecurrenceType = "day-of-month" | "day-of-week"

export type LocationType = "in-person" | "online" | "hybrid"

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

export type EventContact = {
  name: string
  label?: string
  isMain?: boolean
}

export type CostType = "free" | "paid" | "donation"

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
  locationInstructions?: string
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
  contacts?: EventContact[]
  coverImage?: string
  imageAlt?: string
  links: EventLink[]
  // Cost & Registration
  costType?: CostType
  costAmount?: string
  registrationRequired?: boolean
  registrationUrl?: string
  maxParticipants?: number
  registrationDeadline?: string
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

// Re-export shared slug utility for backwards compatibility
export { generateSlug } from "@/lib/utils"

/* ── Helper: compute recurrence schedule label ── */
/**
 * Format an array of days compactly using ranges.
 * e.g. [mon,tue,wed,thu,fri] → "Mon–Fri"
 *      [tue,thu,fri] → "Tue, Thu–Fri"
 *      [mon,wed] → "Mon, Wed"
 */
function formatDaysCompact(days: DayOfWeek[]): string {
  const dayOrder: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
  const dayShort: Record<DayOfWeek, string> = {
    sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed",
    thu: "Thu", fri: "Fri", sat: "Sat",
  }

  // Sort days by weekday order
  const sorted = [...days].sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
  if (sorted.length <= 2) {
    return sorted.map(d => dayShort[d]).join(", ")
  }

  // Build consecutive ranges
  const indices = sorted.map(d => dayOrder.indexOf(d))
  const ranges: { start: number; end: number }[] = []
  let rangeStart = indices[0]
  let prev = indices[0]

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] === prev + 1) {
      prev = indices[i]
    } else {
      ranges.push({ start: rangeStart, end: prev })
      rangeStart = indices[i]
      prev = indices[i]
    }
  }
  ranges.push({ start: rangeStart, end: prev })

  return ranges.map(r => {
    if (r.start === r.end) return dayShort[dayOrder[r.start]]
    if (r.end - r.start === 1) return `${dayShort[dayOrder[r.start]]}, ${dayShort[dayOrder[r.end]]}`
    return `${dayShort[dayOrder[r.start]]}\u2013${dayShort[dayOrder[r.end]]}`
  }).join(", ")
}

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
    return `Weekly on ${formatDaysCompact(days)}${endSuffix}`
  }

  if (event.recurrence === "monthly") {
    return `Monthly${endSuffix}`
  }

  if (event.recurrence === "yearly") {
    return `Yearly${endSuffix}`
  }

  if (event.recurrence === "custom" && event.customRecurrence) {
    const cr = event.customRecurrence
    const dayStr = formatDaysCompact(cr.days)
    return `Every ${cr.interval} week(s) on ${dayStr}${endSuffix}`
  }

  return undefined
}
