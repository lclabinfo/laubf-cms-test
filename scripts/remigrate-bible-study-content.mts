/**
 * Re-migrate ALL bible study content from .doc/.docx/.rtf files → TipTap JSON.
 *
 * This fixes the original migration which stored raw HTML in the DB.
 * The TipTap editor expects TipTap JSON (from generateJSON()), not raw HTML.
 *
 * Pipeline per file:
 *   1. Read file from 00_old_laubf_db_dump/files/
 *   2. Convert to HTML:
 *      - .doc/.rtf → textutil -convert html (macOS)
 *      - .docx → mammoth (via docx-import.ts)
 *   3. HTML → TipTap JSON via @tiptap/html generateJSON()
 *   4. Detect font (serif/sans) and apply textStyle marks if serif
 *   5. Store TipTap JSON string in DB
 *
 * Also outputs updated bible-study-content.json for the seed file.
 *
 * Usage: npx tsx scripts/remigrate-bible-study-content.mts
 */
import 'dotenv/config'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve, extname } from 'path'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { JSDOM } from 'jsdom'

// ── Set up DOM globals for TipTap ──
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>')
;(globalThis as any).DOMParser = dom.window.DOMParser
;(globalThis as any).document = dom.window.document
;(globalThis as any).Node = dom.window.Node
;(globalThis as any).HTMLElement = dom.window.HTMLElement

// ── Dynamic imports after DOM setup ──
const { convertDocxToHtml, applyListItemSpacing } = await import('../lib/docx-import.ts')
const { convertDocToHtml } = await import('../lib/doc-convert.ts')
const { generateJSON } = await import('@tiptap/html')
const { fixOrderedListContinuation, getParseExtensions } = await import('../lib/tiptap.ts')

// Use the parse-only extension list from lib/tiptap.ts.
// Schema-compatible with the editor (includes fontFamily on orderedList/bulletList,
// Indent + LineSpacing global attributes) but without ProseMirror runtime plugins
// that require an active editor instance.
const tiptapExtensions = getParseExtensions()

// ── Font helpers ──

const SERIF_FONTS = [
  'times new roman', 'georgia', 'garamond', 'palatino',
  'cambria', 'book antiqua', 'palatino linotype',
]

function addFontToTextNodes(node: any, fontFamily: string): void {
  if (node.type === 'text') {
    const marks = node.marks || []
    const existing = marks.find((m: any) => m.type === 'textStyle')
    if (existing) {
      existing.attrs = { ...existing.attrs, fontFamily }
    } else {
      marks.push({ type: 'textStyle', attrs: { fontFamily } })
    }
    node.marks = marks
  }
  // Also set fontFamily on list nodes so markers render in the correct font
  if (node.type === 'orderedList' || node.type === 'bulletList') {
    node.attrs = { ...(node.attrs || {}), fontFamily }
  }
  if (node.content) {
    for (const child of node.content) addFontToTextNodes(child, fontFamily)
  }
}

function detectFontFromHtml(html: string): { dominantFont: string | null; isSerifDoc: boolean; serifFontFamily: string | null } {
  const fontCounts = new Map<string, number>()
  function addFont(name: string) {
    const key = name.trim().replace(/^['"]|['"]$/g, '').toLowerCase()
    if (key && !key.includes('serif') && !key.includes('sans') && !key.includes('monospace')) {
      fontCounts.set(key, (fontCounts.get(key) || 0) + 1)
    }
  }
  let match: RegExpExecArray | null
  const fontFamilyRegex = /font-family\s*:\s*([^;}"]+)/gi
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    for (const f of match[1].split(',')) addFont(f)
  }
  const shorthandRegex = /(?:^|[{;\s])font\s*:\s*(?:(?:italic|oblique|normal|bold|bolder|lighter|\d+)\s+)*[\d.]+(?:px|pt|em|rem|%)(?:\s*\/\s*[\d.]+(?:px|pt|em|rem|%))?\s+([^;}"]+)/gi
  while ((match = shorthandRegex.exec(html)) !== null) {
    for (const f of match[1].split(',')) addFont(f)
  }
  let dominantFont: string | null = null
  let maxCount = 0
  for (const [font, count] of fontCounts.entries()) {
    if (count > maxCount) { dominantFont = font; maxCount = count }
  }
  const isSerifDoc = dominantFont !== null && SERIF_FONTS.includes(dominantFont)
  let serifFontFamily: string | null = null
  if (isSerifDoc) {
    const originalCase = dominantFont!.replace(/\b\w/g, c => c.toUpperCase())
    serifFontFamily = `"${originalCase}", Georgia, serif`
  }
  return { dominantFont, isSerifDoc, serifFontFamily }
}

// ── WordPerfect detection ──

function isWordPerfectFile(buffer: Buffer): boolean {
  // WordPerfect 5.x/6.x files start with magic bytes: 0xFF 'W' 'P' 'C'
  return buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0x57 && buffer[2] === 0x50 && buffer[3] === 0x43
}

// ── Unified file conversion → TipTap JSON ──

interface ConversionResult {
  tiptapJson: string
  isSerifDoc: boolean
  dominantFont: string | null
  method: string
}

async function convertFile(filepath: string, filename: string): Promise<ConversionResult | null> {
  const ext = extname(filename).toLowerCase()
  let html: string
  let isSerifDoc = false
  let serifFontFamily: string | null = null
  let dominantFont: string | null = null
  let method: string

  let listSpacing: Set<number> | undefined
  try {
    if (ext === '.docx') {
      const buffer = readFileSync(filepath)
      const result = await convertDocxToHtml(buffer, filename)
      html = result.html; isSerifDoc = result.isSerifDoc
      serifFontFamily = result.serifFontFamily; dominantFont = result.dominantFont
      listSpacing = result.listItemSpacingBefore
      method = 'docx-mammoth'
    } else if (ext === '.doc' || ext === '.rtf') {
      const buffer = readFileSync(filepath)
      // Skip WordPerfect files (magic: 0xFF 'W' 'P' 'C') — they produce garbled output
      if (isWordPerfectFile(buffer)) {
        console.error(`  ✗ ${filename}: WordPerfect 5.x format — skipping (no converter available)`)
        return null
      }
      // textutil handles both .doc (Word binary) and .rtf natively
      const result = await convertDocToHtml(buffer, filename)
      html = result.html; isSerifDoc = result.isSerifDoc
      serifFontFamily = result.serifFontFamily; dominantFont = result.dominantFont
      method = ext === '.rtf' ? 'rtf-textutil' : 'doc-textutil'
    } else {
      return null
    }

    if (!html || !html.trim()) return null

    // HTML → TipTap JSON
    let json = generateJSON(html, tiptapExtensions) as any

    // Restore empty paragraphs between list items (removed for nesting)
    if (listSpacing && listSpacing.size > 0) {
      json = applyListItemSpacing(json, listSpacing)
    }

    // Fix ordered list continuation (e.g., V1-4 questions → V5-14 questions)
    json = fixOrderedListContinuation(json)

    // Apply serif font marks
    if (isSerifDoc && serifFontFamily) {
      addFontToTextNodes(json, serifFontFamily)
    }

    return { tiptapJson: JSON.stringify(json), isSerifDoc, dominantFont, method }
  } catch (err) {
    console.error(`  ✗ ${filename}: ${(err as Error).message}`)
    return null
  }
}

// ── SQL Parsing for doctype mapping ──

interface MaterialRow {
  no: number; title: string
  doctype1: string | null; doctype2: string | null; doctype3: string | null; doctype4: string | null
  filename1: string | null; filename2: string | null; filename3: string | null; filename4: string | null
  msgurl: string | null
}

function parseMaterialRows(): MaterialRow[] {
  const content = readFileSync('00_old_laubf_db_dump/laubf_laubfmaterial.sql', 'utf-8')
  const insertMatch = content.match(/INSERT INTO `laubfmaterial` VALUES\s*/)
  if (!insertMatch) throw new Error('Could not find INSERT statement')

  let pos = insertMatch.index! + insertMatch[0].length
  const rows: MaterialRow[] = []

  function parseSqlValue(s: string, p: number): [any, number] {
    if (p >= s.length) return [null, p]
    if (s.slice(p, p + 4) === 'NULL') return [null, p + 4]
    if (s[p] === "'") {
      p++; const result: string[] = []
      while (p < s.length) {
        if (s[p] === '\\' && p + 1 < s.length) { result.push(s[p + 1]); p += 2 }
        else if (s[p] === "'") { p++; break }
        else { result.push(s[p]); p++ }
      }
      return [result.join(''), p]
    }
    if (s[p] === '-' || (s[p] >= '0' && s[p] <= '9')) {
      let end = p
      while (end < s.length && '0123456789-.'.includes(s[end])) end++
      return [parseInt(s.slice(p, end)) || 0, end]
    }
    return [null, p + 1]
  }

  function parseRow(s: string, p: number): [any[] | null, number] {
    if (p >= s.length || s[p] !== '(') return [null, p]
    p++; const values: any[] = []
    while (p < s.length) {
      while (p < s.length && s[p] === ' ') p++
      if (p < s.length && s[p] === ')') { p++; return [values, p] }
      const [val, next] = parseSqlValue(s, p)
      values.push(val); p = next
      while (p < s.length && s[p] === ' ') p++
      if (p < s.length && s[p] === ',') p++
    }
    return [values, p]
  }

  while (pos < content.length) {
    while (pos < content.length && ' ,\n\r\t'.includes(content[pos])) pos++
    if (pos >= content.length || content[pos] === ';') break
    if (content[pos] === '(') {
      const [values, next] = parseRow(content, pos)
      pos = next
      if (values && values.length >= 22) {
        rows.push({
          no: values[0], title: values[2] || '',
          doctype1: values[9], doctype2: values[10], doctype3: values[11], doctype4: values[12],
          filename1: values[13], filename2: values[14], filename3: values[15], filename4: values[16],
          msgurl: values[21],
        })
      }
    } else break
  }
  return rows
}

// ── Main ──

async function main() {
  console.log('=== Bible Study Content Re-Migration ===')
  console.log('Pipeline: file -> HTML -> TipTap JSON (with font detection)\n')

  // Parse SQL dump for doctype mappings
  console.log('Parsing SQL dump...')
  const materialRows = parseMaterialRows()
  const materialByNo = new Map<number, MaterialRow>()
  for (const row of materialRows) materialByNo.set(row.no, row)
  console.log(`  Loaded ${materialRows.length} material rows`)

  // Build available files index
  const filesDir = resolve('00_old_laubf_db_dump/files')
  const availableFiles = new Set(readdirSync(filesDir))
  console.log(`  Available files on disk: ${availableFiles.size}`)

  // Load parsed material data
  const materialMod = await import('../scripts/parsed-laubfmaterial.ts')
  const allStudies = materialMod.default as Array<{
    legacyId: number; slug: string; title: string; book: string | null; passage: string
    dateFor: string; series: string; attachments: { name: string; url: string; type: string }[]
  }>
  console.log(`  Total studies: ${allStudies.length}\n`)

  // Connect to DB
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const { PrismaClient } = await import('../lib/generated/prisma/client')
  const prisma = new PrismaClient({ adapter })

  const church = await prisma.church.findFirst({ where: { slug: 'la-ubf' } })
  if (!church) throw new Error('Church la-ubf not found')
  console.log(`Church: ${church.name} (${church.id})\n`)

  // Stats
  const stats = {
    totalProcessed: 0, questionsUpdated: 0, answersUpdated: 0, transcriptsUpdated: 0,
    rtfConverted: 0, docConverted: 0, docxConverted: 0,
    filesMissing: 0, conversionErrors: 0, htmlFallback: 0,
    dbUpdated: 0, htmlInPlaceConverted: 0, dbSkipped: 0,
  }
  const missingFiles: string[] = []
  const errorFiles: string[] = []
  const rtfFiles: string[] = []
  const noFileFallbackEntries: { legacyId: number; title: string; field: string }[] = []

  // Content map for seed file
  const contentMap: Record<string, { questions?: string; answers?: string; transcript?: string }> = {}

  // ── Phase 1: Convert files and build content map ──
  console.log('=== Phase 1: Converting files ===')

  for (let i = 0; i < allStudies.length; i++) {
    const study = allStudies[i]
    if (i % 10 === 0) {
      console.log(`  Processing ${i}/${allStudies.length}... (${study.title.slice(0, 50)})`)
    }

    let questions: string | null = null
    let answers: string | null = null
    let transcript: string | null = null

    const matRow = materialByNo.get(study.legacyId)

    for (const att of study.attachments) {
      const filename = att.name
      const filepath = resolve(filesDir, filename)

      if (!existsSync(filepath)) {
        stats.filesMissing++
        missingFiles.push(`${study.legacyId}:${filename}`)
        continue
      }

      // Determine doctype from SQL mapping
      let doctype: string | null = null
      if (matRow) {
        const filenames = [matRow.filename1, matRow.filename2, matRow.filename3, matRow.filename4]
        const doctypes = [matRow.doctype1, matRow.doctype2, matRow.doctype3, matRow.doctype4]
        const idx = filenames.findIndex(f => f === filename)
        if (idx >= 0) doctype = doctypes[idx]
      }

      const result = await convertFile(filepath, filename)
      if (!result) {
        stats.conversionErrors++
        errorFiles.push(`${study.legacyId}:${filename}`)
        continue
      }

      const ext = extname(filename).toLowerCase()
      if (ext === '.rtf') { stats.rtfConverted++; rtfFiles.push(filename) }
      else if (ext === '.doc') stats.docConverted++
      else if (ext === '.docx') stats.docxConverted++

      // Assign to correct field based on SQL doctype
      const isQ = doctype === 'Question' || doctype === 'Inductive'
      const isN = doctype === 'Note'
      const isM = doctype === 'Message'

      if (isQ && !questions) questions = result.tiptapJson
      else if (isN && !answers) answers = result.tiptapJson
      else if (isM && !transcript) transcript = result.tiptapJson
    }

    // Check msgurl for transcript
    if (!transcript && matRow?.msgurl?.trim()) {
      const msgFilename = matRow.msgurl.trim().split('/').pop()
      if (msgFilename && availableFiles.has(msgFilename)) {
        const result = await convertFile(resolve(filesDir, msgFilename), msgFilename)
        if (result) {
          transcript = result.tiptapJson
          const ext = extname(msgFilename).toLowerCase()
          if (ext === '.rtf') stats.rtfConverted++
          else if (ext === '.doc') stats.docConverted++
          else if (ext === '.docx') stats.docxConverted++
        }
      }
    }

    if (questions || answers || transcript) {
      const entry: Record<string, string> = {}
      if (questions) { entry.questions = questions; stats.questionsUpdated++ }
      if (answers) { entry.answers = answers; stats.answersUpdated++ }
      if (transcript) { entry.transcript = transcript; stats.transcriptsUpdated++ }
      contentMap[String(study.legacyId)] = entry
    }

    stats.totalProcessed++
  }

  // ── Phase 2: Update database ──
  console.log('\n=== Phase 2: Updating database ===')

  const allDbStudies = await prisma.bibleStudy.findMany({
    where: { churchId: church.id, deletedAt: null },
    select: { id: true, slug: true, title: true, dateFor: true },
  })
  console.log(`  Found ${allDbStudies.length} BibleStudy records in DB`)

  // Build lookups: slug -> id
  const studyBySlug = new Map<string, string>()
  for (const s of allDbStudies) {
    studyBySlug.set(s.slug, s.id)
    if (s.slug.startsWith('study-')) studyBySlug.set(s.slug.replace(/^study-/, ''), s.id)
  }

  // Build legacyId -> DB study ID mapping
  const legacyIdToDbId = new Map<number, string>()
  for (const study of allStudies) {
    const dbId = studyBySlug.get(`study-${study.slug}`) || studyBySlug.get(study.slug)
    if (dbId) legacyIdToDbId.set(study.legacyId, dbId)
  }

  // Also try matching by title+date
  const studyByTitleDate = new Map<string, string>()
  for (const s of allDbStudies) {
    const key = `${s.title.toLowerCase().trim()}|${s.dateFor.toISOString().split('T')[0]}`
    studyByTitleDate.set(key, s.id)
  }
  for (const study of allStudies) {
    if (legacyIdToDbId.has(study.legacyId)) continue
    const key = `${study.title.toLowerCase().trim()}|${study.dateFor}`
    const dbId = studyByTitleDate.get(key)
    if (dbId) legacyIdToDbId.set(study.legacyId, dbId)
  }
  console.log(`  Matched ${legacyIdToDbId.size} legacy IDs to DB records`)

  // Update DB from content map
  for (const [legacyIdStr, entry] of Object.entries(contentMap)) {
    const dbId = legacyIdToDbId.get(parseInt(legacyIdStr))
    if (!dbId) { stats.dbSkipped++; continue }

    try {
      await prisma.bibleStudy.update({
        where: { id: dbId },
        data: {
          questions: entry.questions || null,
          answers: entry.answers || null,
          transcript: entry.transcript || null,
          hasQuestions: !!entry.questions,
          hasAnswers: !!entry.answers,
          hasTranscript: !!entry.transcript,
        },
      })
      stats.dbUpdated++
    } catch (err) {
      console.error(`  Failed to update study ${dbId} (legacy ${legacyIdStr}): ${(err as Error).message}`)
    }
  }

  // ── Phase 3: Convert remaining raw HTML entries in-place ──
  console.log('\n=== Phase 3: Converting remaining raw HTML in-place ===')

  // Fetch all studies - handle potentially corrupt entries one at a time
  const allStudyIds = await prisma.bibleStudy.findMany({
    where: { churchId: church.id, deletedAt: null },
    select: { id: true },
  })

  for (const { id } of allStudyIds) {
    try {
      const study = await prisma.bibleStudy.findUnique({
        where: { id },
        select: { id: true, title: true, questions: true, answers: true, transcript: true },
      })
      if (!study) continue

      const updates: Record<string, any> = {}
      let needsUpdate = false

      for (const field of ['questions', 'answers', 'transcript'] as const) {
        const content = study[field]
        if (!content) continue

        // Check if already TipTap JSON
        try {
          const parsed = JSON.parse(content)
          if (parsed.type === 'doc') continue // Already converted
        } catch {
          // Not JSON
        }

        // Check if it's HTML (not binary garbage)
        if (content.includes('<') && content.includes('>') && !content.includes('\x00')) {
          try {
            let json = generateJSON(content, tiptapExtensions) as any

            // Fix ordered list continuation
            json = fixOrderedListContinuation(json)

            // Try to detect font from the HTML
            const fontInfo = detectFontFromHtml(content)
            if (fontInfo.isSerifDoc && fontInfo.serifFontFamily) {
              addFontToTextNodes(json, fontInfo.serifFontFamily)
            }

            updates[field] = JSON.stringify(json)
            needsUpdate = true
            stats.htmlFallback++
            noFileFallbackEntries.push({ legacyId: 0, title: study.title, field })
          } catch (err) {
            console.error(`  Failed HTML->JSON for ${study.title}.${field}: ${(err as Error).message}`)
          }
        }
      }

      if (needsUpdate) {
        await prisma.bibleStudy.update({ where: { id: study.id }, data: updates })
        stats.htmlInPlaceConverted++
      }
    } catch (err) {
      // Skip entries with corrupt/invalid UTF-8 data
      console.error(`  Skipping study ${id}: ${(err as Error).message}`)
    }
  }

  // ── Phase 4: Write updated content JSON for seed file ──
  console.log('\n=== Phase 4: Writing bible-study-content.json ===')
  writeFileSync('scripts/bible-study-content.json', JSON.stringify(contentMap), 'utf-8')
  const sizeMB = (readFileSync('scripts/bible-study-content.json').length / (1024 * 1024)).toFixed(1)
  console.log(`  Output: scripts/bible-study-content.json (${sizeMB} MB)`)

  // ── Summary ──
  console.log('\n========================================')
  console.log('        Re-Migration Summary')
  console.log('========================================')
  console.log(`Studies processed: ${stats.totalProcessed}`)
  console.log(`\nFile conversions:`)
  console.log(`  .docx (mammoth):  ${stats.docxConverted}`)
  console.log(`  .doc  (textutil): ${stats.docConverted}`)
  console.log(`  .rtf  (textutil): ${stats.rtfConverted}`)
  console.log(`\nContent fields populated:`)
  console.log(`  Questions:   ${stats.questionsUpdated}`)
  console.log(`  Answers:     ${stats.answersUpdated}`)
  console.log(`  Transcripts: ${stats.transcriptsUpdated}`)
  console.log(`\nDatabase updates:`)
  console.log(`  From files:       ${stats.dbUpdated}`)
  console.log(`  HTML->JSON fix:   ${stats.htmlInPlaceConverted}`)
  console.log(`  Skipped (no match): ${stats.dbSkipped}`)
  console.log(`\nIssues:`)
  console.log(`  Files missing:      ${stats.filesMissing}`)
  console.log(`  Conversion errors:  ${stats.conversionErrors}`)
  console.log(`  HTML fallback fixes: ${stats.htmlFallback}`)

  if (missingFiles.length > 0) {
    console.log(`\nMissing files (first 20):`)
    for (const f of missingFiles.slice(0, 20)) console.log(`  ${f}`)
  }
  if (errorFiles.length > 0) {
    console.log(`\nConversion errors (first 20):`)
    for (const f of errorFiles.slice(0, 20)) console.log(`  ${f}`)
  }
  if (rtfFiles.length > 0) {
    console.log(`\nRTF files converted (${rtfFiles.length} total):`)
    for (const f of rtfFiles.slice(0, 10)) console.log(`  ${f}`)
    if (rtfFiles.length > 10) console.log(`  ... and ${rtfFiles.length - 10} more`)
  }

  // Write audit data
  writeFileSync('scripts/remigration-audit.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    missingFiles,
    errorFiles,
    rtfFiles,
    noFileFallbackEntries,
  }, null, 2), 'utf-8')
  console.log('\nAudit data: scripts/remigration-audit.json')

  await prisma.$disconnect()
  await pool.end()
  console.log('\nDone!')
}

main().catch((err) => {
  console.error('Re-migration failed:', err)
  process.exit(1)
})
