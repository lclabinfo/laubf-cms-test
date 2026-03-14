/**
 * Cleanup Orphaned R2 Files
 *
 * Scans both R2 buckets (media + attachments) and compares against all DB
 * references. Any R2 object whose URL is not referenced by any DB record or
 * content field is considered orphaned and will be deleted.
 *
 * Usage:
 *   npx tsx scripts/cleanup-orphaned-r2.mts              # dry run (default)
 *   npx tsx scripts/cleanup-orphaned-r2.mts --dry-run=false  # actual delete
 */

import 'dotenv/config'
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { PrismaClient } from '../lib/generated/prisma/client.js'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CHURCH_SLUG = process.env.CHURCH_SLUG || 'la-ubf'
const DRY_RUN = !process.argv.includes('--dry-run=false')

const MEDIA_BUCKET = process.env.R2_MEDIA_BUCKET_NAME!
const ATTACHMENTS_BUCKET = process.env.R2_ATTACHMENTS_BUCKET_NAME!
const MEDIA_PUBLIC_URL = (process.env.R2_MEDIA_PUBLIC_URL || '').replace(/\/+$/, '')
const ATTACHMENTS_PUBLIC_URL = (
  process.env.R2_ATTACHMENTS_PUBLIC_URL || process.env.R2_PUBLIC_URL || ''
).replace(/\/+$/, '')

const STAGING_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface R2Object {
  key: string
  size: number
  lastModified?: Date
  bucket: 'media' | 'attachments'
}

// ---------------------------------------------------------------------------
// R2 listing (with LastModified)
// ---------------------------------------------------------------------------

async function listAllObjects(
  prefix: string,
  bucket: string,
  bucketLabel: 'media' | 'attachments',
): Promise<R2Object[]> {
  const objects: R2Object[] = []
  let continuationToken: string | undefined

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    )

    for (const obj of response.Contents ?? []) {
      if (obj.Key && obj.Size !== undefined) {
        objects.push({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          bucket: bucketLabel,
        })
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined
  } while (continuationToken)

  return objects
}

// ---------------------------------------------------------------------------
// DB reference collection
// ---------------------------------------------------------------------------

async function collectAllDbUrls(churchId: string): Promise<Set<string>> {
  const urls = new Set<string>()

  const addUrl = (url: string | null | undefined) => {
    if (url && (url.startsWith('http') || url.startsWith('/'))) {
      urls.add(url)
    }
  }

  const extractUrlsFromText = (text: string | null | undefined) => {
    if (!text) return
    // Match any URL pointing to our R2 buckets
    const patterns = [MEDIA_PUBLIC_URL, ATTACHMENTS_PUBLIC_URL].filter(Boolean)
    for (const base of patterns) {
      const regex = new RegExp(
        base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/[^"\'\\s<>)]+',
        'g',
      )
      const matches = text.match(regex)
      if (matches) matches.forEach((m) => urls.add(m))
    }
  }

  const extractUrlsFromJson = (json: unknown) => {
    if (!json) return
    const str = typeof json === 'string' ? json : JSON.stringify(json)
    extractUrlsFromText(str)
  }

  console.log('  Querying MediaAsset URLs (including soft-deleted)...')
  const mediaAssets = await prisma.mediaAsset.findMany({
    where: { churchId },
    select: { url: true, thumbnailUrl: true },
  })
  for (const a of mediaAssets) {
    addUrl(a.url)
    addUrl(a.thumbnailUrl)
  }
  console.log(`    Found ${mediaAssets.length} MediaAsset records`)

  console.log('  Querying BibleStudyAttachment URLs...')
  const attachments = await prisma.bibleStudyAttachment.findMany({
    where: { bibleStudy: { churchId } },
    select: { url: true },
  })
  for (const a of attachments) addUrl(a.url)
  console.log(`    Found ${attachments.length} BibleStudyAttachment records`)

  // --- Direct URL fields on models ---

  console.log('  Querying Church branding URLs...')
  const church = await prisma.church.findFirst({
    where: { id: churchId },
    select: { logoUrl: true, faviconUrl: true },
  })
  if (church) {
    addUrl(church.logoUrl)
    addUrl(church.faviconUrl)
  }

  console.log('  Querying SiteSettings URLs...')
  const siteSettings = await prisma.siteSettings.findFirst({
    where: { churchId },
    select: { logoUrl: true, logoDarkUrl: true, faviconUrl: true, ogImageUrl: true },
  })
  if (siteSettings) {
    addUrl(siteSettings.logoUrl)
    addUrl(siteSettings.logoDarkUrl)
    addUrl(siteSettings.faviconUrl)
    addUrl(siteSettings.ogImageUrl)
  }

  console.log('  Querying Message cover images + content fields...')
  const messages = await prisma.message.findMany({
    where: { churchId },
    select: {
      thumbnailUrl: true,
      audioUrl: true,
      studySections: true,
      attachments: true,
    },
  })
  for (const m of messages) {
    addUrl(m.thumbnailUrl)
    addUrl(m.audioUrl)
    extractUrlsFromJson(m.studySections)
    extractUrlsFromJson(m.attachments)
  }
  console.log(`    Found ${messages.length} Message records`)

  console.log('  Querying Event cover images + descriptions...')
  const events = await prisma.event.findMany({
    where: { churchId },
    select: { coverImage: true, description: true, welcomeMessage: true },
  })
  for (const e of events) {
    addUrl(e.coverImage)
    extractUrlsFromText(e.description)
    extractUrlsFromText(e.welcomeMessage)
  }
  console.log(`    Found ${events.length} Event records`)

  console.log('  Querying Series image URLs...')
  const series = await prisma.series.findMany({
    where: { churchId },
    select: { imageUrl: true },
  })
  for (const s of series) addUrl(s.imageUrl)
  console.log(`    Found ${series.length} Series records`)

  console.log('  Querying Speaker photo URLs...')
  const speakers = await prisma.speaker.findMany({
    where: { churchId },
    select: { photoUrl: true },
  })
  for (const s of speakers) addUrl(s.photoUrl)
  console.log(`    Found ${speakers.length} Speaker records`)

  console.log('  Querying Ministry image URLs...')
  const ministries = await prisma.ministry.findMany({
    where: { churchId },
    select: { imageUrl: true },
  })
  for (const m of ministries) addUrl(m.imageUrl)
  console.log(`    Found ${ministries.length} Ministry records`)

  console.log('  Querying Campus image URLs...')
  const campuses = await prisma.campus.findMany({
    where: { churchId },
    select: { imageUrl: true },
  })
  for (const c of campuses) addUrl(c.imageUrl)
  console.log(`    Found ${campuses.length} Campus records`)

  console.log('  Querying Person photo URLs...')
  const people = await prisma.person.findMany({
    where: { churchId },
    select: { photoUrl: true },
  })
  for (const p of people) addUrl(p.photoUrl)
  console.log(`    Found ${people.length} Person records`)

  console.log('  Querying BibleStudy content fields...')
  const studies = await prisma.bibleStudy.findMany({
    where: { churchId },
    select: { questions: true, answers: true, transcript: true },
  })
  for (const s of studies) {
    extractUrlsFromText(s.questions)
    extractUrlsFromText(s.answers)
    extractUrlsFromText(s.transcript)
  }
  console.log(`    Found ${studies.length} BibleStudy records`)

  console.log('  Querying Page OG image URLs...')
  const pages = await prisma.page.findMany({
    where: { churchId },
    select: { ogImageUrl: true },
  })
  for (const p of pages) addUrl(p.ogImageUrl)
  console.log(`    Found ${pages.length} Page records`)

  console.log('  Querying PageSection content (JSON)...')
  const sections = await prisma.pageSection.findMany({
    where: { churchId },
    select: { content: true },
  })
  for (const s of sections) extractUrlsFromJson(s.content)
  console.log(`    Found ${sections.length} PageSection records`)

  console.log('  Querying Announcement body text...')
  const announcements = await prisma.announcement.findMany({
    where: { churchId },
    select: { body: true },
  })
  for (const a of announcements) extractUrlsFromText(a.body)
  console.log(`    Found ${announcements.length} Announcement records`)

  return urls
}

// ---------------------------------------------------------------------------
// URL <-> Key conversion
// ---------------------------------------------------------------------------

function urlForKey(key: string, bucket: 'media' | 'attachments'): string {
  const base = bucket === 'media' ? MEDIA_PUBLIC_URL : ATTACHMENTS_PUBLIC_URL
  return `${base}/${key}`
}

function isStagingKey(key: string): boolean {
  return /^[^/]+\/staging\//.test(key)
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(70))
  console.log('  R2 Orphaned File Cleanup')
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no deletions)' : 'LIVE DELETE'}`)
  console.log(`  Church slug: ${CHURCH_SLUG}`)
  console.log('='.repeat(70))
  console.log()

  // Validate env
  if (!MEDIA_BUCKET || !ATTACHMENTS_BUCKET) {
    console.error('ERROR: R2_MEDIA_BUCKET_NAME and R2_ATTACHMENTS_BUCKET_NAME must be set')
    process.exit(1)
  }
  if (!MEDIA_PUBLIC_URL || !ATTACHMENTS_PUBLIC_URL) {
    console.error('ERROR: R2_MEDIA_PUBLIC_URL and R2_ATTACHMENTS_PUBLIC_URL (or R2_PUBLIC_URL) must be set')
    process.exit(1)
  }

  // 1. Resolve church ID
  console.log('[1/5] Resolving church ID...')
  const church = await prisma.church.findUnique({
    where: { slug: CHURCH_SLUG },
    select: { id: true, name: true },
  })
  if (!church) {
    console.error(`ERROR: Church with slug "${CHURCH_SLUG}" not found`)
    process.exit(1)
  }
  console.log(`  Church: ${church.name} (${church.id})`)
  console.log()

  // 2. List R2 objects
  console.log('[2/5] Listing R2 objects...')
  const [mediaObjects, attachmentObjects] = await Promise.all([
    listAllObjects(`${CHURCH_SLUG}/`, MEDIA_BUCKET, 'media'),
    listAllObjects(`${CHURCH_SLUG}/`, ATTACHMENTS_BUCKET, 'attachments'),
  ])
  // Also scan for "defaults/" prefix in media bucket (e.g. event templates)
  const defaultObjects = await listAllObjects('defaults/', MEDIA_BUCKET, 'media')
  const allMediaObjects = [...mediaObjects, ...defaultObjects]

  console.log(`  Media bucket: ${allMediaObjects.length} objects (${formatBytes(allMediaObjects.reduce((s, o) => s + o.size, 0))})`)
  console.log(`  Attachments bucket: ${attachmentObjects.length} objects (${formatBytes(attachmentObjects.reduce((s, o) => s + o.size, 0))})`)
  console.log()

  const allR2Objects = [...allMediaObjects, ...attachmentObjects]
  const totalR2Size = allR2Objects.reduce((s, o) => s + o.size, 0)

  // 3. Collect DB references
  console.log('[3/5] Collecting DB references...')
  const dbUrls = await collectAllDbUrls(church.id)
  console.log(`  Total unique DB URLs found: ${dbUrls.size}`)
  console.log()

  // 4. Compare and find orphans
  console.log('[4/5] Finding orphaned files...')
  const now = Date.now()
  const orphans: R2Object[] = []
  const keptStagingFiles: R2Object[] = []

  for (const obj of allR2Objects) {
    const url = urlForKey(obj.key, obj.bucket)

    if (isStagingKey(obj.key)) {
      // Staging files: orphaned if older than 24 hours
      if (obj.lastModified) {
        const ageMs = now - obj.lastModified.getTime()
        if (ageMs > STAGING_MAX_AGE_MS) {
          orphans.push(obj)
        } else {
          keptStagingFiles.push(obj)
        }
      } else {
        // No LastModified — treat as orphaned (shouldn't happen with R2)
        orphans.push(obj)
      }
    } else if (!dbUrls.has(url)) {
      orphans.push(obj)
    }
  }

  const orphanedSize = orphans.reduce((s, o) => s + o.size, 0)
  const mediaOrphans = orphans.filter((o) => o.bucket === 'media')
  const attachmentOrphans = orphans.filter((o) => o.bucket === 'attachments')
  const stagingOrphans = orphans.filter((o) => isStagingKey(o.key))
  const nonStagingOrphans = orphans.filter((o) => !isStagingKey(o.key))

  console.log(`  Orphaned files: ${orphans.length}`)
  console.log(`    Media bucket: ${mediaOrphans.length}`)
  console.log(`    Attachments bucket: ${attachmentOrphans.length}`)
  console.log(`    Expired staging: ${stagingOrphans.length}`)
  console.log(`    Non-staging: ${nonStagingOrphans.length}`)
  console.log(`  Storage to reclaim: ${formatBytes(orphanedSize)}`)
  if (keptStagingFiles.length > 0) {
    console.log(`  Staging files kept (< 24h old): ${keptStagingFiles.length}`)
  }
  console.log()

  // Print first 50 orphans as sample
  if (orphans.length > 0) {
    const sample = orphans.slice(0, 50)
    console.log(`  Sample orphaned files (showing ${sample.length} of ${orphans.length}):`)
    for (const o of sample) {
      const age = o.lastModified
        ? `${Math.round((now - o.lastModified.getTime()) / (1000 * 60 * 60))}h ago`
        : 'unknown age'
      console.log(`    [${o.bucket}] ${o.key} (${formatBytes(o.size)}, ${age})`)
    }
    if (orphans.length > 50) {
      console.log(`    ... and ${orphans.length - 50} more`)
    }
    console.log()
  }

  // 5. Delete orphans
  if (orphans.length === 0) {
    console.log('[5/5] No orphaned files found. Nothing to do.')
  } else if (DRY_RUN) {
    console.log('[5/5] DRY RUN — skipping deletion. Run with --dry-run=false to delete.')
  } else {
    console.log(`[5/5] Deleting ${orphans.length} orphaned files...`)
    let deleted = 0
    let errors = 0

    for (const obj of orphans) {
      const bucket = obj.bucket === 'media' ? MEDIA_BUCKET : ATTACHMENTS_BUCKET
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.key }))
        deleted++
        if (deleted % 100 === 0) {
          console.log(`  Deleted ${deleted}/${orphans.length}...`)
        }
      } catch (err) {
        errors++
        console.error(`  ERROR deleting ${obj.key}: ${err}`)
      }
    }
    console.log(`  Deleted: ${deleted}, Errors: ${errors}`)
  }

  // Summary
  console.log()
  console.log('='.repeat(70))
  console.log('  SUMMARY')
  console.log('='.repeat(70))
  console.log(`  Total R2 objects scanned:  ${allR2Objects.length}`)
  console.log(`  Total R2 storage:          ${formatBytes(totalR2Size)}`)
  console.log(`  DB references found:       ${dbUrls.size}`)
  console.log(`  Orphaned files:            ${orphans.length}`)
  console.log(`  Storage to reclaim:        ${formatBytes(orphanedSize)}`)
  console.log(`  Mode:                      ${DRY_RUN ? 'DRY RUN' : 'DELETED'}`)
  console.log('='.repeat(70))
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
