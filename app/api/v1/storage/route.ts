import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChurchId } from '@/lib/api/get-church-id'
import { getChurchStorageUsage, DEFAULT_STORAGE_QUOTA, formatBytes } from '@/lib/dal/storage'

// ---------------------------------------------------------------------------
// GET /api/v1/storage — Get storage usage for the current church
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
    const currentUsage = await getChurchStorageUsage(churchId)
    const quota = DEFAULT_STORAGE_QUOTA
    const remaining = Math.max(0, quota - currentUsage)
    const percentUsed = quota > 0 ? Math.round((currentUsage / quota) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        currentUsage,
        quota,
        remaining,
        percentUsed,
        currentUsageFormatted: formatBytes(currentUsage),
        quotaFormatted: formatBytes(quota),
      },
    })
  } catch (error) {
    console.error('GET /api/v1/storage error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get storage usage' } },
      { status: 500 },
    )
  }
}
