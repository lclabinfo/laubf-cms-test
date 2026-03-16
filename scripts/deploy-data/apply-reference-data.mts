/**
 * Apply reference data (ministries + campuses) to the database.
 *
 * These are structural records that pages, events, and menus depend on.
 * Uses upsert so it's safe to run multiple times.
 *
 * Usage: npx tsx scripts/deploy-data/apply-reference-data.mts
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

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

// ── Ministries ─────────────────────────────────────────────
console.log('Upserting ministries...')
const MINISTRIES = [
  { slug: 'young-adult', name: 'Young Adult' },
  { slug: 'adult', name: 'Adult' },
  { slug: 'children', name: 'Children' },
  { slug: 'high-school', name: 'Middle & High School' },
  { slug: 'church-wide', name: 'Church-wide' },
]
for (const m of MINISTRIES) {
  await prisma.ministry.upsert({
    where: { churchId_slug: { churchId, slug: m.slug } },
    update: { name: m.name },
    create: { churchId, name: m.name, slug: m.slug },
  })
}
console.log(`  ${MINISTRIES.length} ministries`)

// ── Campuses ───────────────────────────────────────────────
console.log('Upserting campuses...')
const CAMPUSES = [
  { slug: 'lbcc', name: 'LBCC', shortName: 'LBCC' },
  { slug: 'csulb', name: 'CSULB', shortName: 'CSULB' },
  { slug: 'csuf', name: 'CSUF', shortName: 'CSUF' },
  { slug: 'ucla', name: 'UCLA', shortName: 'UCLA' },
  { slug: 'usc', name: 'USC', shortName: 'USC' },
  { slug: 'csudh', name: 'CSUDH', shortName: 'CSUDH' },
  { slug: 'ccc', name: 'CCC', shortName: 'CCC' },
  { slug: 'mt-sac', name: 'Mt. SAC', shortName: 'Mt. SAC' },
  { slug: 'golden-west', name: 'Golden West', shortName: 'GWC' },
  { slug: 'cypress', name: 'Cypress', shortName: 'Cypress' },
  { slug: 'cal-poly-pomona', name: 'Cal Poly Pomona', shortName: 'CPP' },
  { slug: 'all', name: 'All Campuses', shortName: 'All' },
]
for (const c of CAMPUSES) {
  await prisma.campus.upsert({
    where: { churchId_slug: { churchId, slug: c.slug } },
    update: { name: c.name, shortName: c.shortName },
    create: { churchId, name: c.name, slug: c.slug, shortName: c.shortName },
  })
}
console.log(`  ${CAMPUSES.length} campuses`)

console.log('\n✅ Reference data applied successfully!')

await prisma.$disconnect()
await pool.end()
