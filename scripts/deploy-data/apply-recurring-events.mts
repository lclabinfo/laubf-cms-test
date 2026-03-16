/**
 * Apply recurring meetings to the database.
 *
 * These are the structural recurring meetings (Daily Bread, Evening Prayer,
 * Men's Bible Study, Sunday Livestream) that appear in Quick Links.
 *
 * Uses upsert — safe to run multiple times.
 * Does NOT touch one-off events created through the CMS.
 *
 * Usage: npx tsx scripts/deploy-data/apply-recurring-events.mts
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

// Resolve ministry IDs
const ministries = await prisma.ministry.findMany({ where: { churchId }, select: { id: true, slug: true } })
const ministryMap = new Map(ministries.map((m) => [m.slug, m.id]))

const EVENTS = [
  {
    slug: 'daily-bread-meeting',
    title: 'Daily Bread & Prayer Meeting',
    type: 'MEETING',
    dateStart: '2026-02-01',
    startTime: '6:00 AM',
    endTime: '7:00 AM',
    location: 'LA UBF Main Center',
    locationType: 'IN_PERSON',
    shortDescription: 'Start your morning in the Word.',
    ministrySlug: 'church-wide',
    isRecurring: true,
    recurrence: 'WEEKLY',
    recurrenceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    recurrenceSchedule: 'Mon–Fri @ 6 AM',
    meetingUrl: 'https://us02web.zoom.us/j/86540458764?pwd=ZDVUUjZDOVZ4WlJFc1VvNVlzd2tkQT09',
    status: 'PUBLISHED',
  },
  {
    slug: 'evening-prayer-meeting',
    title: 'Evening Prayer Meeting',
    type: 'MEETING',
    dateStart: '2026-02-01',
    startTime: '7:30 PM',
    endTime: '8:00 PM',
    location: 'LA UBF Main Center',
    locationType: 'IN_PERSON',
    shortDescription: 'A daily evening prayer meeting.',
    ministrySlug: 'church-wide',
    isRecurring: true,
    recurrence: 'DAILY',
    recurrenceDays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    recurrenceSchedule: 'Every Day @ 7:30 PM',
    meetingUrl: 'https://meet.google.com/pgm-trah-moc',
    status: 'PUBLISHED',
  },
  {
    slug: 'mens-bible-study',
    title: "Men's Bible Study",
    type: 'MEETING',
    dateStart: '2026-02-01',
    startTime: '8:00 AM',
    endTime: '10:00 AM',
    location: 'LA UBF Main Center',
    locationType: 'IN_PERSON',
    shortDescription: 'A weekly gathering for men to study Scripture.',
    ministrySlug: 'church-wide',
    isRecurring: true,
    recurrence: 'WEEKLY',
    recurrenceDays: ['SAT'],
    recurrenceSchedule: 'Sat @ 8 AM',
    status: 'PUBLISHED',
  },
  {
    slug: 'sunday-livestream',
    title: 'Sunday Livestream',
    type: 'MEETING',
    dateStart: '2026-02-01',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    location: 'LA UBF Main Center / YouTube Live',
    locationType: 'HYBRID',
    shortDescription: 'Join our Sunday worship service in person or watch the livestream.',
    ministrySlug: 'church-wide',
    isRecurring: true,
    recurrence: 'WEEKLY',
    recurrenceDays: ['SUN'],
    recurrenceSchedule: 'Sun @ 11 AM',
    meetingUrl: 'https://www.youtube.com/@LAUBF/streams',
    status: 'PUBLISHED',
  },
]

console.log('Upserting recurring events...')
for (const e of EVENTS) {
  await prisma.event.upsert({
    where: { churchId_slug: { churchId, slug: e.slug } },
    update: {
      title: e.title,
      type: e.type as any,
      startTime: e.startTime,
      endTime: e.endTime || null,
      location: e.location,
      locationType: e.locationType as any,
      shortDescription: e.shortDescription,
      isRecurring: e.isRecurring,
      recurrence: e.recurrence as any,
      recurrenceDays: e.recurrenceDays,
      recurrenceSchedule: e.recurrenceSchedule || null,
      meetingUrl: e.meetingUrl || null,
      status: e.status as any,
      ministryId: e.ministrySlug ? ministryMap.get(e.ministrySlug) || null : null,
    },
    create: {
      churchId,
      slug: e.slug,
      title: e.title,
      type: e.type as any,
      dateStart: new Date(e.dateStart),
      startTime: e.startTime,
      endTime: e.endTime || null,
      location: e.location,
      locationType: e.locationType as any,
      shortDescription: e.shortDescription,
      isRecurring: e.isRecurring,
      recurrence: e.recurrence as any,
      recurrenceDays: e.recurrenceDays,
      recurrenceSchedule: e.recurrenceSchedule || null,
      meetingUrl: e.meetingUrl || null,
      status: e.status as any,
      publishedAt: new Date(),
      ministryId: e.ministrySlug ? ministryMap.get(e.ministrySlug) || null : null,
    },
  })
  console.log(`  ${e.title}`)
}

console.log(`\n✅ ${EVENTS.length} recurring events applied successfully!`)

await prisma.$disconnect()
await pool.end()
