/**
 * Bible text fetching utilities.
 * Uses bible-api.com to fetch passage text.
 */

interface BibleApiVerse {
  book_name: string
  chapter: number
  verse: number
  text: string
}

interface BibleApiResponse {
  reference: string
  verses: BibleApiVerse[]
  text: string
  translation_name: string
}

/**
 * Maps common Bible version names to bible-api.com translation codes.
 * Falls back to 'kjv' for unknown versions.
 */
export function getBibleApiTranslation(version: string): string {
  const map: Record<string, string> = {
    'ESV': 'kjv',   // ESV not available, closest is KJV
    'NIV': 'kjv',   // NIV not available, closest is KJV
    'KJV': 'kjv',
    'ASV': 'asv',
    'WEB': 'web',
    'NASB': 'asv',  // NASB not available, closest is ASV
  }
  return map[version.toUpperCase()] || 'kjv'
}

/**
 * Fetches Bible text from bible-api.com and returns formatted HTML.
 * Returns null on failure.
 */
export async function fetchBibleText(
  passage: string,
  translation: string = 'kjv',
): Promise<{ html: string; reference: string } | null> {
  try {
    const encoded = passage.replace(/\s+/g, '+')
    const url = `https://bible-api.com/${encoded}?translation=${translation}`

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null

    const data: BibleApiResponse = await res.json()
    if (!data.verses || data.verses.length === 0) return null

    // Build HTML: verse text with superscript verse numbers, split into paragraphs
    const paragraphs: string[][] = [[]]
    for (let i = 0; i < data.verses.length; i++) {
      const v = data.verses[i]
      const verseStr = `<sup>${v.verse}</sup> ${v.text.trim()}`
      paragraphs[paragraphs.length - 1].push(verseStr)

      const trimmed = v.text.trim()
      const endsWithClosingQuote = /[\u201d\u2019'"]$/.test(trimmed)
      const currentParaLength = paragraphs[paragraphs.length - 1].length

      // Start new paragraph at quote boundaries or every 5 verses
      if (i < data.verses.length - 1 && (endsWithClosingQuote || currentParaLength >= 5)) {
        paragraphs.push([])
      }
    }

    const html = paragraphs
      .filter((p) => p.length > 0)
      .map((p) => `<p>${p.join(' ')}</p>`)
      .join('\n')

    return { html, reference: data.reference }
  } catch {
    return null
  }
}

/**
 * Returns a BibleGateway URL for reading a passage in a given translation.
 * Useful for linking users to a full-featured Bible reader.
 */
export function getBibleGatewayUrl(
  passage: string,
  version: string = 'ESV',
): string {
  const formatted = encodeURIComponent(passage)
  return `https://www.biblegateway.com/passage/?search=${formatted}&version=${version}&interface=print`
}
