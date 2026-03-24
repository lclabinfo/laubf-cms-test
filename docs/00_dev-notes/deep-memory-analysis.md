# Deep Memory Analysis — Beyond the Basics

> Goes deeper than the initial reduction plan. Identifies every specific memory consumer
> in the codebase, explains why the V8 external memory was 580 MB, and provides
> advanced optimization techniques.
>
> Created: 2026-03-24

---

## Where the 766 MB Actually Comes From

The 580 MB "V8 external" was the mystery. Here's the breakdown:

### Why V8 External Was 580 MB (Old Config)

The old config ran `node_modules/.bin/next start` which loads **all 683 npm packages** into
memory. V8 "external memory" includes:

- Native binary code (Prisma engine, compiled addons)
- TLS/HTTP buffers for the Node.js HTTP server
- V8 compiled code cache (JIT-compiled versions of all loaded JS)
- Buffer objects from `pg`, `@aws-sdk`, etc.
- Module metadata for all 683 packages

**With standalone mode**, the server only loads ~50-80 packages (the ones actually imported).
The 580 MB of external memory should drop to ~50-100 MB because the unused 600+ packages
never get loaded.

---

## Specific Memory Consumers (Audited)

### 1. TipTap on the Server — 20-50 MB (FIXABLE)

`lib/tiptap.ts` imports **25 TipTap/ProseMirror packages** at the top level:

```
StarterKit, Underline, Superscript, Subscript, TextAlign, Link, Image,
Placeholder, TextStyle, Color, FontFamily, Highlight, Table, TableRow,
TableHeader, TableCell, OrderedList, BulletList, ListItem, Youtube,
+ 5 custom extensions (Indent, LineSpacing, ListContinuation, etc.)
+ ProseMirror core (Plugin, PluginKey, TextSelection)
```

These are loaded on the **server** because 3 website pages call `contentToHtml()`:

| Page | Call |
|------|------|
| `messages/[slug]/page.tsx` | `contentToHtml(message.liveTranscript)` |
| `events/[slug]/page.tsx` | `contentToHtml(event.description)` |
| `bible-study/[slug]/page.tsx` | `contentToHtml(study.questions)` |

The `contentToHtml()` function checks if content is TipTap JSON (starts with `{`) and
converts it to HTML using `generateHTML()` from `@tiptap/html`. This requires the full
ProseMirror schema with all extensions.

**The problem:** Most of those 25 imports are for the **editor** (Placeholder, custom input
rules, plugins, commands). The `generateHTML()` function only needs the **schema definition**
(node specs + mark specs), not the editor functionality.

**Fix options:**

**Option A: Lightweight tiptap-html.ts (best, -15-30 MB)**
Create a minimal file that only imports what `generateHTML` needs:

```typescript
// lib/tiptap-html.ts — lightweight, server-only
import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableHeader from "@tiptap/extension-table-header"
import TableCell from "@tiptap/extension-table-cell"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Youtube from "@tiptap/extension-youtube"
// Skip: Placeholder, custom plugins, ProseMirror state, commands
```

Then website pages import from `lib/tiptap-html` instead of `lib/tiptap`.

**Option B: Pre-render HTML at save time (best long-term, eliminates runtime cost)**
When CMS saves content, convert TipTap JSON → HTML and store both. Website pages
read the pre-rendered HTML directly. Zero TipTap imports needed on the server.

### 2. Prisma + pg Pool — 30-40 MB (partially fixable)

Good news: The project uses `@prisma/adapter-pg` (driver adapters) which **skips the Rust
query engine binary**. The generated client is only 4.7 MB. This is already optimal.

The `pg` Pool defaults to 10 max connections. Each idle connection holds TLS buffers:

```typescript
// lib/db/client.ts — current
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
```

**Fix:** Explicitly limit pool size and idle timeout:
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                    // default is 10
  idleTimeoutMillis: 30000,  // close idle connections after 30s
})
```

Estimated savings: ~5-10 MB (fewer idle connection buffers).

### 3. AWS SDK S3 Client — 3-5 MB (fixable)

`lib/storage/r2.ts` creates an `S3Client` at module level — it loads on every server start
even if no R2 operations happen during the request.

**Fix:** Lazy-load the client:
```typescript
let _client: S3Client | null = null
function getS3Client() {
  if (!_client) {
    _client = new S3Client({ ... })
  }
  return _client
}
```

Saves 3-5 MB if the server handles requests that never touch R2 (most website pages).

### 4. Rate Limiter Map — 2-5 MB (fixable)

Already known. Capped at 10K entries with 5-minute cleanup interval. Not a leak but
wastes memory between cleanup cycles. Replace with `lru-cache` for bounded memory or
Upstash Redis for multi-instance.

### 5. Next.js Runtime — 20-30 MB (not fixable)

The framework minimum. Cannot be reduced without switching frameworks.

### 6. Node.js / V8 Baseline — 30-40 MB (not fixable)

V8 heap metadata, GC structures, compiled code cache. Every Node.js process has this.

---

## Next.js Config Optimizations

### optimizePackageImports

Next.js can tree-shake barrel exports (files that re-export everything). Without this,
importing one icon from `lucide-react` loads ALL 1000+ icons.

Add to `next.config.ts`:
```typescript
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    '@tiptap/core',
    '@tiptap/pm',
    '@aws-sdk/client-s3',
  ],
},
```

### serverExternalPackages

Heavy packages that webpack can't tree-shake well. Keep them external to the bundle
(loaded from node_modules at runtime instead of inlined):

```typescript
serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner'],
```

---

## V8 Flags for Production

Beyond `--max-old-space-size=256`:

| Flag | Effect | Trade-off |
|------|--------|-----------|
| `--max-semi-space-size=8` | Smaller young generation (default 16 MB) | More frequent minor GC |
| `--optimize-for-size` | V8 trades speed for smaller compiled code | ~5-10% slower execution |
| `--max-old-space-size=256` | Already set | Forces aggressive GC |

Recommended `node_args` for production:
```
--max-old-space-size=256 --max-semi-space-size=8 --optimize-for-size
```

Expected additional savings: 10-20 MB from smaller compiled code cache.

---

## Actionable Items (New, Not in Previous Plan)

- [ ] **Create `lib/tiptap-html.ts`** — lightweight server-only HTML renderer (-15-30 MB)
- [ ] **Add `optimizePackageImports`** to next.config.ts (-5-10 MB bundle, helps tree-shaking)
- [ ] **Reduce pg pool to max: 5** in lib/db/client.ts (-5-10 MB)
- [ ] **Lazy-load S3Client** in lib/storage/r2.ts (-3-5 MB)
- [ ] **Add V8 flags** `--max-semi-space-size=8 --optimize-for-size` (-10-20 MB)
- [ ] **Add `serverExternalPackages`** for AWS SDK (-2-3 MB server bundle)
- [ ] **Consider pre-rendering HTML at CMS save time** (eliminates TipTap server-side entirely)

---

## Revised Memory Target

| Component | Current (est.) | After All Fixes |
|-----------|---------------|-----------------|
| Node.js + V8 baseline | 40 MB | 30 MB (optimize-for-size) |
| Next.js runtime | 30 MB | 25 MB (optimizePackageImports) |
| Prisma client + pg pool | 40 MB | 25 MB (pool max: 5) |
| TipTap server-side | 30 MB | 5 MB (tiptap-html.ts split) |
| AWS SDK | 5 MB | 2 MB (lazy-load) |
| Application code + state | 30 MB | 20 MB (RSC conversion done) |
| V8 compiled code cache | 30 MB | 15 MB (optimize-for-size) |
| **Total RSS (standalone)** | **~250 MB** | **~150-180 MB** |

The 766 MB → ~150-180 MB is a **75-80% reduction**. Getting under 150 MB would require
dropping Prisma for a lighter ORM (Drizzle ~10 MB vs Prisma ~30 MB).

---

*Analysis: 2026-03-24*
