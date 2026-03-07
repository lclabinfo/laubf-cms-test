import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChurchId } from '@/lib/api/get-church-id'
import { bulkSoftDelete } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// POST /api/v1/media/bulk-delete — Soft-delete multiple media assets
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

    const result = await bulkSoftDelete(churchId, ids)

    return NextResponse.json({ success: true, data: { deletedCount: result.count } })
  } catch (error) {
    console.error('POST /api/v1/media/bulk-delete error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete media assets' } },
      { status: 500 },
    )
  }
}
