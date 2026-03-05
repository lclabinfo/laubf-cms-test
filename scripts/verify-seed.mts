import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const { PrismaClient } = await import('../lib/generated/prisma/client.ts')
const prisma = new PrismaClient({ adapter })

const [msgs, studies, atts, speakers, series, msgSeries, linked, withLegacy, withYT] = await Promise.all([
  prisma.message.count(),
  prisma.bibleStudy.count(),
  prisma.bibleStudyAttachment.count(),
  prisma.speaker.count(),
  prisma.series.count(),
  prisma.messageSeries.count(),
  prisma.message.count({ where: { relatedStudyId: { not: null } } }),
  prisma.message.count({ where: { legacyId: { not: null } } }),
  prisma.message.count({ where: { youtubeId: { not: null } } }),
])

console.log('=== Seed Verification ===')
console.log(`Messages:           ${msgs}`)
console.log(`Bible Studies:      ${studies}`)
console.log(`Attachments:        ${atts}`)
console.log(`Speakers:           ${speakers}`)
console.log(`Series:             ${series}`)
console.log(`MessageSeries:      ${msgSeries}`)
console.log(`Linked to study:    ${linked}`)
console.log(`With legacyId:      ${withLegacy}`)
console.log(`With YouTube ID:    ${withYT}`)

// Sample linked message
const sample = await prisma.message.findFirst({
  where: { relatedStudyId: { not: null } },
  select: { title: true, legacyId: true, slug: true, speaker: { select: { name: true } }, relatedStudy: { select: { title: true, legacyId: true } } },
})
if (sample) {
  console.log('\nSample linked message:')
  console.log(`  Message: "${sample.title}" (legacy ${sample.legacyId}) by ${sample.speaker?.name}`)
  console.log(`  Study:   "${sample.relatedStudy?.title}" (legacy ${sample.relatedStudy?.legacyId})`)
}

await pool.end()
