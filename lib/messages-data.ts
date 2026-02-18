export type MessageStatus = "published" | "draft" | "scheduled" | "archived"

export type Message = {
  id: string
  title: string
  passage: string
  speaker: string
  seriesIds: string[]
  date: string
  status: MessageStatus
  hasVideo: boolean
  hasStudy: boolean
}

export type Series = {
  id: string
  name: string
  imageUrl?: string
}

export const series: Series[] = [
  { id: "s1", name: "Gospel of John" },
  { id: "s2", name: "Psalms of Hope" },
  { id: "s3", name: "Acts: The Early Church" },
  { id: "s4", name: "Romans Deep Dive" },
]

export const messages: Message[] = [
  {
    id: "m1",
    title: "The Word Became Flesh",
    passage: "John 1:1-14",
    speaker: "Pastor David",
    seriesIds: ["s1"],
    date: "2026-02-15",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
  {
    id: "m2",
    title: "The First Disciples",
    passage: "John 1:35-51",
    speaker: "Pastor David",
    seriesIds: ["s1"],
    date: "2026-02-08",
    status: "published",
    hasVideo: true,
    hasStudy: false,
  },
  {
    id: "m3",
    title: "Water Into Wine",
    passage: "John 2:1-12",
    speaker: "Pastor Sarah",
    seriesIds: ["s1"],
    date: "2026-02-22",
    status: "scheduled",
    hasVideo: false,
    hasStudy: true,
  },
  {
    id: "m4",
    title: "The Lord Is My Shepherd",
    passage: "Psalm 23",
    speaker: "Pastor David",
    seriesIds: ["s2"],
    date: "2026-01-25",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
  {
    id: "m5",
    title: "A Song of Ascent",
    passage: "Psalm 121",
    speaker: "Pastor Sarah",
    seriesIds: ["s2"],
    date: "2026-01-18",
    status: "published",
    hasVideo: true,
    hasStudy: false,
  },
  {
    id: "m6",
    title: "Hope in the Depths",
    passage: "Psalm 130",
    speaker: "Elder James",
    seriesIds: ["s2"],
    date: "2026-01-11",
    status: "archived",
    hasVideo: false,
    hasStudy: true,
  },
  {
    id: "m7",
    title: "The Day of Pentecost",
    passage: "Acts 2:1-21",
    speaker: "Pastor David",
    seriesIds: ["s3"],
    date: "2026-02-01",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
  {
    id: "m8",
    title: "Peter's Sermon",
    passage: "Acts 2:22-41",
    speaker: "Elder James",
    seriesIds: ["s3"],
    date: "2026-01-04",
    status: "draft",
    hasVideo: false,
    hasStudy: false,
  },
  {
    id: "m9",
    title: "Life in Community",
    passage: "Acts 2:42-47",
    speaker: "Pastor Sarah",
    seriesIds: ["s3"],
    date: "2025-12-28",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
  {
    id: "m10",
    title: "Justified by Faith",
    passage: "Romans 3:21-31",
    speaker: "Pastor David",
    seriesIds: ["s4"],
    date: "2025-12-21",
    status: "published",
    hasVideo: true,
    hasStudy: false,
  },
  {
    id: "m11",
    title: "Peace with God",
    passage: "Romans 5:1-11",
    speaker: "Pastor David",
    seriesIds: ["s4"],
    date: "2025-12-14",
    status: "draft",
    hasVideo: false,
    hasStudy: true,
  },
  {
    id: "m12",
    title: "More Than Conquerors",
    passage: "Romans 8:31-39",
    speaker: "Elder James",
    seriesIds: ["s4"],
    date: "2025-12-07",
    status: "published",
    hasVideo: true,
    hasStudy: true,
  },
]
