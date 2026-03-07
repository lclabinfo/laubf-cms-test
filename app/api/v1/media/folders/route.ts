import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChurchId } from '@/lib/api/get-church-id'
import { getDistinctFolders } from '@/lib/dal/media'

// ---------------------------------------------------------------------------
// GET /api/v1/media/folders — List distinct folder paths
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 },
      )
    }

    const churchId = await getChurchId()
    const folders = await getDistinctFolders(churchId)

    return NextResponse.json({ success: true, data: folders })
  } catch (error) {
    console.error('GET /api/v1/media/folders error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list folders' } },
      { status: 500 },
    )
  }
}
