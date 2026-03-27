# Memory & Storage Reduction Plan

> **Goal:** Reduce runtime RSS from 766 MB to ~150-200 MB. Reduce git clone from ~1 GB to ~80 MB.
> **Last updated:** 2026-03-24

## Storage Reduction (git clone: ~1 GB to ~80 MB)

- [x] Update `.gitignore` with `db-snapshots/`, `scripts/bible-study-content.json`, `figma-cms-2*` — `2fe9053`
- [x] `git rm --cached` 131 dump/snapshot files (kept on disk) — `2fe9053`
- [ ] Run `git filter-repo` to purge ~784 MB from history — see `docs/00_dev-notes/git-history-purge-plan.md` (~784 MB savings)
- [ ] Re-clone on hosting server after filter-repo
- [ ] Re-clone on local PC after filter-repo

## Production Config (766 MB to ~300 MB)

- [x] Switch to standalone server (`.next/standalone/server.js`) — `2df19a0`
- [x] Set V8 heap limit `--max-old-space-size=256` — `2df19a0`
- [x] Add V8 flags `--max-semi-space-size=8 --optimize-for-size` — `2df19a0`
- [ ] Kill stale PM2 `laubf` process on server — `pm2 stop laubf && pm2 delete laubf` (~237 MB savings)
- [ ] Deploy to server: rebuild, copy static files, restart PM2

## Code Optimization (~300 MB to ~150-200 MB)

- [x] Code split TipTap editor (`next/dynamic`, ssr: false) in 3 CMS forms — `2df19a0`
- [x] Code split BuilderShell (`next/dynamic`, ssr: false) — `2df19a0`
- [x] Code split QuickLinksEditor (`next/dynamic`, ssr: false) — `2df19a0`
- [x] Paginate data fetches: `pageSize: 5000` to `50` in 5 places — `2df19a0`
- [x] Convert 22 website sections from client to server components — `2565e0b`
- [x] Add `optimizePackageImports` for lucide-react, dnd-kit, motion, tiptap
- [x] Add `serverExternalPackages` for AWS SDK
- [x] Disable server source maps
- [x] Reduce pg connection pool from 10 to 5 in `lib/db/client.ts`
- [x] Lazy-load S3Client in `lib/storage/r2.ts`
- [x] ~~Create lightweight `lib/tiptap-html.ts`~~ — SKIPPED (only 3-5 MB savings, not worth risk)
- [ ] Fix SSG blocker: remove `headers()` from `lib/tenant/context.ts` for single-tenant (~50-100 MB savings)
- [ ] Add PM2 `--max-memory-restart 400M` as safety net
- [ ] Dynamic import motion library in website sections (~5-10 MB savings)

## Cache & Data Layer

- [x] Add `Cache-Control` headers to daily-bread, speakers, speakers/[slug] — `2df19a0`
- [ ] Add `Cache-Control` headers to remaining public GET routes (messages, events, etc.)
- [ ] Replace in-memory rate limiter with Upstash Redis or `lru-cache` (~10-20 MB savings)
- [ ] Consider ISR for static public pages (about, ministries, leadership) (~20-50 MB savings)

## Build & Bundle Optimization

- [ ] Install `sharp` for Next.js image optimization (~50-100 MB savings)
- [ ] Add `productionBrowserSourceMaps: false` to `next.config.ts` (~5-15 MB savings)
- [ ] Refactor `getChurchId()` for single-tenant to enable ISR/SSG — eliminate `headers()` call (~50-100 MB savings)
- [ ] Add `@next/bundle-analyzer` for automated bundle profiling (optional tooling)

## Security (flagged in review, not memory-related)

- [x] Fix Turnstile fail-open to fail-closed — `2df19a0`
- [x] Add 5 security headers to `next.config.ts` — `2df19a0`
- [ ] Add MIME type validation to `convert-doc` upload route
- [ ] Add DOMPurify for `dangerouslySetInnerHTML` in event detail page

## Reference Docs

- `server-memory-analysis.md` — Original 766 MB breakdown, root causes, V8/Prisma/TipTap analysis
- `docs/00_dev-notes/git-history-purge-plan.md` — Step-by-step filter-repo procedure
- `docs/00_dev-notes/memory-monitoring-guide.md` — How to check memory locally and on server
- `docs/00_dev-notes/deep-memory-analysis.md` — Detailed per-component memory audit
- `scalability-audit.md` — Multi-church readiness audit
- `laubf_cms_review.md` — Full project code review
