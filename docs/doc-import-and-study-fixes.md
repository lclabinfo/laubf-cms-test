# Doc Import & Bible Study Fixes

**Date:** 2026-03-06
**Status:** In Progress
**Scope:** Bible study content regression, .doc file support, numbered list rendering

---

## 1. Issue Summary

Three issues were discovered during testing of the CMS messages editor, specifically around the Bible study tab and document import pipeline.

---

### Issue A: Bible Study Content Regression (CRITICAL)

**Symptom:** The CMS messages list page shows "Published" status for studies, but navigating to a message's study tab displays "No Bible Study Material."

**Reproduction URL:** `http://localhost:3000/cms/messages/e97c8699-be3b-4a37-afa0-7a26809f664b?tab=study`

**Root cause:** `fetchMessageById` in `lib/messages-context.tsx` was returning lightweight list data from the local in-memory cache instead of fetching full details from the API. The cache is populated by the paginated list endpoint, which uses `messageListInclude` (defined in `lib/dal/messages.ts`). This include object deliberately omits `relatedStudy` to avoid loading heavy text columns (questions, answers, transcript) for every row in the table.

When the detail view called `fetchMessageById(id)`, the function found the message in the local `messages` array and returned it immediately — without the `relatedStudy` join. The `apiMessageToCms()` adapter function calls `synthesizeStudySections(apiMsg.relatedStudy)`, which returns `undefined` when `relatedStudy` is missing, causing the study tab to show the empty state.

**Relevant data flow (before fix):**

```
List endpoint:   GET /api/v1/messages?page=1
                 → messageListInclude (speaker + series, NO relatedStudy)
                 → populates messages[] in context

Detail request:  fetchMessageById(id)
                 → finds message in local messages[] array
                 → returns cached data (missing relatedStudy)
                 → apiMessageToCms() → synthesizeStudySections(undefined) → undefined
                 → Study tab renders "No Bible Study Material"
```

**Fix:** Remove the early return from `fetchMessageById`. Always fetch full details from `GET /api/v1/messages/[slug]`, which uses `messageDetailInclude` (includes `relatedStudy` with attachments). The local cache is only appropriate for list rendering, not for detail views.

**Relevant data flow (after fix):**

```
Detail request:  fetchMessageById(id)
                 → always calls GET /api/v1/messages/{id}
                 → messageDetailInclude (speaker + series + relatedStudy + attachments)
                 → apiMessageToCms() → synthesizeStudySections(relatedStudy) → StudySection[]
                 → Study tab renders Q&A content
```

**Files:**
- `lib/messages-context.tsx` — `fetchMessageById` function
- `lib/dal/messages.ts` — `messageListInclude` vs `messageDetailInclude` definitions

---

### Issue B: .doc File Support Missing

**Symptom:** The CMS study tab's "Import" button accepts `.doc` uploads (the file picker allows them), but the import silently produces empty or broken content. No error is shown to the user.

**Root cause:** The document import pipeline (`lib/docx-import.ts`) uses mammoth.js, which only handles `.docx` (Office Open XML format). The `.doc` format (Word 97-2003) is a binary OLE compound document — a completely different file format that cannot be parsed by mammoth.js or any browser-side JavaScript library with formatting preservation.

**Fix:** Server-side conversion pipeline with a layered fallback strategy:

| Priority | Tool | Platform | Quality | Notes |
|---|---|---|---|---|
| 1 | `textutil -convert html` | macOS only | High | Built into macOS, preserves formatting well |
| 2 | `libreoffice --headless --convert-to html` | Cross-platform | High | Requires LibreOffice installation |
| 3 | `word-extractor` npm package | Cross-platform | Low | Pure JS, extracts plain text only (no formatting) |

**New files:**
- `lib/doc-convert.ts` — Server-side .doc conversion with cascading fallback
- `app/api/v1/convert-doc/route.ts` — POST endpoint accepting multipart/form-data with .doc file

**Modified files:**
- `components/cms/messages/entry/study-tab.tsx` — Routes `.doc` files through the server API instead of the browser-side mammoth pipeline

**New dependency:**
- `word-extractor` — npm package for pure-JS .doc text extraction (last-resort fallback)

---

### Issue C: Numbered List Rendering

**Symptom:** Numbered lists imported from .docx files render with "1." for every item when the source document has blank paragraphs between list items.

**Root cause:** mammoth.js creates a new `<ol>` element each time it encounters a list item after a non-list paragraph. When a Word document has blank paragraphs between numbered list items (common in study materials), mammoth outputs:

```html
<ol><li>First item</li></ol>
<p></p>
<ol><li>Second item</li></ol>   <!-- starts at 1 again -->
<p></p>
<ol><li>Third item</li></ol>    <!-- starts at 1 again -->
```

Each `<ol>` restarts numbering at 1. The browser renders all items as "1."

**Fix:** Post-processing step in `lib/docx-import.ts` that merges consecutive `<ol>` (and `<ul>`) elements separated only by empty paragraphs into a single list element. The `mergeAdjacentLists()` function uses regex to detect the pattern and recombine the lists:

```html
<!-- After merge -->
<ol>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ol>
```

The heuristic only merges when the content between lists consists entirely of empty paragraphs (no real text), preserving intentionally separate lists.

**File:** `lib/docx-import.ts` — `mergeAdjacentLists()` function (lines 460-488)

---

## 2. Implementation Checklist

### Issue A: Bible Study Content Regression
- [ ] Fix `fetchMessageById` regression in `lib/messages-context.tsx` — remove early return from cache, always fetch from API

### Issue B: .doc File Support
- [ ] Create `lib/doc-convert.ts` with server-side .doc conversion (textutil / libreoffice / word-extractor fallback chain)
- [ ] Create `POST /api/v1/convert-doc` endpoint (`app/api/v1/convert-doc/route.ts`)
- [ ] Update `components/cms/messages/entry/study-tab.tsx` to route `.doc` files through server API
- [ ] Install `word-extractor` npm package

### Issue C: Numbered List Rendering
- [ ] Add `mergeAdjacentLists()` post-processing to `lib/docx-import.ts`

### Future Work (not in this sprint)
- [ ] Migration script for fetching pre-converted HTML from laubf.org (~554 bible study files)

---

## 3. Architecture Decisions

### Why server-side conversion is needed for .doc files

The `.doc` format (Word 97-2003, also known as OLE2/BIFF) is a binary compound document format. Unlike `.docx` (which is a ZIP archive of XML files), `.doc` files cannot be meaningfully parsed in the browser:

- **mammoth.js** — Only handles `.docx`. Explicitly does not support `.doc`.
- **Browser APIs** — No native browser API exists for reading OLE2 binary structures.
- **Pure-JS parsers** — `word-extractor` can extract plain text but loses all formatting (bold, italic, lists, headings, alignment).

Server-side tools like `textutil` (macOS) and LibreOffice can read the binary format natively because they link against system-level document parsing libraries (Cocoa text system on macOS, OLE2 libraries on Linux).

### Why a layered fallback approach

No single conversion tool is universally available:

| Tool | Availability | Trade-off |
|---|---|---|
| `textutil` | macOS only (built-in) | Best quality on dev machines, unavailable in Linux production |
| `libreoffice` | Requires explicit install | Excellent quality, but adds ~500MB to server image |
| `word-extractor` | Pure npm package | Always available, but plain text only — no formatting |

The cascading strategy means:
- **Development (macOS):** Uses `textutil` automatically — zero setup required.
- **Production (Linux):** Uses LibreOffice if installed, otherwise falls back to `word-extractor`.
- **Graceful degradation:** Even the worst case (plain text) gives the user editable content rather than a silent failure.

### Why the old site's pre-converted HTML is the best source for legacy .doc content

The legacy LA UBF website at `laubf.org/documentation/bible/` already has ~554 bible study documents that were converted from `.doc` to HTML at some earlier point. These pre-converted HTML files:

- Preserve the original formatting as it was rendered at the time of conversion.
- Are publicly accessible (no authentication required).
- Cover the full historical archive of LA UBF bible study materials.

For bulk migration of legacy content, fetching these pre-converted files is far more reliable than attempting to re-convert 554 `.doc` files through the pipeline. The `.doc` conversion pipeline is primarily for **new uploads** through the CMS editor.

### Data flow: .doc file through the conversion pipeline

```
Browser                          Server
───────                          ──────
User selects .doc file
       │
       ├─ File extension check
       │  (.doc vs .docx)
       │
       ├─ .docx → mammoth.js (browser-side, existing pipeline)
       │
       └─ .doc  → POST /api/v1/convert-doc
                         │
                         ├─ Write to temp file
                         │
                         ├─ Try textutil (macOS)
                         │  └─ Success? → HTML
                         │
                         ├─ Try libreoffice (cross-platform)
                         │  └─ Success? → HTML
                         │
                         ├─ Try word-extractor (pure JS)
                         │  └─ Success? → Plain text as HTML <p> tags
                         │
                         ├─ Extract <body> content
                         ├─ Detect dominant font
                         │
                         └─ Return DocxConversionResult
                                    │
                         ┌──────────┘
                         │
                    HTML response
                         │
                    Parse to TipTap JSON
                         │
                    Load into RichTextEditor
```

---

## 4. Testing Notes

### Test file

- **File:** `Ex19a2007Q.doc` (Word 97-2003 format)
- **Content:** "A Kingdom of Priests and a Holy Nation" — Exodus 19:1-25
- **Expected:** Bible study Q&A material with numbered questions and formatted text

### Verification steps

1. **Issue A (study regression):**
   - Navigate to `/cms/messages` and find a message with "Published" study status.
   - Click into the message and switch to the Study tab.
   - Verify Q&A sections appear with content (not "No Bible Study Material").
   - Test URL: `/cms/messages/e97c8699-be3b-4a37-afa0-7a26809f664b?tab=study`

2. **Issue B (.doc support):**
   - In a message's Study tab, click Import on the Questions section.
   - Select a `.doc` file (e.g., `Ex19a2007Q.doc`).
   - Verify the file converts and content appears in the rich text editor.
   - Verify formatting is preserved (bold, numbered lists, headings).

3. **Issue C (numbered lists):**
   - Import a `.docx` file that contains numbered lists with blank lines between items.
   - Verify all items are numbered sequentially (1, 2, 3...) not all showing "1."
   - Check both `<ol>` and `<ul>` list types.

### Edge cases to verify

- `.doc` file with only plain text (no formatting) — should still import as paragraphs.
- Empty `.doc` file — should show an appropriate error, not crash.
- Large `.doc` file (>5MB) — should convert within timeout or fail gracefully.
- `.doc` file on Linux without textutil — should fall back to libreoffice or word-extractor.

---

## 5. Future Work

### Legacy content migration from laubf.org

The old LA UBF website hosts ~554 pre-converted bible study HTML files at `laubf.org/documentation/bible/`. These represent the full historical archive and are the most reliable source for bulk migration.

**Planned approach:**
1. Crawl `laubf.org/documentation/bible/` to inventory all available HTML files.
2. Fetch each HTML file and extract the `<body>` content.
3. Map each file to the corresponding `BibleStudy` record by slug or title match.
4. Store the HTML in `bible-study-content.json` as an intermediate format.
5. Import into the database, converting HTML to TipTap JSON for the editor.

**Estimated scope:** ~554 files. Many correspond to messages that already exist in the database but lack study content.

### Additional format support

- **`.rtf` (Rich Text Format):** Could use the same `textutil`/`libreoffice` pipeline. The `doc-convert.ts` module could be generalized to a `legacy-doc-convert.ts` that handles `.doc`, `.rtf`, and other legacy formats.
- **`.odt` (OpenDocument Text):** LibreOffice handles this natively. Lower priority since no existing content uses this format.

### Content quality improvements

- Post-import cleanup pass to normalize HTML structure (consistent heading levels, list formatting).
- Auto-detection of Q&A structure to split imported content into Questions and Answers sections automatically.

---

## File Reference

| File | Role |
|---|---|
| `lib/messages-context.tsx` | Client-side messages state; `fetchMessageById` regression location |
| `lib/dal/messages.ts` | DAL with `messageListInclude` vs `messageDetailInclude` |
| `lib/docx-import.ts` | Browser-side .docx-to-HTML conversion (mammoth.js) |
| `lib/doc-convert.ts` | Server-side .doc-to-HTML conversion (textutil/libreoffice/word-extractor) |
| `app/api/v1/convert-doc/route.ts` | POST endpoint for .doc conversion |
| `components/cms/messages/entry/study-tab.tsx` | Study tab UI with import functionality |
