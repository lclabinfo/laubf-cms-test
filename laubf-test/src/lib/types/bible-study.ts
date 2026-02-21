/* ── Bible Study Types ── */

/** All 66 books of the Bible */
export type BibleBook =
  | "Genesis" | "Exodus" | "Leviticus" | "Numbers" | "Deuteronomy"
  | "Joshua" | "Judges" | "Ruth" | "1 Samuel" | "2 Samuel"
  | "1 Kings" | "2 Kings" | "1 Chronicles" | "2 Chronicles"
  | "Ezra" | "Nehemiah" | "Esther" | "Job" | "Psalms"
  | "Proverbs" | "Ecclesiastes" | "Song of Solomon"
  | "Isaiah" | "Jeremiah" | "Lamentations" | "Ezekiel" | "Daniel"
  | "Hosea" | "Joel" | "Amos" | "Obadiah" | "Jonah"
  | "Micah" | "Nahum" | "Habakkuk" | "Zephaniah" | "Haggai"
  | "Zechariah" | "Malachi"
  | "Matthew" | "Mark" | "Luke" | "John" | "Acts"
  | "Romans" | "1 Corinthians" | "2 Corinthians"
  | "Galatians" | "Ephesians" | "Philippians" | "Colossians"
  | "1 Thessalonians" | "2 Thessalonians"
  | "1 Timothy" | "2 Timothy" | "Titus" | "Philemon"
  | "Hebrews" | "James" | "1 Peter" | "2 Peter"
  | "1 John" | "2 John" | "3 John" | "Jude" | "Revelation";

export type Testament = "old" | "new";

export interface BibleBookInfo {
  name: BibleBook;
  chapters: number;
  testament: Testament;
}

export interface BibleStudyAttachment {
  name: string;
  url: string;
  type: "pdf" | "docx" | "image" | "other";
}

export interface BibleStudy {
  id: string;
  slug: string;
  title: string;

  /** The book of the Bible (for filtering in Books view) */
  book: BibleBook;
  /** Full passage reference e.g. "John 21:1-25" */
  passage: string;

  /** When the study was published/posted */
  datePosted: string;
  /** The date the study is for (matches the Sunday/sermon date) */
  dateFor: string;

  /** Series name e.g. "Advent 2025", "John" */
  series: string;
  /** Who delivered the related message */
  messenger?: string;
  /** Link to related message/sermon (may be null if posted before message) */
  relatedMessageId?: string;

  /** Key verse highlight */
  keyVerse?: { verse: string; text: string };

  /**
   * Study questions — rich text HTML (from TinyMCE editor).
   * Stored as a single HTML blob rather than structured sections
   * since the editor produces freeform content.
   */
  questions: string;
  /** Answers / study guide — rich text HTML */
  answers?: string;
  /** Message transcript — rich text HTML */
  transcript?: string;
  /** Scripture text — rich text HTML */
  bibleText?: string;

  /** File attachments (PDFs, DOCXs, images) */
  attachments: BibleStudyAttachment[];

  /** Availability flags for card display */
  hasQuestions: boolean;
  hasAnswers: boolean;
  hasTranscript: boolean;
}

/** Derived series data for the Series view */
export interface BibleStudySeries {
  name: string;
  slug: string;
  studyCount: number;
  lastUpdated: string;
}

/** Bible books data with study count for the Books view */
export interface BibleBookWithStudyCount extends BibleBookInfo {
  studyCount: number;
}

/* ── Bible Books Reference Data ── */

export const BIBLE_BOOKS: BibleBookInfo[] = [
  // Old Testament (39 books)
  { name: "Genesis", chapters: 50, testament: "old" },
  { name: "Exodus", chapters: 40, testament: "old" },
  { name: "Leviticus", chapters: 27, testament: "old" },
  { name: "Numbers", chapters: 36, testament: "old" },
  { name: "Deuteronomy", chapters: 34, testament: "old" },
  { name: "Joshua", chapters: 24, testament: "old" },
  { name: "Judges", chapters: 21, testament: "old" },
  { name: "Ruth", chapters: 4, testament: "old" },
  { name: "1 Samuel", chapters: 31, testament: "old" },
  { name: "2 Samuel", chapters: 24, testament: "old" },
  { name: "1 Kings", chapters: 22, testament: "old" },
  { name: "2 Kings", chapters: 25, testament: "old" },
  { name: "1 Chronicles", chapters: 29, testament: "old" },
  { name: "2 Chronicles", chapters: 36, testament: "old" },
  { name: "Ezra", chapters: 10, testament: "old" },
  { name: "Nehemiah", chapters: 13, testament: "old" },
  { name: "Esther", chapters: 10, testament: "old" },
  { name: "Job", chapters: 42, testament: "old" },
  { name: "Psalms", chapters: 150, testament: "old" },
  { name: "Proverbs", chapters: 31, testament: "old" },
  { name: "Ecclesiastes", chapters: 12, testament: "old" },
  { name: "Song of Solomon", chapters: 8, testament: "old" },
  { name: "Isaiah", chapters: 66, testament: "old" },
  { name: "Jeremiah", chapters: 52, testament: "old" },
  { name: "Lamentations", chapters: 5, testament: "old" },
  { name: "Ezekiel", chapters: 48, testament: "old" },
  { name: "Daniel", chapters: 12, testament: "old" },
  { name: "Hosea", chapters: 14, testament: "old" },
  { name: "Joel", chapters: 3, testament: "old" },
  { name: "Amos", chapters: 9, testament: "old" },
  { name: "Obadiah", chapters: 1, testament: "old" },
  { name: "Jonah", chapters: 4, testament: "old" },
  { name: "Micah", chapters: 7, testament: "old" },
  { name: "Nahum", chapters: 3, testament: "old" },
  { name: "Habakkuk", chapters: 3, testament: "old" },
  { name: "Zephaniah", chapters: 3, testament: "old" },
  { name: "Haggai", chapters: 2, testament: "old" },
  { name: "Zechariah", chapters: 14, testament: "old" },
  { name: "Malachi", chapters: 4, testament: "old" },
  // New Testament (27 books)
  { name: "Matthew", chapters: 28, testament: "new" },
  { name: "Mark", chapters: 16, testament: "new" },
  { name: "Luke", chapters: 24, testament: "new" },
  { name: "John", chapters: 21, testament: "new" },
  { name: "Acts", chapters: 28, testament: "new" },
  { name: "Romans", chapters: 16, testament: "new" },
  { name: "1 Corinthians", chapters: 16, testament: "new" },
  { name: "2 Corinthians", chapters: 13, testament: "new" },
  { name: "Galatians", chapters: 6, testament: "new" },
  { name: "Ephesians", chapters: 6, testament: "new" },
  { name: "Philippians", chapters: 4, testament: "new" },
  { name: "Colossians", chapters: 4, testament: "new" },
  { name: "1 Thessalonians", chapters: 5, testament: "new" },
  { name: "2 Thessalonians", chapters: 3, testament: "new" },
  { name: "1 Timothy", chapters: 6, testament: "new" },
  { name: "2 Timothy", chapters: 4, testament: "new" },
  { name: "Titus", chapters: 3, testament: "new" },
  { name: "Philemon", chapters: 1, testament: "new" },
  { name: "Hebrews", chapters: 13, testament: "new" },
  { name: "James", chapters: 5, testament: "new" },
  { name: "1 Peter", chapters: 5, testament: "new" },
  { name: "2 Peter", chapters: 3, testament: "new" },
  { name: "1 John", chapters: 5, testament: "new" },
  { name: "2 John", chapters: 1, testament: "new" },
  { name: "3 John", chapters: 1, testament: "new" },
  { name: "Jude", chapters: 1, testament: "new" },
  { name: "Revelation", chapters: 22, testament: "new" },
];

/* ── Filter Types ── */

export interface BibleStudyFilters {
  search?: string;
  series?: string;
  book?: BibleBook;
  dateFrom?: string;
  dateTo?: string;
}

/* ── Filter Helper ── */

export function filterBibleStudies(
  studies: BibleStudy[],
  filters: BibleStudyFilters,
): BibleStudy[] {
  return studies.filter((s) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match =
        s.title.toLowerCase().includes(q) ||
        s.passage.toLowerCase().includes(q) ||
        s.series.toLowerCase().includes(q) ||
        (s.messenger?.toLowerCase().includes(q) ?? false);
      if (!match) return false;
    }
    if (filters.series && s.series !== filters.series) return false;
    if (filters.book && s.book !== filters.book) return false;
    if (filters.dateFrom && s.dateFor < filters.dateFrom) return false;
    if (filters.dateTo && s.dateFor > filters.dateTo) return false;
    return true;
  });
}

/** Derive unique series from studies list */
export function deriveSeries(studies: BibleStudy[]): BibleStudySeries[] {
  const map = new Map<string, { count: number; lastDate: string }>();
  for (const s of studies) {
    const existing = map.get(s.series);
    if (!existing) {
      map.set(s.series, { count: 1, lastDate: s.dateFor });
    } else {
      existing.count++;
      if (s.dateFor > existing.lastDate) existing.lastDate = s.dateFor;
    }
  }
  return Array.from(map.entries())
    .map(([name, data]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      studyCount: data.count,
      lastUpdated: data.lastDate,
    }))
    .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
}

/** Count studies per bible book */
export function countStudiesByBook(
  studies: BibleStudy[],
): Map<BibleBook, number> {
  const counts = new Map<BibleBook, number>();
  for (const s of studies) {
    counts.set(s.book, (counts.get(s.book) ?? 0) + 1);
  }
  return counts;
}
