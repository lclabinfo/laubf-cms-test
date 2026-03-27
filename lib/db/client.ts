import { PrismaClient } from '@/lib/generated/prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
  })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Global omit: exclude heavy text/JSON fields from all queries by default.
    // Detail/write queries opt back in with `omit: { fieldName: false }`.
    // Prevents accidental over-fetching and avoids PostgreSQL TOAST reads on list pages.
    omit: {
      message: { rawTranscript: true, liveTranscript: true, transcriptSegments: true, studySections: true },
      bibleStudy: { questions: true, answers: true, transcript: true, bibleText: true, keyVerseText: true },
      event: { locationInstructions: true, welcomeMessage: true },
      siteSettings: { customHeadHtml: true, customBodyHtml: true },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
