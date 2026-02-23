# AI-Optimized Next Steps

## Phased Implementation Prompts for Claude Code Agent Teams

This document provides copy-paste-ready prompts for implementing the Digital Church Platform database layer and CMS integration. Each prompt is self-contained and can be given directly to a Claude Code agent team session.

> **Current state of the project** (as of February 2026):
> - Two separate Next.js apps: CMS admin (`/app/cms/`) and public website (`/laubf-test/`)
> - CMS admin has working pages for events, messages, media, people, giving, and church profile — all using in-memory mock data from `/lib/events-data.ts`, `/lib/messages-data.ts`, `/lib/media-data.ts`
> - Public website has 29+ pages using mock data from `/laubf-test/src/lib/mock-data/` (messages, events, bible-studies, daily-bread, videos)
> - 38 section components built in `/laubf-test/src/components/sections/`
> - TypeScript types defined in `/laubf-test/src/lib/types/` (message.ts, events.ts, bible-study.ts, daily-bread.ts, video.ts, sections.ts, shared.ts)
> - Tech stack: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Tiptap editor, Tanstack Table, Motion, date-fns
> - **Prisma 7.4.1 and @prisma/client are installed** (Phase 1.1 COMPLETE)
> - `prisma/schema.prisma` exists with **32 models and 22 enums**
> - `prisma.config.ts` exists (Prisma 7.x config format — datasource URL configured here, not in schema.prisma)
> - `docker-compose.yml` exists (local dev uses native PostgreSQL 18 instead of Docker)
> - `.env` has `DATABASE_URL` and `DIRECT_URL` configured
> - Database schema fully designed in docs 01-04 at `/docs/database/`

---

## Phase 1: Database Foundation

### Phase 1.1: Install Prisma and Create Schema

**Effort**: M (2-3 days)
**Dependencies**: None
**What this does**: Sets up the PostgreSQL database tooling and creates the complete Prisma schema with all 32 models and 22 enums. This is the foundation everything else builds on. The schema must match the design documents exactly to avoid rework later.

> **STATUS: PHASE 1.1 IS COMPLETE.** Prisma 7.4.1 is installed, `prisma/schema.prisma` exists with 32 models and 22 enums, `docker-compose.yml` exists, `.env` is configured, and `npx prisma validate` passes.

#### Prompt:

> I need you to set up Prisma with PostgreSQL for this Next.js project. The database schema has been fully designed in documentation files. Please do the following:
>
> **1. Install dependencies** in the root project (`/Users/davidlim/Desktop/laubf-cms-test`):
> ```
> npm install prisma @prisma/client
> npx prisma init --datasource-provider postgresql
> ```
>
> **2. Create the complete Prisma schema** in `prisma/schema.prisma`. The full schema is documented across two files — read both completely before writing any code:
> - `/Users/davidlim/Desktop/laubf-cms-test/docs/database/02-cms-database-schema.md` — Contains all CMS models (Church, User, ChurchMember, Session, Subscription, CustomDomain, ApiKey, Speaker, Series, Ministry, Campus, Tag, ContentTag, Message, MessageSeries, Event, EventLink, BibleStudy, BibleStudyAttachment, Video, DailyBread, MediaAsset, Announcement, ContactSubmission, AuditLog) and all enums.
> - `/Users/davidlim/Desktop/laubf-cms-test/docs/database/03-website-database-schema.md` — Contains website builder models (SiteSettings, Page, PageSection, Menu, MenuItem, Theme, ThemeCustomization) and their enums (SectionType, PageType, PageLayout, ColorScheme, PaddingSize, ContainerWidth, MenuLocation).
>
> Copy the Prisma model definitions EXACTLY as written in these docs. They have been reviewed and verified against the codebase. Do NOT modify field names, types, relations, or indexes.
>
> **3. Set up the .env file** with a local PostgreSQL connection string:
> ```
> DATABASE_URL="postgresql://digitalchurch:localdev@localhost:5432/digitalchurch?schema=public"
> DIRECT_URL="postgresql://digitalchurch:localdev@localhost:5432/digitalchurch?schema=public"
> ```
>
> **4. Add a Docker Compose file** (`docker-compose.yml`) at the project root for local PostgreSQL:
> ```yaml
> services:
>   db:
>     image: postgres:16
>     environment:
>       POSTGRES_USER: digitalchurch
>       POSTGRES_PASSWORD: localdev
>       POSTGRES_DB: digitalchurch
>     ports:
>       - "5432:5432"
>     volumes:
>       - pgdata:/var/lib/postgresql/data
> volumes:
>   pgdata:
> ```
>
> **5. Make sure `.env` is in `.gitignore`** (it should already be, but verify).
>
> **Important constraints:**
> - Do NOT run `prisma migrate` yet — we need to review the schema first
> - Do NOT modify any existing source files
> - Do NOT install any packages in the `laubf-test/` subdirectory
> - The schema must be a single `schema.prisma` file (not split)
> - Use `@db.Uuid` for all UUID primary keys
> - Use `@db.JsonB` for all Json fields
> - Use `@db.Text` for all long text fields (descriptions, transcripts, HTML content)
> - Use `@db.Date` for date-only fields (dateFor, dateStart, datePublished, etc.)

#### Verification:
- [x] `prisma/schema.prisma` exists with all models from docs 02 and 03 (32 models, 22 enums)
- [x] All enums are defined (ChurchStatus, PlanTier, MemberRole, ContentStatus, EventType, LocationType, Recurrence, RecurrenceEndType, BibleBook, AttachmentType, VideoCategory, AnnouncePriority, SubStatus, DomainStatus, SslStatus, SectionType, PageType, PageLayout, ColorScheme, PaddingSize, ContainerWidth, MenuLocation)
- [x] All relations have correct `@relation` annotations and `onDelete` behavior
- [x] All composite unique constraints are present (e.g., `@@unique([churchId, slug])`)
- [x] All indexes are present per the docs
- [x] `.env` has DATABASE_URL and DIRECT_URL
- [x] `docker-compose.yml` exists at project root
- [x] `.env` is in `.gitignore`
- [x] `npx prisma validate` passes without errors

---

### Phase 1.2: Run Migration and Create Prisma Client Singleton

**Effort**: S (half day)
**Dependencies**: Phase 1.1
**What this does**: Applies the schema to the database, creating all tables, indexes, and constraints. Also creates the Prisma client singleton that will be imported everywhere in the application.

#### Prompt:

> The Prisma schema has been created in `prisma/schema.prisma`. Now I need to:
>
> **1. Start the local PostgreSQL** (Docker must be running):
> ```
> docker compose up -d
> ```
>
> **2. Run the initial migration**:
> ```
> npx prisma migrate dev --name init
> ```
> Review the generated SQL in `prisma/migrations/` to verify it looks correct.
>
> **3. Generate the Prisma client**:
> ```
> npx prisma generate
> ```
>
> **4. Create the Prisma client singleton** at `lib/db/client.ts` (create the `lib/db/` directory under the ROOT project, not under `laubf-test/`):
>
> ```typescript
> import { PrismaClient } from '@/lib/generated/prisma/client'
>
> const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
>
> export const prisma = globalForPrisma.prisma ?? new PrismaClient({
>   log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
> })
>
> if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
> ```
>
> **Note**: This project uses Prisma 7.x with `prisma.config.ts` for configuration. The datasource URL is configured in `prisma.config.ts`, not in `schema.prisma`. The Prisma client output is set to `../lib/generated/prisma` in the schema's generator block, so imports use `@/lib/generated/prisma/client` instead of `@prisma/client`.
>
> **5. Create a types re-export** at `lib/db/types.ts`:
> ```typescript
> export type { Church, User, Message, Event, BibleStudy, Video, DailyBread, Speaker, Series, Ministry, Campus, Page, PageSection, Menu, MenuItem, SiteSettings, ThemeCustomization, Theme, MediaAsset, Tag, ContentTag, Announcement, ContactSubmission, AuditLog } from '@/lib/generated/prisma/client'
> export { ContentStatus, EventType, Recurrence, BibleBook, VideoCategory, SectionType, PageType, MemberRole, ChurchStatus, PlanTier } from '@/lib/generated/prisma/client'
> ```
>
> **6. Create a barrel export** at `lib/db/index.ts`:
> ```typescript
> export { prisma } from './client'
> export * from './types'
> ```
>
> **Important**: The root project does NOT have a `src/` directory. All code lives directly under the project root in `lib/`, `app/`, `components/`, etc. Create `lib/db/` at `/Users/davidlim/Desktop/laubf-cms-test/lib/db/`, NOT under `laubf-test/`. The root project's `tsconfig.json` maps `@/*` to the project root.

#### Verification:
- [x] PostgreSQL is running (native PostgreSQL 18 on localhost)
- [x] `prisma/migrations/` directory contains the init migration with SQL (`20260223222632_init/migration.sql`)
- [ ] `npx prisma studio` opens and shows all tables (run briefly to verify, then close)
- [x] `lib/db/client.ts` exists with singleton pattern (imports from `@/lib/generated/prisma/client`)
- [x] `lib/db/types.ts` re-exports all 32 model types and 22 enum types
- [x] `lib/db/index.ts` barrel export works
- [x] TypeScript compilation has no errors related to Prisma imports — verified via `npx tsc --noEmit` (only pre-existing laubf-test/ issues remain)

---

### Phase 1.3: Seed Script with Mock Data Migration

**Effort**: M (1-2 days)
**Dependencies**: Phase 1.2
**What this does**: Creates a seed script that transforms the existing mock data into proper database records. This is critical because it ensures the transition from mock data to database is seamless — the same content appears on the site, just served from PostgreSQL instead of TypeScript arrays.

#### Prompt:

> I need a comprehensive seed script that migrates all existing mock data into the database. Create `prisma/seed.ts`.
>
> **Read these mock data files first** to understand the data structures:
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/messages.ts` — `MOCK_MESSAGES` array of `Message` objects
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/events.ts` — `MOCK_EVENTS` array of `Event` objects
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/bible-studies.ts` — `MOCK_BIBLE_STUDIES` array
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/videos.ts` — `MOCK_VIDEOS` array
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/daily-bread.ts` — daily bread data
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/messages-data.ts` — CMS message type + data (separate from public website data)
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/events-data.ts` — CMS event type + data
>
> **Also read the type definitions** to understand the field mappings:
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/message.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/events.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/bible-study.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/video.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/daily-bread.ts`
>
> **Also read the field mapping reference** in `/Users/davidlim/Desktop/laubf-cms-test/docs/database/02-cms-database-schema.md` section "4. Field Mapping Reference" — this documents exactly how each TypeScript field maps to a Prisma field.
>
> The seed script must:
>
> 1. **Create the LA UBF Church**:
>    - name: "LA UBF", slug: "la-ubf", email: "laubf.downey@gmail.com"
>    - timezone: "America/Los_Angeles"
>    - Address: "11625 Paramount Blvd, Downey, CA 90241"
>    - Phone: "(562) 396-6350"
>
> 2. **Extract and create Speakers** from unique speaker names across messages and bible studies. Create proper slugs (e.g., "P. William" -> "p-william").
>
> 3. **Extract and create Series** from unique series names across messages and bible studies.
>
> 4. **Create Ministries** from the `MINISTRY_LABELS` map in the events-data.ts file. The labels are: "young-adult" -> "Young Adult", "adult" -> "Adult", "children" -> "Children", "high-school" -> "High School", "church-wide" -> "Church-Wide".
>
> 5. **Create Campuses** from the `CAMPUS_LABELS` map in the events-data.ts file. Campuses include: LBCC, CSULB, CSUF, UCLA, USC, CSUDH, CCC, Mt. SAC, Golden West, Cypress, Cal Poly Pomona.
>
> 6. **Migrate Messages** — Map each `MOCK_MESSAGES` entry to a `Message` row. Key mappings:
>    - `speaker` (string) -> look up `speakerId` from created speakers
>    - `series` (string) -> create `MessageSeries` join table entries
>    - `dateFor` (string) -> parse to DateTime
>    - `youtubeId` -> store directly
>    - Set `status: "PUBLISHED"` for all mock data
>    - Set `hasVideo: true` where `youtubeId` exists
>
> 7. **Migrate Events** — Map each `MOCK_EVENTS` entry to an `Event` row. Key mappings:
>    - `ministry` (MinistryTag string) -> look up `ministryId`
>    - `campus` (CampusTag string) -> look up `campusId`
>    - `date` -> `dateStart`, `endDate` -> `dateEnd`
>    - `locationType` string -> `LocationType` enum
>    - `recurrence` string -> `Recurrence` enum
>    - `type` string -> `EventType` enum (uppercase)
>    - `links` array -> store as JSONB
>
> 8. **Migrate Bible Studies** — similar pattern with speaker/series normalization
>
> 9. **Migrate Videos** — direct mapping, category string -> `VideoCategory` enum
>
> 10. **Migrate Daily Bread** — direct mapping
>
> 11. **Create a default Theme** (platform-level):
>     - name: "Modern Church", slug: "modern-church", isDefault: true
>     - defaultTokens with the CSS custom properties from `/laubf-test/src/lib/theme.ts`
>
> 12. **Create SiteSettings** for LA UBF with actual site data (name, tagline, social URLs, contact info)
>
> 13. **Create ThemeCustomization** linking LA UBF to the default theme
>
> **Add to root `package.json`**:
> ```json
> "prisma": {
>   "seed": "npx tsx prisma/seed.ts"
> }
> ```
>
> **Install tsx** if not present: `npm install -D tsx`
>
> **Important constraints:**
> - Use `$transaction` for the entire seed to ensure atomicity
> - Use `upsert` instead of `create` so the seed is idempotent (can run multiple times)
> - Generate deterministic UUIDs or use `deleteMany` + `create` pattern with a guard
> - Handle the bidirectional Message <-> BibleStudy relation carefully (create studies first, then messages with relatedStudyId, or use a two-pass approach)
> - Do NOT modify any existing source files
> - All string-to-enum conversions must handle case differences (mock data uses lowercase, Prisma enums use UPPER_CASE)

#### Verification:
- [x] `prisma/seed.mts` exists and compiles without TypeScript errors (note: renamed from `seed.ts` to `seed.mts` for ESM support)
- [x] `npx prisma db seed` runs successfully
- [ ] `npx prisma studio` shows data in all major tables — not tested yet
- [x] Message count in DB matches MOCK_MESSAGES count — 28 messages in DB
- [x] Event count in DB matches MOCK_EVENTS count — 11 events in DB
- [x] Speaker and Series tables are populated with normalized entries — 11 speakers, 3 series
- [x] MessageSeries join table has entries linking messages to their series — 28 entries
- [x] Running seed again doesn't create duplicates (idempotent) — verified via re-seed after delete test

---

## Phase 2: Data Access Layer

### Phase 2.1: Create DAL Modules for All Content Types

**Effort**: M (2-3 days)
**Dependencies**: Phase 1.3
**What this does**: Creates a clean data access layer that encapsulates all database queries. Every page in the app will import from the DAL instead of mock data files. The DAL handles tenant scoping, soft-delete filtering, and relation includes.

#### Prompt:

> Create a Data Access Layer (DAL) at `lib/dal/` in the root project. The DAL provides typed functions for querying content, replacing the current mock data imports.
>
> **First, read the existing mock data helper functions** to understand what query patterns the pages currently use:
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/messages.ts` — has `getMessageBySlug(slug)` and exports `MOCK_MESSAGES` array
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/events.ts` — see what filter/sort patterns are used
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/bible-studies.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/videos.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/mock-data/daily-bread.ts`
>
> **Also read the page components** to understand what data shapes they expect:
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/messages/page.tsx` and `[slug]/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/events/page.tsx` and `[slug]/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/bible-study/page.tsx` and `[slug]/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/videos/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/daily-bread/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/page.tsx` (homepage)
>
> **Read the existing TypeScript interfaces** that pages currently consume:
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/message.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/events.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/bible-study.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/video.ts`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/lib/types/daily-bread.ts`
>
> Create these DAL modules:
>
> **`lib/dal/messages.ts`**:
> - `getMessages(churchId, filters?)` — List published messages, ordered by dateFor DESC. Include speaker and series relations. Support filters: speakerId, seriesId, dateFrom, dateTo, search text. Support pagination (page, pageSize).
> - `getMessageBySlug(churchId, slug)` — Single message with speaker, series, and related bible study (with attachments).
> - `getLatestMessage(churchId)` — Most recent published message (for SpotlightMedia section).
> - `getMessagesBySeriesSlug(churchId, seriesSlug)` — Messages in a series.
> - `createMessage(churchId, data)` — Create new message (for CMS).
> - `updateMessage(churchId, slug, data)` — Update existing message.
> - `deleteMessage(churchId, slug)` — Soft delete.
>
> **`lib/dal/events.ts`**:
> - `getEvents(churchId, filters?)` — List published events. Support filters: type (EventType), ministryId, campusId, dateFrom, dateTo, isFeatured, isRecurring. Support pagination.
> - `getEventBySlug(churchId, slug)` — Single event with ministry, campus, and links.
> - `getUpcomingEvents(churchId, limit?)` — Next N upcoming events (dateStart >= today).
> - `getRecurringEvents(churchId)` — All recurring meetings/programs.
> - `getEventsByMinistry(churchId, ministrySlug)` — Events for a specific ministry.
> - `getEventsByCampus(churchId, campusSlug)` — Events for a specific campus.
> - `getFeaturedEvents(churchId, limit?)` — Featured events for homepage.
> - `createEvent(churchId, data)`, `updateEvent(churchId, slug, data)`, `deleteEvent(churchId, slug)`.
>
> **`lib/dal/bible-studies.ts`**:
> - `getBibleStudies(churchId, filters?)` — List with speaker, series. Filters: book (BibleBook enum), seriesId, speakerId. Pagination.
> - `getBibleStudyBySlug(churchId, slug)` — With attachments, speaker, series, related message.
> - `createBibleStudy(churchId, data)`, `updateBibleStudy`, `deleteBibleStudy`.
>
> **`lib/dal/videos.ts`**:
> - `getVideos(churchId, filters?)` — Filters: category (VideoCategory), isShort. Pagination.
> - `getVideoBySlug(churchId, slug)`.
> - `createVideo`, `updateVideo`, `deleteVideo`.
>
> **`lib/dal/daily-bread.ts`**:
> - `getTodaysDailyBread(churchId)` — Today's devotional.
> - `getDailyBreadByDate(churchId, date)`.
> - `getDailyBreads(churchId, limit?)` — Recent devotionals.
> - `createDailyBread`, `updateDailyBread`.
>
> **`lib/dal/speakers.ts`**:
> - `getSpeakers(churchId)` — All active speakers sorted by sortOrder.
> - `getSpeakerBySlug(churchId, slug)`.
> - `createSpeaker`, `updateSpeaker`, `deleteSpeaker`.
>
> **`lib/dal/series.ts`**:
> - `getAllSeries(churchId)` — All active series.
> - `getSeriesBySlug(churchId, slug)`.
> - `createSeries`, `updateSeries`, `deleteSeries`.
>
> **`lib/dal/ministries.ts`**:
> - `getMinistries(churchId)`, `getMinistryBySlug(churchId, slug)`.
> - `createMinistry`, `updateMinistry`.
>
> **`lib/dal/campuses.ts`**:
> - `getCampuses(churchId)`, `getCampusBySlug(churchId, slug)`.
> - `createCampus`, `updateCampus`.
>
> **`lib/dal/site-settings.ts`**:
> - `getSiteSettings(churchId)`.
> - `updateSiteSettings(churchId, data)`.
>
> **`lib/dal/pages.ts`**:
> - `getPageBySlug(churchId, slug)` — With sections ordered by sortOrder.
> - `getPages(churchId)` — All pages.
> - `createPage`, `updatePage`, `deletePage`.
>
> **`lib/dal/menus.ts`**:
> - `getMenuByLocation(churchId, location)` — With nested items.
> - `getMenus(churchId)`.
>
> **`lib/dal/index.ts`** — Re-export everything.
>
> **Design principles:**
> - Every function takes `churchId` as the first parameter for tenant scoping
> - All queries filter by `deletedAt: null` (soft delete)
> - All list queries default to `status: 'PUBLISHED'` for read functions, but CMS functions should accept any status
> - Use Prisma `include` for relations, not separate queries
> - Return Prisma types directly (no manual transformation)
> - For the single-tenant MVP, the churchId will come from an environment variable (`CHURCH_ID`) or be resolved from the request context
>
> **Important: Do NOT modify any existing files.** Only create new files in `lib/dal/`.

#### Verification:
- [x] All DAL modules exist in `lib/dal/` — 13 modules: messages, events, bible-studies, videos, daily-bread, speakers, series, ministries, campuses, site-settings, pages, menus, types
- [x] `lib/dal/index.ts` exports all modules
- [x] TypeScript compilation passes with no errors
- [x] Each module imports from `@/lib/db` (barrel export of the Prisma singleton)
- [x] All functions include `churchId` parameter for tenant scoping
- [x] List functions include `deletedAt: null` filter
- [x] List functions include pagination support (messages, events, bible-studies, videos)
- [x] Include relations are correct (messages: speaker+series, events: ministry+campus+links, bible-studies: speaker+series+attachments, pages: sections, menus: nested items)

---

## Phase 3: CMS API Routes

### Phase 3.1: Create CRUD API Routes for Content Types

**Effort**: L (3-4 days)
**Dependencies**: Phase 2.1
**What this does**: Creates RESTful API routes that the CMS admin UI will call to create, read, update, and delete content. These routes use the DAL and add authentication, validation, and error handling.

#### Prompt:

> Create API routes for the CMS at `/Users/davidlim/Desktop/laubf-cms-test/app/api/v1/`. The CMS admin pages already exist at `/app/cms/` and currently use in-memory data. These API routes will replace the in-memory data with real database operations.
>
> **First, read the existing CMS pages** to understand what operations they perform:
> - `/Users/davidlim/Desktop/laubf-cms-test/app/cms/messages/page.tsx` — Message list with DataTable
> - `/Users/davidlim/Desktop/laubf-cms-test/app/cms/messages/new/page.tsx` — Create message form
> - `/Users/davidlim/Desktop/laubf-cms-test/app/cms/messages/[id]/page.tsx` — Edit message form
> - `/Users/davidlim/Desktop/laubf-cms-test/app/cms/events/page.tsx` — Event list
> - `/Users/davidlim/Desktop/laubf-cms-test/app/cms/events/new/page.tsx` — Create event form
> - `/Users/davidlim/Desktop/laubf-cms-test/app/cms/events/[id]/page.tsx` — Edit event form
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/messages-data.ts` — Current CMS message types and mock data
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/events-data.ts` — Current CMS event types and mock data
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/messages-context.tsx` — Current context provider for messages
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/events-context.tsx` — Current context provider for events
>
> Create these API route files:
>
> ```
> app/api/v1/
> ├── messages/
> │   ├── route.ts              GET (list with pagination/filters) + POST (create)
> │   └── [slug]/route.ts       GET (single) + PATCH (update) + DELETE (soft delete)
> ├── events/
> │   ├── route.ts              GET + POST
> │   └── [slug]/route.ts       GET + PATCH + DELETE
> ├── bible-studies/
> │   ├── route.ts              GET + POST
> │   └── [slug]/route.ts       GET + PATCH + DELETE
> ├── videos/
> │   ├── route.ts              GET + POST
> │   └── [slug]/route.ts       GET + PATCH + DELETE
> ├── daily-bread/
> │   ├── route.ts              GET (list/today) + POST
> │   └── [date]/route.ts       GET + PATCH
> ├── speakers/
> │   └── route.ts              GET (list) + POST (create)
> ├── series/
> │   └── route.ts              GET (list) + POST (create)
> ├── ministries/
> │   └── route.ts              GET + POST
> ├── campuses/
> │   └── route.ts              GET + POST
> └── site-settings/
>     └── route.ts              GET + PATCH
> ```
>
> **Each route handler should:**
> 1. Extract churchId (for now, hardcode from `process.env.CHURCH_ID` or use a default — auth comes later)
> 2. Parse query params for GET (page, pageSize, filters)
> 3. Parse and validate request body for POST/PATCH (use basic type checking for now, Zod validation will be added later)
> 4. Call the appropriate DAL function from `@/lib/dal`
> 5. Return standardized JSON responses:
>    - Success single: `{ success: true, data: { ... } }`
>    - Success list: `{ success: true, data: [...], pagination: { total, page, pageSize, totalPages } }`
>    - Error: `{ success: false, error: { code: "NOT_FOUND", message: "..." } }`
> 6. Handle errors with try/catch and return appropriate HTTP status codes
>
> **For the churchId**, create a helper at `lib/api/get-church-id.ts`:
> ```typescript
> // Temporary: hardcoded org ID for single-tenant MVP
> // This will be replaced by auth + tenant middleware later
> export async function getChurchId(): Promise<string> {
>   const churchId = process.env.CHURCH_ID
>   if (!churchId) throw new Error('CHURCH_ID environment variable is required')
>   return churchId
> }
> ```
>
> **Important constraints:**
> - Use Next.js App Router `route.ts` handlers (not pages)
> - Do NOT add authentication yet — that's a later phase
> - Do NOT modify any existing CMS pages yet — that's a separate phase
> - Keep the routes simple — no middleware chains yet
> - Use the DAL functions, don't write raw Prisma queries in route handlers

#### Verification:
- [x] All API route files created under `app/api/v1/` — 15 route files across 10 content types + `lib/api/get-church-id.ts` helper
- [x] Each route handler returns properly formatted JSON (`{ success, data, pagination }` for lists, `{ success, data }` for single, `{ success: false, error: { code, message } }` for errors)
- [x] GET endpoints support pagination via query params (messages, events, bible-studies, videos)
- [x] POST endpoints parse JSON body and call DAL create functions with basic validation
- [x] PATCH endpoints call DAL update functions (resolve slug to id first)
- [x] DELETE endpoints call DAL soft-delete functions (resolve slug to id first)
- [x] Error responses include appropriate HTTP status codes (400, 404, 500)
- [x] TypeScript compilation passes
- [x] Manual testing with curl shows routes work correctly — GET, POST, PATCH, DELETE all verified for messages and events

---

## Phase 4: CMS Integration

### Phase 4.1: Wire CMS Admin Pages to API Routes

**Effort**: L (3-5 days)
**Dependencies**: Phase 3.1
**What this does**: Replaces the in-memory mock data in the CMS admin with real API calls. This is the first user-facing change — after this phase, content changes in the CMS persist to the database.

#### Prompt:

> The CMS admin pages currently use React Context with in-memory state to manage content. I need to replace this with real API calls to the routes we created at `/api/v1/`.
>
> **Read all of these files first** to understand the current data flow:
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/messages-context.tsx` — current messages context provider
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/events-context.tsx` — current events context provider
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/messages-data.ts` — current message types and mock data
> - `/Users/davidlim/Desktop/laubf-cms-test/lib/events-data.ts` — current event types and mock data
> - All CMS page files under `/Users/davidlim/Desktop/laubf-cms-test/app/cms/`
> - Components under `/Users/davidlim/Desktop/laubf-cms-test/components/`
>
> **What needs to change:**
>
> 1. **Update context providers** (`lib/messages-context.tsx`, `lib/events-context.tsx`):
>    - Replace the hardcoded mock data arrays with `useState` initialized to empty arrays
>    - Add `useEffect` to fetch from `/api/v1/messages` and `/api/v1/events` on mount
>    - Update the create/update/delete functions to call the API routes instead of manipulating in-memory arrays
>    - Add loading and error states
>    - Keep the same context API shape so consuming components don't need to change
>
> 2. **Update list pages** (`app/cms/messages/page.tsx`, `app/cms/events/page.tsx`):
>    - If they directly import from `messages-data.ts` or `events-data.ts`, change to use the context
>    - Add loading states while data is being fetched
>
> 3. **Update create/edit pages** (`app/cms/messages/new/page.tsx`, `app/cms/messages/[id]/page.tsx`, etc.):
>    - Form submission should call the API and handle success/error
>    - After successful create/update, navigate back to the list page
>    - Show toast notifications on success/error
>
> 4. **Handle the type differences** between CMS types and database types:
>    - CMS uses `speaker: string` (name), database uses `speakerId: UUID`
>    - CMS uses `seriesIds: string[]`, database uses `MessageSeries` join table
>    - CMS uses lowercase status strings, database uses UPPER_CASE enums
>    - Create adapter functions to transform between CMS and API formats
>    - Fetch speakers and series lists for form dropdowns from `/api/v1/speakers` and `/api/v1/series`
>
> **Important constraints:**
> - Preserve the existing CMS UI completely — only change data fetching, not layout/styling
> - The CMS pages are at `/app/cms/` in the ROOT project (not in `laubf-test/`)
> - Components used by CMS pages are at `/components/` in the ROOT project
> - Do NOT touch anything in the `laubf-test/` directory — the public website is a separate phase
> - If a form field in the CMS doesn't have a matching API field yet, keep it functional but note it with a TODO comment

#### Verification:
- [x] CMS message list page loads data from the database (not mock data) — `messages-context.tsx` fetches from `/api/v1/messages`
- [x] Creating a new message via the CMS form persists to the database — optimistic update + POST to API
- [x] Editing a message via the CMS form updates the database — `slug` field added to CMS `Message` type, `updateMessage` calls PATCH `/api/v1/messages/{slug}`
- [x] Deleting a message soft-deletes it in the database — `deleteMessage` calls DELETE `/api/v1/messages/{slug}`
- [x] CMS event list, create, edit, delete all work with the database — `events-context.tsx` fetches from `/api/v1/events`, `updateEvent` calls PATCH, `deleteEvent` calls DELETE using slug
- [x] Speaker and series dropdowns are populated from the database — series fetched from `/api/v1/series`
- [x] Loading states show while data is being fetched — Loader2 spinner in messages and events list pages
- [x] Error states display when API calls fail — error state in context providers
- [ ] Page navigation after create/update works correctly — needs manual testing
- [ ] No regression in CMS UI appearance or layout — needs manual testing

---

## Phase 5: Public Website Integration

### Phase 5.1: Replace Mock Data in Public Website Pages

**Effort**: L (3-5 days)
**Dependencies**: Phase 2.1 (DAL), Phase 1.3 (seeded data)
**What this does**: Switches the public-facing website from mock data arrays to real database queries. Every page that currently imports from `src/lib/mock-data/` will instead call DAL functions. After this phase, content published via the CMS appears on the public website.

#### Prompt:

> The public website at `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/` currently imports mock data from `src/lib/mock-data/`. I need to replace all mock data imports with DAL function calls.
>
> **CRITICAL ARCHITECTURE DECISION**: The public website (`laubf-test/`) is a separate Next.js app from the CMS admin (root). The DAL modules are in the root project at `lib/dal/`. For the public website to use them, we have two options:
>
> Option A (Recommended): Create a shared package or copy the DAL and Prisma client into `laubf-test/lib/dal/` and `laubf-test/src/lib/db/`.
> Option B: Use a monorepo tool (turborepo/nx) to share code.
>
> For now, use Option A: Install Prisma in the `laubf-test/` project and create DAL modules there that use the same schema. This keeps the two apps independent while sharing the same database.
>
> **CONCERN**: Duplicating Prisma client, schema, and DAL modules into laubf-test/ creates a maintenance burden — any schema change requires updating both copies. This should be flagged for future refactoring into a monorepo setup (turborepo/nx) or a shared package. For the single-tenant MVP this is acceptable, but should not persist long-term.
>
> **Step 1: Set up Prisma in laubf-test/**
> ```
> cd laubf-test
> npm install prisma @prisma/client
> ```
> - Copy or symlink `prisma/schema.prisma` from the root project
> - Run `npx prisma generate` in laubf-test
> - Create `laubf-test/src/lib/db/client.ts` with the same singleton pattern (import from the generated client path, not `@prisma/client`)
> - Create `laubf-test/.env` with the same DATABASE_URL
>
> **Step 2: Create DAL modules in laubf-test/**
> Copy the DAL modules from the root `lib/dal/` to `laubf-test/src/lib/dal/`, or create simplified read-only versions since the public website only needs read operations.
>
> **Step 3: Create an church ID resolver for the public website**
> Create `laubf-test/src/lib/get-church-id.ts`:
> ```typescript
> // Single-tenant MVP: hardcoded org ID
> // Will be replaced by tenant resolution middleware for multi-tenant
> import { prisma } from '@/lib/db/client'
>
> let cachedChurchId: string | null = null
>
> export async function getChurchId(): Promise<string> {
>   if (cachedChurchId) return cachedChurchId
>   // Look up the org by slug from env, or use the first org
>   const slug = process.env.CHURCH_SLUG || 'la-ubf'
>   const org = await prisma.church.findUnique({ where: { slug } })
>   if (!org) throw new Error(`Church not found: ${slug}`)
>   cachedChurchId = org.id
>   return org.id
> }
> ```
>
> **Step 4: Update every page to use DAL instead of mock data**
>
> Read each page file and the section components it uses. Replace mock data imports with DAL calls. The pages to update (in priority order):
>
> 1. **`/messages` page** (`laubf-test/src/app/messages/page.tsx`):
>    - Replace `import { MOCK_MESSAGES }` with `import { getMessages } from '@/lib/dal/messages'`
>    - Make the component `async` (Server Component)
>    - Call `const churchId = await getChurchId(); const messages = await getMessages(churchId)`
>
> 2. **`/messages/[slug]` page** (`laubf-test/src/app/messages/[slug]/page.tsx`):
>    - Replace `getMessageBySlug` mock with DAL call
>    - Update `generateStaticParams` to query the database or remove it (switch to dynamic rendering)
>
> 3. **`/events` page and `/events/[slug]` page**
>
> 4. **`/bible-study` page and `/bible-study/[slug]` page**
>
> 5. **`/videos` page**
>
> 6. **`/daily-bread` page**
>
> 7. **Homepage** (`laubf-test/src/app/page.tsx`) — This likely renders section components that fetch their own data (SPOTLIGHT_MEDIA, HIGHLIGHT_CARDS, UPCOMING_EVENTS, etc.)
>
> 8. **Section components that fetch data** — Read `/Users/davidlim/Desktop/laubf-cms-test/docs/database/03-website-database-schema.md` section "8. Page Section Data Dependencies" to identify which sections need database queries:
>    - `AllMessagesSection.tsx` — needs getMessages()
>    - `AllEventsSection.tsx` — needs getEvents()
>    - `AllBibleStudiesSection.tsx` — needs getBibleStudies()
>    - `AllVideosSection.tsx` — needs getVideos()
>    - `SpotlightMediaSection.tsx` — needs getLatestMessage()
>    - `UpcomingEventsSection.tsx` — needs getUpcomingEvents()
>    - `HighlightCardsSection.tsx` — needs getFeaturedEvents()
>    - `RecurringMeetingsSection.tsx` — needs getRecurringEvents()
>    - `EventCalendarSection.tsx` — needs getEvents() with date range filter
>
> 9. **Ministry/campus pages** (`/ministries/campus/[campus]/page.tsx`, etc.)
>
> **Important constraints:**
> - Preserve all existing styling, layout, and UI behavior
> - The data shape returned by DAL may differ slightly from mock data types — create adapter functions where needed to transform Prisma types to the shapes the components expect
> - Remove `generateStaticParams` from dynamic pages (or update to query DB) — for MVP, use `export const dynamic = 'force-dynamic'` or `revalidate = 60`
> - Static pages (/about, /im-new, /giving) can remain as-is for now — their content is hardcoded in JSX, not from mock data
> - Do NOT delete the mock data files yet — keep them as a reference/fallback
> - The `laubf-test/` directory has its own `package.json` and `tsconfig.json`

#### Verification:
- [ ] `/messages` page loads and displays messages from the database
- [ ] `/messages/[slug]` page shows correct message detail from database
- [ ] `/events` page shows events from database
- [ ] `/events/[slug]` page shows correct event detail
- [ ] `/bible-study` and `/bible-study/[slug]` work with database
- [ ] `/videos` page works with database
- [ ] `/daily-bread` page works with database
- [ ] Homepage sections (SpotlightMedia, HighlightCards, UpcomingEvents, etc.) show database content
- [ ] No visual regressions on any page
- [ ] `npm run build` in `laubf-test/` succeeds without errors
- [ ] Page load performance is acceptable (no N+1 queries)

---

## Phase 6: Authentication and Authorization

### Phase 6.1: Set Up NextAuth.js with Credentials Provider

**Effort**: M (2-3 days)
**Dependencies**: Phase 4.1 (CMS wired to API)
**What this does**: Adds real authentication to the CMS admin. Currently anyone can access `/cms/*` routes. After this phase, users must log in with email/password, and their session includes their org membership and role.

#### Prompt:

> Add authentication to the CMS admin using NextAuth.js v5 (Auth.js). The User and Session models already exist in the Prisma schema.
>
> **1. Install NextAuth**:
> ```
> cd /Users/davidlim/Desktop/laubf-cms-test
> npm install next-auth@beta @auth/prisma-adapter
> ```
>
> **2. Create auth configuration** at `lib/auth/config.ts`:
> - Use the Prisma adapter with our existing `prisma` client
> - Configure Credentials provider (email + password)
> - Use JWT session strategy
> - Include `churchId` and `role` in the JWT token and session
> - On sign-in, look up the user's `ChurchMember` to get their churchId and role
>
> **3. Create auth route handler** at `app/api/auth/[...nextauth]/route.ts`
>
> **4. Create auth middleware** at `middleware.ts` (or update existing if present):
> - Protect all `/cms/*` routes — redirect to `/login` if not authenticated
> - Protect all `/api/v1/*` routes — return 401 if no valid session
> - Allow public routes (`/`, `/about`, `/events`, etc.) without auth
>
> **5. Create login page** at `app/login/page.tsx`:
> - Email and password form
> - Use the existing shadcn/ui components (Input, Button, Card)
> - Handle errors (invalid credentials, account locked, etc.)
> - Redirect to `/cms/dashboard` on successful login
>
> **6. Create a registration/user creation seed** — Update the seed script to create a test admin user:
> - Email: "admin@laubf.org"
> - Password: "admin123" (hashed with bcrypt)
> - ChurchMember with role OWNER for the LA UBF org
> - Install bcrypt: `npm install bcryptjs @types/bcryptjs`
>
> **7. Update API routes** to use the authenticated session:
> - Replace the hardcoded `getChurchId()` helper with session-based org ID
> - Create `lib/api/auth.ts` helper:
>   ```typescript
>   import { auth } from '@/lib/auth/config'
>   export async function getAuthenticatedOrg() {
>     const session = await auth()
>     if (!session?.user?.churchId) throw new Error('Unauthorized')
>     return { churchId: session.user.churchId, userId: session.user.id, role: session.user.role }
>   }
>   ```
>
> **8. Add session provider** to the CMS layout at `app/cms/layout.tsx`:
> - Wrap children in SessionProvider
> - Show current user info in the sidebar/header
> - Add logout button
>
> **Important constraints:**
> - Do NOT add auth to the public website (`laubf-test/`) — it stays public
> - Use bcryptjs (not bcrypt) for password hashing — it works in Edge runtime
> - Store NEXTAUTH_SECRET in `.env`
> - The login page should match the existing CMS design language

#### Verification:
- [ ] Accessing `/cms/dashboard` without auth redirects to `/login`
- [ ] Login with admin@laubf.org / admin123 succeeds
- [ ] After login, session contains churchId and role
- [ ] API routes at `/api/v1/*` return 401 without valid session
- [ ] API routes work with valid session and use session's churchId
- [ ] Logout works and clears the session
- [ ] Login page handles invalid credentials gracefully
- [ ] CMS sidebar shows logged-in user info

---

## Phase 7: Multi-Tenancy Infrastructure

### Phase 7.1: Tenant Resolution Middleware

**Effort**: M (2-3 days)
**Dependencies**: Phase 6.1
**What this does**: Adds the ability for multiple churches to use the platform simultaneously. Each church gets a subdomain (e.g., gracechurch.digitalchurch.com) and their data is isolated via church_id filtering. This is the foundation for the SaaS business model.

#### Prompt:

> Implement multi-tenant routing so different churches can access their own CMS and public website via subdomains.
>
> **Read the architecture document first**: `/Users/davidlim/Desktop/laubf-cms-test/docs/database/01-high-level-database-architecture.md` sections 2 (Tenant Resolution Flow), 6 (RLS), and 9 (Connection Pooling).
>
> **1. Create tenant resolution module** at `lib/tenant/`:
>
> `lib/tenant/resolve.ts`:
> - Extract hostname from request
> - Check `CustomDomain` table for exact domain match
> - Extract subdomain from `*.digitalchurch.com` pattern
> - Look up Church by subdomain slug
> - Return churchId or null
>
> `lib/tenant/context.ts`:
> - Use `AsyncLocalStorage` to store org context for the request lifecycle
> - Export `getTenantId()` function that reads from the store
>
> **2. Create or update `middleware.ts`** (root project):
> - On every request, resolve the tenant from the hostname
> - Set `x-tenant-id` header on the request
> - For CMS routes (`/cms/*`): verify the authenticated user belongs to the resolved org
> - For API routes (`/api/v1/*`): inject churchId from tenant resolution
> - For the platform domain (`digitalchurch.com`): route to marketing/landing pages
> - For unknown subdomains: return 404
>
> **3. Create the Prisma tenant extension** at `lib/db/extensions/tenant.ts`:
> - Based on the code in `/Users/davidlim/Desktop/laubf-cms-test/docs/database/02-cms-database-schema.md` section 6 (Prisma Middleware for Multi-Tenancy)
> - Auto-inject `churchId` on all queries for tenant-scoped models
> - Auto-filter by `deletedAt IS NULL` for soft deletes
>
> `lib/db/tenant.ts`:
> ```typescript
> import { prisma } from './client'
> import { tenantExtension } from './extensions/tenant'
>
> export function getTenantDb(churchId: string) {
>   return prisma.$extends(tenantExtension(churchId))
> }
> ```
>
> **4. Update DAL modules** to use `getTenantDb(churchId)` instead of the raw `prisma` client. This adds automatic org scoping.
>
> **5. For local development**, add to `.env`:
> ```
> PLATFORM_DOMAIN=localhost:3000
> DEFAULT_CHURCH_SLUG=la-ubf
> ```
> In development, when running on localhost, fall back to DEFAULT_CHURCH_SLUG.
>
> **Important constraints:**
> - Do NOT set up actual DNS/domains yet — that's production deployment
> - The public website (`laubf-test/`) will need its own middleware — handle this by noting it as a TODO but not implementing yet
> - Keep backward compatibility — existing single-tenant behavior must still work
> - The tenant extension should handle all models listed in doc 02's TENANT_SCOPED_MODELS array

#### Verification:
- [ ] Tenant resolution correctly maps subdomains to org IDs
- [ ] Setting `Host: la-ubf.localhost:3000` resolves to the LA UBF org
- [ ] API routes use the resolved org ID from middleware
- [ ] Prisma tenant extension auto-filters queries by churchId
- [ ] CMS pages show data for the correct org
- [ ] Unknown subdomains return appropriate error
- [ ] Platform domain routes to landing/marketing pages
- [ ] No data leaks between tenants (verify with two test orgs in seed)

---

## Phase 8: Website Builder Foundation

### Phase 8.1: Page and Section Data Infrastructure

**Effort**: L (3-4 days)
**Dependencies**: Phase 5.1 (public website using DAL)
**What this does**: Seeds the Page and PageSection tables with the current website structure, then updates the public website to render pages dynamically from the database instead of hardcoded routes. This is the foundation for the drag-and-drop page builder.

#### Prompt:

> The public website currently has hardcoded pages at routes like `/about`, `/im-new`, `/messages`, etc. I need to seed the Page and PageSection tables with this existing structure, then update the rendering to be database-driven.
>
> **Read the default page templates** in `/Users/davidlim/Desktop/laubf-cms-test/docs/database/03-website-database-schema.md` section 11 (Default Page Templates). This documents exactly which sections each page has and in what order.
>
> **Read the section content JSONB examples** in section 4 of the same document. Each section type has a specific JSONB structure that's verified against the TypeScript interfaces.
>
> **Read the actual page files** to extract the current content:
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/page.tsx` (homepage)
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/about/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/im-new/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/ministries/page.tsx`
> - `/Users/davidlim/Desktop/laubf-cms-test/laubf-test/src/app/ministries/college/page.tsx`
> - All campus pages under `/laubf-test/src/app/ministries/campus/`
>
> **Step 1: Update the seed script** (`prisma/seed.ts`) to add:
>
> - Page records for all current routes (Home, About, I'm New, Messages, Events, Bible Study, Videos, Daily Bread, Ministries, Giving, College Ministry, and each campus page)
> - PageSection records with the correct sectionType, sortOrder, and content JSONB extracted from the actual page components
> - Menu records for the header navigation (read the nav structure from `laubf-test/src/components/` — look for the navigation data)
> - MenuItem records matching the current mega-menu structure (documented in doc 03 section 5, "Menu Data Mapping")
>
> **Step 2: Create a dynamic page renderer** in `laubf-test/`:
>
> Create `laubf-test/src/app/[...slug]/page.tsx` (catch-all route):
> ```typescript
> import { getPageBySlug } from '@/lib/dal/pages'
> import { getChurchId } from '@/lib/get-church-id'
> import { SectionRenderer } from '@/components/sections/SectionRenderer'
>
> export default async function DynamicPage({ params }: { params: { slug: string[] } }) {
>   const churchId = await getChurchId()
>   const slugPath = '/' + (params.slug?.join('/') || '')
>   const page = await getPageBySlug(churchId, slugPath)
>   if (!page) notFound()
>
>   return (
>     <>
>       {page.sections.map(section => (
>         <SectionRenderer key={section.id} section={section} />
>       ))}
>     </>
>   )
> }
> ```
>
> Create `laubf-test/src/components/sections/SectionRenderer.tsx`:
> - Takes a `PageSection` record
> - Maps `sectionType` enum to the correct React component
> - Passes `content` JSONB as props
> - For dynamic sections (ALL_MESSAGES, ALL_EVENTS, etc.), fetches data from DAL
>
> **Step 3: Keep existing hardcoded routes as fallbacks initially.**
> The catch-all route `[...slug]` should have lower priority than specific routes. Only gradually migrate pages to database-driven rendering.
>
> **Important constraints:**
> - Do NOT delete the existing page files yet — the catch-all is an addition, not a replacement
> - The section components in `laubf-test/src/components/sections/` already exist and work. The SectionRenderer just needs to map types to components and pass props.
> - Static sections render content directly from JSONB. Dynamic sections (ALL_MESSAGES, etc.) need to call DAL functions.
> - Preserve all existing visual behavior exactly

#### Verification:
- [ ] Seed script creates Page records for all current routes
- [ ] Seed script creates PageSection records with correct content JSONB
- [ ] Menu and MenuItem records match the current navigation structure
- [ ] SectionRenderer correctly maps all 38 section types to components
- [ ] A database-driven test page renders identically to the hardcoded version
- [ ] Dynamic sections (AllMessages, AllEvents, etc.) still fetch and display data
- [ ] Static sections render their JSONB content correctly
- [ ] `npx prisma studio` shows the Page/PageSection/Menu/MenuItem data

---

## Phase 9: Production Readiness

### Phase 9.1: Environment Setup and Deployment Configuration

**Effort**: M (2-3 days)
**Dependencies**: Phases 1-6 complete
**What this does**: Prepares the application for production deployment on Vercel with a managed PostgreSQL database. Sets up environment configuration, build pipeline, and monitoring.

#### Prompt:

> Prepare the project for production deployment on Vercel with a managed PostgreSQL database (Neon or Supabase).
>
> **1. Create environment configuration**:
>
> Create `.env.example` at the root with all required environment variables:
> ```
> # Database
> DATABASE_URL="postgresql://..."
> DIRECT_URL="postgresql://..."
>
> # Auth
> NEXTAUTH_SECRET="generate-a-secure-secret"
> NEXTAUTH_URL="https://your-domain.com"
>
> # Tenant
> PLATFORM_DOMAIN="digitalchurch.com"
> DEFAULT_CHURCH_SLUG="la-ubf"
>
> # Optional
> REDIS_URL=""
> SENTRY_DSN=""
> ```
>
> **2. Update `package.json` scripts**:
> ```json
> {
>   "scripts": {
>     "dev": "next dev",
>     "build": "prisma generate && next build",
>     "start": "next start",
>     "lint": "eslint",
>     "db:push": "prisma db push",
>     "db:migrate": "prisma migrate deploy",
>     "db:seed": "prisma db seed",
>     "db:studio": "prisma studio",
>     "postinstall": "prisma generate"
>   }
> }
> ```
>
> **3. Create Vercel configuration** (`vercel.json`):
> - Configure build command to include Prisma generation
> - Set up environment variable references
> - Configure headers for CORS on API routes
>
> **4. Add error tracking** (optional but recommended):
> ```
> npm install @sentry/nextjs
> ```
> - Create `sentry.client.config.ts` and `sentry.server.config.ts`
> - Wrap the Next.js config with Sentry
>
> **5. Create health check endpoint** at `app/api/health/route.ts`:
> - Check database connectivity
> - Return status with response time
>
> **6. Add database connection pooling setup notes**:
> - Document Neon connection string format with pooling
> - Document Supabase connection string with pgbouncer
>
> **Important constraints:**
> - Do NOT include any actual secrets in committed files
> - The `.env.example` should have placeholder values only
> - Ensure `prisma generate` runs as part of the build

#### Verification:
- [ ] `.env.example` documents all required environment variables
- [ ] `npm run build` succeeds and includes Prisma generation
- [ ] Health check endpoint returns correct status
- [ ] Build works without a running database (Prisma generate doesn't need DB)
- [ ] No secrets are committed to git

---

## Summary: Phase Dependency Graph

```
Phase 1.1: Install Prisma + Schema
  └── Phase 1.2: Migration + Client Singleton
       └── Phase 1.3: Seed Script
            ├── Phase 2.1: DAL Modules
            │    ├── Phase 3.1: API Routes
            │    │    └── Phase 4.1: CMS Integration ──→ Phase 6.1: Auth
            │    │                                         └── Phase 7.1: Multi-Tenancy
            │    └── Phase 5.1: Public Website Integration
            │         └── Phase 8.1: Website Builder Foundation
            └── Phase 9.1: Production Readiness (can start after Phase 6)
```

## Estimated Total Effort

| Phase | Effort | Calendar Days |
|---|---|---|
| 1.1 Schema | M | 2-3 |
| 1.2 Migration | S | 0.5 |
| 1.3 Seed | M | 1-2 |
| 2.1 DAL | M | 2-3 |
| 3.1 API Routes | L | 3-4 |
| 4.1 CMS Integration | L | 3-5 |
| 5.1 Public Website | L | 3-5 |
| 6.1 Auth | M | 2-3 |
| 7.1 Multi-Tenancy | M | 2-3 |
| 8.1 Website Builder | L | 3-4 |
| 9.1 Production | M | 2-3 |
| **Total** | | **24-36 days** |

Note: Phases 4.1 (CMS Integration) and 5.1 (Public Website Integration) can run in parallel since they modify different apps. Phases 3.1 and 5.1 can also overlap. With parallelization, the critical path is approximately 18-25 working days.

---

## Future Phases (Not Detailed Here)

These phases are important but come after the core platform is functional:

- **Phase 10: CMS Admin for Website Builder** — Page editor UI, section editor forms, menu editor, theme customizer
- **Phase 11: Media Upload Pipeline** — S3/R2 integration, image processing, CDN
- **Phase 12: Church Onboarding Flow** — Registration, org creation, default content seeding
- **Phase 13: Redis Caching Layer** — Tenant-scoped caching, cache invalidation
- **Phase 14: Advanced Features** — Full-text search, scheduled publishing cron, content versioning, data export
- **Phase 15: Billing Integration** — Stripe subscriptions, plan enforcement, usage metering
