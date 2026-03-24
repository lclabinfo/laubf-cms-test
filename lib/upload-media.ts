/**
 * Shared media upload utility.
 * Single source of truth for ALL media uploads/deletions in the CMS.
 *
 * Exports:
 *  - uploadImageToR2(file, folder?)        — upload image and create MediaAsset record (immediate promotion)
 *  - uploadMediaToR2(file, folder?)        — upload image or video and create MediaAsset record (immediate promotion)
 *  - uploadImageToStaging(file)            — upload image to staging only (no MediaAsset, no promotion)
 *  - uploadMediaToStaging(file)            — upload image or video to staging only (no MediaAsset, no promotion)
 *  - promoteStagingImages(entries, folder) — bulk promote staging URLs → permanent + create MediaAsset records
 *  - deleteImageFromR2(url)                — hard-delete from R2 + DB by public URL
 */

import { MAX_UPLOAD_SIZE } from "@/lib/upload-constants"

/**
 * Check whether a URL points to our R2 media storage.
 * Uses the configured public URL prefixes for reliable matching.
 */
export function isR2MediaUrl(url: string): boolean {
  // Check against configured public URL prefixes first, fall back to domain pattern
  const mediaPublicUrl = process.env.NEXT_PUBLIC_R2_MEDIA_PUBLIC_URL || process.env.R2_MEDIA_PUBLIC_URL || ""
  const attachPublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || ""
  if (mediaPublicUrl && url.startsWith(mediaPublicUrl)) return true
  if (attachPublicUrl && url.startsWith(attachPublicUrl)) return true
  return url.includes(".r2.dev/")
}

/**
 * Check whether an R2 URL points to a staging file.
 */
export function isStagingUrl(url: string): boolean {
  return isR2MediaUrl(url) && url.includes("/staging/")
}

export interface UploadResult {
  url: string
  width: number
  height: number
  fileSize: number
  filename: string
  mimeType: string
}

export interface StagingUploadResult {
  stagingUrl: string
  stagingKey: string
  width: number
  height: number
  fileSize: number
  filename: string
  mimeType: string
}

export interface StagingImageEntry {
  stagingUrl: string
  filename: string
  mimeType: string
  fileSize: number
  width: number
  height: number
}

/**
 * Upload a media file (image or video) to R2 and create a MediaAsset record.
 * Returns the permanent public URL and media metadata.
 *
 * @throws Error with user-friendly message on failure
 */
export async function uploadMediaToR2(
  file: File,
  folder = "Content"
): Promise<UploadResult> {
  // --- Validate ---
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Only image and video files are allowed")
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(
      `File exceeds ${MAX_UPLOAD_SIZE / (1024 * 1024)} MB limit`
    )
  }

  // Ensure folder exists (fire-and-forget)
  fetch("/api/v1/media/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: folder }),
  }).catch(() => {})

  // Step 1: Get presigned upload URL
  const urlRes = await fetch("/api/v1/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
      context: "media",
    }),
  })
  if (!urlRes.ok) {
    const urlJson = await urlRes.json().catch(() => null)
    throw new Error(urlJson?.error?.message || "Failed to get upload URL")
  }
  const urlJson = await urlRes.json()
  if (!urlJson.success) {
    throw new Error(urlJson.error?.message || "Failed to get upload URL")
  }

  // Step 2: Upload directly to R2
  const putRes = await fetch(urlJson.data.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  })
  if (!putRes.ok) {
    throw new Error("Failed to upload file to storage")
  }

  // Step 3: Get media dimensions
  const dims = await getMediaDimensions(file)

  // Step 4: Create MediaAsset record (promotes staging -> permanent)
  const createRes = await fetch("/api/v1/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      url: urlJson.data.publicUrl,
      mimeType: file.type,
      fileSize: file.size,
      width: dims.width || undefined,
      height: dims.height || undefined,
      folder,
    }),
  })
  if (!createRes.ok) {
    const createJson = await createRes.json().catch(() => null)
    throw new Error(createJson?.error?.message || "Failed to create media record")
  }
  const createJson = await createRes.json()
  if (!createJson.success) {
    throw new Error(createJson.error?.message || "Failed to create media record")
  }

  return {
    url: createJson.data.url,
    width: dims.width,
    height: dims.height,
    fileSize: file.size,
    filename: file.name,
    mimeType: file.type,
  }
}

/**
 * Upload an image file to R2 and create a MediaAsset record.
 * Validates that the file is an image, then delegates to uploadMediaToR2.
 *
 * @throws Error with user-friendly message on failure
 */
export async function uploadImageToR2(
  file: File,
  folder = "Content"
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed")
  }
  return uploadMediaToR2(file, folder)
}

/**
 * Upload a media file (image or video) to R2 staging ONLY — no MediaAsset
 * record, no promotion. The staging URL is publicly accessible via R2 public
 * URL, so editors can display it immediately. The file remains in staging
 * until the parent form saves (calls promoteStagingImages) or is abandoned
 * (cleaned up by the orphan cleanup script after 24h).
 *
 * @throws Error with user-friendly message on failure
 */
export async function uploadMediaToStaging(
  file: File
): Promise<StagingUploadResult> {
  // --- Validate ---
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    throw new Error("Only image and video files are allowed")
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(
      `File exceeds ${MAX_UPLOAD_SIZE / (1024 * 1024)} MB limit`
    )
  }

  // Step 1: Get presigned upload URL (staging)
  const urlRes = await fetch("/api/v1/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
      context: "media",
    }),
  })
  if (!urlRes.ok) {
    const urlJson = await urlRes.json().catch(() => null)
    throw new Error(urlJson?.error?.message || "Failed to get upload URL")
  }
  const urlJson = await urlRes.json()
  if (!urlJson.success) {
    throw new Error(urlJson.error?.message || "Failed to get upload URL")
  }

  // Step 2: Upload directly to R2 staging
  const putRes = await fetch(urlJson.data.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  })
  if (!putRes.ok) {
    throw new Error("Failed to upload file to storage")
  }

  // Step 3: Get media dimensions
  const dims = await getMediaDimensions(file)

  return {
    stagingUrl: urlJson.data.publicUrl,
    stagingKey: urlJson.data.key,
    width: dims.width,
    height: dims.height,
    fileSize: file.size,
    filename: file.name,
    mimeType: file.type,
  }
}

/**
 * Upload an image to R2 staging ONLY.
 * Validates that the file is an image, then delegates to uploadMediaToStaging.
 *
 * @throws Error with user-friendly message on failure
 */
export async function uploadImageToStaging(
  file: File
): Promise<StagingUploadResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed")
  }
  return uploadMediaToStaging(file)
}

/**
 * Bulk promote staging images to permanent storage and create MediaAsset records.
 * Returns a map of stagingUrl → permanentUrl so the caller can replace URLs
 * in the saved content.
 *
 * @throws Error if any promotion fails (partial success is possible)
 */
export async function promoteStagingImages(
  entries: StagingImageEntry[],
  folder = "Content"
): Promise<Map<string, string>> {
  if (entries.length === 0) return new Map()

  // Ensure folder exists (fire-and-forget)
  fetch("/api/v1/media/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: folder }),
  }).catch(() => {})

  const res = await fetch("/api/v1/media/promote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries, folder }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(json?.error?.message || "Failed to promote staging images")
  }

  const json = await res.json()
  if (!json.success) {
    throw new Error(json.error?.message || "Failed to promote staging images")
  }

  // json.data.promoted is an array of { stagingUrl, permanentUrl }
  const urlMap = new Map<string, string>()
  for (const item of json.data.promoted) {
    urlMap.set(item.stagingUrl, item.permanentUrl)
  }
  return urlMap
}

/**
 * Replace staging URLs with permanent URLs in a TipTap JSON content string.
 * Returns the updated JSON string.
 */
export function replaceStagingUrls(
  contentJson: string,
  urlMap: Map<string, string>
): string {
  if (urlMap.size === 0) return contentJson
  let result = contentJson
  for (const [staging, permanent] of urlMap) {
    result = result.replaceAll(staging, permanent)
  }
  return result
}

/**
 * Hard-delete a media asset from R2 storage and the database by its public URL.
 * This permanently removes both the R2 object and the MediaAsset DB record.
 *
 * @param url The R2 public URL of the media asset
 * @throws Error with user-friendly message on failure
 */
export async function deleteImageFromR2(url: string): Promise<void> {
  if (!url || typeof url !== "string") {
    throw new Error("A valid media URL is required")
  }

  const res = await fetch("/api/v1/media/by-url", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })

  if (!res.ok) {
    const json = await res.json().catch(() => null)
    // 404 is acceptable — asset may already be deleted
    if (res.status === 404) return
    throw new Error(json?.error?.message || "Failed to delete media asset")
  }
}

// ---------------------------------------------------------------------------
// Dimension helpers
// ---------------------------------------------------------------------------

function getMediaDimensions(file: File): Promise<{ width: number; height: number }> {
  if (file.type.startsWith("video/")) {
    return getVideoDimensions(file)
  }
  return getImageDimensions(file)
}

function getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    const objectUrl = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight })
      URL.revokeObjectURL(objectUrl)
    }
    video.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(objectUrl)
    }
    video.src = objectUrl
  })
}

function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(objectUrl)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  })
}
