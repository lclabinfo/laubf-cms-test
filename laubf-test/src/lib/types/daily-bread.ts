export interface DailyBread {
  id: string;
  slug: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  passage: string; // e.g. "Psalm 2:1~12"
  keyVerse: string; // e.g. "12"
  body: string; // HTML devotional content
  bibleText: string; // HTML scripture text
  author: string;
  tags: string[];
  audioUrl?: string;
}
