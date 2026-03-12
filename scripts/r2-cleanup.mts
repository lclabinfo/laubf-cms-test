/**
 * R2 Cleanup Script — find and delete unused files from Cloudflare R2 buckets.
 *
 * Scans both the attachments and media buckets, cross-references every R2 key
 * against all database fields that store R2 URLs, and identifies orphans.
 *
 * Usage: npx tsx scripts/r2-cleanup.mts [options]
 *
 * Options:
 *   --dry-run            List orphans without deleting (default if no flags)
 *   --yes                Skip confirmation prompt (use with caution)
 *   --media-only         Only scan/clean the media bucket
 *   --attachments-only   Only scan/clean the attachments bucket
 */
import 'dotenv/config'
import * as readline from 'node:readline'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'

// ── Args ──────────────────────────────────────────────────
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const AUTO_YES = args.includes('--yes')
const MEDIA_ONLY = args.includes('--media-only')
const ATTACHMENTS_ONLY = args.includes('--attachments-only')

if (MEDIA_ONLY && ATTACHMENTS_ONLY) {
  console.error('Cannot use --media-only and --attachments-only together')
  process.exit(1)
}

// ── R2 Config ─────────────────────────────────────────────
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

// ── DB Setup ──────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const prisma = new (mod.PrismaClient)({ adapter })

// ── Helpers ───────────────────────────────────────────────

async function* listAllObjects(bucket: string, prefix: string) {
  let token: string | undefined
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token })
    )
    for (const obj of res.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined) {
        yield { key: obj.Key, size: obj.Size }
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// ── Collect all referenced URLs from the database ─────────

async function collectReferencedUrls(): Promise<Set<string>> {
  const urls = new Set<string>()

  function add(val: string | null | undefined) {
    if (val) {
      urls.add(val)
      // Also add decoded version so URL-encoded DB values match raw R2 keys
      try {
        const decoded = decodeURIComponent(val)
        if (decoded !== val) urls.add(decoded)
      } catch { /* ignore malformed URIs */ }
    }
  }

  console.log('  Scanning MediaAsset...')
  const media = await prisma.mediaAsset.findMany({
    where: { deletedAt: null },
    select: { url: true, thumbnailUrl: true },
  })
  for (const m of media) { add(m.url); add(m.thumbnailUrl) }

  console.log('  Scanning BibleStudyAttachment...')
  const attachments = await prisma.bibleStudyAttachment.findMany({
    select: { url: true },
  })
  for (const a of attachments) { add(a.url) }

  console.log('  Scanning Event.coverImage...')
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    select: { coverImage: true },
  })
  for (const e of events) { add(e.coverImage) }

  console.log('  Scanning Message (videoUrl, thumbnailUrl, audioUrl)...')
  const messages = await prisma.message.findMany({
    where: { deletedAt: null },
    select: { videoUrl: true, thumbnailUrl: true, audioUrl: true },
  })
  for (const m of messages) { add(m.videoUrl); add(m.thumbnailUrl); add(m.audioUrl) }

  console.log('  Scanning Speaker.photoUrl...')
  const speakers = await prisma.speaker.findMany({
    select: { photoUrl: true },
  })
  for (const s of speakers) { add(s.photoUrl) }

  console.log('  Scanning Series.imageUrl...')
  const series = await prisma.series.findMany({
    where: { deletedAt: null },
    select: { imageUrl: true },
  })
  for (const s of series) { add(s.imageUrl) }

  console.log('  Scanning Ministry.imageUrl...')
  const ministries = await prisma.ministry.findMany({
    where: { deletedAt: null },
    select: { imageUrl: true },
  })
  for (const m of ministries) { add(m.imageUrl) }

  console.log('  Scanning Campus.imageUrl...')
  const campuses = await prisma.campus.findMany({
    where: { deletedAt: null },
    select: { imageUrl: true },
  })
  for (const c of campuses) { add(c.imageUrl) }

  console.log('  Scanning Person.photoUrl...')
  const persons = await prisma.person.findMany({
    where: { deletedAt: null },
    select: { photoUrl: true },
  })
  for (const p of persons) { add(p.photoUrl) }

  console.log('  Scanning User.avatarUrl...')
  const users = await prisma.user.findMany({
    select: { avatarUrl: true },
  })
  for (const u of users) { add(u.avatarUrl) }

  console.log('  Scanning Video.thumbnailUrl...')
  const videos = await prisma.video.findMany({
    where: { deletedAt: null },
    select: { thumbnailUrl: true },
  })
  for (const v of videos) { add(v.thumbnailUrl) }

  console.log('  Scanning DailyBread.audioUrl...')
  const dailyBreads = await prisma.dailyBread.findMany({
    select: { audioUrl: true },
  })
  for (const d of dailyBreads) { add(d.audioUrl) }

  // PersonGroup removed from schema

  console.log('  Scanning Church (logoUrl, faviconUrl)...')
  const churches = await prisma.church.findMany({
    select: { logoUrl: true, faviconUrl: true },
  })
  for (const c of churches) { add(c.logoUrl); add(c.faviconUrl) }

  console.log('  Scanning SiteSettings (logoUrl, logoDarkUrl, faviconUrl, ogImageUrl)...')
  const settings = await prisma.siteSettings.findMany({
    select: { logoUrl: true, logoDarkUrl: true, faviconUrl: true, ogImageUrl: true },
  })
  for (const s of settings) { add(s.logoUrl); add(s.logoDarkUrl); add(s.faviconUrl); add(s.ogImageUrl) }

  console.log('  Scanning Page.ogImageUrl...')
  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    select: { ogImageUrl: true },
  })
  for (const p of pages) { add(p.ogImageUrl) }

  console.log('  Scanning MenuItem.featuredImage...')
  const menuItems = await prisma.menuItem.findMany({
    select: { featuredImage: true },
  })
  for (const m of menuItems) { add(m.featuredImage) }

  console.log('  Scanning Theme.previewUrl...')
  const themes = await prisma.theme.findMany({
    select: { previewUrl: true },
  })
  for (const t of themes) { add(t.previewUrl) }

  console.log('  Scanning PageSection content for image URLs...')
  const sections = await prisma.pageSection.findMany({
    select: { content: true },
  })
  for (const s of sections) {
    // Scan JSON content for any R2 URLs
    const json = JSON.stringify(s.content ?? {})
    const urlMatches = json.match(/https:\/\/pub-[a-f0-9]+\.r2\.dev\/[^"\\]+/g)
    if (urlMatches) {
      for (const url of urlMatches) add(url)
    }
  }

  return urls
}

// ── Convert URL set to key set per bucket ─────────────────

function urlsToKeys(urls: Set<string>): { attachmentKeys: Set<string>; mediaKeys: Set<string> } {
  const attachmentKeys = new Set<string>()
  const mediaKeys = new Set<string>()

  for (const url of urls) {
    if (ATTACHMENTS_PUBLIC_URL && url.startsWith(ATTACHMENTS_PUBLIC_URL)) {
      attachmentKeys.add(url.slice(ATTACHMENTS_PUBLIC_URL.length + 1))
    } else if (MEDIA_PUBLIC_URL && url.startsWith(MEDIA_PUBLIC_URL)) {
      mediaKeys.add(url.slice(MEDIA_PUBLIC_URL.length + 1))
    }
  }

  return { attachmentKeys, mediaKeys }
}

// ── Scan a bucket and find orphans ────────────────────────

// Paths to always keep (fonts, default assets, etc.)
const KEEP_PATTERNS = [
  /\/fonts\//,         // Custom font files (referenced in CSS, not DB)
  /\/defaults\//,      // Default template assets
  /\/staging\//,       // In-progress uploads
]

async function findOrphans(
  bucket: string,
  bucketLabel: string,
  prefix: string,
  referencedKeys: Set<string>,
): Promise<{ key: string; size: number }[]> {
  console.log(`\nScanning ${bucketLabel} bucket (prefix: "${prefix}")...`)
  const orphans: { key: string; size: number }[] = []
  let total = 0
  let kept = 0

  for await (const obj of listAllObjects(bucket, prefix)) {
    total++
    // Check both raw key and URL-encoded key against referenced set
    const encodedKey = obj.key.split('/').map(s => encodeURIComponent(s)).join('/')
    if (referencedKeys.has(obj.key) || referencedKeys.has(encodedKey)) continue
    if (KEEP_PATTERNS.some((p) => p.test(obj.key))) { kept++; continue }
    orphans.push(obj)
  }

  console.log(`  Found ${total} objects, ${orphans.length} orphaned, ${kept} kept (fonts/defaults/staging)`)
  return orphans
}

// ── Delete orphans in batches ─────────────────────────────

async function deleteOrphans(
  bucket: string,
  orphans: { key: string; size: number }[],
): Promise<number> {
  let deleted = 0
  // R2 DeleteObjects supports up to 1000 keys per request
  const BATCH = 1000
  for (let i = 0; i < orphans.length; i += BATCH) {
    const batch = orphans.slice(i, i + BATCH)
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((o) => ({ Key: o.key })) },
      })
    )
    deleted += batch.length
    if (orphans.length > BATCH) {
      console.log(`  Deleted ${deleted}/${orphans.length}...`)
    }
  }
  return deleted
}

// ── Main ──────────────────────────────────────────────────

console.log('R2 Cleanup Script')
console.log('=================\n')

if (MEDIA_ONLY) console.log('Mode: MEDIA ONLY\n')
else if (ATTACHMENTS_ONLY) console.log('Mode: ATTACHMENTS ONLY\n')
if (DRY_RUN) console.log('(DRY RUN — no files will be deleted)\n')

// 1. Get church slug for prefix
const slug = process.env.CHURCH_SLUG || 'la-ubf'
console.log(`Church slug: ${slug}\n`)

// 2. Collect all referenced URLs
console.log('Collecting referenced URLs from database...')
const referencedUrls = await collectReferencedUrls()
console.log(`\nTotal referenced URLs: ${referencedUrls.size}`)

const { attachmentKeys, mediaKeys } = urlsToKeys(referencedUrls)
console.log(`  Attachment keys: ${attachmentKeys.size}`)
console.log(`  Media keys: ${mediaKeys.size}`)

// 3. Scan buckets based on mode
let attachmentOrphans: { key: string; size: number }[] = []
let mediaOrphans: { key: string; size: number }[] = []

if (!MEDIA_ONLY) {
  attachmentOrphans = await findOrphans(
    ATTACHMENTS_BUCKET, 'Attachments', `${slug}/`, attachmentKeys,
  )
}

if (!ATTACHMENTS_ONLY) {
  mediaOrphans = await findOrphans(
    MEDIA_BUCKET, 'Media', `${slug}/`, mediaKeys,
  )
}

const allOrphans = [...attachmentOrphans, ...mediaOrphans]
const totalOrphanSize = allOrphans.reduce((sum, o) => sum + o.size, 0)

if (allOrphans.length === 0) {
  console.log('\nNo orphaned files found. Everything is clean!')
  await pool.end()
  process.exit(0)
}

// 4. Display orphans
console.log(`\n${'='.repeat(60)}`)
console.log(`ORPHANED FILES: ${allOrphans.length} files (${formatBytes(totalOrphanSize)})`)
console.log('='.repeat(60))

if (attachmentOrphans.length > 0) {
  console.log(`\n--- Attachments bucket (${attachmentOrphans.length} files, ${formatBytes(attachmentOrphans.reduce((s, o) => s + o.size, 0))}) ---`)
  for (const o of attachmentOrphans) {
    console.log(`  ${o.key}  (${formatBytes(o.size)})`)
  }
}

if (mediaOrphans.length > 0) {
  console.log(`\n--- Media bucket (${mediaOrphans.length} files, ${formatBytes(mediaOrphans.reduce((s, o) => s + o.size, 0))}) ---`)
  for (const o of mediaOrphans) {
    console.log(`  ${o.key}  (${formatBytes(o.size)})`)
  }
}

if (DRY_RUN) {
  console.log('\n(DRY RUN — no files deleted)')
  await pool.end()
  process.exit(0)
}

// 5. Confirm deletion
console.log('')
if (!AUTO_YES) {
  const answer = await ask(`Delete these ${allOrphans.length} files (${formatBytes(totalOrphanSize)})? [y/N] `)
  if (answer !== 'y' && answer !== 'yes') {
    console.log('Aborted.')
    await pool.end()
    process.exit(0)
  }
}

// 6. Delete
console.log('\nDeleting orphaned files...')
let totalDeleted = 0

if (attachmentOrphans.length > 0) {
  const count = await deleteOrphans(ATTACHMENTS_BUCKET, attachmentOrphans)
  totalDeleted += count
  console.log(`  Attachments: ${count} deleted`)
}

if (mediaOrphans.length > 0) {
  const count = await deleteOrphans(MEDIA_BUCKET, mediaOrphans)
  totalDeleted += count
  console.log(`  Media: ${count} deleted`)
}

console.log(`\nDone! Deleted ${totalDeleted} files, freed ${formatBytes(totalOrphanSize)}.`)
await pool.end()
