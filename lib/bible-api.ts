/**
 * Bible text utilities.
 * Fetches passage text from the local BibleVerse database (imported from legacy bible_nword data).
 * Supports 11 translations: ESV, NIV, KJV, NLT, NASB, AMP, NIV1984, 개역개정, 새번역, 바른성경, RVR1960.
 */

import { prisma } from '@/lib/db'
import type { BibleBook } from '@/lib/generated/prisma/client'
import { parseBookFromPassage } from '@/lib/dal/sync-message-study'

/** All versions available in the local database. */
export const LOCAL_VERSIONS = new Set([
  'ESV', 'NIV', 'KJV', 'NLT', 'NASB', 'AMP', 'NIV1984',
  '개역개정', '새번역', '바른성경', 'RVR1960',
])

interface VerseRange {
  start: number
  end: number
}

interface ParsedPassage {
  book: BibleBook
  chapter: number
  startVerse?: number
  endVerse?: number
  /** Multiple verse ranges for comma-separated passages. */
  ranges?: VerseRange[]
}

/**
 * Parses a passage string into structured components.
 * Handles formats like:
 * - "Genesis 1:1-10"
 * - "John 3:16"
 * - "Psalm 23" (whole chapter)
 * - "1 Corinthians 13:1-8"
 * - "Mark 1:1~20" (tilde separator from old data)
 * - "John 1:1-3, 10, 20-25" (comma-separated verse ranges)
 */
export function parsePassage(passage: string): ParsedPassage | null {
  let trimmed = passage.trim()
  if (!trimmed) return null

  // Normalize ~ to -
  trimmed = trimmed.replace(/~/g, '-')

  const book = parseBookFromPassage(trimmed)
  if (!book) return null

  // Check for comma-separated ranges
  const colonIdx = trimmed.indexOf(':')
  if (colonIdx !== -1) {
    const versePart = trimmed.substring(colonIdx + 1)
    if (versePart.includes(',')) {
      // Extract chapter from before the colon
      const beforeColon = trimmed.substring(0, colonIdx)
      const chapterMatch = beforeColon.match(/(\d+)\s*$/)
      if (!chapterMatch) return null
      const chapter = parseInt(chapterMatch[1])

      // Parse each comma-separated segment
      const segments = versePart.split(',').map(s => s.trim()).filter(Boolean)
      const ranges: VerseRange[] = []
      for (const seg of segments) {
        const rangeMatch = seg.match(/^(\d+)(?:\s*-\s*(\d+))?/)
        if (!rangeMatch) continue
        const start = parseInt(rangeMatch[1])
        const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : start
        ranges.push({ start, end })
      }

      if (ranges.length === 0) return null

      // Sort and merge
      ranges.sort((a, b) => a.start - b.start)

      return {
        book,
        chapter,
        startVerse: ranges[0].start,
        endVerse: ranges[ranges.length - 1].end,
        ranges: ranges.length > 1 ? ranges : undefined,
      }
    }
  }

  // Single range or whole chapter
  const chapterVerseMatch = trimmed.match(/(\d+)\s*[:]\s*(\d+)\s*[-]\s*(\d+)/)
    || trimmed.match(/(\d+)\s*[:]\s*(\d+)/)
    || trimmed.match(/(\d+)\s*$/)

  if (!chapterVerseMatch) return null

  if (chapterVerseMatch[3]) {
    return {
      book,
      chapter: parseInt(chapterVerseMatch[1]),
      startVerse: parseInt(chapterVerseMatch[2]),
      endVerse: parseInt(chapterVerseMatch[3]),
    }
  } else if (chapterVerseMatch[2]) {
    return {
      book,
      chapter: parseInt(chapterVerseMatch[1]),
      startVerse: parseInt(chapterVerseMatch[2]),
      endVerse: parseInt(chapterVerseMatch[2]),
    }
  } else {
    return {
      book,
      chapter: parseInt(chapterVerseMatch[1]),
    }
  }
}

/** Map BibleBook enum to display name. */
const BOOK_DISPLAY_NAMES: Record<string, string> = {
  GENESIS: 'Genesis', EXODUS: 'Exodus', LEVITICUS: 'Leviticus', NUMBERS: 'Numbers',
  DEUTERONOMY: 'Deuteronomy', JOSHUA: 'Joshua', JUDGES: 'Judges', RUTH: 'Ruth',
  FIRST_SAMUEL: '1 Samuel', SECOND_SAMUEL: '2 Samuel', FIRST_KINGS: '1 Kings',
  SECOND_KINGS: '2 Kings', FIRST_CHRONICLES: '1 Chronicles', SECOND_CHRONICLES: '2 Chronicles',
  EZRA: 'Ezra', NEHEMIAH: 'Nehemiah', ESTHER: 'Esther', JOB: 'Job',
  PSALMS: 'Psalms', PROVERBS: 'Proverbs', ECCLESIASTES: 'Ecclesiastes',
  SONG_OF_SOLOMON: 'Song of Solomon', ISAIAH: 'Isaiah', JEREMIAH: 'Jeremiah',
  LAMENTATIONS: 'Lamentations', EZEKIEL: 'Ezekiel', DANIEL: 'Daniel',
  HOSEA: 'Hosea', JOEL: 'Joel', AMOS: 'Amos', OBADIAH: 'Obadiah',
  JONAH: 'Jonah', MICAH: 'Micah', NAHUM: 'Nahum', HABAKKUK: 'Habakkuk',
  ZEPHANIAH: 'Zephaniah', HAGGAI: 'Haggai', ZECHARIAH: 'Zechariah', MALACHI: 'Malachi',
  MATTHEW: 'Matthew', MARK: 'Mark', LUKE: 'Luke', JOHN: 'John',
  ACTS: 'Acts', ROMANS: 'Romans', FIRST_CORINTHIANS: '1 Corinthians',
  SECOND_CORINTHIANS: '2 Corinthians', GALATIANS: 'Galatians', EPHESIANS: 'Ephesians',
  PHILIPPIANS: 'Philippians', COLOSSIANS: 'Colossians',
  FIRST_THESSALONIANS: '1 Thessalonians', SECOND_THESSALONIANS: '2 Thessalonians',
  FIRST_TIMOTHY: '1 Timothy', SECOND_TIMOTHY: '2 Timothy', TITUS: 'Titus',
  PHILEMON: 'Philemon', HEBREWS: 'Hebrews', JAMES: 'James',
  FIRST_PETER: '1 Peter', SECOND_PETER: '2 Peter', FIRST_JOHN: '1 John',
  SECOND_JOHN: '2 John', THIRD_JOHN: '3 John', JUDE: 'Jude', REVELATION: 'Revelation',
}

/**
 * Builds HTML from a list of verses with superscript verse numbers and paragraph grouping.
 */
function buildVerseHtml(verses: { verse: number; text: string }[]): string {
  const paragraphs: string[][] = [[]]
  for (let i = 0; i < verses.length; i++) {
    const v = verses[i]
    const verseStr = `<sup>${v.verse}</sup> ${v.text.trim()}`
    paragraphs[paragraphs.length - 1].push(verseStr)

    const trimmed = v.text.trim()
    const endsWithClosingQuote = /[\u201d\u2019'"]$/.test(trimmed)
    const currentParaLength = paragraphs[paragraphs.length - 1].length

    if (i < verses.length - 1 && (endsWithClosingQuote || currentParaLength >= 5)) {
      paragraphs.push([])
    }
  }

  return paragraphs
    .filter((p) => p.length > 0)
    .map((p) => `<p>${p.join(' ')}</p>`)
    .join('\n')
}

/**
 * Fetches Bible text from the local database and returns formatted HTML.
 * Supports multi-range passages (comma-separated) with paragraph breaks between ranges.
 * Returns null if no verses found.
 */
export async function fetchBibleText(
  passage: string,
  version: string = 'ESV',
): Promise<{ html: string; reference: string } | null> {
  try {
    const parsed = parsePassage(passage)
    if (!parsed) return null

    const versionCode = version.toUpperCase()
    const bookName = BOOK_DISPLAY_NAMES[parsed.book] || parsed.book

    // Multi-range: fetch each range separately with paragraph breaks between
    if (parsed.ranges && parsed.ranges.length > 1) {
      const htmlSections: string[] = []

      for (const range of parsed.ranges) {
        const verses = await prisma.bibleVerse.findMany({
          where: {
            version: versionCode,
            book: parsed.book,
            chapter: parsed.chapter,
            verse: { gte: range.start, lte: range.end },
          },
          orderBy: { verse: 'asc' },
        })

        if (verses.length > 0) {
          htmlSections.push(buildVerseHtml(verses))
        }
      }

      if (htmlSections.length === 0) return null

      // Join sections with an empty paragraph for visual separation
      const html = htmlSections.join('\n<p>&nbsp;</p>\n')

      // Build reference string with comma notation
      const rangeParts = parsed.ranges.map(r =>
        r.start === r.end ? `${r.start}` : `${r.start}-${r.end}`
      )
      const reference = `${bookName} ${parsed.chapter}:${rangeParts.join(', ')}`

      return { html, reference }
    }

    // Single range or whole chapter
    const where: {
      version: string
      book: BibleBook
      chapter: number
      verse?: { gte: number; lte: number }
    } = {
      version: versionCode,
      book: parsed.book,
      chapter: parsed.chapter,
    }

    if (parsed.startVerse != null && parsed.endVerse != null) {
      where.verse = { gte: parsed.startVerse, lte: parsed.endVerse }
    }

    const verses = await prisma.bibleVerse.findMany({
      where,
      orderBy: { verse: 'asc' },
    })

    if (verses.length === 0) return null

    const html = buildVerseHtml(verses)

    // Build reference string
    let reference: string
    if (parsed.startVerse != null && parsed.endVerse != null && parsed.startVerse !== parsed.endVerse) {
      reference = `${bookName} ${parsed.chapter}:${parsed.startVerse}-${parsed.endVerse}`
    } else if (parsed.startVerse != null) {
      reference = `${bookName} ${parsed.chapter}:${parsed.startVerse}`
    } else {
      reference = `${bookName} ${parsed.chapter}`
    }

    return { html, reference }
  } catch (error) {
    console.error('fetchBibleText error:', error)
    return null
  }
}

/**
 * Returns a BibleGateway URL for reading a passage in a given translation.
 */
export function getBibleGatewayUrl(
  passage: string,
  version: string = 'ESV',
): string {
  const formatted = encodeURIComponent(passage)
  return `https://www.biblegateway.com/passage/?search=${formatted}&version=${version}&interface=print`
}
