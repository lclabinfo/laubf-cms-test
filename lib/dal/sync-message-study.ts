import { prisma } from '@/lib/db'
import { ContentStatus, type AttachmentType, type BibleBook } from '@/lib/generated/prisma/client'
// ContentStatus still used for BibleStudy model (which retains its own status column)
import { tiptapJsonToHtml } from '@/lib/tiptap'
import { fetchBibleText } from '@/lib/bible-api'
import { deleteObject, PUBLIC_URL } from '@/lib/storage/r2'

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

interface SyncAttachment {
  id: string
  name: string
  url?: string
  type?: string
  size?: string
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
  /** Whether the study content is published */
  hasStudy: boolean
  publishedAt?: Date | string | null
  studySections?: StudySection[] | null
  attachments?: SyncAttachment[] | null
  bibleVersion?: string | null
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
    hasStudy,
    publishedAt,
    studySections,
    attachments,
    bibleVersion,
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
    : (hasStudy ? new Date() : null)

  // Ensure unique slug for the BibleStudy table
  const studySlug = await ensureUniqueBibleStudySlug(churchId, slug, existingStudyId)

  // BibleStudy.book is required — default to JOHN if we can't parse
  const bookValue: BibleBook = book ?? 'JOHN'

  // Fetch actual Bible text from API if passage is provided
  let bibleText: string | null = null
  if (passage) {
    const result = await fetchBibleText(passage, bibleVersion || 'ESV')
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
    status: hasStudy ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
    publishedAt: publishedAtValue,
    questions,
    answers,
    transcript,
    bibleText,
    hasQuestions: !!questions,
    hasAnswers: !!answers,
    hasTranscript: !!transcript,
  }

  let studyId: string

  if (existingStudyId) {
    // Update existing linked BibleStudy
    await prisma.bibleStudy.update({
      where: { id: existingStudyId },
      data: studyData,
    })
    studyId = existingStudyId
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

    studyId = study.id
  }

  // Sync attachments to BibleStudyAttachment table if provided
  if (attachments !== undefined) {
    await syncStudyAttachments(studyId, attachments || [])
  }

  return studyId
}

/**
 * Map file extension or MIME type string to AttachmentType enum.
 */
function resolveAttachmentType(typeStr?: string, name?: string): AttachmentType {
  const t = (typeStr || '').toUpperCase()
  if (t === 'DOCX' || t === 'DOC' || t === 'PDF' || t === 'RTF' || t === 'IMAGE' || t === 'OTHER') {
    return t as AttachmentType
  }
  // Try to infer from file extension
  const ext = (name || '').split('.').pop()?.toLowerCase()
  if (ext === 'docx') return 'DOCX'
  if (ext === 'doc') return 'DOC'
  if (ext === 'pdf') return 'PDF'
  if (ext === 'rtf') return 'RTF'
  if (ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'IMAGE'
  return 'OTHER'
}

/**
 * Sync attachments: replace all BibleStudyAttachment records for a study
 * with the provided list. Uses upsert-by-id for existing records and
 * deletes any that are no longer in the list.
 */
async function syncStudyAttachments(studyId: string, attachments: SyncAttachment[]) {
  // Get existing attachment IDs
  const existing = await prisma.bibleStudyAttachment.findMany({
    where: { bibleStudyId: studyId },
    select: { id: true },
  })
  const existingIds = new Set(existing.map(a => a.id))
  const incomingIds = new Set(attachments.map(a => a.id))

  // Delete removed attachments (R2 files first, then DB records)
  const toDelete = Array.from(existingIds).filter(id => !incomingIds.has(id))
  if (toDelete.length > 0) {
    // Fetch full records to get URLs for R2 cleanup
    const attachmentsToDelete = await prisma.bibleStudyAttachment.findMany({
      where: { id: { in: toDelete } },
      select: { id: true, url: true },
    })

    // Delete files from R2 (best-effort — don't block DB deletion on failure)
    for (const att of attachmentsToDelete) {
      if (att.url && att.url.startsWith(PUBLIC_URL)) {
        const key = att.url.slice(PUBLIC_URL.length + 1) // +1 for the trailing "/"
        try {
          await deleteObject(key)
        } catch (err) {
          console.error(`[syncStudyAttachments] Failed to delete R2 object "${key}":`, err)
        }
      }
    }

    await prisma.bibleStudyAttachment.deleteMany({
      where: { id: { in: toDelete } },
    })
  }

  // Upsert each attachment
  for (let i = 0; i < attachments.length; i++) {
    const att = attachments[i]
    const attType = resolveAttachmentType(att.type, att.name)
    await prisma.bibleStudyAttachment.upsert({
      where: { id: att.id },
      update: {
        name: att.name,
        url: att.url || '',
        type: attType,
        sortOrder: i,
      },
      create: {
        id: att.id,
        bibleStudyId: studyId,
        name: att.name,
        url: att.url || '',
        type: attType,
        sortOrder: i,
      },
    })
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
