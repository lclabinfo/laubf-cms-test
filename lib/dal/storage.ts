import { prisma } from '@/lib/db'
import {
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'

/** 10 GB default quota per church (in bytes) */
export const DEFAULT_STORAGE_QUOTA = 10 * 1024 * 1024 * 1024 // 10 GB

/** Lazy-init S3 client for R2 scanning */
let _s3: S3Client | null = null
function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _s3
}

/**
 * Get the total storage usage for a church in bytes.
 * Sums fileSize across MediaAsset (non-deleted) and BibleStudyAttachment.
 */
export async function getChurchStorageUsage(churchId: string): Promise<number> {
  const [mediaResult, attachmentResult] = await Promise.all([
    prisma.mediaAsset.aggregate({
      where: { churchId, deletedAt: null },
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
 * Get a detailed storage breakdown for the dashboard.
 * Returns usage by category (media vs attachments), media by type, and top consuming files.
 */
export async function getStorageBreakdown(churchId: string) {
  const [
    mediaTotal,
    attachmentTotal,
    mediaByType,
    mediaCount,
    attachmentCount,
    topMediaAssets,
    topAttachments,
  ] = await Promise.all([
    // Total media bytes
    prisma.mediaAsset.aggregate({
      where: { churchId, deletedAt: null },
      _sum: { fileSize: true },
    }),
    // Total attachment bytes
    prisma.bibleStudyAttachment.aggregate({
      where: { bibleStudy: { churchId } },
      _sum: { fileSize: true },
    }),
    // Media grouped by mime type prefix (images, audio, video, other)
    prisma.$queryRaw<Array<{ category: string; total_bytes: bigint; file_count: bigint }>>`
      SELECT
        CASE
          WHEN "mimeType" LIKE 'image/%' THEN 'images'
          WHEN "mimeType" LIKE 'audio/%' THEN 'audio'
          WHEN "mimeType" LIKE 'video/%' THEN 'video'
          ELSE 'other'
        END AS category,
        COALESCE(SUM("fileSize"), 0)::bigint AS total_bytes,
        COUNT(*)::bigint AS file_count
      FROM "MediaAsset"
      WHERE "churchId" = ${churchId}::uuid AND "deletedAt" IS NULL
      GROUP BY category
      ORDER BY total_bytes DESC
    `,
    // Total media file count
    prisma.mediaAsset.count({ where: { churchId, deletedAt: null } }),
    // Total attachment file count
    prisma.bibleStudyAttachment.count({ where: { bibleStudy: { churchId } } }),
    // Top 10 largest media assets
    prisma.mediaAsset.findMany({
      where: { churchId, deletedAt: null },
      orderBy: { fileSize: 'desc' },
      take: 10,
      select: {
        id: true,
        filename: true,
        mimeType: true,
        fileSize: true,
        url: true,
        folder: true,
        createdAt: true,
      },
    }),
    // Top 10 largest attachments
    prisma.bibleStudyAttachment.findMany({
      where: { bibleStudy: { churchId }, fileSize: { not: null } },
      orderBy: { fileSize: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        type: true,
        fileSize: true,
        url: true,
        createdAt: true,
        bibleStudy: {
          select: {
            slug: true,
            title: true,
            relatedMessage: { select: { id: true } },
          },
        },
      },
    }),
  ])

  const mediaBytes = mediaTotal._sum.fileSize ?? 0
  const attachmentBytes = attachmentTotal._sum.fileSize ?? 0
  const totalBytes = mediaBytes + attachmentBytes

  return {
    totalBytes,
    mediaBytes,
    attachmentBytes,
    mediaCount,
    attachmentCount,
    mediaByType: mediaByType.map((r) => ({
      category: r.category,
      totalBytes: Number(r.total_bytes),
      fileCount: Number(r.file_count),
    })),
    topFiles: [
      ...topMediaAssets.map((a) => ({
        id: a.id,
        name: a.filename,
        type: a.mimeType,
        fileSize: a.fileSize,
        url: a.url,
        source: 'media' as const,
        folder: a.folder,
        createdAt: a.createdAt.toISOString(),
        context: a.folder === '/' ? 'Media Library' : `Media / ${a.folder}`,
        linkHref: `/cms/media?assetId=${a.id}`,
      })),
      ...topAttachments.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        fileSize: a.fileSize ?? 0,
        url: a.url,
        source: 'attachment' as const,
        folder: null,
        createdAt: a.createdAt.toISOString(),
        context: a.bibleStudy
          ? `Bible Study: ${a.bibleStudy.title}`
          : 'Bible Study Attachment',
        linkHref: a.bibleStudy?.relatedMessage?.id
          ? `/cms/messages/${a.bibleStudy.relatedMessage.id}?section=attachments`
          : null,
      })),
    ]
      .sort((a, b) => b.fileSize - a.fileSize)
      .slice(0, 15),
  }
}

/**
 * Scan R2 for system/default files not tracked in the database.
 * These include custom fonts and default event templates.
 */
export async function getDefaultFilesUsage(churchSlug: string): Promise<{
  totalBytes: number
  fileCount: number
  categories: { label: string; bytes: number; fileCount: number }[]
}> {
  const s3 = getS3()
  const mediaBucket = process.env.R2_MEDIA_BUCKET_NAME!

  // Prefixes to scan for non-DB-tracked system files
  const prefixes = [
    { prefix: `${churchSlug}/fonts/`, label: 'Custom Fonts' },
    { prefix: 'defaults/event-templates/', label: 'Event Templates' },
  ]

  const categories: { label: string; bytes: number; fileCount: number }[] = []
  let totalBytes = 0
  let totalCount = 0

  for (const { prefix, label } of prefixes) {
    let bytes = 0
    let count = 0
    let token: string | undefined
    do {
      const res = await s3.send(
        new ListObjectsV2Command({ Bucket: mediaBucket, Prefix: prefix, ContinuationToken: token })
      )
      for (const obj of res.Contents ?? []) {
        if (obj.Size !== undefined) {
          bytes += obj.Size
          count++
        }
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined
    } while (token)

    if (count > 0) {
      categories.push({ label, bytes, fileCount: count })
      totalBytes += bytes
      totalCount += count
    }
  }

  return { totalBytes, fileCount: totalCount, categories }
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
