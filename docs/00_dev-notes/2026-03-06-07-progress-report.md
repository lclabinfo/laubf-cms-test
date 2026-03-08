# Progress Report: March 6-7, 2026

**27 commits** across 2 days. Summary organized by area of work.

---

## 1. Bible Study Content Re-Migration (Critical Fix)

**Problem:** The original bulk migration stored raw HTML in the database, but the CMS TipTap editor expects JSON. This caused garbled/unreadable content for all 1,180 bible study entries in the CMS editor.

**What was done:**
- Built a comprehensive re-migration script (`scripts/remigrate-bible-study-content.mts`, 704 lines) that follows the same pipeline as the CMS manual import button:
  - `.doc` files: textutil (macOS) converts to HTML with full formatting
  - `.docx` files: mammoth.js converts to HTML
  - `.rtf` files: textutil converts to HTML (80 files previously skipped — now all imported)
  - HTML is then converted to TipTap JSON via `generateJSON()` with all editor extensions
  - Serif fonts (Times New Roman, etc.) are detected and preserved as `fontFamily` marks in the JSON
- Converted **2,723 files** total (1,204 .docx + 1,439 .doc + 80 .rtf)
- Updated **1,171 database records** with proper TipTap JSON
- Cleaned 5 corrupt UTF-8 entries
- 694 entries have serif font marks preserved
- **Verification: 1,180/1,180 entries pass all quality criteria (100%)**

**Public website fix:** Added `contentToHtml()` helper in `lib/tiptap.ts` that detects whether content is TipTap JSON or legacy HTML and converts accordingly. Applied to the bible study detail page so `dangerouslySetInnerHTML` receives proper HTML regardless of storage format.

**Deliverables:**
- `scripts/remigrate-bible-study-content.mts` — Re-migration script
- `scripts/bible-study-content.json` — Updated seed data (81.9 MB, TipTap JSON)
- `docs/bible-study-migration-audit.md` — Full audit (12,680 lines): catalog of all 1,180 entries, statistics, quality criteria, edge cases with passage/date metadata for cross-referencing
- `scripts/verification-report.json` — Machine-readable verification results
- `db-snapshots/2026-03-07-tiptap-remigration.dump` — PostgreSQL backup (30 MB)

**Known limitations:** 3 WordPerfect 5.1 files (`Js5b2003Q.doc`, `Js5a2003N.doc`, `Lk19a2003N.doc`) cannot be converted without a dedicated WP converter. These are from 2003 and affect 3 entries.

---

## 2. .doc Import Pipeline (New Feature)

**Problem:** The CMS only supported `.docx` import for bible study content. Many legacy files are `.doc` (Word 97-2003 format).

**What was built:**
- Server-side `.doc` to HTML conversion with layered fallback: textutil (macOS native) -> LibreOffice (cross-platform) -> word-extractor (JS-only)
- New API endpoint: `POST /api/v1/convert-doc`
- Font detection from CSS: parses both `font-family:` and shorthand `font:` declarations
- Inline CSS extraction: converts `<style>` block class rules into inline styles so HTML is self-contained
- Tab rendering: Apple-tab-span converted to em-spaces for TipTap
- Hanging indent normalization: numbered questions display correctly with number at left margin, wrapped text indented
- TipTap Indent extension updated: now parses and renders both `margin-left` and `text-indent` for hanging indent support

**Files created/modified:**
- `lib/doc-convert.ts` — Conversion pipeline (261 lines)
- `app/api/v1/convert-doc/route.ts` — API endpoint
- `lib/tiptap.ts` — Indent extension with `hangingIndent` attribute
- `lib/docx-import.ts` — Added `mergeAdjacentLists()` post-processing

---

## 3. Media Library — Full R2 Integration (Major Feature)

**Problem:** Media library UI existed but had no backend — no file storage, no persistence, no real upload flow.

**What was built:**

### Backend
- `lib/dal/media.ts` — 9 DAL functions: list (cursor-paginated), get, create, update, soft-delete, hard-delete, folders, bulk move, bulk delete
- `app/api/v1/media/` — Full REST API:
  - `GET /media` — Cursor-paginated list with folder/type/search filters
  - `POST /media` — Create record + promote from R2 staging to permanent
  - `GET/PATCH/DELETE /media/[id]` — Individual asset operations
  - `GET /media/[id]/usage` — Where is this asset used?
  - `POST /media/bulk-delete` — Batch soft-delete (up to 100)
  - `GET/POST /media/folders` — Folder CRUD
  - `PATCH/DELETE /media/folders/[id]` — Folder rename/delete
- `app/api/v1/storage/` — Storage usage endpoint with detailed breakdown
- `lib/dal/storage.ts` — Quota enforcement (10 GB per church)

### Storage Security (R2 Audit)
- Auth gate on upload-url endpoint (was allowing unauthenticated uploads)
- Per-church 10 GB quota enforcement before issuing presigned URLs
- ContentLength enforcement on presigned URLs (R2 validates body size matches)
- Per-type file size limits: 10 MB images, 100 MB audio, 200 MB video, 50 MB documents
- R2 rollback on DB insert failure (prevents orphaned R2 objects)

### Database
- New `MediaFolder` model with Prisma migration
- Updated indexes on `MediaAsset` for query performance

### Frontend
- Upload dialog with presigned URL flow, per-file status, quota error handling
- Folder management: create, rename, delete, drag-and-drop move
- Folders integrated as rows in DataTable (Google Drive style)
- Grid view: square cards with gradient overlay
- Storage dashboard page (`/cms/storage`) with usage bar, breakdown by type, top files
- Real storage counts in sidebar (not hardcoded)
- Dark mode border fix for Radix portals (Dialog, Popover, DropdownMenu)
- Import-from-attachments picker in study tab (pick existing uploaded files instead of re-uploading)
- Duplicate attachment detection with Skip/Replace/Keep Both options

---

## 4. CMS Editor Improvements

### Message Editor
- **False "unsaved changes" fix:** Auto-unpublish logic was running in a useEffect, mutating state after the snapshot was taken. Moved to synchronous initialization.
- **Video tab redesign:** 2-column layout — video + metadata on left, transcript editor on right. Full-width instead of constrained `max-w-3xl`.
- **Transcript data routing fix:** Transcript content was incorrectly appearing as a Bible Study tab. Now correctly routes to the Video tab's `rawTranscript` field. Affects 599 legacy messages.
- **Q/A tab contrast:** Dimmer inactive state, semibold active text for better tab visibility.
- **Watch Message button:** Now hidden when no video exists, links to actual message page (was hardcoded YouTube link).

### Rich Text Editor
- Replaced Code Block button with Edit Source HTML dialog (view/edit raw HTML with changes applied back to TipTap)
- Sync effect fix: `emitUpdate: false` on `setContent()` calls prevents cascading state mutations

### List Pages
- Session state persistence for search/filter/sort (survives back-navigation)
- Split loading states: initial load shows skeleton, filter changes show inline spinner (reduces jitter)
- Bible study page limit increased from 200 to 5000
- Videos page: replaced custom search bar with shared `FilterToolbar` component

---

## 5. Deployment Readiness

### Verification
- `npx prisma generate` — PASS
- `npm run build` — PASS (102 routes, 0 TypeScript errors)
- `npx prisma migrate status` — 19 migrations, schema up to date
- `npx prisma db seed` — PASS (all data seeded)

### Bug Fix
- **Seed config:** `package.json` referenced `prisma/seed.ts` but file is `prisma/seed.mts`. Fixed — would have failed on server deploy.

### Server Deployment Steps
1. Clone repo
2. `npm install`
3. Configure `.env` (DATABASE_URL, AUTH_*, R2_*, CHURCH_SLUG=la-ubf)
4. `npx prisma generate`
5. `npx prisma migrate deploy`
6. `npx prisma db seed`
7. `npm run build && npm start`

---

## 6. Documentation & Planning

### Deployment Roadmap (`docs/deployment-roadmap.md`)
Comprehensive roadmap with **31 work streams** across 4 priority tiers:
- **P0 (Launch Blockers):** 9 items — church profile/seed data, website builder fixes, DB cleanup, public website UI fixes, domain routing (laubf.org + admin.laubf.org), image pipeline (WebP/AVIF via Next.js Image), production deployment, auth hardening, daily bread page
- **P1 (Post-Launch):** 6 items — user management/roles, login/sign-up, transcript AI workflow, video clipping, announcements CMS, dashboard improvements
- **P2 (Polish):** 10 items — Cloudflare CDN, builder v2, list enhancements, events, SEO, media, ministries, prayer, notifications, testing
- **P3 (Platform):** 5 items — multi-tenant, billing, onboarding, superadmin, content generalization

Each item has actionable sub-tasks with checkboxes, dependency map, and AI implementation prompts.

### Bible Study Migration Audit (`docs/bible-study-migration-audit.md`)
12,680-line audit document covering:
- Full catalog of all 1,180 entries with attachment analysis
- Statistics (by year, book, format, document type)
- Edge cases with searchable metadata (title, passage, date):
  - 4 files missing from disk
  - 8 entries with no attachments
  - 80 RTF files (all now imported)
  - 6 RTF files disguised as .doc
  - 3 WordPerfect files (unconvertible)
  - 9 duplicate filename cases
- Quality pass criteria (7 rules)

---

## Commit Summary by Date

### March 6, 2026 (16 commits)
| Commit | Area | Description |
|--------|------|-------------|
| b359ece | CMS UX | Persist search/sort state, reduce table jitter, media sidebar polish |
| 6305c2a | Editor | Replace Code Block with Edit Source HTML dialog |
| 510f78f | Editor | Fix false "unsaved changes" warning |
| 02d8d05 | Storage | R2 audit: auth, quota, ContentLength, bucket routing |
| 8115750 | Docs | Fix doc/code inconsistencies from R2 audit |
| 9ea14e4 | Media | Full R2 integration (DAL, API, UI) |
| 78302c6 | Bible Study | Fix display regression, add .doc import, fix list rendering |
| 91475d1 | Config | Fix media bucket name, wire next.config.ts |
| f630ef2 | .doc Import | Fix font detection for shorthand CSS |
| 1401e84 | .doc Import | Tab rendering, span inlining, indent normalization |
| 317c1cd | Editor | Fix transcript migration, video FilterToolbar, study detail UI |
| c53ced2 | TipTap | Add hanging indent support to Indent extension |
| 78b4961 | Migration | Update script to use improved .doc pipeline |
| 2cb637e | Media | Persist folders to DB, fix root view, wire storage usage |
| eeba3bc | Editor | Duplicate attachment detection, import-from-attachments picker |
| 0977ded | Migration | Re-migrate all content with full .doc formatting |

### March 7, 2026 (11 commits)
| Commit | Area | Description |
|--------|------|-------------|
| d9e6766 | Website | Fix Watch Message button visibility and link |
| 7dc377f | Migration | Re-migrate content: raw HTML -> TipTap JSON (the critical fix) |
| f2e0d69 | Editor | Video tab 2-column layout, hide .doc preview, Q/A contrast |
| 60ce77b | Website | Fix public rendering: TipTap JSON -> HTML at render time |
| 1714fc9 | Docs | Add metadata to migration audit edge case tables |
| c886e52 | Storage | MediaPicker, bulk delete, usage tracking, R2 bug fixes |
| abc6697 | Docs | Comprehensive deployment roadmap (30 work streams) |
| 214871a | Media | Drag-drop, folder rows in table, dark mode borders, upload fixes |
| fd9722c | Media + Docs | Fix drag-drop UI update, expand deployment roadmap |
| ff56fef | Docs | Add domain routing, image/WebP, daily bread, CDN to roadmap |
| 40883aa | Config | Fix prisma seed command (seed.mts not seed.ts) |

---

## Files Changed (Aggregate)

- **70+ files modified** across app/, components/, lib/, scripts/, docs/, prisma/
- **New API endpoints:** 12 (media CRUD, folders, storage, bulk-delete, usage, convert-doc)
- **New DAL modules:** media.ts, storage.ts (+ major updates to bible-studies.ts)
- **New Prisma migration:** MediaFolder table + index updates
- **New documentation:** 4 files (deployment roadmap, migration audit, doc-import guide, progress report)
- **Seed data updated:** bible-study-content.json regenerated with TipTap JSON (81.9 MB)
