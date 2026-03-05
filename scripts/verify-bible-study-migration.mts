/**
 * Bible Study Data Migration Verification Script
 *
 * Checks:
 * 1. Content coverage (questions, answers, transcripts, statuses, date range)
 * 2. Message-Study links (1:1 relationship, hasVideo counts, publishedAt)
 * 3. Attachment URL patterns and file existence
 * 4. HTML content quality (formatting, null bytes, links)
 * 5. Specific entry spot-checks from old website
 */
import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const { PrismaClient } = await import('../lib/generated/prisma/client.ts')
const { PrismaPg } = await import('@prisma/adapter-pg')
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

let passed = 0
let failed = 0
let warnings = 0

function pass(msg: string) { console.log(`  PASS: ${msg}`); passed++ }
function fail(msg: string) { console.log(`  FAIL: ${msg}`); failed++ }
function warn(msg: string) { console.log(`  WARN: ${msg}`); warnings++ }
function section(title: string) { console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`) }

// ============================================================
// 1. Content Coverage
// ============================================================
section('1. CONTENT COVERAGE')

const totalStudies = await prisma.bibleStudy.count()
console.log(`  Total bible studies: ${totalStudies}`)

if (totalStudies === 1180) pass(`Expected 1,180 studies, got ${totalStudies}`)
else if (totalStudies >= 1175 && totalStudies <= 1185) warn(`Expected ~1,180 studies, got ${totalStudies} (close but not exact)`)
else fail(`Expected 1,180 studies, got ${totalStudies}`)

// Content field counts
const withQuestions = await prisma.bibleStudy.count({ where: { hasQuestions: true } })
const withAnswers = await prisma.bibleStudy.count({ where: { hasAnswers: true } })
const withTranscript = await prisma.bibleStudy.count({ where: { hasTranscript: true } })

console.log(`  With questions: ${withQuestions}`)
console.log(`  With answers: ${withAnswers}`)
console.log(`  With transcript: ${withTranscript}`)

// Check flag consistency: hasQuestions=true should mean questions is not null/empty
const flagMismatchQ = await prisma.bibleStudy.count({
  where: { hasQuestions: true, questions: null }
})
const flagMismatchA = await prisma.bibleStudy.count({
  where: { hasAnswers: true, answers: null }
})
const flagMismatchT = await prisma.bibleStudy.count({
  where: { hasTranscript: true, transcript: null }
})

if (flagMismatchQ === 0) pass('hasQuestions flag matches non-null questions content')
else fail(`${flagMismatchQ} studies have hasQuestions=true but null questions`)

if (flagMismatchA === 0) pass('hasAnswers flag matches non-null answers content')
else fail(`${flagMismatchA} studies have hasAnswers=true but null answers`)

if (flagMismatchT === 0) pass('hasTranscript flag matches non-null transcript content')
else fail(`${flagMismatchT} studies have hasTranscript=true but null transcript`)

// Reverse check: non-null content but flag is false
const reverseQ = await prisma.bibleStudy.count({
  where: { hasQuestions: false, questions: { not: null } }
})
const reverseA = await prisma.bibleStudy.count({
  where: { hasAnswers: false, answers: { not: null } }
})
if (reverseQ === 0) pass('No studies with questions content but hasQuestions=false')
else fail(`${reverseQ} studies have questions content but hasQuestions=false`)

if (reverseA === 0) pass('No studies with answers content but hasAnswers=false')
else fail(`${reverseA} studies have answers content but hasAnswers=false`)

// Published vs Draft
const publishedCount = await prisma.bibleStudy.count({ where: { status: 'PUBLISHED' } })
const draftCount = await prisma.bibleStudy.count({ where: { status: 'DRAFT' } })
const otherStatusCount = totalStudies - publishedCount - draftCount

console.log(`  PUBLISHED: ${publishedCount}`)
console.log(`  DRAFT: ${draftCount}`)
console.log(`  Other status: ${otherStatusCount}`)

if (publishedCount > 0) pass(`${publishedCount} studies are PUBLISHED`)
else warn('No studies are PUBLISHED')

// Date range check
const oldest = await prisma.bibleStudy.findFirst({ orderBy: { dateFor: 'asc' }, select: { dateFor: true, title: true } })
const newest = await prisma.bibleStudy.findFirst({ orderBy: { dateFor: 'desc' }, select: { dateFor: true, title: true } })

if (oldest && newest) {
  const oldYear = oldest.dateFor.getFullYear()
  const newYear = newest.dateFor.getFullYear()
  console.log(`  Date range: ${oldest.dateFor.toISOString().slice(0, 10)} to ${newest.dateFor.toISOString().slice(0, 10)}`)

  if (oldYear <= 2000) pass(`Oldest entry year ${oldYear} <= 2000`)
  else fail(`Oldest entry year ${oldYear} > 2000, expected <= 2000`)

  if (newYear >= 2026) pass(`Newest entry year ${newYear} >= 2026`)
  else fail(`Newest entry year ${newYear} < 2026, expected >= 2026`)
}

// Year distribution
const yearDistribution: Record<string, number> = {}
const allStudies = await prisma.bibleStudy.findMany({ select: { dateFor: true } })
for (const s of allStudies) {
  const y = s.dateFor.getFullYear().toString()
  yearDistribution[y] = (yearDistribution[y] || 0) + 1
}
const sortedYears = Object.keys(yearDistribution).sort()
console.log(`  Year distribution (${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}):`)
for (const y of sortedYears) {
  console.log(`    ${y}: ${yearDistribution[y]}`)
}

// Check for gaps in years
const startYear = parseInt(sortedYears[0])
const endYear = parseInt(sortedYears[sortedYears.length - 1])
const missingYears: string[] = []
for (let y = startYear; y <= endYear; y++) {
  if (!yearDistribution[y.toString()]) missingYears.push(y.toString())
}
if (missingYears.length === 0) pass('No missing years in date range')
else warn(`Missing years: ${missingYears.join(', ')}`)

// Null/empty content check
const emptyTitleCount = await prisma.bibleStudy.count({ where: { title: '' } })
const emptySlugCount = await prisma.bibleStudy.count({ where: { slug: '' } })
const emptyPassageCount = await prisma.bibleStudy.count({ where: { passage: '' } })

if (emptyTitleCount === 0) pass('No empty titles')
else fail(`${emptyTitleCount} studies have empty titles`)

if (emptySlugCount === 0) pass('No empty slugs')
else fail(`${emptySlugCount} studies have empty slugs`)

if (emptyPassageCount === 0) pass('No empty passages')
else fail(`${emptyPassageCount} studies have empty passages`)

// ============================================================
// 2. Message-Study Links
// ============================================================
section('2. MESSAGE-STUDY LINKS')

const studiesWithMessage = await prisma.message.count({
  where: { relatedStudyId: { not: null } }
})
console.log(`  Messages linked to a study: ${studiesWithMessage}`)

if (studiesWithMessage === totalStudies) pass(`All ${totalStudies} studies have a linked Message`)
else fail(`${studiesWithMessage} messages linked to studies, expected ${totalStudies}`)

// Orphan check: studies without a linked message
const studyIds = await prisma.bibleStudy.findMany({ select: { id: true } })
const linkedStudyIds = await prisma.message.findMany({
  where: { relatedStudyId: { not: null } },
  select: { relatedStudyId: true }
})
const linkedSet = new Set(linkedStudyIds.map(m => m.relatedStudyId))
const orphans = studyIds.filter(s => !linkedSet.has(s.id))
if (orphans.length === 0) pass('No orphan bible studies (all have linked messages)')
else fail(`${orphans.length} bible studies have no linked message`)

// hasVideo counts
const messagesWithVideo = await prisma.message.count({
  where: { relatedStudyId: { not: null }, hasVideo: true }
})
const messagesWithoutVideo = await prisma.message.count({
  where: { relatedStudyId: { not: null }, hasVideo: false }
})
console.log(`  Messages with hasVideo=true: ${messagesWithVideo}`)
console.log(`  Messages with hasVideo=false: ${messagesWithoutVideo}`)

if (messagesWithVideo === 260) pass(`Expected 260 messages with hasVideo=true, got ${messagesWithVideo}`)
else if (messagesWithVideo >= 255 && messagesWithVideo <= 265) warn(`Expected ~260 messages with hasVideo=true, got ${messagesWithVideo}`)
else fail(`Expected 260 messages with hasVideo=true, got ${messagesWithVideo}`)

// publishedAt check
const messagesPublished = await prisma.message.count({
  where: { relatedStudyId: { not: null }, publishedAt: { not: null } }
})
const messagesUnpublished = await prisma.message.count({
  where: { relatedStudyId: { not: null }, publishedAt: null }
})
console.log(`  Messages with publishedAt set: ${messagesPublished}`)
console.log(`  Messages with publishedAt null: ${messagesUnpublished}`)

if (messagesUnpublished === 0) pass('All study-linked messages have publishedAt set')
else fail(`${messagesUnpublished} study-linked messages have null publishedAt`)

// ============================================================
// 3. Attachment URLs
// ============================================================
section('3. ATTACHMENT URLs')

const totalAttachments = await prisma.bibleStudyAttachment.count()
console.log(`  Total attachments: ${totalAttachments}`)

// Check URL pattern
const attachments = await prisma.bibleStudyAttachment.findMany({
  select: { url: true, name: true, type: true, bibleStudyId: true }
})

const legacyPattern = /^\/legacy-files\/[a-z0-9-]+\/[^/]+$/
let patternMatches = 0
let patternMismatches = 0
const mismatchExamples: string[] = []

for (const a of attachments) {
  if (legacyPattern.test(a.url)) {
    patternMatches++
  } else {
    patternMismatches++
    if (mismatchExamples.length < 5) mismatchExamples.push(a.url)
  }
}

console.log(`  URLs matching /legacy-files/{slug}/{file} pattern: ${patternMatches}`)
if (patternMismatches === 0) pass('All attachment URLs match expected pattern')
else {
  fail(`${patternMismatches} URLs don't match pattern`)
  for (const ex of mismatchExamples) console.log(`    Example: ${ex}`)
}

// Spot-check 5 random attachments for file existence
const sampleSize = Math.min(5, attachments.length)
const shuffled = attachments.sort(() => Math.random() - 0.5).slice(0, sampleSize)
console.log(`\n  Spot-checking ${sampleSize} random attachments for file existence:`)

let existCount = 0
let missingCount = 0
for (const a of shuffled) {
  const filePath = path.join('/Users/davidlim/Desktop/laubf-cms-test/public', a.url)
  const exists = fs.existsSync(filePath)
  const status = exists ? 'EXISTS' : 'MISSING'
  if (exists) existCount++; else missingCount++
  console.log(`    [${status}] ${a.url}`)
}

if (missingCount === 0) pass(`All ${sampleSize} spot-checked files exist on disk`)
else warn(`${missingCount}/${sampleSize} spot-checked files are missing`)

// Attachment type distribution
const typeDistribution: Record<string, number> = {}
for (const a of attachments) {
  typeDistribution[a.type] = (typeDistribution[a.type] || 0) + 1
}
console.log(`\n  Attachment type distribution:`)
for (const [t, c] of Object.entries(typeDistribution).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${t}: ${c}`)
}

// ============================================================
// 4. HTML Content Quality
// ============================================================
section('4. HTML CONTENT QUALITY')

// Get a sample of studies with questions content
const studiesWithContent = await prisma.bibleStudy.findMany({
  where: { questions: { not: null } },
  select: { id: true, title: true, questions: true, answers: true, slug: true },
  take: 200
})

let nullByteCount = 0
let controlCharCount = 0
let hasInlineStyles = 0
let hasBasicHtml = 0
let hasLinks = 0
let emptyHtmlCount = 0

for (const s of studiesWithContent) {
  const content = (s.questions || '') + (s.answers || '')

  // Null bytes
  if (content.includes('\x00')) nullByteCount++

  // Control characters (excluding newline, tab, carriage return)
  if (/[\x01-\x08\x0B\x0C\x0E-\x1F]/.test(content)) controlCharCount++

  // HTML structure checks
  if (/<[a-z]/.test(content)) hasBasicHtml++
  if (/style=/.test(content)) hasInlineStyles++
  if (/<a\s+href=/.test(content)) hasLinks++

  // Empty HTML (tags only, no text content)
  const textOnly = content.replace(/<[^>]+>/g, '').trim()
  if (textOnly.length === 0 && content.length > 0) emptyHtmlCount++
}

if (nullByteCount === 0) pass('No null bytes found in content')
else fail(`${nullByteCount} studies contain null bytes`)

if (controlCharCount === 0) pass('No control characters found in content')
else warn(`${controlCharCount} studies contain control characters`)

console.log(`  Studies with HTML structure: ${hasBasicHtml}/${studiesWithContent.length}`)
console.log(`  Studies with inline styles: ${hasInlineStyles}/${studiesWithContent.length}`)
console.log(`  Studies with links: ${hasLinks}/${studiesWithContent.length}`)

if (hasBasicHtml > studiesWithContent.length * 0.5) pass('Majority of content has HTML structure')
else warn(`Only ${hasBasicHtml}/${studiesWithContent.length} studies have HTML structure`)

if (emptyHtmlCount === 0) pass('No studies have empty HTML (tags only, no text)')
else warn(`${emptyHtmlCount} studies have HTML tags but no visible text content`)

// Check a mammoth-converted DOCX entry (should have inline styles)
const docxAttachments = await prisma.bibleStudyAttachment.findMany({
  where: { type: 'DOCX' },
  select: { bibleStudyId: true },
  take: 5
})
if (docxAttachments.length > 0) {
  const docxStudy = await prisma.bibleStudy.findUnique({
    where: { id: docxAttachments[0].bibleStudyId },
    select: { title: true, questions: true, slug: true }
  })
  if (docxStudy?.questions) {
    const hasFormatting = /style=/.test(docxStudy.questions) || /<(p|ol|ul|li|h[1-6]|strong|em|b|i)/.test(docxStudy.questions)
    console.log(`\n  DOCX sample: "${docxStudy.title}" (${docxStudy.slug})`)
    console.log(`    Content length: ${docxStudy.questions.length} chars`)
    console.log(`    Has formatting: ${hasFormatting}`)
    console.log(`    Preview: ${docxStudy.questions.substring(0, 300)}...`)
    if (hasFormatting) pass('DOCX-converted content has proper formatting')
    else warn('DOCX-converted content lacks expected formatting')
  }
}

// Check a DOC entry (textutil-converted)
const docAttachments = await prisma.bibleStudyAttachment.findMany({
  where: { type: 'DOC' },
  select: { bibleStudyId: true },
  take: 5
})
if (docAttachments.length > 0) {
  const docStudy = await prisma.bibleStudy.findUnique({
    where: { id: docAttachments[0].bibleStudyId },
    select: { title: true, questions: true, slug: true }
  })
  if (docStudy?.questions) {
    const hasStructure = /<(p|div|br|span|ol|ul|li)/.test(docStudy.questions)
    console.log(`\n  DOC sample: "${docStudy.title}" (${docStudy.slug})`)
    console.log(`    Content length: ${docStudy.questions.length} chars`)
    console.log(`    Has basic structure: ${hasStructure}`)
    console.log(`    Preview: ${docStudy.questions.substring(0, 300)}...`)
    if (hasStructure) pass('DOC-converted content has basic HTML structure')
    else warn('DOC-converted content lacks HTML structure')
  }
}

// Link preservation check
const studiesWithLinks = await prisma.bibleStudy.findMany({
  where: { questions: { contains: '<a ' } },
  select: { title: true, questions: true },
  take: 3
})
if (studiesWithLinks.length > 0) {
  console.log(`\n  Link preservation samples:`)
  for (const s of studiesWithLinks) {
    const linkMatch = s.questions!.match(/<a\s+[^>]*href="[^"]*"[^>]*>[^<]*<\/a>/g)
    if (linkMatch) {
      console.log(`    "${s.title}": ${linkMatch.slice(0, 2).join(', ')}`)
    }
  }
  pass('Links are preserved in converted content')
} else {
  console.log('  No studies found with preserved links')
}

// ============================================================
// 5. Specific Entry Spot-Checks
// ============================================================
section('5. SPECIFIC ENTRY SPOT-CHECKS')

// 5a: "PRAISE THE LORD" (Ruth 4:1-22, Nov 21, 2004)
console.log('\n  --- Check: "PRAISE THE LORD" (Ruth 4:1-22, ~Nov 2004) ---')
const praiseLord = await prisma.bibleStudy.findFirst({
  where: {
    title: { contains: 'PRAISE THE LORD', mode: 'insensitive' },
    passage: { contains: 'Ruth 4' }
  },
  select: {
    title: true, passage: true, dateFor: true, slug: true,
    hasQuestions: true, hasAnswers: true, hasTranscript: true,
    questions: true
  }
})
if (praiseLord) {
  console.log(`    Found: "${praiseLord.title}"`)
  console.log(`    Passage: ${praiseLord.passage}`)
  console.log(`    Date: ${praiseLord.dateFor.toISOString().slice(0, 10)}`)
  console.log(`    hasQuestions: ${praiseLord.hasQuestions}, hasAnswers: ${praiseLord.hasAnswers}`)
  if (praiseLord.hasQuestions) pass('"PRAISE THE LORD" has questions')
  else warn('"PRAISE THE LORD" does not have questions')

  // Check for notes (answers)
  if (praiseLord.hasAnswers) pass('"PRAISE THE LORD" has notes/answers')
  else console.log('    (no answers/notes)')
} else {
  fail('"PRAISE THE LORD" (Ruth 4) not found')
}

// 5b: "Speak Your Word With Boldness" (Acts 4, Feb 15, 2026)
console.log('\n  --- Check: "Speak Your Word With Boldness" (Acts 4, ~Feb 2026) ---')
const speakWord = await prisma.bibleStudy.findFirst({
  where: {
    title: { contains: 'Speak Your Word', mode: 'insensitive' }
  },
  select: {
    title: true, passage: true, dateFor: true, slug: true,
    hasQuestions: true, hasAnswers: true,
    questions: true
  }
})
if (speakWord) {
  console.log(`    Found: "${speakWord.title}"`)
  console.log(`    Passage: ${speakWord.passage}`)
  console.log(`    Date: ${speakWord.dateFor.toISOString().slice(0, 10)}`)
  console.log(`    hasQuestions: ${speakWord.hasQuestions}`)
  if (speakWord.hasQuestions) pass('"Speak Your Word With Boldness" has questions')
  else fail('"Speak Your Word With Boldness" should have questions')
} else {
  fail('"Speak Your Word With Boldness" not found')
}

// 5c: Random entries across different years
console.log('\n  --- Random entries from different years ---')
const spotCheckYears = [2002, 2008, 2013, 2019, 2024]
for (const year of spotCheckYears) {
  const entry = await prisma.bibleStudy.findFirst({
    where: {
      dateFor: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`)
      }
    },
    select: {
      title: true, passage: true, dateFor: true, slug: true,
      hasQuestions: true, hasAnswers: true, hasTranscript: true,
      status: true
    },
    orderBy: { dateFor: 'asc' }
  })
  if (entry) {
    console.log(`    ${year}: "${entry.title}" | ${entry.passage} | ${entry.dateFor.toISOString().slice(0, 10)} | Q:${entry.hasQuestions} A:${entry.hasAnswers} T:${entry.hasTranscript} | ${entry.status}`)
    pass(`Entry from ${year} exists`)
  } else {
    fail(`No entry found for year ${year}`)
  }
}

// ============================================================
// Summary
// ============================================================
section('SUMMARY')
console.log(`  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)
console.log(`  Warnings: ${warnings}`)
console.log(`  Total checks: ${passed + failed + warnings}`)

if (failed === 0) {
  console.log('\n  ALL CHECKS PASSED (some warnings may need attention)')
} else {
  console.log(`\n  ${failed} CHECK(S) FAILED - review above for details`)
}

await pool.end()
process.exit(failed > 0 ? 1 : 0)
