/**
 * migrate-attachments-to-r2.mts
 *
 * Uploads all BibleStudyAttachment files from public/legacy-files/ to R2
 * and updates the database URLs accordingly.
 *
 * Usage:
 *   npx tsx scripts/migrate-attachments-to-r2.mts            # real run
 *   npx tsx scripts/migrate-attachments-to-r2.mts --dry-run   # preview only
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

// ---------------------------------------------------------------------------
// Prisma setup (same pattern as prisma/seed.mts)
// ---------------------------------------------------------------------------

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// R2 setup (inline to avoid path-alias issues in standalone .mts)
// ---------------------------------------------------------------------------

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  )
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CHURCH_SLUG = 'la-ubf'
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..')
const CONCURRENCY = 10
const DRY_RUN = process.argv.includes('--dry-run')

// ---------------------------------------------------------------------------
// Content type mapping
// ---------------------------------------------------------------------------

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
  '.hwp': 'application/x-hwp',
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

// ---------------------------------------------------------------------------
// Process a batch of attachments concurrently
// ---------------------------------------------------------------------------

interface Stats {
  total: number
  uploaded: number
  skipped_r2: number
  skipped_missing: number
  failed: number
  totalBytes: number
}

async function processAttachment(
  attachment: { id: string; url: string; fileSize: number | null },
  stats: Stats,
): Promise<void> {
  const { id, url } = attachment

  // Idempotent: skip if URL already points to R2
  if (url.startsWith('http://') || url.startsWith('https://')) {
    stats.skipped_r2++
    return
  }

  // Parse URL: /legacy-files/{slug}/{filename}
  // R2 key:    la-ubf/{slug}/{filename}
  const stripped = url.replace(/^\/legacy-files\//, '')
  const r2Key = `${CHURCH_SLUG}/${stripped}`
  const localPath = path.join(PROJECT_ROOT, 'public', url)

  // Check file exists
  if (!fs.existsSync(localPath)) {
    stats.skipped_missing++
    if (!DRY_RUN) {
      console.warn(`  MISSING: ${localPath}`)
    }
    return
  }

  const fileStat = fs.statSync(localPath)
  const fileSize = fileStat.size

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would upload: ${localPath} -> ${r2Key} (${(fileSize / 1024).toFixed(1)} KB)`)
    stats.uploaded++
    stats.totalBytes += fileSize
    return
  }

  try {
    const fileBuffer = fs.readFileSync(localPath)
    const contentType = getContentType(localPath)

    await uploadFile(r2Key, fileBuffer, contentType)

    const publicUrl = `${R2_PUBLIC_URL}/${r2Key}`

    await prisma.bibleStudyAttachment.update({
      where: { id },
      data: {
        url: publicUrl,
        fileSize,
      },
    })

    stats.uploaded++
    stats.totalBytes += fileSize
  } catch (err) {
    stats.failed++
    console.error(`  FAILED: ${localPath}`, err)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nMigrate BibleStudyAttachments to R2`)
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`Concurrency: ${CONCURRENCY}\n`)

  // Fetch all attachments
  const attachments = await prisma.bibleStudyAttachment.findMany({
    select: { id: true, url: true, fileSize: true },
  })

  console.log(`Found ${attachments.length} attachment records\n`)

  const stats: Stats = {
    total: attachments.length,
    uploaded: 0,
    skipped_r2: 0,
    skipped_missing: 0,
    failed: 0,
    totalBytes: 0,
  }

  // Process in batches of CONCURRENCY
  for (let i = 0; i < attachments.length; i += CONCURRENCY) {
    const batch = attachments.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map((a) => processAttachment(a, stats)))

    const progress = Math.min(i + CONCURRENCY, attachments.length)
    const pct = ((progress / attachments.length) * 100).toFixed(1)
    process.stdout.write(`\r  Progress: ${progress}/${attachments.length} (${pct}%)`)
  }

  console.log('\n')
  console.log('=== Summary ===')
  console.log(`  Total records:    ${stats.total}`)
  console.log(`  Uploaded:         ${stats.uploaded}`)
  console.log(`  Skipped (R2):     ${stats.skipped_r2}`)
  console.log(`  Skipped (missing):${stats.skipped_missing}`)
  console.log(`  Failed:           ${stats.failed}`)
  console.log(`  Total size:       ${(stats.totalBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log()
}

try {
  await main()
} catch (err) {
  console.error('Fatal error:', err)
  process.exit(1)
} finally {
  await prisma.$disconnect()
  await pool.end()
}
