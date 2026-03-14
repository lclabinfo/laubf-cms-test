/**
 * Import legacy LA UBF members from the old users + email_list tables.
 *
 * What this script does:
 * 1. Merges Paul Im → Paul Lim (Speaker + Person tables)
 * 2. Imports all legacy users + email-only contacts as Person records
 * 3. Fixes David Park if archived (restores deletedAt)
 * 4. De-duplicates by email (prefers users table over email_list)
 *
 * Usage: npx tsx scripts/import-legacy-members.mts
 *
 * Safe to run multiple times — uses upsert by churchId_slug.
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

const slug = process.env.CHURCH_SLUG || 'la-ubf'
const church = await prisma.church.findUnique({ where: { slug } })
if (church === null) { console.error(`Church not found: ${slug}`); process.exit(1) }
const churchId = church.id
console.log(`Church: ${church.name} (${churchId})\n`)

// ── Helper ──────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function titleCase(s: string): string {
  return s
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function parseName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim().replace(/\s+/g, ' ')
  const parts = trimmed.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  // Handle "Sr.", "Jr." suffixes — keep them in the last name
  const lastName = parts[parts.length - 1]
  const firstName = parts.slice(0, -1).join(' ')
  return { firstName, lastName }
}

// ── Step 1: Merge Paul Im → Paul Lim in Speaker table ──────
console.log('Step 1: Merge Paul Im → Paul Lim (Speakers)...')
const paulImSpeaker = await prisma.speaker.findUnique({
  where: { churchId_slug: { churchId, slug: 'paul-im' } },
  select: { id: true },
})
const paulLimSpeaker = await prisma.speaker.findUnique({
  where: { churchId_slug: { churchId, slug: 'paul-lim' } },
  select: { id: true },
})
// Also handle the "Paul" alias speaker
const paulAliasSpeaker = await prisma.speaker.findUnique({
  where: { churchId_slug: { churchId, slug: 'paul' } },
  select: { id: true },
})

if (paulImSpeaker && paulLimSpeaker) {
  // Reassign Paul Im's messages to Paul Lim
  const msgUpdate = await prisma.message.updateMany({
    where: { speakerId: paulImSpeaker.id },
    data: { speakerId: paulLimSpeaker.id },
  })
  const studyUpdate = await prisma.bibleStudy.updateMany({
    where: { speakerId: paulImSpeaker.id },
    data: { speakerId: paulLimSpeaker.id },
  })
  console.log(`  Reassigned ${msgUpdate.count} messages and ${studyUpdate.count} studies from Paul Im → Paul Lim`)

  // Delete Paul Im speaker
  await prisma.speaker.delete({ where: { id: paulImSpeaker.id } })
  console.log('  Deleted Paul Im speaker record')
} else {
  console.log('  Paul Im speaker not found or already merged — skipping')
}

if (paulAliasSpeaker && paulLimSpeaker) {
  // Reassign "Paul" alias messages to Paul Lim
  const msgUpdate = await prisma.message.updateMany({
    where: { speakerId: paulAliasSpeaker.id },
    data: { speakerId: paulLimSpeaker.id },
  })
  const studyUpdate = await prisma.bibleStudy.updateMany({
    where: { speakerId: paulAliasSpeaker.id },
    data: { speakerId: paulLimSpeaker.id },
  })
  console.log(`  Reassigned ${msgUpdate.count} messages and ${studyUpdate.count} studies from "Paul" alias → Paul Lim`)

  await prisma.speaker.delete({ where: { id: paulAliasSpeaker.id } })
  console.log('  Deleted "Paul" alias speaker record')
} else {
  console.log('  "Paul" alias speaker not found or already merged — skipping')
}

// Merge Paul Im → Paul Lim in Person table
const paulImPerson = await prisma.person.findUnique({
  where: { churchId_slug: { churchId, slug: 'paul-im' } },
  select: { id: true },
})
if (paulImPerson) {
  // Check for any role assignments, notes, etc. and reassign to paul-lim
  const paulLimPerson = await prisma.person.findUnique({
    where: { churchId_slug: { churchId, slug: 'paul-lim' } },
    select: { id: true },
  })
  if (paulLimPerson) {
    // Delete Paul Im's role assignments (Paul Lim already has them)
    await prisma.personRoleAssignment.deleteMany({
      where: { personId: paulImPerson.id },
    })
    // Move notes to Paul Lim
    await prisma.personNote.updateMany({
      where: { personId: paulImPerson.id },
      data: { personId: paulLimPerson.id },
    })
    // Delete any communication preferences
    await prisma.communicationPreference.deleteMany({
      where: { personId: paulImPerson.id },
    })
  }
  // Hard-delete Paul Im person (it's a duplicate)
  await prisma.person.delete({ where: { id: paulImPerson.id } })
  console.log('  Deleted Paul Im person record (merged into Paul Lim)')
} else {
  console.log('  Paul Im person not found or already merged — skipping')
}

// ── Step 2: Fix David Park (restore if archived) ────────────
console.log('\nStep 2: Fix David Park...')
const davidPark = await prisma.person.findUnique({
  where: { churchId_slug: { churchId, slug: 'david-park' } },
  select: { id: true, deletedAt: true, membershipStatus: true },
})
if (davidPark) {
  if (davidPark.deletedAt || davidPark.membershipStatus === 'ARCHIVED') {
    await prisma.person.update({
      where: { id: davidPark.id },
      data: { deletedAt: null, membershipStatus: 'MEMBER' },
    })
    console.log('  Restored David Park (cleared deletedAt, set status MEMBER)')
  } else {
    console.log('  David Park is already active (status=' + davidPark.membershipStatus + ')')
  }
} else {
  console.log('  David Park not found — will be created in Step 3')
}

// ── Step 3: Import legacy users + email list ────────────────
console.log('\nStep 3: Import legacy users + email list contacts...')

// From dump_laubf_users.sql — parsed legacy users
// Excluding admin/test accounts and duplicate email accounts
const legacyUsers: { name: string; email: string; createdAt?: string }[] = [
  { name: 'Joseph Cho', email: 'joseph.whcho@gmail.com', createdAt: '2020-04-12' },
  { name: 'Yerin', email: 'cds05187@gmail.com', createdAt: '2019-06-23' },
  { name: 'David Park', email: 'davidwanp@gmail.com', createdAt: '2019-06-29' },
  { name: 'Billy Park', email: 'bcjmepark@gmail.com', createdAt: '2019-06-29' },
  { name: 'Young Choi', email: 'mscfc472@gmail.com', createdAt: '2019-06-30' },
  { name: 'Jason Koch', email: 'jkoch7@gmail.com', createdAt: '2019-07-03' },
  { name: 'Rebecca Park', email: 'parkrebecca@gmail.com', createdAt: '2019-10-13' },
  { name: 'Teresa Park', email: 'teresapark5145@gmail.com', createdAt: '2019-10-15' },
  { name: 'Youngran Chang', email: 'djexpressusa@gmail.com', createdAt: '2019-10-15' },
  { name: 'Jennifer Perez', email: 'jvu008@gmail.com', createdAt: '2019-10-16' },
  { name: 'Grace Han', email: 'gracehan1674@gmail.com', createdAt: '2019-10-19' },
  { name: 'Heather Koch', email: 'vision4more@gmail.com', createdAt: '2019-11-05' },
  { name: 'Rebecca M', email: 'chun.rebecca@gmail.com', createdAt: '2019-11-06' },
  { name: 'Jae Yu', email: 'jamesyum3@gmail.com', createdAt: '2020-03-22' },
  { name: 'Leo', email: 'leo.alexanderg1999@gmail.com', createdAt: '2020-03-29' },
  { name: 'Lillia Michaud', email: 'lillia2@yahoo.com', createdAt: '2020-04-12' },
  { name: 'Robert Fishman', email: 'rfishman2@gmail.com', createdAt: '2020-04-14' },
  { name: 'Maria Oh', email: 'almondblossom72@gmail.com', createdAt: '2020-04-16' },
  { name: 'Sangim Lee', email: 'susanna2237@gmail.com', createdAt: '2020-05-03' },
  { name: 'David H Chung', email: 'dchung3115@gmail.com', createdAt: '2020-05-03' },
  { name: 'Tatiana Liseth', email: 'lisethtatiana3@gmail.com', createdAt: '2020-06-04' },
  { name: 'Keong Cha', email: 'pd154@hanmail.net', createdAt: '2020-09-05' },
  { name: 'Juan Perez', email: 'jvperez13@gmail.com', createdAt: '2021-02-14' },
  { name: 'William Larsen', email: 'williamjlarsen@gmail.com', createdAt: '2022-01-17' },
  { name: 'Choibi', email: 'globalchoibi@hanmail.net', createdAt: '2022-02-28' },
  { name: 'Danbee Park', email: 'p.sweetrain@gmail.com', createdAt: '2023-02-11' },
  { name: 'James Park Sr', email: 'jpark90241@yahoo.com', createdAt: '2023-03-04' },
  { name: 'Jeongsoo Park', email: 'mdjs0721@gmail.com', createdAt: '2023-10-06' },
  { name: 'Suvda', email: 'suvdaaubf@gmail.com', createdAt: '2025-02-03' },
  { name: 'Veronika', email: 'icc22122018@gmail.com', createdAt: '2025-02-04' },
  { name: 'Nataliya Cuevas', email: 'vitnava@gmail.com', createdAt: '2025-02-04' },
  { name: 'Andrew Cuevas', email: 'awcuevas@gmail.com', createdAt: '2025-02-07' },
  { name: 'Jesse Lizarraga', email: 'lizarraga.jesse07@gmail.com', createdAt: '2025-02-09' },
  { name: 'Abigaelle Leigh', email: 'ab7.leigh@gmail.com', createdAt: '2025-02-09' },
  { name: 'Deborah Chang', email: 'debbieyoungran26@gmail.com', createdAt: '2025-02-10' },
  { name: 'Peace Oh', email: 'peacehavefaith@gmail.com', createdAt: '2025-02-11' },
  { name: 'Lucia', email: 'luciaochoa587@gmail.com', createdAt: '2025-02-11' },
  { name: 'Troy Segale', email: 'tsegale@gmail.com', createdAt: '2025-02-12' },
  { name: 'Mark Lopez', email: 'mark.yuji.lopez@gmail.com', createdAt: '2025-02-12' },
  { name: 'Julie Yu', email: 'juliehyunyu@gmail.com', createdAt: '2025-02-12' },
  { name: 'Daniel Shim', email: 'dshim619@gmail.com', createdAt: '2025-02-12' },
  { name: 'Isa Lopez', email: 'isabelcosslopez@gmail.com', createdAt: '2025-02-13' },
  { name: 'Juyoung Bang', email: 'jyb0658@gmail.com', createdAt: '2025-02-13' },
  { name: 'Grace Oh', email: 'graceoh11@gmail.com', createdAt: '2025-02-13' },
  { name: 'Rejoice Shim', email: 'jlmilj@gmail.com', createdAt: '2025-02-13' },
  { name: 'Terrence Lopez', email: 'tlopez5m@gmail.com', createdAt: '2025-02-13' },
  { name: 'Mari Lopez', email: 'mari.lopez.y@gmail.com', createdAt: '2025-02-13' },
  { name: 'Blessing Cho', email: 'ydchocpa@yahoo.com', createdAt: '2025-02-13' },
  { name: 'Alejandro Tapia', email: 'alex.tapia.godinez@gmail.com', createdAt: '2025-02-14' },
  { name: 'Joanna Yoon', email: 'joannakyoon@gmail.com', createdAt: '2025-02-14' },
  { name: 'David Cho', email: 'ydchocpa14@gmail.com', createdAt: '2025-02-14' },
  { name: 'John Choi', email: 'chjohn9610@msn.com', createdAt: '2025-02-15' },
  { name: 'Anthony Mancini', email: 'anthonymancini.sped@gmail.com', createdAt: '2025-02-15' },
  { name: 'Jorge Lau', email: 'jorgea.laujr@gmail.com', createdAt: '2025-02-15' },
  { name: 'Isaiah Pulido', email: 'waytruthlifeinchrist@gmail.com', createdAt: '2025-02-16' },
  { name: 'Sarah Hyemi Segale', email: 'joygracepeacelove@gmail.com', createdAt: '2025-02-16' },
  { name: 'Denise Peralta', email: 'peraltadenise97@gmail.com', createdAt: '2025-02-16' },
  { name: 'Mike Long', email: 'bengi85@gmail.com', createdAt: '2025-02-16' },
  { name: 'Victoria Bae', email: 'seunghoebr@gmail.com', createdAt: '2025-02-17' },
  { name: 'Joshua Lopez', email: 'joshua.lopez.g@gmail.com', createdAt: '2025-02-18' },
  { name: 'Anna Park', email: 'annapark328@gmail.com', createdAt: '2025-02-18' },
  { name: 'Vicki Yu', email: 'vctr37@gmail.com', createdAt: '2025-02-18' },
  { name: 'Miriam Fishman', email: 'fishmanmh@gmail.com', createdAt: '2025-02-18' },
  { name: 'Augustine Kim', email: 'logoslifelove@gmail.com', createdAt: '2025-02-20' },
  { name: 'Pauline Jang', email: 'jeongjang529@gmail.com', createdAt: '2025-02-24' },
  { name: 'Joseph Lopez', email: 'joseph.seiji.lopez@gmail.com', createdAt: '2025-03-01' },
  { name: 'Daniel Tuikhang', email: 'danieltkoren@gmail.com', createdAt: '2025-03-04' },
  { name: 'Banseok Kim', email: 'kbspt88@googlemail.com', createdAt: '2025-03-14' },
  { name: 'Jinmi Chung', email: 'trulychung@gmail.com', createdAt: '2025-06-03' },
  { name: 'Maria Kwon', email: 'mariakwon121@gmail.com', createdAt: '2025-06-03' },
  { name: 'John Kwon', email: 'johnkwon121@gmail.com', createdAt: '2025-06-07' },
  { name: 'David Cho', email: 'laubf2020@gmail.com', createdAt: '2025-06-07' },
  { name: 'Petra Kim', email: 'kim.petra@gmail.com', createdAt: '2025-06-21' },
  { name: 'Dongsuk Jo', email: 'greendong@me.com', createdAt: '2025-08-05' },
  { name: 'Alexis Estrada', email: 'alexis.estrada2319@yahoo.com', createdAt: '2025-09-15' },
  { name: 'David Brad Lim', email: 'david.lim@berkeley.edu', createdAt: '2025-12-04' },
  { name: 'Christie Brooks', email: 'christiebrooks94@gmail.com', createdAt: '2026-01-21' },
  { name: 'Adabelle Rodriguez', email: 'bellarodriguez9996@gmail.com', createdAt: '2025-07-21' },
]

// Email-list-only contacts (not in users table) — merged from email_list
const emailListOnly: { name: string; email: string }[] = [
  { name: 'Niklas Holman', email: 'samiahalwani@msn.com' },
  { name: 'Andrew Lopez', email: 'andrew.lopez.shuji@gmail.com' },
  { name: 'Andrew Medina', email: 'andrewom13579@gmail.com' },
  { name: 'Andrew Park', email: 'ypark1@gmail.com' },
  { name: 'Anthony Mancini', email: 'dalandser562@gmail.com' }, // different email from users table
  { name: 'Chamnan Tourn', email: 'chamnan.im2012@gmail.com' },
  { name: 'Daniel Park', email: 'parkdaniel2026@gmail.com' },
  { name: 'Daniel Tourn', email: 'tourn3k@gmail.com' },
  { name: 'Delilah Long', email: 'skyemom2004@hotmail.com' },
  { name: 'Edward Yu', email: 'heemangyu@gmail.com' },
  { name: 'Elijah Fishman', email: 'fishmanelijah@gmail.com' },
  { name: 'Elizabeth Cho', email: 'choelizabeth145@gmail.com' },
  { name: 'Ellie Lim', email: 'yookim93@gmail.com' },
  { name: 'Evangeline Park', email: 'evascarlet123@gmail.com' },
  { name: 'Ezra Koch', email: 'ezk999@gmail.com' },
  { name: 'Ezra Shim', email: 'ezra.shim@icloud.com' },
  { name: 'Faith Park', email: 'eunsook797@gmail.com' },
  { name: 'Frank Holman', email: 'franklin.holman@gmail.com' },
  { name: 'Gideon Han', email: 'gideonhan7@gmail.com' },
  { name: 'Hannah Park', email: 'parkhannah127@gmail.com' },
  { name: 'Isaac Kim', email: 'hdk121@gmail.com' },
  { name: 'Isaac Segale', email: 'joygracepeacelove@gmail.com' }, // same email as Sarah Hyemi Segale — skip
  { name: 'Isabel Park', email: 'isabelpark182@gmail.com' },
  { name: 'Jeremy Park', email: 'jpark3311@gmail.com' },
  { name: 'Joanne Yu', email: 'yujoanne321@gmail.com' },
  { name: 'Joey Fishman', email: 'fishformen123@gmail.com' },
  { name: 'John Park', email: 'jparkjr7@gmail.com' },
  { name: 'Joshua Han', email: 'jhan85056@gmail.com' },
  { name: 'Livingston Jang', email: 'livinjg079@gmail.com' },
  { name: 'Madison Uy', email: 'madisonkayuy@gmail.com' },
  { name: 'Maggie Wong', email: 'wongmaggiemeikee@gmail.com' },
  { name: 'Marilyn Kim', email: 'kim.marilyn417@gmail.com' },
  { name: 'Moses Han', email: 'moseshan1968@gmail.com' },
  { name: 'Moses Lim', email: 'molim37@gmail.com' },
  { name: 'Nathan Pozo', email: 'pozo.nathan@gmail.com' },
  { name: 'Paul Lim', email: 'lseu8@cs.com' },
  { name: 'Samuel Jang', email: 'ssamj5913@gmail.com' },
  { name: 'Sarah Park', email: 'sarahaku@gmail.com' },
  { name: 'Taylor Park', email: 'ptwp5p@gmail.com' },
]

// Build a set of all emails we'll insert (for de-duplication)
const seenEmails = new Set<string>()
const allPeople: { firstName: string; lastName: string; email: string; slug: string; source: string; createdAt?: Date }[] = []

// Process legacy users first (higher priority)
for (const u of legacyUsers) {
  const emailLower = u.email.toLowerCase()
  if (seenEmails.has(emailLower)) continue
  seenEmails.add(emailLower)

  const { firstName, lastName } = parseName(u.name)
  const personSlug = slugify(u.name)

  allPeople.push({
    firstName: titleCase(firstName),
    lastName: titleCase(lastName),
    email: u.email,
    slug: personSlug,
    source: 'Legacy user account',
    createdAt: u.createdAt ? new Date(u.createdAt + 'T00:00:00Z') : undefined,
  })
}

// Process email-list-only contacts
for (const e of emailListOnly) {
  const emailLower = e.email.toLowerCase()
  if (seenEmails.has(emailLower)) continue
  seenEmails.add(emailLower)

  const { firstName, lastName } = parseName(e.name)
  const personSlug = slugify(e.name)

  allPeople.push({
    firstName: titleCase(firstName),
    lastName: titleCase(lastName),
    email: e.email,
    slug: personSlug,
    source: 'Legacy email list',
  })
}

console.log(`  ${allPeople.length} unique people to import`)

// Track existing slugs to handle collisions
let created = 0
let updated = 0
let skipped = 0

for (const p of allPeople) {
  // Check if a person with this slug already exists
  const existing = await prisma.person.findUnique({
    where: { churchId_slug: { churchId, slug: p.slug } },
    select: { id: true, email: true, source: true },
  })

  if (existing) {
    // Update email if the existing record doesn't have one
    if (existing.email === null && p.email) {
      await prisma.person.update({
        where: { id: existing.id },
        data: { email: p.email },
      })
      updated++
    } else {
      // If same slug but different email, might be a different person — try with suffix
      if (existing.email && existing.email.toLowerCase() !== p.email.toLowerCase()) {
        // Check if person with this email already exists anywhere
        const byEmail = await prisma.person.findFirst({
          where: { churchId, email: { equals: p.email, mode: 'insensitive' } },
          select: { id: true },
        })
        if (byEmail) {
          skipped++
          continue
        }

        // Different person, same name — use email-based slug
        let altSlug = p.slug + '-2'
        let counter = 2
        while (true) {
          const collision = await prisma.person.findUnique({
            where: { churchId_slug: { churchId, slug: altSlug } },
            select: { id: true },
          })
          if (collision === null) break
          counter++
          altSlug = p.slug + '-' + counter
        }

        await prisma.person.create({
          data: {
            churchId,
            slug: altSlug,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            membershipStatus: 'MEMBER',
            source: p.source,
            createdAt: p.createdAt,
          },
        })
        created++
      } else {
        skipped++
      }
    }
  } else {
    // Check if person with this email already exists (different slug)
    const byEmail = await prisma.person.findFirst({
      where: { churchId, email: { equals: p.email, mode: 'insensitive' } },
      select: { id: true },
    })
    if (byEmail) {
      skipped++
      continue
    }

    await prisma.person.create({
      data: {
        churchId,
        slug: p.slug,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        membershipStatus: 'MEMBER',
        source: p.source,
        createdAt: p.createdAt,
      },
    })
    created++
  }
}

console.log(`  Created: ${created}, Updated: ${updated}, Skipped (duplicates): ${skipped}`)

// ── Final count ─────────────────────────────────────────────
const totalPeople = await prisma.person.count({ where: { churchId } })
console.log(`\n✅ Import complete. Total people in database: ${totalPeople}`)

await prisma.$disconnect()
await pool.end()
