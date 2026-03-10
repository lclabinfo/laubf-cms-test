/**
 * Fix BibleStudyAttachment fileSize values by reading actual sizes from R2.
 * The seed used hardcoded estimates; this replaces them with real R2 object sizes.
 *
 * Usage: npx tsx scripts/fix-attachment-filesizes.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'

// ── Prisma ──────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new (mod.PrismaClient)({ adapter })

// ── R2 ──────────────────────────────────────────────────────
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const ATTACHMENTS_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!
const ATTACHMENTS_PUBLIC_URL = (process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || '').replace(/\/+$/, '')

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

function keyFromUrl(url: string): string | null {
  if (!ATTACHMENTS_PUBLIC_URL || !url.startsWith(ATTACHMENTS_PUBLIC_URL)) return null
  return url.slice(ATTACHMENTS_PUBLIC_URL.length + 1)
}

async function getR2Size(key: string): Promise<number | null> {
  try {
    const head = await s3.send(new HeadObjectCommand({
      Bucket: ATTACHMENTS_BUCKET,
      Key: key,
    }))
    return head.ContentLength ?? null
  } catch {
    return null
  }
}

async function main() {
  // Get all attachments
  const attachments = await prisma.bibleStudyAttachment.findMany({
    select: { id: true, url: true, fileSize: true, name: true },
  })
  console.log(`Total attachments: ${attachments.length}`)

  let updated = 0
  let notFound = 0
  let errors = 0
  let unchanged = 0
  let totalOldBytes = 0
  let totalNewBytes = 0

  // Process in batches of 50 concurrent requests
  const BATCH_SIZE = 50
  for (let i = 0; i < attachments.length; i += BATCH_SIZE) {
    const batch = attachments.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(
      batch.map(async (att) => {
        const key = keyFromUrl(att.url)
        if (!key) return { att, size: null, error: 'no-key' }

        const size = await getR2Size(key)
        return { att, size, error: size === null ? 'not-found' : null }
      })
    )

    for (const { att, size, error } of results) {
      totalOldBytes += att.fileSize ?? 0

      if (error === 'no-key') {
        errors++
        continue
      }

      if (size === null) {
        notFound++
        continue
      }

      totalNewBytes += size

      if (att.fileSize === size) {
        unchanged++
        continue
      }

      await prisma.bibleStudyAttachment.update({
        where: { id: att.id },
        data: { fileSize: size },
      })
      updated++
    }

    // Progress
    const done = Math.min(i + BATCH_SIZE, attachments.length)
    process.stdout.write(`\r  Processing: ${done}/${attachments.length}`)
  }

  console.log('\n')
  console.log(`Updated:   ${updated}`)
  console.log(`Unchanged: ${unchanged}`)
  console.log(`Not found: ${notFound}`)
  console.log(`Errors:    ${errors}`)
  console.log()
  console.log(`Old total: ${(totalOldBytes / 1024 / 1024).toFixed(1)} MB (from estimates)`)
  console.log(`New total: ${(totalNewBytes / 1024 / 1024).toFixed(1)} MB (from R2)`)
  console.log(`Difference: ${((totalOldBytes - totalNewBytes) / 1024 / 1024).toFixed(1)} MB overcounted`)

  await pool.end()
}

main().catch(console.error)
