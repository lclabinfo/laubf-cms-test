export type MediaType = "image" | "video" | "audio" | "document"

export type MediaFormat = "JPG" | "PNG" | "WEBP" | "GIF" | "MP4" | "MP3" | "PDF" | "YouTube" | "Vimeo"

export const imageFormats: MediaFormat[] = ["JPG", "PNG", "WEBP", "GIF"]
export const videoFormats: MediaFormat[] = ["MP4", "YouTube", "Vimeo"]
export const audioFormats: MediaFormat[] = ["MP3"]
export const documentFormats: MediaFormat[] = ["PDF"]

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
  audio: "Audio",
  document: "Document",
}

export const formatDisplay: Record<MediaFormat, { label: string; variant: "secondary" | "outline" | "destructive" | "default" }> = {
  JPG: { label: "JPG", variant: "secondary" },
  PNG: { label: "PNG", variant: "secondary" },
  WEBP: { label: "WEBP", variant: "secondary" },
  GIF: { label: "GIF", variant: "secondary" },
  MP4: { label: "MP4", variant: "outline" },
  MP3: { label: "MP3", variant: "outline" },
  PDF: { label: "PDF", variant: "default" },
  YouTube: { label: "YouTube", variant: "outline" },
  Vimeo: { label: "Vimeo", variant: "outline" },
}

// ---------------------------------------------------------------------------
// Prisma MediaAsset → MediaItem mapper
// ---------------------------------------------------------------------------
import type { MediaAsset } from '@/lib/generated/prisma/client'

export function mediaAssetToItem(asset: MediaAsset): MediaItem {
  const ext = asset.filename.split('.').pop()?.toUpperCase() ?? ''
  const isImage = asset.mimeType.startsWith('image/')
  const isVideo = asset.mimeType.startsWith('video/')
  const isAudio = asset.mimeType.startsWith('audio/')
  const isPdf = asset.mimeType === 'application/pdf'

  let format: MediaFormat = 'JPG'
  if (ext === 'PNG') format = 'PNG'
  else if (ext === 'WEBP') format = 'WEBP'
  else if (ext === 'GIF') format = 'GIF'
  else if (ext === 'MP4' || isVideo) format = 'MP4'
  else if (ext === 'MP3' || isAudio) format = 'MP3'
  else if (ext === 'PDF' || isPdf) format = 'PDF'

  let type: MediaType = 'image'
  if (isVideo) type = 'video'
  else if (isAudio) type = 'audio'
  else if (isPdf) type = 'document'

  const sizeMB = asset.fileSize / (1024 * 1024)
  const sizeStr = sizeMB >= 1
    ? `${sizeMB.toFixed(1)} MB`
    : `${(asset.fileSize / 1024).toFixed(0)} KB`

  return {
    id: asset.id,
    name: asset.filename,
    type,
    format,
    url: asset.url,
    size: sizeStr,
    folderId: asset.folder === '/' ? null : asset.folder,
    dateAdded: asset.createdAt instanceof Date
      ? asset.createdAt.toISOString().slice(0, 10)
      : new Date(asset.createdAt).toISOString().slice(0, 10),
    altText: asset.alt ?? undefined,
  }
}
