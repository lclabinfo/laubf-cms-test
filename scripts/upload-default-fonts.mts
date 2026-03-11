/**
 * Upload font files to R2 under defaults/fonts/ prefix.
 * These are shared platform assets (not church-specific).
 *
 * Usage: npx tsx scripts/upload-default-fonts.mts
 */
import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const R2_MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!
const R2_MEDIA_PUBLIC_URL = (process.env.R2_MEDIA_PUBLIC_URL || '').replace(/\/+$/, '')
const R2_PREFIX = 'la-ubf/fonts'

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

const MIME_TYPES: Record<string, string> = {
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const FONTS_DIR = join(import.meta.dirname, '..', 'public', 'fonts')

// Walk font subdirectories
const subdirs = readdirSync(FONTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())

let uploaded = 0
let skipped = 0

for (const subdir of subdirs) {
  const dirPath = join(FONTS_DIR, subdir.name)
  const files = readdirSync(dirPath).filter((f) => {
    const ext = extname(f).toLowerCase()
    return ext in MIME_TYPES
  })

  console.log(`\n${subdir.name}/ (${files.length} files)`)

  for (const filename of files) {
    const ext = extname(filename).toLowerCase()
    const key = `${R2_PREFIX}/${subdir.name}/${filename}`

    // Check if already exists
    try {
      await r2.send(new HeadObjectCommand({ Bucket: R2_MEDIA_BUCKET, Key: key }))
      console.log(`  ✓ ${filename}`)
      skipped++
      continue
    } catch {
      // Doesn't exist — upload
    }

    const body = readFileSync(join(dirPath, filename))
    await r2.send(
      new PutObjectCommand({
        Bucket: R2_MEDIA_BUCKET,
        Key: key,
        Body: body,
        ContentType: MIME_TYPES[ext] || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )

    console.log(`  ↑ ${filename}`)
    uploaded++
  }
}

console.log(`\nDone! Uploaded ${uploaded}, skipped ${skipped}`)
console.log(`Base URL: ${R2_MEDIA_PUBLIC_URL}/${R2_PREFIX}/`)
