import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { bulkHardDelete } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// POST /api/v1/media/bulk-delete — Hard-delete multiple media assets (R2 + DB)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('media.delete')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()
    const { ids } = body as { ids?: string[] }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ids array is required' } },
        { status: 400 },
      )
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Maximum 100 items per batch' } },
        { status: 400 },
      )
    }

    const result = await bulkHardDelete(churchId, ids)

    return NextResponse.json({ success: true, data: { deletedCount: result.count } })
  } catch (error) {
    console.error('POST /api/v1/media/bulk-delete error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete media assets' } },
      { status: 500 },
    )
  }
}
