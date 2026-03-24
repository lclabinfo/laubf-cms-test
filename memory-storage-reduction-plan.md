# Memory & Storage Reduction Plan

> **Goal:** Reduce runtime RSS from 766 MB to ~150-200 MB. Reduce git clone from ~1 GB to ~80 MB.
> **Last updated:** 2026-03-24

---

## Master Checklist

### Storage Reduction (git clone size: ~1 GB → ~80 MB)

- [x] Update `.gitignore` with `db-snapshots/`, `scripts/bible-study-content.json`, `figma-cms-2*` — commit `2fe9053`
- [x] `git rm --cached` 131 dump/snapshot files (kept on disk) — commit `2fe9053`
- [ ] Run `git filter-repo` to purge ~784 MB from history — see `docs/00_dev-notes/git-history-purge-plan.md`
- [ ] Re-clone on hosting server after filter-repo
- [ ] Re-clone on local PC after filter-repo

### Memory Reduction — Production Config (766 MB → ~300 MB)

- [x] Switch to standalone server (`.next/standalone/server.js`) — commit `2df19a0`
- [x] Set V8 heap limit `--max-old-space-size=256` — commit `2df19a0`
- [x] Add V8 flags `--max-semi-space-size=8 --optimize-for-size`
- [ ] Kill stale PM2 `laubf` process on server — `pm2 stop laubf && pm2 delete laubf` (-237 MB)
- [ ] Deploy to server: rebuild, copy static files, restart PM2

### Memory Reduction — Code Optimization (~300 MB → ~150-200 MB)

- [x] Code split TipTap editor (`next/dynamic`, ssr: false) in 3 CMS forms — commit `2df19a0`
- [x] Code split BuilderShell (`next/dynamic`, ssr: false) — commit `2df19a0`
- [x] Code split QuickLinksEditor (`next/dynamic`, ssr: false) — commit `2df19a0`
- [x] Paginate data fetches: `pageSize: 5000` → `50` in 5 places — commit `2df19a0`
- [x] Convert 22 website sections from client to server components — commit `2565e0b`
- [x] Add `optimizePackageImports` for lucide-react, dnd-kit, motion, tiptap
- [x] Add `serverExternalPackages` for AWS SDK
- [x] Disable server source maps
- [x] Reduce pg connection pool from 10 → 5 in `lib/db/client.ts`
- [x] Lazy-load S3Client in `lib/storage/r2.ts`
- ~~Create lightweight `lib/tiptap-html.ts`~~ — SKIPPED (only 3-5 MB savings, not worth risk to import pipeline)
- [ ] Fix SSG blocker: remove `headers()` from `lib/tenant/context.ts` for single-tenant
- [ ] Add PM2 `--max-memory-restart 400M` as safety net

### Memory Reduction — Cache & Data Layer

- [x] Add `Cache-Control` headers to daily-bread, speakers, speakers/[slug] — commit `2df19a0`
- [ ] Add `Cache-Control` headers to remaining public GET routes (messages, events, etc.)
- [ ] Replace in-memory rate limiter with Upstash Redis or `lru-cache`
- [ ] Consider ISR for static public pages (about, ministries, leadership)

### Security (not memory-related but flagged in review)

- [x] Fix Turnstile fail-open → fail-closed — commit `2df19a0`
- [x] Add 5 security headers to `next.config.ts` — commit `2df19a0`
- [ ] Add MIME type validation to `convert-doc` upload route
- [ ] Add DOMPurify for `dangerouslySetInnerHTML` in event detail page

---

## Progress Summary

| Category | Done | Total | Status |
|----------|------|-------|--------|
| Storage | 2 | 5 | 40% (filter-repo pending maintenance window) |
| Prod config | 3 | 5 | 60% (deploy pending) |
| Code optimization | 12 | 13 | 92% (only SSG blocker remains) |
| Cache & data | 1 | 4 | 25% |
| Security | 2 | 4 | 50% |
| **Overall** | **20** | **31** | **65%** |

---

## Expected Results

| Metric | Before | After Code Changes | After Deploy |
|--------|--------|-------------------|--------------|
| Runtime RSS | 766 MB | (same until deployed) | ~150-200 MB |
| Git clone | ~1 GB | ~1 GB | ~80 MB (after filter-repo) |
| Client JS | 41 client sections | 19 client sections | 19 client sections |
| Data fetches | 20K records/page | 200 records/page | 200 records/page |

---

## Reference Docs

| Doc | What it covers |
|-----|---------------|
| `server-memory-analysis.md` | Original 766 MB breakdown + root causes + deep V8/Prisma/TipTap analysis |
| `docs/00_dev-notes/git-history-purge-plan.md` | Step-by-step filter-repo procedure |
| `docs/00_dev-notes/memory-monitoring-guide.md` | How to check memory locally and on server |
| `docs/00_dev-notes/deep-memory-analysis.md` | Detailed per-component memory audit |
| `scalability-audit.md` | Multi-church readiness audit |
| `laubf_cms_review.md` | Full project code review |
