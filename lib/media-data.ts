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

