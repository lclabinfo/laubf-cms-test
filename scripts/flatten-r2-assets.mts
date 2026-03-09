/**
 * Flatten all R2 objects under la-ubf/initial-setup/ into la-ubf/initial-setup/<filename>
 * (no nested subdirectories). Handles filename collisions by prefixing with parent dir.
 * Also updates all MediaAsset records and cleans up MediaFolder entries.
 *
 * Usage: npx tsx scripts/flatten-r2-assets.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { basename } from 'path'

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

const OLD_PREFIX = 'la-ubf/initial-setup/'
const NEW_PREFIX = 'la-ubf/initial-setup/'
const CHURCH_SLUG = process.env.CHURCH_SLUG || 'la-ubf'

async function main() {
  // 1. List all R2 objects
  let ct: string | undefined
  const objects: Array<{ key: string; size: number }> = []
  do {
    const r = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: OLD_PREFIX,
      ContinuationToken: ct,
    }))
    for (const o of r.Contents ?? []) {
      if (o.Key && o.Size !== undefined) objects.push({ key: o.Key, size: o.Size })
    }
    ct = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (ct)

  console.log(`Found ${objects.length} R2 objects\n`)

  // 2. Build unique flat filenames (handle collisions by prefixing parent dir)
  const filenameCount = new Map<string, number>()
  for (const { key } of objects) {
    const fn = basename(key)
    filenameCount.set(fn, (filenameCount.get(fn) ?? 0) + 1)
  }

  // For duplicate filenames, create a unique name using parent dirs
  function flatKey(oldKey: string): string {
    const fn = basename(oldKey)
    if (filenameCount.get(fn) === 1) {
      return `${NEW_PREFIX}${fn}`
    }
    // Use the path between OLD_PREFIX and filename to create unique prefix
    const rel = oldKey.slice(OLD_PREFIX.length)
    const parts = rel.split('/')
    parts.pop() // remove filename
    // Filter out "compressed" and join remaining with dashes
    const prefix = parts.filter(p => p !== 'compressed').join('-')
    return `${NEW_PREFIX}${prefix ? prefix + '-' : ''}${fn}`
  }

  // 3. Move objects in R2 and build old→new URL mapping
  const urlMap = new Map<string, string>() // old URL → new URL
  let moved = 0
  let alreadyFlat = 0

  for (const { key } of objects) {
    const newKey = flatKey(key)
    const oldUrl = `${PUBLIC_URL}/${key}`
    const newUrl = `${PUBLIC_URL}/${newKey}`
    urlMap.set(oldUrl, newUrl)

    if (key === newKey) {
      alreadyFlat++
      continue
    }

    // Copy to new location
    await s3.send(new CopyObjectCommand({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${key}`,
      Key: newKey,
    }))
    // Delete old
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
    console.log(`  ${basename(key)} ← ${key.slice(OLD_PREFIX.length)}`)
    moved++
  }
  console.log(`\nMoved: ${moved}, Already flat: ${alreadyFlat}\n`)

  // 4. Update MediaAsset records
  const church = await prisma.church.findFirst({ where: { slug: CHURCH_SLUG } })
  if (!church) { console.error('Church not found'); process.exit(1) }
  const churchId = church.id

  const assets = await prisma.mediaAsset.findMany({ where: { churchId } })
  let updated = 0
  for (const asset of assets) {
    const newUrl = urlMap.get(asset.url)
    if (newUrl && (newUrl !== asset.url || asset.folder !== 'initial-setup')) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { url: newUrl, folder: 'initial-setup' },
      })
      updated++
    } else if (asset.folder !== 'initial-setup') {
      // Just fix the folder even if URL didn't change
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: { folder: 'initial-setup' },
      })
      updated++
    }
  }
  console.log(`Updated ${updated} MediaAsset records`)

  // 5. Clean up old folders, ensure single "initial-setup" folder
  await prisma.mediaFolder.deleteMany({ where: { churchId } })
  await prisma.mediaFolder.create({ data: { churchId, name: 'initial-setup' } })
  console.log('Cleaned up folders → single "initial-setup" folder')

  // 6. Print the new flat file list
  console.log('\nNew flat structure:')
  for (const { key } of objects) {
    const newKey = flatKey(key)
    console.log(`  ${basename(newKey)}`)
  }

  await pool.end()
  console.log('\nDone!')
}

main().catch(console.error)
