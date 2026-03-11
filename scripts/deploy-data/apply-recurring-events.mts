/**
 * Apply events to the database.
 *
 * Includes the structural recurring meetings (Daily Bread, Evening Prayer,
 * Men's Bible Study, Sunday Livestream) plus sample one-off events and programs.
 *
 * Uses upsert — safe to run multiple times.
 * Does NOT touch events created through the CMS.
 *
 * Usage: npx tsx scripts/deploy-data/apply-recurring-events.mts
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

// Resolve ministry IDs
const ministries = await prisma.ministry.findMany({ where: { churchId }, select: { id: true, slug: true } })
const ministryMap = new Map(ministries.map((m) => [m.slug, m.id]))

const EVENTS = [
  // ── Recurring Meetings ──────────────────────────────────────
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

  // ── One-off Events ──────────────────────────────────────────
  {
    slug: 'spring-retreat-2026',
    title: 'Spring Bible Conference',
    type: 'EVENT',
    dateStart: '2026-04-10',
    dateEnd: '2026-04-12',
    startTime: '6:00 PM',
    endTime: '9:00 PM',
    location: 'Pine Summit Christian Camp',
    address: '30345 CA-18, Running Springs, CA 92382',
    locationType: 'IN_PERSON',
    shortDescription: 'Annual spring Bible conference. Three days of worship, Bible study, and fellowship in the mountains.',
    description: 'Join us for our annual Spring Bible Conference at Pine Summit Camp. This year\'s theme focuses on the Gospel of John. The conference features group Bible study, worship services, team activities, and personal reflection time. Open to all ages and families welcome.',
    ministrySlug: 'church-wide',
    isRecurring: false,
    recurrence: 'NONE',
    recurrenceDays: [],
    isFeatured: true,
    costType: 'PAID',
    costAmount: '$120 per person',
    registrationRequired: true,
    registrationUrl: 'https://forms.google.com/spring-conference-2026',
    registrationDeadline: '2026-03-28',
    maxParticipants: 80,
    status: 'PUBLISHED',
  },
  {
    slug: 'easter-worship-2026',
    title: 'Easter Sunrise Worship',
    type: 'EVENT',
    dateStart: '2026-04-05',
    startTime: '6:30 AM',
    endTime: '8:00 AM',
    location: 'LA UBF Main Center',
    locationType: 'HYBRID',
    shortDescription: 'Celebrate the resurrection of Jesus Christ with a special sunrise worship service.',
    ministrySlug: 'church-wide',
    isRecurring: false,
    recurrence: 'NONE',
    recurrenceDays: [],
    isFeatured: true,
    meetingUrl: 'https://www.youtube.com/@LAUBF/streams',
    status: 'PUBLISHED',
  },
  {
    slug: 'campus-welcome-week',
    title: 'Campus Welcome Week',
    type: 'EVENT',
    dateStart: '2026-04-06',
    dateEnd: '2026-04-10',
    startTime: '11:00 AM',
    endTime: '2:00 PM',
    location: 'Various campus locations',
    locationType: 'IN_PERSON',
    shortDescription: 'Welcome new students! Free lunch, Bible study intro, and campus tours.',
    ministrySlug: 'young-adult',
    isRecurring: false,
    recurrence: 'NONE',
    recurrenceDays: [],
    status: 'PUBLISHED',
  },

  // ── Programs ────────────────────────────────────────────────
  {
    slug: 'summer-bible-academy-2026',
    title: 'Summer Bible Academy',
    type: 'PROGRAM',
    dateStart: '2026-06-15',
    dateEnd: '2026-08-15',
    startTime: '9:00 AM',
    endTime: '12:00 PM',
    location: 'LA UBF Main Center',
    locationType: 'HYBRID',
    shortDescription: 'An 8-week intensive Bible study program covering the major themes of Scripture.',
    description: 'The Summer Bible Academy is an 8-week intensive program designed for those who want to deepen their understanding of Scripture. Each week covers a major theme: Creation, Fall, Redemption, the Patriarchs, the Exodus, the Kingdom, the Prophets, and the Gospel. Includes lectures, small group discussions, and personal study assignments.',
    ministrySlug: 'church-wide',
    isRecurring: false,
    recurrence: 'NONE',
    recurrenceDays: [],
    isFeatured: true,
    meetingUrl: 'https://us02web.zoom.us/j/86540458764',
    registrationRequired: true,
    registrationUrl: 'https://forms.google.com/summer-bible-academy',
    registrationDeadline: '2026-06-01',
    maxParticipants: 30,
    status: 'PUBLISHED',
  },
  {
    slug: 'leadership-training-spring',
    title: 'Leadership Training Program',
    type: 'PROGRAM',
    dateStart: '2026-03-15',
    dateEnd: '2026-05-15',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    location: 'LA UBF Main Center',
    locationType: 'IN_PERSON',
    shortDescription: 'A 10-week leadership development program for Bible teachers and small group leaders.',
    ministrySlug: 'adult',
    isRecurring: false,
    recurrence: 'NONE',
    recurrenceDays: [],
    status: 'PUBLISHED',
  },
]

// Resolve campus IDs
const campuses = await prisma.campus.findMany({ where: { churchId }, select: { id: true, slug: true } })
const campusMap = new Map(campuses.map((c) => [c.slug, c.id]))

console.log('Upserting events...')
for (const e of EVENTS) {
  await prisma.event.upsert({
    where: { churchId_slug: { churchId, slug: e.slug } },
    update: {
      title: e.title,
      type: e.type as any,
      dateStart: new Date(e.dateStart),
      dateEnd: e.dateEnd ? new Date(e.dateEnd) : null,
      startTime: e.startTime,
      endTime: e.endTime || null,
      location: e.location,
      address: e.address || null,
      locationType: e.locationType as any,
      shortDescription: e.shortDescription,
      description: e.description || null,
      isRecurring: e.isRecurring,
      recurrence: e.recurrence as any,
      recurrenceDays: e.recurrenceDays,
      recurrenceSchedule: e.recurrenceSchedule || null,
      meetingUrl: e.meetingUrl || null,
      isFeatured: e.isFeatured || false,
      costType: e.costType || 'FREE',
      costAmount: e.costAmount || null,
      registrationRequired: e.registrationRequired || false,
      registrationUrl: e.registrationUrl || null,
      registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline) : null,
      maxParticipants: e.maxParticipants || null,
      status: e.status as any,
      ministryId: e.ministrySlug ? ministryMap.get(e.ministrySlug) || null : null,
      campusId: (e as any).campusSlug ? campusMap.get((e as any).campusSlug) || null : null,
    },
    create: {
      churchId,
      slug: e.slug,
      title: e.title,
      type: e.type as any,
      dateStart: new Date(e.dateStart),
      dateEnd: e.dateEnd ? new Date(e.dateEnd) : null,
      startTime: e.startTime,
      endTime: e.endTime || null,
      location: e.location,
      address: e.address || null,
      locationType: e.locationType as any,
      shortDescription: e.shortDescription,
      description: e.description || null,
      isRecurring: e.isRecurring,
      recurrence: e.recurrence as any,
      recurrenceDays: e.recurrenceDays,
      recurrenceSchedule: e.recurrenceSchedule || null,
      meetingUrl: e.meetingUrl || null,
      isFeatured: e.isFeatured || false,
      costType: e.costType || 'FREE',
      costAmount: e.costAmount || null,
      registrationRequired: e.registrationRequired || false,
      registrationUrl: e.registrationUrl || null,
      registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline) : null,
      maxParticipants: e.maxParticipants || null,
      status: e.status as any,
      publishedAt: new Date(),
      ministryId: e.ministrySlug ? ministryMap.get(e.ministrySlug) || null : null,
      campusId: (e as any).campusSlug ? campusMap.get((e as any).campusSlug) || null : null,
    },
  })
  console.log(`  [${e.type}] ${e.title}`)
}

console.log(`\n✅ ${EVENTS.length} events applied successfully!`)

await prisma.$disconnect()
await pool.end()
