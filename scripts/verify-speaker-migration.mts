/**
 * Verify speaker migration: check that all Message/BibleStudy speakerIds
 * now point to valid Person records, and report any orphaned or missing data.
 *
 * Run: npx tsx scripts/verify-speaker-migration.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client.ts')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('=== Speaker Migration Verification ===\n')

  const totalMessages = await prisma.message.count({ where: { deletedAt: null } })
  const messagesWithSpeaker = await prisma.message.count({ where: { deletedAt: null, speakerId: { not: null } } })
  const messagesWithoutSpeaker = totalMessages - messagesWithSpeaker

  console.log(`Messages: ${totalMessages} total, ${messagesWithSpeaker} with messenger, ${messagesWithoutSpeaker} without`)

  // Check for orphaned speakerIds
  const orphanedMessages = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "Message"
    WHERE "speakerId" IS NOT NULL
    AND "deletedAt" IS NULL
    AND "speakerId" NOT IN (SELECT id FROM "Person")
  `
  console.log(`Orphaned message speakerIds (no matching Person): ${orphanedMessages[0].count}`)

  const totalStudies = await prisma.bibleStudy.count({ where: { deletedAt: null } })
  const studiesWithSpeaker = await prisma.bibleStudy.count({ where: { deletedAt: null, speakerId: { not: null } } })
  const orphanedStudies = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "BibleStudy"
    WHERE "speakerId" IS NOT NULL
    AND "deletedAt" IS NULL
    AND "speakerId" NOT IN (SELECT id FROM "Person")
  `
  console.log(`Bible Studies: ${totalStudies} total, ${studiesWithSpeaker} with messenger, ${totalStudies - studiesWithSpeaker} without`)
  console.log(`Orphaned study speakerIds: ${orphanedStudies[0].count}`)

  // Person message counts (top 20)
  console.log('\n=== Person Message Counts (Top 20) ===')
  const personCounts = await prisma.person.findMany({
    where: { deletedAt: null },
    select: {
      firstName: true, lastName: true, preferredName: true,
      _count: { select: { messages: true } },
    },
    orderBy: { messages: { _count: 'desc' } },
    take: 20,
  })

  for (const p of personCounts) {
    if (p._count.messages > 0) {
      const name = p.preferredName ? `${p.preferredName} ${p.lastName}` : `${p.firstName} ${p.lastName}`
      console.log(`  ${name}: ${p._count.messages} messages`)
    }
  }

  // Check Speaker table
  const speakerCount = await prisma.speaker.count()
  console.log(`\nLegacy Speaker table: ${speakerCount} records`)

  // Messages without speaker
  if (messagesWithoutSpeaker > 0) {
    console.log(`\n=== Messages Without Messenger (first 20) ===`)
    const noSpeaker = await prisma.message.findMany({
      where: { deletedAt: null, speakerId: null },
      select: { slug: true, title: true, dateFor: true },
      orderBy: { dateFor: 'desc' },
      take: 20,
    })
    for (const m of noSpeaker) {
      const date = m.dateFor instanceof Date ? m.dateFor.toISOString().split('T')[0] : String(m.dateFor)
      console.log(`  [${date}] ${m.title} (${m.slug})`)
    }
  }

  console.log('\n=== Verification Complete ===')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
