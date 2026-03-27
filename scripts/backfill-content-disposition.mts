/**
 * backfill-content-disposition.mts
 *
 * Checks R2 objects referenced by the database for missing Content-Disposition
 * headers. Uses the DB as the source of truth (no slow bucket listing), and
 * runs HeadObject checks in parallel batches for speed.
 *
 * Safety:
 *   - Preview by default. Pass --execute to actually write.
 *   - Never deletes or moves objects — only re-uploads in place with the
 *     Content-Disposition header added.
 *   - Skips objects that already have a correct Content-Disposition.
 *
 * Usage:
 *   npx tsx scripts/backfill-content-disposition.mts            # preview
 *   npx tsx scripts/backfill-content-disposition.mts --execute   # apply fixes
 */

import 'dotenv/config'
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// ── DB Setup ──────────────────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new (mod.PrismaClient)({ adapter })

// ── R2 Setup ──────────────────────────────────────────────────────────────────
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const ATTACHMENTS_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!
const ATTACHMENTS_PUBLIC_URL = (process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')
const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!
const MEDIA_PUBLIC_URL = (process.env.R2_MEDIA_PUBLIC_URL || '').replace(/\/+$/, '')

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const CONCURRENCY = 15
const dryRun = !process.argv.includes('--execute')

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildContentDisposition(filename: string): string {
  const safeFilename = filename.replace(/[\r\n"]/g, '_')
  const encodedFilename = encodeURIComponent(filename).replace(/'/g, '%27')
  return `inline; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`
}

interface FileEntry {
  key: string
  filename: string
  bucket: string
}

interface CheckResult {
  entry: FileEntry
  needsFix: boolean
  error?: string
}

/** Check a single object's Content-Disposition via HeadObject */
async function checkObject(entry: FileEntry): Promise<CheckResult> {
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: entry.bucket, Key: entry.key }),
    )
    return { entry, needsFix: !head.ContentDisposition }
  } catch (err: any) {
    if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
      return { entry, needsFix: false, error: '404 (not in R2)' }
    }
    return { entry, needsFix: false, error: err.message || String(err) }
  }
}

/** Run promises in batches of `size` */
async function batch<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    const chunkResults = await Promise.all(chunk.map(fn))
    results.push(...chunkResults)

    // Progress every 100 items
    const done = Math.min(i + size, items.length)
    if (done % 100 < size || done === items.length) {
      process.stdout.write(`  Checked ${done}/${items.length}\r`)
    }
  }
  process.stdout.write('\n')
  return results
}

async function applyContentDisposition(bucket: string, key: string, disposition: string): Promise<void> {
  const getResp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!getResp.Body) throw new Error(`No body for ${key}`)
  const body = await getResp.Body.transformToByteArray()

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: getResp.ContentType,
      ContentDisposition: disposition,
    }),
  )
}

// ── Build file lists from DB ──────────────────────────────────────────────────

async function getAttachmentEntries(): Promise<FileEntry[]> {
  const rows = await prisma.bibleStudyAttachment.findMany({
    select: { name: true, url: true },
  })
  const entries: FileEntry[] = []
  for (const row of rows) {
    if (!row.url || !row.name) continue
    if (!row.url.startsWith(ATTACHMENTS_PUBLIC_URL)) continue
    const key = row.url.slice(ATTACHMENTS_PUBLIC_URL.length + 1)
    if (key) entries.push({ key, filename: row.name, bucket: ATTACHMENTS_BUCKET })
  }
  return entries
}

async function getMediaEntries(): Promise<FileEntry[]> {
  const rows = await prisma.mediaAsset.findMany({
    select: { filename: true, url: true },
    where: { deletedAt: null },
  })
  const entries: FileEntry[] = []
  for (const row of rows) {
    if (!row.url || !row.filename) continue
    if (!row.url.startsWith(MEDIA_PUBLIC_URL)) continue
    const key = row.url.slice(MEDIA_PUBLIC_URL.length + 1)
    if (key) entries.push({ key, filename: row.filename, bucket: MEDIA_BUCKET })
  }
  return entries
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  Content-Disposition Backfill`)
  console.log(`  Mode: ${dryRun ? 'PREVIEW (pass --execute to apply)' : 'EXECUTE'}`)
  console.log(`${'='.repeat(60)}`)

  // 1. Load file lists from DB
  console.log('\nLoading file references from database...')
  const [attachmentEntries, mediaEntries] = await Promise.all([
    getAttachmentEntries(),
    getMediaEntries(),
  ])
  console.log(`  ${attachmentEntries.length} attachments, ${mediaEntries.length} media assets`)

  // Dedupe by key (same file may be referenced multiple times)
  const seen = new Set<string>()
  const allEntries: FileEntry[] = []
  for (const entry of [...attachmentEntries, ...mediaEntries]) {
    const id = `${entry.bucket}:${entry.key}`
    if (!seen.has(id)) {
      seen.add(id)
      allEntries.push(entry)
    }
  }
  console.log(`  ${allEntries.length} unique R2 objects to check`)

  // 2. Check Content-Disposition in parallel batches
  console.log(`\nChecking Content-Disposition headers (${CONCURRENCY} concurrent)...`)
  const results = await batch(allEntries, CONCURRENCY, checkObject)

  const needsFix = results.filter((r) => r.needsFix)
  const alreadyOk = results.filter((r) => !r.needsFix && !r.error)
  const errored = results.filter((r) => r.error)

  // 3. Report
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Results:`)
  console.log(`  Already OK:     ${alreadyOk.length}`)
  console.log(`  Needs fix:      ${needsFix.length}`)
  if (errored.length > 0) {
    console.log(`  Errors:         ${errored.length}`)
    for (const r of errored) {
      console.log(`    ${r.entry.key} — ${r.error}`)
    }
  }

  if (needsFix.length > 0) {
    console.log(`\n  Objects to fix:`)
    for (const r of needsFix) {
      const disp = buildContentDisposition(r.entry.filename)
      console.log(`    ${r.entry.key}`)
      console.log(`      -> ${disp}`)
    }
  }

  if (needsFix.length === 0) {
    console.log('\nAll objects already have Content-Disposition set. Nothing to do.')
    await cleanup()
    return
  }

  if (dryRun) {
    console.log(`\nPREVIEW: ${needsFix.length} object(s) would be updated.`)
    console.log('Run with --execute to apply.\n')
    await cleanup()
    return
  }

  // 4. Apply fixes (sequential — download+reupload is heavier)
  console.log(`\nApplying fixes to ${needsFix.length} object(s)...\n`)
  let fixed = 0
  let fixErrors = 0

  for (const r of needsFix) {
    const disp = buildContentDisposition(r.entry.filename)
    try {
      await applyContentDisposition(r.entry.bucket, r.entry.key, disp)
      fixed++
      console.log(`  [${fixed}/${needsFix.length}] ${r.entry.key}`)
    } catch (err) {
      fixErrors++
      console.log(`  FAILED ${r.entry.key} — ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Done: ${fixed} fixed, ${fixErrors} errors`)
  console.log(`${'='.repeat(50)}\n`)

  await cleanup()
}

async function cleanup() {
  await prisma.$disconnect()
  await pool.end()
}

main().catch(async (err) => {
  console.error('Fatal error:', err)
  await cleanup()
  process.exit(1)
})
