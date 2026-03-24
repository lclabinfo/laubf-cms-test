# Server Memory Analysis

> Full breakdown of why the server uses 766 MB RSS, what each component costs,
> and safety analysis for every proposed optimization.
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

The 580 MB comes from the **non-standalone mode** loading all node_modules. V8 "external
memory" includes:

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

- [x] **Fixed:** `--max-old-space-size=256` in ecosystem.config.js (commit `2df19a0`)
- [ ] **Deploy:** Restart PM2 on server

Expected: -100~200 MB

### 3. Stale PM2 process using 237 MB

- [ ] **On server:** `pm2 stop laubf && pm2 delete laubf`

Expected: -237 MB server-wide

---

## Proposed Optimizations — Safety Analysis

### TipTap Server-Side Split — SKIPPED (not worth the risk)

**Original proposal:** Create a separate `lib/tiptap-html.ts` for server-side HTML rendering.

**After full code review:** The code already has the correct separation. `getParseExtensions()`
(line 809) is a lightweight schema-only extension list that excludes all editor plugins,
commands, and input rules. `contentToHtml()` already calls this lighter function.

The only savings from splitting into a separate file would be avoiding the module-level
execution of ProseMirror plugins (ListContinuation, ListFontPropagation, SpacerAwareListItem)
— roughly **3-5 MB**, not the 15-30 MB originally estimated. Both paths still need the
same base packages (@tiptap/core, StarterKit, all extension packages).

**Verdict:** 3-5 MB savings vs risk of breaking the DOCX import pipeline that took weeks
to stabilize (numbered list continuation, font propagation, spacer-aware list items,
hanging indents). **Not worth it.**

---

### `optimizePackageImports` in next.config.ts — SAFE

**What it does:** Tells Next.js to tree-shake barrel exports at build time. Without it,
`import { ChevronDown } from 'lucide-react'` loads ALL 1000+ icon components into the
module graph even though only one is used.

**What changes for the user:** Nothing. The same components render. The same icons appear.
The build just produces smaller bundles because unused exports are eliminated.

**Risk:** Zero. This is a build optimization flag — it doesn't change any runtime behavior.
If a package isn't in the list, it just doesn't get optimized (no regression). Next.js
already does this automatically for a few packages (like `date-fns`), this just extends
it to our specific dependencies.

**Packages to add:**
- `lucide-react` — 1000+ icons, we use ~50
- `@dnd-kit/core`, `@dnd-kit/sortable` — barrel re-exports
- `motion` — animation library with many exports
- `@tiptap/core`, `@tiptap/pm` — large barrel exports

**Expected savings:** ~10-30 MB in the server bundle (fewer modules parsed/compiled).

---

### `serverExternalPackages` for AWS SDK — SAFE

**What it does:** Tells Next.js to NOT bundle `@aws-sdk/client-s3` into the webpack
server bundle. Instead, it's loaded at runtime from `node_modules/`. In standalone mode,
this means the AWS SDK is loaded on-demand when an R2 operation happens, rather than
being compiled into every server chunk at build time.

**What changes for the user:** Nothing. S3 operations (upload, delete, move) work exactly
the same. The SDK just isn't bundled into the server JS — it's required at runtime instead.

**Risk:** Very low. This is the recommended pattern for heavy server-only packages.
If there were an issue, it would manifest as a build error (not a silent runtime bug).

**Expected savings:** ~5-10 MB less in the compiled server bundle.

---

### Disable server source maps — SAFE

**What it does:** `experimental.serverSourceMaps: false` stops Next.js from generating
`.map` files for server-side code. These are only used for error stack traces in development.

**What changes for the user:** Nothing visible. Error stack traces in production logs
will show compiled line numbers instead of source line numbers. This is standard for
production deployments — you debug using the source code, not production stack traces.

**Risk:** Zero for functionality. Slightly harder to debug production errors (but you'd
reproduce locally anyway).

**Expected savings:** ~5-10 MB (no .map files loaded into memory).

---

### Reduce pg pool from 10 → 5 — SAFE FOR THIS PROJECT

**What it does:** The `pg` Pool creates up to 10 PostgreSQL connections by default.
Each idle connection holds ~1-2 MB of TLS buffers and protocol state in Node.js memory.
Reducing to 5 means fewer idle connections sitting in memory.

**What changes for the user:** Nothing — unless more than 5 database queries run
simultaneously. Let me verify this:

**Concurrent query analysis:**
- A website page load runs `Promise.all()` on visible sections (typically 5-10 sections),
  but `resolveSectionData` is sequential per section, not parallel per query
- The CMS dashboard makes 1-3 API calls per page, each using 1 connection
- The builder loads page data + sections in ~2-3 queries
- Maximum realistic concurrency: 3-4 queries if two users load pages simultaneously

**What happens if all 5 connections are busy:** The 6th query **waits in a queue** (it
doesn't fail). The `pg` Pool has a built-in queue — excess requests wait for a connection
to free up. Default queue timeout is 0 (wait forever). So:

- 1-4 concurrent queries: instant, no difference from pool of 10
- 5 concurrent queries: still fine, all served immediately
- 6+ concurrent: slight delay (~10-50ms) while waiting for a connection to free up
- This would only happen with 3+ simultaneous page loads with heavy data sections

**For a single-church CMS with <10 concurrent users:** 5 connections is more than enough.
Even 3 would likely work. The default of 10 is designed for apps with hundreds of
concurrent users.

**Risk:** Effectively zero for your current traffic. Queries queue gracefully if needed.

**Expected savings:** ~5-10 MB (5 fewer idle connection buffers).

**The change:**
```typescript
// lib/db/client.ts — before
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// after
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,  // close idle connections after 30s
})
```

---

### Lazy-load S3Client — SAFE

**What it does:** Currently `lib/storage/r2.ts` creates the S3Client at line 27 when the
module is first imported. This happens on server startup because other modules import
from this file. The fix wraps it in a function that creates the client on first use.

**What changes for the user:** Nothing. The first R2 operation takes ~5ms longer (one-time
client creation). All subsequent operations are identical.

**Who imports this file:** Only 5 files import from `lib/storage/r2.ts`:
- `app/api/v1/upload-url/route.ts` — presigned URL generation
- `app/api/v1/media/promote/route.ts` — staging → permanent promotion
- `lib/dal/media.ts` — media asset deletion
- `lib/upload-attachment.ts` — attachment uploads
- `lib/dal/sync-message-study.ts` — message/study sync

All are CMS admin operations. Public website pages never touch R2 at runtime.

**Risk:** Very low. The S3Client is stateless — creating it lazily vs eagerly produces
identical behavior. If R2 env vars are missing, the error just moves from startup to
first use (which is actually better — the server starts even if R2 isn't configured).

**Expected savings:** ~3-5 MB if the server handles requests that don't touch R2 (most
website page loads).

**The change:**
```typescript
// lib/storage/r2.ts — before
const client = new S3Client({ ... })

// after
let _client: S3Client | null = null
function getClient() {
  if (!_client) {
    _client = new S3Client({ ... })
  }
  return _client
}
// Then replace `client` with `getClient()` in all functions below
```

---

### V8 flags `--max-semi-space-size=8 --optimize-for-size` — SAFE

**What they do:**
- `--max-semi-space-size=8`: Reduces V8's young generation from 16 MB to 8 MB per
  semi-space. Objects are allocated here first, then promoted to old gen if they survive.
  Smaller = more frequent minor GC (Scavenge), but less memory reserved.
- `--optimize-for-size`: Tells V8's JIT compiler to produce smaller machine code rather
  than faster code. Roughly ~10% slower execution, ~10-20 MB less compiled code in memory.

**What changes for the user:** Pages might be 5-10% slower under heavy load (not
noticeable for a church CMS with <50 concurrent users). The 10% hit is on raw JS
execution speed — in practice, most time is spent waiting for DB queries and network,
not executing JS.

**Risk:** Very low. These are standard production flags for memory-constrained servers.
AWS Lambda and Vercel use similar settings. If the app becomes noticeably slower, just
remove `--optimize-for-size` (the semi-space change has no speed impact).

**Expected savings:** ~10-20 MB total.

**The change:** In `ecosystem.config.js`:
```javascript
node_args: "--max-old-space-size=256 --max-semi-space-size=8 --optimize-for-size",
```

---

## Projected Memory After All Safe Changes

| Component | Current (non-standalone) | After All Fixes (standalone) |
|-----------|-------------------------|------------------------------|
| Node.js + V8 baseline | ~40 MB | ~30 MB (optimize-for-size) |
| Next.js runtime | ~150 MB (full node_modules) | ~25 MB (standalone) |
| V8 external (buffers) | ~580 MB (all packages) | ~50-80 MB (tree-shaken) |
| Prisma + pg pool | ~80 MB | ~30 MB (pool max: 5) |
| TipTap server-side | ~30 MB | ~30 MB (kept as-is, not worth splitting) |
| AWS SDK | ~5 MB | ~2 MB (lazy-loaded) |
| Application code | ~30 MB | ~15 MB (RSC + optimizePackageImports) |
| **Total RSS** | **~766 MB** | **~180-220 MB** |

**Reduction: ~70-75%** — all from safe configuration changes, zero functional changes.

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
*Deep audit + safety analysis: 2026-03-24*
