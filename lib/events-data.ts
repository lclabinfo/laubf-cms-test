import type { ContentStatus } from "@/lib/status"

export type EventType = "event" | "meeting" | "program"

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly" | "weekday" | "custom"

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

export type ChurchEvent = {
  id: string
  title: string
  type: EventType
  date: string
  endDate: string
  startTime: string
  endTime: string
  recurrence: Recurrence
  customRecurrence?: CustomRecurrence
  locationType: LocationType
  location: string
  ministry: string
  status: ContentStatus
  isPinned: boolean
  // Detail fields (populated when editing)
  description?: string
  welcomeMessage?: string
  contacts?: string[]
  coverImage?: string
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
  weekday: "Weekday (Mon–Fri)",
  custom: "Custom",
}

export const ministries = [
  "Worship",
  "Youth",
  "Kids",
  "Outreach",
  "Leadership",
  "Education",
  "Prayer",
  "Women",
  "Men",
  "Children",
  "Membership",
  "Missions",
] as const

export type Ministry = (typeof ministries)[number]

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

export const events: ChurchEvent[] = [
  {
    id: "e1",
    title: "Sunday Worship Service",
    type: "event",
    date: "2026-02-22",
    endDate: "2026-02-22",
    startTime: "10:00",
    endTime: "12:00",
    recurrence: "weekly",
    locationType: "in-person",
    location: "Main Sanctuary",
    ministry: "Worship",
    status: "published",
    isPinned: true,
    description: "<p>Join us for our weekly Sunday worship service. Everyone is welcome!</p>",
    welcomeMessage: "Welcome to LA UBF! We're so glad you're here.",
    contacts: ["Pastor David", "Deacon Sarah"],
    coverImage: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=400&fit=crop",
  },
  {
    id: "e2",
    title: "Youth Group Night",
    type: "program",
    date: "2026-02-20",
    endDate: "2026-02-20",
    startTime: "18:30",
    endTime: "20:30",
    recurrence: "weekly",
    locationType: "in-person",
    location: "Fellowship Hall",
    ministry: "Youth",
    status: "published",
    isPinned: false,
    description: "<p>Fun, games, and Bible study for teens grades 6–12.</p>",
    contacts: ["Youth Pastor Mark"],
  },
  {
    id: "e3",
    title: "Elder Board Meeting",
    type: "meeting",
    date: "2026-03-03",
    endDate: "2026-03-03",
    startTime: "19:00",
    endTime: "21:00",
    recurrence: "monthly",
    locationType: "online",
    location: "https://zoom.us/j/123456789",
    ministry: "Leadership",
    status: "scheduled",
    isPinned: false,
    contacts: ["Elder James", "Elder Ruth"],
  },
  {
    id: "e4",
    title: "Easter Sunday Celebration",
    type: "event",
    date: "2026-04-05",
    endDate: "2026-04-05",
    startTime: "09:00",
    endTime: "12:00",
    recurrence: "none",
    locationType: "in-person",
    location: "Main Sanctuary",
    ministry: "Worship",
    status: "draft",
    isPinned: true,
    description: "<p>A special Easter celebration with worship, drama, and fellowship brunch.</p>",
    welcomeMessage: "He is risen! Welcome to our Easter celebration.",
    coverImage: "https://images.unsplash.com/photo-1457301547464-55b8202f9616?w=800&h=400&fit=crop",
  },
  {
    id: "e5",
    title: "Women's Bible Study",
    type: "program",
    date: "2026-02-19",
    endDate: "2026-02-19",
    startTime: "10:00",
    endTime: "11:30",
    recurrence: "weekly",
    locationType: "in-person",
    location: "Room 201",
    ministry: "Women",
    status: "published",
    isPinned: false,
    contacts: ["Sister Grace"],
  },
  {
    id: "e6",
    title: "Men's Prayer Breakfast",
    type: "event",
    date: "2026-02-28",
    endDate: "2026-02-28",
    startTime: "07:00",
    endTime: "08:30",
    recurrence: "monthly",
    locationType: "in-person",
    location: "Fellowship Hall",
    ministry: "Men",
    status: "published",
    isPinned: false,
  },
  {
    id: "e7",
    title: "Online Prayer Meeting",
    type: "meeting",
    date: "2026-02-25",
    endDate: "2026-02-25",
    startTime: "19:00",
    endTime: "20:00",
    recurrence: "weekly",
    locationType: "online",
    location: "https://zoom.us/j/987654321",
    ministry: "Prayer",
    status: "published",
    isPinned: false,
  },
  {
    id: "e8",
    title: "VBS Planning Committee",
    type: "meeting",
    date: "2026-01-15",
    endDate: "2026-01-15",
    startTime: "18:00",
    endTime: "19:30",
    recurrence: "none",
    locationType: "in-person",
    location: "Room 105",
    ministry: "Children",
    status: "archived",
    isPinned: false,
  },
  {
    id: "e9",
    title: "Community Outreach Day",
    type: "event",
    date: "2026-03-14",
    endDate: "2026-03-14",
    startTime: "09:00",
    endTime: "15:00",
    recurrence: "none",
    locationType: "in-person",
    location: "City Park",
    ministry: "Outreach",
    status: "scheduled",
    isPinned: false,
    description: "<p>Serving our community through food distribution and cleanup.</p>",
    contacts: ["Outreach Coordinator Kim"],
    coverImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
  },
  {
    id: "e10",
    title: "New Members Class",
    type: "program",
    date: "2026-03-01",
    endDate: "2026-03-01",
    startTime: "13:00",
    endTime: "15:00",
    recurrence: "none",
    locationType: "in-person",
    location: "Room 201",
    ministry: "Membership",
    status: "draft",
    isPinned: false,
    welcomeMessage: "Welcome to our church family! We're excited to get to know you.",
  },
  {
    id: "e11",
    title: "Christmas Eve Service",
    type: "event",
    date: "2025-12-24",
    endDate: "2025-12-24",
    startTime: "18:00",
    endTime: "20:00",
    recurrence: "yearly",
    locationType: "in-person",
    location: "Main Sanctuary",
    ministry: "Worship",
    status: "archived",
    isPinned: false,
  },
  {
    id: "e12",
    title: "Missions Team Update",
    type: "meeting",
    date: "2026-02-10",
    endDate: "2026-02-10",
    startTime: "12:00",
    endTime: "13:00",
    recurrence: "none",
    locationType: "online",
    location: "https://meet.google.com/abc-defg-hij",
    ministry: "Missions",
    status: "published",
    isPinned: false,
  },
]
