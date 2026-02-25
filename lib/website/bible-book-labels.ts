import type { BibleBook } from '@/lib/db/types'

/**
 * Maps Prisma BibleBook enum values (e.g. FIRST_SAMUEL) to
 * human-readable display strings (e.g. "1 Samuel").
 *
 * This mapping is the canonical source for the entire app.
 * Import from here rather than creating inline mappings.
 */
export const BIBLE_BOOK_LABELS: Record<BibleBook, string> = {
  GENESIS: 'Genesis',
  EXODUS: 'Exodus',
  LEVITICUS: 'Leviticus',
  NUMBERS: 'Numbers',
  DEUTERONOMY: 'Deuteronomy',
  JOSHUA: 'Joshua',
  JUDGES: 'Judges',
  RUTH: 'Ruth',
  FIRST_SAMUEL: '1 Samuel',
  SECOND_SAMUEL: '2 Samuel',
  FIRST_KINGS: '1 Kings',
  SECOND_KINGS: '2 Kings',
  FIRST_CHRONICLES: '1 Chronicles',
  SECOND_CHRONICLES: '2 Chronicles',
  EZRA: 'Ezra',
  NEHEMIAH: 'Nehemiah',
  ESTHER: 'Esther',
  JOB: 'Job',
  PSALMS: 'Psalms',
  PROVERBS: 'Proverbs',
  ECCLESIASTES: 'Ecclesiastes',
  SONG_OF_SOLOMON: 'Song of Solomon',
  ISAIAH: 'Isaiah',
  JEREMIAH: 'Jeremiah',
  LAMENTATIONS: 'Lamentations',
  EZEKIEL: 'Ezekiel',
  DANIEL: 'Daniel',
  HOSEA: 'Hosea',
  JOEL: 'Joel',
  AMOS: 'Amos',
  OBADIAH: 'Obadiah',
  JONAH: 'Jonah',
  MICAH: 'Micah',
  NAHUM: 'Nahum',
  HABAKKUK: 'Habakkuk',
  ZEPHANIAH: 'Zephaniah',
  HAGGAI: 'Haggai',
  ZECHARIAH: 'Zechariah',
  MALACHI: 'Malachi',
  MATTHEW: 'Matthew',
  MARK: 'Mark',
  LUKE: 'Luke',
  JOHN: 'John',
  ACTS: 'Acts',
  ROMANS: 'Romans',
  FIRST_CORINTHIANS: '1 Corinthians',
  SECOND_CORINTHIANS: '2 Corinthians',
  GALATIANS: 'Galatians',
  EPHESIANS: 'Ephesians',
  PHILIPPIANS: 'Philippians',
  COLOSSIANS: 'Colossians',
  FIRST_THESSALONIANS: '1 Thessalonians',
  SECOND_THESSALONIANS: '2 Thessalonians',
  FIRST_TIMOTHY: '1 Timothy',
  SECOND_TIMOTHY: '2 Timothy',
  TITUS: 'Titus',
  PHILEMON: 'Philemon',
  HEBREWS: 'Hebrews',
  JAMES: 'James',
  FIRST_PETER: '1 Peter',
  SECOND_PETER: '2 Peter',
  FIRST_JOHN: '1 John',
  SECOND_JOHN: '2 John',
  THIRD_JOHN: '3 John',
  JUDE: 'Jude',
  REVELATION: 'Revelation',
}

/**
 * Convert a BibleBook enum value to its display label.
 * Returns the enum value itself as a fallback if not found.
 */
export function bibleBookLabel(book: string): string {
  return BIBLE_BOOK_LABELS[book as BibleBook] ?? book
}
