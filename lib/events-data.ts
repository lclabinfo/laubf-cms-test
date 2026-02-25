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

/* ── Mock data ── */

export const events: ChurchEvent[] = [
  {
    id: "e1",
    slug: "sunday-worship-service",
    title: "Sunday Worship Service",
    type: "event",
    date: "2026-02-22",
    endDate: "2026-02-22",
    startTime: "10:00",
    endTime: "12:00",
    recurrence: "weekly",
    recurrenceDays: ["sun"],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "LA UBF Main Center",
    meetingUrl: "https://www.youtube.com/@LAUBF/streams",
    ministry: "church-wide",
    campus: "all",
    status: "published",
    isFeatured: true,
    shortDescription: "Join us for our weekly Sunday worship service. Everyone is welcome!",
    description: "<p>Join us for our weekly Sunday worship service. Everyone is welcome!</p><p>Communion is observed on the first Sunday of each month. Childcare and a children's program are available during the service.</p>",
    welcomeMessage: "Welcome to LA UBF! We're so glad you're here.",
    contacts: ["Pastor David", "Deacon Sarah"],
    coverImage: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=400&fit=crop",
    imageAlt: "Sunday worship service at LA UBF",
    tags: ["#CHURCH-WIDE", "#RECURRING", "#WORSHIP", "#OPEN EVENT"],
    links: [
      { label: "YouTube Livestream", href: "https://www.youtube.com/@LAUBF/streams", external: true },
    ],
  },
  {
    id: "e2",
    slug: "friday-night-bible-study",
    title: "Friday Night Bible Study",
    type: "meeting",
    date: "2026-02-20",
    endDate: "2026-02-20",
    startTime: "19:00",
    endTime: "21:00",
    recurrence: "weekly",
    recurrenceDays: ["fri"],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "LA UBF Main Center",
    meetingUrl: "https://zoom.us/j/1234567890",
    ministry: "young-adult",
    campus: "all",
    status: "published",
    isFeatured: true,
    shortDescription: "Weekly Bible study for young adults. We study the Gospel of Mark together and share fellowship over snacks.",
    description: "<p>Join us every Friday evening for our cornerstone weekly Bible study. We gather to study God's word together, share what we are learning, and encourage one another in faith.</p><h3>What to Expect</h3><p>Each session opens with a time of worship and prayer, followed by inductive Bible study in small groups. We are currently working through the <strong>Gospel of Mark</strong>.</p>",
    contacts: ["Youth Pastor Mark"],
    coverImage: "",
    imageAlt: "Friday night Bible study group discussion",
    tags: ["#YAM", "#RECURRING", "#BIBLE STUDY", "#OPEN EVENT"],
    links: [],
  },
  {
    id: "e3",
    slug: "elder-board-meeting",
    title: "Elder Board Meeting",
    type: "meeting",
    date: "2026-03-03",
    endDate: "2026-03-03",
    startTime: "19:00",
    endTime: "21:00",
    recurrence: "monthly",
    recurrenceDays: [],
    recurrenceEndType: "never",
    locationType: "online",
    location: "Zoom",
    meetingUrl: "https://zoom.us/j/123456789",
    ministry: "church-wide",
    status: "scheduled",
    isFeatured: false,
    shortDescription: "Monthly meeting for the elder board to discuss church matters.",
    contacts: ["Elder James", "Elder Ruth"],
    tags: ["#CHURCH-WIDE"],
    links: [],
  },
  {
    id: "e4",
    slug: "easter-sunday-celebration",
    title: "Easter Sunday Celebration",
    type: "event",
    date: "2026-04-05",
    endDate: "2026-04-05",
    startTime: "09:00",
    endTime: "12:00",
    recurrence: "none",
    recurrenceDays: [],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "LA UBF Main Center",
    ministry: "church-wide",
    status: "draft",
    isFeatured: true,
    shortDescription: "Celebrate the resurrection of Jesus Christ with special worship, choir performance, and a shared Easter meal.",
    description: "<p>A special Easter celebration with worship, drama, and fellowship brunch.</p>",
    welcomeMessage: "He is risen! Welcome to our Easter celebration.",
    coverImage: "https://images.unsplash.com/photo-1457301547464-55b8202f9616?w=800&h=400&fit=crop",
    imageAlt: "Easter celebration worship service",
    tags: ["#CHURCH-WIDE", "#WORSHIP", "#FELLOWSHIP", "#OPEN EVENT"],
    registrationUrl: "",
    links: [],
  },
  {
    id: "e5",
    slug: "csulb-welcome-week-spring-2026",
    title: "CSULB Welcome Week Outreach",
    type: "event",
    date: "2026-02-12",
    endDate: "2026-02-14",
    startTime: "10:00",
    endTime: "14:00",
    recurrence: "none",
    recurrenceDays: [],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "CSULB Student Union Lawn",
    ministry: "young-adult",
    campus: "csulb",
    status: "published",
    isFeatured: true,
    shortDescription: "Meet us at the CSULB campus for our spring semester welcome week with free food, games, and Bible study invitations.",
    description: "<p>It is the start of a new semester and we want every student at Cal State Long Beach to know they have a home at LA UBF.</p>",
    coverImage: "",
    imageAlt: "Students at CSULB welcome week outreach table",
    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#OPEN EVENT"],
    links: [],
  },
  {
    id: "e6",
    slug: "daily-bread-meeting",
    title: "Daily Bread & Prayer Meeting",
    type: "meeting",
    date: "2026-02-01",
    endDate: "2026-02-01",
    startTime: "06:00",
    endTime: "06:45",
    recurrence: "weekday",
    recurrenceDays: ["mon", "tue", "wed", "thu", "fri"],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "LA UBF Main Center",
    meetingUrl: "https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09",
    ministry: "church-wide",
    campus: "all",
    status: "published",
    isFeatured: false,
    shortDescription: "Start your morning in the Word. A short daily devotional and prayer time open to everyone, Monday through Friday.",
    description: "<p>Daily Bread is a morning devotional gathering where we read a passage of Scripture together, share reflections, and pray to start the day grounded in God's word.</p><p>No preparation is needed \u2014 just come with an open heart. Coffee is ready by 5:45 AM.</p>",
    tags: ["#CHURCH-WIDE", "#RECURRING", "#DEVOTIONAL"],
    links: [],
  },
  {
    id: "e7",
    slug: "evening-prayer-meeting",
    title: "Evening Prayer Meeting",
    type: "meeting",
    date: "2026-02-16",
    endDate: "2026-02-16",
    startTime: "19:30",
    endTime: "20:30",
    recurrence: "daily",
    recurrenceDays: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
    recurrenceEndType: "on-date",
    recurrenceEndDate: "2026-03-08",
    locationType: "in-person",
    location: "LA UBF Main Center",
    meetingUrl: "https://meet.google.com/pgm-trah-moc",
    ministry: "church-wide",
    campus: "all",
    status: "published",
    isFeatured: false,
    shortDescription: "A daily evening prayer meeting to close the day in worship, reflection, and corporate prayer.",
    description: "<p>Join us every evening for a time of focused prayer. We gather to reflect on God's word, lift up prayer topics, and encourage one another in faith.</p><p>This is a daily commitment open to all members. Come as you are \u2014 no preparation needed.</p>",
    tags: ["#CHURCH-WIDE", "#RECURRING", "#WORSHIP", "#PRAYER"],
    links: [],
  },
  {
    id: "e8",
    slug: "mens-bible-study",
    title: "Men\u2019s Bible Study",
    type: "meeting",
    date: "2026-02-01",
    endDate: "2026-02-01",
    startTime: "08:00",
    endTime: "09:30",
    recurrence: "weekly",
    recurrenceDays: ["sat"],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "LA UBF Main Center",
    meetingUrl: "https://zoom.us",
    ministry: "church-wide",
    status: "published",
    isFeatured: false,
    shortDescription: "A weekly gathering for men to study Scripture, share life, and hold one another accountable in faith.",
    description: "<p>Men's Bible Study meets every Saturday morning for an in-depth study of God's word. We are currently working through the Book of Proverbs.</p><p>Breakfast is provided. All men are welcome regardless of where you are in your faith journey.</p>",
    tags: ["#CHURCH-WIDE", "#RECURRING", "#BIBLE STUDY"],
    links: [],
  },
  {
    id: "e9",
    slug: "community-outreach-day",
    title: "Community Outreach Day",
    type: "event",
    date: "2026-03-14",
    endDate: "2026-03-14",
    startTime: "09:00",
    endTime: "15:00",
    recurrence: "none",
    recurrenceDays: [],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "City Park",
    ministry: "church-wide",
    status: "scheduled",
    isFeatured: false,
    shortDescription: "Serving our community through food distribution and cleanup.",
    description: "<p>Serving our community through food distribution and cleanup.</p>",
    contacts: ["Outreach Coordinator Kim"],
    coverImage: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
    imageAlt: "Volunteers at community outreach day",
    tags: ["#CHURCH-WIDE", "#OUTREACH", "#OPEN EVENT"],
    registrationUrl: "https://forms.google.com/community-outreach-2026",
    links: [
      { label: "Volunteer Sign-up", href: "https://forms.google.com/volunteer-signup", external: true },
    ],
  },
  {
    id: "e10",
    slug: "new-members-class",
    title: "New Members Class",
    type: "program",
    date: "2026-03-01",
    endDate: "2026-03-01",
    startTime: "13:00",
    endTime: "15:00",
    recurrence: "none",
    recurrenceDays: [],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "Room 201",
    ministry: "church-wide",
    status: "draft",
    isFeatured: false,
    shortDescription: "Introduction to LA UBF for new and prospective members.",
    welcomeMessage: "Welcome to our church family! We're excited to get to know you.",
    tags: [],
    links: [],
  },
  {
    id: "e11",
    slug: "summer-mission-conference",
    title: "Summer Mission Conference",
    type: "program",
    date: "2026-07-10",
    endDate: "2026-07-12",
    startTime: "17:00",
    endTime: "14:00",
    recurrence: "none",
    recurrenceDays: [],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "UC Riverside Conference Center, Riverside, CA",
    ministry: "church-wide",
    status: "draft",
    isFeatured: false,
    shortDescription: "Annual multi-church mission conference with keynote speakers, workshops, and a call to world campus mission.",
    description: "<p>The Summer Mission Conference is the highlight of our ministry calendar. Churches from across the West Coast gather for a weekend of powerful messages, deep fellowship, and renewed commitment to God's world mission calling.</p>",
    coverImage: "",
    imageAlt: "Worship at summer mission conference",
    tags: ["#CHURCH-WIDE", "#CONFERENCE", "#WORSHIP", "#OUTREACH"],
    registrationUrl: "https://forms.google.com/smc-2026",
    links: [
      { label: "Conference Schedule", href: "https://laubf.org/smc-schedule", external: true },
      { label: "Lodging Info", href: "https://laubf.org/smc-lodging", external: true },
    ],
  },
  {
    id: "e12",
    slug: "ucla-spring-campus-outreach",
    title: "UCLA Spring Campus Outreach",
    type: "event",
    date: "2026-02-09",
    endDate: "2026-02-11",
    startTime: "11:00",
    endTime: "15:00",
    recurrence: "none",
    recurrenceDays: [],
    recurrenceEndType: "never",
    locationType: "in-person",
    location: "UCLA Bruin Walk",
    ministry: "young-adult",
    campus: "ucla",
    status: "published",
    isFeatured: false,
    shortDescription: "Three days of outreach at UCLA with free coffee, conversations about faith, and Bible study sign-ups.",
    description: "<p>Our UCLA ministry team sets up on Bruin Walk each spring to connect with students who are searching for community and purpose.</p>",
    imageAlt: "Students at UCLA campus outreach table",
    tags: ["#YAM", "#CAMPUS", "#OUTREACH", "#OPEN EVENT"],
    links: [],
  },
]
