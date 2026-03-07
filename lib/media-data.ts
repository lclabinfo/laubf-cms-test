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

export const formatDisplay: Record<MediaFormat, { label: string; variant: "secondary" | "outline" | "destructive" | "default" }> = {
  JPG: { label: "JPG", variant: "secondary" },
  PNG: { label: "PNG", variant: "secondary" },
  WEBP: { label: "WEBP", variant: "secondary" },
  YouTube: { label: "YouTube", variant: "outline" },
  Vimeo: { label: "Vimeo", variant: "outline" },
}

