import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { getMediaAsset, updateMediaAsset, deleteMediaAsset } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// GET /api/v1/media/[id] — Get a single media asset
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

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
    const authResult = await requireApiAuth('EDITOR')
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
// DELETE /api/v1/media/[id] — Soft-delete a media asset
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireApiAuth('ADMIN')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { id } = await params

    // Soft-delete only — R2 file kept until hard-delete per project strategy
    const deleted = await deleteMediaAsset(churchId, id)
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
