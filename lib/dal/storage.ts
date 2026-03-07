import { prisma } from '@/lib/db'

/** 10 GB default quota per church (in bytes) */
export const DEFAULT_STORAGE_QUOTA = 10 * 1024 * 1024 * 1024 // 10 GB

/**
 * Get the total storage usage for a church in bytes.
 * Sums fileSize across MediaAsset (non-deleted) and BibleStudyAttachment.
 */
export async function getChurchStorageUsage(churchId: string): Promise<number> {
  const [mediaResult, attachmentResult] = await Promise.all([
    prisma.mediaAsset.aggregate({
      where: { churchId },
      _sum: { fileSize: true },
    }),
    prisma.bibleStudyAttachment.aggregate({
      where: { bibleStudy: { churchId } },
      _sum: { fileSize: true },
    }),
  ])

  return (mediaResult._sum.fileSize ?? 0) + (attachmentResult._sum.fileSize ?? 0)
}

/**
 * Check if a church can upload a file of the given size.
 * Returns { allowed, currentUsage, quota, remaining }.
 */
export async function checkStorageQuota(
  churchId: string,
  additionalBytes: number,
  quota = DEFAULT_STORAGE_QUOTA,
): Promise<{
  allowed: boolean
  currentUsage: number
  quota: number
  remaining: number
}> {
  const currentUsage = await getChurchStorageUsage(churchId)
  const remaining = Math.max(0, quota - currentUsage)
  return {
    allowed: currentUsage + additionalBytes <= quota,
    currentUsage,
    quota,
    remaining,
  }
}

/**
 * Format bytes into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}
