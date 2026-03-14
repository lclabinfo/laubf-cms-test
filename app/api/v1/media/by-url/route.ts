import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { hardDeleteMediaAssetByUrl } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// DELETE /api/v1/media/by-url — Hard-delete a media asset by its public URL
// Removes both the R2 object and the DB record permanently.
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('media.delete')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()
    const { url } = body as { url?: string }

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'url is required' } },
        { status: 400 },
      )
    }

    const deleted = await hardDeleteMediaAssetByUrl(churchId, url)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found for the given URL' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/v1/media/by-url error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete media asset' } },
      { status: 500 },
    )
  }
}
