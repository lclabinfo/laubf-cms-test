/** Hard limit for all media uploads (images + videos) */
export const MAX_UPLOAD_SIZE = 15 * 1024 * 1024 // 15 MB

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
export const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/webm"] as const
export const ACCEPTED_ALL_MEDIA_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES] as const

/** Comma-separated string for HTML file input accept attribute */
export const ACCEPTED_IMAGE_TYPES_STRING = ACCEPTED_IMAGE_TYPES.join(",")
export const ACCEPTED_VIDEO_TYPES_STRING = ACCEPTED_VIDEO_TYPES.join(",")
export const ACCEPTED_ALL_MEDIA_TYPES_STRING = ACCEPTED_ALL_MEDIA_TYPES.join(",")

/** Format bytes to human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
