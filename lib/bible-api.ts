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

interface ParsedPassage {
  book: BibleBook
  chapter: number
  startVerse?: number
  endVerse?: number
}

/**
 * Parses a passage string into structured components.
 * Handles formats like:
 * - "Genesis 1:1-10"
 * - "John 3:16"
 * - "Psalm 23" (whole chapter)
 * - "1 Corinthians 13:1-8"
 * - "Mark 1:1~20" (tilde separator from old data)
 */
export function parsePassage(passage: string): ParsedPassage | null {
  const trimmed = passage.trim()
  if (!trimmed) return null

  const book = parseBookFromPassage(trimmed)
  if (!book) return null

  // Extract chapter:verse portion after the book name
  // Match patterns like "1:1-10", "3:16", "23", "1:1~20"
  const chapterVerseMatch = trimmed.match(/(\d+)\s*[:]\s*(\d+)\s*[-~]\s*(\d+)/)
    || trimmed.match(/(\d+)\s*[:]\s*(\d+)/)
    || trimmed.match(/(\d+)\s*$/)

  if (!chapterVerseMatch) return null

  if (chapterVerseMatch[3]) {
    // Chapter:StartVerse-EndVerse
    return {
      book,
      chapter: parseInt(chapterVerseMatch[1]),
      startVerse: parseInt(chapterVerseMatch[2]),
      endVerse: parseInt(chapterVerseMatch[3]),
    }
  } else if (chapterVerseMatch[2]) {
    // Chapter:Verse (single verse)
    return {
      book,
      chapter: parseInt(chapterVerseMatch[1]),
      startVerse: parseInt(chapterVerseMatch[2]),
      endVerse: parseInt(chapterVerseMatch[2]),
    }
  } else {
    // Chapter only (whole chapter)
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
 * Fetches Bible text from the local database and returns formatted HTML.
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

    // Build HTML with superscript verse numbers and paragraph grouping
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

    const html = paragraphs
      .filter((p) => p.length > 0)
      .map((p) => `<p>${p.join(' ')}</p>`)
      .join('\n')

    // Build reference string
    const bookName = BOOK_DISPLAY_NAMES[parsed.book] || parsed.book
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
