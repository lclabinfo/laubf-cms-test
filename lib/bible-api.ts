/**
 * Bible text fetching utilities.
 * Uses bible-api.com with the World English Bible (WEB) translation (public domain).
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
 * Fetches Bible text from bible-api.com and returns formatted HTML.
 * Uses the World English Bible (WEB) translation (public domain).
 * Returns null on failure.
 */
export async function fetchBibleText(
  passage: string,
): Promise<{ html: string; reference: string } | null> {
  try {
    const encoded = passage.replace(/\s+/g, '+')
    const url = `https://bible-api.com/${encoded}?translation=web`

    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return null

    const data: BibleApiResponse = await res.json()
    if (!data.verses || data.verses.length === 0) return null

    // Build HTML: heading + verse text with superscript verse numbers
    const verseHtml = data.verses
      .map((v) => `<sup>${v.verse}</sup> ${v.text.trim()}`)
      .join(' ')

    const html = `<h4>${data.reference} (WEB)</h4>\n<p>${verseHtml}</p>`

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
