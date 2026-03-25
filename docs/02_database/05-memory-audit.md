# Database & Server Memory Audit

> **Date**: 2026-03-25 (updated with 8-agent investigation)
> **Prisma**: v7.4.1 with `@prisma/adapter-pg` + `pg` driver
> **Next.js**: 16.1.6 (App Router, React 19.2.3)
> **Schema**: 45 models, 27 enums, 1,754 lines
> **Observed memory**: ~1,000 MB in **production** (`next start`)
> **Target memory**: <300 MB production

---

## Executive Summary

An 8-agent parallel investigation audited the full Prisma schema (column-by-column), all DAL modules, API routes, Prisma client configuration, and external research on CMS platforms (Ghost, Payload, Strapi, WordPress, Sanity).

### The Problem

Production (`next start`) is using ~1 GB. For a single-tenant CMS with minimal data (one church, <500 records per content type), this is 3-5x what comparable platforms use:

| Platform | Idle Memory | ORM | Tables |
|----------|-------------|-----|--------|
| Ghost | 80-120 MB | Knex.js | ~25 |
| **Payload CMS** | **180-250 MB** | **Drizzle** | **~30-40** |
| Strapi | 380-450 MB | Custom | 40-80 |
| **Our app** | **~1,000 MB** | **Prisma 7** | **45** |

### Root Causes (Ranked by Permanent Steady-State Impact)

Assuming all pages and features are actively used (worst case — every route visited, every query executed):

| # | Cause | Est. Memory | Permanent Fix? |
|---|-------|-------------|----------------|
| 1 | No ISR/caching — every page render hits DB live, results held in memory until GC | 100-300 MB per request cycle | YES — ISR serves from disk, not memory |
| 2 | Large text/JSON fields (transcripts, bible study content, section JSON) loaded in queries that don't need them | 50-200 MB depending on concurrent requests | YES — `select`/`omit` permanently reduces per-query allocation |
| 3 | Prisma engine + DMMF for 45 models | 40-70 MB baseline (always resident) | Partially — consolidation reduces this |
| 4 | Deep nested includes cause cartesian data explosion (people + roles + households) | Variable 20-100 MB spikes | YES — query refactoring is permanent |
| 5 | Schema bloat: 370 columns, 65 indexes, 27 enums generate large type surface | ~15-20 MB in Prisma client overhead | YES — consolidation reduces generated code |
| 6 | Connection pool idle connections | 10-25 MB | YES — reduce pool |
| 7 | Content stored as large inline JSON/Text in hot tables (PageSection.content, Message transcripts, BibleStudy Q&A) | Proportional to data size — grows over time | YES — storage strategy changes are permanent |

### Projected Savings (Honest Assessment)

Each fix is evaluated assuming **all features are in active use** (no "first visit" tricks):

| Change | Permanent? | Steady-State Savings | Effort | Priority |
|--------|-----------|---------------------|--------|----------|
| **ISR for website routes** | **YES** — serves HTML from disk, not memory | 100-300 MB | 1-2 days | **P0** |
| **Prisma `omit` / `select` for large fields** | **YES** — less data loaded per query, always | 10-50 MB/request | 2 hours | **P0** |
| **DAL query refactoring** (select, take limits, no cartesian) | **YES** — every query loads less data permanently | 20-100 MB at peak | 2-3 days | **P0** |
| **Schema consolidation** (45→37 models, 370→242 cols) | **YES** — smaller Prisma client in memory | 15-20 MB | 2-3 weeks | **P1** |
| **Content storage optimization** (JSON blobs, lazy-load heavy text) | **YES** — less data per row touched | Proportional to data growth | 1-2 weeks | **P1** |
| Reduce connection pool (5→3) | YES | 4-10 MB | 1 line | **P1** |
| `preloadEntriesOnStart: false` | **NO** — only delays loading, same memory once all pages visited | 0 at steady state | 1 line | Skip |
| `serverExternalPackages` for Prisma | **Already handled** — bundler already deduplicates (verified in build output) | 0 | N/A | Skip |
| `webpackMemoryOptimizations` | **Dev only** — zero production impact | 0 in production | 1 line | Skip |
| `--max-old-space-size=512` | **Diagnostic only** — forces GC or crashes if memory is real; already configured | 0 (just exposes truth) | Already done | Diagnostic |

**Conservative estimate**: P0 changes alone should reduce production from ~1 GB to **400-600 MB**. With P1 changes, target is **300-400 MB**.

---

## Part 1: Permanent Fixes (P0)

> **Honesty note on config "quick wins"**: Several config flags (`preloadEntriesOnStart`, `serverExternalPackages`, `webpackMemoryOptimizations`) were initially listed as P0 fixes. After verification:
> - `preloadEntriesOnStart: false` only delays module loading — once all pages are visited, memory is identical. **Not a real fix** for a fully-used app.
> - `serverExternalPackages` for Prisma — **already handled** by the bundler. Build output shows Prisma in only 3 shared chunks (~900K total), not duplicated per route.
> - `webpackMemoryOptimizations` — dev mode only, zero production impact.
> - `--max-old-space-size=512` — already configured. Useful as a diagnostic (will it crash?), not a fix.
>
> These are excluded from the P0 list below. Only permanent, steady-state improvements remain.

### 1.1 ISR for Website Routes

Currently, every website page render triggers 12+ database queries (page + sections + layout + theme). For a church website where content changes maybe once a day, this is wasteful.

```typescript
// app/website/[[...slug]]/page.tsx
export const revalidate = 60  // Revalidate every 60 seconds

// app/website/layout.tsx
export const revalidate = 300  // Layout data changes less frequently
```

With ISR, only the first request per 60 seconds hits the database. All subsequent requests serve cached HTML — **zero Prisma queries, zero memory spike**.

### 1.4 Prisma `omit` for Large Fields

Prevent transcript and description fields from loading in list views:

```typescript
// lib/db/client.ts
return new PrismaClient({
  adapter,
  omit: {
    message: { rawTranscript: true, liveTranscript: true, transcriptSegments: true },
    bibleStudy: { questions: true, answers: true, transcript: true, bibleText: true },
    event: { description: true, locationInstructions: true, welcomeMessage: true },
    dailyBread: { body: true, bibleText: true },
    siteSettings: { customHeadHtml: true, customBodyHtml: true },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})
```

These fields are only needed in detail views and can be explicitly included with `select` when needed. The `omit` feature prevents accidental over-fetching project-wide.

Also changed: query logging from `['query', 'error', 'warn']` to `['error', 'warn']` in dev. Logging every SQL query creates string allocations that accumulate.

---

## Part 2: Config & Pool Fixes (P1 — This Week)

### 2.1 Full `next.config.ts` Optimizations

```typescript
experimental: {
  preloadEntriesOnStart: false,
  webpackMemoryOptimizations: true,
  serverSourceMaps: false,  // Already set
  optimizePackageImports: [
    'lucide-react',
    '@dnd-kit/core',
    '@dnd-kit/sortable',
    'motion',
    '@tiptap/core',
    '@tiptap/pm',
    '@tiptap/starter-kit',  // ADD if used
    '@tiptap/extension-link',  // ADD if used
  ],
},
```

### 2.2 Reduce Connection Pool

```typescript
// lib/db/client.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '3'),  // Was 5, reduce to 3
  idleTimeoutMillis: 20000,  // Was 30000, reduce idle time
})
```

Each PostgreSQL connection holds ~2-5 MB in Node.js. Reducing from 5 to 3 saves ~4-10 MB. With ISR in place, concurrent query volume drops dramatically.

### 2.3 Add `--max-old-space-size` to Start Script

```json
"start": "NODE_OPTIONS='--max-old-space-size=512' next start"
```

This forces V8 to garbage collect more aggressively, keeping RSS lower. Without this flag, Node.js defaults to ~1.4 GB and gets lazy about GC.

---

## Part 3: DAL Query Fixes (P1 — This Week)

### 3.1 High-Risk DAL Functions

| Function | File | Issue | Fix |
|----------|------|-------|-----|
| `getPeople()` | people.ts | 2-level nested includes; 7-condition OR search | Use `select`, add `take` to nested relations |
| `getPersonById()` | people.ts | 4-level include chain; unbounded customFieldValues | Add `take: 50` to all nested arrays |
| `getRoleDefinitions()` | person-roles.ts | Loads ALL assignments per role | Split into two functions: meta + paginated assignments |
| `getPeopleByRole()` | person-roles.ts | Cartesian: 500 people x 5 roles = 2500 records | Use `select`, paginate |
| `getMessages()` | messages.ts | Transcript text fetched in list view | Use `select` to exclude (or rely on `omit`) |
| `resolveSectionData()` | resolve-section-data.ts | 12+ concurrent queries on homepage | ISR eliminates this in most cases |

### 3.2 Pattern: Replace `include` with `select` in Lists

```typescript
// BEFORE (fetches everything including transcripts)
const messageListInclude = {
  speaker: true,
  messageSeries: { include: { series: true } },
}

// AFTER (fetches only what the list UI needs)
const messageListSelect = {
  id: true, slug: true, title: true, videoTitle: true,
  passage: true, dateFor: true, hasVideo: true, hasStudy: true,
  youtubeId: true, thumbnailUrl: true, duration: true,
  speaker: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
  messageSeries: { select: { series: { select: { id: true, name: true, slug: true } } } },
}
```

### 3.3 Add `take` to All Nested 1:Many

```typescript
// BEFORE
include: { assignments: { include: { person: true } } }

// AFTER
include: {
  assignments: {
    take: 50,
    include: { person: { select: { id: true, firstName: true, lastName: true } } }
  }
}
```

Targets: customFieldValues, communicationPreferences, attachments, assignments, members.

---

## Part 4: Platform Comparison & Strategy Research

### How Other CMS Platforms Handle This

**Ghost (80-120 MB idle)**:
- Only ~25 tables total
- Uses Knex.js (lightweight query builder, no engine binary, no code generation)
- Content stored inline as HTML/markdown in the posts table
- Settings stored as key-value pairs in a single `settings` table (like WordPress `wp_options`)

**Payload CMS (180-250 MB idle)**:
- Uses **Drizzle ORM** (not Prisma) — 6x lighter memory footprint
- Blocks can be stored as JSON columns instead of separate tables
- One main table per collection with normalized columns

**WordPress (12 core tables, runs 40% of the web)**:
- Uses EAV (Entity-Attribute-Value) via `wp_postmeta` — unlimited flexibility with zero schema changes
- `wp_posts` stores ALL content types using a `post_type` discriminator
- `wp_options` is a single key-value table for ALL settings
- Compensates for slow EAV queries with aggressive object caching

**Sanity.io**:
- Fully document-based — ALL content stored as JSON documents
- Zero traditional tables
- Only requires `_id` and `_type` fields
- Proves that a CMS can work with no relational schema at all

### Key Lesson

Every successful CMS uses one of two strategies:
1. **Fewer tables + JSON flexibility** (WordPress, Sanity, Ghost)
2. **Lighter ORM** (Payload with Drizzle, Ghost with Knex)

Our app uses the heaviest ORM (Prisma) with the most tables (45). This combination is the root cause.

---

## Part 5: Schema Consolidation Opportunities (P2)

These are the "variety of extremes" — ranging from easy JSON consolidation to aggressive table merging. Each is scored by effort and side effects.

### Strategy A: JSON Blob Consolidation (Reduce Columns, Keep Tables)

Merge groups of related nullable columns into single JSONB fields. This doesn't reduce model count but reduces the Prisma generated client size and simplifies queries.

| Model | Columns to Merge | Into | Saves | Effort | Side Effects |
|-------|-------------------|------|-------|--------|-------------|
| **Event** | 8 recurrence cols (`recurrence`, `recurrenceDays`, `recurrenceEndType`, `recurrenceEndDate`, `recurrenceEndAfter`, `customRecurrence`, `monthlyRecurrenceType`, `recurrenceSchedule`) | `recurrenceConfig Json? @db.JsonB` | 7 columns | LOW | Update events DAL + UI forms |
| **Event** | 6 registration cols (`registrationUrl`, `registrationCount`, `costType`, `costAmount`, `registrationRequired`, `maxParticipants`, `registrationDeadline`) | `registrationConfig Json? @db.JsonB` | 6 columns | LOW | Update events DAL + UI forms |
| **Event** | 7 location cols (`locationType`, `location`, `address`, `locationInstructions`, `directionsUrl`, `latitude`, `longitude`, `meetingUrl`) | `locationConfig Json? @db.JsonB` | 7 columns | LOW | Update events DAL + UI forms; lose direct index on location fields |
| **Person** | 4 phone cols (`phone`, `mobilePhone`, `homePhone`) + redundant address cols (`city`, `state`, `zipCode`, `country` — already have `address` JSON) | `phones Json? @db.JsonB` + remove city/state/zip/country | 7 columns | MEDIUM | Update person DAL + all person UIs; need migration for existing data |
| **MenuItem** | 4 featured cols (`featuredImage`, `featuredTitle`, `featuredDescription`, `featuredHref`) | `featured Json? @db.JsonB` | 3 columns | LOW | Update menu DAL + menu editor UI |
| **Church** | 5 social URL cols (`websiteUrl`, `facebookUrl`, `instagramUrl`, `youtubeUrl`, `twitterUrl`) | `socialLinks Json? @db.JsonB` | 4 columns | LOW | Update church DAL; SiteSettings has its own social URLs too (duplication!) |
| **SiteSettings** | 7 social URL cols + 6 nav cols + 3 maintenance cols | Group into `social Json?`, `navConfig Json?`, `maintenance Json?` | 13 columns | MEDIUM | Update site-settings DAL + admin UI |

**Total column reduction**: ~47 columns across 4 models
**Impact on memory**: Modest (2-5 MB from smaller generated types). Real win is simpler queries and less generated code.

### Strategy B: Table Merging (Reduce Model Count)

| Merge | From | Into | Models Saved | Effort | Side Effects |
|-------|------|------|-------------|--------|-------------|
| **SiteSettings → Church** | SiteSettings (36 cols) | `Church.siteSettings Json @db.JsonB` | 1 model | HIGH | Rewrite site-settings DAL, all admin forms, website layout. Currently 1:1 with Church — perfect JSON candidate. BUT: lose column-level type safety. |
| **ThemeCustomization → Church** | ThemeCustomization (17 cols) | `Church.themeConfig Json @db.JsonB` | 1 model | HIGH | Rewrite theme DAL, ThemeProvider, admin theme editor. Currently 1:1 — good JSON candidate. |
| **Tag → Remove** | Tag model | Delete entirely | 1 model | LOW | Tag is vestigial — no active relations. Zero side effects. |
| **MessageSeries → Message** | MessageSeries junction | `Message.seriesIds String[]` or JSON | 1 model | MEDIUM | Rewrite message-series queries. Lose relational integrity on series membership. |
| **EventLink → Event** | EventLink | `Event.links Json? @db.JsonB` | 1 model | LOW | Always fetched with parent event. Perfect JSON candidate. |
| **BibleStudyAttachment → BibleStudy** | BibleStudyAttachment | `BibleStudy.attachments Json? @db.JsonB` | 1 model | LOW | Already a simple child with 6 fields. Always fetched with parent. |
| **MediaFolder → Remove or Church** | MediaFolder | `Church.mediaFolders String[]` or just use folder field on MediaAsset | 1 model | LOW | Minimal usage — just folder names. |
| **BuilderPresence → In-memory** | BuilderPresence | Redis or in-memory store | 1 model | MEDIUM | Ephemeral data that doesn't need SQL. |
| **CustomFieldValue → Person** | CustomFieldValue | `Person.customFields Json? @db.JsonB` | 1 model | MEDIUM | Lose ability to query by custom field value across people. |
| **CommunicationPreference → Person** | CommunicationPreference | `Person.commPrefs Json? @db.JsonB` | 1 model | LOW | Always fetched per-person. Small data. |
| **HouseholdMember → Household** | HouseholdMember | `Household.members Json @db.JsonB` (array of {personId, role}) | 1 model | MEDIUM | Lose relational integrity. Can't query "which households is Person X in?" easily. |
| **PersonRoleAssignment → PersonRoleDefinition** | PersonRoleAssignment | Query with JSON or keep but merge into Person.roles | 1 model | HIGH | Core to people management. High risk. |

**Conservative merge target**: Remove Tag, EventLink, BibleStudyAttachment, MediaFolder, CommunicationPreference, BuilderPresence = **6 models removed** (45 → 39)
**Aggressive merge target**: Also merge SiteSettings, ThemeCustomization, CustomFieldValue, HouseholdMember, MessageSeries = **11 models removed** (45 → 34)

### Strategy C: Content Separation (Lazy Loading)

Move heavy text content to separate tables loaded only on demand:

| Content | Current Location | Move To | Why |
|---------|-----------------|---------|-----|
| Message transcripts | `Message.rawTranscript`, `liveTranscript`, `transcriptSegments` | `MessageContent` table (1:1) | 5-50 KB each, never needed in lists |
| BibleStudy content | `BibleStudy.questions`, `answers`, `transcript`, `bibleText` | `BibleStudyContent` table (1:1) | 5-50 KB each, never needed in lists |

With Prisma `omit` (Strategy 1.4), this becomes less urgent — `omit` achieves the same effect at the query level without schema changes.

### Strategy D: Enum Reduction

27 enums generate significant TypeScript code. Which can be simplified?

| Enum | Values | Used for Filtering? | Recommendation |
|------|--------|---------------------|----------------|
| BibleBook | 66 values | Yes (index) | KEEP — essential for Bible study queries |
| SectionType | 42 values | Yes (index) | KEEP — core to website builder |
| EventType | 3 | Yes | KEEP |
| ContentStatus | 4 | Yes (index) | KEEP |
| VideoCategory | 7 | Yes | KEEP |
| MembershipStatus | 5 | Yes (index) | KEEP |
| AttachmentType | 6 | No (display only) | Could be String |
| NoteType | 5 | Minimal | Could be String |
| HouseholdRole | 5 | No | Could be String |
| AnnouncePriority | 4 | No | Could be String |
| CustomFieldType | 8 | No | Could be String |
| CommunicationChannel | 4 | No | Could be String |
| AccessRequestStatus | 4 | Minimal | Could be String |
| ColorScheme | 4 | No | Could be String |
| PaddingSize | 4 | No | Could be String |
| ContainerWidth | 3 | No | Could be String |
| MenuLocation | 4 | Yes | KEEP |
| DomainStatus | 3 | No | Could be String |
| SslStatus | 3 | No | Could be String |
| RecurrenceEndType | 3 | No | Absorbed into JSON |
| Recurrence | 7 | No | Absorbed into JSON |

**13 enums could become plain Strings**, reducing generated type code by ~30-40%. But this sacrifices type safety at the schema level. Alternative: keep enums in Prisma but they generate less code in Prisma 7 than in Prisma 5.

### Strategy E: Index Reduction

Each index consumes PostgreSQL memory. Over-indexed models:

| Model | Current Indexes | Needed | Can Drop |
|-------|----------------|--------|----------|
| Event | 10 | 4-5 | `isPinned`, `isFeatured`, `isRecurring` (low cardinality, rarely filtered alone) |
| Message | 5 | 3 | `hasVideo`, `hasStudy` (boolean indexes rarely useful) |
| Person | 5 | 3-4 | All needed for search |
| Page | 4 | 3 | `pageType` (rarely filtered alone) |

**Savings**: Minimal on Node.js memory (indexes live in PostgreSQL, not Node.js). But fewer indexes = faster writes.

---

## Part 6: Architecture-Level Options (P3 — Strategic)

### Option 1: ISR + On-Demand Revalidation (Recommended)

The single highest-impact change. Cache all website pages and revalidate on CMS save.

```
Website visitor → CDN/Next.js cache → cached HTML (zero DB queries)
CMS admin saves → revalidateTag('pages') → next visitor gets fresh data
```

Memory impact: Website routes drop from ~300 MB of live DB queries to ~0 MB (serving cached HTML).

### Option 2: Split CMS + Website into Two Processes

- **Process 1**: CMS admin (Next.js + Prisma, full stack, ~500 MB budget)
- **Process 2**: Website (lightweight Next.js, ISR-only, 150-200 MB budget)

Total: ~700 MB across 2 processes vs ~1 GB in one. Better isolation and independent scaling.

### Option 3: Drizzle for Website Read Paths

Keep Prisma for CMS writes. Use Drizzle (6x lighter) for website read queries.

| Metric | Prisma 7 | Drizzle |
|--------|----------|---------|
| Engine overhead | 15-25 MB | 0 |
| Schema in memory | 15-35 MB | 2-5 MB |
| Total baseline | 40-70 MB | 5-15 MB |

Migration effort: 2-3 weeks for website DAL only. Could save 30-55 MB.

### Option 4: Prisma Accelerate (Offload Engine)

Moves the Prisma query engine to Prisma's cloud infrastructure. Your server only has a thin HTTP client (~2-3 MB instead of 40-70 MB).

- Saves: 40-60 MB
- Cost: Paid per-query pricing
- Latency: Adds 5-20 ms per query (acceptable with ISR)

---

## Part 7: Implementation Roadmap

### Phase 1: Config Fixes (Day 1, ~2 hours)
1. Add `preloadEntriesOnStart: false` to next.config.ts
2. Add `@prisma/adapter-pg` and `pg` to `serverExternalPackages`
3. Add `webpackMemoryOptimizations: true`
4. Add `--max-old-space-size=512` to start script
5. Reduce connection pool from 5 to 3
6. Reduce dev Prisma logging to `['error', 'warn']`
7. **Measure**: Build + start + load pages + check RSS

### Phase 2: Prisma Query Fixes (Days 2-3, ~1 day)
1. Add `omit` config for all large text/JSON fields
2. Replace `include` with `select` in message, event, and people list queries
3. Add `take` limits to all nested 1:many includes
4. Refactor `getPeopleByRole()` and `getRoleDefinitions()` to avoid cartesian
5. **Measure**: Check per-request memory delta

### Phase 3: ISR Implementation (Days 4-5, ~1 day)
1. Add `revalidate = 60` to website catch-all page
2. Add `revalidate = 300` to website layout
3. Add `revalidateTag`/`revalidatePath` calls in CMS save handlers
4. **Measure**: Website routes should show near-zero DB queries after first load

### Phase 4: Schema Consolidation (Week 2-3, optional)
1. Remove Tag model (unused)
2. Merge EventLink → Event.links JSON
3. Merge BibleStudyAttachment → BibleStudy.attachments JSON
4. Merge Event recurrence/registration/location columns into JSON blobs
5. Evaluate SiteSettings → Church.siteSettings JSON merge
6. **Measure**: Check generated client size reduction

### Phase 5: Architecture (Month 2+, if needed)
1. Evaluate process splitting (CMS + Website)
2. Evaluate Drizzle for website reads
3. Evaluate Prisma Accelerate

---

## Part 8: Monitoring & Measurement

### Before/After Measurement Protocol

```bash
# 1. Build production
npm run build

# 2. Start with memory limit
NODE_OPTIONS='--max-old-space-size=512' npm start &

# 3. Wait for server ready, then load key pages
sleep 5
curl -s http://localhost:3000/ > /dev/null
curl -s http://localhost:3000/cms/messages > /dev/null
curl -s http://localhost:3000/cms/events > /dev/null
curl -s http://localhost:3000/cms/people/members > /dev/null

# 4. Check memory
ps aux | grep "next-server" | grep -v grep | awk '{printf "RSS: %.1f MB\n", $6/1024}'

# 5. Or use Node.js API in an API route:
# GET /api/v1/debug/memory -> process.memoryUsage()
```

### Key Metrics to Track

| Metric | Current | Phase 1 Target | Phase 3 Target |
|--------|---------|----------------|----------------|
| Production RSS (idle) | ~1,000 MB | <600 MB | <400 MB |
| Production RSS (after 10 pages) | Unknown | <700 MB | <450 MB |
| Homepage DB queries | 12+ per render | 12+ (uncached) | 0 (cached) |
| Generated client size | 4.7 MB | 4.7 MB | ~3.5 MB (after consolidation) |
| Connection pool size | 5 | 3 | 3 |

### Ongoing Monitoring

```bash
# Add to package.json for easy access
"scripts": {
  "mem": "ps aux | grep next-server | grep -v grep | awk '{printf \"RSS: %.1f MB\\n\", $6/1024}'"
}
```

---

## Part 9: Complete Consolidation Matrix (Column-by-Column Audit)

### Generated Client Size by Model

The Prisma generated client (4.7 MB total) is dominated by these files:

| Model File | Size | Notes |
|-----------|------|-------|
| Church.ts | 624 KB | 29 columns + 35 relations = massive type tree |
| Person.ts | 196 KB | 32 columns + 9 relations |
| Event.ts | 192 KB | 40 columns + 4 relations |
| BibleStudy.ts | 136 KB | 30 columns + 4 relations |
| Message.ts | 132 KB | 35 columns + 4 relations |
| SiteSettings.ts | ~80 KB | 36 columns (1:1 merge candidate) |
| All others (40 files) | ~3.3 MB | Average ~82 KB each |

### 9.1 Table Merges — Detailed

#### Merge 1: SiteSettings + ThemeCustomization → Church JSON (P0)

SiteSettings (36 cols) and ThemeCustomization (17 cols) are both 1:1 with Church. Each generates a full model file + relation types + query delegates.

**Result:**
```prisma
Church {
  siteSettings  Json?  @db.JsonB   // all 36 SiteSettings columns
  themeConfig   Json?  @db.JsonB   // themeId + all ThemeCustomization overrides
}
```

**Affected files:**
- `lib/dal/site-settings.ts` — full rewrite (read/write `church.siteSettings`)
- `lib/dal/theme.ts` — `getThemeWithCustomization` → read `church.themeConfig` + join Theme
- `app/api/v1/site-settings/` — update handlers
- `app/api/v1/themes/` — update customization handlers
- `components/website/theme/` — ThemeProvider reads from new shape
- `app/website/layout.tsx` — layout data assembly

**Eliminates:** 2 models, ~53 typed columns → 2 JSON columns
**Effort:** MEDIUM | **Impact:** HIGH

#### Merge 2: Remove Tag (P0)

Tag has **zero references** in any DAL or API route. Completely dead code.

**Eliminates:** 1 model, 5 columns, 2 indexes
**Effort:** LOW (delete from schema) | **Impact:** LOW

#### Merge 3: EventLink → Event.links JSON (P1)

Max ~5 links per event. Simple `{label, href, external}` objects always fetched with parent.

```prisma
Event {
  links  Json?  @db.JsonB  // [{label, href, external, sortOrder}]
}
```

**Eliminates:** 1 model, 5 columns, 1 index
**Effort:** LOW | **Impact:** LOW

#### Merge 4: BibleStudyAttachment → BibleStudy.attachments JSON (P2)

Small child table (6 fields). Message already has `attachments Json?`.

**Eliminates:** 1 model, 6 columns, 1 index
**Effort:** MEDIUM | **Impact:** LOW

#### Merge 5: CommunicationPreference → Person JSON (P2)

Tiny table, rarely queried independently, always fetched per-person.

**Eliminates:** 1 model, 5 columns, 1 enum, 1 index
**Effort:** LOW | **Impact:** LOW

#### Merge 6: MediaFolder → Remove (P2)

MediaAsset already has `folder String` field. MediaFolder just duplicates folder names.

**Eliminates:** 1 model, 4 columns, 2 indexes
**Effort:** LOW | **Impact:** LOW

### 9.2 Column Consolidation — Detailed

#### Event Model: 40 → 20 columns (P1)

| Group | Current Columns | Consolidated To | Columns Saved |
|-------|----------------|-----------------|---------------|
| Recurrence | `recurrence`, `recurrenceDays`, `recurrenceEndType`, `recurrenceEndDate`, `recurrenceEndAfter`, `customRecurrence`, `monthlyRecurrenceType`, `recurrenceSchedule` | `recurrenceRule Json?` | 8 → 1 |
| Registration | `registrationUrl`, `registrationCount`, `costType`, `costAmount`, `registrationRequired`, `maxParticipants`, `registrationDeadline` | `registration Json?` | 7 → 1 |
| Location | `locationType`, `location`, `address`, `locationInstructions`, `directionsUrl`, `latitude`, `longitude`, `meetingUrl` | `locationData Json?` | 8 → 1 |
| **Total** | **23 columns** | **3 JSON columns** | **-20 columns** |

Also eliminates enums: `Recurrence`, `RecurrenceEndType`, `LocationType`

#### Person Model: 32 → 25 columns (P1)

| Change | Columns Saved |
|--------|---------------|
| `phone`, `mobilePhone`, `homePhone` → `phones Json?` | 3 → 1 |
| Remove `city`, `state`, `zipCode`, `country` (already in `address Json?`) | 4 → 0 |
| Remove `notes` (PersonNote table exists for this) | 1 → 0 |
| **Total** | **-7 columns** |

#### MenuItem: 15 → 12 columns (P2)

`featuredImage`, `featuredTitle`, `featuredDescription`, `featuredHref` → `featured Json?` (-3 columns)

#### Church: Remove Duplicates After SiteSettings Merge (P0)

After merging SiteSettings into Church, remove 10 duplicated columns:
- Social URLs: `websiteUrl`, `facebookUrl`, `instagramUrl`, `youtubeUrl`, `twitterUrl` (now in siteSettings JSON)
- Contact: `address`, `city`, `state`, `zipCode` (now in siteSettings JSON)
- Branding: `accentColor` (now in themeConfig JSON)

### 9.3 Enum Reduction: 27 → 9

**Keep (9):** ChurchStatus, PlanTier, MemberRole, SubStatus, ContentStatus, EventType, BibleBook, SectionType, MembershipStatus

**Remove (3 — absorbed into JSON blobs):** Recurrence, RecurrenceEndType, LocationType

**Convert to String (15):** AttachmentType, AnnouncePriority, NoteType, HouseholdRole, CommunicationChannel, CustomFieldType, VideoCategory, MaritalStatus, Gender, MenuLocation, PageType, PageLayout, DomainStatus, SslStatus, AccessRequestStatus

### 9.4 Index Reduction: 12 Redundant Indexes

| Model | Remove | Reason |
|-------|--------|--------|
| Event | `[churchId, campusId]` | Rarely filtered by campus alone |
| Event | `[churchId, status]` | Covered by `[churchId, status, dateStart]` |
| Event | `[churchId, isFeatured]` | Boolean — too low cardinality |
| Event | `[churchId, isPinned]` | Boolean — too low cardinality |
| Event | `[churchId, isRecurring]` | Boolean — too low cardinality |
| Message | `[churchId, hasVideo]` | Boolean — too low cardinality |
| Message | `[churchId, hasStudy]` | Boolean — too low cardinality |
| BibleStudy | `[churchId, status]` | Small table, seq scan faster |
| Page | `[churchId, isPublished]` | Boolean, <100 pages |
| Page | `[churchId, isHomepage]` | Boolean, only 1 true per church |
| Session | `[token]` | Redundant — `@unique` already creates index |
| Church | `[slug]` | Redundant — `@unique` already creates index |

### 9.5 Final Totals

| Metric | Before | After (All Changes) | Delta |
|--------|--------|---------------------|-------|
| **Models** | 45 | 37 | **-8** |
| **Enums** | 27 | 9 | **-18** |
| **Columns** | ~370 | ~242 | **-128** |
| **Indexes** | ~65 | ~53 | **-12** |
| **Generated client (est)** | 4.7 MB | ~3.0 MB | **-36%** |
| **Prisma memory (est)** | 40-70 MB | 25-50 MB | **-15-20 MB** |

### 9.6 Execution Order

**Sprint 1 (P0 — Low Risk, High Value):**
1. Remove Tag table
2. Remove 12 redundant indexes
3. Merge SiteSettings + ThemeCustomization → Church JSON
4. Remove 10 duplicate Church columns

**Sprint 2 (P1 — Medium Risk, Medium Value):**
5. Event: Consolidate recurrence/registration/location (23 cols → 3 JSON)
6. EventLink → Event.links JSON
7. Person: Consolidate phones + address duplication
8. Convert 15 enums to Strings

**Sprint 3 (P2 — Low Risk, Low Value):**
9. MenuItem featured → JSON
10. ContactSubmission processing → JSON
11. Remove legacyId from Message + BibleStudy
12. Merge BibleStudyAttachment, CommunicationPreference, MediaFolder

---

## Appendix A: Church Model — Duplication Analysis

The Church model and SiteSettings have overlapping fields:

| Field | Church | SiteSettings | Recommendation |
|-------|--------|-------------|----------------|
| logoUrl | Yes | Yes | Keep in SiteSettings only (website-facing) |
| faviconUrl | Yes | Yes | Keep in SiteSettings only |
| email | Yes | contactEmail | Deduplicate — one source of truth |
| phone | Yes | contactPhone | Deduplicate |
| address | Yes | contactAddress | Deduplicate |
| facebookUrl | Yes | Yes | Deduplicate |
| instagramUrl | Yes | Yes | Deduplicate |
| youtubeUrl | Yes | Yes | Deduplicate |
| twitterUrl | Yes | Yes | Deduplicate |
| accentColor | Yes | primaryColor (ThemeCustomization) | Deduplicate |

**9 duplicated fields** between Church and SiteSettings/ThemeCustomization. This is a sign that SiteSettings should be the single source of truth for website-facing data, and Church should only hold tenant/billing metadata.

## Appendix B: Event Model — Column Bloat Analysis

Event has **40 scalar fields** — the most of any model. Breakdown:

| Group | Columns | Can Consolidate? |
|-------|---------|-----------------|
| Core identity | 5 (id, churchId, slug, title, type) | No |
| Scheduling | 5 (dateStart, dateEnd, startTime, endTime, allDay) | No |
| Location | 8 (locationType, location, address, instructions, directionsUrl, lat, lng, meetingUrl) | **YES → `location Json?`** |
| Content | 6 (shortDescription, description, welcomeMessage, coverImage, imageAlt, imagePosition) | Partially — descriptions stay, image fields → JSON |
| Contacts | 1 (contacts JSON) | Already JSON |
| Categorization | 3 (ministryId, campusId, badge) | No (FKs needed) |
| Registration | 7 (url, count, costType, costAmount, required, maxParticipants, deadline) | **YES → `registration Json?`** |
| Flags | 3 (isFeatured, isPinned, isRecurring) | No (indexed) |
| Recurrence | 8 (recurrence, days, endType, endDate, endAfter, custom, monthlyType, schedule) | **YES → `recurrence Json?`** |
| Publishing | 2 (status, publishedAt) | No |
| Metadata | 7 (viewCount, timestamps, createdBy, updatedBy, deletedAt) | No |

**23 columns can be consolidated into 3 JSON blobs**, reducing Event from 40 → 20 columns.

## Appendix C: Research Sources

### CMS Platform Research
- Ghost: ~25 tables, Knex.js, 80-120 MB idle
- Payload CMS: Drizzle ORM, 180-250 MB idle, blocks as JSON
- Strapi: Fully normalized, 380-450 MB idle, 4 GB recommended
- WordPress: 12 core tables, EAV pattern, aggressive caching
- Sanity.io: Fully document-based, zero tables

### Prisma Memory Research
- Prisma 7 WASM compiler: ~1.6 MB bundle (was 14 MB in Rust)
- Generated client (45 models): 4.7 MB on disk, ~40-70 MB in memory
- Drizzle: 6x lighter than Prisma (5-15 MB vs 40-70 MB)
- Model count → memory is roughly linear: reducing models saves ~0.5-1 MB each
- `preloadEntriesOnStart: false` documented in Next.js memory guide

### GitHub Issues Referenced
- [Prisma #16184](https://github.com/prisma/prisma/issues/16184) — Schema size spikes memory
- [Prisma #25371](https://github.com/prisma/prisma/issues/25371) — RSS on concurrent queries
- [Prisma #29011](https://github.com/prisma/prisma/issues/29011) — Prisma 7 TS compilation slowdown
- [Next.js #78069](https://github.com/vercel/next.js/issues/78069) — Dev server 10 GB+ memory
- [Next.js #85666](https://github.com/vercel/next.js/issues/85666) — Dev memory leak in async calls
- [Next.js #79588](https://github.com/vercel/next.js/issues/79588) — Production high memory
