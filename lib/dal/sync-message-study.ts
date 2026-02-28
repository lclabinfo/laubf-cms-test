import { prisma } from '@/lib/db'
import { ContentStatus, type BibleBook } from '@/lib/generated/prisma/client'
import { tiptapJsonToHtml } from '@/lib/tiptap'
import { fetchBibleText } from '@/lib/bible-api'

/**
 * Maps passage strings like "John 3:16", "1 Corinthians 13:1-8", "Genesis 12"
 * to the BibleBook enum. Returns null if no match.
 */
const BOOK_PATTERNS: [RegExp, BibleBook][] = [
  // Must test numbered books first (longest match)
  [/^1\s*samuel/i, 'FIRST_SAMUEL'],
  [/^2\s*samuel/i, 'SECOND_SAMUEL'],
  [/^1\s*kings/i, 'FIRST_KINGS'],
  [/^2\s*kings/i, 'SECOND_KINGS'],
  [/^1\s*chronicles/i, 'FIRST_CHRONICLES'],
  [/^2\s*chronicles/i, 'SECOND_CHRONICLES'],
  [/^1\s*corinthians/i, 'FIRST_CORINTHIANS'],
  [/^2\s*corinthians/i, 'SECOND_CORINTHIANS'],
  [/^1\s*thessalonians/i, 'FIRST_THESSALONIANS'],
  [/^2\s*thessalonians/i, 'SECOND_THESSALONIANS'],
  [/^1\s*timothy/i, 'FIRST_TIMOTHY'],
  [/^2\s*timothy/i, 'SECOND_TIMOTHY'],
  [/^1\s*peter/i, 'FIRST_PETER'],
  [/^2\s*peter/i, 'SECOND_PETER'],
  [/^1\s*john/i, 'FIRST_JOHN'],
  [/^2\s*john/i, 'SECOND_JOHN'],
  [/^3\s*john/i, 'THIRD_JOHN'],
  [/^song\s*(of\s*solomon|of\s*songs)/i, 'SONG_OF_SOLOMON'],
  // Single-name books
  [/^genesis/i, 'GENESIS'],
  [/^exodus/i, 'EXODUS'],
  [/^leviticus/i, 'LEVITICUS'],
  [/^numbers/i, 'NUMBERS'],
  [/^deuteronomy/i, 'DEUTERONOMY'],
  [/^joshua/i, 'JOSHUA'],
  [/^judges/i, 'JUDGES'],
  [/^ruth/i, 'RUTH'],
  [/^ezra/i, 'EZRA'],
  [/^nehemiah/i, 'NEHEMIAH'],
  [/^esther/i, 'ESTHER'],
  [/^job/i, 'JOB'],
  [/^psalm/i, 'PSALMS'],
  [/^proverb/i, 'PROVERBS'],
  [/^ecclesiastes/i, 'ECCLESIASTES'],
  [/^isaiah/i, 'ISAIAH'],
  [/^jeremiah/i, 'JEREMIAH'],
  [/^lamentations/i, 'LAMENTATIONS'],
  [/^ezekiel/i, 'EZEKIEL'],
  [/^daniel/i, 'DANIEL'],
  [/^hosea/i, 'HOSEA'],
  [/^joel/i, 'JOEL'],
  [/^amos/i, 'AMOS'],
  [/^obadiah/i, 'OBADIAH'],
  [/^jonah/i, 'JONAH'],
  [/^micah/i, 'MICAH'],
  [/^nahum/i, 'NAHUM'],
  [/^habakkuk/i, 'HABAKKUK'],
  [/^zephaniah/i, 'ZEPHANIAH'],
  [/^haggai/i, 'HAGGAI'],
  [/^zechariah/i, 'ZECHARIAH'],
  [/^malachi/i, 'MALACHI'],
  [/^matthew/i, 'MATTHEW'],
  [/^mark/i, 'MARK'],
  [/^luke/i, 'LUKE'],
  [/^john/i, 'JOHN'],
  [/^acts/i, 'ACTS'],
  [/^romans/i, 'ROMANS'],
  [/^galatians/i, 'GALATIANS'],
  [/^ephesians/i, 'EPHESIANS'],
  [/^philippians/i, 'PHILIPPIANS'],
  [/^colossians/i, 'COLOSSIANS'],
  [/^titus/i, 'TITUS'],
  [/^philemon/i, 'PHILEMON'],
  [/^hebrews/i, 'HEBREWS'],
  [/^james/i, 'JAMES'],
  [/^jude/i, 'JUDE'],
  [/^revelation/i, 'REVELATION'],
]

export function parseBookFromPassage(passage: string): BibleBook | null {
  const trimmed = passage.trim()
  for (const [pattern, book] of BOOK_PATTERNS) {
    if (pattern.test(trimmed)) return book
  }
  return null
}

interface StudySection {
  id: string
  title: string
  content: string
}

interface SyncParams {
  messageId: string
  churchId: string
  title: string
  slug: string
  passage?: string | null
  speakerId?: string | null
  /** First series ID from MessageSeries join, or null */
  seriesId?: string | null
  dateFor: Date | string
  status: ContentStatus
  publishedAt?: Date | string | null
  studySections?: StudySection[] | null
  /** Existing relatedStudyId on the Message (if updating) */
  existingStudyId?: string | null
}

/**
 * Syncs Message study content to the BibleStudy table.
 * - Creates a new BibleStudy if the message doesn't have one linked yet.
 * - Updates the existing BibleStudy if already linked.
 * - Returns the BibleStudy ID so the caller can set Message.relatedStudyId.
 */
export async function syncMessageStudy(params: SyncParams): Promise<string> {
  const {
    messageId,
    churchId,
    title,
    slug,
    passage,
    speakerId,
    seriesId,
    dateFor,
    status,
    publishedAt,
    studySections,
    existingStudyId,
  } = params

  // Extract questions, answers, transcript from study sections by title.
  // Content arrives as TipTap JSON from the CMS editor — convert to HTML
  // for the public website which renders via dangerouslySetInnerHTML.
  let questions: string | null = null
  let answers: string | null = null
  let transcript: string | null = null
  const unmatchedSections: { title: string; html: string }[] = []

  if (studySections && Array.isArray(studySections)) {
    for (const section of studySections) {
      if (!section.content) continue
      const html = tiptapJsonToHtml(section.content)
      const titleLower = section.title.toLowerCase()
      if (titleLower.includes('question')) {
        questions = html
      } else if (titleLower.includes('answer')) {
        answers = html
      } else if (titleLower.includes('transcript')) {
        transcript = html
      } else {
        unmatchedSections.push({ title: section.title, html })
      }
    }

    // Append custom sections to questions field (BibleStudy only has 3 text fields)
    if (unmatchedSections.length > 0) {
      const extra = unmatchedSections
        .map((s) => `<h3>${s.title}</h3>\n${s.html}`)
        .join('\n')
      questions = questions ? `${questions}\n${extra}` : extra
    }
  }

  const book = passage ? parseBookFromPassage(passage) : null
  const dateForValue = dateFor instanceof Date ? dateFor : new Date(dateFor)
  const publishedAtValue = publishedAt
    ? (publishedAt instanceof Date ? publishedAt : new Date(publishedAt))
    : (status === ContentStatus.PUBLISHED ? new Date() : null)

  // Ensure unique slug for the BibleStudy table
  const studySlug = await ensureUniqueBibleStudySlug(churchId, slug, existingStudyId)

  // BibleStudy.book is required — default to JOHN if we can't parse
  const bookValue: BibleBook = book ?? 'JOHN'

  // Fetch actual Bible text from API if passage is provided
  let bibleText: string | null = null
  if (passage) {
    const result = await fetchBibleText(passage)
    if (result) {
      bibleText = result.html
    }
  }

  const studyData = {
    title,
    slug: studySlug,
    passage: passage || '',
    book: bookValue,
    speakerId: speakerId || null,
    seriesId: seriesId || null,
    dateFor: dateForValue,
    datePosted: dateForValue,
    status,
    publishedAt: publishedAtValue,
    questions,
    answers,
    transcript,
    bibleText,
    hasQuestions: !!questions,
    hasAnswers: !!answers,
    hasTranscript: !!transcript,
  }

  if (existingStudyId) {
    // Update existing linked BibleStudy
    await prisma.bibleStudy.update({
      where: { id: existingStudyId },
      data: studyData,
    })
    return existingStudyId
  } else {
    // Create new BibleStudy and link it to the Message
    const study = await prisma.bibleStudy.create({
      data: { ...studyData, churchId },
    })

    // Link the new study to the message
    await prisma.message.update({
      where: { id: messageId },
      data: { relatedStudyId: study.id },
    })

    return study.id
  }
}

/**
 * Soft-deletes the linked BibleStudy when a message no longer has study content
 * or the message itself is deleted.
 */
export async function unlinkMessageStudy(messageId: string, studyId: string) {
  // Remove the FK link first
  await prisma.message.update({
    where: { id: messageId },
    data: { relatedStudyId: null },
  })

  // Soft-delete the BibleStudy
  await prisma.bibleStudy.update({
    where: { id: studyId },
    data: { deletedAt: new Date() },
  })
}

/**
 * Ensure slug is unique within the BibleStudy table for this church.
 */
async function ensureUniqueBibleStudySlug(
  churchId: string,
  baseSlug: string,
  excludeId?: string | null,
): Promise<string> {
  let slug = baseSlug
  let counter = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.bibleStudy.findUnique({
      where: { churchId_slug: { churchId, slug } },
      select: { id: true },
    })
    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug
    }
    counter++
    slug = `${baseSlug}-${counter}`
  }
}
