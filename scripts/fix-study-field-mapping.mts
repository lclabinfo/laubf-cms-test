/**
 * Fix BibleStudy field mapping from legacy content extraction
 *
 * The original backfill-study-content.mts mapped file types INCORRECTLY:
 *   - N-suffix files (Study Notes) were stored in `transcript` — WRONG
 *   - M-suffix files (Message manuscripts) were skipped entirely — WRONG
 *   - Wednesday notes went to `answers` — CORRECT, but only if no N-suffix notes exist
 *
 * Correct mapping (based on the old LA UBF website):
 *   - Q suffix (Question sheets)    → BibleStudy.questions    ✅ was correct
 *   - N suffix (Study Notes)        → BibleStudy.answers      🔧 was in transcript
 *   - M suffix (Message manuscript) → BibleStudy.transcript   🔧 was skipped
 *   - Wednesday notes               → BibleStudy.answers      🔧 only if no N-suffix answers
 *
 * This script:
 * 1. Moves N-suffix content from `transcript` → `answers` (sets hasAnswers=true, hasTranscript=false)
 * 2. Fetches M-suffix HTML from laubf.org and stores in `transcript` (sets hasTranscript=true)
 * 3. Handles Wednesday notes: puts in `answers` only if study doesn't already have N-suffix answers
 *
 * Usage: npx tsx scripts/fix-study-field-mapping.mts [--dry-run] [--limit N]
 */
import 'dotenv/config'
import { readFileSync } from 'fs'
import { join } from 'path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client')
const prisma = new mod.PrismaClient({ adapter })

// ── CLI args ─────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 0
const DRY_RUN = args.includes('--dry-run')

console.log(`=== Fix Study Field Mapping ===`)
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
console.log(`Limit: ${LIMIT || 'none (all studies)'}`)

// ── Load legacy material data for Wednesday detection ─────────────────

console.log('\n--- Loading legacy material data for Wednesday detection ---')
const matContent = readFileSync(join(process.cwd(), '00_old_laubf_db_dump/laubf_laubfmaterial.sql'), 'utf-8')

// Parse the SQL to find Wednesday material IDs
// We need to properly parse the INSERT statements
interface LegacySlot {
  doctype: string | null
  filename: string | null
  fileurl: string | null
}

interface LegacyRecord {
  no: number
  mtype: string
  slots: LegacySlot[]
}

function parseSqlValues(line: string): string[][] {
  const valuesIdx = line.indexOf('VALUES ')
  if (valuesIdx === -1) return []
  const valuesStr = line.substring(valuesIdx + 7)

  const records: string[][] = []
  let i = 0

  while (i < valuesStr.length) {
    if (valuesStr[i] !== '(') { i++; continue }
    i++

    const fields: string[] = []
    let field = ''
    let inString = false

    while (i < valuesStr.length) {
      const ch = valuesStr[i]

      if (inString) {
        if (ch === '\\' && i + 1 < valuesStr.length) {
          field += valuesStr[i + 1]
          i += 2
          continue
        }
        if (ch === "'" && i + 1 < valuesStr.length && valuesStr[i + 1] === "'") {
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
        if (ch === "'") { inString = true; i++; continue }
        if (ch === ',') { fields.push(field.trim()); field = ''; i++; continue }
        if (ch === ')') { fields.push(field.trim()); i++; break }
        field += ch
        i++
      }
    }
    if (fields.length > 0) records.push(fields)
  }

  return records
}

function parseNull(v: string): string | null {
  if (v === 'NULL' || v === '' || v === "''") return null
  return v
}

function parseLegacyMaterials(content: string): Map<number, LegacyRecord> {
  const map = new Map<number, LegacyRecord>()
  for (const line of content.split('\n')) {
    if (line.indexOf('INSERT INTO') !== 0) continue
    for (const fields of parseSqlValues(line)) {
      if (fields.length < 22) continue
      const no = parseInt(fields[0])
      map.set(no, {
        no,
        mtype: fields[3] || '',
        slots: [
          { doctype: parseNull(fields[9]), filename: parseNull(fields[13]), fileurl: parseNull(fields[17]) },
          { doctype: parseNull(fields[10]), filename: parseNull(fields[14]), fileurl: parseNull(fields[18]) },
          { doctype: parseNull(fields[11]), filename: parseNull(fields[15]), fileurl: parseNull(fields[19]) },
          { doctype: parseNull(fields[12]), filename: parseNull(fields[16]), fileurl: parseNull(fields[20]) },
        ],
      })
    }
  }
  return map
}

const legacyMap = parseLegacyMaterials(matContent)
console.log(`  Loaded ${legacyMap.size} legacy material records`)

const wednesdayMaterialIds = new Set<number>()
for (const [no, rec] of legacyMap) {
  if (rec.mtype === 'Bible note from Wednesday group') {
    wednesdayMaterialIds.add(no)
  }
}
console.log(`  Found ${wednesdayMaterialIds.size} Wednesday material records`)

// ── HTML fetching utilities ──────────────────────────────────────────

const BASE_URL = 'https://laubf.org'

function toHtmlUrl(documentUrl: string): string {
  const htmlPath = documentUrl.replace(/\.(docx?|rtf|pdf)$/i, '.html')
  return `${BASE_URL}${htmlPath}`
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (laubf-cms content migration)',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (response.status !== 200) return null
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('application/xhtml')) {
      return await response.text()
    }
    const text = await response.text()
    if (text.includes('<') && (text.includes('<p') || text.includes('<body') || text.includes('<div') || text.includes('<blockquote'))) {
      return text
    }
    return null
  } catch {
    return null
  }
}

function extractBodyContent(html: string): string {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    return cleanHtml(bodyMatch[1])
  }
  if (html.match(/<!DOCTYPE|<html/i)) {
    let content = html
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
    return cleanHtml(content)
  }
  return cleanHtml(html)
}

function cleanHtml(html: string): string {
  let cleaned = html
    .replace(/\s+style="[^"]*"/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/<\/?o:[^>]*>/gi, '')
    .replace(/<\/?v:[^>]*>/gi, '')
    .replace(/<\/?st1:[^>]*>/gi, '')
    .replace(/<tag\s+src="[^"]*"\s*\/?>/gi, '')
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
    .replace(/<span>\s*<\/span>/gi, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()
  return cleaned
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Classify attachment by filename suffix ────────────────────────────

type SuffixType = 'Q' | 'N' | 'M' | 'other'

function getFilenameSuffix(filename: string): SuffixType {
  const basename = filename.replace(/\.(docx?|pdf|rtf|html)$/i, '')
  const lastChar = basename.charAt(basename.length - 1).toUpperCase()
  if (lastChar === 'Q') return 'Q'
  if (lastChar === 'N') return 'N'
  if (lastChar === 'M') return 'M'
  return 'other'
}

// ── BEFORE counts ────────────────────────────────────────────────────

async function getCounts() {
  const total = await prisma.bibleStudy.count()
  const withQ = await prisma.bibleStudy.count({ where: { questions: { not: null } } })
  const withT = await prisma.bibleStudy.count({ where: { transcript: { not: null } } })
  const withA = await prisma.bibleStudy.count({ where: { answers: { not: null } } })
  const hasQFlag = await prisma.bibleStudy.count({ where: { hasQuestions: true } })
  const hasTFlag = await prisma.bibleStudy.count({ where: { hasTranscript: true } })
  const hasAFlag = await prisma.bibleStudy.count({ where: { hasAnswers: true } })
  return { total, withQ, withT, withA, hasQFlag, hasTFlag, hasAFlag }
}

console.log('\n--- BEFORE State ---')
const before = await getCounts()
console.log(`  Total studies: ${before.total}`)
console.log(`  With questions: ${before.withQ} (flag: ${before.hasQFlag})`)
console.log(`  With transcript: ${before.withT} (flag: ${before.hasTFlag})`)
console.log(`  With answers: ${before.withA} (flag: ${before.hasAFlag})`)

// ── Load all attachments ─────────────────────────────────────────────

console.log('\n--- Loading attachments ---')
const allAttachments = await prisma.bibleStudyAttachment.findMany({
  where: { legacySourceId: { not: null } },
  select: { id: true, bibleStudyId: true, name: true, url: true, type: true, legacySourceId: true },
  orderBy: { createdAt: 'asc' },
})
console.log(`  Total attachments: ${allAttachments.length}`)

// Group attachments by study, categorized by suffix
interface StudyAttachments {
  Q: typeof allAttachments
  N: typeof allAttachments
  M: typeof allAttachments
  other: typeof allAttachments
  isWednesday: boolean
}

const studyAttMap = new Map<string, StudyAttachments>()

for (const att of allAttachments) {
  if (!studyAttMap.has(att.bibleStudyId)) {
    // Check if this study is a Wednesday study
    const isWed = att.legacySourceId ? wednesdayMaterialIds.has(att.legacySourceId) : false
    studyAttMap.set(att.bibleStudyId, { Q: [], N: [], M: [], other: [], isWednesday: isWed })
  }
  const group = studyAttMap.get(att.bibleStudyId)!
  // Also check Wednesday on subsequent attachments
  if (att.legacySourceId && wednesdayMaterialIds.has(att.legacySourceId)) {
    group.isWednesday = true
  }

  const suffix = getFilenameSuffix(att.name)
  group[suffix].push(att)
}

// ── PHASE 1: Move N-suffix content from transcript → answers ─────────

console.log('\n=== Phase 1: Move N-suffix transcript content to answers ===')

// Load all studies that have transcript content
const studiesWithTranscript = await prisma.bibleStudy.findMany({
  where: { transcript: { not: null } },
  select: { id: true, title: true, transcript: true, answers: true, hasTranscript: true, hasAnswers: true },
})

let movedCount = 0
let skippedAlreadyHasAnswers = 0
let skippedNoNSuffix = 0
let wednesdayMovedCount = 0

for (const study of studiesWithTranscript) {
  if (LIMIT && movedCount >= LIMIT) break

  const atts = studyAttMap.get(study.id)
  if (!atts) {
    skippedNoNSuffix++
    continue
  }

  const hasNSuffix = atts.N.length > 0
  const hasMSuffix = atts.M.length > 0

  if (!hasNSuffix) {
    // This transcript might be from a legacy doctype fallback (e.g., "Note" type)
    // or from filename pattern matching. We should still check if it was meant to be notes.
    // But for safety, we only move content we can confirm came from N-suffix files.
    skippedNoNSuffix++
    continue
  }

  // This study's transcript was populated from an N-suffix file → move to answers
  if (study.answers && study.answers.length > 10) {
    // Study already has answers content, don't overwrite
    skippedAlreadyHasAnswers++
    continue
  }

  if (DRY_RUN) {
    console.log(`  [DRY] Move transcript→answers: "${study.title}" (${study.transcript!.length} chars)`)
  } else {
    await prisma.bibleStudy.update({
      where: { id: study.id },
      data: {
        answers: study.transcript,
        hasAnswers: true,
        // Only clear transcript if we'll be fetching M-suffix content
        // or if there's no M-suffix file to provide a real transcript
        transcript: null,
        hasTranscript: false,
      },
    })
  }
  movedCount++

  if (atts.isWednesday) wednesdayMovedCount++

  if (movedCount % 100 === 0) {
    console.log(`  Progress: ${movedCount} studies moved`)
  }
}

console.log(`  Moved transcript→answers: ${movedCount}`)
console.log(`  Skipped (already has answers): ${skippedAlreadyHasAnswers}`)
console.log(`  Skipped (no N-suffix attachment): ${skippedNoNSuffix}`)
console.log(`  Wednesday studies in moved set: ${wednesdayMovedCount}`)

// ── Intermediate state after Phase 1 ────────────────────────────────

if (!DRY_RUN) {
  console.log('\n--- After Phase 1 ---')
  const mid = await getCounts()
  console.log(`  With questions: ${mid.withQ} (flag: ${mid.hasQFlag})`)
  console.log(`  With transcript: ${mid.withT} (flag: ${mid.hasTFlag})`)
  console.log(`  With answers: ${mid.withA} (flag: ${mid.hasAFlag})`)
}

// ── PHASE 2: Fetch M-suffix HTML and store in transcript ─────────────

console.log('\n=== Phase 2: Fetch M-suffix manuscripts for transcript ===')

// Find all studies with M-suffix attachments
const mSuffixStudyIds: string[] = []
for (const [studyId, atts] of studyAttMap) {
  if (atts.M.length > 0) mSuffixStudyIds.push(studyId)
}

// Load current state of these studies
const mStudies = await prisma.bibleStudy.findMany({
  where: { id: { in: mSuffixStudyIds } },
  select: { id: true, title: true, transcript: true, hasTranscript: true },
})

let fetchAttempts = 0
let fetchSuccesses = 0
let fetchFailures = 0
let transcriptUpdated = 0
let skippedAlreadyHasTranscript = 0
let skippedPdf = 0

for (const study of mStudies) {
  if (LIMIT && transcriptUpdated >= LIMIT) break

  // After Phase 1, most N-suffix transcripts have been cleared.
  // But check if transcript already has content (from a non-N source or if Phase 1 didn't run)
  if (study.transcript && study.transcript.length > 10) {
    skippedAlreadyHasTranscript++
    continue
  }

  const atts = studyAttMap.get(study.id)!
  const mAtt = atts.M[0] // Take the first M-suffix attachment

  // Skip PDFs — no HTML version available
  if (mAtt.type === 'PDF') {
    skippedPdf++
    continue
  }

  const htmlUrl = toHtmlUrl(mAtt.url)
  fetchAttempts++

  const html = await fetchHtml(htmlUrl)
  if (html === null) {
    fetchFailures++
    continue
  }
  fetchSuccesses++

  const content = extractBodyContent(html)
  if (content.length < 10) {
    fetchFailures++
    continue
  }

  if (DRY_RUN) {
    console.log(`  [DRY] Set transcript from M-suffix: "${study.title}" (${content.length} chars from ${mAtt.name})`)
  } else {
    await prisma.bibleStudy.update({
      where: { id: study.id },
      data: {
        transcript: content,
        hasTranscript: true,
      },
    })
  }
  transcriptUpdated++

  // Rate limit: 50ms between requests
  await sleep(50)

  if (transcriptUpdated % 50 === 0) {
    console.log(`  Progress: ${transcriptUpdated} transcripts fetched (${fetchSuccesses}/${fetchAttempts} successful)`)
  }
}

console.log(`  M-suffix studies processed: ${mStudies.length}`)
console.log(`  Transcripts fetched & stored: ${transcriptUpdated}`)
console.log(`  Skipped (already has transcript): ${skippedAlreadyHasTranscript}`)
console.log(`  Skipped (PDF, no HTML): ${skippedPdf}`)
console.log(`  Fetch attempts: ${fetchAttempts}`)
console.log(`  Fetch successes: ${fetchSuccesses}`)
console.log(`  Fetch failures: ${fetchFailures}`)

// ── PHASE 3: Handle studies where transcript came from legacy doctype ─
// Some studies had transcript populated via legacy doctype fallback
// ("Note" doctype → transcript). These also need to move to answers
// if the source was note-like content.

console.log('\n=== Phase 3: Handle remaining misclassified transcripts ===')

// Check for studies that still have transcript but:
// - Have no M-suffix attachment (so transcript wasn't from a message)
// - Were classified via legacy doctype as "Note"
// These should also move transcript → answers

const remainingWithTranscript = await prisma.bibleStudy.findMany({
  where: { transcript: { not: null } },
  select: { id: true, title: true, transcript: true, answers: true },
})

let phase3Moved = 0
let phase3Skipped = 0

for (const study of remainingWithTranscript) {
  const atts = studyAttMap.get(study.id)
  if (!atts) { phase3Skipped++; continue }

  // If study has M-suffix, its transcript is correctly from a message — skip
  if (atts.M.length > 0) { phase3Skipped++; continue }

  // Check if this study's transcript was from a "Note" doctype (not N-suffix, but legacy doctype)
  // We can infer this: study has transcript, no M-suffix, and has "other" attachments
  // with legacy doctype "Note"
  let hasNoteDoctype = false
  for (const att of atts.other) {
    if (!att.legacySourceId) continue
    const legacyRecord = legacyMap.get(att.legacySourceId)
    if (!legacyRecord) continue
    for (const slot of legacyRecord.slots) {
      if (slot.filename === att.name || slot.fileurl === att.url) {
        if (slot.doctype && slot.doctype.toLowerCase() === 'note') {
          hasNoteDoctype = true
          break
        }
      }
    }
    if (hasNoteDoctype) break
  }

  if (!hasNoteDoctype) { phase3Skipped++; continue }

  // This transcript was from a "Note" doctype fallback → move to answers
  if (study.answers && study.answers.length > 10) {
    phase3Skipped++
    continue
  }

  if (DRY_RUN) {
    console.log(`  [DRY] Move Note-doctype transcript→answers: "${study.title}"`)
  } else {
    await prisma.bibleStudy.update({
      where: { id: study.id },
      data: {
        answers: study.transcript,
        hasAnswers: true,
        transcript: null,
        hasTranscript: false,
      },
    })
  }
  phase3Moved++
}

console.log(`  Remaining studies checked: ${remainingWithTranscript.length}`)
console.log(`  Moved (Note doctype → answers): ${phase3Moved}`)
console.log(`  Skipped: ${phase3Skipped}`)

// ── AFTER counts ─────────────────────────────────────────────────────

if (!DRY_RUN) {
  console.log('\n=== AFTER State ===')
  const after = await getCounts()
  console.log(`  Total studies: ${after.total}`)
  console.log(`  With questions: ${after.withQ} (flag: ${after.hasQFlag})`)
  console.log(`  With transcript: ${after.withT} (flag: ${after.hasTFlag})`)
  console.log(`  With answers: ${after.withA} (flag: ${after.hasAFlag})`)

  console.log('\n=== CHANGE SUMMARY ===')
  console.log(`  Questions: ${before.withQ} → ${after.withQ} (${after.withQ - before.withQ >= 0 ? '+' : ''}${after.withQ - before.withQ})`)
  console.log(`  Transcript: ${before.withT} → ${after.withT} (${after.withT - before.withT >= 0 ? '+' : ''}${after.withT - before.withT})`)
  console.log(`  Answers: ${before.withA} → ${after.withA} (${after.withA - before.withA >= 0 ? '+' : ''}${after.withA - before.withA})`)
  console.log(`  hasQuestions flag: ${before.hasQFlag} → ${after.hasQFlag}`)
  console.log(`  hasTranscript flag: ${before.hasTFlag} → ${after.hasTFlag}`)
  console.log(`  hasAnswers flag: ${before.hasAFlag} → ${after.hasAFlag}`)
}

await prisma.$disconnect()
await pool.end()
console.log('\nDone!')
