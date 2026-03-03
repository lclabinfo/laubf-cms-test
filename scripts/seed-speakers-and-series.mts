/**
 * Seed script: Canonical Speakers + Series
 *
 * This script:
 * 1. Resolves churchId from CHURCH_SLUG=la-ubf
 * 2. Deletes ALL existing Person records for this church (cascade handles role assignments)
 * 3. Gets or creates the "speaker" role definition
 * 4. Creates 23 canonical speakers as Person + Speaker role
 * 5. Creates 8 Series records (upsert to avoid duplicates)
 *
 * Run: npx tsx scripts/seed-speakers-and-series.mts
 */

import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ============================================================
// Helper: slugify
// ============================================================
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// ============================================================
// Data: 23 canonical speakers
// ============================================================
const SPEAKERS = [
  { firstName: 'William', lastName: 'Larsen' },
  { firstName: 'John', lastName: 'Kwon' },
  { firstName: 'David', lastName: 'Park' },
  { firstName: 'Paul', lastName: 'Lim' },
  { firstName: 'Robert', lastName: 'Fishman' },
  { firstName: 'David', lastName: 'Min' },
  { firstName: 'Paul', lastName: 'Im' },
  { firstName: 'John', lastName: 'Baik' },
  { firstName: 'Jason', lastName: 'Koch' },
  { firstName: 'Moses', lastName: 'Yoon' },
  { firstName: 'Troy', lastName: 'Segale' },
  { firstName: 'Ron', lastName: 'Ward' },
  { firstName: 'Augustine', lastName: 'Kim' },
  { firstName: 'Juan', lastName: 'Perez' },
  { firstName: 'Terry', lastName: 'Lopez' },
  { firstName: 'Frank', lastName: 'Holman' },
  { firstName: 'Daniel', lastName: 'Shim' },
  { firstName: 'Peace', lastName: 'Oh' },
  { firstName: 'Andrew', lastName: 'Cuevas' },
  { firstName: 'Isiah', lastName: 'Pulido' },
  { firstName: 'James', lastName: 'Park' },
  { firstName: 'Timothy', lastName: 'Cho' },
  { firstName: 'Joshua', lastName: 'Lopez' },
]

// ============================================================
// Data: 8 series
// ============================================================
const SERIES = [
  { name: 'Sunday Service', slug: 'sunday-service' },
  { name: 'Wednesday Bible Study', slug: 'wednesday-bible-study' },
  { name: 'Conference', slug: 'conference' },
  { name: 'CBF', slug: 'cbf' },
  { name: 'JBF', slug: 'jbf' },
  { name: 'Events', slug: 'events' },
  { name: 'Prayer Meeting', slug: 'prayer-meeting' },
  { name: 'Special Studies', slug: 'special-studies' },
]

// ============================================================
// Main
// ============================================================
async function main() {
  // 1. Resolve churchId
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) throw new Error(`Church not found: ${slug}`)
  const churchId = church.id
  console.log(`Resolved church "${church.name}" (${churchId})`)

  // 2. Delete ALL existing Person records for this church
  //    Cascade on PersonRoleAssignment (onDelete: Cascade) handles role cleanup.
  //    We also need to clean up Households and PersonGroups that reference Person records.
  console.log('\nDeleting existing people data...')

  // Delete household members first (they reference personId)
  await prisma.householdMember.deleteMany({ where: { person: { churchId } } })
  // Delete households (primaryContactId references Person)
  await prisma.household.deleteMany({ where: { churchId } })
  // Delete person group members
  await prisma.personGroupMember.deleteMany({ where: { person: { churchId } } })
  // Delete person notes
  await prisma.personNote.deleteMany({ where: { person: { churchId } } })
  // Delete custom field values for people
  await prisma.customFieldValue.deleteMany({ where: { person: { churchId } } })
  // Delete communication preferences
  await prisma.communicationPreference.deleteMany({ where: { person: { churchId } } })
  // Delete person tags
  await prisma.personTag.deleteMany({ where: { person: { churchId } } })
  // Delete role assignments (will also be cascaded, but explicit is safer)
  await prisma.personRoleAssignment.deleteMany({ where: { person: { churchId } } })
  // Delete all Person records
  const deleteResult = await prisma.person.deleteMany({ where: { churchId } })
  console.log(`  Deleted ${deleteResult.count} existing Person records`)

  // Also delete existing role definitions to recreate cleanly
  await prisma.personRoleDefinition.deleteMany({ where: { churchId } })
  console.log('  Deleted existing role definitions')

  // 3. Get or create the "speaker" role definition
  console.log('\nCreating role definitions...')
  const speakerRole = await prisma.personRoleDefinition.create({
    data: {
      churchId,
      name: 'Speaker',
      slug: 'speaker',
      description: 'Sermon and Bible study speakers',
      isSystem: true,
      color: '#6366f1',
      icon: 'mic',
      sortOrder: 1,
    },
  })
  console.log(`  Created "Speaker" role definition (${speakerRole.id})`)

  // 4. Create 23 speakers as Person + Speaker role
  console.log('\nCreating speakers...')
  for (const speaker of SPEAKERS) {
    const personSlug = slugify(`${speaker.firstName} ${speaker.lastName}`)

    const person = await prisma.person.create({
      data: {
        churchId,
        slug: personSlug,
        firstName: speaker.firstName,
        lastName: speaker.lastName,
        membershipStatus: 'VISITOR',
        source: 'Speaker seed script',
      },
    })

    await prisma.personRoleAssignment.create({
      data: {
        personId: person.id,
        roleId: speakerRole.id,
      },
    })

    console.log(`  Created speaker: ${speaker.firstName} ${speaker.lastName} (${personSlug})`)
  }
  console.log(`  Total: ${SPEAKERS.length} speakers created`)

  // 5. Create 8 Series records (upsert to avoid duplicates)
  console.log('\nCreating series...')

  // First, delete existing series for a clean slate
  // Need to remove MessageSeries join records first
  const existingSeries = await prisma.series.findMany({ where: { churchId } })
  for (const s of existingSeries) {
    await prisma.messageSeries.deleteMany({ where: { seriesId: s.id } })
  }
  await prisma.series.deleteMany({ where: { churchId } })
  console.log('  Cleared existing series')

  for (const series of SERIES) {
    const created = await prisma.series.create({
      data: {
        churchId,
        name: series.name,
        slug: series.slug,
        isActive: true,
      },
    })
    console.log(`  Created series: ${series.name} (${created.id})`)
  }
  console.log(`  Total: ${SERIES.length} series created`)

  console.log('\nSeed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
