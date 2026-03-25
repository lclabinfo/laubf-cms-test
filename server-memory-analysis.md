# Server Memory Optimization

> **Goal:** Reduce server RSS from 766 MB to ~180-220 MB (~70-75% reduction).
> All changes are safe configuration/code tweaks with zero functional impact.
>
> Last updated: 2026-03-24

---

## Current State

| Component | Memory | Why |
|-----------|--------|-----|
| Next.js runtime | ~150 MB | Non-standalone loads all 683 packages |
| V8 external (buffers, native) | ~580 MB | JIT code cache, TLS buffers, module metadata for all packages |
| V8 heap (in use) | 185 MB | 95.89% utilization (no heap limit set) |
| Prisma Client + pg adapter | ~80 MB | 43 models, 30 enums, 10 pool connections |
| **Total RSS** | **766 MB** | |

The 580 MB V8 external is the biggest offender. In non-standalone mode, Node loads all 683 packages into memory (native binaries, JIT-compiled code, module metadata) even if most are unused. Standalone mode reduces this to ~50-80 packages.

---
<!-- prisma / database query amount -->
<!-- static files? -->

## Optimization Checklist

### A. Root Causes (biggest impact)

#### A1. Switch to standalone server mode
- **Savings:** ~200-300 MB
- **Risk:** None -- standalone is the recommended Next.js production mode
- [x] `next.config.ts` has `output: 'standalone'`
- [x] `ecosystem.config.js` points to `.next/standalone/server.js`
- [x] **Deploy:** Rebuild on server, copy static files, restart PM2:
  ```bash
  npm run build
  cp -r public .next/standalone/public
  cp -r .next/static .next/standalone/.next/static
  cp .env .next/standalone/.env
  pm2 restart laubf_cms
  ```

#### A2. Set V8 heap limit
- **Savings:** ~100-200 MB (prevents V8 from greedily consuming all available memory)
- **Risk:** None -- standard production setting
- [x] `ecosystem.config.js` has `--max-old-space-size=256`
- [x] **Deploy:** Restart PM2 on server (`pm2 restart laubf_cms`)

#### A3. Delete stale PM2 process
- **Savings:** ~237 MB server-wide (separate process, not the main app)
- **Risk:** None -- it's an orphaned process
- [x] **On server:** `pm2 stop laubf && pm2 delete laubf && pm2 save`

---

### B. Build-time optimizations (applied in code, need deploy)

#### B1. Tree-shake barrel exports (`optimizePackageImports`)
- **Savings:** ~10-30 MB (fewer modules parsed/compiled at runtime)
- **Risk:** Zero -- build-time flag, no runtime behavior change
- **What it does:** Without it, `import { ChevronDown } from 'lucide-react'` loads all 1000+ icons. With it, only the used icon is included.
- [x] Added to `next.config.ts`:
  ```
  lucide-react, @dnd-kit/core, @dnd-kit/sortable, motion, @tiptap/core, @tiptap/pm
  ```
- [x] **Deploy:** Rebuild on server

#### B2. Externalize AWS SDK (`serverExternalPackages`)
- **Savings:** ~5-10 MB (SDK loaded on-demand instead of bundled into every server chunk)
- **Risk:** Very low -- recommended pattern for heavy server-only packages. Issues would show as build errors, not silent runtime bugs.
- [x] Added to `next.config.ts`: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- [x] **Deploy:** Rebuild on server

#### B3. Disable server source maps
- **Savings:** ~5-10 MB (no `.map` files loaded into memory)
- **Risk:** Zero for functionality. Production error stack traces show compiled line numbers instead of source -- standard for production.
- [x] Added to `next.config.ts`: `experimental.serverSourceMaps: false`
- [x] **Deploy:** Rebuild on server

---

### C. Runtime optimizations (applied in code, need deploy)

#### C1. Reduce pg pool from 10 to 5 connections
- **Savings:** ~5-10 MB (5 fewer idle connection TLS buffers at ~1-2 MB each)
- **Risk:** Effectively zero for current traffic
- **Concurrent query analysis:**
  - Website page load: sequential per section, 1 connection at a time
  - CMS dashboard: 1-3 API calls per page, 1 connection each
  - Builder: 2-3 queries per page load
  - Max realistic concurrency: 3-4 simultaneous queries
  - If all 5 busy: 6th query waits in queue (~10-50ms delay), doesn't fail
  - Pool of 10 is designed for hundreds of concurrent users. Pool of 5 is plenty for <10 users.
- [x] `lib/db/client.ts` updated: `max: 5`, `idleTimeoutMillis: 30000`
- [x] **Deploy:** Rebuild on server

#### C2. Lazy-load S3Client
- **Savings:** ~3-5 MB (client created on first R2 operation, not at startup)
- **Risk:** Very low -- S3Client is stateless, lazy vs eager is identical behavior. Bonus: server starts even if R2 env vars are missing.
- **Who uses R2:** Only 5 CMS admin files (upload-url, media promote, media delete, attachment upload, message/study sync). Public website never touches R2.
- [x] `lib/storage/r2.ts` updated: lazy singleton via `getClient()`
- [x] **Deploy:** Rebuild on server

#### C3. V8 flags for memory-constrained servers
- **Savings:** ~10-20 MB total
- **Risk:** Very low -- standard flags used by AWS Lambda and Vercel
- `--max-semi-space-size=8`: Reduces young generation from 16 MB to 8 MB. More frequent minor GC, less memory reserved. No speed impact.
- `--optimize-for-size`: V8 JIT produces smaller machine code. ~10% slower raw JS execution, but negligible in practice (most time = DB/network wait, not JS execution).
- [x] `ecosystem.config.js` has both flags in `node_args`
- [x] **Deploy:** Restart PM2 on server

---

### E. Newly identified optimizations

#### E1. Exclude TypeScript compiler from standalone build
- **Savings:** ~20-30 MB RSS (14.6 MB JS files loaded + V8 JIT compilation overhead)
- **Risk:** Zero
- **Why it's there:** Prisma Client lists `typescript` as an optional peer dependency. Since `typescript` is also a devDependency in `package.json`, npm installs it, and the standalone tracer pulls it into `.next/standalone/node_modules/typescript/` (20 MB on disk). The full TypeScript compiler + CLI are loaded into memory at runtime even though **nothing imports them**.
- **Fix:** Add `'typescript'` to `serverExternalPackages` in `next.config.ts`. This tells the standalone tracer to skip it. Since no runtime code imports TypeScript, it simply won't be loaded.
- **Side effects:** None. Verified: no source file imports `typescript` at runtime. Only `eslint.config.mjs` references it (build-time only, not in standalone). The TypeScript compiler is a dev tool -- it has no role in production.
- **Quick fix?** Yes -- one line added to `next.config.ts`, git-tracked.
- [ ] Add `'typescript'` to `serverExternalPackages` in `next.config.ts`
- [ ] **Deploy:** Rebuild on server

#### E2. Disable Next.js Image Optimization (remove sharp)
- **Savings:** ~15-25 MB RSS (sharp loads a 15 MB native `libvips` binary into memory)
- **Risk:** Zero for this project
- **Why it's there:** Next.js bundles `sharp` for its `<Image>` component optimization (resizing, WebP conversion). However, **this project uses zero `next/image` imports** -- all images are served directly from R2 CDN URLs or `<img>` tags via section components.
- **Fix:** Add `images: { unoptimized: true }` to `next.config.ts`. This tells Next.js to skip image optimization entirely and not load sharp.
- **Side effects:** None. Verified with full codebase search: zero files import `next/image`. The `images.remotePatterns` config stays (it's harmless) but sharp won't be loaded. If you ever add `<Image>` components in the future, you'd remove this flag.
- **Quick fix?** Yes -- one line in `next.config.ts`, git-tracked.
- [ ] Add `unoptimized: true` to `images` config in `next.config.ts`
- [ ] **Deploy:** Rebuild on server

#### E3. Remove dead code: `lib/daily-bread-feed.ts`
- **Savings:** ~1-3 MB RSS (removes `@xmldom/xmldom` from the module graph)
- **Risk:** Zero
- **Why it matters:** `@xmldom/xmldom` is imported at the top of this file, which means it gets loaded into memory if the module is traced by the bundler. However, **no file in the project imports `daily-bread-feed.ts`** -- it's completely dead code (no route, no component, no API handler references it).
- **Fix:** Delete the file. If daily bread functionality is needed later, it can be re-implemented and properly connected to a route.
- **Side effects:** None. Verified: zero imports across the entire codebase.
- **Quick fix?** Yes -- delete one file, git-tracked.
- [ ] Delete `lib/daily-bread-feed.ts`
- [ ] Check if `@xmldom/xmldom` can be removed from `package.json` (verify no other file uses it)
- [ ] **Deploy:** Rebuild on server

---

### D. Skipped (not worth it)

#### D1. TipTap server-side split -- SKIPPED
- **Would save:** ~3-5 MB (not the 15-30 MB originally estimated)
- **Why skipped:** After full code review, `getParseExtensions()` already uses a lightweight schema-only extension list. The only savings would be avoiding module-level ProseMirror plugin execution (ListContinuation, ListFontPropagation, SpacerAwareListItem). Both paths need the same base packages. 3-5 MB savings vs risk of breaking the DOCX import pipeline that took weeks to stabilize. Not worth it.

---

## Deploy Summary

All code changes (B1-B3, C1-C2) are already committed locally. The server needs:

```bash
# 1. Pull latest code
cd /home/ubfuser/digital_church/laubf_cms
git pull

# 2. Install deps + generate Prisma client
npm install
npx prisma generate

# 3. Build standalone
npm run build

# 4. Copy static files + env into standalone
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp .env .next/standalone/.env

# 5. Delete stale process + restart
pm2 stop laubf 2>/dev/null && pm2 delete laubf 2>/dev/null
pm2 restart laubf_cms    # or: pm2 start ecosystem.config.js
pm2 save

# 6. Verify
curl http://localhost:3012
pm2 monit   # watch RSS drop over ~30s as GC kicks in
```

---

## Projected Memory After All Changes

| Component | Before (766 MB) | After (~145-185 MB) |
|-----------|-----------------|---------------------|
| Node.js + V8 baseline | ~40 MB | ~30 MB |
| Next.js runtime | ~150 MB (full node_modules) | ~25 MB (standalone) |
| V8 external (buffers) | ~580 MB (683 packages) | ~50-80 MB (~50-80 packages) |
| Prisma + pg pool | ~80 MB (10 connections) | ~30 MB (5 connections) |
| TipTap server-side | ~30 MB | ~30 MB (kept as-is) |
| AWS SDK | ~5 MB (eager) | ~2 MB (lazy) |
| TypeScript compiler | ~20-30 MB (bundled by Prisma peer dep) | 0 MB (excluded) |
| Sharp / libvips | ~15-25 MB (loaded for unused image optimization) | 0 MB (disabled) |
| Dead code (@xmldom) | ~1-3 MB | 0 MB (removed) |
| Application code | ~30 MB | ~15 MB (tree-shaken) |
| **Total RSS** | **~766 MB** | **~145-185 MB** |

**Reduction: ~75-80%** -- all from safe configuration changes, zero functional changes.

---

## How to Verify

```bash
# Local: build and run standalone with production flags
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
node --max-old-space-size=256 --max-semi-space-size=8 --optimize-for-size \
  .next/standalone/server.js

# Check memory in another terminal
ps -o rss,command | grep standalone | awk '{printf "%.0f MB\n", $1/1024}'
```

See `docs/00_dev-notes/memory-monitoring-guide.md` for full monitoring commands.
