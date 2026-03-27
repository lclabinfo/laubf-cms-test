/**
 * Upload default event template SVG images to R2 under defaults/event-templates/ prefix.
 * These live at the same hierarchy level as church slugs (e.g. la-ubf/).
 *
 * Usage: npx tsx scripts/upload-default-event-templates.mts
 */
import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const R2_MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!
const R2_MEDIA_PUBLIC_URL = (process.env.R2_MEDIA_PUBLIC_URL || '').replace(/\/+$/, '')
const R2_PREFIX = 'defaults/event-templates'

if (!R2_MEDIA_BUCKET || !R2_MEDIA_PUBLIC_URL) {
  console.error('Missing R2_MEDIA_BUCKET_NAME or R2_MEDIA_PUBLIC_URL env vars')
  process.exit(1)
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const SVG_DIR = join(import.meta.dirname, '..', 'public', 'defaults', 'events')
const files = readdirSync(SVG_DIR).filter((f) => f.endsWith('.svg'))

console.log(`Found ${files.length} SVG files in ${SVG_DIR}`)

let uploaded = 0
let skipped = 0

for (const filename of files) {
  const key = `${R2_PREFIX}/${filename}`

  // Check if already exists
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_MEDIA_BUCKET, Key: key }))
    console.log(`  ✓ Already exists: ${key}`)
    skipped++
    continue
  } catch {
    // Doesn't exist yet — upload it
  }

  const body = readFileSync(join(SVG_DIR, filename))

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_MEDIA_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'image/svg+xml',
    }),
  )

  const publicUrl = `${R2_MEDIA_PUBLIC_URL}/${key}`
  console.log(`  ↑ Uploaded: ${publicUrl}`)
  uploaded++
}

console.log(`\nDone! Uploaded ${uploaded}, skipped ${skipped} (already existed)`)
