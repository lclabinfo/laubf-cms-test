import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getUploadUrl, getPublicUrl, getMediaPublicUrl, MEDIA_BUCKET } from '@/lib/storage/r2'
import { checkStorageQuota, formatBytes } from '@/lib/dal/storage'

// ---------------------------------------------------------------------------
// MIME type allowlists per context
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'bible-study': [
    'application/pdf',
    'application/msword',                                                          // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',     // .docx
    'application/rtf',                                                             // .rtf
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
  media: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'application/pdf',
  ],
}

// ---------------------------------------------------------------------------
// Per-type file size limits (in bytes)
// ---------------------------------------------------------------------------

function getMaxFileSize(contentType: string): number {
  if (contentType.startsWith('image/')) return 15 * 1024 * 1024    // 15 MB
  if (contentType.startsWith('audio/')) return 100 * 1024 * 1024   // 100 MB
  if (contentType.startsWith('video/')) return 15 * 1024 * 1024    // 15 MB
  return 50 * 1024 * 1024                                          // 50 MB (documents)
}

function formatMB(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

// ---------------------------------------------------------------------------
// POST /api/v1/upload-url
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // --- Authentication gate ---
    const authResult = await requireApiAuth('media.upload')
    if (!authResult.authorized) return authResult.response

    // Resolve church context
    const churchId = await getChurchId()

    const body = await request.json()
    const { filename, contentType, fileSize, context } = body as {
      filename?: string
      contentType?: string
      fileSize?: number
      context?: string
    }

    // --- Validate required fields ---
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'filename is required' } },
        { status: 400 },
      )
    }
    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'contentType is required' } },
        { status: 400 },
      )
    }
    if (fileSize == null || typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'fileSize is required and must be positive' } },
        { status: 400 },
      )
    }
    if (!context || !ALLOWED_MIME_TYPES[context]) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `context must be one of: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}` } },
        { status: 400 },
      )
    }

    // --- Validate MIME type ---
    if (!ALLOWED_MIME_TYPES[context].includes(contentType)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `File type "${contentType}" is not allowed for context "${context}"` } },
        { status: 400 },
      )
    }

    // --- Validate per-type file size ---
    const maxSize = getMaxFileSize(contentType)
    if (fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `File size exceeds maximum of ${formatMB(maxSize)} for this file type` } },
        { status: 400 },
      )
    }

    // --- Validate storage quota ---
    const quota = await checkStorageQuota(churchId, fileSize)
    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'QUOTA_EXCEEDED',
            message: `Storage quota exceeded. ${formatBytes(quota.remaining)} remaining of ${formatBytes(quota.quota)} total.`,
          },
        },
        { status: 413 },
      )
    }

    // --- Determine bucket based on context ---
    const isMedia = context === 'media'
    const bucket = isMedia ? MEDIA_BUCKET : undefined // undefined = default (attachments)

    // --- Generate object key ---
    const slug = process.env.CHURCH_SLUG || 'la-ubf'
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')  // replace unsafe chars
      .replace(/_{2,}/g, '_')             // collapse repeated underscores
      .toLowerCase()
    const uuid = crypto.randomUUID()
    const key = `${slug}/staging/${uuid}-${sanitized}`

    // --- Get presigned URL (with ContentLength enforcement) ---
    const uploadUrl = await getUploadUrl(key, contentType, fileSize, { bucket })
    const publicUrl = isMedia ? getMediaPublicUrl(key) : getPublicUrl(key)

    return NextResponse.json({
      success: true,
      data: { uploadUrl, key, publicUrl, filename },
    })
  } catch (error) {
    console.error('POST /api/v1/upload-url error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate upload URL' } },
      { status: 500 },
    )
  }
}
