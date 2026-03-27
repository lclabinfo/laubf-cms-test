# Codebase Cleanup Audit — Full Results

> Generated: 2026-03-26
> Audited by: 10 parallel agents scanning root files, docs/, scripts/, lib/, components/, app/, laubf-test/, figma-cms/, infra config, and planning files.

---

## Legend

| Action | Meaning |
|--------|---------|
| **DELETE** | Remove entirely — no longer needed |
| **ARCHIVE** | Move to `docs/.archive/` or remove from repo (preserved in git history) |
| **CONSOLIDATE** | Merge into another doc, then delete the original |
| **UPDATE** | Content is stale — refresh to reflect current state |
| **KEEP** | No action needed |

---

## 1. Root-Level Files (DELETE)

| File | Size | What It Is | Action | Reason |
|------|------|-----------|--------|--------|
| `approach-c-tabbed.jsx` | 42 KB | Prototype tabbed messages UI — hardcoded sample data, inline styles | **DELETE** | Abandoned design exploration. Not imported anywhere. Excluded from tsconfig. |
| `tmp-check-iframes.mts` | 0.4 KB | Quick test script for TipTap→HTML with YouTube embeds | **DELETE** | Temp debugging script (`tmp-` prefix). Function already in production code. |
| `docker-compose.yml` | ~1 KB | Docker PostgreSQL service setup | **DELETE** | Project uses native PostgreSQL per CLAUDE.md. Misleading if kept. |
| `r2-content-disposition-explained.md` | ? | Explanation doc for R2 content-disposition fix | **DELETE** | One-off investigation note. Fix is already in `scripts/backfill-content-disposition.mts`. |

---

## 2. Root-Level Investigation Docs (ARCHIVE after bugs resolved)

| File | Size | What It Is | Action | Reason |
|------|------|-----------|--------|--------|
| `bug-investigation-2026-03-25.md` | 34 KB | 12-bug stakeholder demo report | **ARCHIVE** | Most bugs already marked "Done". Archive once all resolved. |
| `event-sharing-investigation-2026-03-26.md` | 11 KB | 3 event sharing bugs deep-dive | **ARCHIVE** | All 3 bugs marked "Done". |
| `message-biblestudy-current-architecture.md` | 24 KB | Two-table architecture audit | **ARCHIVE** | Companion to proposed-schema. Move to `docs/` if keeping. |
| `message-biblestudy-proposed-schema.md` | 38 KB | Proposed Message+BibleStudy merge | **ARCHIVE** | Strategic planning doc. Move to `docs/` if keeping. |
| `permissions-audit.md` | 11 KB | Audit of all 49 permissions | **ARCHIVE** | Reference snapshot. Permissions are in code (`lib/permissions.ts`). |
| `pre-launch-audit.md` | 18 KB | Pre-launch security/functionality checklist | **KEEP** | Active launch blocker checklist with P0 items. |
| `scalability-audit.md` | 18 KB | Multi-tenant readiness audit | **ARCHIVE** | Phase D (not started). Move to `docs/05_multi-tenant-platform/`. |
| `server-memory-analysis.md` | 11 KB | 766 MB RSS breakdown | **ARCHIVE** | Most optimizations already applied. |
| `memory-storage-reduction-plan.md` | 3.7 KB | 25+ task checklist for memory/storage reduction | **ARCHIVE** | Many items complete. Remaining TODOs should move to backlog. |
| `laubf_cms_review.md` | 10 KB | Full project code review | **ARCHIVE** | Most action items addressed. |

---

## 3. Entire Directories (DELETE / ARCHIVE)

| Directory | Size | What It Is | Action | Reason |
|-----------|------|-----------|--------|--------|
| `laubf-test/` | **1.2 GB** | Legacy public website (separate Next.js app) | **DELETE** | 100% migrated to root `app/website/`. Zero code imports from root. 619 MB node_modules + 576 MB duplicate assets. CLAUDE.md says "being retired". |
| `figma-cms-2:11:26/` | **68 MB** | Vite-based Figma prototype export | **DELETE** | Zero runtime imports. 97% is PNG images. Available via Figma URL. Builder is 85% complete — prototype served its purpose. |
| `00_old_laubf_db_dump/` | **246 MB** | 3,262 legacy .doc files (2003–2012) | **DELETE** | Data already migrated to PostgreSQL. Zero code references. |
| `docs/old-db-migration/` | ~50 KB | 5 legacy MySQL migration docs | **ARCHIVE** | Migration completed. Historical reference only. |
| `docs/04_builder/old-system/` | ~20 KB | Old list-based builder plan | **ARCHIVE** | Superseded by `docs/04_builder/builder-roadmap.md` (canvas-based). |
| `docs/04_builder/worklog/` | ~30 KB | 4 completed implementation plans (Mar 18-20) | **ARCHIVE** | All 4 marked DONE. Nav DnD, editor system, nav labels, sidebar consolidation. |

---

## 4. Docs to Consolidate

| File | Merge Into | Reason |
|------|-----------|--------|
| `docs/deployment-roadmap.md` | `docs/implementation-roadmap.md` | Both track critical path with different emphasis. Make one "Pre-Launch Checklist" section. |
| `docs/implementation-roadmap.md` | `docs/00_dev-notes/development-status.md` | Both are status dashboards. `development-status.md` is authoritative per CLAUDE.md. |
| `docs/00_dev-notes/development-notes.md` | `CLAUDE.md` | Shadcn best practices — too specialized for standalone doc. |
| `docs/00_dev-notes/prd-gap-analysis.md` | Each PRD (`docs/01_prd/*.md`) | Merge gap status into each PRD as a "Status" section. |
| `docs/08_user-journeys/01-auth-edge-cases.md` | Consolidate all 5 auth docs → single `00-auth-reference.md` | 5 overlapping auth docs (edge cases, flow audit, QA improvements, QA checklist, Google vulnerability). |
| `docs/08_user-journeys/03-auth-flow-audit.md` | ↑ same | |
| `docs/08_user-journeys/04-qa-auth-flow-improvements.md` | ↑ same | |
| `docs/08_user-journeys/05-qa-auth-full-checklist.md` | ↑ same | |
| `docs/08_user-journeys/06-google-connect-vulnerability.md` | ↑ same | |
| `docs/bible-study-migration-audit.md` | DELETE (completed) | Migration done. Findings in current schema. |
| `docs/bible-study-refactor-changelog.md` | DELETE (completed) | Refactor done. Changes in git history. |
| `docs/doc-import-and-study-fixes.md` | DELETE (superseded) | One-off DOCX import work. Superseded by current implementation. |
| `docs/transcript-ai-flows.md` | DELETE (superseded) | Replaced by `docs/ai-transcript-services.md`. |
| `docs/messages-editor-spec.md` | `docs/00_dev-notes/messages-editor-refactor.md` | Low-level spec overlaps with refactor doc. |

---

## 5. Dead Code in `lib/` and `components/`

| File | Size | What It Is | Action | Reason |
|------|------|-----------|--------|--------|
| `lib/status.ts` | 13 lines | `ContentStatus` type + `statusDisplay` map | **DELETE** | Zero imports anywhere in codebase. |
| `lib/church-profile-data.ts` | 60 lines | Church profile data module | **DELETE** | Zero imports anywhere in codebase. |
| `lib/tiptap-image-upload.ts` | 50 lines | Legacy TipTap image upload handler | **DELETE** | Replaced by `lib/tiptap-server.ts` (308 lines). Not imported. |
| `components/component-example.tsx` | 495 lines | Demo/showcase UI components | **DELETE** | Not imported by any page or component. |
| `components/example.tsx` | 55 lines | Supporting component for above | **DELETE** | Only imported by `component-example.tsx`. |

---

## 6. Stale Scripts

| File | What It Is | Action | Reason |
|------|-----------|--------|--------|
| `scripts/apply-flat-paths.mts` | One-off legacy path transformation | **DELETE** | Dead code, never re-run. |
| `scripts/clean-content.mts` | HTML content format cleaner | **DELETE** | Superseded by TipTap migrations. |
| `scripts/clean-study-html.mts` | Study HTML markup cleaner | **DELETE** | Superseded by TipTap migrations. |
| `scripts/backfill-bible-text.mts` | Bible text backfill (8 rows only) | **DELETE** | Incomplete, replaced by better pipeline. |
| `scripts/backfill-study-content.mts` | Study content backfill | **DELETE** | Unclear purpose, part of old migration. |
| `scripts/parsed-laubfmaterial.ts` | 484 KB auto-generated parse output | **ARCHIVE** | Large generated file. Not referenced by active scripts. |
| `scripts/parsed-videolist.ts` | 74 KB auto-generated parse output | **ARCHIVE** | Large generated file. Not referenced by active scripts. |
| `scripts/legacy-file-map.json` | 453 KB legacy file path map | **ARCHIVE** | Historical reference only. |

---

## 7. Deprecated App Routes

| File | What It Is | Action | Reason |
|------|-----------|--------|--------|
| `app/cms/(dashboard)/website/pages/page.tsx` | Old website pages manager | **DELETE** | Explicitly marked deprecated in code comment. Replaced by builder. |

---

## 8. Unused API Endpoints (Flag — may be intentional)

| File | What It Is | Action | Reason |
|------|-----------|--------|--------|
| `app/api/v1/ai/transcribe/route.ts` | AI transcription | **FLAG** | No frontend calls. May be planned for future use. |
| `app/api/v1/ai/align-transcript/route.ts` | Transcript alignment | **FLAG** | No frontend calls. |
| `app/api/v1/ai/cleanup-captions/route.ts` | Caption cleanup | **FLAG** | No frontend calls. |
| `app/api/v1/ai/improve-transcript/route.ts` | Transcript improvement | **FLAG** | No frontend calls. |
| `app/api/v1/convert-doc/route.ts` | Legacy .doc→HTML conversion | **FLAG** | No frontend calls. May be one-off utility. |
| `app/api/v1/bible/route.ts` | Bible passage lookup | **FLAG** | No frontend calls. |
| `app/api/v1/youtube/captions/route.ts` | YouTube captions fetch | **FLAG** | No frontend calls. |

---

## Disk Space Impact Summary

| Item | Reclaimable | Priority |
|------|------------|----------|
| `laubf-test/` | **~1.2 GB** | HIGH |
| `00_old_laubf_db_dump/` | **~246 MB** | HIGH |
| `figma-cms-2:11:26/` | **~68 MB** | HIGH |
| Dead code + stale scripts + old docs | **~2 MB** | LOW (but cleaner repo) |
| **Total** | **~1.5 GB** | |
