import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { createMediaAsset } from '@/lib/dal/media'
import { moveObject, deleteObject, isStagingKey, keyFromMediaUrl, getMediaPublicUrl, buildContentDisposition, MEDIA_BUCKET } from '@/lib/storage/r2'

// ---------------------------------------------------------------------------
// POST /api/v1/media/promote — Bulk promote staging images to permanent
// ---------------------------------------------------------------------------

interface PromoteEntry {
  stagingUrl: string
  filename: string
  mimeType: string
  fileSize: number
  width: number
  height: number
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('media.upload')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()
    const { entries, folder } = body as {
      entries?: PromoteEntry[]
      folder?: string
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'entries array is required and must not be empty' } },
        { status: 400 },
      )
    }

    // Cap at 50 entries per request to prevent abuse
    if (entries.length > 50) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Maximum 50 entries per request' } },
        { status: 400 },
      )
    }

    const promoted: { stagingUrl: string; permanentUrl: string }[] = []
    const targetFolder = folder || 'Content'

    for (const entry of entries) {
      const { stagingUrl, filename, mimeType, fileSize, width, height } = entry

      if (!stagingUrl || !filename || !mimeType || fileSize == null) {
        continue // skip invalid entries
      }

      // Verify this is actually a staging URL
      const srcKey = keyFromMediaUrl(stagingUrl)
      if (!srcKey || !isStagingKey(srcKey)) {
        // Already permanent or not our URL — pass through unchanged
        promoted.push({ stagingUrl, permanentUrl: stagingUrl })
        continue
      }

      // Build permanent key
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
      const destKey = `${churchSlug}/${category}/${year}/${uuidFilename}`

      // Promote in R2
      let permanentUrl: string
      try {
        await moveObject(srcKey, destKey, MEDIA_BUCKET, buildContentDisposition(filename))
        permanentUrl = getMediaPublicUrl(destKey)
      } catch (moveError) {
        console.error(`Failed to promote ${srcKey}:`, moveError)
        // If move fails, keep the staging URL — it's still accessible
        promoted.push({ stagingUrl, permanentUrl: stagingUrl })
        continue
      }

      // Create DB record — roll back R2 promotion if this fails
      try {
        await createMediaAsset(churchId, {
          filename,
          url: permanentUrl,
          mimeType,
          fileSize,
          width: width ?? null,
          height: height ?? null,
          alt: null,
          folder: targetFolder,
          createdBy: authResult.userId,
        })
      } catch (dbError) {
        // Clean up promoted R2 object to prevent orphans
        try { await deleteObject(destKey, MEDIA_BUCKET) } catch { /* best effort */ }
        console.error(`Failed to create MediaAsset for ${destKey}:`, dbError)
        promoted.push({ stagingUrl, permanentUrl: stagingUrl })
        continue
      }

      promoted.push({ stagingUrl, permanentUrl })
    }

    return NextResponse.json({ success: true, data: { promoted } })
  } catch (error) {
    console.error('POST /api/v1/media/promote error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to promote staging images' } },
      { status: 500 },
    )
  }
}
