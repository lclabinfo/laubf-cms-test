/**
 * Sync R2 objects under la-ubf/initial-setup/ into the MediaAsset table.
 * Idempotent — skips files whose URL already exists.
 *
 * Usage: npx tsx scripts/sync-r2-media-assets.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { basename, extname } from 'path'

// ── Prisma ──────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new (mod.PrismaClient)({ adapter })

// ── R2 ──────────────────────────────────────────────────────
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const BUCKET = process.env.R2_MEDIA_BUCKET_NAME!
const PUBLIC_URL = process.env.R2_MEDIA_PUBLIC_URL!.replace(/\/+$/, '')

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

// ── Config ──────────────────────────────────────────────────
const R2_PREFIX = 'la-ubf/initial-setup/'
const CHURCH_SLUG = process.env.CHURCH_SLUG || 'la-ubf'

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
}

/**
 * Derive a readable media-library folder from the R2 key.
 * e.g. "la-ubf/initial-setup/images/compressed/home/file.jpg" → "/initial-setup/images/home"
 *      "la-ubf/initial-setup/logo/file.svg" → "/initial-setup/logo"
 */
function deriveFolder(): string {
  return 'initial-setup'
}

function deriveAlt(filename: string): string {
  // "compressed-sunday-worship.jpg" → "Sunday Worship"
  return filename
    .replace(/^compressed-/, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim()
}

async function main() {
  // Resolve churchId
  const church = await prisma.church.findFirst({ where: { slug: CHURCH_SLUG } })
  if (!church) {
    console.error(`Church not found for slug: ${CHURCH_SLUG}`)
    process.exit(1)
  }
  const churchId = church.id
  console.log(`Church: ${church.name} (${churchId})`)

  // Get all existing media URLs to skip duplicates
  const existing = await prisma.mediaAsset.findMany({
    where: { churchId },
    select: { url: true },
  })
  const existingUrls = new Set(existing.map(m => m.url))
  console.log(`Existing media assets: ${existingUrls.size}`)

  // Collect all folders we need to create
  const foldersNeeded = new Set<string>()

  // List all R2 objects
  let created = 0
  let skipped = 0
  let continuationToken: string | undefined

  const records: Array<{
    key: string
    size: number
  }> = []

  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: R2_PREFIX,
        ContinuationToken: continuationToken,
      }),
    )
    for (const obj of list.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined) {
        records.push({ key: obj.Key, size: obj.Size })
      }
    }
    continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (continuationToken)

  console.log(`Found ${records.length} R2 objects under ${R2_PREFIX}`)

  // Create media assets
  for (const { key, size } of records) {
    const url = `${PUBLIC_URL}/${key}`

    if (existingUrls.has(url)) {
      skipped++
      continue
    }

    const filename = basename(key)
    const ext = extname(filename).toLowerCase()
    const mimeType = MIME_MAP[ext]
    if (!mimeType) {
      console.log(`  Skipping unknown type: ${key}`)
      skipped++
      continue
    }

    const folder = deriveFolder()
    foldersNeeded.add(folder)

    await prisma.mediaAsset.create({
      data: {
        churchId,
        filename,
        url,
        mimeType,
        fileSize: size,
        alt: deriveAlt(filename),
        folder,
      },
    })
    console.log(`  ✅ ${filename} → ${folder}`)
    created++
  }

  // Create MediaFolder records for each unique folder
  for (const folderName of foldersNeeded) {
    await prisma.mediaFolder.upsert({
      where: { churchId_name: { churchId, name: folderName } },
      update: {},
      create: { churchId, name: folderName },
    })
  }
  console.log(`\nEnsured ${foldersNeeded.size} media folders exist`)

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`)
  await pool.end()
}

main().catch(console.error)
