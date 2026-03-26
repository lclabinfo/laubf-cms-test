/**
 * Fetches today's Daily Bread from the UBF.org RSS feed and resolves
 * bible text from the local BibleVerse database.
 *
 * XML fields: title, passage, keyverse (e.g. "5a"), date, body, prayer, oneword
 */

import { DOMParser } from '@xmldom/xmldom'
import { fetchBibleText, parsePassage } from '@/lib/bible-api'
import { prisma } from '@/lib/db'

const UBF_DAILY_BREAD_XML = 'https://ubf.org/daily-breads/xml'

interface DailyBreadFeedEntry {
  slug: string
  title: string
  date: string
  passage: string
  keyVerse: string | null
  body: string
  bibleText: string | null
  author: string
  audioUrl: string | null
}

/** Extract text content of a tag from the XML channel element. */
function getTagText(channel: Element, tag: string): string {
  const el = channel.getElementsByTagName(tag)[0]
  return el?.textContent?.trim() ?? ''
}

/** Slugify a title string. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Resolve the key verse reference (e.g. "5a") into the actual verse text
 * from the local Bible database. The keyverse field in the XML is relative
 * to the passage — e.g. passage "Exodus 19:1-6", keyverse "5a" → Exodus 19:5.
 */
async function resolveKeyVerse(
  passage: string,
  keyVerseRef: string,
  bibleVersion = 'ESV',
): Promise<string | null> {
  if (!keyVerseRef) return null

  const parsed = parsePassage(passage)
  if (!parsed) return null

  // Extract verse number from ref like "5a", "3b", "12"
  const verseNum = parseInt(keyVerseRef, 10)
  if (isNaN(verseNum)) return null

  // Fetch the single verse from the database
  const verse = await prisma.bibleVerse.findFirst({
    where: {
      version: bibleVersion,
      book: parsed.book,
      chapter: parsed.chapter,
      verse: verseNum,
    },
  })

  if (!verse) return null

  // If the ref has a letter suffix (e.g. "5a"), try to return just the first
  // sentence/clause. "a" = first half, "b" = second half.
  const suffix = keyVerseRef.replace(/^\d+/, '')
  const text = verse.text.trim()

  if (suffix === 'a') {
    // First half — split on period, semicolon, or mid-verse break
    const mid = Math.ceil(text.length / 2)
    const breakIdx = text.indexOf('. ')
    if (breakIdx > 0 && breakIdx < mid + 20) {
      return text.slice(0, breakIdx + 1)
    }
    // Try semicolon
    const semiIdx = text.indexOf('; ')
    if (semiIdx > 0 && semiIdx < mid + 20) {
      return text.slice(0, semiIdx + 1)
    }
    // Fallback to full verse
    return text
  }

  if (suffix === 'b') {
    // Second half
    const mid = Math.floor(text.length / 2)
    const breakIdx = text.indexOf('. ')
    if (breakIdx > 0 && breakIdx < mid + 20) {
      return text.slice(breakIdx + 2)
    }
    const semiIdx = text.indexOf('; ')
    if (semiIdx > 0 && semiIdx < mid + 20) {
      return text.slice(semiIdx + 2)
    }
    return text
  }

  // No suffix — return full verse
  return text
}

/**
 * Fetches today's Daily Bread from the UBF.org XML feed,
 * resolves bible text from the local database, and returns
 * a shaped object matching the DailyBreadData interface.
 */
export async function fetchDailyBreadFromFeed(bibleVersion = 'ESV'): Promise<DailyBreadFeedEntry | null> {
  try {
    const res = await fetch(UBF_DAILY_BREAD_XML, {
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!res.ok) {
      console.error(`[daily-bread-feed] XML fetch failed: ${res.status}`)
      return null
    }

    const xml = await res.text()
    const doc = new DOMParser().parseFromString(xml, 'text/xml')
    const channel = doc.getElementsByTagName('channel')[0]
    if (!channel) return null

    const title = getTagText(channel, 'title')
    const passage = getTagText(channel, 'passage')
    const keyVerseRef = getTagText(channel, 'keyverse')
    const rawDate = getTagText(channel, 'date')
    const body = getTagText(channel, 'body')
    const prayer = getTagText(channel, 'prayer')
    const oneword = getTagText(channel, 'oneword')

    if (!title || !passage) return null

    // Parse date — format: "2026-03-12 00:00:00"
    const date = rawDate.split(' ')[0] || new Date().toISOString().split('T')[0]

    // Fetch bible text from local DB using the church's configured version
    const bibleResult = await fetchBibleText(passage, bibleVersion)

    // Resolve key verse text — extract "Book Chapter" from passage for reference
    const keyVerseText = await resolveKeyVerse(passage, keyVerseRef, bibleVersion)
    let keyVerse: string | null = null
    if (keyVerseText) {
      // Extract "Exodus 19" from "Exodus 19:1-6"
      const chapterMatch = passage.match(/^(.+?\s+\d+)/)
      const ref = chapterMatch ? `${chapterMatch[1]}:${keyVerseRef}` : keyVerseRef
      keyVerse = `"${keyVerseText}" (${ref})`
    }

    // Build body HTML with prayer and one-word sections
    const bodyParts: string[] = []

    if (body) {
      // Split into paragraphs (the XML body is plain text)
      const paragraphs = body.split(/\n\n|\n/).filter(Boolean)
      bodyParts.push(...paragraphs.map((p) => `<p>${p}</p>`))
    }

    if (prayer) {
      bodyParts.push(
        `<p><strong>Prayer:</strong> ${prayer}</p>`,
      )
    }

    if (oneword) {
      bodyParts.push(
        `<p><strong>One Word:</strong> ${oneword}</p>`,
      )
    }

    return {
      slug: slugify(title),
      title,
      date,
      passage,
      keyVerse,
      body: bodyParts.join('\n'),
      bibleText: bibleResult?.html ?? null,
      author: 'UBF Daily Bread',
      audioUrl: null,
    }
  } catch (error) {
    console.error('[daily-bread-feed] Error fetching/parsing XML:', error)
    return null
  }
}
