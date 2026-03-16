/**
 * Deploy script: verify speaker→person migration is clean.
 *
 * Run AFTER `npx prisma migrate deploy`:
 *   npx tsx scripts/deploy-speaker-to-person.mts
 *
 * Safe to run multiple times (idempotent).
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
  console.log('=== Speaker → Person Deploy Verification ===\n')

  // 1. Verify no orphaned speakerIds
  const orphanedMessages = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "Message"
    WHERE "speakerId" IS NOT NULL AND "deletedAt" IS NULL
    AND "speakerId" NOT IN (SELECT id FROM "Person")
  `
  const orphanedStudies = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM "BibleStudy"
    WHERE "speakerId" IS NOT NULL AND "deletedAt" IS NULL
    AND "speakerId" NOT IN (SELECT id FROM "Person")
  `
  const msgOrphans = Number(orphanedMessages[0].count)
  const studyOrphans = Number(orphanedStudies[0].count)

  if (msgOrphans > 0 || studyOrphans > 0) {
    console.log(`⚠ Found orphaned speakerIds: ${msgOrphans} messages, ${studyOrphans} studies`)
    console.log('  Nulling orphaned references...')
    await prisma.$executeRaw`UPDATE "Message" SET "speakerId" = NULL WHERE "speakerId" IS NOT NULL AND "speakerId" NOT IN (SELECT id FROM "Person")`
    await prisma.$executeRaw`UPDATE "BibleStudy" SET "speakerId" = NULL WHERE "speakerId" IS NOT NULL AND "speakerId" NOT IN (SELECT id FROM "Person")`
    console.log('  ✓ Orphaned references cleared')
  } else {
    console.log('✓ No orphaned speakerIds found')
  }

  // 2. Report counts
  const totalMessages = await prisma.message.count({ where: { deletedAt: null } })
  const withSpeaker = await prisma.message.count({ where: { deletedAt: null, speakerId: { not: null } } })
  console.log(`\n  Messages: ${withSpeaker}/${totalMessages} have a messenger assigned`)

  const totalStudies = await prisma.bibleStudy.count({ where: { deletedAt: null } })
  const studiesWithSpeaker = await prisma.bibleStudy.count({ where: { deletedAt: null, speakerId: { not: null } } })
  console.log(`  Bible Studies: ${studiesWithSpeaker}/${totalStudies} have a messenger assigned`)

  // 3. Verify Speaker table is dropped
  const tableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = 'Speaker'
    )
  `
  if (tableExists[0].exists) {
    console.log('\n⚠ Legacy Speaker table still exists — drop it via migration')
  } else {
    console.log('\n✓ Legacy Speaker table has been dropped')
  }

  console.log('\n=== Deploy Complete ===')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
