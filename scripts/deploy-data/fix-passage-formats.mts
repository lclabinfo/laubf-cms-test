/**
 * Fix passage format issues in Message and BibleStudy tables.
 *
 * Problems fixed:
 *   1. Missing space in numbered books: "1Kings 3:1" → "1 Kings 3:1"
 *   2. "Psalm" → "Psalms" (canonical name)
 *   3. "Hebrew" → "Hebrews" (canonical name)
 *   4. Trailing period: "1Samuel." → "1 Samuel"
 *   5. Double-space: "John  3:1" → "John 3:1"
 *   6. Hard-delete stale soft-deleted entries (deletedAt > 1 day old)
 *
 * NOT fixed (requires manual review or future parser support):
 *   - Cross-chapter spans (e.g. "Jonah 1:1-4:26", "2 Timothy 3:1-10-4:8")
 *     These will be handled when the parser supports Ch:V-Ch:V format.
 *
 * Cross-chapter spans (e.g. "1 Kings 8:1-9:28") are preserved as-is since
 * they are valid passages — just not yet supported by the parser.
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 *
 * Usage: npx tsx scripts/deploy-data/fix-passage-formats.mts
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

// Replacements: [regex pattern, replacement]
// Order matters — numbered books first (most specific), then partials
const REPLACEMENTS: [RegExp, string][] = [
  // Numbered books missing space: "1Kings" → "1 Kings", "2Corinthians" → "2 Corinthians", etc.
  [/^1Chronicles\b/, '1 Chronicles'],
  [/^2Chronicles\b/, '2 Chronicles'],
  [/^1Corinthians\b/, '1 Corinthians'],
  [/^2Corinthians\b/, '2 Corinthians'],
  [/^1John\b/, '1 John'],
  [/^2John\b/, '2 John'],
  [/^3John\b/, '3 John'],
  [/^1Kings\b/, '1 Kings'],
  [/^2Kings\b/, '2 Kings'],
  [/^1Peter\b/, '1 Peter'],
  [/^2Peter\b/, '2 Peter'],
  [/^1Samuel\.?\b/, '1 Samuel'],
  [/^2Samuel\b/, '2 Samuel'],
  [/^1Thessalonians\b/, '1 Thessalonians'],
  [/^2Thessalonians\b/, '2 Thessalonians'],
  [/^1Timothy\b/, '1 Timothy'],
  [/^2Timothy\b/, '2 Timothy'],
  // Trailing period on already-spaced numbered books: "1 Samuel." → "1 Samuel"
  [/^(1 Samuel)\.\s/, '1 Samuel '],
  // Partial names
  [/^Hebrew\s/, 'Hebrews '],
  [/^Psalm\s/, 'Psalms '],
]

function fixPassage(passage: string): string | null {
  let fixed = passage

  // Collapse double spaces: "John  3:1" → "John 3:1"
  if (/\s{2,}/.test(fixed)) {
    fixed = fixed.replace(/\s{2,}/g, ' ')
  }

  // Apply regex replacements
  for (const [pattern, replacement] of REPLACEMENTS) {
    if (pattern.test(fixed)) {
      fixed = fixed.replace(pattern, replacement)
      break // Only one replacement per passage
    }
  }

  return fixed !== passage ? fixed : null
}

async function fixTable(tableName: string) {
  const client = await pool.connect()
  try {
    const { rows } = await client.query(
      `SELECT id, passage FROM "${tableName}" WHERE passage IS NOT NULL AND passage != ''`
    )

    let updated = 0
    const changes: { id: string; old: string; new: string }[] = []

    for (const row of rows) {
      const fixed = fixPassage(row.passage)
      if (fixed) {
        changes.push({ id: row.id, old: row.passage, new: fixed })
      }
    }

    if (changes.length === 0) {
      console.log(`  ${tableName}: No passages need fixing`)
      return
    }

    // Apply in a transaction
    await client.query('BEGIN')
    for (const change of changes) {
      await client.query(
        `UPDATE "${tableName}" SET passage = $1 WHERE id = $2`,
        [change.new, change.id]
      )
      updated++
    }
    await client.query('COMMIT')

    console.log(`  ${tableName}: Fixed ${updated} passages`)
    // Show sample changes
    const samples = changes.slice(0, 10)
    for (const s of samples) {
      console.log(`    "${s.old}" → "${s.new}"`)
    }
    if (changes.length > 10) {
      console.log(`    ... and ${changes.length - 10} more`)
    }
  } finally {
    client.release()
  }
}

async function main() {
  console.log('Fixing passage formats...\n')

  // Dry run first — show what would change
  const client = await pool.connect()
  try {
    for (const table of ['Message', 'BibleStudy']) {
      const { rows } = await client.query(
        `SELECT passage, count(*) as cnt FROM "${table}" WHERE passage IS NOT NULL AND passage != '' GROUP BY passage ORDER BY passage`
      )

      let needsFix = 0
      for (const row of rows) {
        if (fixPassage(row.passage)) {
          needsFix += parseInt(row.cnt)
        }
      }
      console.log(`${table}: ${needsFix} passages need fixing (out of ${rows.length} unique)`)
    }
  } finally {
    client.release()
  }

  console.log('')

  // Apply fixes
  await fixTable('Message')
  await fixTable('BibleStudy')

  // Hard-delete stale soft-deleted entries (older than 1 day)
  console.log('\nPurging stale soft-deleted entries...')
  await purgeStaleDeleted()

  console.log('\nDone!')
  await pool.end()
}

async function purgeStaleDeleted() {
  const client = await pool.connect()
  try {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago

    for (const table of ['BibleStudy', 'Message']) {
      // Count first
      const { rows: countRows } = await client.query(
        `SELECT count(*) as cnt FROM "${table}" WHERE "deletedAt" IS NOT NULL AND "deletedAt" < $1`,
        [threshold]
      )
      const count = parseInt(countRows[0].cnt)

      if (count === 0) {
        console.log(`  ${table}: No stale entries to purge`)
        continue
      }

      // Show what will be deleted
      const { rows: samples } = await client.query(
        `SELECT title, "deletedAt"::date as deleted FROM "${table}" WHERE "deletedAt" IS NOT NULL AND "deletedAt" < $1 ORDER BY "deletedAt" DESC LIMIT 5`,
        [threshold]
      )
      for (const s of samples) {
        console.log(`    ${s.deleted} | ${s.title}`)
      }
      if (count > 5) console.log(`    ... and ${count - 5} more`)

      // Hard delete (BibleStudy first since Message may reference it)
      const { rowCount } = await client.query(
        `DELETE FROM "${table}" WHERE "deletedAt" IS NOT NULL AND "deletedAt" < $1`,
        [threshold]
      )
      console.log(`  ${table}: Purged ${rowCount} stale entries`)
    }
  } finally {
    client.release()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
