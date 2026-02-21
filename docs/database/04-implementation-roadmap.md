# Implementation Roadmap

## Step-by-Step Plan from Mock Data to Multi-Tenant Production

---

## Phase 0: Foundation (Week 1)

### Step 0.1 — Install Prisma and Configure PostgreSQL

```bash
cd laubf-test
npm install prisma @prisma/client
npx prisma init --datasource-provider postgresql
```

This creates:
- `prisma/schema.prisma` — schema definition file
- `.env` — `DATABASE_URL` connection string

Update `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/digitalchurch?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/digitalchurch?schema=public"
```

For local development, use Docker:
```bash
docker run --name digitalchurch-db \
  -e POSTGRES_USER=digitalchurch \
  -e POSTGRES_PASSWORD=localdev \
  -e POSTGRES_DB=digitalchurch \
  -p 5432:5432 \
  -d postgres:16
```

### Step 0.2 — Write the Prisma Schema

Create the full schema in `prisma/schema.prisma` using the models defined in docs 02 and 03. Start with the core tables:

**Order of definition** (respecting foreign key dependencies):
1. Enums (all enum types)
2. `Church`
3. `User`
4. `ChurchMember`
5. `Session`
6. `Subscription`, `CustomDomain`, `ApiKey`
7. `Speaker`, `Series`, `Ministry`, `Campus`
8. `Tag`, `ContentTag`
9. `Message`, `Event`, `EventLink`
10. `BibleStudy`, `BibleStudyAttachment`
11. `Video`, `DailyBread`
12. `MediaAsset`, `Announcement`, `ContactSubmission`
13. `SiteSettings`, `Theme`, `ThemeCustomization`
14. `Page`, `PageSection`
15. `Menu`, `MenuItem`
16. `AuditLog`

### Step 0.3 — Run Initial Migration

```bash
npx prisma migrate dev --name init
```

This generates SQL and applies it to the local database. Review the generated SQL in `prisma/migrations/` to verify indexes, enums, and constraints are correct.

### Step 0.4 — Generate Prisma Client

```bash
npx prisma generate
```

This creates the typed client at `node_modules/.prisma/client`.

---

## Phase 1: Database Layer (Week 1-2)

### Step 1.1 — Create the Prisma Client Singleton

```
src/lib/db/
├── client.ts          ← Prisma client singleton
├── tenant.ts          ← Multi-tenant extension
├── types.ts           ← Re-export Prisma types
└── seed.ts            ← Seed script
```

**`src/lib/db/client.ts`**:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**`src/lib/db/tenant.ts`**:
```typescript
import { prisma } from './client'
import { tenantExtension } from './extensions/tenant'

export function getTenantDb(churchId: string) {
  return prisma.$extends(tenantExtension(churchId))
}
```

### Step 1.2 — Create the Tenant Context Middleware

```
src/middleware.ts       ← Next.js Edge Middleware
src/lib/tenant/
├── context.ts         ← AsyncLocalStorage for org context
├── resolve.ts         ← Domain → church_id resolution
└── types.ts           ← Tenant context types
```

The middleware:
1. Extracts hostname from request
2. Resolves to `church_id` (custom domain lookup → subdomain extraction → fallback)
3. Sets `x-tenant-id` header
4. Stores in `AsyncLocalStorage` for the request lifecycle

### Step 1.3 — Write the Seed Script

Create `prisma/seed.ts` that:

1. Creates the LA UBF church:
```typescript
const org = await prisma.church.create({
  data: {
    name: 'LA UBF',
    slug: 'la-ubf',
    email: 'contact@laubf.org',
    timezone: 'America/Los_Angeles',
  }
})
```

2. Creates speakers from mock data:
```typescript
// Extract unique speakers from MOCK_MESSAGES
const speakerNames = [...new Set(MOCK_MESSAGES.map(m => m.speaker))]
const speakers = await Promise.all(
  speakerNames.map(name =>
    prisma.speaker.create({
      data: { churchId: org.id, name, slug: slugify(name) }
    })
  )
)
```

3. Creates series from mock data (same pattern)
4. Creates ministries from `MINISTRY_LABELS`
5. Creates campuses from `CAMPUS_LABELS`
6. Migrates all mock messages, events, bible studies, videos, daily bread

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

Run: `npx prisma db seed`

### Step 1.4 — Create Data Access Layer (DAL)

```
src/lib/dal/
├── messages.ts        ← Message CRUD + queries
├── events.ts          ← Event CRUD + queries
├── bible-studies.ts   ← BibleStudy CRUD + queries
├── videos.ts          ← Video CRUD + queries
├── daily-bread.ts     ← DailyBread queries
├── speakers.ts        ← Speaker CRUD
├── series.ts          ← Series CRUD
├── ministries.ts      ← Ministry CRUD
├── campuses.ts        ← Campus CRUD
├── media.ts           ← MediaAsset CRUD
├── pages.ts           ← Page + Section CRUD
├── menus.ts           ← Menu + MenuItem CRUD
├── site-settings.ts   ← SiteSettings CRUD
└── index.ts           ← Re-exports
```

Each DAL module encapsulates Prisma queries and returns typed data. Example:

```typescript
// src/lib/dal/messages.ts
import { getTenantDb } from '@/lib/db/tenant'
import type { MessageFilters } from '@/lib/types/message'

export async function getMessages(churchId: string, filters?: MessageFilters) {
  const db = getTenantDb(churchId)
  return db.message.findMany({
    where: {
      status: 'PUBLISHED',
      ...(filters?.series && { series: { slug: filters.series } }),
      ...(filters?.speaker && { speaker: { slug: filters.speaker } }),
      ...(filters?.dateFrom && { dateFor: { gte: new Date(filters.dateFrom) } }),
      ...(filters?.dateTo && { dateFor: { lte: new Date(filters.dateTo) } }),
    },
    include: { speaker: true, series: true },
    orderBy: { dateFor: 'desc' },
  })
}

export async function getMessageBySlug(churchId: string, slug: string) {
  const db = getTenantDb(churchId)
  return db.message.findUnique({
    where: { churchId_slug: { churchId, slug } },
    include: {
      speaker: true,
      series: true,
      relatedStudy: { include: { attachments: true } },
    },
  })
}
```

---

## Phase 2: API Routes (Week 2-3)

### Step 2.1 — Create CMS API Routes

Replace mock data imports with database queries. Every route is scoped to the authenticated user's `church_id`.

```
src/app/api/v1/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   └── session/route.ts
├── messages/
│   ├── route.ts              ← GET (list) + POST (create)
│   └── [slug]/route.ts       ← GET + PATCH + DELETE
├── events/
│   ├── route.ts
│   └── [slug]/route.ts
├── bible-studies/
│   ├── route.ts
│   └── [slug]/route.ts
├── videos/
│   ├── route.ts
│   └── [slug]/route.ts
├── daily-bread/
│   ├── route.ts              ← GET (today) + POST
│   └── [date]/route.ts       ← GET + PATCH
├── speakers/route.ts
├── series/route.ts
├── ministries/route.ts
├── campuses/route.ts
├── media/
│   ├── route.ts
│   └── upload/route.ts
├── pages/
│   ├── route.ts
│   └── [slug]/
│       ├── route.ts
│       └── sections/route.ts
├── menus/
│   ├── route.ts
│   └── [slug]/route.ts
├── site-settings/route.ts
├── contact/route.ts
└── announcements/route.ts
```

### Step 2.2 — API Response Format

Standardize all API responses:

```typescript
// Success (single)
{ success: true, data: { ... } }

// Success (list)
{ success: true, data: [...], pagination: { total, page, pageSize, totalPages } }

// Error
{ success: false, error: { code: "NOT_FOUND", message: "Message not found" } }
```

### Step 2.3 — API Middleware Stack

Each API route goes through:
1. **Auth middleware** — Verify JWT, extract userId
2. **Tenant middleware** — Resolve churchId, verify membership
3. **Permission middleware** — Check role has access to this operation
4. **Rate limiting** — Per-org, per-user limits
5. **Request validation** — Zod schema validation on body/params
6. **Handler** — Business logic + DAL calls
7. **Audit logging** — Log the action

---

## Phase 3: Replace Mock Data in Pages (Week 3-4)

### Step 3.1 — Update Server Components

Replace every mock data import with DAL calls. Example for the messages page:

**Before** (current):
```typescript
import { MOCK_MESSAGES } from '@/lib/mock-data/messages'

export default function MessagesPage() {
  const messages = MOCK_MESSAGES
  // ...
}
```

**After**:
```typescript
import { getMessages } from '@/lib/dal/messages'
import { getTenantId } from '@/lib/tenant/context'

export default async function MessagesPage() {
  const churchId = getTenantId()
  const messages = await getMessages(churchId)
  // ...
}
```

### Step 3.2 — Update Every Page

Pages to update (in order of priority):

1. **`/messages`** and **`/messages/[slug]`** — Replace `MOCK_MESSAGES` with `getMessages()` / `getMessageBySlug()`
2. **`/events`** and **`/events/[slug]`** — Replace `MOCK_EVENTS` with `getEvents()` / `getEventBySlug()`
3. **`/bible-study`** and **`/bible-study/[slug]`** — Replace `MOCK_BIBLE_STUDIES`
4. **`/videos`** — Replace `MOCK_VIDEOS`
5. **`/daily-bread`** — Replace `TODAYS_DAILY_BREAD`
6. **`/`** (homepage) — Replace all mock data imports for featured content
7. **`/ministries/campus/[campus]`** — Replace campus-specific event queries
8. **Static pages** (`/about`, `/im-new`, `/giving`) — These can remain static initially; section content will come from `PageSection` table later

### Step 3.3 — Update `generateStaticParams`

Current static params are derived from mock data. Update to query the database:

```typescript
export async function generateStaticParams() {
  // For multi-tenant, this needs org context
  // Option A: Build-time generation for known orgs
  // Option B: Switch to dynamic rendering (no static params)
  // Option C: Use ISR with on-demand revalidation
}
```

**Recommended**: Switch to ISR (Incremental Static Regeneration) with `revalidate` for public pages, and fully dynamic for CMS admin pages.

---

## Phase 4: Auth & CMS Admin (Week 4-5)

### Step 4.1 — Implement Authentication

Install NextAuth.js:
```bash
npm install next-auth@beta
```

Configure:
- Email/password login
- JWT session strategy (not database sessions for now)
- `churchId` embedded in JWT token

### Step 4.2 — Build CMS Admin Routes

```
src/app/(admin)/
├── layout.tsx                ← Admin layout with sidebar
├── dashboard/page.tsx        ← Overview dashboard
├── messages/
│   ├── page.tsx              ← Message list (data table)
│   ├── new/page.tsx          ← Create message form
│   └── [slug]/edit/page.tsx  ← Edit message form
├── events/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [slug]/edit/page.tsx
├── bible-studies/...
├── videos/...
├── daily-bread/...
├── media/page.tsx            ← Media library
├── pages/                    ← Page builder (future)
│   ├── page.tsx
│   └── [slug]/edit/page.tsx
├── menus/page.tsx            ← Menu editor (future)
├── settings/
│   ├── general/page.tsx      ← Site settings
│   ├── team/page.tsx         ← Team management
│   └── theme/page.tsx        ← Theme customization
└── analytics/page.tsx
```

### Step 4.3 — CMS Forms

For each content type, build:
1. **List page** — Data table with search, filter, sort, pagination
2. **Create form** — All fields with validation
3. **Edit form** — Pre-populated with existing data
4. **Delete confirmation** — Soft delete with undo option

Use the existing shadcn/ui components (already installed).

---

## Phase 5: Multi-Tenancy (Week 5-7)

### Step 5.1 — Onboarding Flow

Build the church registration flow:

1. Church signs up at `digitalchurch.com/register`
2. Enter church name → auto-generate subdomain slug
3. Create admin account (email + password)
4. Select plan (free tier for MVP)
5. Choose a theme template
6. System creates:
   - `Church` row
   - `User` + `ChurchMember` (OWNER role)
   - `SiteSettings` with defaults
   - `ThemeCustomization` from selected theme
   - Default `Page` + `PageSection` records
   - Default `Menu` + `MenuItem` records

### Step 5.2 — Domain Routing

Update `middleware.ts` to:
1. Check `CustomDomain` table for exact domain match
2. Extract subdomain from `*.digitalchurch.com`
3. Set `church_id` in request context
4. Route to appropriate layout:
   - `*.digitalchurch.com/admin/*` → CMS admin layout
   - `*.digitalchurch.com/*` → Public website layout
   - `digitalchurch.com/*` → Marketing/platform site

### Step 5.3 — Tenant-Scoped Caching

Implement Redis caching with tenant-prefixed keys:
```bash
npm install @upstash/redis
```

Cache strategy:
- Site settings: 60 min
- Theme: 60 min
- Menu: 30 min
- Page sections: 10 min
- Content listings: 5 min

---

## Phase 6: Website Builder (Week 7-10)

### Step 6.1 — Page Management UI

Build admin pages for:
- Viewing all pages
- Creating new pages
- Setting page metadata (title, slug, SEO)
- Publishing/unpublishing pages
- Deleting pages

### Step 6.2 — Section Editor

Build the visual section editor:
1. Display current sections in order
2. Drag-and-drop reordering
3. Add section (choose from section type gallery)
4. Edit section (type-specific form)
5. Remove section
6. Toggle visibility
7. Change color scheme

Each section type needs a dedicated editor form. Start with the most common ones:
- `HERO_BANNER` — Image/video upload, heading, CTA buttons
- `MEDIA_TEXT` — Image + text editor (TinyMCE)
- `CTA_BANNER` — Heading + buttons
- `FAQ_SECTION` — Add/remove/reorder Q&A items
- `ALL_MESSAGES` / `ALL_EVENTS` — Configuration (default view, filters, items per page)

### Step 6.3 — Menu Editor

Build the navigation menu editor:
- Drag-and-drop tree editor
- Add/remove items
- Set labels, links, icons
- Configure dropdown sections
- Featured card setup

### Step 6.4 — Theme Customizer

Build the theme customization UI:
- Color picker for brand colors
- Font selector (Google Fonts)
- Spacing/border radius controls
- Live preview

---

## Phase 7: Production Deployment (Week 10-12)

### Step 7.1 — Database Setup

**Option A: Neon (Recommended for starting)**
- Serverless PostgreSQL with autoscaling
- Built-in connection pooling
- Free tier: 0.5 GB storage, 190 hours compute
- Pro: $19/month, 10 GB storage

**Option B: Supabase**
- PostgreSQL + built-in RLS
- Free tier: 500 MB, 50K MAU
- Pro: $25/month, 8 GB

**Option C: AWS RDS (for scale)**
- Managed PostgreSQL
- Multi-AZ failover
- Read replicas
- Starts ~$30/month (db.t3.micro)

### Step 7.2 — Deploy to Vercel

```bash
vercel deploy --prod
```

Environment variables:
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://digitalchurch.com
REDIS_URL=redis://...
STRIPE_SECRET_KEY=...
```

### Step 7.3 — Wildcard DNS

Configure DNS for `*.digitalchurch.com`:
- A record: `*.digitalchurch.com → Vercel IP`
- Or use Cloudflare proxy with wildcard SSL

### Step 7.4 — Monitoring

- Sentry for error tracking
- Vercel Analytics for performance
- PostHog for product analytics
- UptimeRobot for availability

---

## Additional Engineering Considerations

### 1. Content Versioning

For the website builder, consider adding version history:

```prisma
model PageSectionVersion {
  id            String   @id @default(uuid()) @db.Uuid
  sectionId     String   @db.Uuid
  content       Json     @db.JsonB
  settings      Json     @db.JsonB
  version       Int
  createdAt     DateTime @default(now())
  createdBy     String?  @db.Uuid

  section       PageSection @relation(fields: [sectionId], references: [id])

  @@index([sectionId, version(sort: Desc)])
}
```

This enables "undo" and "view history" in the page builder.

### 2. Scheduled Publishing

The `ContentStatus` enum includes `SCHEDULED`. Implement a cron job:

```typescript
// Runs every minute
const scheduled = await prisma.$queryRaw`
  UPDATE messages SET status = 'PUBLISHED', published_at = NOW()
  WHERE status = 'SCHEDULED' AND date_for <= CURRENT_DATE
  RETURNING id, church_id
`
// Invalidate cache for affected orgs
```

### 3. Full-Text Search

PostgreSQL's built-in `tsvector` is sufficient at this scale. Add search vectors:

```sql
-- Add search column
ALTER TABLE messages ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(passage, '')), 'C')
  ) STORED;

CREATE INDEX idx_messages_search ON messages USING GIN(search_vector);
```

For cross-content search (search across messages, events, studies), consider a unified search view or use a dedicated search service like Meilisearch when you outgrow PostgreSQL full-text.

### 4. Media Upload Pipeline

```
User uploads file → API route → Validate (type, size) →
  → Generate unique key: {church_id}/{folder}/{uuid}.{ext}
  → Upload to S3/R2/Vercel Blob
  → If image: generate thumbnail (sharp)
  → Create MediaAsset row
  → Return CDN URL
```

Recommended: **Vercel Blob** for simplicity, **Cloudflare R2** for cost at scale.

### 5. Webhook System for Cache Invalidation

When CMS content changes, the public website needs to know:

```typescript
// After any CMS write operation
async function onContentChange(churchId: string, entity: string, entityId: string) {
  // 1. Invalidate Redis cache
  await redis.del(`church:${churchId}:${entity}:*`)

  // 2. Revalidate ISR pages
  await fetch(`/api/revalidate?tag=${churchId}-${entity}`)

  // 3. Log audit trail
  await prisma.auditLog.create({ data: { churchId, entity, entityId, action: 'UPDATE' } })
}
```

### 6. Rate Limiting by Tenant

Prevent a single church from overwhelming the system:

```typescript
const RATE_LIMITS = {
  FREE:         { api: 100,  uploads: 10,  storage: 500_000_000 },   // 500MB
  STARTER:      { api: 1000, uploads: 50,  storage: 2_000_000_000 }, // 2GB
  GROWTH:       { api: 5000, uploads: 200, storage: 10_000_000_000 },
  PROFESSIONAL: { api: 20000, uploads: 500, storage: 50_000_000_000 },
  ENTERPRISE:   { api: -1,   uploads: -1,  storage: -1 },            // Unlimited
}
```

### 7. Database Maintenance

Schedule regular PostgreSQL maintenance:

```sql
-- Weekly: Update statistics for query planner
ANALYZE messages;
ANALYZE events;
ANALYZE page_sections;

-- Monthly: Reclaim dead tuple space
VACUUM ANALYZE messages;
VACUUM ANALYZE events;

-- Quarterly: Purge old soft-deleted records (>90 days)
DELETE FROM messages WHERE deleted_at < NOW() - INTERVAL '90 days';
DELETE FROM events WHERE deleted_at < NOW() - INTERVAL '90 days';

-- Quarterly: Purge old audit logs (>1 year)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
```

### 8. Data Export & Portability

Churches should be able to export their data:

```typescript
// Export all content for an org as JSON
async function exportOrgData(churchId: string) {
  const [messages, events, studies, videos, dailyBreads, pages, settings] = await Promise.all([
    prisma.message.findMany({ where: { churchId } }),
    prisma.event.findMany({ where: { churchId } }),
    prisma.bibleStudy.findMany({ where: { churchId } }),
    prisma.video.findMany({ where: { churchId } }),
    prisma.dailyBread.findMany({ where: { churchId } }),
    prisma.page.findMany({ where: { churchId }, include: { sections: true } }),
    prisma.siteSettings.findUnique({ where: { churchId } }),
  ])

  return { messages, events, studies, videos, dailyBreads, pages, settings }
}
```

---

## Implementation Priority Matrix

| Priority | Task | Dependencies | Effort |
|---|---|---|---|
| **P0** | Install Prisma + write schema | None | 1-2 days |
| **P0** | Run migration + seed LA UBF data | Schema | 1 day |
| **P0** | Create DAL modules | Migration | 2-3 days |
| **P0** | Replace mock data in pages | DAL | 2-3 days |
| **P1** | Authentication (NextAuth) | DAL | 2-3 days |
| **P1** | CMS API routes (CRUD) | Auth + DAL | 3-4 days |
| **P1** | CMS admin forms | API routes | 5-7 days |
| **P2** | Multi-tenant middleware | Auth | 2-3 days |
| **P2** | Church onboarding flow | Multi-tenant | 3-4 days |
| **P2** | Redis caching layer | Multi-tenant | 2-3 days |
| **P3** | Page builder UI | Pages table + Sections | 5-7 days |
| **P3** | Menu editor | Menus table | 2-3 days |
| **P3** | Theme customizer | Theme tables | 3-4 days |
| **P3** | Media upload pipeline | MediaAsset table | 2-3 days |
| **P4** | Production deployment | All above | 2-3 days |
| **P4** | Monitoring + alerting | Deployment | 1-2 days |
| **P4** | Custom domain support | Deployment | 2-3 days |

---

## Next Immediate Action Items

1. **Set up local PostgreSQL** (Docker) and install Prisma
2. **Write the complete `schema.prisma`** file using docs 02 and 03
3. **Run `prisma migrate dev`** to create all tables
4. **Write the seed script** to migrate mock data to the database
5. **Create the DAL modules** for messages, events, bible studies, videos, daily bread
6. **Update the homepage** server component to use DAL instead of mock data
7. **Update messages pages** (`/messages` + `/messages/[slug]`) to use DAL
8. **Update events pages** to use DAL
9. **Continue through all remaining pages**
10. **Build CMS authentication** once all public pages are database-backed

---

## Review Notes & Corrections

> Added during roadmap review — cross-referencing against docs 01-03 and the live codebase.

### Roadmap Assessment

**Overall phasing: LOGICAL and correctly sequenced.** The progression from schema -> DAL -> API -> page integration -> auth -> multi-tenancy -> website builder -> production is the correct order. Each phase builds on the previous one.

### Issues Found

1. **Two separate Next.js apps not addressed.** The project has two separate Next.js apps: the CMS admin at `/app/cms/` (root `package.json`) and the public website at `/laubf-test/` (its own `package.json`). The roadmap assumes a single app. Phases 3 and 4 must clarify which app is being modified. The seed script and DAL must be shared or duplicated. Recommendation: consolidate into a single Next.js app with route groups `(admin)` and `(public)` before starting database work, or document the cross-app sharing strategy for Prisma client and DAL modules.

2. **CMS admin pages already exist.** Phase 4 (Auth & CMS Admin) says "Build CMS Admin Routes" with a proposed structure starting from scratch. But the CMS already has working pages: `/cms/dashboard`, `/cms/events` (list + new + edit), `/cms/messages` (list + new + edit + series), `/cms/media`, `/cms/people` (directory + groups + members), `/cms/giving` (donations + payments + reports), `/cms/website/domains`, and `/cms/church-profile`. The roadmap should reference these existing pages and describe integration, not creation from scratch.

3. **Effort estimates for P0 are too aggressive.** "Install Prisma + write schema: 1-2 days" is realistic. But the full schema from docs 02 and 03 includes 20+ models, 15+ enums, JSONB content structures, and complex relations (MessageSeries many-to-many, self-referential MenuItem, polymorphic ContentTag). With proper validation and testing, 2-3 days is more accurate for the schema alone. Seed script alone is 1-2 days given the volume of mock data transformation needed.

4. **Missing: Zod validation schemas.** The roadmap mentions API middleware with "Zod schema validation on body/params" but doesn't include a phase for creating these schemas. With 10+ content types, each needing create/update validation schemas, this is 2-3 days of work that should be explicit.

5. **Phase ordering issue: Auth before multi-tenant is correct for single-tenant MVP, but the public website pages need tenant context.** Phase 3 (Replace Mock Data) switches pages to use DAL with `getTenantId()`, but tenant resolution middleware isn't built until Phase 5. For a single-tenant MVP, the churchId can be hardcoded or pulled from an env var, but this should be stated explicitly.

6. **Phase 6 (Website Builder) effort is underestimated.** The section editor alone requires form builders for 35+ section types, each with unique JSONB structures. The 5-7 day estimate for "Page builder UI" covers maybe 5-8 section types. A realistic estimate for all section types is 3-4 weeks. Recommendation: prioritize the 10 most-used section types and defer the rest.

7. **Missing phase: Data migration strategy.** Between mock data and production, there's a gap for migrating real content (existing YouTube sermons, actual events). The seed script handles mock data, but a separate phase should cover importing real LA UBF content from whatever source it currently lives in (Google Sheets, existing website, manual entry).

8. **ISR/caching strategy needs more detail.** Phase 3 mentions switching to ISR but doesn't specify which pages use `revalidate` vs dynamic rendering. For a multi-tenant app, ISR with `revalidatePath` or `revalidateTag` per org is critical. This deserves its own sub-phase.

### Priority Matrix Corrections

| Original | Correction | Reason |
|---|---|---|
| P0: Replace mock data — 2-3 days | 3-5 days | 29+ pages in laubf-test need updating, many with complex data fetching |
| P1: CMS admin forms — 5-7 days | 3-5 days (integration only) | Forms already exist; effort is wiring to API, not building from scratch |
| P2: Multi-tenant middleware — 2-3 days | 1-2 days | Can be simpler initially with hardcoded org for single-tenant MVP |
| P3: Page builder UI — 5-7 days | 15-20 days | 35+ section type editors is substantial work |
| P3: Media upload pipeline — 2-3 days | 3-5 days | Includes S3/R2 integration, thumbnail generation, CDN setup |
