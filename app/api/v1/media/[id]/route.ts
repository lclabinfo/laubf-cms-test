import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getMediaAsset, updateMediaAsset, hardDeleteMediaAsset } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// GET /api/v1/media/[id] — Get a single media asset
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireApiAuth('media.view')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params

    const asset = await getMediaAsset(churchId, id)
    if (!asset) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: asset })
  } catch (error) {
    console.error('GET /api/v1/media/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get media asset' } },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/media/[id] — Update media asset metadata
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireApiAuth('media.edit_own')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()
    const { alt, folder, filename } = body as {
      alt?: string | null
      folder?: string
      filename?: string
    }

    const updated = await updateMediaAsset(churchId, id, {
      ...(alt !== undefined && { alt }),
      ...(folder !== undefined && { folder }),
      ...(filename !== undefined && { filename }),
    })

    if (!updated) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/media/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update media asset' } },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/media/[id] — Hard-delete a media asset (removes R2 file + DB record)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireApiAuth('media.delete')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params

    const deleted = await hardDeleteMediaAsset(churchId, id)
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media asset not found' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/v1/media/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete media asset' } },
      { status: 500 },
    )
  }
}
