/**
 * Audit video import: check Message records for video data integrity.
 *
 * Counts:
 * - Messages with youtubeId set
 * - Messages with videoUrl set
 * - Messages with hasVideo=true but no youtubeId AND no videoUrl (broken)
 *
 * Usage: npx tsx scripts/audit-video-import.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const church = await prisma.church.findFirst({ where: { slug: 'la-ubf' } })
if (!church) throw new Error('Church la-ubf not found')
const churchId = church.id

console.log('=== Video Import Audit ===\n')

const total = await prisma.message.count({ where: { churchId } })
console.log(`Total messages: ${total}`)

const withYoutubeId = await prisma.message.count({ where: { churchId, youtubeId: { not: null } } })
console.log(`Messages with youtubeId set: ${withYoutubeId}`)

const withVideoUrl = await prisma.message.count({ where: { churchId, videoUrl: { not: null } } })
console.log(`Messages with videoUrl set: ${withVideoUrl}`)

const hasVideoTrue = await prisma.message.count({ where: { churchId, hasVideo: true } })
console.log(`Messages with hasVideo=true: ${hasVideoTrue}`)

const hasVideoFalse = await prisma.message.count({ where: { churchId, hasVideo: false } })
console.log(`Messages with hasVideo=false: ${hasVideoFalse}`)

// BROKEN: hasVideo=true but no actual video link
const broken = await prisma.message.count({
  where: { churchId, hasVideo: true, youtubeId: null, videoUrl: null }
})
console.log(`\nBROKEN (hasVideo=true but no youtubeId AND no videoUrl): ${broken}`)

// Find broken entries
if (broken > 0) {
  const brokenEntries = await prisma.message.findMany({
    where: { churchId, hasVideo: true, youtubeId: null, videoUrl: null },
    select: { id: true, title: true, slug: true, dateFor: true, hasVideo: true },
    orderBy: { dateFor: 'desc' },
    take: 20,
  })
  console.log('\nBroken entries (first 20):')
  for (const b of brokenEntries) {
    console.log(`  [${b.dateFor.toISOString().slice(0, 10)}] "${b.title}" (slug: ${b.slug})`)
  }
}

// Also check: entries with youtubeId but hasVideo=false (should be hasVideo=true)
const missingHasVideo = await prisma.message.count({
  where: {
    churchId,
    hasVideo: false,
    OR: [
      { youtubeId: { not: null } },
      { videoUrl: { not: null } },
    ],
  },
})
console.log(`\nInconsistent: hasVideo=false but has youtubeId or videoUrl: ${missingHasVideo}`)

// Check videoUrl values that are Vimeo
const vimeoEntries = await prisma.message.findMany({
  where: { churchId, videoUrl: { not: null } },
  select: { title: true, videoUrl: true, youtubeId: true, hasVideo: true, dateFor: true },
  orderBy: { dateFor: 'asc' },
  take: 20,
})
console.log(`\nMessages with videoUrl (Vimeo expected):`)
for (const v of vimeoEntries) {
  console.log(`  [${v.dateFor.toISOString().slice(0, 10)}] "${v.title}" | videoUrl: ${v.videoUrl} | youtubeId: ${v.youtubeId} | hasVideo: ${v.hasVideo}`)
}

// Sample YouTube entries
const ytEntries = await prisma.message.findMany({
  where: { churchId, youtubeId: { not: null } },
  select: { title: true, youtubeId: true, videoUrl: true, hasVideo: true, dateFor: true },
  orderBy: { dateFor: 'desc' },
  take: 10,
})
console.log(`\nRecent YouTube messages (first 10):`)
for (const y of ytEntries) {
  console.log(`  [${y.dateFor.toISOString().slice(0, 10)}] "${y.title}" | youtubeId: ${y.youtubeId} | videoUrl: ${y.videoUrl} | hasVideo: ${y.hasVideo}`)
}

// Check for entries where youtubeId is set but videoUrl is also set (YouTube URL stored as videoUrl?)
const bothSet = await prisma.message.count({
  where: { churchId, youtubeId: { not: null }, videoUrl: { not: null } },
})
console.log(`\nMessages with BOTH youtubeId and videoUrl set: ${bothSet}`)

await prisma.$disconnect()
await pool.end()
console.log('\nDone!')
