import type { ContentStatus } from "@/lib/status"

export type EventType = "event" | "meeting" | "program"

export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly"

export type LocationType = "in-person" | "online"

export type ChurchEvent = {
  id: string
  title: string
  type: EventType
  date: string
  startTime: string
  endTime: string
  recurrence: Recurrence
  locationType: LocationType
  location: string
  ministry: string
  status: ContentStatus
  isPinned: boolean
}

export const eventTypeDisplay: Record<EventType, string> = {
  event: "Event",
  meeting: "Meeting",
  program: "Program",
}

export const recurrenceDisplay: Record<Recurrence, string> = {
  none: "-",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
}

export const events: ChurchEvent[] = [
  {
    id: "e1",
    title: "Sunday Worship Service",
    type: "event",
    date: "2026-02-22",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    recurrence: "weekly",
    locationType: "in-person",
    location: "Main Sanctuary",
    ministry: "Worship",
    status: "published",
    isPinned: true,
  },
  {
    id: "e2",
    title: "Youth Group Night",
    type: "program",
    date: "2026-02-20",
    startTime: "6:30 PM",
    endTime: "8:30 PM",
    recurrence: "weekly",
    locationType: "in-person",
    location: "Fellowship Hall",
    ministry: "Youth",
    status: "published",
    isPinned: false,
  },
  {
    id: "e3",
    title: "Elder Board Meeting",
    type: "meeting",
    date: "2026-03-03",
    startTime: "7:00 PM",
    endTime: "9:00 PM",
    recurrence: "monthly",
    locationType: "online",
    location: "Zoom",
    ministry: "Leadership",
    status: "scheduled",
    isPinned: false,
  },
  {
    id: "e4",
    title: "Easter Sunday Celebration",
    type: "event",
    date: "2026-04-05",
    startTime: "9:00 AM",
    endTime: "12:00 PM",
    recurrence: "none",
    locationType: "in-person",
    location: "Main Sanctuary",
    ministry: "Worship",
    status: "draft",
    isPinned: true,
  },
  {
    id: "e5",
    title: "Women's Bible Study",
    type: "program",
    date: "2026-02-19",
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    recurrence: "weekly",
    locationType: "in-person",
    location: "Room 201",
    ministry: "Women",
    status: "published",
    isPinned: false,
  },
  {
    id: "e6",
    title: "Men's Prayer Breakfast",
    type: "event",
    date: "2026-02-28",
    startTime: "7:00 AM",
    endTime: "8:30 AM",
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
    startTime: "7:00 PM",
    endTime: "8:00 PM",
    recurrence: "weekly",
    locationType: "online",
    location: "Zoom",
    ministry: "Prayer",
    status: "published",
    isPinned: false,
  },
  {
    id: "e8",
    title: "VBS Planning Committee",
    type: "meeting",
    date: "2026-01-15",
    startTime: "6:00 PM",
    endTime: "7:30 PM",
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
    startTime: "9:00 AM",
    endTime: "3:00 PM",
    recurrence: "none",
    locationType: "in-person",
    location: "City Park",
    ministry: "Outreach",
    status: "scheduled",
    isPinned: false,
  },
  {
    id: "e10",
    title: "New Members Class",
    type: "program",
    date: "2026-03-01",
    startTime: "1:00 PM",
    endTime: "3:00 PM",
    recurrence: "none",
    locationType: "in-person",
    location: "Room 201",
    ministry: "Membership",
    status: "draft",
    isPinned: false,
  },
  {
    id: "e11",
    title: "Christmas Eve Service",
    type: "event",
    date: "2025-12-24",
    startTime: "6:00 PM",
    endTime: "8:00 PM",
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
    startTime: "12:00 PM",
    endTime: "1:00 PM",
    recurrence: "none",
    locationType: "online",
    location: "Google Meet",
    ministry: "Missions",
    status: "published",
    isPinned: false,
  },
]
