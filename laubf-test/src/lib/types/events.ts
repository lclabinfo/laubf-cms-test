import type { EventType } from "./shared";
import type { EventCardData, EventListItemData } from "./shared";
import type { UpcomingEventItem } from "./sections";

/* ---- Ministry & Campus Tags (for filtering) ---- */

export type MinistryTag =
  | "young-adult"
  | "adult"
  | "children"
  | "high-school"
  | "church-wide";

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
  | "all";

/* ---- Unified Event Record (CMS source of truth) ---- */

export interface Event {
  /** Unique slug for URL: /events/[slug] */
  slug: string;
  /** Display title */
  title: string;
  /** Event classification */
  type: EventType;
  /** Start date as ISO string (e.g. "2026-01-15") */
  dateStart: string;
  /** End date for multi-day events */
  dateEnd?: string;
  /** Formatted time string: "7:00 PM - 9:00 PM" */
  time: string;
  /** Physical or virtual location */
  location: string;
  /** Short description for cards and list items */
  description: string;
  /** Rich text body content for detail page (HTML) */
  body: string;
  /** Hero/card image */
  image: { src: string; alt: string; objectPosition?: string };
  /** Optional badge overlay: "UPCOMING", "FEATURED", "NEW" */
  badge?: string;
  /** Admin metadata tags */
  tags: string[];
  /** Ministry affiliation for filtering */
  ministry: MinistryTag;
  /** Campus association for filtering */
  campus?: CampusTag;
  /** Whether this is a recurring meeting (shows in Quick Links) */
  isRecurring: boolean;
  /** For recurring meetings: the online meeting URL */
  meetingUrl?: string;
  /** Registration URL if applicable */
  registrationUrl?: string;
  /** Important external links */
  links?: { label: string; href: string; external?: boolean }[];
  /** Featured for homepage highlight cards */
  isFeatured?: boolean;

  /* ── Recurrence fields (PostgreSQL: recurrence_type, recurrence_days, recurrence_start, recurrence_end) ── */
  /** Recurrence frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' */
  recurrenceType?: "daily" | "weekly" | "biweekly" | "monthly";
  /** Days of the week (for weekly/biweekly). PostgreSQL TEXT[] column. */
  recurrenceDays?: ("MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN")[];
  /** Start date of the recurrence window (ISO). NULL = ongoing since inception. */
  recurrenceStart?: string;
  /** End date of the recurrence window (ISO). NULL = indefinite / ongoing. */
  recurrenceEnd?: string;

  /**
   * Pre-computed display label for the schedule line.
   * Derived from recurrenceType + recurrenceDays + start/end.
   * Examples: "Weekly on MON - FRI", "Every Saturday", "Daily (2/16 - 3/8)"
   */
  recurrenceSchedule?: string;
}

/* ---- Filter Interface ---- */

export interface EventFilters {
  type?: EventType | "all";
  ministry?: MinistryTag | "all";
  campus?: CampusTag | "all";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/* ---- Adapter Functions ---- */

/** Compute a dynamic badge for an event based on current date */
export function getEventBadge(event: Event): string | undefined {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(event.dateStart + "T00:00:00");
  const diffDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  // "UPCOMING" for any future event
  if (diffDays > 0) return "UPCOMING";
  return undefined;
}

/** Format ISO date to display: "February 1, 2026" */
export function formatEventDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Format ISO date to short: "FEB 1, 2026" */
export function formatEventDateShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}

/** Format ISO date for card display: "Friday, Jan 15" */
function formatCardDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/** Convert Event → EventCardData (for HighlightCardsSection / EventCard) */
export function toEventCardData(event: Event): EventCardData {
  const dateStr = event.dateEnd
    ? `${formatEventDateShort(event.dateStart)} - ${formatEventDateShort(event.dateEnd)}`
    : formatEventDateShort(event.dateStart);

  return {
    id: event.slug,
    title: event.title,
    date: dateStr,
    location: event.location,
    imageUrl: event.image.src,
    imageAlt: event.image.alt,
    badge: getEventBadge(event),
    href: `/events/${event.slug}`,
  };
}

/** Convert Event → EventListItemData (for EventCalendarSection / EventListItem) */
export function toEventListItemData(event: Event): EventListItemData {
  return {
    id: event.slug,
    title: event.title,
    dateStart: new Date(event.dateStart + "T00:00:00"),
    dateEnd: event.dateEnd
      ? new Date(event.dateEnd + "T00:00:00")
      : undefined,
    time: event.time,
    type: event.type,
    location: event.location,
    href: `/events/${event.slug}`,
    isRecurring: event.isRecurring,
    recurrenceSchedule: event.recurrenceSchedule,
  };
}

/** Convert Event → UpcomingEventItem (for UpcomingEventsSection) */
export function toUpcomingEventItem(event: Event): UpcomingEventItem {
  return {
    title: event.title,
    date: formatCardDate(event.dateStart),
    time: event.time.split(" - ")[0] || event.time,
    location: event.location,
    image: event.image,
    eventType: event.type.toUpperCase(),
    badge: getEventBadge(event),
    tags: event.tags,
  };
}

/* ---- Recurrence Schedule Formatter ---- */

const DAY_FULL: Record<string, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

/** Short M/D format: "2026-02-16" → "2/16" */
function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * Build a human-friendly recurrence label from structured fields.
 * Falls back to event.recurrenceSchedule if already set.
 */
export function formatRecurrenceSchedule(event: Event): string | undefined {
  if (event.recurrenceSchedule) return event.recurrenceSchedule;
  if (!event.recurrenceType) return undefined;

  const { recurrenceType, recurrenceDays, recurrenceStart, recurrenceEnd } = event;

  // Date range suffix: " (2/16 - 3/8)" when bounded
  const rangeSuffix =
    recurrenceStart && recurrenceEnd
      ? ` (${shortDate(recurrenceStart)} - ${shortDate(recurrenceEnd)})`
      : "";

  if (recurrenceType === "daily") {
    return `Daily${rangeSuffix}`;
  }

  if (recurrenceType === "weekly" || recurrenceType === "biweekly") {
    const prefix = recurrenceType === "biweekly" ? "Every other" : "";
    if (!recurrenceDays?.length) return `Weekly${rangeSuffix}`;

    // Single day → "Every Saturday"
    if (recurrenceDays.length === 1) {
      return `Every ${DAY_FULL[recurrenceDays[0]]}${rangeSuffix}`;
    }
    // Consecutive range → "Weekly on MON - FRI"
    return `${prefix || "Weekly on"} ${recurrenceDays[0]} - ${recurrenceDays[recurrenceDays.length - 1]}${rangeSuffix}`;
  }

  if (recurrenceType === "monthly") {
    return `Monthly${rangeSuffix}`;
  }

  return undefined;
}

/* ---- Ministry Display Labels ---- */

export const MINISTRY_LABELS: Record<MinistryTag, string> = {
  "young-adult": "Young Adult",
  adult: "Adult",
  children: "Children",
  "high-school": "Middle & High School",
  "church-wide": "Church-wide",
};

export const CAMPUS_LABELS: Record<CampusTag, string> = {
  lbcc: "LBCC",
  csulb: "CSULB",
  csuf: "CSUF",
  ucla: "UCLA",
  usc: "USC",
  csudh: "CSUDH",
  ccc: "CCC",
  "mt-sac": "Mt. SAC",
  "golden-west": "Golden West",
  cypress: "Cypress",
  "cal-poly-pomona": "Cal Poly Pomona",
  all: "All Campuses",
};

/** Filter events by type, ministry, campus, date range, and search query */
export function filterEvents(
  events: Event[],
  filters: EventFilters
): Event[] {
  return events.filter((event) => {
    // Type filter
    if (filters.type && filters.type !== "all" && event.type !== filters.type)
      return false;

    // Ministry filter
    if (
      filters.ministry &&
      filters.ministry !== "all" &&
      event.ministry !== filters.ministry
    )
      return false;

    // Campus filter
    if (
      filters.campus &&
      filters.campus !== "all" &&
      event.campus !== filters.campus &&
      event.campus !== "all"
    )
      return false;

    // Date range filter
    if (filters.dateFrom && event.dateStart < filters.dateFrom) return false;
    if (filters.dateTo && event.dateStart > filters.dateTo) return false;

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchable = [
        event.title,
        event.description,
        event.location,
        ...event.tags,
      ]
        .join(" ")
        .toLowerCase();
      if (!searchable.includes(q)) return false;
    }

    return true;
  }).sort(
    (a, b) =>
      new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
  );
}
