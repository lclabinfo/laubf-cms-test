# Messages Editor — UI Spec

> Context doc for UI/layout exploration. Covers what the messages editor is, what data it manages, and how the dual-content model (Video + Bible Study) works.

## What Is a "Message"?

A **Message** is the primary content unit — it represents a sermon or Bible study lesson delivered on a specific date. Each message can contain **two types of rich content** side by side:

1. **Video** — sermon recording (YouTube/Vimeo embed, transcript, captions)
2. **Bible Study** — study material (questions, answers, custom sections with rich text)

These are not separate entities. They live together as one entry because the study material is always tied to the sermon it accompanies. A message can have video only, study only, or both.

---

## Content Shape

### Core Metadata (sidebar)
| Field | Notes |
|---|---|
| **Title** | Required. The sermon/lesson name |
| **Status** | Draft, Published, Scheduled, Archived |
| **Message Date** | When the sermon was preached |
| **Scheduled Post Date** | Only when status = Scheduled (date + time) |
| **Speaker** | Searchable select from DB, or free-text custom name |
| **Series** | Optional. Groups messages into a named collection |
| **Scripture Passage** | Smart input with book autocomplete, chapter:verse parsing, and validation (see [Bible Passage Input](#bible-passage-input) below) |
| **Description** | Brief summary for listings and SEO |
| **Attachments** | Uploaded files (PDF, DOCX, images) |

### Video Tab
| Field | Notes |
|---|---|
| **Video URL** | YouTube or Vimeo link with platform detection |
| **Video Preview** | Embedded iframe when URL is valid |
| **Video Description** | Textarea |
| **Duration** | e.g. "45:32" |
| **Audio URL** | Optional MP3/podcast link |
| **Prepared Transcript** | Raw text (textarea, monospace) |
| **Synced Transcript** | Timestamped segments: start, end, text |
| **Live Captions** | Auto-generated caption text |

Transcript tools: upload .TXT/.SRT/.VTT, import from YouTube, generate via AI, auto-align to timestamps, download as .TXT or .SRT. (AI features are stubbed.)

### Bible Study Tab
| Field | Notes |
|---|---|
| **Sections** | Flexible list of named tabs (default template: "Questions" + "Answers") |
| **Section Content** | Rich text editor (TipTap) per section — headings, lists, bold, links, images, blockquotes |
| **Import** | Upload .DOCX or .TXT to populate a section |

Admins can add/rename/delete sections freely. Common patterns: Questions, Answers, Discussion Notes, Key Verse, Application.

---

## Content Relationships

```
Series (collection)
  └── Message 1 (sermon entry)
        ├── Video content (embed + transcript)
        ├── Bible Study content (rich text sections)
        ├── Speaker (who preached)
        └── Attachments (downloadable files)
  └── Message 2
        └── ...
```

- **Message ↔ Series**: many-to-many (a message can belong to multiple series)
- **Message ↔ Speaker**: many-to-one (each message has one speaker)
- **Message → Bible Study**: auto-synced. When a message has study content, a linked BibleStudy record is created for the public `/bible-study` page. Sections titled "Questions"/"Answers"/"Transcript" map to dedicated fields.
- **Series** have: name, cover image, description, ordered list of messages

---

## Resource Indicators

Each message shows two quick-glance icons in list views:

- **Video indicator** — filled blue if `hasVideo`, gray if not
- **Study indicator** — filled purple if `hasStudy`, gray if not

These let admins scan which messages are complete vs. need content added.

---

## Status Model

| Status | Meaning |
|---|---|
| **Draft** | Private, only admins see it. Default for new entries. |
| **Published** | Live on the public website |
| **Scheduled** | Will auto-publish at a set date/time |
| **Archived** | Hidden from public, data preserved |

---

## Current Page Structure

### Messages List (`/cms/messages`)
- **Tabs**: "All Messages" | "Series"
- **All Messages tab**: data table with search, status/speaker/series filters, sortable columns (title, speaker, date), bulk select
- **Series tab**: card grid showing series with cover image, name, message count
- **Row click** → opens editor at `/cms/messages/[id]`

### Message Editor (`/cms/messages/[id]` or `/cms/messages/new`)
- **Layout**: header bar + two-column (main content area + metadata sidebar)
- **Header**: back button, title input, status badge, save/publish button
- **Main area**: tab switcher — **Video** | **Bible Study**
- **Sidebar**: status, dates, speaker, series, passage, attachments
- **No read-only detail view exists** — list navigates directly to edit

### Series Detail (`/cms/messages/series/[id]`)
- Series name + cover image editing
- Ordered message list with drag-to-reorder
- Add/remove messages dialog

---

## Key UX Patterns

1. **Dual-content tabs** — Video and Bible Study are peer tabs, not nested. Either can be empty. A message is "publishable" if it has at least one.
2. **Metadata sidebar** — always visible alongside content. Status + speaker + date are the most-changed fields.
3. **Transcript is nested inside Video tab** — raw text or synced segments, switchable. Import tools live here.
4. **Study sections are sub-tabs** — each section is its own tab with a rich text editor. Admins name them freely.
5. **Optimistic saves** — UI updates immediately, API syncs in background. Errors trigger rollback + toast.
6. **Weekly workflow** — posting a new sermon is the highest-frequency admin task. The flow should optimize for: paste video URL → add study material → set metadata → publish.

---

## Bible Passage Input

The passage field uses `BiblePassageInput`, a custom autocomplete component for structured Bible reference entry.

### UX Flow
1. **Book autocomplete** — type a book name (or abbreviation like "Rom") → dropdown shows matching books (max 5)
2. **Chapter:Verse entry** — select book, continue typing chapter and verse range (e.g., "12:1-9")
3. **Validation indicator** — green dot appears when a valid reference is detected
4. **Confirm** — press Enter to lock in the selection, displayed as styled text with X to clear
5. **Keyboard navigation** — arrow keys navigate suggestions, Enter selects, Escape closes

### Output Format
```ts
interface BibleReference {
  book: string;        // "Genesis", "1 Corinthians", etc.
  chapter: number;     // Chapter number
  verseStart: number;  // Starting verse (defaults to 1 if only chapter given)
  verseEnd?: number;   // Ending verse (for ranges like "1-9")
}
```

Passage is stored as a formatted string: `"Genesis 12:1-9"`, `"John 3:16"`, `"1 Corinthians 13:1-8"`.

### Bible Text API Integration
When a message with study content is published, the sync pipeline automatically fetches scripture text:

1. `syncMessageStudy()` calls `fetchBibleText(passage)` from `lib/bible-api.ts`
2. Fetches from `https://bible-api.com/{passage}?translation=web` (World English Bible, public domain)
3. Formats response as HTML with `<sup>` verse numbers
4. Stores in `BibleStudy.bibleText` field
5. Public website renders via `dangerouslySetInnerHTML` in the Bible tab

**BibleGateway links** are constructed from the passage string for "Read on BibleGateway" buttons, using ESV as the default version.

### Key Files
| File | Purpose |
|---|---|
| `lib/bible-data.ts` | 66 books, 50+ abbreviations, reference parser |
| `lib/bible-api.ts` | `fetchBibleText()`, `getBibleGatewayUrl()` |
| `components/cms/messages/entry/bible-passage-input.tsx` | Autocomplete input component |
| `app/api/v1/bible/route.ts` | Client-side bible text preview endpoint |
| `lib/dal/sync-message-study.ts` | Sync pipeline (calls fetchBibleText) |

---

## What's Not Built Yet

- Read-only message detail/preview page
- Speaker and series filters in toolbar (UI exists, handlers not wired)
- Bulk action handlers (publish/archive/delete selected)
- Mobile responsive card layout for message list
- "Feature sermon" toggle (pin to top)
- Livestream link button
- Google Drive import for study content
- Per-message analytics (views, clicks)
