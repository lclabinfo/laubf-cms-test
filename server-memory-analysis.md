# Server Memory Analysis

> Full breakdown of why the server uses 766 MB RSS and what each component costs.
> Combines the original Korean server analysis, deep audit findings, and V8 research.
>
> Last updated: 2026-03-24

---

## Current State: 766 MB RSS

| Component | Memory | Notes |
|-----------|--------|-------|
| Next.js server base | ~150 MB | Non-standalone loads all 683 packages |
| Prisma Client + pg adapter | ~80 MB | 43 models, 30 enums, PostgreSQL adapter |
| V8 Heap (in use) | 185 MB | Per PM2 metrics, 95.89% utilization |
| V8 External (buffers, native) | ~580 MB | RSS - Heap = everything outside V8 |
| **Total RSS** | **~766 MB** | |

---

## Why V8 External Is 580 MB

This was the mystery. The 580 MB comes from the **non-standalone mode** loading all
node_modules. V8 "external memory" includes:

- Native binary code loaded into memory (even if unused)
- TLS/HTTP buffers for Node.js HTTP server
- V8 compiled code cache (JIT-compiled versions of ALL loaded JS)
- Buffer objects from pg, AWS SDK, etc.
- Module metadata for all 683 packages

**With standalone mode**, only ~50-80 packages load. The 580 MB drops to ~50-100 MB.

---

## Root Causes (Checklist)

### 1. Built standalone but not using it

- [x] **Fixed:** `ecosystem.config.js` points to `.next/standalone/server.js` (commit `2df19a0`)
- [ ] **Deploy:** Rebuild on server, copy static files, restart PM2

Expected: -200~300 MB

### 2. No V8 heap limit (95.89% utilization)

Node.js defaults to ~2 GB max heap. GC doesn't aggressively reclaim.

- [x] **Fixed:** `--max-old-space-size=256` in ecosystem.config.js (commit `2df19a0`)
- [x] **Added:** `--max-semi-space-size=8 --optimize-for-size` (in progress)
- [ ] **Deploy:** Restart PM2 on server

Expected: -100~200 MB

### 3. Stale PM2 process using 237 MB

`laubf` process on port 3011 — unused 30+ days.

- [ ] **On server:** `pm2 stop laubf && pm2 delete laubf`

Expected: -237 MB server-wide

### 4. Prisma global cache (minor)

- [ ] **TODO:** Change `lib/db/client.ts:18` to `globalForPrisma.prisma ??= prisma`

Expected: Marginal improvement

---

## Per-Component Memory Audit

### TipTap on Server — ~20-50 MB (BIGGEST FIXABLE ITEM)

`lib/tiptap.ts` imports 25 TipTap/ProseMirror packages at module level. Used server-side
by 3 website detail pages for `contentToHtml()` (JSON → HTML conversion).

| What loads | Why | Needed for HTML? |
|-----------|-----|-----------------|
| StarterKit, Link, Image, Table, etc. | Schema definitions | Yes (minimal set) |
| Placeholder, custom plugins, commands | Editor features | **No** |
| ProseMirror Plugin, PluginKey, TextSelection | Editor state | **No** |

- [ ] **TODO:** Create `lib/tiptap-html.ts` with only schema extensions (-15-30 MB)

### Prisma + pg Pool — ~30-40 MB

Good news: already using `@prisma/adapter-pg` (driver adapters), so no Rust query engine
binary. Generated client is only 4.7 MB. This is the optimal Prisma config.

The `pg` Pool defaults to 10 connections. Each holds TLS buffers.

- [ ] **TODO:** Set `max: 5, idleTimeoutMillis: 30000` in Pool config (-5-10 MB)

### AWS SDK S3 Client — ~3-5 MB

`lib/storage/r2.ts` creates S3Client at module level — loads on every server start even
for requests that never touch R2.

- [ ] **TODO:** Lazy-load via `getS3Client()` function (-3-5 MB)

### Rate Limiter Map — ~2-5 MB

Module-level `Map` in `lib/rate-limit.ts`. Capped at 10K entries with 5-min cleanup.
Not a true leak but wastes memory between cycles.

- [ ] **TODO:** Replace with `lru-cache` or Upstash Redis

### Next.js Runtime — ~20-30 MB (unavoidable)

Framework minimum. Cannot reduce without switching frameworks.

### Node.js / V8 Baseline — ~30-40 MB (unavoidable)

V8 heap metadata, GC structures, compiled code cache.

---

## Next.js Config Optimizations

### optimizePackageImports

Tree-shakes barrel exports. Without it, importing one icon from lucide-react loads all 1000+.

- [x] **Added:** lucide-react, @dnd-kit/core, @dnd-kit/sortable, motion, @tiptap/core, @tiptap/pm

### serverExternalPackages

Keeps heavy packages out of the webpack server bundle.

- [x] **Added:** @aws-sdk/client-s3, @aws-sdk/s3-request-presigner

### Server source maps

- [x] **Disabled:** `experimental.serverSourceMaps: false`

---

## V8 Flags Reference

| Flag | Effect | Recommended? |
|------|--------|-------------|
| `--max-old-space-size=256` | Caps old gen heap, forces aggressive GC | Yes |
| `--max-semi-space-size=8` | Smaller young gen (default 16 MB), more frequent minor GC | Yes |
| `--optimize-for-size` | Smaller JIT output, trades ~10% speed for memory | Yes |
| `--jitless` | No JIT, interpreter only. 1.7% memory savings, 40% slower | **No** |
| `--expose-gc` | Enables manual `global.gc()`. Debugging only | No |
| `--lite-mode` | Requires custom V8 build | Not applicable |

**Production recommendation:**
```
--max-old-space-size=256 --max-semi-space-size=8 --optimize-for-size
```

---

## Projected Memory After All Fixes

| Component | Current (non-standalone) | After All Fixes (standalone) |
|-----------|-------------------------|------------------------------|
| Node.js + V8 baseline | ~40 MB | ~30 MB |
| Next.js runtime | ~150 MB (full node_modules) | ~25 MB (standalone) |
| V8 external (buffers, native) | ~580 MB (all packages) | ~50-80 MB (tree-shaken) |
| Prisma + pg pool | ~80 MB | ~25 MB (pool max: 5) |
| TipTap server-side | ~30 MB | ~5 MB (tiptap-html.ts) |
| AWS SDK | ~5 MB | ~2 MB (lazy-loaded) |
| Application code | ~30 MB | ~15 MB (RSC + optimizePackageImports) |
| **Total RSS** | **~766 MB** | **~150-180 MB** |

**Reduction: 75-80%**

---

## How to Verify (Local)

```bash
# Build production standalone
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

# Run with production V8 flags
node --max-old-space-size=256 --max-semi-space-size=8 --optimize-for-size \
  .next/standalone/server.js

# Check memory in another terminal
ps -o rss,command | grep standalone | awk '{printf "%.0f MB\n", $1/1024}'
```

See `docs/00_dev-notes/memory-monitoring-guide.md` for full monitoring commands.

*Original analysis: server team (Korean)*
*Deep audit: 2026-03-24 (4 agents: native modules, bundle, V8 research, codebase scan)*
