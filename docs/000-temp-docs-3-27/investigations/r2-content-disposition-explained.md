# R2 Content-Disposition: What It Is, Why All 2,864 Files Need It, and Self-Critique

## What Is Content-Disposition?

Content-Disposition is an **HTTP header** — it has nothing to do with file content, JSON, HTML, or TipTap. It tells the browser what filename to use when a user downloads a file.

**Without** Content-Disposition:
```
User clicks "Download Handout" → browser saves as "a1b2c3d4-5e6f-7890-abcd-ef1234567890-handout.pdf"
```
The browser uses the R2 object key (which includes a UUID prefix) as the filename.

**With** Content-Disposition:
```
Content-Disposition: inline; filename="Week 1 Handout.pdf"; filename*=UTF-8''Week%201%20Handout.pdf
```
```
User clicks "Download Handout" → browser saves as "Week 1 Handout.pdf"
```

That's it. The script doesn't convert file formats, change content, or touch JSON/HTML. It adds a single HTTP header to each R2 object so downloads get the original filename.

---

## Why All 2,864 Objects Need Updating

### Timeline

| Date | What happened |
|------|---------------|
| **Mar 5** | R2 storage system built. `moveObject()` had no Content-Disposition param. |
| **Mar 5–25** | ~2,864 files uploaded and promoted (attachments + media). All without Content-Disposition. |
| **Mar 25** | `d3741f2` — `buildContentDisposition()` utility created, `moveObject()` updated to accept the header. Media promotion routes (`/api/v1/media`) updated. |
| **Mar 25** | Bug investigation — `sync-message-study.ts` also updated to pass Content-Disposition for Bible study attachments. |

**Result:** Every file uploaded in those 20 days lives in R2 without the header. The code fix only affects **new** uploads going forward. Existing files need a one-time backfill.

### What the backfill script does

1. Queries the DB for all `BibleStudyAttachment` records (name + URL) and `MediaAsset` records (filename + URL)
2. Derives the R2 object key from each URL
3. Calls `HeadObject` on each key to check if Content-Disposition exists (15 concurrent)
4. For any object missing the header: in `--execute` mode, downloads the file and re-uploads it to the **same key** with the Content-Disposition header added. File content is byte-identical — only metadata changes.

---

## Self-Critique: Is This the Right Approach?

### Arguments FOR the backfill

1. **It's the correct fix.** R2 (and S3) store Content-Disposition as object metadata. Once set, every subsequent download automatically gets the right filename. No application code needed at download time.

2. **DB-driven, not bucket-scan.** The script only checks files the DB knows about (2,842 entries), not every object in the bucket. Fast and targeted.

3. **Idempotent.** Running it twice is harmless — objects that already have the header are skipped.

4. **The code pipeline is fixed.** After `d3741f2`, all NEW uploads get Content-Disposition during promotion. The backfill is truly one-time for the historical gap.

### Arguments AGAINST / risks

1. **Re-uploading 2,864 files is heavy.** Each fix requires: `GetObject` (download full file) → `PutObject` (re-upload with header). For large files (PDFs, images), this is significant bandwidth. However, R2 doesn't support updating metadata in place — download-reupload is the only option (CopyObject is unreliable on R2, which is why `moveObject()` already uses this pattern).

2. **Could we solve this at the application layer instead?** Yes — instead of setting Content-Disposition on R2 objects, you could add a `Content-Disposition` header in a download proxy route (e.g., `/api/v1/download/[key]`). But this means:
   - Every download goes through your Next.js server instead of directly from R2's CDN
   - Adds latency and server load
   - Defeats the purpose of having a public R2 URL

   **Verdict:** Setting it on the R2 object is the right approach. Direct CDN downloads are faster and don't load your server.

3. **What if the DB filename is wrong?** The script trusts `BibleStudyAttachment.name` and `MediaAsset.filename` from the DB. If those are wrong (e.g., "untitled.pdf"), the download filename will also be wrong. But the DB is the source of truth for filenames — if it's wrong there, the CMS UI is already showing the wrong name too.

4. **What about orphaned R2 objects (not in DB)?** The script ignores them. If a file exists in R2 but has no DB record, it won't get a Content-Disposition. This is intentional — orphaned files shouldn't be served anyway. A separate cleanup script could delete orphans if needed.

---

## Separate Topic: TipTap JSON vs HTML

This is unrelated to Content-Disposition but worth documenting since it came up.

### How TipTap content flows in this project

```
CMS Editor (TipTap)
  ↓ saves as
TipTap JSON (ProseMirror document tree)
  ↓ stored in
Database columns: Message.rawTranscript, BibleStudy.content, etc.
  ↓ converted at display time by
generateHTML() / tiptapJsonToHtml()
  ↓ rendered as
HTML on the public website
```

### Why convert to HTML at all?

**TipTap JSON** is a structured document tree (nodes, marks, attributes). It looks like:
```json
{
  "type": "doc",
  "content": [
    { "type": "paragraph", "content": [
      { "type": "text", "text": "Hello world" }
    ]}
  ]
}
```

**The public website doesn't use TipTap** — it's a read-only Next.js site. To display this content, you need either:

| Approach | Pros | Cons |
|----------|------|------|
| **A. Convert to HTML on the server** | Fast render, no client-side TipTap needed, works with SSR, cacheable | Must keep extension list in sync |
| **B. Ship TipTap's renderer to the client** | Always in sync with editor | Adds ~50-100 KB to client bundle, requires "use client" |
| **C. Pre-render HTML at save time** | Zero runtime cost, simplest display | Stale if rendering logic changes, need to re-render all content |

### Current approach: Option A (convert on-the-fly)

The project uses `generateHTML()` from `@tiptap/html` on the server at render time. This is a good middle ground:
- No client-side TipTap dependency
- Always uses the latest rendering logic
- Source of truth stays as JSON (lossless, editor-compatible)

### Why not store only HTML?

TipTap JSON is the **editor-native format**. If you stored only HTML:
- Re-opening content in the CMS editor would require `generateJSON()` (HTML → JSON parsing), which is lossy
- You'd lose structured data (custom node attributes, marks metadata)
- Collaborative editing would break

**JSON is the source of truth. HTML is the display format.** This is the standard pattern for any block editor (TipTap, ProseMirror, Notion, etc.).

### Bug #8 context (transcript sync)

The specific issue was: `Message.rawTranscript` stores TipTap JSON, but `BibleStudy.transcript` expected HTML. The sync function (`syncMessageStudy`) wasn't converting between them. The fix added `tiptapJsonToHtml(rawTranscript)` during sync so the public website can display the transcript without shipping TipTap to the client.

---

## Summary

| Question | Answer |
|----------|--------|
| Why 2,864 objects? | Content-Disposition was never set on R2 objects until Mar 25. All files uploaded Mar 5–25 need it. |
| Is the backfill correct? | Yes. R2 metadata is the right place for download filenames. Re-upload is the only way to set it. |
| Future uploads covered? | Yes. `moveObject()` + `buildContentDisposition()` now runs during every promotion. |
| JSON vs HTML? | Unrelated to Content-Disposition. TipTap JSON is the source of truth; HTML is generated at display time. Standard pattern. |
