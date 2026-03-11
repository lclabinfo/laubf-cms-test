/**
 * Apply series data — upsert the 5 canonical series and reassign
 * all messages + bible studies to "Sunday Service".
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npx tsx scripts/deploy-data/apply-series-data.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (!church) {
  console.error(`Church not found: ${slug}`)
  process.exit(1)
}
const churchId = church.id
console.log(`Church: ${church.name} (${churchId})\n`)

// ── 1. Upsert the 5 canonical series ───────────────────────
const SERIES = [
  { slug: 'sunday-service', name: 'Sunday Service' },
  { slug: 'wednesday-bible-study', name: 'Wednesday Bible Study' },
  { slug: 'conference', name: 'Conference' },
  { slug: 'prayer-meeting', name: 'Prayer Meeting' },
  { slug: '16-steps-bible-study', name: '16 Steps Bible Study' },
]

console.log('Upserting series...')
const seriesMap = new Map<string, string>()
for (const s of SERIES) {
  const record = await prisma.series.upsert({
    where: { churchId_slug: { churchId, slug: s.slug } },
    update: { name: s.name },
    create: { churchId, name: s.name, slug: s.slug },
  })
  seriesMap.set(s.name, record.id)
  console.log(`  ✓ ${s.name}`)
}

const sundayId = seriesMap.get('Sunday Service')!

// ── 2. Delete orphan series (before reassigning, to avoid FK issues) ─
console.log('\nCleaning up old series...')
const deleted = await prisma.series.deleteMany({
  where: {
    churchId,
    slug: { notIn: SERIES.map((s) => s.slug) },
  },
})
if (deleted.count > 0) {
  console.log(`  Deleted ${deleted.count} orphan series`)
} else {
  console.log('  No orphan series to clean up')
}

// ── 3. Backfill MessageSeries join records ───────────────────
// Create a join record for every message that doesn't already have one
// pointing to Sunday Service.
console.log('\nBackfilling message → Sunday Service links...')
const messagesWithoutSunday = await prisma.message.findMany({
  where: {
    churchId,
    messageSeries: { none: { seriesId: sundayId } },
  },
  select: { id: true },
})
let created = 0
for (const msg of messagesWithoutSunday) {
  await prisma.messageSeries.create({
    data: {
      messageId: msg.id,
      seriesId: sundayId,
      sortOrder: 0,
    },
  })
  created++
}
console.log(`  Created ${created} message-series links`)

// ── 4. Backfill BibleStudy.seriesId ─────────────────────────
console.log('Backfilling bible study → Sunday Service links...')
const bsResult = await prisma.bibleStudy.updateMany({
  where: {
    churchId,
    OR: [{ seriesId: null }, { seriesId: { not: sundayId } }],
  },
  data: { seriesId: sundayId },
})
console.log(`  Updated ${bsResult.count} bible study records`)

console.log('\nDone!')
await pool.end()
