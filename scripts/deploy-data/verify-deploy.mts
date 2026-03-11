/**
 * Verify that all deployed data is in place.
 *
 * Checks counts and key records for all data categories.
 * Reports missing or unexpected data. Does NOT modify anything.
 *
 * Usage: npx tsx scripts/deploy-data/verify-deploy.mts
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
  console.error(`❌ Church not found: ${slug}`)
  process.exit(1)
}
const churchId = church.id
console.log(`Verifying data for: ${church.name} (${churchId})\n`)

let issues = 0

function check(label: string, actual: number, expected: number, op: '>=' | '===' = '>=') {
  const pass = op === '>=' ? actual >= expected : actual === expected
  const icon = pass ? '✅' : '❌'
  const detail = pass ? '' : ` (expected ${op === '>=' ? 'at least' : 'exactly'} ${expected})`
  console.log(`  ${icon} ${label}: ${actual}${detail}`)
  if (!pass) issues++
}

// ── Church Profile ─────────────────────────────────────────
console.log('Church Profile:')
check('Has email', church.email ? 1 : 0, 1, '===')
check('Has address', church.address ? 1 : 0, 1, '===')
check('Has timezone', church.timezone ? 1 : 0, 1, '===')

// ── Reference Data ─────────────────────────────────────────
console.log('\nReference Data:')
const [ministryCount, campusCount] = await Promise.all([
  prisma.ministry.count({ where: { churchId } }),
  prisma.campus.count({ where: { churchId } }),
])
check('Ministries', ministryCount, 5)
check('Campuses', campusCount, 12)

// ── Website Builder ────────────────────────────────────────
console.log('\nWebsite Builder:')
const [themeCustom, siteSettings, menuCount, menuItemCount, pageCount, sectionCount] = await Promise.all([
  prisma.themeCustomization.count({ where: { churchId } }),
  prisma.siteSettings.count({ where: { churchId } }),
  prisma.menu.count({ where: { churchId } }),
  prisma.menuItem.count({ where: { menu: { churchId } } }),
  prisma.page.count({ where: { churchId, deletedAt: null } }),
  prisma.pageSection.count({ where: { churchId } }),
])
check('Theme customization', themeCustom, 1, '===')
check('Site settings', siteSettings, 1, '===')
check('Menus', menuCount, 2)
check('Menu items', menuItemCount, 30)
check('Pages', pageCount, 14)
check('Page sections', sectionCount, 50)

// Check homepage exists
const homepage = await prisma.page.findFirst({ where: { churchId, isHomepage: true, deletedAt: null } })
check('Homepage exists', homepage ? 1 : 0, 1, '===')

// ── Content Data ───────────────────────────────────────────
console.log('\nContent Data:')
const [messageCount, studyCount, videoCount, dailyBreadCount, speakerCount, seriesCount] = await Promise.all([
  prisma.message.count({ where: { churchId, deletedAt: null } }),
  prisma.bibleStudy.count({ where: { churchId, deletedAt: null } }),
  prisma.video.count({ where: { churchId, deletedAt: null } }),
  prisma.dailyBread.count({ where: { churchId } }),
  prisma.speaker.count({ where: { churchId } }),
  prisma.series.count({ where: { churchId } }),
])
check('Messages', messageCount, 200)
check('Bible studies', studyCount, 1000)
check('Videos', videoCount, 5)
check('Daily breads', dailyBreadCount, 5)
check('Speakers', speakerCount, 10)
check('Series', seriesCount, 5)

// ── Events ─────────────────────────────────────────────────
console.log('\nEvents:')
const [eventTotal, eventRecurring] = await Promise.all([
  prisma.event.count({ where: { churchId, deletedAt: null } }),
  prisma.event.count({ where: { churchId, deletedAt: null, isRecurring: true } }),
])
check('Total events', eventTotal, 4)
check('Recurring meetings', eventRecurring, 4)

// ── People & CRM ───────────────────────────────────────────
console.log('\nPeople & CRM:')
const [personCount, groupCount, customFieldCount] = await Promise.all([
  prisma.person.count({ where: { churchId } }),
  prisma.personGroup.count({ where: { churchId } }),
  prisma.customFieldDefinition.count({ where: { churchId } }),
])
check('People', personCount, 15)
check('Person groups', groupCount, 2)
check('Custom field definitions', customFieldCount, 5)

// ── Summary ────────────────────────────────────────────────
console.log(`\n${issues === 0 ? '✅ All checks passed!' : `⚠️  ${issues} issue(s) found`}`)

await prisma.$disconnect()
await pool.end()
process.exit(issues > 0 ? 1 : 0)
