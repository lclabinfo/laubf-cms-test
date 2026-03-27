# CMS Bible Study Empty State Bug — Investigation & Fix Plan

> **Date**: 2026-03-27
> **Symptom**: CMS message detail pages show "No Bible Study Material" and "Empty" for the Bible Study tab, even though the public website renders the same study content correctly.
> **Affected**: ~1,152 out of 1,160 messages with `hasStudy=true`

---

## 1. The Symptom

In the hosted CMS, when opening a message like "let your hands be strong" (Mar 10, 2024):

- **Header**: Shows "No Study" badge (despite `hasStudy=true` in database)
- **Content Overview**: Shows "Bible Study: Empty"
- **Bible Study tab**: Shows "No Bible Study Material" with an empty editor
- **Attachments section**: Shows correctly (1 attachment: `Zechariah8_9-23_QS_24.docx`)
- **Public website**: Renders the study content (questions, answers) **correctly**

---

## 2. Why It Works Locally But Not on the Hosted Server

**Short answer**: It likely doesn't work locally either — but you may not have tested the same entries since the change.

The global omit was added in commit `674aa22` at **10:18 AM today** (2026-03-27). The local dev server (`next dev`) was restarted at **2:21 PM today**, which means it has the global omit active. If you open the same message ("let your hands be strong") locally, it should also show "No Bible Study Material."

However, there is a scenario where local might appear to work:

- **Prisma dev-mode singleton**: In `lib/db/client.ts:31`, the Prisma client is cached on `globalThis` in development. If you had a previous dev session running before the global omit was committed, and Next.js hot-reloaded the DAL modules without restarting the entire Node.js process, the cached Prisma client from before the commit would still be in memory — **without** the global omit. This would make local appear to work until a full restart.

- **Testing different entries**: Only 8 out of 1,176 messages have `studySections` populated directly on the Message table. Recent messages (created in the CMS, not migrated) store study content in `Message.studySections`. If you only tested recent entries locally, they would work because they don't rely on the `relatedStudy` fallback path.

**After a full `npm run dev` restart, local should exhibit the same bug.**

---

## 3. Root Cause — Step by Step

### The Two-Path Architecture

Study content lives in two places:

| Path | Field(s) | Records | Origin |
|------|----------|---------|--------|
| **Path A**: `Message.studySections` (JsonB) | Questions + Answers as JSON array | **8 messages** | Created/edited in CMS editor |
| **Path B**: `BibleStudy.questions/answers` (Text) | Questions and Answers as TipTap JSON strings | **1,152 messages** | Legacy MySQL migration |

The CMS adapter in `lib/messages-context.tsx:155` tries Path A first, falls back to Path B:

```typescript
const studySections = apiMsg.studySections ?? synthesizeStudySections(apiMsg.relatedStudy)
```

### The Global Omit Broke Path B

Commit `674aa22` added a global omit to `lib/db/client.ts:20-25`:

```typescript
omit: {
  message: { rawTranscript: true, liveTranscript: true, transcriptSegments: true, studySections: true },
  bibleStudy: { questions: true, answers: true, transcript: true, bibleText: true, keyVerseText: true },
  ...
}
```

The message detail query (`messageDetailInclude` at `lib/dal/messages.ts:50-61`) correctly opts back into Message fields via `messageDetailOmit`:

```typescript
const messageDetailOmit = {
  rawTranscript: false,
  liveTranscript: false,
  transcriptSegments: false,
  studySections: false,  // <-- opts back in for Message
}
```

But the `relatedStudy` include does **NOT** opt back in for BibleStudy fields:

```typescript
const messageDetailInclude = {
  speaker: speakerSelect,
  messageSeries: { include: { series: true }, ... },
  relatedStudy: {
    include: {
      attachments: { orderBy: { sortOrder: 'asc' } },
    },
    // MISSING: omit: { questions: false, answers: false, transcript: false, ... }
  },
}
```

### The Result

1. CMS loads message → `studySections` is `null` (only 8 messages have it)
2. Falls back to `synthesizeStudySections(relatedStudy)`
3. `relatedStudy` is loaded BUT `questions`, `answers`, `transcript` are **omitted** by global omit
4. `relatedStudy.questions` is `undefined`, `relatedStudy.answers` is `undefined`
5. `synthesizeStudySections()` checks `relatedStudy.questions || relatedStudy.answers` → both falsy
6. Returns `undefined` → CMS shows "No Bible Study Material"

**Attachments still work** because `BibleStudyAttachment` has no global omit — it's a relation table, not a field.

**The public website still works** because `getBibleStudyBySlug()` in `lib/dal/bible-studies.ts:82-86` uses its own `omit: bibleStudyDetailOmit` which explicitly sets `questions: false`, `answers: false`, etc.

---

## 4. Data Verification

```
Message "let your hands be strong" (id: 993b6fda-...):
  hasStudy: true
  studySections: NULL (not populated)
  relatedStudyId: ce629077-...

BibleStudy (id: ce629077-...):
  hasQuestions: true
  hasAnswers: false
  questions length: 5,626 chars (TipTap JSON)
  answers: NULL
  attachment_count: 1

Broader stats:
  Messages with studySections populated: 8
  Messages with studySections NULL: 1,168
  Messages with hasStudy=true but no studySections: 1,152
  Messages with relatedStudyId set: 1,161
```

---

## 5. Fix Options

### Option A: Add `omit` override to `messageDetailInclude` (Minimal, Targeted)

Add the BibleStudy field overrides to the `relatedStudy` include in the message detail query:

```typescript
// lib/dal/messages.ts
const messageDetailInclude = {
  speaker: speakerSelect,
  messageSeries: { ... },
  relatedStudy: {
    omit: {
      questions: false,
      answers: false,
      transcript: false,
      bibleText: false,
      keyVerseText: false,
    },
    include: {
      attachments: { orderBy: { sortOrder: 'asc' } },
    },
  },
}
```

**Pros:**
- One-line fix in the DAL
- No architectural change
- Only loads heavy fields when explicitly needed (detail/edit view)
- Consistent with the pattern already used for `messageDetailOmit`

**Cons:**
- Loads all 5 BibleStudy text fields even though the CMS only needs `questions` and `answers` (not `transcript`, `bibleText`, `keyVerseText`)
- Still relies on the runtime synthesis pattern (`synthesizeStudySections`)

**Memory impact:** Minimal — this only fires for single-record detail views, not list queries. A single BibleStudy record averages ~100 KB of text content.

### Option B: Selective `omit` — only opt in to needed fields

Only opt back in to the fields the CMS actually uses (`questions`, `answers`), keep the others omitted:

```typescript
relatedStudy: {
  omit: {
    questions: false,
    answers: false,
    // Keep these omitted — CMS doesn't use them from this path
    // transcript: true (default from global omit)
    // bibleText: true (default from global omit)
    // keyVerseText: true (default from global omit)
  },
  include: {
    attachments: { orderBy: { sortOrder: 'asc' } },
  },
},
```

**Pros:**
- More memory-efficient than Option A (~60 KB instead of ~100 KB)
- Only loads what the CMS study tab actually uses
- Still a one-line DAL change

**Cons:**
- If the CMS later needs `transcript` (e.g., for a transcript editing feature), this would need updating
- Slightly inconsistent with `bibleStudyDetailOmit` which opts in to everything

### Option C: Add `select` to relatedStudy for explicit field control

Instead of omit overrides, use `select` to be fully explicit:

```typescript
relatedStudy: {
  select: {
    id: true,
    questions: true,
    answers: true,
    transcript: true,
    hasQuestions: true,
    hasAnswers: true,
    hasTranscript: true,
    attachments: { orderBy: { sortOrder: 'asc' } },
  },
},
```

**Pros:**
- Fully explicit — documents exactly what the CMS needs
- No surprise fields loaded
- Immune to future global omit changes

**Cons:**
- Longer code, need to list every field
- If BibleStudy gets new fields the CMS needs, they must be added here
- `select` and `omit` can't be combined on the same level in Prisma

### Option D: Separate BibleStudy query in the CMS (Architecture change)

Instead of loading BibleStudy through the Message relation, have the CMS make a separate API call to `/api/v1/bible-studies/[slug]` when the user opens the Bible Study tab.

**Pros:**
- Clean separation: Message loads Message data, BibleStudy loads BibleStudy data
- No heavy fields loaded until the user actually clicks the Bible Study tab
- Better for memory — lazy-loads content on demand

**Cons:**
- Requires CMS frontend changes (new API call, loading state)
- More complexity
- The current architecture tightly couples Message and BibleStudy in the CMS

---

## 6. Recommended Fix: Option B

**Option B (selective omit)** is the best balance:

1. **It fixes the immediate bug** — questions and answers are loaded for the CMS study tab
2. **It's memory-conscious** — doesn't load `transcript` (avg 42 KB), `bibleText` (avg 3 KB), or `keyVerseText` unnecessarily
3. **It's a one-location change** — only touches `lib/dal/messages.ts`
4. **It follows the existing pattern** — uses `omit` overrides like `messageDetailOmit` already does
5. **No frontend changes needed** — `synthesizeStudySections()` will work as designed once it receives the data

The change:

```typescript
// lib/dal/messages.ts — messageDetailInclude
relatedStudy: {
  omit: {
    questions: false,
    answers: false,
  },
  include: {
    attachments: { orderBy: { sortOrder: 'asc' as const } },
  },
},
```

**Files changed:** 1 (`lib/dal/messages.ts`)
**Memory impact:** +~60 KB per CMS message detail view (questions avg 6 KB + answers avg 56 KB)
**Risk:** None — only affects the CMS detail view, not list queries or public website

---

## 7. Verification After Fix

1. Open "let your hands be strong" in CMS → should show questions in Bible Study tab
2. Check header badge changes from "No Study" to "Study Live" (or "Study Draft")
3. Content Overview should show "Bible Study: Added"
4. Attachments should still show (unchanged)
5. Public website should still render correctly (unchanged — uses separate query)
6. Check a few other migrated messages (pre-2025) to confirm they also show content
7. Check the 8 messages with `studySections` populated — should still work (Path A takes priority)
