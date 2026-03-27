# Memory Optimization Guide: Next.js + Prisma + PostgreSQL

> Research compiled 2026-03-27 for the LA UBF CMS/Website Builder project.
> Covers: auditing, profiling, common pitfalls, and prioritized action items.

---

## Table of Contents

1. [Your Project's Current Memory Profile](#1-your-projects-current-memory-profile)
2. [What Consumes the Most Memory in Next.js](#2-what-consumes-the-most-memory-in-nextjs)
3. [Common Pitfalls](#3-common-pitfalls)
4. [How to Audit Memory Usage](#4-how-to-audit-memory-usage)
5. [Prisma Memory & Query Optimization](#5-prisma-memory--query-optimization)
6. [PostgreSQL Tuning](#6-postgresql-tuning)
7. [Connection Pooling](#7-connection-pooling)
8. [Multi-Tenant Query Patterns](#8-multi-tenant-query-patterns)
9. [Production Deployment](#9-production-deployment)
10. [Comparable Platform Benchmarks](#10-comparable-platform-benchmarks)
11. [Prioritized Action Items](#11-prioritized-action-items)
12. [Learning Resources](#12-learning-resources)

---

## 1. Your Project's Current Memory Profile

### Codebase Scale

| Category | Count | Notes |
|----------|-------|-------|
| API route handlers | 107 | Across `/app/api/*`, mostly CRUD |
| CMS pages/layouts | 52 | Dashboard, editors, auth flows |
| Website routes | 6 | Catch-all + detail pages |
| Prisma models | 45 | 1,745-line schema |
| Prisma relations | 70 | Cross-model relationships |
| JSON/Text fields | 64 | `@db.JsonB` and `@db.Text` columns |
| Source code size | ~9.5 MB | app (1.2M) + lib (5.4M) + components (2.9M) |

### Estimated Server Memory Breakdown

| Component | Estimated Memory | Notes |
|-----------|-----------------|-------|
| Prisma Client (generated code + query compiler) | 40-70 MB | 45 models, WASM query compiler |
| Next.js Runtime (RSC compiler, route resolution) | 40-60 MB | App Router overhead |
| Node.js + V8 engine | 30-50 MB | Fixed cost |
| NPM module cache | 20-40 MB | Grows as routes are visited |
| AWS SDK (when active) | 30-50 MB | Properly externalized |
| Connection pool (pg) | 10-25 MB | 5 connections x 2-5 MB each |
| **Permanent baseline** | **~200-300 MB** | |

### Transient (Per-Request) Memory

The remaining memory usage (up to ~1 GB observed) comes from:

1. **Database query results loaded into heap** -- The biggest factor. List queries that fetch all text/JSON fields (e.g., bible studies with full content) can load 80+ MB per request.
2. **RSC serialization doubling** -- Query results exist twice: original Prisma objects AND RSC wire format. An 80 MB query briefly occupies ~160 MB.
3. **Parallel section resolution** -- `Promise.all()` for 10 sections holds all results simultaneously. Peak: 170+ MB for a single homepage render.
4. **V8 heap reluctance to shrink** -- After a spike, V8 keeps the heap large anticipating future similar spikes.

### What's Already Done Right

- Standalone output mode (`output: 'standalone'`)
- Server external packages (AWS SDK, TypeScript)
- `serverSourceMaps: false`
- `optimizePackageImports` for 6 packages
- Prisma singleton pattern with `globalForPrisma`
- Connection pool at `max: 5`
- Edge auth checks (no Prisma in middleware)
- Lazy-loaded builder shell (`dynamic()`)
- `images: { unoptimized: true }` (no Sharp overhead)

---

## 2. What Consumes the Most Memory in Next.js

### Permanent (Baseline) Consumers

| Component | Typical Memory | Notes |
|-----------|---------------|-------|
| Node.js runtime + V8 | 30-50 MB | Fixed, unavoidable |
| Next.js App Router runtime | 50-80 MB | RSC renderer, module system |
| Prisma ORM (WASM engine + generated client) | 40-70 MB | Scales with schema complexity |
| NPM package module cache | 20-40 MB | Grows as routes are visited |
| Sharp (image optimization) | 15-25 MB | Disabled in this project |
| TipTap / rich text libraries | 5-30 MB | Depends on extensions loaded server-side |

### Dev Server vs Production

Dev server uses 2-3x more memory than production due to:
- HMR state tracking
- Webpack compilation cache in memory
- Source maps for every module
- No tree shaking or dead code elimination
- Prisma query logging (string accumulation)

---

## 3. Common Pitfalls

### Pitfall 1: Over-Fetching from the Database

Prisma's default is `SELECT *`. For tables with large text/JSON columns, this loads megabytes the UI discards.

**Your project**: `getBibleStudies()` loads ~80 MB (all 1,185 studies with full text) when the list page needs ~152 KB of metadata. That's a **500x over-fetch**.

**Fix**: Use Prisma `omit` (stable since Prisma 6.2) or `select` to exclude heavy columns.

### Pitfall 2: No Caching

The project currently uses zero caching:
- No `unstable_cache()`
- No `'use cache'` directive
- No `export const revalidate` (ISR)
- No React `cache()` for request deduplication

Every page visit runs the full query pipeline. For a church website where content changes once/day, 99.9% of renders are identical but still do maximum work.

### Pitfall 3: Unbounded Nested Includes

```typescript
// Bad: loads ALL attachments, ALL custom fields
include: { attachments: true, customFieldValues: true }

// Better: bound with take
include: { attachments: { take: 20 }, customFieldValues: { take: 50 } }
```

### Pitfall 4: Prisma Relation Object Duplication

`include: { speaker: true }` on 50 messages creates 50 separate Speaker objects even if 40 share the same speaker. No deduplication. Batch-fetching + manual joining = 5 objects instead of 50.

### Pitfall 5: Server-Side Library Bloat

Libraries designed for the browser (TipTap, icon libraries, animation frameworks) loaded on the server add permanent memory cost. Always use `dynamic()` with `ssr: false` for heavy client-only components.

### Pitfall 6: Dynamic Imports That Stay Forever

Node.js caches every `await import()` permanently. Once loaded, modules can't be evicted from the module cache. The memory stays allocated after first use.

### Pitfall 7: Third-Party Package Memory Leaks

Not all npm packages are SSR-safe. Any package that maintains module-level state can leak on the server. Real-world example: React Helmet creates orphaned objects per request that never get GC'd. Fix: Use React Helmet Async or similar SSR-safe alternatives.

### Pitfall 8: Node.js fetch() Memory Leak

Node.js versions before 18.17.0 had a memory leak in native `fetch()`. Next.js monkey-patches `fetch()` for caching, which can compound the issue. Ensure you're on Node.js 20+.

### Pitfall 9: Multiple PrismaClient Instances

Each instance creates its own connection pool. In apps that create a client per request, the engines array grows unbounded -- confirmed memory leak (Prisma GitHub #13232). **Your singleton pattern prevents this.**

---

## 4. How to Audit Memory Usage

### Quick Spot-Check: process.memoryUsage()

```typescript
// Add to any API route or middleware for debugging
const mem = process.memoryUsage()
console.log({
  rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,      // Total OS-allocated memory
  heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,  // Live JS objects
  heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`, // V8 heap allocated
  external: `${(mem.external / 1024 / 1024).toFixed(1)} MB`,   // C++ objects (Buffers, etc.)
})
```

**Key metrics explained:**
- **RSS (Resident Set Size)**: What the OOM killer looks at. This is the number you care about.
- **heapUsed**: JavaScript objects currently alive.
- **heapTotal**: V8 heap space allocated (always >= heapUsed; V8 doesn't release pages eagerly).
- **external**: C++ objects bound to JS (Buffers, connection pools).
- If `rss >> heapUsed`, memory is in native allocations (pools, SSL buffers), not JavaScript.

### Build-Time Auditing

```bash
# Debug memory during build (Next.js 14.2+)
next build --experimental-debug-memory-usage

# Record heap profile for Chrome DevTools
node --heap-prof node_modules/next/dist/bin/next build

# Bundle analysis (requires @next/bundle-analyzer)
ANALYZE=true npm run build
```

### Runtime Profiling with Chrome DevTools

```bash
# Start with inspector
NODE_OPTIONS='--inspect' npm start

# Or break before user code executes
NODE_OPTIONS='--inspect-brk' npm start
```

Then open `chrome://inspect` in Chrome > Memory tab > Take heap snapshots.

**Heap snapshot comparison (best leak detection technique):**
1. Start app with `--inspect`, connect Chrome DevTools
2. Take Snapshot 1 (baseline)
3. Force GC (trash can icon in DevTools)
4. Run load test (e.g., 120 requests with `autocannon`)
5. Force GC again
6. Take Snapshot 2
7. Compare using "Delta" column -- objects that grew proportional to requests = leak

### Clinic.js Suite

```bash
npm install -g clinic

clinic doctor -- node server.js     # Overview (CPU, event loop, memory)
clinic heapprof -- node server.js   # Memory-specific
clinic bubbleprof -- node server.js # Async issue detection
```

### Load Testing for Leak Detection

```bash
npm install -g autocannon

# Sustained load test
autocannon -c 10 -d 60 http://localhost:3000/

# Monitor memory during test (separate terminal)
watch -n 2 'ps aux | grep next-server | grep -v grep | awk "{printf \"RSS: %.1f MB\n\", \$6/1024}"'
```

If memory climbs throughout without stabilizing = leak. If it spikes then plateaus = normal V8 behavior.

### OS-Level Tools

```bash
# macOS
ps aux | grep next-server | grep -v grep | awk '{printf "PID: %s  RSS: %.1f MB\n", $2, $6/1024}'

# Linux (production)
cat /proc/<pid>/status | grep -E "VmRSS|VmSize|VmPeak"

# Docker/K8s cgroup memory
cat /sys/fs/cgroup/memory/memory.usage_in_bytes
```

### PM2 Monitoring

```bash
pm2 monit        # Real-time dashboard
pm2 list         # Memory summary
pm2 show <name>  # Detailed process info
```

### Health Endpoint for Production

```typescript
// app/api/v1/health/route.ts
export async function GET() {
  const mem = process.memoryUsage()
  return Response.json({
    uptime: process.uptime(),
    rss: Math.round(mem.rss / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    external: Math.round(mem.external / 1024 / 1024),
  })
}
```

---

## 5. Prisma Memory & Query Optimization

### Prisma 7 Architecture (What You're Running)

Prisma 7 eliminated the Rust query engine entirely, replacing it with a TypeScript/WASM Query Compiler:

| Metric | Prisma 6 (Rust) | Prisma 7 (TypeScript) |
|--------|-----------------|----------------------|
| Bundle size | ~14 MB (7 MB gzipped) | ~1.6 MB (600 KB gzipped) |
| Query speed | Baseline | Up to 3x faster for large results |
| Serialization | JS <-> Rust IPC every query | None (same runtime) |
| Rust process memory | ~50-80 MB RSS | Eliminated |

You already benefit from this on Prisma 7.4.1.

### `omit` vs `select`

- **`omit`** (GA since Prisma 6.2): Excludes specific fields. Easier to maintain -- new columns don't break queries.
- **`select`**: Includes only specified fields. More explicit but brittle.
- **Global `omit`** on PrismaClient: Safety net for all queries.

**TOAST bypass**: When you omit text/JSONB columns, PostgreSQL never reads the TOAST side-table -- no I/O, no decompression, no buffer pool pollution.

### N+1 Prevention

- **`include`**: Generates `LATERAL JOIN` + JSON aggregation (default `relationLoadStrategy: "join"` since Prisma 5.8).
- **`relationLoadStrategy: "query"`**: Better when the "many" side is large or nesting is 3+ levels deep.
- **Fluent API batching**: `prisma.user.findUnique({...}).posts()` auto-batches `findUnique` calls into `WHERE id IN (...)`.

### Pagination

| Strategy | When to Use | Notes |
|----------|-------------|-------|
| Offset (`skip`/`take`) | Admin tables, <100K rows | Works fine for your data volume |
| Cursor-based | Infinite scroll, real-time feeds | Prisma caveat: doesn't always generate LIMIT (GitHub #15710) |
| Raw SQL keyset | >100K rows, complex sorting | Use `$queryRaw` for true cursor perf |

For ~1,185 bible studies and ~1,176 messages, offset pagination is perfectly fine.

### Batch Operations

- `createMany`: Single INSERT, doesn't return records (use `createManyAndReturn` if needed)
- `updateMany`: Single UPDATE with WHERE
- `$transaction()`: Keep short -- holds connection for full duration
- Batched `findUnique`: Auto-batches same-tick calls

### Known Prisma Memory Issues

| Issue | Trigger | Mitigation |
|-------|---------|------------|
| Multiple clients (GitHub #13232) | Creating PrismaClient per request | Singleton pattern (you have this) |
| Large batch ops (GitHub #22346) | `updateMany` on 50K+ rows | Process in batches of 5K |
| Concurrent large queries (#25371) | 700K+ rows with concurrent requests | Add `take` limits, paginate |

---

## 6. PostgreSQL Tuning

### Key Memory Parameters

| Parameter | Default | Recommended (4 GB server) | Notes |
|-----------|---------|--------------------------|-------|
| `shared_buffers` | 128 MB | 768 MB (19% -- conservative since colocated) | PG's page cache. Never exceed 40% of RAM. |
| `work_mem` | 4 MB | 32 MB | Per-sort/hash operation. A query with 8 sorts uses 8x. |
| `effective_cache_size` | 4 GB | 2-3 GB | Advisory only, helps query planner. |
| `maintenance_work_mem` | 64 MB | 256 MB | For VACUUM, CREATE INDEX. Safe to set high. |
| `max_connections` | 100 | 50 | Each uses ~5-10 MB. You only need 5 from the pool. |

### TOAST Optimization

For your 64 large text/JSON columns:

1. **LZ4 compression**: 3-5x faster decompression than default `pglz`:
   ```sql
   ALTER TABLE "Message" ALTER COLUMN "rawTranscript" SET COMPRESSION lz4;
   ```

2. **STORAGE MAIN for small JSONB**: Keep `PageSection.content` inline to avoid TOAST lookups (only for columns consistently <2 KB).

3. **Best TOAST win = don't read TOAST at all** -- which `omit` achieves for list queries.

### Autovacuum Tuning for CMS Workload

```sql
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.05;  -- vacuum at 5% dead tuples (default 20%)
ALTER SYSTEM SET autovacuum_naptime = '10s';              -- check every 10s (default 60s)
ALTER SYSTEM SET autovacuum_vacuum_cost_limit = 800;      -- more work per cycle (default 200)
```

### Finding Missing Indexes

```sql
SELECT schemaname, relname, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 100 AND seq_tup_read > 10000
ORDER BY seq_tup_read DESC;
```

High `seq_scan` + `seq_tup_read` with low `idx_scan` = needs an index.

### Finding Slow Queries (pg_stat_statements)

```sql
-- Enable in postgresql.conf:
-- shared_preload_libraries = 'pg_stat_statements'

SELECT calls, mean_exec_time::numeric(10,2) AS avg_ms,
       total_exec_time::numeric(10,2) AS total_ms, rows, query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 20;
```

### EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT "Message"."id", "Message"."title", "Message"."slug", "Message"."dateFor"
FROM "Message"
WHERE "Message"."churchId" = 'your-uuid' AND "Message"."deletedAt" IS NULL
ORDER BY "Message"."dateFor" DESC LIMIT 25;
```

**Red flags to look for:**
- `Seq Scan` on large tables = needs index
- `Hash Join` with large hash table = reduce result set
- `Sort` with "external merge disk" = increase `work_mem`
- `Buffers: shared read >> shared hit` = increase `shared_buffers`

---

## 7. Connection Pooling

### Current Setup (Good for Now)

```typescript
const pool = new Pool({ max: 5, idleTimeoutMillis: 30000 })
```

This uses `node-postgres` pool directly via `@prisma/adapter-pg`, bypassing Prisma's built-in pool.

### Pool Sizing Guide

| Deployment | Recommended `max` | Rationale |
|------------|-------------------|-----------|
| Single Next.js process | 5-10 | Formula: `(CPU cores * 2) + 1` |
| PM2 cluster (N workers) | `max_connections / N - buffer` | Distribute across workers |
| Serverless (Vercel/Lambda) | 1-2 per function | Functions scale horizontally |
| Edge runtime | 0 | Can't hold TCP connections; use Prisma Accelerate |

### When to Add PgBouncer

Add when:
- Multiple Next.js processes (PM2 cluster mode)
- Serverless deployment (Vercel functions)
- Total connection demand exceeds `max_connections`

```ini
[pgbouncer]
pool_mode = transaction           # Most compatible with Prisma
default_pool_size = 20
max_client_conn = 1000
```

When using PgBouncer with Prisma: add `?pgbouncer=true` to `DATABASE_URL`.

---

## 8. Multi-Tenant Query Patterns

### Application-Level vs Row-Level Security

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| App-level (`WHERE churchId = ?`) | Simple, ORM-native | Must remember in every query | Early stage, small team |
| Row-Level Security (RLS) | DB-enforced, impossible to leak | Complex with Prisma | Production multi-tenant |

**Current approach** (app-level via DAL `churchId` parameter) is correct for this stage. Add RLS when going multi-tenant (Phase D-F):

```sql
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Message"
  USING ("churchId" = current_setting('app.current_tenant_id')::uuid);
```

### Index Strategy

Your schema already has 60+ composite indexes with `churchId` as the leading column -- good.

**Partial indexes** (now native in Prisma 7.4):
```prisma
@@index([churchId, dateFor(sort: Desc)], where: raw("\"deletedAt\" IS NULL"))
```

**Covering indexes** for hot queries:
```sql
CREATE INDEX idx_message_list ON "Message" ("churchId", "dateFor" DESC)
  INCLUDE ("id", "title", "slug")
  WHERE "deletedAt" IS NULL;
```

---

## 9. Production Deployment

### Container/Server Sizing

| Scenario | RAM | --max-old-space-size | PM2 max_memory_restart |
|----------|-----|---------------------|----------------------|
| Your app (current, unoptimized) | 2 GB | 1536 | 1800M |
| Your app (after P0+P1 optimizations) | 1 GB | 768 | 800M |
| Your app (fully optimized) | 1 GB | 768 | 800M |
| Multi-tenant SaaS (future) | 2-4 GB | 75% of RAM | 80% of RAM |

**Rule**: Set `--max-old-space-size` to 60-80% of available RAM.

### Next.js Config Additions

```typescript
// next.config.ts -- recommended additions
experimental: {
  optimizePackageImports: [
    'lucide-react', '@dnd-kit/core', '@dnd-kit/sortable',
    'motion', '@tiptap/core', '@tiptap/pm',
    'date-fns', 'radix-ui',  // ADD THESE
  ],
  serverSourceMaps: false,
  preloadEntriesOnStart: false,       // ADD: reduces cold-start RSS
  webpackMemoryOptimizations: true,   // ADD: build-time only
},
```

### ISR (Incremental Static Regeneration) -- Biggest Production Win

For website routes where content changes infrequently:

```typescript
// app/website/[[...slug]]/page.tsx
export const revalidate = 60  // Re-render at most once per minute
```

Between revalidation intervals, Next.js serves pre-rendered HTML from disk. Zero DB queries, zero Prisma, zero RSC serialization. Wire up `revalidatePath()` in CMS save handlers so edits appear immediately.

### PM2 Configuration

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'laubf-cms',
    script: '.next/standalone/server.js',
    instances: 1,
    max_memory_restart: '800M',
    node_args: '--max-old-space-size=768',
    kill_timeout: 10000,
    listen_timeout: 10000,
    env: { NODE_ENV: 'production', PORT: 3000 },
  }],
}
```

### Long-Term: Two-Process Split

Separate CMS admin from website serving:
- **Process 1 (CMS)**: Full Prisma, all writes, TipTap -- ~500 MB
- **Process 2 (Website)**: Read-only queries, ISR -- ~150-200 MB

Isolates CMS memory pressure from website performance.

---

## 10. Comparable Platform Benchmarks

| Platform | Idle Memory | ORM | Models | Strategy |
|----------|-------------|-----|--------|----------|
| Ghost | 80-120 MB | Knex.js (thin) | ~25 | HTML stored directly |
| Payload CMS | 180-250 MB | Drizzle | ~30-40 | 6x lighter ORM, depth limits |
| Strapi | 380-450 MB | Custom | 40-80 | Fully normalized, similar to yours |
| **Your app (current)** | **~1,000 MB** | **Prisma 7** | **45** | No ISR + 80 MB over-fetch |
| **Your app (after P0+P1)** | **~250-400 MB** | **Prisma 7** | **45** | ISR + omit eliminates spikes |
| **Your app (fully optimized)** | **~200-300 MB** | **Prisma 7** | **36** | Schema consolidation + all opts |

---

## 11. Prioritized Action Items

### P0 -- Immediate (This Week)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Add `omit` to all list queries | 80 MB -> 152 KB per bible study list | Low |
| 2 | Global `omit` on PrismaClient config | Prevents regressions project-wide | Low |
| 3 | Add `export const revalidate = 60` to website routes | Eliminates per-request DB queries for 99% of visits | Low |
| 4 | Add `preloadEntriesOnStart: false` to next.config | Reduces cold-start RSS | Trivial |

### P1 -- Short-Term (Next 2 Weeks)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 5 | Add React `cache()` wrappers for detail page queries | Halves DB round-trips | Low |
| 6 | Add `take` limits to all unbounded nested includes | Prevents memory spikes | Low |
| 7 | Remove `'query'` from Prisma dev logging | Prevents string accumulation in dev | Trivial |
| 8 | Set up `/api/v1/health` endpoint with `process.memoryUsage()` | Production monitoring | Low |
| 9 | Wire up `revalidatePath()` / `revalidateTag()` in CMS save handlers | Completes ISR integration | Medium |

### P2 -- Medium-Term (Next Month)

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 10 | Partial indexes with native Prisma 7.4 syntax | Smaller indexes, faster lookups | Low |
| 11 | LZ4 compression on TOAST columns | 3-5x faster detail page reads | Low |
| 12 | Fix Cartesian explosion in People queries | 20-100 MB at peak | Medium |
| 13 | PostgreSQL tuning (`shared_buffers`, `work_mem`) | Free performance improvement | Low |
| 14 | Autovacuum tuning | Prevents bloat over time | Low |
| 15 | Message/BibleStudy table merge | -9 models, -142 columns, Prisma memory 40-70 -> 22-45 MB | High |

### P3 -- Long-Term

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 16 | Two-process architecture split (CMS vs website) | Isolation, separate scaling | High |
| 17 | PgBouncer (when multi-tenant) | Connection scaling | Medium |
| 18 | Row-Level Security (when multi-tenant) | Data isolation guarantee | High |
| 19 | Prometheus + Grafana monitoring | Sustained memory tracking | Medium |
| 20 | Consider Drizzle for website read paths | 6x lighter than Prisma for read-only | High |

---

## 12. Learning Resources

### Priority 1: Directly Applicable to Your Project

**Vercel Platforms Starter Kit** (GitHub: `vercel/platforms`)
- Multi-tenant architecture, subdomain routing, custom domains, ISR per-tenant
- Directly maps to your Phase D work
- Level: Intermediate

**Matteo Collina -- Node.js Memory Talks** (YouTube: NodeConf/JSConf)
- V8 heap internals, GC generations, memory leak patterns, event loop + GC interaction
- Gold standard for Node.js memory understanding
- Level: Advanced
- Search: `"matteo collina node.js memory"`

**Citus Data / Microsoft -- Multi-Tenant PostgreSQL** (YouTube)
- Tenant isolation, shared-schema patterns, RLS, partitioning
- Directly applicable to your `churchId`-scoped architecture
- Level: Intermediate-Advanced
- Search: `"citus data multi-tenant postgresql"`

**Prisma Official YouTube Channel**
- Connection pooling, N+1 detection, Prisma Accelerate, production patterns
- Search: `"prisma connection pooling"`, `"prisma n+1 problem"`

**Lee Robinson -- Caching Deep-Dives** (YouTube)
- ISR/revalidation strategies for CMS-to-website publishing
- Level: Beginner-Intermediate

### Priority 2: Foundational Knowledge

**"What the heck is the event loop?" by Philip Roberts** (JSConf)
- Legendary intro to the event loop. Foundational.
- Level: Beginner

**Jack Herrington (Blue Collar Coder)** (YouTube)
- RSC internals, App Router patterns, bundle analysis
- Level: Intermediate-Advanced

**Theo Browne (t3.gg)** (YouTube)
- Next.js opinions, RSC tradeoffs, real-world performance issues
- Level: Intermediate

**"Designing Data-Intensive Applications" by Martin Kleppmann** (book + free Cambridge lectures on YouTube)
- Multi-tenant data models, partitioning, caching layers
- The foundational text for data-heavy apps
- Level: Advanced
- Search: `"martin kleppmann designing data intensive applications lecture"`

### Priority 3: Practical Tooling

**NearForm -- clinic.js / Memory Leak Debugging** (YouTube)
- Heap snapshots, flame graphs, detecting production leaks
- Level: Intermediate-Advanced
- Search: `"nearform node.js memory leak"`

**Hussein Nasser** (YouTube)
- Backend fundamentals: connection pooling, TCP, HTTP/2, database drivers
- Level: Beginner-Intermediate

**Dimitri Fontaine -- "The Art of PostgreSQL"** (book + YouTube talks)
- Query optimization, indexing strategies, EXPLAIN ANALYZE
- Gold standard PostgreSQL resource
- Level: Intermediate-Advanced

**pganalyze** (blog + YouTube)
- EXPLAIN visualization, index advisor, monitoring
- Level: Intermediate

**Fireship** (YouTube)
- Quick overviews: Docker, K8s, Nginx, CDN, caching
- Level: Beginner

### Recommended Search Queries

```
"Next.js 15 performance optimization 2025"
"Next.js App Router memory leak"
"Node.js V8 memory management 2024 2025"
"Node.js heap snapshot tutorial"
"PostgreSQL multi-tenant indexing strategy"
"PostgreSQL EXPLAIN ANALYZE tutorial"
"Prisma performance optimization 2025"
"multi-tenant SaaS Next.js architecture"
"website builder architecture tutorial"
"PM2 Node.js production memory"
```

---

## Sources

### Next.js Memory
- [Next.js Official: Memory Usage Guide](https://nextjs.org/docs/app/guides/memory-usage)
- [GitHub #79588: Next.js 14 & 15 High Memory Usage](https://github.com/vercel/next.js/issues/79588)
- [GitHub #88603: Next.js 16.1.0 Memory Leak in Docker/K8s](https://github.com/vercel/next.js/discussions/88603)
- [John Lewis Engineering: Memory Leaks in Next.js](https://medium.com/john-lewis-software-engineering/we-had-a-leak-identifying-and-fixing-memory-leaks-in-next-js-622977876697)
- [Devot: Reduce Memory Usage in Next.js](https://devot.team/blog/nextjs-memory-usage)

### Prisma
- [Prisma 7 Performance Benchmarks](https://www.prisma.io/blog/prisma-7-performance-benchmarks)
- [Prisma: From Rust to TypeScript](https://www.prisma.io/blog/from-rust-to-typescript-a-new-chapter-for-prisma-orm)
- [Prisma Query Optimization Docs](https://www.prisma.io/docs/orm/prisma-client/queries/query-optimization-performance)
- [Prisma Global Omit](https://www.prisma.io/blog/introducing-global-omit-for-model-fields-in-prisma-orm-5-16-0)
- [Prisma Connection Pool Docs](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool)

### PostgreSQL
- [PostgreSQL Performance Tuning 2025](https://www.mydbops.com/blog/postgresql-parameter-tuning-best-practices)
- [EDB: Tune PostgreSQL for Memory](https://www.enterprisedb.com/postgres-tutorials/how-tune-postgresql-memory)
- [PostgreSQL Wiki: Tuning Your Server](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [Postgres JSONB and TOAST Performance](https://pganalyze.com/blog/5mins-postgres-jsonb-toast)

### Node.js Profiling
- [Node.js: Using Heap Profiler](https://nodejs.org/en/learn/diagnostics/memory/using-heap-profiler)
- [Node.js: Using Heap Snapshot](https://nodejs.org/en/learn/diagnostics/memory/using-heap-snapshot)
- [PM2: Memory Profiling](https://pm2.io/docs/plus/guide/memory-profiling/)
