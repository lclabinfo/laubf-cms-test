/* ── Bible Study Detail Types ──
 * Types for the public website bible study detail page.
 * These represent the serialized data passed from server to client component.
 */

export interface BibleStudyAttachment {
  name: string
  url: string
  type: "pdf" | "docx" | "image" | "other"
}

export interface BibleStudyDetail {
  id: string
  slug: string
  title: string

  /** Display name of the bible book (e.g. "John", "1 Corinthians") */
  book: string
  /** Full passage reference e.g. "John 21:1-25" */
  passage: string

  /** ISO date string for display (YYYY-MM-DD) */
  dateFor: string

  /** Series name */
  series: string
  /** Who delivered the related message */
  messenger?: string

  /** Key verse highlight */
  keyVerse?: { verse: string; text: string }

  /** Study questions - rich text HTML */
  questions: string
  /** Answers / study guide - rich text HTML */
  answers?: string
  /** Message transcript - rich text HTML */
  transcript?: string
  /** Scripture text - rich text HTML */
  bibleText?: string

  /** File attachments */
  attachments: BibleStudyAttachment[]
}

/* ── BibleBook display names ──
 * Use bibleBookLabel() from '@/lib/website/bible-book-labels'
 * for converting BibleBook enum values to display strings.
 */
