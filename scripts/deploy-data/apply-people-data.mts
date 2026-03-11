/**
 * Apply people data to the database.
 *
 * Creates/updates Person records for known speakers, person groups,
 * group memberships, and custom field definitions.
 *
 * Uses upsert — safe to run multiple times.
 * Does NOT touch Members/Users (auth layer) or content tables.
 *
 * Usage: npx tsx scripts/deploy-data/apply-people-data.mts
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

// ── People (speakers) ──────────────────────────────────────
console.log('Upserting people (speakers)...')
const SPEAKERS = [
  { slug: 'william-larsen', firstName: 'William', lastName: 'Larsen', title: 'Senior Pastor', bio: 'Pastor William Larsen has served as the senior shepherd of LA UBF since its founding. He leads the Sunday worship service and weekly Bible study.' },
  { slug: 'john-kwon', firstName: 'John', lastName: 'Kwon', title: 'Associate Pastor' },
  { slug: 'david-park', firstName: 'David', lastName: 'Park', title: 'Associate Pastor' },
  { slug: 'robert-fishman', firstName: 'Robert', lastName: 'Fishman', title: 'Campus Minister' },
  { slug: 'ron-ward', firstName: 'Ron', lastName: 'Ward', title: 'Bible Teacher' },
  { slug: 'troy-segale', firstName: 'Troy', lastName: 'Segale', title: 'Campus Minister' },
  { slug: 'frank-holman', firstName: 'Frank', lastName: 'Holman', title: 'Bible Teacher' },
  { slug: 'david-min', firstName: 'David', lastName: 'Min', title: 'Bible Teacher' },
  { slug: 'paul-im', firstName: 'Paul', lastName: 'Im', title: 'Bible Teacher' },
  { slug: 'paul-lim', firstName: 'Paul', lastName: 'Lim', title: 'Bible Teacher' },
  { slug: 'john-baik', firstName: 'John', lastName: 'Baik', title: 'Bible Teacher' },
  { slug: 'moses-yoon', firstName: 'Moses', lastName: 'Yoon', title: 'Bible Teacher' },
  { slug: 'timothy-cho', firstName: 'Timothy', lastName: 'Cho', title: 'Bible Teacher' },
  { slug: 'james-park', firstName: 'James', lastName: 'Park', title: 'Bible Teacher' },
  { slug: 'andrew-cuevas', firstName: 'Andrew', lastName: 'Cuevas', title: 'Bible Teacher' },
  { slug: 'joshua-lopez', firstName: 'Joshua', lastName: 'Lopez', title: 'Bible Teacher' },
  { slug: 'juan-perez', firstName: 'Juan', lastName: 'Perez', title: 'Bible Teacher' },
  { slug: 'jason-koch', firstName: 'Jason', lastName: 'Koch', title: 'Bible Teacher' },
  { slug: 'isiah-pulido', firstName: 'Isiah', lastName: 'Pulido', title: 'Bible Teacher' },
]

const personIds: Record<string, string> = {}
for (const sp of SPEAKERS) {
  const person = await prisma.person.upsert({
    where: { churchId_slug: { churchId, slug: sp.slug } },
    update: { title: sp.title, bio: sp.bio },
    create: {
      churchId,
      slug: sp.slug,
      firstName: sp.firstName,
      lastName: sp.lastName,
      title: sp.title,
      bio: sp.bio,
      membershipStatus: 'MEMBER',
      source: 'Speaker from message data',
    },
  })
  personIds[sp.slug] = person.id
}
console.log(`  ${SPEAKERS.length} people`)

// ── Person Groups ──────────────────────────────────────────
console.log('Upserting person groups...')

const groups = [
  {
    slug: 'sunday-bible-study',
    name: 'Sunday Bible Study',
    description: 'Weekly Sunday Bible Study for all members.',
    groupType: 'SMALL_GROUP' as const,
    meetingSchedule: 'Sundays 10:00 AM',
    meetingLocation: 'Main Hall',
    isOpen: true,
    members: [
      ['william-larsen', 'LEADER'], ['john-kwon', 'CO_LEADER'], ['david-park', 'MEMBER'],
      ['robert-fishman', 'MEMBER'], ['ron-ward', 'MEMBER'], ['frank-holman', 'MEMBER'],
      ['troy-segale', 'MEMBER'], ['david-min', 'MEMBER'],
    ] as [string, string][],
  },
  {
    slug: 'worship-team',
    name: 'Worship Team',
    description: 'Music and worship ministry team.',
    groupType: 'SERVING_TEAM' as const,
    meetingSchedule: 'Saturdays 3:00 PM (rehearsal)',
    meetingLocation: 'Sanctuary',
    isOpen: false,
    members: [
      ['john-kwon', 'LEADER'], ['troy-segale', 'MEMBER'], ['joshua-lopez', 'MEMBER'], ['andrew-cuevas', 'MEMBER'],
    ] as [string, string][],
  },
]

for (const g of groups) {
  // Upsert group
  const group = await prisma.personGroup.upsert({
    where: { churchId_slug: { churchId, slug: g.slug } },
    update: { name: g.name, description: g.description, meetingSchedule: g.meetingSchedule, meetingLocation: g.meetingLocation, isOpen: g.isOpen },
    create: { churchId, name: g.name, slug: g.slug, description: g.description, groupType: g.groupType, meetingSchedule: g.meetingSchedule, meetingLocation: g.meetingLocation, isOpen: g.isOpen, status: 'ACTIVE' },
  })

  // Clear and recreate members
  await prisma.personGroupMember.deleteMany({ where: { groupId: group.id } })
  for (const [personSlug, role] of g.members) {
    if (personIds[personSlug]) {
      await prisma.personGroupMember.create({
        data: { groupId: group.id, personId: personIds[personSlug], role: role as any },
      })
    }
  }
}
console.log(`  ${groups.length} groups with members`)

// ── Custom Field Definitions ───────────────────────────────
console.log('Upserting custom field definitions...')
const FIELDS = [
  { slug: 'emergency-contact', name: 'Emergency Contact', fieldType: 'TEXT', section: 'Emergency', isRequired: false, isVisible: true, sortOrder: 1 },
  { slug: 'emergency-phone', name: 'Emergency Phone', fieldType: 'TEXT', section: 'Emergency', isRequired: false, isVisible: true, sortOrder: 2 },
  { slug: 'allergies-medical-notes', name: 'Allergies / Medical Notes', fieldType: 'TEXT', section: 'Medical', isRequired: false, isVisible: false, sortOrder: 3 },
  { slug: 'tshirt-size', name: 'T-Shirt Size', fieldType: 'DROPDOWN', section: 'General', isRequired: false, isVisible: true, sortOrder: 4, options: ['XS', 'S', 'M', 'L', 'XL', '2XL'] },
  { slug: 'spiritual-gifts', name: 'Spiritual Gifts', fieldType: 'MULTI_SELECT', section: 'Spiritual', isRequired: false, isVisible: true, sortOrder: 5, options: ['Teaching', 'Leadership', 'Hospitality', 'Mercy', 'Evangelism', 'Worship', 'Administration', 'Encouragement', 'Giving', 'Service'] },
]
for (const f of FIELDS) {
  await prisma.customFieldDefinition.upsert({
    where: { churchId_slug: { churchId, slug: f.slug } },
    update: { name: f.name, section: f.section, isRequired: f.isRequired, isVisible: f.isVisible, sortOrder: f.sortOrder, options: f.options || [] },
    create: { churchId, name: f.name, slug: f.slug, fieldType: f.fieldType as any, section: f.section, isRequired: f.isRequired, isVisible: f.isVisible, sortOrder: f.sortOrder, options: f.options || [] },
  })
}
console.log(`  ${FIELDS.length} custom field definitions`)

console.log('\n✅ People data applied successfully!')

await prisma.$disconnect()
await pool.end()
