# Memory & Storage Reduction Plan

> Addresses the two problems reported when deploying to the hosting server:
> 1. **Storage** — repo is ~1 GB, takes too long to clone/deploy
> 2. **Memory** — Node.js process uses 766 MB RSS at runtime
>
> These are **separate problems** with separate fixes.

---

## Understanding the Two Problems

### Storage (disk / git clone size)

The repo is heavy because ~600 MB of non-code files are committed to git history:

| Directory | On Disk | Tracked in Git | In .gitignore |
|-----------|---------|----------------|---------------|
| `00_old_laubf_db_dump/` | 364 MB | 124 files | Yes (but still tracked) |
| `db-snapshots/` | 148 MB | 6 files | **No** |
| `scripts/` | 91 MB | 68 files | **No** |
| `figma-cms-2:11:26/` | 68 MB | ignored | Yes |
| `laubf-test/` | 1.2 GB (with node_modules) | ignored | Yes |
| `.git/` pack | 588 MB | (history) | N/A |

**Key insight:** Adding files to `.gitignore` does NOT remove them from git history. The 124 SQL dump files and 74 snapshot/script files are still in every commit that touched them. Every `git clone` downloads them regardless.

### Memory (runtime RSS)

The Node.js process uses 766 MB because of four compounding issues:

| Issue | Wasted Memory | Fix Difficulty |
|-------|--------------|----------------|
| Running `next start` instead of standalone server | ~200-300 MB | 5 minutes |
| No V8 heap limit (GC is lazy) | ~100-200 MB | 1 line |
| No code splitting (TipTap, motion, dnd-kit load everywhere) | ~50-100 MB | 1-2 hours |
| Every page is dynamic (headers() blocks SSG) | Repeated DB hits | 30 minutes |

**Key insight:** Next.js is NOT the problem. The standalone server is designed to run in 256 MB containers. The current setup accidentally loads the full 1.2 GB node_modules into memory.

---

## Phase 1: Immediate Fixes (Today)

### 1.1 Switch to Standalone Server

The build already creates a standalone server at `.next/standalone/server.js`. The PM2 config just needs to point to it.

**Current (broken):**
```js
// ecosystem.config.js
script: "node_modules/.bin/next",  // loads ALL 683 packages
args: "start -p 3012"
```

**Fixed:**
```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "laubf_cms",
    script: ".next/standalone/server.js",
    cwd: "/home/ubfuser/digital_church/laubf_cms",
    node_args: "--max-old-space-size=256",
    env: {
      NODE_ENV: "production",
      PORT: 3012,
      HOSTNAME: "0.0.0.0",
    },
  }],
};
```

**After build, before starting:**
```bash
# standalone doesn't include static files — copy them
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
```

**Expected impact:** RSS drops from ~766 MB to ~450 MB.

### 1.2 Set V8 Heap Limit

Already included above: `node_args: "--max-old-space-size=256"`. Forces the garbage collector to aggressively reclaim memory instead of letting the heap grow to 2 GB.

**Expected impact:** RSS drops to ~300-350 MB.

### 1.3 Kill Unused PM2 Process

The `message.txt` notes a stale `laubf` process on port 3011 using 237 MB:

```bash
pm2 stop laubf && pm2 delete laubf
```

**Expected impact:** 237 MB freed server-wide.

### 1.4 Add Missing .gitignore Entries

```gitignore
# Data dumps and snapshots (should never be in git)
db-snapshots/
scripts/bible-study-content.json
scripts/message-content/
scripts/event-content/
figma-cms-2*
```

Then untrack files that are already committed:

```bash
git rm -r --cached db-snapshots/
git rm --cached scripts/bible-study-content.json
git rm -r --cached 00_old_laubf_db_dump/
git commit -m "Untrack dump files and snapshots from git"
```

Note: `00_old_laubf_db_dump` is already in `.gitignore` but its 124 files are still tracked
because they were committed before the rule was added. The `git rm --cached` removes them
from the index while keeping them on disk.

**This removes them from the working tree index but NOT from history.** The next phase handles history.

### 1.5 Fix Turnstile Fail-Open

`lib/turnstile.ts:55` returns `{ success: true }` on network error. Change to `{ success: false }`.

### 1.6 Add Security Headers

Add to `next.config.ts`:

```typescript
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
},
```

---

## Phase 2: Git History Purge (This Week)

### Why This Is Necessary

Even after `.gitignore` and `git rm --cached`, every `git clone` still downloads the full history including all past versions of those 600+ MB files. The `.git/` directory is 588 MB — most of it is these dump files.

### Steps

**Prerequisites:**
- All team members must be aware — this rewrites history
- Back up the repo: `git clone --mirror <url> backup-repo.git`
- Everyone will need to re-clone after the purge

**Top offenders in git history (from audit):**

| File/Directory | Versions | Cumulative Size |
|---------------|----------|-----------------|
| `scripts/bible-study-content.json` | 6 versions | **~438 MB** |
| `db-snapshots/*.dump` | 5 files | ~159 MB |
| `00_old_laubf_db_dump/*.sql` | 124 files | ~112 MB |
| `figma-cms-2:25:26/` assets | ~241 objects | ~75 MB |
| **Total reclaimable** | | **~784 MB** |

**Execute:**
```bash
# Install git-filter-repo (pip install git-filter-repo)

# Purge largest offenders from ALL history (run in order)
git filter-repo \
  --path scripts/bible-study-content.json \
  --path 00_old_laubf_db_dump/ \
  --path db-snapshots/ \
  --path figma-cms-2:25:26/ \
  --invert-paths \
  --force

# Verify size reduction
git count-objects -vH

# Force-push to remote (DESTRUCTIVE — everyone must re-clone)
git push origin --force --all
git push origin --force --tags
```

**Expected impact:** `.git/` drops from ~588 MB to ~50-80 MB. Clone time drops from minutes to seconds.

### Where to Move the Dump Files

These files still have value (legacy data reference). Move them to:

1. **R2/S3 bucket** — `s3://laubf-backups/legacy-dumps/` (recommended)
2. **Separate git repo** — `laubf-legacy-data` (if git access is needed)
3. **Google Drive / shared storage** — for non-technical team access

---

## Phase 3: Code Optimization (This Week)

### 3.1 Code Splitting with next/dynamic

Zero usage of `next/dynamic` or `React.lazy` in the entire codebase. Heavy libraries load on every page:

| Library | Approx Size | Used In | Action |
|---------|------------|---------|--------|
| TipTap (17 extensions) | ~200 KB | CMS editor only | `next/dynamic` with `ssr: false` |
| motion (framer-motion) | ~50 KB | 3 website sections | `next/dynamic` for animated sections |
| dnd-kit | ~30 KB | Builder + nav editor | `next/dynamic` with `ssr: false` |
| react-colorful | ~10 KB | Theme editor only | `next/dynamic` with `ssr: false` |

**Pattern:**
```typescript
// Before
import { TipTapEditor } from '@/components/cms/tiptap-editor'

// After
import dynamic from 'next/dynamic'
const TipTapEditor = dynamic(() => import('@/components/cms/tiptap-editor'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-muted rounded" />
})
```

### 3.2 Convert Website Sections to Server Components

41 out of 41 website section components are `"use client"`. Only ~8 actually need client interactivity (animations, modals, carousels). The other ~33 are purely presentational.

**Impact:** Removes ~33 components from the client JS bundle. Users download significantly less JavaScript.

**Approach:** Remove `"use client"` from purely presentational sections. Extract any small interactive parts (e.g., a single button with onClick) into tiny client sub-components.

### 3.3 Paginate Data Fetches

`resolve-section-data.ts` fetches `pageSize: 5000` for four section types:

```
all-messages:      5000 records
all-events:        5000 records
all-bible-studies: 5000 records
all-videos:        5000 records
```

A page with all four sections loads 20,000+ records into memory per request.

**Fix:** Default to 50 per page with client-side infinite scroll / load-more. The builder preview can use a smaller limit (e.g., 12).

### 3.4 Fix Single-Tenant SSG Blocker

`lib/tenant/context.ts` calls `headers()` which forces dynamic rendering on every website page:

```typescript
// Current — blocks SSG
const headersList = await headers()
```

**Fix for single-tenant:**
```typescript
export async function getChurchId(): Promise<string> {
  // For single-tenant: resolve directly from env, no headers() needed
  const slug = process.env.CHURCH_SLUG || 'la-ubf'
  const { prisma } = await import('@/lib/db/client')
  const church = await prisma.church.findUnique({ where: { slug } })
  if (!church) throw new Error(`Church not found: ${slug}`)
  return church.id
}
```

This allows Next.js to statically generate website pages at build time, eliminating runtime DB queries for page structure.

### 3.5 Add API Cache Headers

Only 1 of 25+ GET API routes sets `Cache-Control`. Add to all public GET endpoints:

```typescript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
})
```

---

## Phase 4: Pre-Production Hardening

### 4.1 Replace In-Memory Rate Limiter

`lib/rate-limit.ts` uses a `Map()` — each server instance has its own counter. In multi-instance deployments, an attacker gets `N * limit` attempts where N is the instance count.

**Fix:** Switch to Upstash Redis (`@upstash/ratelimit`), or use Cloudflare's built-in rate limiting if behind CF.

### 4.2 Add MIME Type Validation

`app/api/v1/convert-doc/route.ts` only checks file extension, not actual content type. Validate the MIME type from the request.

### 4.3 Sanitize dangerouslySetInnerHTML

`app/website/events/[slug]/page.tsx` renders HTML without DOMPurify. Low risk (only CMS admins write content), but add `isomorphic-dompurify` for defense-in-depth.

---

## Expected Results After All Phases

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|---------|---------------|---------------|---------------|
| **Runtime RSS** | 766 MB | ~300-350 MB | ~300-350 MB | ~200-250 MB |
| **Git clone size** | ~1 GB | ~1 GB | ~80-100 MB | ~80-100 MB |
| **Disk (excl. node_modules)** | ~388 MB | ~388 MB | ~30-40 MB | ~30-40 MB |
| **Client JS bundle** | All sections | All sections | All sections | ~60% smaller |
| **Page load (website)** | Dynamic (50-200ms DB) | Dynamic | Dynamic | Static (0ms DB) |

---

## Do We Need Express.js?

**No.** The memory issue is a configuration problem, not a framework problem.

Next.js standalone mode produces a self-contained server that:
- Runs in 256-512 MB containers (AWS, GCP, Railway all recommend this)
- Includes only the packages actually imported (tree-shaken)
- Supports static generation (zero-cost page loads)
- Handles image optimization, code splitting, streaming SSR

Express.js would lose all of these benefits and require manual implementation of routing, SSR, code splitting, image optimization, and caching — all things Next.js provides out of the box.

The correct comparison is:
- **Current (misconfigured):** 766 MB, every page hits DB
- **Next.js standalone (correct config):** 256-350 MB, static pages cached
- **Express.js (manual equivalent):** 200-300 MB, but months of work to replicate what Next.js gives for free

---

## Priority Order

| # | Action | Impact | Effort | Phase |
|---|--------|--------|--------|-------|
| 1 | Switch to standalone server | -300 MB RSS | 5 min | 1 |
| 2 | Set heap limit 256 MB | -100 MB RSS | 1 line | 1 |
| 3 | Kill stale PM2 process | -237 MB server | 1 min | 1 |
| 4 | Untrack dump files + update .gitignore | Stops growth | 10 min | 1 |
| 5 | git filter-repo purge | -500 MB clone | 30 min | 2 |
| 6 | Code split TipTap/motion/dnd-kit | -50 MB bundle | 2 hr | 3 |
| 7 | Paginate 5000-record fetches | -memory spikes | 1 hr | 3 |
| 8 | Fix SSG blocker (remove headers()) | Static pages | 30 min | 3 |
| 9 | Convert 33 sections to RSC | -60% client JS | 3 hr | 3 |
| 10 | Add cache headers to API routes | Fewer DB hits | 1 hr | 3 |
| 11 | Replace in-memory rate limiter | Multi-instance safe | 1 hr | 4 |
| 12 | Add security headers | Security | 15 min | 1 |
| 13 | Fix Turnstile fail-open | Security | 5 min | 1 |

*Reviewed: 2026-03-23*
