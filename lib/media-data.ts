export type MediaType = "image" | "video"

export type MediaFormat = "JPG" | "PNG" | "WEBP" | "YouTube" | "Vimeo"

export type MediaItem = {
  id: string
  name: string
  type: MediaType
  format: MediaFormat
  url: string
  videoUrl?: string
  size: string
  tags: string[]
  dateAdded: string
  isArchived: boolean
  usedIn: number
}

export const mediaTypeDisplay: Record<MediaType, string> = {
  image: "Image",
  video: "Video",
}

export const formatDisplay: Record<MediaFormat, { label: string; color: string }> = {
  JPG: { label: "JPG", color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  PNG: { label: "PNG", color: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  WEBP: { label: "WEBP", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  YouTube: { label: "YouTube", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
  Vimeo: { label: "Vimeo", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
}

export const mediaTags = [
  "worship",
  "youth",
  "outreach",
  "sunday-service",
  "events",
  "leadership",
  "missions",
] as const

export type MediaTag = (typeof mediaTags)[number]

export const mediaItems: MediaItem[] = [
  {
    id: "m1",
    name: "Worship Service.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1712260559341-cbe284e828b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwc2VydmljZSUyMGNvbmNlcnQlMjBsaWdodGluZ3xlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "2.4 MB",
    tags: ["worship", "sunday-service"],
    dateAdded: "2026-01-15",
    isArchived: false,
    usedIn: 3,
  },
  {
    id: "m2",
    name: "Community Dinner.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1765582870011-ff3cfdb06700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkaW5uZXIlMjBmcmllbmRzJTIwZWF0aW5nJTIwdGFibGV8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "3.1 MB",
    tags: ["outreach", "events"],
    dateAdded: "2026-01-10",
    isArchived: false,
    usedIn: 1,
  },
  {
    id: "m3",
    name: "Youth Group.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlcnMlMjB5b3V0aCUyMGdyb3VwJTIwdGFsa2luZyUyMGxhdWdoaW5nfGVufDF8fHx8MTc2OTUwMjE0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    size: "1.8 MB",
    tags: ["youth"],
    dateAdded: "2026-01-08",
    isArchived: false,
    usedIn: 2,
  },
  {
    id: "m4",
    name: "Sunday School.png",
    type: "image",
    format: "PNG",
    url: "https://images.unsplash.com/photo-1629822908853-b1d2a39ece98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwcGFpbnRpbmclMjBhcnQlMjBjbGFzc3xlbnwxfHx8fDE3Njk1MDIxNTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "4.2 MB",
    tags: ["sunday-service"],
    dateAdded: "2026-01-05",
    isArchived: false,
    usedIn: 0,
  },
  {
    id: "m5",
    name: "Baptism.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1663230910582-21f3ae6ee7d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjBiYXB0aXNtJTIwd2F0ZXJ8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "5.5 MB",
    tags: ["worship", "sunday-service", "events"],
    dateAdded: "2025-12-20",
    isArchived: true,
    usedIn: 1,
  },
  {
    id: "m6",
    name: "Leadership Retreat.webp",
    type: "image",
    format: "WEBP",
    url: "https://images.unsplash.com/photo-1642185859150-40942764765e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNhbXAlMjBvdXRkb29yJTIwcmV0cmVhdCUyMGJvbmZpcmV8ZW58MXx8fHwxNzY5NTAyMTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "980 KB",
    tags: ["leadership"],
    dateAdded: "2026-02-01",
    isArchived: false,
    usedIn: 0,
  },
  {
    id: "m7",
    name: "Missions Trip Banner.png",
    type: "image",
    format: "PNG",
    url: "https://images.unsplash.com/photo-1667900141150-21a07051cf42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXIlMjBjaHVyY2glMjBzZXJ2aWNlJTIwZmxvd2VycyUyMGJyaWdodHxlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "2.8 MB",
    tags: ["missions", "outreach"],
    dateAdded: "2026-02-05",
    isArchived: false,
    usedIn: 2,
  },
  {
    id: "m8",
    name: "Outreach Day.webp",
    type: "image",
    format: "WEBP",
    url: "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlcnMlMjB5b3V0aCUyMGdyb3VwJTIwdGFsa2luZyUyMGxhdWdoaW5nfGVufDF8fHx8MTc2OTUwMjE0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    size: "1.2 MB",
    tags: ["outreach", "events"],
    dateAdded: "2026-02-10",
    isArchived: false,
    usedIn: 0,
  },
  {
    id: "m9",
    name: "Easter Service 2024",
    type: "video",
    format: "YouTube",
    url: "https://images.unsplash.com/photo-1667900141150-21a07051cf42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXIlMjBjaHVyY2glMjBzZXJ2aWNlJTIwZmxvd2VycyUyMGJyaWdodHxlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    size: "-",
    tags: ["worship", "events"],
    dateAdded: "2026-01-20",
    isArchived: false,
    usedIn: 4,
  },
  {
    id: "m10",
    name: "Youth Retreat Highlight",
    type: "video",
    format: "Vimeo",
    url: "https://images.unsplash.com/photo-1642185859150-40942764765e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNhbXAlMjBvdXRkb29yJTIwcmV0cmVhdCUyMGJvbmZpcmV8ZW58MXx8fHwxNzY5NTAyMTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://vimeo.com/123456789",
    size: "-",
    tags: ["youth"],
    dateAdded: "2026-02-08",
    isArchived: false,
    usedIn: 1,
  },
  {
    id: "m11",
    name: "Worship Night Promo",
    type: "video",
    format: "YouTube",
    url: "https://images.unsplash.com/photo-1712260559341-cbe284e828b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwc2VydmljZSUyMGNvbmNlcnQlMjBsaWdodGluZ3xlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    size: "-",
    tags: ["worship", "sunday-service"],
    dateAdded: "2025-11-15",
    isArchived: true,
    usedIn: 0,
  },
  {
    id: "m12",
    name: "Missions Update Video",
    type: "video",
    format: "Vimeo",
    url: "https://images.unsplash.com/photo-1765582870011-ff3cfdb06700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkaW5uZXIlMjBmcmllbmRzJTIwZWF0aW5nJTIwdGFibGV8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://vimeo.com/987654321",
    size: "-",
    tags: ["missions"],
    dateAdded: "2026-02-12",
    isArchived: false,
    usedIn: 2,
  },
]
