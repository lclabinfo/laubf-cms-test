/**
 * Backfill BibleStudy content from legacy HTML files on laubf.org
 *
 * ⚠️  WARNING: This script had INCORRECT field mapping for N and M suffix files.
 * The fix was applied by fix-study-field-mapping.mts on 2026-03-02.
 * Correct mapping: Q→questions, N→answers, M→transcript, Wed notes→answers.
 * This script incorrectly mapped: N→transcript, M→skip.
 *
 * The original migration imported 1,486 Bible studies with 3,145 file attachments,
 * but the questions/answers/transcript text fields were left empty. The old server
 * at laubf.org has HTML versions of many .docx/.doc files at the same path with
 * .html extension.
 *
 * This script:
 * 1. Queries all BibleStudyAttachments with legacySourceId
 * 2. Groups attachments by bibleStudyId
 * 3. For each study's attachments, classifies by filename convention:
 *    - Ending in Q -> questions (also fallback: doctype "Question" from legacy SQL)
 *    - Ending in N -> transcript (notes) ← WRONG: should be answers
 *    - Ending in M -> (message manuscript — skipped) ← WRONG: should be transcript
 *    - Wednesday notes -> answers field
 * 4. Fetches the HTML version from https://laubf.org (replace .docx/.doc/.rtf with .html)
 * 5. Extracts body content (strips HTML head/wrapper, keeps study content)
 * 6. Updates BibleStudy.questions, .transcript, .answers, and flags
 *
 * Usage: npx tsx scripts/backfill-study-content.mts [--limit N] [--dry-run]
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

// ── CLI args ─────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : 0 // 0 = no limit
const DRY_RUN = args.includes('--dry-run')

console.log(`=== Backfill Study Content ===`)
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
console.log(`Limit: ${LIMIT || 'none (all studies)'}`)

// ── Parse legacy SQL to build doctype map ────────────────────────────
// The laubfmaterial SQL has doctype1-4 columns that tell us which slot
// is "Question", "Note", "Message", or "Inductive".
// We'll use this as a secondary signal alongside filename conventions.

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

// ── Content classification ───────────────────────────────────────────

type ContentType = 'questions' | 'transcript' | 'answers' | 'skip'

/**
 * Classify an attachment into a content type.
 * Priority: filename convention > legacy doctype > skip
 */
function classifyAttachment(
  filename: string,
  legacyDoctype: string | null,
  isWednesdayStudy: boolean,
): ContentType {
  // Strip extension to get the base name
  const basename = filename.replace(/\.(docx?|pdf|rtf|html)$/i, '')

  // Filename convention: last character before extension
  const lastChar = basename.charAt(basename.length - 1).toUpperCase()

  if (lastChar === 'Q') return 'questions'
  if (lastChar === 'N') {
    // Wednesday notes go to answers field
    if (isWednesdayStudy) return 'answers'
    return 'transcript'
  }
  if (lastChar === 'M') return 'skip' // message manuscripts not stored in BibleStudy

  // Fallback: check for lowercase patterns in filename
  const lowerBase = basename.toLowerCase()
  if (lowerBase.endsWith('q_') || lowerBase.includes('_q_') || lowerBase.includes('-q-')
      || lowerBase.includes('_qs_') || lowerBase.includes('question')
      || lowerBase.match(/q\d*$/)
  ) {
    return 'questions'
  }

  // Use legacy doctype as fallback
  if (legacyDoctype) {
    const dt = legacyDoctype.toLowerCase()
    if (dt === 'question') return 'questions'
    if (dt === 'note') {
      if (isWednesdayStudy) return 'answers'
      return 'transcript'
    }
    if (dt === 'inductive') return 'questions' // Inductive studies are question sheets
    if (dt === 'message') return 'skip'
  }

  // Smarter filename pattern matching for "other" category
  if (lowerBase.includes('note') || lowerBase.includes('-n-') || lowerBase.includes('_n_')) {
    if (isWednesdayStudy) return 'answers'
    return 'transcript'
  }

  // Files like "BC" (Bible Commentary), "Spr.BC" etc. - treat as questions
  if (lowerBase.includes('bc') && (lowerBase.includes('spr') || lowerBase.includes('conf'))) {
    return 'questions'
  }

  // Default: skip unknown types
  return 'skip'
}

// ── HTML extraction ──────────────────────────────────────────────────

const BASE_URL = 'https://laubf.org'

/**
 * Convert a document URL to its HTML equivalent.
 * /documentation/bible/Mk2d-2019Q.docx -> https://laubf.org/documentation/bible/Mk2d-2019Q.html
 */
function toHtmlUrl(documentUrl: string): string {
  // Replace file extension with .html
  const htmlPath = documentUrl.replace(/\.(docx?|rtf|pdf)$/i, '.html')
  return `${BASE_URL}${htmlPath}`
}

/**
 * Fetch HTML content from a URL. Returns null if not found (404).
 */
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
    // Only accept HTML responses
    if (contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('application/xhtml')) {
      return await response.text()
    }
    // Some servers return HTML without proper content-type
    const text = await response.text()
    if (text.includes('<') && (text.includes('<p') || text.includes('<body') || text.includes('<div') || text.includes('<blockquote'))) {
      return text
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extract body content from HTML. Handles both:
 * - Full HTML documents (with <html>, <head>, <body>)
 * - HTML fragments (just content, no wrapper)
 */
function extractBodyContent(html: string): string {
  // Check if this is a full HTML document
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    return cleanHtml(bodyMatch[1])
  }

  // Check for DOCTYPE or <html> tag — full document without body match
  if (html.match(/<!DOCTYPE|<html/i)) {
    // Try to strip head and html wrapper
    let content = html
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
    return cleanHtml(content)
  }

  // Already a fragment — use as-is
  return cleanHtml(html)
}

/**
 * Clean up HTML content: remove inline styles, normalize whitespace,
 * strip empty tags, fix image references.
 */
function cleanHtml(html: string): string {
  let cleaned = html
    // Remove style attributes (they contain font-specific styling from Word)
    .replace(/\s+style="[^"]*"/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    // Remove Word-specific tags
    .replace(/<\/?o:[^>]*>/gi, '')
    .replace(/<\/?v:[^>]*>/gi, '')
    .replace(/<\/?st1:[^>]*>/gi, '')
    // Fix self-closing tags that aren't proper HTML
    .replace(/<tag\s+src="[^"]*"\s*\/?>/gi, '') // Word image placeholders
    // Remove empty paragraphs (but keep <br> for spacing)
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
    // Remove empty spans
    .replace(/<span>\s*<\/span>/gi, '')
    // Normalize whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim()

  return cleaned
}

// ── Rate limiting ────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  // Step 1: Load legacy material data for doctype lookup
  console.log('\n--- Step 1: Loading legacy material data ---')
  const matContent = readFileSync(join(process.cwd(), '00_old_laubf_db_dump/laubf_laubfmaterial.sql'), 'utf-8')
  const legacyMap = parseLegacyMaterials(matContent)
  console.log(`  Loaded ${legacyMap.size} legacy material records`)

  // Build a set of Wednesday material IDs
  const wednesdayMaterialIds = new Set<number>()
  for (const [no, rec] of legacyMap) {
    if (rec.mtype === 'Bible note from Wednesday group') {
      wednesdayMaterialIds.add(no)
    }
  }
  console.log(`  Found ${wednesdayMaterialIds.size} Wednesday material records`)

  // Step 2: Load all attachments with their studies
  console.log('\n--- Step 2: Loading attachments from database ---')
  const attachments = await prisma.bibleStudyAttachment.findMany({
    where: { legacySourceId: { not: null } },
    include: {
      bibleStudy: {
        select: { id: true, title: true, questions: true, transcript: true, answers: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })
  console.log(`  Loaded ${attachments.length} attachments`)

  // Step 3: Group attachments by study
  console.log('\n--- Step 3: Grouping attachments by study ---')
  const studyGroups = new Map<string, typeof attachments>()
  for (const att of attachments) {
    const group = studyGroups.get(att.bibleStudyId) || []
    group.push(att)
    studyGroups.set(att.bibleStudyId, group)
  }
  console.log(`  ${studyGroups.size} studies with attachments`)

  // Step 4: Process each study
  console.log('\n--- Step 4: Processing studies ---')
  let studiesProcessed = 0
  let studiesUpdated = 0
  let questionsFound = 0
  let transcriptFound = 0
  let answersFound = 0
  let fetchAttempts = 0
  let fetchSuccesses = 0
  let fetchFailures = 0
  let skippedAlreadyFilled = 0

  const studyIds = Array.from(studyGroups.keys())
  const totalStudies = LIMIT ? Math.min(LIMIT, studyIds.length) : studyIds.length

  for (const studyId of studyIds) {
    if (LIMIT && studiesProcessed >= LIMIT) break

    const studyAttachments = studyGroups.get(studyId) || []
    const study = studyAttachments[0].bibleStudy

    // Track what we find for this study
    let questionsHtml: string | null = null
    let transcriptHtml: string | null = null
    let answersHtml: string | null = null

    // Check each attachment
    for (const att of studyAttachments) {
      const legacyId = att.legacySourceId as number
      const legacyRecord = legacyMap.get(legacyId)
      const isWednesday = wednesdayMaterialIds.has(legacyId)

      // Find the matching doctype from legacy data
      let legacyDoctype: string | null = null
      if (legacyRecord) {
        for (const slot of legacyRecord.slots) {
          if (slot.filename === att.name || slot.fileurl === att.url) {
            legacyDoctype = slot.doctype
            break
          }
        }
      }

      // Classify this attachment
      const contentType = classifyAttachment(att.name, legacyDoctype, isWednesday)
      if (contentType === 'skip') continue

      // Skip if we already have content for this type from a previous attachment
      if (contentType === 'questions' && questionsHtml) continue
      if (contentType === 'transcript' && transcriptHtml) continue
      if (contentType === 'answers' && answersHtml) continue

      // Skip PDFs - they don't have HTML versions
      if (att.type === 'PDF') continue

      // Build HTML URL and fetch
      const htmlUrl = toHtmlUrl(att.url)
      fetchAttempts++

      const html = await fetchHtml(htmlUrl)
      if (html === null) {
        fetchFailures++
        continue
      }
      fetchSuccesses++

      // Extract body content
      const content = extractBodyContent(html)
      if (content.length < 10) continue // Skip near-empty content

      // Assign to the right field
      if (contentType === 'questions') {
        questionsHtml = content
        questionsFound++
      } else if (contentType === 'transcript') {
        transcriptHtml = content
        transcriptFound++
      } else if (contentType === 'answers') {
        answersHtml = content
        answersFound++
      }

      // Small delay to be polite to the server (50ms between requests)
      await sleep(50)
    }

    // Update the study if we found content
    const hasNewContent = questionsHtml || transcriptHtml || answersHtml
    if (hasNewContent) {
      const updateData: Record<string, unknown> = {}

      if (questionsHtml && !study.questions) {
        updateData.questions = questionsHtml
        updateData.hasQuestions = true
      }
      if (transcriptHtml && !study.transcript) {
        updateData.transcript = transcriptHtml
        updateData.hasTranscript = true
      }
      if (answersHtml && !study.answers) {
        updateData.answers = answersHtml
        updateData.hasAnswers = true
      }

      if (Object.keys(updateData).length > 0) {
        if (DRY_RUN) {
          console.log(`  [DRY] Would update study "${study.title}":`, Object.keys(updateData).filter(k => !k.startsWith('has')).join(', '))
        } else {
          await prisma.bibleStudy.update({
            where: { id: studyId },
            data: updateData,
          })
        }
        studiesUpdated++
      } else {
        skippedAlreadyFilled++
      }
    }

    studiesProcessed++
    if (studiesProcessed % 100 === 0) {
      console.log(`  Progress: ${studiesProcessed}/${totalStudies} studies processed (${studiesUpdated} updated, ${fetchSuccesses}/${fetchAttempts} fetched)`)
    }
  }

  // Step 5: Summary
  console.log('\n=== Summary ===')
  console.log(`  Studies processed: ${studiesProcessed}`)
  console.log(`  Studies updated: ${studiesUpdated}`)
  console.log(`  Skipped (already filled): ${skippedAlreadyFilled}`)
  console.log(`  Questions extracted: ${questionsFound}`)
  console.log(`  Transcripts extracted: ${transcriptFound}`)
  console.log(`  Answers extracted: ${answersFound}`)
  console.log(`  Fetch attempts: ${fetchAttempts}`)
  console.log(`  Fetch successes: ${fetchSuccesses}`)
  console.log(`  Fetch failures (404/error): ${fetchFailures}`)

  // Verify
  if (!DRY_RUN) {
    const withQ = await prisma.bibleStudy.count({ where: { questions: { not: null } } })
    const withT = await prisma.bibleStudy.count({ where: { transcript: { not: null } } })
    const withA = await prisma.bibleStudy.count({ where: { answers: { not: null } } })
    const total = await prisma.bibleStudy.count()
    console.log(`\n--- Database verification ---`)
    console.log(`  Total studies: ${total}`)
    console.log(`  With questions: ${withQ}`)
    console.log(`  With transcript: ${withT}`)
    console.log(`  With answers: ${withA}`)
  }

  await prisma.$disconnect()
  await pool.end()
  console.log('\nDone!')
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
