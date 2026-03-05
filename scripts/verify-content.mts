import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const { PrismaClient } = await import('../lib/generated/prisma/client.ts')
const prisma = new PrismaClient({ adapter })

const withQ = await prisma.bibleStudy.count({ where: { hasQuestions: true } })
const withA = await prisma.bibleStudy.count({ where: { hasAnswers: true } })
const withT = await prisma.bibleStudy.count({ where: { hasTranscript: true } })
const total = await prisma.bibleStudy.count()

console.log('=== Bible Study Content Stats ===')
console.log(`Total: ${total}`)
console.log(`With questions: ${withQ}`)
console.log(`With answers: ${withA}`)
console.log(`With transcript: ${withT}`)

// Check the Speak Your Word entry
const sample = await prisma.bibleStudy.findFirst({
  where: { legacyId: 9317 },
  select: { title: true, passage: true, hasQuestions: true, hasAnswers: true, questions: true }
})
if (sample) {
  console.log(`\nSample: ${sample.title}`)
  console.log(`Passage: ${sample.passage}`)
  console.log(`hasQuestions: ${sample.hasQuestions}`)
  console.log(`hasAnswers: ${sample.hasAnswers}`)
  console.log(`Questions preview: ${sample.questions?.substring(0, 300)}`)
}

// Check a few more entries
const latest = await prisma.bibleStudy.findMany({
  orderBy: { dateFor: 'desc' },
  take: 5,
  select: { title: true, dateFor: true, hasQuestions: true, hasAnswers: true, hasTranscript: true }
})
console.log('\nLatest 5 entries:')
for (const e of latest) {
  console.log(`  ${e.dateFor.toISOString().slice(0,10)} | Q:${e.hasQuestions} A:${e.hasAnswers} T:${e.hasTranscript} | ${e.title}`)
}

await pool.end()
