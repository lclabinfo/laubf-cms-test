# Codebase Cleanup Audit — Complete Report

> **Generated**: 2026-03-26 | **Updated**: 2026-03-27 (full re-audit with 4 parallel agents)
> **Purpose**: Prepare for creating a fresh git repo with a clean, production-ready codebase.
> **Scope**: All files, directories, documentation, dead code, scripts, and .gitignore.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Repository Size Analysis](#2-repository-size-analysis)
3. [Large Directories to Delete](#3-large-directories-to-delete)
4. [Root-Level Files](#4-root-level-files)
5. [Dead Code](#5-dead-code)
6. [Scripts Cleanup](#6-scripts-cleanup)
7. [Documentation Reorganization](#7-documentation-reorganization)
8. [Deprecated Routes & Flagged API Endpoints](#8-deprecated-routes--flagged-api-endpoints)
9. [.gitignore for Fresh Repo](#9-gitignore-for-fresh-repo)
10. [Execution Checklist](#10-execution-checklist)

---

## Legend

| Action | Meaning |
|--------|---------|
| **DELETE** | Remove entirely — no longer needed |
| **ARCHIVE** | Move to `docs/archive/` (preserved in old git history, accessible if needed) |
| **CONSOLIDATE** | Merge into another doc, then delete the original |
| **UPDATE** | Content is stale — refresh to reflect current state |
| **KEEP** | No action needed |

---

## 1. Executive Summary

### Current repo: ~14 GB total

| Component | Size | In fresh repo? |
|-----------|------|----------------|
| `.git/` | 621 MB | No (fresh repo) |
| `.next/` (build cache) | 10 GB | No (regenerated) |
| `node_modules/` | 1.0 GB | No (regenerated) |
| `laubf-test/` (legacy app) | 1.2 GB | No (fully migrated) |
| `00_old_laubf_db_dump/` | 246 MB | No (data migrated) |
| `figma-cms-2:11:26/` | 68 MB | No (available in Figma) |
| `db-snapshots/` | 30 MB | No (use cloud backups) |
| `.playwright-mcp/` | 5.2 MB | No (per-environment) |
| `public/` (images/videos/fonts) | 339 MB | Yes (legitimate assets) |
| **Source code + config + docs** | **~200 MB** | **Yes** |

### Fresh repo estimate: ~550-700 MB

After `npm install` and `npm run build`, working directory would be ~12 GB (same as now minus the deleted directories). But the **repo itself** (what gets pushed/pulled) would be ~550-700 MB — down from the current ~2.5 GB tracked in git.

### Cleanup summary

| Category | Files | Action |
|----------|-------|--------|
| Large directories | 6 dirs (~1.6 GB) | DELETE |
| Root markdown files | 13 files | DELETE or ARCHIVE |
| Root code/config artifacts | 5 files | DELETE |
| Dead code (lib + components) | 6 files | DELETE |
| Stale scripts | ~30 files | DELETE |
| Documentation | 48 files to archive, 7 to delete, 11 to update | REORGANIZE |
| Deprecated routes | 1 page | DELETE |

---

## 2. Repository Size Analysis

### What a clean repo looks like

```
laubf-cms/                    # Fresh repo name
├── app/                      # Next.js routes (~50 MB)
├── components/               # UI components (~30 MB)
├── lib/                      # Business logic (~20 MB)
├── hooks/                    # React hooks (~1 MB)
├── prisma/                   # Schema + seed (~5 MB)
├── public/                   # Static assets (~339 MB) — .gitignore handles images/videos
├── scripts/                  # Active scripts only (~500 KB)
├── docs/                     # Reorganized docs (~2 MB)
├── CLAUDE.md                 # AI guidance
├── README.md                 # Project readme
├── .env.example              # Env template
├── next.config.ts            # Next.js config
├── package.json / lock       # Dependencies
├── tsconfig.json             # TypeScript config
├── proxy.ts                  # Domain routing
├── components.json           # shadcn/ui config
├── prisma.config.ts          # Prisma config
└── .gitignore                # Updated ignore rules
```

### Files to NOT copy to the new repo

```
# Directories
laubf-test/                   # 1.2 GB — fully migrated
00_old_laubf_db_dump/         # 246 MB — data migrated
figma-cms-2:11:26/            # 68 MB — available in Figma
db-snapshots/                 # 30 MB — use cloud backups
.next/                        # 10 GB — build artifact
node_modules/                 # 1.0 GB — regenerated
.git/                         # 621 MB — fresh repo
.playwright-mcp/              # 5.2 MB — per-environment

# Files
approach-c-tabbed.jsx         # 42 KB — abandoned prototype
tmp-check-iframes.mts         # 0.4 KB — temp debug script
ecosystem.config.js           # PM2 config with old server paths
.mcp.json                     # Per-environment MCP config
tsconfig.tsbuildinfo           # Build artifact
.DS_Store                     # macOS system file
```

---

## 3. Large Directories to Delete

| Directory | Size | What It Is | Evidence It's Safe to Remove |
|-----------|------|-----------|------------------------------|
| `laubf-test/` | **1.2 GB** | Legacy public website (separate Next.js app) | 100% migrated to `app/website/`. Zero imports from root. CLAUDE.md says "being retired". 619 MB node_modules + 576 MB assets. |
| `figma-cms-2:11:26/` | **68 MB** | Vite-based Figma prototype export | Zero runtime imports. 97% PNG images. Builder is 85%+ complete. Available via Figma URL. |
| `00_old_laubf_db_dump/` | **246 MB** | 3,262 legacy .doc files (2003-2012) | Data migrated to PostgreSQL. Zero code references. |
| `db-snapshots/` | **30 MB** | Database snapshot dumps | One-time backups. Use cloud backup strategy instead. |
| `.playwright-mcp/` | **5.2 MB** | MCP server artifacts | Per-environment. Should be installed fresh. |
| `public/pics-temp/` | **~6 MB** | 3 staging JPEG images | Temporary dev images (DSC01195.jpg, DSC05222.jpg, DSC05299.jpg). Not referenced in code. |

**Total reclaimable: ~1.56 GB**

---

## 4. Root-Level Files

### DELETE (remove entirely)

| File | Size | What It Is | Reason |
|------|------|-----------|--------|
| `approach-c-tabbed.jsx` | 42 KB | Prototype tabbed messages UI | Abandoned design exploration. Not imported. |
| `tmp-check-iframes.mts` | 0.4 KB | TipTap→HTML debug script | Temp script. Function in production code. |
| `ecosystem.config.js` | 0.4 KB | PM2 config with old `/home/ubfuser/` paths | Stale server paths. Recreate per-deployment. |
| `.mcp.json` | ~1 KB | Claude MCP config | Per-environment. Recreate as needed. |
| `docker-compose.yml` | ~1 KB | Docker PostgreSQL setup | Project uses native PostgreSQL. Misleading. |

### ARCHIVE (move to `docs/archive/` or just don't copy to new repo)

| File | Size | What It Is | Reason |
|------|------|-----------|--------|
| `bug-investigation-2026-03-25.md` | 34 KB | 12-bug stakeholder demo report | All bugs marked "Done". |
| `event-sharing-investigation-2026-03-26.md` | 11 KB | 3 event sharing bugs | All 3 fixed (commit `a74dbb9`). |
| `message-biblestudy-current-architecture.md` | 24 KB | Two-table architecture audit | Strategic doc for future merge. Move to `docs/02_database/`. |
| `message-biblestudy-proposed-schema.md` | 38 KB | Message+BibleStudy merge proposal | Strategic doc for future merge. Move to `docs/02_database/`. |
| `permissions-audit.md` | 11 KB | 49 permissions audit | Snapshot. Permissions live in `lib/permissions.ts`. |
| `scalability-audit.md` | 18 KB | Multi-tenant readiness audit | Phase D reference. Move to `docs/05_multi-tenant-platform/`. |
| `server-memory-analysis.md` | 11 KB | 766 MB RSS breakdown | Superseded by `docs/02_database/05-memory-audit.md`. |
| `memory-storage-reduction-plan.md` | 3.7 KB | Memory/storage task checklist | Most items complete. Superseded by memory audit. |
| `caching-memory-audit.md` | ~10 KB | Memory optimization planning | Superseded by `docs/04_infrastructure/memory-optimization-guide.md`. |
| `laubf_cms_review.md` | 10 KB | Full project code review | Most action items addressed. |
| `r2-content-disposition-explained.md` | ~5 KB | R2 Content-Disposition fix explanation | One-off investigation. Fix in production. |
| `codebase-cleanup-audit.md` | This file | **Move to `docs/` after execution** | Should live in docs, not root. |
| `pre-launch-audit.md` | 18 KB | Pre-launch checklist | Active checklist — **KEEP if still in use**, otherwise archive. |

### KEEP (copy to new repo)

| File | Reason |
|------|--------|
| `README.md` | Project documentation |
| `CLAUDE.md` | AI guidance (update after cleanup) |
| `BACKLOG.md` | Active backlog |
| `BACKLOG.csv` | Notion import format |
| `.env.example` | Environment template |
| `next.config.ts` | Next.js configuration |
| `tsconfig.json` | TypeScript configuration |
| `proxy.ts` | Domain routing middleware |
| `prisma.config.ts` | Prisma configuration |
| `components.json` | shadcn/ui registry |
| `package.json` / `package-lock.json` | Dependencies |
| `postcss.config.mjs` | PostCSS config |
| `GOOGLE_OAUTH_PRODUCTION_GUIDE.md` | Production deployment reference |

---

## 5. Dead Code

### Confirmed Dead Files (zero imports)

| File | Lines | What It Is | Evidence |
|------|-------|-----------|----------|
| `lib/url.ts` | ~50 | URL helpers (`getWebsiteUrl`, `getCmsUrl`, etc.) | Zero grep matches. Replaced by `lib/website/public-url.ts`. |
| `lib/status.ts` | 13 | `ContentStatus` type + `statusDisplay` map | Zero imports anywhere. |
| `lib/church-profile-data.ts` | 60 | Church profile data module | Zero imports anywhere. |
| `lib/tiptap-image-upload.ts` | 50 | Legacy TipTap image upload handler | Replaced by `lib/tiptap-server.ts`. Not imported. |
| `components/component-example.tsx` | 495 | Demo/showcase UI components | Not imported by any page. |
| `components/example.tsx` | 55 | Supporting component for above | Only imported by `component-example.tsx`. |

### Deprecated Route (already gated)

| File | What It Is | Status |
|------|-----------|--------|
| `app/cms/(dashboard)/website/pages/page.tsx` | Old pages manager | Marked deprecated in code. `devOnly: true`, hint "Moving into Builder". Remove sidebar entry in `app-sidebar.tsx` (lines 172-176) and delete the page. |

---

## 6. Scripts Cleanup

### DELETE (one-off / completed migration scripts)

| File | What It Is | Reason |
|------|-----------|--------|
| `scripts/apply-flat-paths.mts` | One-off path transformation | Dead code, never re-run |
| `scripts/clean-content.mts` | HTML content format cleaner | Superseded by TipTap migrations |
| `scripts/clean-study-html.mts` | Study HTML markup cleaner | Superseded by TipTap migrations |
| `scripts/backfill-bible-text.mts` | Bible text backfill (8 rows) | Incomplete, replaced by better pipeline |
| `scripts/backfill-study-content.mts` | Study content backfill | Part of old migration |
| `scripts/backfill-content-disposition.mts` | R2 metadata backfill | One-time script, completed |
| `scripts/migrate-*.mts` (~5 files) | Legacy data migrations | All migrations complete |
| `scripts/parse-*.py` (~2 files) | Legacy data parsing | Already migrated |
| `scripts/verify-*.mts` (~8 files) | Migration verification | Verifications passed, done |
| `scripts/seed-*.mts` (~2 files) | One-time seed scripts | Use `prisma/seed.mts` instead |
| `scripts/upload-*.mts` (~3 files) | Initial asset uploads | One-time uploads complete |
| `scripts/import-legacy-members.mts` | Legacy member import | Migration complete |
| `scripts/fix-*.mts` (~5 files) | Past bug fix scripts | Issues resolved |
| `scripts/deploy.sh` | Deployment script | Use CI/CD or recreate per-server |

### DELETE (large generated data files)

| File | Size | Reason |
|------|------|--------|
| `scripts/parsed-laubfmaterial.ts` | 484 KB | Auto-generated parse output. Not referenced. |
| `scripts/parsed-videolist.ts` | 74 KB | Auto-generated parse output. Not referenced. |
| `scripts/legacy-file-map.json` | 453 KB | Legacy file path map. Historical only. |
| `scripts/verify-*.json` (~2 files) | ~50 KB | Verification reports. One-time. |

### KEEP (active operational scripts)

| File | Reason |
|------|--------|
| `scripts/update-admin-permissions.mts` | Active: updates admin role permissions |
| Any script referenced in `package.json` scripts | Active tooling |

> **Recommendation**: After cleanup, the scripts/ directory should contain only actively-used operational scripts. Everything else is preserved in the old git history.

---

## 7. Documentation Reorganization

### 7a. Overview (131 files audited)

| Directory | Files | Keep | Update | Archive | Delete |
|-----------|-------|------|--------|---------|--------|
| `docs/00_dev-notes/` | 23 | 6 | 3 | 10 | 4 |
| `docs/01_prd/` | 5 | 4 | 1 | 0 | 0 |
| `docs/02_database/` | 5 | 4 | 1 | 0 | 0 |
| `docs/03_website-rendering/` | 9 | 5 | 2 | 0 | 0 |
| `docs/04_builder/` | 47 | 35 | 1 | 10 | 1 |
| `docs/04_infrastructure/` | 2 | 1 | 1 | 0 | 0 |
| `docs/04_proxy-routing/` | 1 | 0 | 1 | 0 | 0 |
| `docs/05_cdn-storage/` | 3 | 1 | 0 | 1 | 1 |
| `docs/05_multi-tenant-platform/` | 8 | 7 | 0 | 1 | 0 |
| `docs/06_r2-storage/` | 7 | 2 | 1 | 2 | 1 |
| `docs/07_product-thinking/` | 2 | 1 | 0 | 1 | 0 |
| `docs/08_user-journeys/` | 10 | 3 | 0 | 7 | 0 |
| Root-level docs | 19 | 8 | 1 | 10 | 0 |
| **Total** | **141** | **77** | **12** | **42** | **7** |

### 7b. docs/00_dev-notes/ — DELETE these

| File | Reason |
|------|--------|
| `church-profile-update-plan.md` | Fully executed. Single-use sprint plan. |
| `git-history-purge-plan.md` | Superseded — creating fresh repo instead. |
| `hero-video-investigation.md` | Bug resolved. One-time debug doc. |
| `passage-audit.md` | One-time cleanup pass. No ongoing relevance. |

### 7b. docs/00_dev-notes/ — ARCHIVE these

| File | Reason |
|------|--------|
| `codebase-audit-2026-02-27.md` | Feb 27 audit. Many issues fixed. Historical. |
| `auth-users-permissions-plan.md` | Auth is complete. Blueprint executed. |
| `bible-study-implementation.md` | Implementation done. Historical. |
| `deep-memory-analysis.md` | Superseded by memory-optimization-guide.md. |
| `messages-editor-refactor.md` | Refactor complete. |
| `rsc-theme-tokens-fix.md` | Bug fixed. Technical reference only. |
| `seed-vs-db-diff.md` | Data consistency analysis. Historical. |
| `website-audit.md` | Completed audit. |
| `standups/standup-2026-03-23.md` | Sprint history. |
| `onboarding-plan.md` | Plan executed (if onboarding complete). |

### 7b. docs/00_dev-notes/ — UPDATE these

| File | What Needs Updating |
|------|---------------------|
| `feature-catalog.md` | Add 2 new section types from March. Verify bulk action status. |
| `domain-hosting-plan.md` | Status says "NOT STARTED" but proxy routing is ~90% done. Contradicts deployment-roadmap. |
| `prd-gap-analysis.md` | Builder status outdated (says "NOT IMPLEMENTED" but builder is 85%+ complete since 3/20). |

### 7c. docs/04_builder/ — Cleanup

| Item | Action | Reason |
|------|--------|--------|
| `old-system/builder-plan.md` | DELETE | Superseded by canvas-based builder. |
| `worklog/` (14 files) | ARCHIVE | Sprint history (Mar 18-23). All tasks complete. |
| `backlogs/builder-ux-issues.md` | ARCHIVE | Status unclear. Move to archive or merge into BACKLOG.md. |
| `section-catalog/competitor-naming-audit.md` | ARCHIVE | Market research. Not actionable. |
| `section-catalog/future-consolidation-guide.md` | ARCHIVE | Deferred to Phase D+. |
| `section-catalog/future-editor-component-map.md` | ARCHIVE | Deferred. |
| `section-catalog/section-design-recommendation.md` | ARCHIVE | Design rationale. Not actionable. |
| `section-catalog/section-editor-gap-analysis.md` | UPDATE | Mark as RESOLVED — all 13 gaps closed per dev-guide-day1 (3/24). |
| `architecture/section-db-audit.md` | ARCHIVE | Completed audit. |
| `architecture/concurrent-nav-editing-edge-cases.md` | ARCHIVE | Analysis complete. |
| `architecture/subpage-template-brainstorm.md` | DELETE | Abandoned feature. Decision was NOT to do this. |

### 7d. Other docs directories

| File | Action | Reason |
|------|--------|--------|
| `docs/05_cdn-storage/01-platform-comparison.md` | ARCHIVE | Vendor decision made (Cloudflare R2). |
| `docs/05_cdn-storage/03-spreadsheet-verification.md` | DELETE | One-time cost calculation. |
| `docs/05_multi-tenant-platform/06-content-generalization.md` | ARCHIVE | Future planning. No current action. |
| `docs/06_r2-storage/03-bible-study-attachments-plan.md` | ARCHIVE | Implementation complete. |
| `docs/06_r2-storage/05-migration-checklist.md` | ARCHIVE | Phase 1→2 migration. Future reference. |
| `docs/06_r2-storage/06-upload-progress-tracker.md` | DELETE | Single-use progress tracking. |
| `docs/06_r2-storage/media-storage-system.md` | CONSOLIDATE into `02-storage-strategy.md` | Duplicate coverage. |
| `docs/07_product-thinking/02-groups-refactor-manual-testing.md` | ARCHIVE | Refactor complete. |
| `docs/08_user-journeys/03-auth-flow-audit.md` | ARCHIVE | Auth complete. |
| `docs/08_user-journeys/04-qa-auth-flow-improvements.md` | ARCHIVE | QA complete. |
| `docs/08_user-journeys/05-qa-auth-full-checklist.md` | ARCHIVE | QA complete. |
| `docs/08_user-journeys/06-google-connect-vulnerability.md` | ARCHIVE | Security fix documented. |
| `docs/08_user-journeys/07-dashboard-research.md` | ARCHIVE | Dashboard built. |
| `docs/08_user-journeys/08-messages-page-fixes.md` | ARCHIVE | Work complete. |
| `docs/08_user-journeys/10-builder-qa-checklist.md` | ARCHIVE | QA checklist from March 24. |
| `docs/old-db-migration/` (5 files) | ARCHIVE | Migration complete. Entire directory. |
| `docs/bible-study-migration-audit.md` | DELETE | Migration done. In git history. |
| `docs/bible-study-refactor-changelog.md` | DELETE | Refactor done. In git history. |
| `docs/bible-study-cleanup-plan.md` | DELETE | Cleanup done. In git history. |
| `docs/doc-import-and-study-fixes.md` | DELETE | Superseded by current implementation. |
| `docs/transcript-ai-flows.md` | ARCHIVE | Superseded by `ai-transcript-services.md`. |
| `docs/transcript-editor-redesign.md` | ARCHIVE | Design doc. Status unclear. |
| `docs/ai-transcript-services.md` | ARCHIVE | Feature research. Not in MVP scope. |

### 7e. Docs to UPDATE (verify accuracy)

| File | What's Wrong |
|------|-------------|
| `docs/00_dev-notes/domain-hosting-plan.md` | Says "NOT STARTED" — proxy routing is ~90% done |
| `docs/00_dev-notes/prd-gap-analysis.md` | Builder status outdated since 3/11 (now 85%+ complete) |
| `docs/00_dev-notes/feature-catalog.md` | Missing 2 new section types from March |
| `docs/01_prd/03-prd-system.md` | Auth marked as not implemented — it's COMPLETE |
| `docs/02_database/05-memory-audit.md` | Add "Fixes Applied" section (omit queries done 3/27) |
| `docs/03_website-rendering/06-hosting-domain-strategy.md` | "Custom domains" says "Coming Soon" — partial implementation exists |
| `docs/03_website-rendering/07-caching.md` | Phase E design doc — add "NOT STARTED" banner |
| `docs/04_builder/section-catalog/section-editor-gap-analysis.md` | Mark as RESOLVED — all gaps closed 3/24 |
| `docs/04_infrastructure/memory-optimization-guide.md` | Add implementation status tracking |
| `docs/04_proxy-routing/proxy-routing-architecture.md` | Contradicts domain-hosting-plan on completion status |
| `docs/06_r2-storage/04-media-library-plan.md` | Clarify: UI done, R2 backend integration NOT done |
| `docs/featured-events-edge-cases.md` | Verify which edge cases are fixed |

### 7f. Contradictions Found

| Issue | Documents | Resolution |
|-------|-----------|-----------|
| Domain routing status | `domain-hosting-plan.md` says "NOT STARTED"; `proxy-routing-architecture.md` shows ~90%; `deployment-roadmap` says 90% | Update domain-hosting-plan to match deployment-roadmap |
| Builder status | `prd-gap-analysis.md` (3/11) says "NOT IMPLEMENTED"; `builder-roadmap.md` (3/20) says "all editors complete" | prd-gap-analysis is outdated. Update or delete. |
| Media library | `feature-catalog.md` says grid/list done; `04-media-library-plan.md` says "not implemented" | UI done, R2 backend NOT done. Clarify in both. |
| Section editors | `section-editor-gap-analysis.md` lists gaps; `dev-guide-day1` marks all gaps closed 3/24 | Gap analysis is stale. Mark RESOLVED. |

### 7g. Proposed docs/ structure for fresh repo

```
docs/
├── 00_dev-notes/
│   ├── development-status.md          # KEEP — master status dashboard
│   ├── development-notes.md           # KEEP — architectural best practices
│   ├── feature-catalog.md             # UPDATE — add new sections
│   ├── security-audit-2026-03-16.md   # KEEP — current security baseline
│   ├── design-tokens.md               # KEEP — CSS variable reference
│   ├── memory-monitoring-guide.md     # KEEP — operational utility
│   ├── vm-deployment-prompt.md        # KEEP — Phase F reference
│   └── prd-gap-analysis.md            # UPDATE — fix builder status
│
├── 01_prd/
│   ├── 00-primary-user-profile.md     # KEEP
│   ├── 01-prd-cms.md                  # KEEP
│   ├── 02-prd-website-builder.md      # KEEP
│   ├── 03-prd-system.md               # UPDATE — mark auth complete
│   └── 04-prd-member-management.md    # KEEP
│
├── 02_database/
│   ├── 01-architecture.md             # KEEP
│   ├── 02-cms-schema.md               # KEEP
│   ├── 03-website-schema.md           # KEEP
│   ├── 05-memory-audit.md             # UPDATE — add fixes applied section
│   ├── delete-strategy.md             # KEEP
│   ├── message-biblestudy-current-architecture.md  # MOVED from root
│   └── message-biblestudy-proposed-schema.md       # MOVED from root
│
├── 03_website-rendering/
│   ├── 01-architecture.md             # KEEP
│   ├── 02-implementation.md           # KEEP
│   ├── 03-cms-connection.md           # KEEP
│   ├── 06-hosting-domain-strategy.md  # UPDATE
│   ├── 07-caching.md                  # UPDATE — add "NOT STARTED" banner
│   ├── 08-font-system.md             # KEEP
│   └── 09-section-component-guide.md  # KEEP
│
├── 04_builder/
│   ├── README.md                      # KEEP
│   ├── builder-roadmap.md             # KEEP — current status
│   ├── dev-guide-day1.md              # KEEP
│   ├── dev-guide-day2.md              # KEEP
│   ├── architecture/                  # KEEP (11 files, minus 2 archived)
│   ├── mental-model/                  # KEEP
│   └── section-catalog/
│       ├── section-catalog-reference.md      # KEEP — authoritative
│       └── section-editor-gap-analysis.md    # UPDATE — mark RESOLVED
│
├── 04_infrastructure/
│   ├── media-storage-cdn-guide.md     # KEEP
│   └── memory-optimization-guide.md   # UPDATE
│
├── 04_proxy-routing/
│   └── proxy-routing-architecture.md  # UPDATE
│
├── 05_cdn-storage/
│   └── 02-implementation-plan.md      # KEEP
│
├── 05_multi-tenant-platform/
│   ├── 00-executive-summary.md        # KEEP
│   ├── 01 through 05, 07, 08         # KEEP (7 files — Phase D reference)
│
├── 06_r2-storage/
│   ├── 00-account-strategy.md         # KEEP
│   ├── 01-r2-env-setup.md            # KEEP
│   ├── 02-storage-strategy.md         # KEEP (consolidate media-storage-system.md into this)
│   └── 04-media-library-plan.md       # UPDATE — clarify UI vs backend status
│
├── 07_product-thinking/
│   └── 01-people-system-tags-roles-groups.md  # KEEP
│
├── 08_user-journeys/
│   ├── 01-auth-edge-cases.md          # KEEP
│   ├── 02-onboarding-plan.md          # KEEP
│   └── 09-member-management-flows.md  # KEEP
│
├── deployment-roadmap.md              # KEEP
├── implementation-roadmap.md          # KEEP
├── cloudflare-cdn-setup.md            # KEEP
├── featured-events-edge-cases.md      # UPDATE
└── messages-editor-spec.md            # KEEP
```

**Result: ~77 active docs** (down from 141). Clean, organized, no stale content.

---

## 8. Deprecated Routes & Flagged API Endpoints

### Deprecated route — DELETE

| File | What It Is | Action |
|------|-----------|--------|
| `app/cms/(dashboard)/website/pages/page.tsx` | Old pages manager | DELETE page + remove sidebar entry in `app-sidebar.tsx` lines 172-176 |

### Flagged API endpoints — DECIDE

These API routes have no frontend callers. Decide per-route: keep for future use, or delete.

| File | What It Does | Recommendation |
|------|-------------|----------------|
| `app/api/v1/ai/transcribe/route.ts` | AI transcription | **KEEP** — planned feature per `ai-transcript-services.md` |
| `app/api/v1/ai/align-transcript/route.ts` | Transcript alignment | **KEEP** — planned feature |
| `app/api/v1/ai/cleanup-captions/route.ts` | Caption cleanup | **KEEP** — planned feature |
| `app/api/v1/ai/improve-transcript/route.ts` | Transcript improvement | **KEEP** — planned feature |
| `app/api/v1/convert-doc/route.ts` | .doc→HTML conversion | **DELETE** — one-off utility, migration complete |
| `app/api/v1/bible/route.ts` | Bible passage lookup | **KEEP** — called from `study-detail-view.tsx` (confirmed) |
| `app/api/v1/youtube/captions/route.ts` | YouTube captions fetch | **KEEP** — supports transcript AI workflow |

---

## 9. .gitignore for Fresh Repo

The current `.gitignore` is well-configured. Additions needed for the fresh repo:

```gitignore
# === Additions for fresh repo ===

# Build artifacts
tsconfig.tsbuildinfo

# System files
.DS_Store
.AppleDouble
.LSOverride
Thumbs.db

# Per-environment configs
.mcp.json
.playwright-mcp/

# Database snapshots (use cloud backups)
/db-snapshots/
*.dump

# PM2 (recreate per-server)
ecosystem.config.js

# IDE
.vscode/settings.json
.idea/
*.swp
*.swo

# Temporary files
public/pics-temp/
```

> **Note**: The current `.gitignore` already covers `.next/`, `node_modules/`, `/public/images`, `/public/videos`, `/public/fonts`, `00_old_laubf_db_dump/`, `laubf-test/`, `figma-cms-2*`, `db-snapshots/`. These entries should be kept as safety nets even though the directories won't exist in the fresh repo.

---

## 10. Execution Checklist

### Step 1: Prepare (before creating fresh repo)

- [ ] Review this document. Flag any files you want to keep that are marked DELETE.
- [ ] Decide on the AI transcript API routes (keep or delete).
- [ ] Decide on `pre-launch-audit.md` (still active or archive).
- [ ] Back up the current repo (it's preserved in git history anyway).

### Step 2: Create fresh repo directory

```bash
mkdir ~/Desktop/laubf-cms
```

### Step 3: Copy source code (exclude large/stale dirs)

```bash
# Copy everything except excluded dirs
rsync -av --progress \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='laubf-test' \
  --exclude='figma-cms-2:11:26' \
  --exclude='00_old_laubf_db_dump' \
  --exclude='db-snapshots' \
  --exclude='.playwright-mcp' \
  --exclude='public/pics-temp' \
  ~/Desktop/laubf-cms-test/ ~/Desktop/laubf-cms/
```

### Step 4: Delete files in the fresh copy

```bash
cd ~/Desktop/laubf-cms

# Root files
rm -f approach-c-tabbed.jsx tmp-check-iframes.mts ecosystem.config.js .mcp.json docker-compose.yml tsconfig.tsbuildinfo .DS_Store

# Root investigation docs (archive or delete)
rm -f bug-investigation-2026-03-25.md event-sharing-investigation-2026-03-26.md
rm -f server-memory-analysis.md memory-storage-reduction-plan.md caching-memory-audit.md
rm -f laubf_cms_review.md r2-content-disposition-explained.md
rm -f permissions-audit.md scalability-audit.md

# Move strategic docs to proper locations
mv message-biblestudy-current-architecture.md docs/02_database/
mv message-biblestudy-proposed-schema.md docs/02_database/

# Dead code
rm -f lib/url.ts lib/status.ts lib/church-profile-data.ts lib/tiptap-image-upload.ts
rm -f components/component-example.tsx components/example.tsx

# Deprecated route
rm -f app/cms/\(dashboard\)/website/pages/page.tsx
# Also remove sidebar entry in components/cms/app-sidebar.tsx (lines 172-176)

# Stale scripts (delete all one-off migration/verification scripts)
rm -f scripts/apply-flat-paths.mts scripts/clean-content.mts scripts/clean-study-html.mts
rm -f scripts/backfill-bible-text.mts scripts/backfill-study-content.mts scripts/backfill-content-disposition.mts
rm -f scripts/parsed-laubfmaterial.ts scripts/parsed-videolist.ts scripts/legacy-file-map.json
rm -f scripts/deploy.sh scripts/import-legacy-members.mts
# rm -f scripts/migrate-*.mts scripts/verify-*.mts scripts/seed-*.mts scripts/upload-*.mts scripts/fix-*.mts
# (verify glob patterns before running)

# Stale docs
rm -f docs/00_dev-notes/church-profile-update-plan.md
rm -f docs/00_dev-notes/git-history-purge-plan.md
rm -f docs/00_dev-notes/hero-video-investigation.md
rm -f docs/00_dev-notes/passage-audit.md
rm -f docs/04_builder/old-system/builder-plan.md
rm -f docs/05_cdn-storage/03-spreadsheet-verification.md
rm -f docs/06_r2-storage/06-upload-progress-tracker.md
rm -f docs/bible-study-migration-audit.md docs/bible-study-refactor-changelog.md
rm -f docs/bible-study-cleanup-plan.md docs/doc-import-and-study-fixes.md

# Archive docs (move to docs/archive/ instead of deleting)
mkdir -p docs/archive/completed-plans docs/archive/completed-audits docs/archive/sprint-history docs/archive/investigations
# (Move 42 files per the lists above — or simply don't copy them at all)
```

### Step 5: Update .gitignore

Copy updated `.gitignore` with additions from Section 9.

### Step 6: Update CLAUDE.md

After cleanup, update CLAUDE.md to:
- Remove references to `laubf-test/`, `figma-cms-2:11:26/`, `00_old_laubf_db_dump/`
- Update docs directory listing
- Remove "transitional" language about two-app structure

### Step 7: Initialize fresh repo

```bash
cd ~/Desktop/laubf-cms
git init
git add .
git commit -m "Initial commit: clean codebase from laubf-cms-test"
```

### Step 8: Verify

```bash
npm install
npm run build
npm run dev  # Smoke test
```

### Step 9: Update documentation (the 12 files marked UPDATE)

Go through the 12 files listed in Section 7e and fix contradictions, stale status, etc.

---

## Disk Space Impact Summary

| Item | Reclaimable | Priority |
|------|------------|----------|
| `laubf-test/` | ~1.2 GB | HIGH |
| `.git/` history | ~621 MB | HIGH (fresh repo) |
| `00_old_laubf_db_dump/` | ~246 MB | HIGH |
| `figma-cms-2:11:26/` | ~68 MB | HIGH |
| `db-snapshots/` | ~30 MB | MEDIUM |
| `.playwright-mcp/` | ~5.2 MB | LOW |
| Dead code + stale scripts + archived docs | ~2 MB | LOW (but cleaner repo) |
| **Total saved from fresh repo** | **~2.17 GB** | |
