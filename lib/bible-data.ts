export interface BibleReference {
  book: string
  chapter: number
  /** undefined means "whole chapter" (e.g. "Acts 2") */
  verseStart?: number
  verseEnd?: number
}

export const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy",
  "2 Timothy", "Titus", "Philemon", "Hebrews", "James",
  "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
  "Jude", "Revelation"
]

export const BOOK_ABBREVIATIONS: Record<string, string> = {
  "gen": "Genesis", "ex": "Exodus", "lev": "Leviticus", "num": "Numbers", "deut": "Deuteronomy",
  "josh": "Joshua", "judg": "Judges", "rut": "Ruth", "1sam": "1 Samuel", "2sam": "2 Samuel",
  "1kgs": "1 Kings", "2kgs": "2 Kings", "1chr": "1 Chronicles", "2chr": "2 Chronicles", "neh": "Nehemiah",
  "est": "Esther", "ps": "Psalms", "prov": "Proverbs", "eccl": "Ecclesiastes", "song": "Song of Solomon",
  "isa": "Isaiah", "jer": "Jeremiah", "lam": "Lamentations", "ezek": "Ezekiel", "dan": "Daniel",
  "hos": "Hosea", "joe": "Joel", "amo": "Amos", "oba": "Obadiah", "jon": "Jonah",
  "mic": "Micah", "nah": "Nahum", "hab": "Habakkuk", "zep": "Zephaniah", "hag": "Haggai",
  "zec": "Zechariah", "mal": "Malachi", "matt": "Matthew", "mrk": "Mark", "luk": "Luke",
  "jhn": "John", "act": "Acts", "rom": "Romans", "1cor": "1 Corinthians", "2cor": "2 Corinthians",
  "gal": "Galatians", "eph": "Ephesians", "phi": "Philippians", "col": "Colossians", "1th": "1 Thessalonians",
  "2th": "2 Thessalonians", "1ti": "1 Timothy", "2ti": "2 Timothy", "tit": "Titus", "phlm": "Philemon",
  "heb": "Hebrews", "jas": "James", "1pet": "1 Peter", "2pet": "2 Peter", "1jn": "1 John",
  "2jn": "2 John", "3jn": "3 John", "jud": "Jude", "rev": "Revelation"
}

export function parseBibleReference(input: string): BibleReference | null {
  if (!input) return null

  let cleanInput = input.trim()

  // Normalize ~ to - (Korean convention for verse ranges)
  cleanInput = cleanInput.replace(/~/g, "-")

  // Collapse multiple spaces into one
  cleanInput = cleanInput.replace(/\s+/g, " ")

  // Normalize spaces around : and - so "Acts 1 : 20 - 39" → "Acts 1:20-39"
  cleanInput = cleanInput.replace(/\s*:\s*/g, ":")
  cleanInput = cleanInput.replace(/(\d)\s*-\s*(\d)/g, "$1-$2")

  // Detect trailing dash: "John 1:22-" means "verse 22 to end of chapter"
  const hasTrailingDash = /\d+-$/.test(cleanInput)

  // Strip trailing non-alphanumeric chars (like : or -) so partial input
  // like "Romans 1:" parses as "Romans 1"
  while (cleanInput.length > 0 && /[^a-zA-Z0-9]$/.test(cleanInput)) {
    cleanInput = cleanInput.slice(0, -1).trim()
  }

  // Regex: Book (lazy) + Chapter + optional :VerseStart + optional -VerseEnd
  const match = cleanInput.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/)
  if (!match) return null

  const bookStr = match[1]
  const chapter = parseInt(match[2], 10)
  const verseStart = match[3] ? parseInt(match[3], 10) : undefined
  let verseEnd = match[4] ? parseInt(match[4], 10) : undefined

  const foundBook = findBook(bookStr)
  if (!foundBook) return null

  // If user typed trailing dash (e.g. "John 1:22-"), fill verseEnd to last verse
  if (hasTrailingDash && verseStart !== undefined && verseEnd === undefined) {
    const bookData = BIBLE_VERSE_COUNTS[foundBook]
    if (bookData && chapter >= 1 && chapter <= bookData.length) {
      verseEnd = bookData[chapter - 1]
    }
  }

  return {
    book: foundBook,
    chapter,
    verseStart,
    verseEnd
  }
}

/**
 * Attempts to make a best-guess suggestion from user input that didn't fully parse.
 * Clamps out-of-range chapters/verses to valid bounds.
 * Returns a formatted reference string or null if no reasonable guess can be made.
 */
export function suggestPassage(input: string): string | null {
  if (!input) return null

  let cleanInput = input.trim()
  if (!cleanInput) return null

  // First, try parsing directly (handles ~ normalization, spacing, etc.)
  const direct = parseBibleReference(cleanInput)
  if (direct && !validateReference(direct)) {
    return formatReference(direct)
  }

  // If it parsed but has validation errors, try clamping
  if (direct) {
    const clamped = clampReference(direct)
    if (clamped) return formatReference(clamped)
  }

  // Try to find a book name match from the input
  // Strip numbers and punctuation from the end to isolate book name
  const bookOnly = cleanInput.replace(/[\d:;,.\-~\s]+$/, "").trim()
  if (!bookOnly) return null

  const foundBook = findBook(bookOnly)
  if (!foundBook) return null

  // We found a book — try to extract chapter:verse from the remaining text
  const remaining = cleanInput.slice(bookOnly.length).trim()
    .replace(/~/g, "-")
    .replace(/\s+/g, "")

  if (!remaining) {
    // Just a book name — suggest chapter 1
    return `${foundBook} 1`
  }

  // Try to parse chapter:verse from remaining
  const cvMatch = remaining.match(/^(\d+)(?::(\d+)(?:-(\d+))?)?/)
  if (cvMatch) {
    const chapter = parseInt(cvMatch[1], 10)
    const verseStart = cvMatch[2] ? parseInt(cvMatch[2], 10) : undefined
    const verseEnd = cvMatch[3] ? parseInt(cvMatch[3], 10) : undefined

    const ref: BibleReference = { book: foundBook, chapter, verseStart, verseEnd }
    const clamped = clampReference(ref)
    if (clamped) return formatReference(clamped)
  }

  // Fallback: just book + chapter 1
  return `${foundBook} 1`
}

/**
 * Clamps a BibleReference to valid bounds (chapter count, verse count).
 * e.g. John 1:22-193 → John 1:22-51 (John 1 has 51 verses)
 */
function clampReference(ref: BibleReference): BibleReference | null {
  const bookData = BIBLE_VERSE_COUNTS[ref.book]
  if (!bookData) return null

  let chapter = ref.chapter
  if (chapter < 1) chapter = 1
  if (chapter > bookData.length) chapter = bookData.length

  const maxVerse = bookData[chapter - 1]
  let verseStart = ref.verseStart
  let verseEnd = ref.verseEnd

  if (verseStart !== undefined) {
    if (verseStart < 1) verseStart = 1
    if (verseStart > maxVerse) verseStart = maxVerse
  }

  if (verseEnd !== undefined) {
    if (verseEnd > maxVerse) verseEnd = maxVerse
    if (verseStart !== undefined && verseEnd < verseStart) verseEnd = verseStart
  }

  return { book: ref.book, chapter, verseStart, verseEnd }
}

export function findBook(query: string): string | null {
  const q = query.toLowerCase().replace(/\./g, "")

  // Exact match
  const exact = BIBLE_BOOKS.find(b => b.toLowerCase() === q)
  if (exact) return exact

  // Starts-with match
  const starts = BIBLE_BOOKS.find(b => b.toLowerCase().startsWith(q))
  if (starts) return starts

  // Abbreviation match
  for (const [key, val] of Object.entries(BOOK_ABBREVIATIONS)) {
    if (key.toLowerCase() === q) return val
  }

  return null
}

export function formatReference(ref: BibleReference): string {
  let text = `${ref.book} ${ref.chapter}`
  if (ref.verseStart !== undefined) {
    text += `:${ref.verseStart}`
    if (ref.verseEnd !== undefined) text += `-${ref.verseEnd}`
  }
  return text
}

/**
 * Validate a Bible reference against actual verse counts.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateReference(ref: BibleReference): string | null {
  const bookData = BIBLE_VERSE_COUNTS[ref.book]
  if (!bookData) return `Unknown book: ${ref.book}`

  if (ref.chapter < 1 || ref.chapter > bookData.length) {
    return `${ref.book} has ${bookData.length} chapter${bookData.length === 1 ? "" : "s"}`
  }

  const maxVerse = bookData[ref.chapter - 1]

  if (ref.verseStart !== undefined) {
    if (ref.verseStart < 1) return `Verse must be at least 1`
    if (ref.verseStart > maxVerse) {
      return `${ref.book} ${ref.chapter} has ${maxVerse} verses`
    }
  }

  if (ref.verseEnd !== undefined) {
    if (ref.verseEnd < (ref.verseStart ?? 1)) return `End verse must be after start verse`
    if (ref.verseEnd > maxVerse) {
      return `${ref.book} ${ref.chapter} has ${maxVerse} verses`
    }
  }

  return null
}

/**
 * Verse counts per chapter for every book.
 * Each array entry is the number of verses in that chapter (1-indexed by array position).
 */
const BIBLE_VERSE_COUNTS: Record<string, number[]> = {
  "Genesis": [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
  "Exodus": [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
  "Leviticus": [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
  "Numbers": [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
  "Deuteronomy": [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
  "Joshua": [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
  "Judges": [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
  "Ruth": [22,23,18,22],
  "1 Samuel": [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,43,15,23,28,23,44,25,12,25,11,31,13],
  "2 Samuel": [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
  "1 Kings": [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
  "2 Kings": [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
  "1 Chronicles": [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
  "2 Chronicles": [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
  "Ezra": [11,70,13,24,17,22,28,36,15,44],
  "Nehemiah": [11,20,32,23,19,19,73,18,38,39,36,47,31],
  "Esther": [22,23,15,17,14,14,10,17,32,3],
  "Job": [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,35,27,26,40],
  "Psalms": [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
  "Proverbs": [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
  "Ecclesiastes": [18,26,22,16,20,12,29,17,18,20,10,14],
  "Song of Solomon": [17,17,11,16,16,13,13,14],
  "Isaiah": [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
  "Jeremiah": [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
  "Lamentations": [22,22,66,22,22],
  "Ezekiel": [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
  "Daniel": [21,49,30,37,31,28,28,27,27,21,45,13],
  "Hosea": [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
  "Joel": [20,32,21],
  "Amos": [15,16,15,13,27,14,17,14,15],
  "Obadiah": [21],
  "Jonah": [17,10,10,11],
  "Micah": [16,13,12,13,15,16,20],
  "Nahum": [15,14,19],
  "Habakkuk": [17,20,19],
  "Zephaniah": [18,15,20],
  "Haggai": [15,23],
  "Zechariah": [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
  "Malachi": [14,17,18,6],
  "Matthew": [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
  "Mark": [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
  "Luke": [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
  "John": [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
  "Acts": [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
  "Romans": [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
  "1 Corinthians": [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],
  "2 Corinthians": [24,17,18,18,21,18,16,24,15,18,33,21,14],
  "Galatians": [24,21,29,31,26,18],
  "Ephesians": [23,22,21,32,33,24],
  "Philippians": [30,30,21,23],
  "Colossians": [29,23,25,18],
  "1 Thessalonians": [10,20,13,18,28],
  "2 Thessalonians": [12,17,18],
  "1 Timothy": [20,15,16,16,25,21],
  "2 Timothy": [18,26,17,22],
  "Titus": [16,15,15],
  "Philemon": [25],
  "Hebrews": [14,18,19,16,14,20,28,13,28,39,40,29,25],
  "James": [27,26,18,17,20],
  "1 Peter": [25,25,22,19,14],
  "2 Peter": [21,22,18],
  "1 John": [10,29,24,21,21],
  "2 John": [13],
  "3 John": [14],
  "Jude": [25],
  "Revelation": [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21],
}
