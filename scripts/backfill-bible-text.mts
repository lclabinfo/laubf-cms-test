/**
 * Backfill bibleText for BibleStudy records that have a passage but no bibleText.
 * Populates ESV text from the local BibleVerse table.
 *
 * Usage: npx tsx scripts/backfill-bible-text.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client')
const prisma = new mod.PrismaClient({ adapter })

// Re-implement parseBookFromPassage to avoid Next.js import issues
import type { BibleBook } from '../lib/generated/prisma/client.ts'

const BOOK_PATTERNS: [RegExp, BibleBook][] = [
  [/^1\s*samuel/i, 'FIRST_SAMUEL'], [/^2\s*samuel/i, 'SECOND_SAMUEL'],
  [/^1\s*kings/i, 'FIRST_KINGS'], [/^2\s*kings/i, 'SECOND_KINGS'],
  [/^1\s*chronicles/i, 'FIRST_CHRONICLES'], [/^2\s*chronicles/i, 'SECOND_CHRONICLES'],
  [/^1\s*corinthians/i, 'FIRST_CORINTHIANS'], [/^2\s*corinthians/i, 'SECOND_CORINTHIANS'],
  [/^1\s*thessalonians/i, 'FIRST_THESSALONIANS'], [/^2\s*thessalonians/i, 'SECOND_THESSALONIANS'],
  [/^1\s*timothy/i, 'FIRST_TIMOTHY'], [/^2\s*timothy/i, 'SECOND_TIMOTHY'],
  [/^1\s*peter/i, 'FIRST_PETER'], [/^2\s*peter/i, 'SECOND_PETER'],
  [/^1\s*john/i, 'FIRST_JOHN'], [/^2\s*john/i, 'SECOND_JOHN'],
  [/^3\s*john/i, 'THIRD_JOHN'],
  [/^song\s*(of\s*solomon|of\s*songs)/i, 'SONG_OF_SOLOMON'],
  [/^genesis/i, 'GENESIS'], [/^exodus/i, 'EXODUS'], [/^leviticus/i, 'LEVITICUS'],
  [/^numbers/i, 'NUMBERS'], [/^deuteronomy/i, 'DEUTERONOMY'], [/^joshua/i, 'JOSHUA'],
  [/^judges/i, 'JUDGES'], [/^ruth/i, 'RUTH'], [/^ezra/i, 'EZRA'],
  [/^nehemiah/i, 'NEHEMIAH'], [/^esther/i, 'ESTHER'], [/^job/i, 'JOB'],
  [/^psalm/i, 'PSALMS'], [/^proverb/i, 'PROVERBS'], [/^ecclesiastes/i, 'ECCLESIASTES'],
  [/^isaiah/i, 'ISAIAH'], [/^jeremiah/i, 'JEREMIAH'], [/^lamentations/i, 'LAMENTATIONS'],
  [/^ezekiel/i, 'EZEKIEL'], [/^daniel/i, 'DANIEL'], [/^hosea/i, 'HOSEA'],
  [/^joel/i, 'JOEL'], [/^amos/i, 'AMOS'], [/^obadiah/i, 'OBADIAH'],
  [/^jonah/i, 'JONAH'], [/^micah/i, 'MICAH'], [/^nahum/i, 'NAHUM'],
  [/^habakkuk/i, 'HABAKKUK'], [/^zephaniah/i, 'ZEPHANIAH'], [/^haggai/i, 'HAGGAI'],
  [/^zechariah/i, 'ZECHARIAH'], [/^malachi/i, 'MALACHI'],
  [/^matthew/i, 'MATTHEW'], [/^mark/i, 'MARK'], [/^luke/i, 'LUKE'], [/^john/i, 'JOHN'],
  [/^acts/i, 'ACTS'], [/^romans/i, 'ROMANS'],
  [/^galatians/i, 'GALATIANS'], [/^ephesians/i, 'EPHESIANS'],
  [/^philippians/i, 'PHILIPPIANS'], [/^colossians/i, 'COLOSSIANS'],
  [/^titus/i, 'TITUS'], [/^philemon/i, 'PHILEMON'], [/^hebrews/i, 'HEBREWS'],
  [/^james/i, 'JAMES'], [/^jude/i, 'JUDE'], [/^revelation/i, 'REVELATION'],
]

function parseBookFromPassage(passage: string): BibleBook | null {
  const trimmed = passage.trim()
  for (const [pattern, book] of BOOK_PATTERNS) {
    if (pattern.test(trimmed)) return book
  }
  return null
}

function parsePassage(passage: string) {
  const trimmed = passage.trim()
  if (!trimmed) return null
  const book = parseBookFromPassage(trimmed)
  if (!book) return null

  const m = trimmed.match(/(\d+)\s*[:]\s*(\d+)\s*[-~]\s*(\d+)/)
    || trimmed.match(/(\d+)\s*[:]\s*(\d+)/)
    || trimmed.match(/(\d+)\s*$/)
  if (!m) return null

  if (m[3]) return { book, chapter: parseInt(m[1]), startVerse: parseInt(m[2]), endVerse: parseInt(m[3]) }
  if (m[2]) return { book, chapter: parseInt(m[1]), startVerse: parseInt(m[2]), endVerse: parseInt(m[2]) }
  return { book, chapter: parseInt(m[1]), startVerse: undefined, endVerse: undefined }
}

async function main() {
  const studies = await prisma.bibleStudy.findMany({
    where: { bibleText: null, NOT: { passage: '' } },
    select: { id: true, passage: true },
  })

  console.log(`Found ${studies.length} studies missing bibleText`)

  let updated = 0
  let failed = 0

  for (const study of studies) {
    const parsed = parsePassage(study.passage)
    if (!parsed) {
      failed++
      continue
    }

    const where: any = { version: 'ESV', book: parsed.book, chapter: parsed.chapter }
    if (parsed.startVerse != null && parsed.endVerse != null) {
      where.verse = { gte: parsed.startVerse, lte: parsed.endVerse }
    }

    const verses = await prisma.bibleVerse.findMany({ where, orderBy: { verse: 'asc' } })
    if (verses.length === 0) {
      failed++
      continue
    }

    // Build HTML with paragraph grouping
    const paragraphs: string[][] = [[]]
    for (let i = 0; i < verses.length; i++) {
      const v = verses[i]
      paragraphs[paragraphs.length - 1].push(`<sup>${v.verse}</sup> ${v.text.trim()}`)
      const trimmed = v.text.trim()
      const endsWithQuote = /[\u201d\u2019'"]$/.test(trimmed)
      if (i < verses.length - 1 && (endsWithQuote || paragraphs[paragraphs.length - 1].length >= 5)) {
        paragraphs.push([])
      }
    }

    const html = paragraphs
      .filter(p => p.length > 0)
      .map(p => `<p>${p.join(' ')}</p>`)
      .join('\n')

    await prisma.bibleStudy.update({ where: { id: study.id }, data: { bibleText: html } })
    updated++

    if (updated % 200 === 0) {
      console.log(`  Updated ${updated}/${studies.length}...`)
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed/skipped`)
  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => { console.error(err); process.exit(1) })
