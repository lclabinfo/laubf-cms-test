/**
 * @deprecated Use `r2-cleanup.mts` instead — it scans ALL database URL fields
 * (18+ models), not just MediaAsset + BibleStudyAttachment. This script would
 * incorrectly flag files referenced by Events, Messages, Speakers, PageSections,
 * etc. as orphans and delete them.
 *
 * Usage (use the replacement instead):
 *   npx tsx scripts/r2-cleanup.mts --dry-run           # Preview all orphans
 *   npx tsx scripts/r2-cleanup.mts --media-only        # Media bucket only
 *   npx tsx scripts/r2-cleanup.mts --attachments-only  # Attachments only
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

// ── Prisma ──────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new (mod.PrismaClient)({ adapter })

// ── R2 ──────────────────────────────────────────────────────
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!
const MEDIA_PUBLIC = process.env.R2_MEDIA_PUBLIC_URL!.replace(/\/+$/, '')
const ATT_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!
const ATT_PUBLIC = (process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')

const DELETE_MODE = process.argv.includes('--delete')

// ── Helpers ──────────────────────────────────────────────────
async function listAllObjects(bucket: string, prefix?: string): Promise<Array<{ key: string; size: number }>> {
  const objects: Array<{ key: string; size: number }> = []
  let token: string | undefined
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: token,
    }))
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined) {
        objects.push({ key: obj.Key, size: obj.Size })
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return objects
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(DELETE_MODE
    ? '🗑️  DELETE MODE — orphan files will be removed from R2'
    : '🔍 DRY RUN — pass --delete to actually remove orphans\n')

  // 1. Collect all referenced URLs from the database
  console.log('Loading referenced URLs from database...')
  const [mediaAssets, attachments] = await Promise.all([
    prisma.mediaAsset.findMany({ select: { url: true } }),
    prisma.bibleStudyAttachment.findMany({ select: { url: true } }),
  ])

  const referencedUrls = new Set<string>()
  for (const m of mediaAssets) referencedUrls.add(m.url)
  for (const a of attachments) referencedUrls.add(a.url)
  console.log(`  ${mediaAssets.length} MediaAsset URLs`)
  console.log(`  ${attachments.length} BibleStudyAttachment URLs`)
  console.log(`  ${referencedUrls.size} unique URLs total\n`)

  // 2. Scan media bucket
  console.log(`Scanning media bucket: ${MEDIA_BUCKET}`)
  const mediaObjects = await listAllObjects(MEDIA_BUCKET, 'la-ubf/')
  console.log(`  Found ${mediaObjects.length} objects`)

  const mediaOrphans: Array<{ key: string; size: number }> = []
  for (const obj of mediaObjects) {
    const publicUrl = `${MEDIA_PUBLIC}/${obj.key}`
    // Also check URL-encoded version (spaces → %20)
    const encodedUrl = `${MEDIA_PUBLIC}/${obj.key.split('/').map(s => encodeURIComponent(s)).join('/')}`
    if (!referencedUrls.has(publicUrl) && !referencedUrls.has(encodedUrl)) {
      mediaOrphans.push(obj)
    }
  }

  // 3. Scan attachments bucket
  console.log(`Scanning attachments bucket: ${ATT_BUCKET}`)
  const attObjects = await listAllObjects(ATT_BUCKET, 'la-ubf/')
  console.log(`  Found ${attObjects.length} objects`)

  const attOrphans: Array<{ key: string; size: number }> = []
  for (const obj of attObjects) {
    const publicUrl = `${ATT_PUBLIC}/${obj.key}`
    const encodedUrl = `${ATT_PUBLIC}/${obj.key.split('/').map(s => encodeURIComponent(s)).join('/')}`
    if (!referencedUrls.has(publicUrl) && !referencedUrls.has(encodedUrl)) {
      attOrphans.push(obj)
    }
  }

  // 4. Report
  const totalOrphans = mediaOrphans.length + attOrphans.length
  const totalOrphanSize = [...mediaOrphans, ...attOrphans].reduce((sum, o) => sum + o.size, 0)

  console.log(`\n━━━ Summary ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Media bucket:       ${mediaObjects.length} total, ${mediaOrphans.length} orphans`)
  console.log(`Attachments bucket: ${attObjects.length} total, ${attOrphans.length} orphans`)
  console.log(`Total orphans:      ${totalOrphans} (${formatBytes(totalOrphanSize)})`)

  if (totalOrphans === 0) {
    console.log('\n✅ No orphans found — R2 is clean!')
    await pool.end()
    return
  }

  // List orphans
  if (mediaOrphans.length > 0) {
    console.log(`\nMedia bucket orphans:`)
    for (const o of mediaOrphans) {
      console.log(`  ${o.key}  (${formatBytes(o.size)})`)
    }
  }
  if (attOrphans.length > 0) {
    console.log(`\nAttachments bucket orphans:`)
    for (const o of attOrphans) {
      console.log(`  ${o.key}  (${formatBytes(o.size)})`)
    }
  }

  // 5. Delete if in delete mode
  if (DELETE_MODE) {
    console.log(`\nDeleting ${totalOrphans} orphan objects...`)
    let deleted = 0
    for (const o of mediaOrphans) {
      await s3.send(new DeleteObjectCommand({ Bucket: MEDIA_BUCKET, Key: o.key }))
      deleted++
    }
    for (const o of attOrphans) {
      await s3.send(new DeleteObjectCommand({ Bucket: ATT_BUCKET, Key: o.key }))
      deleted++
    }
    console.log(`✅ Deleted ${deleted} orphan objects (freed ${formatBytes(totalOrphanSize)})`)
  } else {
    console.log(`\nRun with --delete to remove these ${totalOrphans} orphans`)
  }

  await pool.end()
}

main().catch(console.error)
