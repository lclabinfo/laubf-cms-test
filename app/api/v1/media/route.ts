import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChurchId } from '@/lib/api/get-church-id'
import { listMedia, createMediaAsset } from '@/lib/dal/media'
import { moveObject, deleteObject, isStagingKey, keyFromMediaUrl, getMediaPublicUrl, MEDIA_BUCKET } from '@/lib/storage/r2'

// ---------------------------------------------------------------------------
// GET /api/v1/media — List media assets (cursor-paginated)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const churchId = await getChurchId()
    const { searchParams } = new URL(request.url)

    // Map type filter to MIME prefix (e.g. "image" → "image/")
    const typeParam = searchParams.get('type')
    const mimeTypePrefix = typeParam ? `${typeParam}/` : undefined

    // folder param: "/" means root-only, a name means that folder, absent means all
    const folderParam = searchParams.get('folder')

    const result = await listMedia(churchId, {
      folder: folderParam ?? undefined,
      mimeTypePrefix,
      search: searchParams.get('search') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? Math.min(parseInt(searchParams.get('limit')!, 10), 200) : undefined,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('GET /api/v1/media error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list media' } },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/media — Create a media asset (promotes staging → permanent)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const churchId = await getChurchId()
    const body = await request.json()
    const { filename, url, mimeType, fileSize, width, height, alt, folder } = body as {
      filename?: string
      url?: string
      mimeType?: string
      fileSize?: number
      width?: number | null
      height?: number | null
      alt?: string | null
      folder?: string
    }

    // --- Validate required fields ---
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'filename is required' } },
        { status: 400 },
      )
    }
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'url is required' } },
        { status: 400 },
      )
    }
    if (!mimeType || typeof mimeType !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'mimeType is required' } },
        { status: 400 },
      )
    }
    if (fileSize == null || typeof fileSize !== 'number') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'fileSize is required' } },
        { status: 400 },
      )
    }

    // --- Promote staging file to permanent key ---
    let permanentUrl = url
    let promotedDestKey: string | null = null
    const srcKey = keyFromMediaUrl(url)
    if (srcKey && isStagingKey(srcKey)) {
      const category = mimeType.startsWith('image/')
        ? 'images'
        : mimeType.startsWith('audio/')
          ? 'audio'
          : mimeType.startsWith('video/')
            ? 'video'
            : 'other'
      const year = new Date().getFullYear().toString()
      const uuidFilename = srcKey.replace(/^[^/]+\/staging\//, '')
      const churchSlug = process.env.CHURCH_SLUG || 'la-ubf'
      promotedDestKey = `${churchSlug}/${category}/${year}/${uuidFilename}`

      await moveObject(srcKey, promotedDestKey, MEDIA_BUCKET)
      permanentUrl = getMediaPublicUrl(promotedDestKey)
    }

    // Create DB record — roll back R2 promotion if this fails
    let asset
    try {
      asset = await createMediaAsset(churchId, {
        filename,
        url: permanentUrl,
        mimeType,
        fileSize,
        width: width ?? null,
        height: height ?? null,
        alt: alt ?? null,
        folder: folder || '/',
        createdBy: session.user.id,
      })
    } catch (dbError) {
      // Clean up promoted R2 object to prevent orphans
      if (promotedDestKey) {
        try { await deleteObject(promotedDestKey, MEDIA_BUCKET) } catch { /* best effort */ }
      }
      throw dbError
    }

    return NextResponse.json({ success: true, data: asset }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/media error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create media asset' } },
      { status: 500 },
    )
  }
}
