import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import {
  getChurchStorageUsage,
  getStorageBreakdown,
  getDefaultFilesUsage,
  DEFAULT_STORAGE_QUOTA,
  formatBytes,
} from '@/lib/dal/storage'

// ---------------------------------------------------------------------------
// GET /api/v1/storage — Get storage usage for the current church
// ?detail=true returns full breakdown for the storage dashboard
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('storage.view')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const detail = request.nextUrl.searchParams.get('detail') === 'true'

    if (detail) {
      const churchSlug = process.env.CHURCH_SLUG || 'la-ubf'
      const [breakdown, defaultFiles] = await Promise.all([
        getStorageBreakdown(churchId),
        getDefaultFilesUsage(churchSlug),
      ])
      const totalWithDefaults = breakdown.totalBytes + defaultFiles.totalBytes
      const quota = DEFAULT_STORAGE_QUOTA
      const remaining = Math.max(0, quota - totalWithDefaults)
      const percentUsed = quota > 0 ? Math.round((totalWithDefaults / quota) * 100) : 0

      return NextResponse.json({
        success: true,
        data: {
          currentUsage: totalWithDefaults,
          quota,
          remaining,
          percentUsed,
          currentUsageFormatted: formatBytes(totalWithDefaults),
          quotaFormatted: formatBytes(quota),
          remainingFormatted: formatBytes(remaining),
          breakdown: {
            media: {
              bytes: breakdown.mediaBytes,
              formatted: formatBytes(breakdown.mediaBytes),
              fileCount: breakdown.mediaCount,
              percent: totalWithDefaults > 0
                ? Math.round((breakdown.mediaBytes / totalWithDefaults) * 100)
                : 0,
            },
            attachments: {
              bytes: breakdown.attachmentBytes,
              formatted: formatBytes(breakdown.attachmentBytes),
              fileCount: breakdown.attachmentCount,
              percent: totalWithDefaults > 0
                ? Math.round((breakdown.attachmentBytes / totalWithDefaults) * 100)
                : 0,
            },
            defaults: {
              bytes: defaultFiles.totalBytes,
              formatted: formatBytes(defaultFiles.totalBytes),
              fileCount: defaultFiles.fileCount,
              percent: totalWithDefaults > 0
                ? Math.round((defaultFiles.totalBytes / totalWithDefaults) * 100)
                : 0,
              categories: defaultFiles.categories.map((c) => ({
                ...c,
                formatted: formatBytes(c.bytes),
              })),
            },
            mediaByType: breakdown.mediaByType.map((t) => ({
              ...t,
              formatted: formatBytes(t.totalBytes),
            })),
          },
          topFiles: breakdown.topFiles.map((f) => ({
            ...f,
            fileSizeFormatted: formatBytes(f.fileSize),
          })),
        },
      })
    }

    // Simple usage response (used by media page sidebar)
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
