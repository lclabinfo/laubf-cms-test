# Server Memory Analysis (766 MB)

> Original analysis from hosting server inspection (Korean).
> Converted to checklist with completion status.

---

## Memory Breakdown (Estimated)

| Component | Est. Memory | Notes |
|-----------|-------------|-------|
| Next.js server base | ~150 MB | v16.1.6 + 878 server JS files |
| Prisma Client + pg adapter | ~80 MB | 43 models, 30 enums, PostgreSQL adapter |
| V8 Heap (in use) | 185 MB | Per PM2 metrics |
| V8 external (buffers, etc.) | ~580 MB | RSS - Heap = external memory |
| **Total RSS** | **~766 MB** | |

---

## Root Causes & Fixes

### 1. Built standalone but not using it

`next.config.ts` has `output: 'standalone'` but `ecosystem.config.js` runs
`node_modules/.bin/next start` which loads the entire 1.2 GB node_modules.

- [x] **Fixed:** `ecosystem.config.js` now points to `.next/standalone/server.js` (commit `2df19a0`)
- [ ] **Deploy:** Rebuild on server, copy static files, restart PM2

Expected: -200~300 MB

### 2. V8 heap has no limit (95.89% usage)

No heap limit means Node.js freely expands to ~2 GB default. GC doesn't aggressively
reclaim because there's no pressure.

- [x] **Fixed:** `node_args: "--max-old-space-size=256"` added to ecosystem.config.js (commit `2df19a0`)
- [ ] **Deploy:** Restart PM2 on server

Expected: -100~200 MB

### 3. Prisma global cache not active in production

```typescript
// lib/db/client.ts:18
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

This only caches in dev. In production, module cache already ensures a singleton,
but making it explicit is safer.

- [ ] **TODO:** Change to `globalForPrisma.prisma ??= prisma` (minor improvement)

### 4. Stale PM2 process using 237 MB

`laubf` process on port 3011 — unused for 30+ days, consuming 237 MB.

- [ ] **TODO (on server):** `pm2 stop laubf && pm2 delete laubf`

---

## Expected Results After Deploy

| State | RSS |
|-------|-----|
| Current | 766 MB |
| After standalone switch | ~450 MB |
| + heap limit 256 MB | ~300-350 MB |
| + kill stale laubf process | Server saves 237 MB |

---

## Additional Optimizations (done in code, pending deploy)

- [x] Code splitting: TipTap, BuilderShell, QuickLinksEditor dynamically imported
- [x] Data fetching: pageSize 5000 → 50 (4 section types + bible study page)
- [x] Cache headers: daily-bread, speakers routes
- [x] Security headers: 5 headers added to next.config.ts
- [x] Turnstile: fail-open → fail-closed

*Original analysis: server team (Korean)*
*Checklist updated: 2026-03-24*
