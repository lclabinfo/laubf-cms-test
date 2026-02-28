export interface BibleReference {
  book: string
  chapter: number
  verseStart: number
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
  const verseEnd = match[4] ? parseInt(match[4], 10) : undefined

  const foundBook = findBook(bookStr)
  if (!foundBook) return null

  return {
    book: foundBook,
    chapter,
    verseStart: verseStart || 1,
    verseEnd
  }
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
  if (ref.verseStart) {
    text += `:${ref.verseStart}`
    if (ref.verseEnd) text += `-${ref.verseEnd}`
  }
  return text
}
