export type MediaType = "image" | "video"

export type MediaFormat = "JPG" | "PNG" | "WEBP" | "YouTube" | "Vimeo"

export const imageFormats: MediaFormat[] = ["JPG", "PNG", "WEBP"]
export const videoFormats: MediaFormat[] = ["YouTube", "Vimeo"]

export type MediaItem = {
  id: string
  name: string
  type: MediaType
  format: MediaFormat
  url: string
  videoUrl?: string
  size: string
  folderId: string | null
  dateAdded: string
  altText?: string
}

export type MediaFolder = {
  id: string
  name: string
}

export type GoogleAlbumStatus = "Connected" | "Disconnected"

export type GoogleAlbum = {
  id: string
  name: string
  photoCount: number
  coverUrl: string
  externalUrl: string
  status: GoogleAlbumStatus
  dateAdded: string
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

export const mediaFolders: MediaFolder[] = [
  { id: "f1", name: "Sunday Service" },
  { id: "f2", name: "Youth Camp 2024" },
  { id: "f3", name: "Community Events" },
  { id: "f4", name: "Worship Videos" },
]

export const mediaItems: MediaItem[] = [
  {
    id: "m1",
    name: "Worship Service.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1712260559341-cbe284e828b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwc2VydmljZSUyMGNvbmNlcnQlMjBsaWdodGluZ3xlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "2.4 MB",
    folderId: "f1",
    dateAdded: "2026-01-15",
  },
  {
    id: "m2",
    name: "Community Dinner.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1765582870011-ff3cfdb06700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkaW5uZXIlMjBmcmllbmRzJTIwZWF0aW5nJTIwdGFibGV8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "3.1 MB",
    folderId: "f3",
    dateAdded: "2026-01-10",
  },
  {
    id: "m3",
    name: "Youth Group.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlcnMlMjB5b3V0aCUyMGdyb3VwJTIwdGFsa2luZyUyMGxhdWdoaW5nfGVufDF8fHx8MTc2OTUwMjE0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    size: "1.8 MB",
    folderId: "f2",
    dateAdded: "2026-01-08",
  },
  {
    id: "m4",
    name: "Sunday School.png",
    type: "image",
    format: "PNG",
    url: "https://images.unsplash.com/photo-1629822908853-b1d2a39ece98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWRzJTIwcGFpbnRpbmclMjBhcnQlMjBjbGFzc3xlbnwxfHx8fDE3Njk1MDIxNTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "4.2 MB",
    folderId: "f1",
    dateAdded: "2026-01-05",
  },
  {
    id: "m5",
    name: "Baptism.jpg",
    type: "image",
    format: "JPG",
    url: "https://images.unsplash.com/photo-1663230910582-21f3ae6ee7d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjBiYXB0aXNtJTIwd2F0ZXJ8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "5.5 MB",
    folderId: null,
    dateAdded: "2025-12-20",
  },
  {
    id: "m6",
    name: "Leadership Retreat.webp",
    type: "image",
    format: "WEBP",
    url: "https://images.unsplash.com/photo-1642185859150-40942764765e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNhbXAlMjBvdXRkb29yJTIwcmV0cmVhdCUyMGJvbmZpcmV8ZW58MXx8fHwxNzY5NTAyMTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "980 KB",
    folderId: "f2",
    dateAdded: "2026-02-01",
  },
  {
    id: "m7",
    name: "Missions Trip Banner.png",
    type: "image",
    format: "PNG",
    url: "https://images.unsplash.com/photo-1667900141150-21a07051cf42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXIlMjBjaHVyY2glMjBzZXJ2aWNlJTIwZmxvd2VycyUyMGJyaWdodHxlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    size: "2.8 MB",
    folderId: null,
    dateAdded: "2026-02-05",
  },
  {
    id: "m8",
    name: "Outreach Day.webp",
    type: "image",
    format: "WEBP",
    url: "https://images.unsplash.com/photo-1549057446-9f5c6ac91a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVuYWdlcnMlMjB5b3V0aCUyMGdyb3VwJTIwdGFsa2luZyUyMGxhdWdoaW5nfGVufDF8fHx8MTc2OTUwMjE0NHww&ixlib=rb-4.1.0&q=80&w=1080",
    size: "1.2 MB",
    folderId: "f3",
    dateAdded: "2026-02-10",
  },
  {
    id: "m9",
    name: "Easter Service 2024",
    type: "video",
    format: "YouTube",
    url: "https://images.unsplash.com/photo-1667900141150-21a07051cf42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXIlMjBjaHVyY2glMjBzZXJ2aWNlJTIwZmxvd2VycyUyMGJyaWdodHxlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    size: "-",
    folderId: "f1",
    dateAdded: "2026-01-20",
  },
  {
    id: "m10",
    name: "Youth Retreat Highlight",
    type: "video",
    format: "Vimeo",
    url: "https://images.unsplash.com/photo-1642185859150-40942764765e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNhbXAlMjBvdXRkb29yJTIwcmV0cmVhdCUyMGJvbmZpcmV8ZW58MXx8fHwxNzY5NTAyMTQ1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://vimeo.com/123456789",
    size: "-",
    folderId: "f4",
    dateAdded: "2026-02-08",
  },
  {
    id: "m11",
    name: "Worship Night Promo",
    type: "video",
    format: "YouTube",
    url: "https://images.unsplash.com/photo-1712260559341-cbe284e828b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaHVyY2glMjB3b3JzaGlwJTIwc2VydmljZSUyMGNvbmNlcnQlMjBsaWdodGluZ3xlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    size: "-",
    folderId: "f4",
    dateAdded: "2025-11-15",
  },
  {
    id: "m12",
    name: "Missions Update Video",
    type: "video",
    format: "Vimeo",
    url: "https://images.unsplash.com/photo-1765582870011-ff3cfdb06700?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBkaW5uZXIlMjBmcmllbmRzJTIwZWF0aW5nJTIwdGFibGV8ZW58MXx8fHwxNzY5NTAyMTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    videoUrl: "https://vimeo.com/987654321",
    size: "-",
    folderId: null,
    dateAdded: "2026-02-12",
  },
]

export const googleAlbums: GoogleAlbum[] = [
  {
    id: "ga1",
    name: "Easter Sunday 2024",
    photoCount: 48,
    coverUrl: "https://images.unsplash.com/photo-1667900141150-21a07051cf42?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlYXN0ZXIlMjBjaHVyY2glMjBzZXJ2aWNlJTIwZmxvd2VycyUyMGJyaWdodHxlbnwxfHx8fDE3Njk1MDIxNDR8MA&ixlib=rb-4.1.0&q=80&w=400",
    externalUrl: "https://photos.app.goo.gl/example1",
    status: "Connected",
    dateAdded: "2026-01-10",
  },
  {
    id: "ga2",
    name: "Youth Camp Photos",
    photoCount: 124,
    coverUrl: "https://images.unsplash.com/photo-1642185859150-40942764765e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3V0aCUyMGNhbXAlMjBvdXRkb29yJTIwcmV0cmVhdCUyMGJvbmZpcmV8ZW58MXx8fHwxNzY5NTAyMTQ1fDA&ixlib=rb-4.1.0&q=80&w=400",
    externalUrl: "https://photos.app.goo.gl/example2",
    status: "Connected",
    dateAdded: "2026-02-01",
  },
]
