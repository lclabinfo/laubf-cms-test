import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getUploadUrl, getPublicUrl } from '@/lib/storage/r2'

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
    'audio/mpeg',
    'application/pdf',
  ],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

// ---------------------------------------------------------------------------
// POST /api/v1/upload-url
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Resolve church context (also validates session when available)
    await getChurchId()

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
    if (fileSize == null || typeof fileSize !== 'number') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'fileSize is required' } },
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

    // --- Validate file size ---
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: `File size exceeds maximum of 50 MB` } },
        { status: 400 },
      )
    }

    // --- Generate object key ---
    const slug = process.env.CHURCH_SLUG || 'la-ubf'
    const sanitized = filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')  // replace unsafe chars
      .replace(/_{2,}/g, '_')             // collapse repeated underscores
      .toLowerCase()
    const uuid = crypto.randomUUID()
    const key = `${slug}/staging/${uuid}-${sanitized}`

    // --- Get presigned URL ---
    const uploadUrl = await getUploadUrl(key, contentType)
    const publicUrl = getPublicUrl(key)

    return NextResponse.json({
      success: true,
      data: { uploadUrl, key, publicUrl },
    })
  } catch (error) {
    console.error('POST /api/v1/upload-url error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate upload URL' } },
      { status: 500 },
    )
  }
}
