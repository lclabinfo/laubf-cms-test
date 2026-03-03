/**
 * Clean up imported HTML in BibleStudy.questions, answers, and transcript fields:
 * 1. Remove redundant header block (title, bible link, key verse, theme) from top of content
 * 2. Remove <blockquote> wrappers inside <li> elements (questions should be plain list items)
 * 3. Clean up both questions and answers fields
 *
 * Usage: npx tsx scripts/clean-study-html.mts
 */
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const mod = await import('../lib/generated/prisma/client')
const prisma = new mod.PrismaClient({ adapter })

/**
 * Remove the header block from the beginning of study content.
 * The header typically contains:
 * - Title (first <p> or <p><strong>)
 * - Bible passage link or text (e.g., "Acts 4" or "<a href=...>Acts 4</a>")
 * - Key Verse line (starts with "Key Verse" or "Key verse")
 * - Key verse text (the actual verse quote)
 * - Theme line (just "Theme")
 * - Theme text
 *
 * We remove everything before the first verse reference (V1-4, V1-10, etc.)
 * or the first <ol> tag, whichever comes first.
 */
function removeHeaderBlock(html: string): string {
  if (!html) return html

  // Strategy: find where the actual content starts
  // The content typically starts with a verse reference like "V1-4" or "V1-10"
  // or with the first <ol> tag (numbered questions)

  // Split into elements by tags
  // Find the first occurrence of a verse reference pattern or <ol>
  const verseRefPattern = /^<p>\s*V\d+[-–]\d+\s*<\/p>/im
  const olPattern = /^<ol[\s>]/im

  const lines = html.split('\n')
  let contentStartIdx = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (verseRefPattern.test(line) || olPattern.test(line)) {
      contentStartIdx = i
      break
    }
  }

  // If we found a start point, also look at the combined HTML for better detection
  if (contentStartIdx === -1) {
    // Try a different approach: look for patterns in the full HTML
    // Find the first <ol or first "V\d" paragraph
    const olIdx = html.search(/<ol[\s>]/i)
    const vIdx = html.search(/<p>\s*V\d/i)

    if (olIdx !== -1 || vIdx !== -1) {
      const cutIdx = olIdx !== -1 && vIdx !== -1
        ? Math.min(olIdx, vIdx)
        : olIdx !== -1 ? olIdx : vIdx
      return html.substring(cutIdx)
    }

    // If no clear content marker, try removing just the first few <p> elements
    // that look like header content
    return removeLeadingHeaderParagraphs(html)
  }

  return lines.slice(contentStartIdx).join('\n')
}

/**
 * Remove leading paragraphs that match header patterns.
 * Removes <p> elements at the start that contain:
 * - Just a title (short text, possibly bold)
 * - Bible passage references (book + chapter)
 * - "Key Verse" lines
 * - "Theme" lines
 * - Bible Gateway links
 */
function removeLeadingHeaderParagraphs(html: string): string {
  // Match <p>...</p> at the start
  const pPattern = /^\s*<p[^>]*>([\s\S]*?)<\/p>\s*/i
  let remaining = html

  let removedCount = 0
  const maxToRemove = 8 // Don't remove more than 8 leading paragraphs

  while (removedCount < maxToRemove) {
    const match = remaining.match(pPattern)
    if (!match) break

    const content = match[1].replace(/<[^>]+>/g, '').trim() // strip inner tags for analysis
    const isHeader =
      // Title-like (short, possibly just a name)
      (content.length < 100 && removedCount === 0) ||
      // Bible passage link
      /^<a\s+href.*biblegateway/i.test(match[1]) ||
      // Just a book reference like "Acts 4" or "2 Samuel 24:1-25"
      /^\d?\s*[A-Z][a-z]+\s+\d+/i.test(content) ||
      // Key verse line
      /^key\s+verse/i.test(content) ||
      // Theme line
      /^theme$/i.test(content) ||
      // Short quote (key verse text) following a key verse label
      (removedCount > 0 && /^[""\u201c]/.test(content)) ||
      // Verse text after "Key Verse N:"
      (removedCount > 0 && content.startsWith('"'))

    if (!isHeader) break

    remaining = remaining.substring(match[0].length)
    removedCount++
  }

  return remaining
}

/**
 * Remove <blockquote> wrappers inside <li> elements.
 * Converts: <li><blockquote><p>text</p></blockquote></li>
 * To: <li><p>text</p></li>
 */
function removeBlockquoteInLi(html: string): string {
  // Pattern: <li><blockquote>\n<p>...</p>\n</blockquote></li>
  // Replace with: <li><p>...</p></li>
  return html
    .replace(/<li>\s*<blockquote>\s*/gi, '<li>')
    .replace(/\s*<\/blockquote>\s*<\/li>/gi, '</li>')
}

/**
 * Clean up a study content field.
 */
function cleanStudyHtml(html: string): string {
  if (!html) return html

  let cleaned = html

  // 1. Remove blockquote wrappers in list items
  cleaned = removeBlockquoteInLi(cleaned)

  // 2. Remove header block
  cleaned = removeHeaderBlock(cleaned)

  // 3. Clean up extra whitespace
  cleaned = cleaned.trim()

  return cleaned
}

async function main() {
  const studies = await prisma.bibleStudy.findMany({
    where: {
      OR: [
        { questions: { not: null } },
        { answers: { not: null } },
        { transcript: { not: null } },
      ]
    },
    select: { id: true, questions: true, answers: true, transcript: true },
  })

  console.log(`Processing ${studies.length} studies...`)

  let questionsUpdated = 0
  let answersUpdated = 0
  let transcriptUpdated = 0

  for (const study of studies) {
    const updates: Record<string, string> = {}

    if (study.questions) {
      const cleaned = cleanStudyHtml(study.questions)
      if (cleaned !== study.questions) {
        updates.questions = cleaned
        questionsUpdated++
      }
    }

    if (study.answers) {
      const cleaned = cleanStudyHtml(study.answers)
      if (cleaned !== study.answers) {
        updates.answers = cleaned
        answersUpdated++
      }
    }

    if (study.transcript) {
      const cleaned = cleanStudyHtml(study.transcript)
      if (cleaned !== study.transcript) {
        updates.transcript = cleaned
        transcriptUpdated++
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.bibleStudy.update({
        where: { id: study.id },
        data: updates,
      })
    }
  }

  console.log(`\nDone:`)
  console.log(`  Questions cleaned: ${questionsUpdated}`)
  console.log(`  Answers cleaned: ${answersUpdated}`)
  console.log(`  Transcripts cleaned: ${transcriptUpdated}`)

  // Verify with a sample
  const sample = await prisma.bibleStudy.findFirst({
    where: { title: { contains: 'Speak Your Word' } },
    select: { questions: true },
  })
  console.log(`\nSample (first 500 chars):`)
  console.log(sample?.questions?.substring(0, 500))

  await prisma.$disconnect()
  await pool.end()
}

main().catch(err => { console.error(err); process.exit(1) })
