/**
 * Import bible_nword data from legacy MySQL dump into BibleVerse table.
 * Imports 11 translations (~342K rows): 7 English, 3 Korean, 1 Spanish.
 *
 * Usage: npx tsx scripts/import-bible-text.mts
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const mod = await import('../lib/generated/prisma/client')
const PrismaClient = mod.PrismaClient
const prisma = new PrismaClient({ adapter })

// ── Book number (101-166) → BibleBook enum ──────────────────────────
const BNUM_TO_BOOK: Record<number, string> = {
  101: 'GENESIS', 102: 'EXODUS', 103: 'LEVITICUS', 104: 'NUMBERS',
  105: 'DEUTERONOMY', 106: 'JOSHUA', 107: 'JUDGES', 108: 'RUTH',
  109: 'FIRST_SAMUEL', 110: 'SECOND_SAMUEL', 111: 'FIRST_KINGS',
  112: 'SECOND_KINGS', 113: 'FIRST_CHRONICLES', 114: 'SECOND_CHRONICLES',
  115: 'EZRA', 116: 'NEHEMIAH', 117: 'ESTHER', 118: 'JOB',
  119: 'PSALMS', 120: 'PROVERBS', 121: 'ECCLESIASTES',
  122: 'SONG_OF_SOLOMON', 123: 'ISAIAH', 124: 'JEREMIAH',
  125: 'LAMENTATIONS', 126: 'EZEKIEL', 127: 'DANIEL', 128: 'HOSEA',
  129: 'JOEL', 130: 'AMOS', 131: 'OBADIAH', 132: 'JONAH',
  133: 'MICAH', 134: 'NAHUM', 135: 'HABAKKUK', 136: 'ZEPHANIAH',
  137: 'HAGGAI', 138: 'ZECHARIAH', 139: 'MALACHI',
  140: 'MATTHEW', 141: 'MARK', 142: 'LUKE', 143: 'JOHN',
  144: 'ACTS', 145: 'ROMANS', 146: 'FIRST_CORINTHIANS',
  147: 'SECOND_CORINTHIANS', 148: 'GALATIANS', 149: 'EPHESIANS',
  150: 'PHILIPPIANS', 151: 'COLOSSIANS', 152: 'FIRST_THESSALONIANS',
  153: 'SECOND_THESSALONIANS', 154: 'FIRST_TIMOTHY',
  155: 'SECOND_TIMOTHY', 156: 'TITUS', 157: 'PHILEMON',
  158: 'HEBREWS', 159: 'JAMES', 160: 'FIRST_PETER',
  161: 'SECOND_PETER', 162: 'FIRST_JOHN', 163: 'SECOND_JOHN',
  164: 'THIRD_JOHN', 165: 'JUDE', 166: 'REVELATION',
}

// Versions to import (skip NIV1 — duplicate of NIV 2011)
const IMPORT_VERSIONS = new Set([
  'ESV', 'NIV', 'KJV', 'NLT', 'NASB', 'AMP',
  'NIV(1984)',
  '개역개정', '새번역', '바른성경',
  'RVR1960',
])

// Normalize version labels for storage
function normalizeVersion(v: string): string {
  if (v === 'NIV(1984)') return 'NIV1984'
  return v
}

// ── Parse MySQL INSERT values ───────────────────────────────────────
// Each record: (id, b_num, b_version, chapter, verse, 'word', 'bversion', bversion_order, bver_order)
// The tricky part is the 'word' field which may contain escaped single quotes

interface BibleRow {
  book: string
  chapter: number
  verse: number
  text: string
  version: string
}

function parseInsertLine(line: string): BibleRow[] {
  const rows: BibleRow[] = []

  // Find VALUES portion
  const valuesIdx = line.indexOf('VALUES ')
  if (valuesIdx === -1) return rows
  const valuesStr = line.substring(valuesIdx + 7)

  // State machine to parse (field1,field2,...),(field1,...)
  let i = 0
  while (i < valuesStr.length) {
    // Find opening paren
    if (valuesStr[i] !== '(') { i++; continue }
    i++ // skip (

    const fields: string[] = []
    let fieldStart = i
    let inString = false
    let field = ''

    while (i < valuesStr.length) {
      const ch = valuesStr[i]

      if (inString) {
        if (ch === '\\' && i + 1 < valuesStr.length) {
          // Escaped character
          field += valuesStr[i + 1]
          i += 2
          continue
        }
        if (ch === "'" && i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
          // Escaped single quote ('')
          field += "'"
          i += 2
          continue
        }
        if (ch === "'") {
          inString = false
          i++
          continue
        }
        field += ch
        i++
      } else {
        if (ch === "'") {
          inString = true
          i++
          continue
        }
        if (ch === ',') {
          fields.push(field.trim())
          field = ''
          i++
          continue
        }
        if (ch === ')') {
          fields.push(field.trim())
          i++ // skip )
          break
        }
        field += ch
        i++
      }
    }

    // fields: [id, b_num, b_version, chapter, verse, word, bversion, bversion_order, bver_order]
    if (fields.length >= 7) {
      const bnum = parseInt(fields[1])
      const chapter = parseInt(fields[3])
      const verse = parseInt(fields[4])
      const word = fields[5]
      const bversion = fields[6]

      if (IMPORT_VERSIONS.has(bversion) && BNUM_TO_BOOK[bnum]) {
        rows.push({
          book: BNUM_TO_BOOK[bnum],
          chapter,
          verse,
          text: word.trim(),
          version: normalizeVersion(bversion),
        })
      }
    }
  }

  return rows
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('Reading bible_nword SQL dump...')
  const dumpPath = join(process.cwd(), '00_old_laubf_db_dump/laubf_bible_nword.sql')
  const content = readFileSync(dumpPath, 'utf-8')

  console.log('Parsing INSERT statements...')
  const lines = content.split('\n')
  const allRows: BibleRow[] = []

  for (const line of lines) {
    if (line.startsWith('INSERT INTO')) {
      const rows = parseInsertLine(line)
      allRows.push(...rows)
    }
  }

  console.log(`Parsed ${allRows.length} verses to import`)

  // Show version distribution
  const versionCounts: Record<string, number> = {}
  for (const row of allRows) {
    versionCounts[row.version] = (versionCounts[row.version] || 0) + 1
  }
  console.log('Version distribution:')
  for (const [v, count] of Object.entries(versionCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${v}: ${count}`)
  }

  // Check if data already exists
  const existing = await prisma.bibleVerse.count()
  if (existing > 0) {
    console.log(`BibleVerse table already has ${existing} rows. Skipping import.`)
    console.log('To reimport, truncate the table first: DELETE FROM bible_verses;')
    await prisma.$disconnect()
    await pool.end()
    return
  }

  // Batch insert
  const BATCH_SIZE = 5000
  let inserted = 0

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE)
    await prisma.bibleVerse.createMany({
      data: batch.map(r => ({
        book: r.book as any,
        chapter: r.chapter,
        verse: r.verse,
        text: r.text,
        version: r.version,
      })),
      skipDuplicates: true,
    })
    inserted += batch.length
    if (inserted % 50000 === 0 || inserted === allRows.length) {
      console.log(`  Inserted ${inserted}/${allRows.length} verses...`)
    }
  }

  // Verify
  const total = await prisma.bibleVerse.count()
  console.log(`\nDone! Total verses in database: ${total}`)

  // Spot check
  const gen1_1_esv = await prisma.bibleVerse.findFirst({
    where: { book: 'GENESIS' as any, chapter: 1, verse: 1, version: 'ESV' },
  })
  console.log(`\nSpot check — Genesis 1:1 ESV: "${gen1_1_esv?.text}"`)

  const john3_16_niv = await prisma.bibleVerse.findFirst({
    where: { book: 'JOHN' as any, chapter: 3, verse: 16, version: 'NIV' },
  })
  console.log(`Spot check — John 3:16 NIV: "${john3_16_niv?.text}"`)

  const gen1_1_kr = await prisma.bibleVerse.findFirst({
    where: { book: 'GENESIS' as any, chapter: 1, verse: 1, version: '개역개정' },
  })
  console.log(`Spot check — Genesis 1:1 개역개정: "${gen1_1_kr?.text}"`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
