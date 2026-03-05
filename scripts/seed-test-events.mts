/**
 * Seed script: Create 3 comprehensive test events exercising ALL Event model fields.
 *
 * Usage:
 *   npx tsx scripts/seed-test-events.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ── Resolve churchId from CHURCH_SLUG ──
const churchSlug = process.env.CHURCH_SLUG ?? 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug: churchSlug } })
if (!church) {
  console.error(`Church with slug "${churchSlug}" not found.`)
  process.exit(1)
}
const churchId = church.id
console.log(`Using church: ${church.name} (${churchId})`)

// ── Helper: upsert event by slug ──
async function upsertEvent(
  slug: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>,
  links?: { label: string; href: string; external?: boolean }[],
) {
  const existing = await prisma.event.findFirst({ where: { churchId, slug } })

  let event
  if (existing) {
    event = await prisma.event.update({
      where: { id: existing.id },
      data,
      include: { ministry: true, campus: true, eventLinks: true },
    })
    console.log(`  Updated existing event: "${event.title}" (${event.slug})`)
  } else {
    event = await prisma.event.create({
      data: { ...data, churchId, slug },
      include: { ministry: true, campus: true, eventLinks: true },
    })
    console.log(`  Created new event: "${event.title}" (${event.slug})`)
  }

  // Sync EventLink records
  if (links && links.length > 0) {
    await prisma.eventLink.deleteMany({ where: { eventId: event.id } })
    for (let i = 0; i < links.length; i++) {
      await prisma.eventLink.create({
        data: {
          eventId: event.id,
          label: links[i].label,
          href: links[i].href,
          external: links[i].external ?? true,
          sortOrder: i,
        },
      })
    }
    console.log(`    Synced ${links.length} EventLink records`)
  }

  return event
}

// ============================================================
// Event 1: Spring Family Retreat (EVENT type — ALL fields populated)
// ============================================================
console.log('\n1. Spring Family Retreat 2026 (EVENT)')
await upsertEvent(
  'spring-family-retreat-2026',
  {
    title: 'Spring Family Retreat 2026',
    type: 'EVENT',
    status: 'PUBLISHED',
    publishedAt: new Date(),

    // Scheduling
    dateStart: new Date('2026-04-15'),
    dateEnd: new Date('2026-04-17'),
    startTime: '09:00',
    endTime: '17:00',
    allDay: false,

    // Location (HYBRID — both in-person and online)
    locationType: 'HYBRID',
    location: 'Grace Community Center',
    address: '1234 Maple Avenue, Long Beach, CA 90802',
    locationInstructions: 'Enter through the south entrance. Parking available in Lot B.',
    directionsUrl: 'https://maps.google.com/?q=1234+Maple+Avenue+Long+Beach+CA+90802',
    latitude: 33.77005000,
    longitude: -118.18923000,
    meetingUrl: 'https://zoom.us/j/123456789',

    // Content
    shortDescription:
      'A weekend retreat for the whole family with worship, fellowship, and outdoor activities.',
    description:
      '<h3>About This Event</h3><p>Join us for a refreshing weekend of worship, fellowship, and outdoor activities at the Grace Community Center.</p><h3>Schedule</h3><ul><li>Friday: Check-in and welcome dinner</li><li>Saturday: Morning worship, afternoon activities</li><li>Sunday: Closing service and lunch</li></ul>',
    welcomeMessage:
      "<p>We're so glad you're interested in joining us! This retreat is open to all families. Childcare will be provided for ages 0-5.</p>",
    coverImage:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=400&fit=crop',
    imageAlt: 'Families gathering outdoors for a retreat',
    imagePosition: 'center',

    // Contacts (JSON)
    contacts: [
      { name: 'John Baik', label: 'Retreat Coordinator', isMain: true },
      { name: 'Sarah Kim', label: 'Registration' },
    ],

    // Categorization
    badge: 'Family',

    // Registration
    registrationUrl: 'https://forms.google.com/spring-retreat-2026',
    costType: 'PAID',
    costAmount: '$45 per person',
    registrationRequired: true,
    maxParticipants: 150,
    registrationDeadline: new Date('2026-04-10T00:00:00.000Z'),

    // Flags
    isFeatured: true,
    isPinned: false,

    // Recurrence (none)
    isRecurring: false,
    recurrence: 'NONE',
    recurrenceDays: [],
    recurrenceEndType: 'NEVER',
    recurrenceEndDate: null,
    recurrenceEndAfter: null,
    customRecurrence: null,
    monthlyRecurrenceType: null,
    recurrenceSchedule: null,

    // Legacy links JSON (keep null — using EventLink relation instead)
    links: null,
  },
  // EventLink relation records
  [
    { label: 'Retreat Schedule PDF', href: 'https://example.com/schedule.pdf', external: true },
    { label: 'Packing List', href: 'https://example.com/packing-list', external: true },
  ],
)

// ============================================================
// Event 2: Weekly Leaders Meeting (MEETING type — recurring)
// ============================================================
console.log('\n2. Weekly Leaders Meeting (MEETING)')
await upsertEvent('weekly-leaders-meeting', {
  title: 'Weekly Leaders Meeting',
  type: 'MEETING',
  status: 'PUBLISHED',
  publishedAt: new Date(),

  // Scheduling
  dateStart: new Date('2026-03-10'),
  dateEnd: null,
  startTime: '19:00',
  endTime: '20:30',
  allDay: false,

  // Location (ONLINE)
  locationType: 'ONLINE',
  location: null,
  address: null,
  locationInstructions: null,
  directionsUrl: null,
  latitude: null,
  longitude: null,
  meetingUrl: 'https://zoom.us/j/987654321',

  // Content
  shortDescription: 'Weekly coordination meeting for ministry leaders.',
  description: null,
  welcomeMessage: null,
  coverImage: null,
  imageAlt: null,
  imagePosition: null,

  // Contacts
  contacts: null,

  // Categorization
  badge: null,

  // Registration
  registrationUrl: null,
  costType: 'FREE',
  costAmount: null,
  registrationRequired: false,
  maxParticipants: null,
  registrationDeadline: null,

  // Flags
  isFeatured: false,
  isPinned: false,

  // Recurrence (weekly on Monday)
  isRecurring: true,
  recurrence: 'WEEKLY',
  recurrenceDays: ['mon'],
  recurrenceEndType: 'NEVER',
  recurrenceEndDate: null,
  recurrenceEndAfter: null,
  customRecurrence: null,
  monthlyRecurrenceType: null,
  recurrenceSchedule: 'Every Monday',

  // Legacy links
  links: null,
})

// ============================================================
// Event 3: Summer Bible Academy (PROGRAM type)
// ============================================================
console.log('\n3. Summer Bible Academy (PROGRAM)')
await upsertEvent('summer-bible-academy', {
  title: 'Summer Bible Academy',
  type: 'PROGRAM',
  status: 'PUBLISHED',
  publishedAt: new Date(),

  // Scheduling
  dateStart: new Date('2026-06-01'),
  dateEnd: new Date('2026-08-15'),
  startTime: '10:00',
  endTime: '12:00',
  allDay: false,

  // Location (IN_PERSON)
  locationType: 'IN_PERSON',
  location: 'LA UBF Center',
  address: '456 University Ave, Los Angeles, CA 90007',
  locationInstructions: null,
  directionsUrl: null,
  latitude: null,
  longitude: null,
  meetingUrl: null,

  // Content
  shortDescription: 'An intensive summer program studying the Gospel of John.',
  description: null,
  welcomeMessage: null,
  coverImage: null,
  imageAlt: null,
  imagePosition: null,

  // Contacts
  contacts: null,

  // Categorization
  badge: null,

  // Registration
  registrationUrl: 'https://forms.google.com/summer-academy',
  costType: 'DONATION',
  costAmount: '$20 suggested',
  registrationRequired: true,
  maxParticipants: 30,
  registrationDeadline: new Date('2026-05-25T00:00:00.000Z'),

  // Flags
  isFeatured: false,
  isPinned: false,

  // Recurrence (none)
  isRecurring: false,
  recurrence: 'NONE',
  recurrenceDays: [],
  recurrenceEndType: 'NEVER',
  recurrenceEndDate: null,
  recurrenceEndAfter: null,
  customRecurrence: null,
  monthlyRecurrenceType: null,
  recurrenceSchedule: null,

  // Legacy links
  links: null,
})

// ============================================================
// Done — disconnect
// ============================================================
await prisma.$disconnect()
await pool.end()
console.log('\nDone! 3 test events seeded successfully.\n')
