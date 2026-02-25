# High-Level Database Architecture

## Multi-Tenant Church Platform — PostgreSQL + Prisma

---

## 1. Architecture Overview

This document defines the database architecture for a multi-tenant SaaS platform serving 1,000+ churches. Each church (tenant) gets its own isolated data space within a **shared database, shared schema** model using PostgreSQL Row-Level Security (RLS) for enforcement.

### Why Shared Database + RLS

| Approach | Pros | Cons |
|---|---|---|
| **Database-per-tenant** | Full isolation | Expensive, hard to manage at 1,000+ tenants |
| **Schema-per-tenant** | Good isolation | Migration complexity, connection pooling limits |
| **Shared DB + RLS** (chosen) | Cost-efficient, single migration path, scales to 100K+ tenants | Requires discipline with `church_id` on every query |

At 1,000 churches, separate databases would mean 1,000 PostgreSQL instances — operationally untenable. The shared approach with RLS gives us data isolation guarantees at the database level while keeping operations simple.

---

## 2. Tenant Resolution Flow

```
Request → Edge Middleware → Resolve Tenant → Inject Context → Application
                ↓
    ┌───────────────────────────┐
    │ 1. Custom domain lookup   │  gracechurch.org → church_abc
    │ 2. Subdomain extraction   │  grace.lclab.io → church_abc
    │ 3. Platform routing       │  lclab.io → marketing site
    └───────────────────────────┘
                ↓
    AsyncLocalStorage sets church_id for entire request lifecycle
                ↓
    Prisma middleware auto-injects WHERE church_id = ? on all queries
```

---

## 3. Table Categories

The database is organized into **4 layers**, each with a specific purpose:

### Layer 1: Platform (no church_id)
Global system tables that exist outside of any tenant context.

| Table | Purpose |
|---|---|
| `Church` | Tenant registry — one row per church |
| `User` | Global user accounts (can belong to multiple orgs) |
| `Plan` | Subscription plan definitions |
| `PlatformSetting` | Global platform configuration |

### Layer 2: Tenant Management (church_id required)
Tables that configure each tenant's access, billing, and team.

| Table | Purpose |
|---|---|
| `ChurchMember` | User ↔ Org membership with roles |
| `Subscription` | Billing state per org |
| `CustomDomain` | Custom domain mappings |
| `ApiKey` | API access tokens |
| `AuditLog` | Action history per org |

### Layer 3: CMS Content (church_id required)
All content managed through the CMS admin interface.

| Table | Purpose |
|---|---|
| `Message` | Sermons/messages |
| `Series` | Sermon/study series grouping |
| `Speaker` | Pastors, speakers |
| `Event` | Events, meetings, programs |
| `EventLink` | Associated links per event |
| `BibleStudy` | Bible study content |
| `BibleStudyAttachment` | File attachments for studies |
| `Video` | Video library entries |
| `DailyBread` | Daily devotional content |
| `Ministry` | Ministry groups (per org) |
| `Campus` | Campus locations (per org) |
| `MediaAsset` | Centralized media/file storage |
| `Tag` | Flexible tagging system |
| `ContentTag` | Polymorphic tag assignments |
| `Announcement` | Church announcements |
| `ContactSubmission` | Form submissions |

### Layer 4: Website/Builder (church_id required)
Tables that define the public-facing website structure.

| Table | Purpose |
|---|---|
| `SiteSettings` | Global site configuration per org |
| `Page` | Website pages |
| `PageSection` | Ordered sections within pages (JSONB content) |
| `Menu` | Navigation menus |
| `MenuItem` | Individual menu items |
| `Theme` | Template/theme selection |
| `ThemeCustomization` | Per-org theme overrides |

---

## 4. Entity Relationship Diagram (Simplified)

```
Church (tenant)
├── ChurchMember ── User
├── Subscription ── Plan
├── CustomDomain
│
├── Speaker
├── Series
├── Ministry
├── Campus
│
├── Message ──┬── Speaker
│             ├── Series
│             └── BibleStudy (bidirectional)
│
├── Event ────┬── Ministry
│             ├── Campus
│             └── EventLink[]
│
├── BibleStudy ┬── Series
│              ├── Speaker (messenger)
│              ├── Message (related)
│              └── BibleStudyAttachment[]
│
├── Video
├── DailyBread
├── MediaAsset
│
├── SiteSettings
├── Page ── PageSection[] (ordered, JSONB content)
├── Menu ── MenuItem[] (nested tree)
└── Theme ── ThemeCustomization
```

---

## 5. Indexing Strategy for 1,000+ Tenants

### The Cardinal Rule
**Every query hits a composite index starting with `church_id`.** Without this, PostgreSQL scans the entire table across all tenants.

### Scale Estimation (1,000 churches)

| Table | Rows per church (avg) | Total rows (1K churches) | Total rows (10K churches) |
|---|---|---|---|
| Message | 500 | 500K | 5M |
| Event | 200 | 200K | 2M |
| BibleStudy | 300 | 300K | 3M |
| Video | 100 | 100K | 1M |
| DailyBread | 365/year × 3 years | 1.1M | 11M |
| PageSection | 50 | 50K | 500K |
| MediaAsset | 500 | 500K | 5M |
| AuditLog | 10K/year | 10M | 100M |

### Index Patterns

**Pattern 1: Tenant-scoped lookup by slug (most common)**
```sql
-- Every content table
CREATE UNIQUE INDEX idx_{table}_org_slug ON {table}(church_id, slug);
```
This covers the primary access pattern: "get this specific item for this church."

**Pattern 2: Tenant-scoped listing with sort**
```sql
-- Messages: latest first
CREATE INDEX idx_messages_org_date ON messages(church_id, date_for DESC);

-- Events: upcoming first
CREATE INDEX idx_events_org_date_start ON events(church_id, date_start);

-- Daily bread: by date
CREATE INDEX idx_daily_bread_org_date ON daily_breads(church_id, date DESC);
```

**Pattern 3: Tenant-scoped filtering**
```sql
-- Events by type
CREATE INDEX idx_events_org_type ON events(church_id, type);

-- Events by ministry
CREATE INDEX idx_events_org_ministry ON events(church_id, ministry_id);

-- Messages by speaker
CREATE INDEX idx_messages_org_speaker ON messages(church_id, speaker_id);

-- Messages by series
CREATE INDEX idx_messages_org_series ON messages(church_id, series_id);
```

**Pattern 4: Full-text search (per tenant)**
```sql
-- GIN index on tsvector for search
CREATE INDEX idx_messages_search ON messages
  USING GIN(to_tsvector('english', title || ' ' || description));

-- Filter by church_id first, then search
-- Application: WHERE church_id = ? AND search_vector @@ to_tsquery(?)
```

**Pattern 5: Partial indexes for common filters**
```sql
-- Only active/published content
CREATE INDEX idx_events_org_active ON events(church_id, date_start)
  WHERE deleted_at IS NULL AND status = 'PUBLISHED';

-- Only featured events
CREATE INDEX idx_events_org_featured ON events(church_id, date_start)
  WHERE is_featured = TRUE AND deleted_at IS NULL;

-- Only recurring events
CREATE INDEX idx_events_org_recurring ON events(church_id)
  WHERE is_recurring = TRUE AND deleted_at IS NULL;
```

### Index Size Estimation

At 1,000 churches with the above data volumes:
- B-tree indexes: ~50-200MB per index (manageable)
- GIN full-text indexes: ~500MB-1GB per indexed table
- Total index footprint: ~5-10GB (well within standard PostgreSQL capabilities)

---

## 6. Row-Level Security (RLS)

### Policy Design

Every tenant-scoped table gets the same RLS pattern:

```sql
-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON messages
  USING (church_id = current_setting('app.current_church_id')::uuid);

-- Insert policy (ensure church_id matches)
CREATE POLICY tenant_insert ON messages
  FOR INSERT
  WITH CHECK (church_id = current_setting('app.current_church_id')::uuid);
```

### Setting Tenant Context

On every request, before any query:

```sql
SET LOCAL app.current_church_id = 'church_uuid_here';
```

In Prisma, this is done via a `$queryRaw` in middleware or via the `@prisma/extension-accelerate` tenant context.

### RLS as Defense-in-Depth

RLS is the **second line of defense**. The primary line is the Prisma middleware that auto-injects `WHERE church_id = ?`. RLS catches any query that accidentally bypasses the application layer.

---

## 7. Soft Deletes

All content tables use soft deletes:

```prisma
model Message {
  // ...
  deletedAt DateTime?

  @@index([churchId, deletedAt]) // Partial index candidate
}
```

**Cleanup strategy:**
- Soft-deleted records are excluded from all queries via Prisma middleware
- Background job purges records older than 90 days (configurable per org)
- `AuditLog` entry created on both soft delete and hard delete

---

## 8. Audit Trail

```prisma
model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  churchId     String   @db.Uuid
  userId    String?  @db.Uuid
  action    String   // CREATE, UPDATE, DELETE, LOGIN, EXPORT, etc.
  entity    String   // "Message", "Event", etc.
  entityId  String?  @db.Uuid
  changes   Json?    // { field: { old: X, new: Y } }
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([churchId, createdAt DESC])
  @@index([churchId, entity, entityId])
}
```

> **Scalability concern — 100M+ rows**: At 10K churches x 10K audit entries/year, this table
> reaches 100M rows within a year. Recommendations:
> 1. **Partition by month** using PostgreSQL native range partitioning on `createdAt`.
>    Prisma does not manage partitions directly — use raw SQL migrations.
> 2. **Archive old partitions**: Move partitions older than 1 year to cold storage (S3/GCS).
> 3. **Avoid JSONB indexes** on the `changes` column — only index `churchId`, `createdAt`, and
>    `entity`/`entityId` for lookups.
> 4. Consider a dedicated audit service (e.g., append-only log store) at 10K+ tenants.

---

## 9. Connection Pooling & Performance

### Connection Pool Configuration

For 1,000+ tenants on a shared database:

| Setting | Value | Rationale |
|---|---|---|
| Pool size (PgBouncer) | 200 connections | Shared across all tenants |
| Prisma pool size | 10 per instance | 3 app instances = 30 Prisma connections |
| Statement timeout | 30s | Prevent runaway queries |
| Idle timeout | 300s | Free unused connections |

### PgBouncer (Required at Scale)

Direct Prisma → PostgreSQL connections won't scale past ~100 concurrent tenants. Use PgBouncer in **transaction mode**:

```
[pgbouncer]
pool_mode = transaction
max_client_conn = 10000
default_pool_size = 200
```

> **Critical: PgBouncer + RLS compatibility**
> PgBouncer in **transaction mode** resets session state between transactions, which means
> `SET LOCAL app.current_church_id` only persists within a single transaction. This is actually
> *safer* than session mode — it guarantees tenant context cannot leak between requests that
> share a connection. However, every transaction must begin with `SET LOCAL` before any queries.
> The Prisma middleware must wrap all operations in `$transaction` to ensure the `SET LOCAL`
> and subsequent queries share the same database transaction. Failing to do this is a
> **data isolation vulnerability**.

### Read Replicas

At 1,000+ churches:
- **Primary**: All writes
- **Read replica 1**: Public website queries (high volume, read-only)
- **Read replica 2**: CMS admin queries + analytics

Prisma supports read replicas natively:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## 10. Caching Layer

### Cache Key Namespace

All cache keys are prefixed with `church:{church_id}:` to prevent cross-tenant contamination:

```
church:abc123:messages:latest        → 5 min TTL
church:abc123:events:upcoming        → 5 min TTL
church:abc123:site-settings          → 60 min TTL
church:abc123:theme                  → 60 min TTL
church:abc123:page:about             → 10 min TTL
```

### Cache Invalidation

On CMS write operations:
1. Update database
2. Invalidate relevant cache keys for that `church_id`
3. Redis Pub/Sub notifies other app instances

---

## 11. Data Types & Conventions

| Convention | Standard |
|---|---|
| Primary keys | UUID v4 (`@db.Uuid`) |
| Timestamps | `DateTime` with timezone (UTC storage) |
| Money | `Decimal(10,2)` or integer cents |
| Rich text | `Text` (HTML from TinyMCE) |
| Flexible content | `Json` (`@db.JsonB`) |
| Enums | Prisma enums → PostgreSQL enums |
| Slugs | `String` with unique constraint per org |
| URLs | `String` (validated at application layer) |
| Durations | `String` format "HH:MM:SS" or `Int` seconds |
| Recurrence days | `String[]` array (`@db.Text`) |
| Tags | Normalized via join table |
| Phone numbers | `String` E.164 format |

---

## 12. Migration Strategy

### Prisma Migrate Workflow

```bash
# Development: create and apply migration
npx prisma migrate dev --name add_messages_table

# Production: apply pending migrations
npx prisma migrate deploy

# Seed: populate initial data (plans, platform settings)
npx prisma db seed
```

### Migration Safety Rules

1. **Never drop columns in production** — add new columns, migrate data, then remove old ones in a later release
2. **Always add new columns as nullable** or with defaults
3. **Create indexes concurrently** (`CREATE INDEX CONCURRENTLY`) — Prisma doesn't do this by default, so use raw SQL migrations for large tables
4. **Test migrations against a snapshot** of production data volume before deploying

---

## 13. Backup & Disaster Recovery

| Component | Strategy | Frequency | Retention |
|---|---|---|---|
| Full database backup | pg_dump / managed snapshot | Daily | 30 days |
| WAL archiving | Continuous | Real-time | 7 days |
| Point-in-time recovery | PostgreSQL PITR | — | 7-day window |
| Cross-region backup | Replicate to secondary region | Daily | 14 days |

**RTO**: 1 hour (restore from snapshot)
**RPO**: < 1 hour (WAL-based recovery)

---

## 14. Security Checklist

- [ ] All tenant-scoped tables have `church_id` column with foreign key
- [ ] RLS policies enabled on all tenant-scoped tables
- [ ] Prisma middleware auto-injects `church_id` filter on all read queries
- [ ] Prisma middleware auto-sets `church_id` on all insert operations
- [ ] No raw SQL queries without explicit `church_id` WHERE clause
- [ ] PgBouncer configured in transaction mode (prevents session-level RLS leaks)
- [ ] API endpoints validate that requested `church_id` matches authenticated user's org
- [ ] Superadmin queries use a separate connection pool that bypasses RLS
- [ ] Audit log captures all write operations with `church_id` context
- [ ] Soft deletes prevent accidental data loss
- [ ] Database credentials rotated every 90 days
- [ ] Connection strings never committed to source control

---

## 15. Visual Guide — How All the Tables Connect

> **Audience**: Someone who's worked with databases before but doesn't live in them daily. This is the "show me the big picture" section.

### 15.1 The Big Picture: Four Layers

The database has 32 models organized into four layers. Think of it like a building:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 4: WEBSITE BUILDER                                       │
│  How the public website looks and is structured                 │
│                                                                  │
│  Page, PageSection, Menu, MenuItem,                             │
│  SiteSettings, Theme, ThemeCustomization                        │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 3: CMS CONTENT                                           │
│  The actual content churches create and publish                 │
│                                                                  │
│  Message, Event, BibleStudy, Video, DailyBread,                │
│  Announcement, ContactSubmission, MediaAsset                    │
│  + join tables: MessageSeries, EventLink,                       │
│    BibleStudyAttachment, ContentTag                             │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 2: SHARED REFERENCES                                     │
│  Reusable things that content points to                         │
│                                                                  │
│  Speaker, Series, Ministry, Campus, Tag                         │
├─────────────────────────────────────────────────────────────────┤
│  LAYER 1: TENANT & AUTH                                         │
│  Who owns what, who can access what                             │
│                                                                  │
│  Church, User, ChurchMember, Session,                           │
│  Subscription, CustomDomain, ApiKey, AuditLog                   │
└─────────────────────────────────────────────────────────────────┘
```

Everything above Layer 1 belongs to a specific Church. That's the multi-tenancy.

### 15.2 The Church is the Center of Everything

`Church` is the root table. Almost every other table has a `churchId` column that points back to it:

```
                                    ┌──────────────┐
                                    │   Church     │
                                    │──────────────│
                                    │ id (PK)      │
                                    │ name         │
                                    │ slug (unique)│
                                    │ status       │
                                    │ plan         │
                                    └──────┬───────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
     ┌────────┴────────┐        ┌──────────┴──────────┐     ┌──────────┴──────────┐
     │  Auth & Config   │        │   CMS Content       │     │  Website Builder     │
     │─────────────────│        │─────────────────────│     │─────────────────────│
     │ ChurchMember    │        │ Message             │     │ Page                │
     │ Subscription    │        │ Event               │     │ PageSection         │
     │ CustomDomain    │        │ BibleStudy          │     │ Menu                │
     │ ApiKey          │        │ Video               │     │ SiteSettings        │
     │ AuditLog        │        │ DailyBread          │     │ ThemeCustomization  │
     │ SiteSettings    │        │ Announcement        │     │                     │
     └─────────────────┘        │ MediaAsset          │     └─────────────────────┘
                                │ ContactSubmission   │
                                └─────────────────────┘
```

**The rule**: If a table has `churchId`, that row belongs to exactly one church. No exceptions.

### 15.3 Relationship Map (All Tables)

Every table and how they connect. Arrows mean "belongs to" or "references."

#### Layer 1: Tenant & Auth

```
User ──────────┐
  │             │
  │ (many)      │ (many)
  ▼             ▼
Session    ChurchMember ────→ Church
                                │
                                ├──→ Subscription      (one-to-one: each church has 0 or 1)
                                ├──→ CustomDomain[]     (one-to-many: a church can have multiple)
                                ├──→ ApiKey[]           (one-to-many)
                                └──→ AuditLog[]         (one-to-many: append-only log)
```

**How Users connect to Churches**: Through the `ChurchMember` join table. A User can belong to multiple Churches (e.g., a consultant managing several), and a Church can have multiple Users. Each membership has a `role` (OWNER, ADMIN, EDITOR, VIEWER).

```
User ←──many──→ ChurchMember ←──many──→ Church
                     │
                     └── role: OWNER | ADMIN | EDITOR | VIEWER
```

#### Layer 2: Shared References

These are things that CMS content points to. They're all scoped to a church.

```
Church
  ├──→ Speaker[]    ← Messages and BibleStudies reference these
  ├──→ Series[]     ← Messages belong to Series (via MessageSeries join table)
  ├──→ Ministry[]   ← Events belong to a Ministry
  ├──→ Campus[]     ← Events happen at a Campus
  └──→ Tag[]        ← Any content can be tagged (via ContentTag join table)
```

#### Layer 3: CMS Content

```
Church
  │
  ├──→ Message
  │      ├── speakerId ──→ Speaker (optional, nullable)
  │      ├── relatedStudyId ──→ BibleStudy (optional, one-to-one)
  │      └── messageSeries[] ──→ MessageSeries ──→ Series (many-to-many)
  │
  ├──→ Event
  │      ├── ministryId ──→ Ministry (optional)
  │      ├── campusId ──→ Campus (optional)
  │      └── eventLinks[] ──→ EventLink (one-to-many)
  │
  ├──→ BibleStudy
  │      ├── speakerId ──→ Speaker (optional)
  │      ├── seriesId ──→ Series (optional)
  │      ├── relatedMessage ──→ Message (optional, one-to-one, reverse side)
  │      └── attachments[] ──→ BibleStudyAttachment (one-to-many)
  │
  ├──→ Video                  (standalone, no FKs to other content)
  ├──→ DailyBread             (standalone)
  ├──→ Announcement           (standalone)
  ├──→ MediaAsset             (standalone — the file library)
  └──→ ContactSubmission      (standalone — form submissions)
```

**The tagging system** works across all content types using a polymorphic pattern:

```
Tag (churchId, name, slug)
  └──→ ContentTag (tagId, entityType, entityId)
                     │            │
                     │            └── UUID of the tagged record
                     └── "Message" | "Event" | "BibleStudy" | etc.
```

#### Layer 4: Website Builder

```
Church
  │
  ├──→ SiteSettings          (one-to-one: site name, social links, feature flags)
  │
  ├──→ ThemeCustomization    (one-to-one: color overrides, font choices)
  │      └── themeId ──→ Theme (many-to-one: which base template)
  │
  ├──→ Page[]                (one-to-many: all the website's pages)
  │      ├── parentId ──→ Page (self-referencing: page hierarchy)
  │      └── sections[] ──→ PageSection[] (one-to-many: the sections on this page)
  │                            └── sectionType: enum (HERO_BANNER, ALL_MESSAGES, etc.)
  │                            └── content: JSONB (the actual section data)
  │
  └──→ Menu[]                (one-to-many: header menu, footer menu, etc.)
         └── items[] ──→ MenuItem[]
                           └── parentId ──→ MenuItem (self-referencing: nested menu items)
```

**Two self-referencing trees**:
- `Page.parentId → Page` — pages can be nested (e.g., `/ministries/youth`)
- `MenuItem.parentId → MenuItem` — menu items can have dropdowns

### 15.4 The Complete Relationship Diagram

Everything on one map. Read top-to-bottom. Lines mean foreign keys.

```
                              ┌─────────┐
                              │  Theme   │ ← Platform-level (no churchId!)
                              │  (base   │
                              │ template)│
                              └────┬─────┘
                                   │ themeId
                                   ▼
┌───────────────────── Church ─────────────────────────────────────┐
│                         │                                        │
│   ┌─────────────────────┼───────────────────────────┐           │
│   │                     │                            │           │
│   ▼                     ▼                            ▼           │
│ SiteSettings    ThemeCustomization              Subscription     │
│ (1:1)           (1:1)                           (1:1)            │
│                                                                  │
│   ┌──────────────────┬──────────────────┐                       │
│   ▼                  ▼                  ▼                        │
│ CustomDomain[]    ApiKey[]          AuditLog[]                   │
│                                                                  │
│   ┌──────────────────────────────────────────────┐              │
│   │              Shared References                │              │
│   │                                               │              │
│   │  Speaker[]   Series[]   Ministry[]   Campus[] │  Tag[]      │
│   │     │           │           │           │     │    │        │
│   └─────┼───────────┼───────────┼───────────┼─────┘    │        │
│         │           │           │           │          │        │
│         ▼           ▼           ▼           ▼          ▼        │
│      Message ──→ MessageSeries              Event   ContentTag  │
│         │                                     │       (poly)    │
│         │ relatedStudyId                      │                 │
│         ▼                                     │                 │
│      BibleStudy ──→ BibleStudyAttachment      ▼                 │
│                                            EventLink            │
│                                                                  │
│      Video[]   DailyBread[]   Announcement[]   MediaAsset[]     │
│                                ContactSubmission[]               │
│                                                                  │
│   ┌──────────────────────────────────────────────┐              │
│   │              Website Builder                  │              │
│   │                                               │              │
│   │  Page[] ──→ PageSection[]                     │              │
│   │    │          (sectionType + JSONB content)    │              │
│   │    └─→ Page (self-ref: parent/child)          │              │
│   │                                               │              │
│   │  Menu[] ──→ MenuItem[]                        │              │
│   │               └─→ MenuItem (self-ref: tree)   │              │
│   └───────────────────────────────────────────────┘              │
│                                                                  │
│ ◄──── ChurchMember (join) ────► User ──→ Session[]              │
│         (role: OWNER/ADMIN/                                      │
│          EDITOR/VIEWER)                                          │
└──────────────────────────────────────────────────────────────────┘
```

### 15.5 How Multi-Tenancy Works (The `churchId` Pattern)

#### The Core Principle

Every table that stores church-specific data has a `churchId` column. This is the **tenant boundary**. When you query the database, you always filter by `churchId`:

```sql
-- Correct: always scoped to a church
SELECT * FROM messages WHERE church_id = 'abc-123' AND status = 'PUBLISHED';

-- NEVER do this: returns ALL churches' messages
SELECT * FROM messages WHERE status = 'PUBLISHED';
```

#### Which tables have `churchId`?

**Has `churchId` (tenant-scoped — 25 tables):**

| Table | Relationship to Church |
|---|---|
| ChurchMember | many-to-one |
| Subscription | one-to-one |
| CustomDomain | many-to-one |
| ApiKey | many-to-one |
| AuditLog | many-to-one |
| Speaker | many-to-one |
| Series | many-to-one |
| Ministry | many-to-one |
| Campus | many-to-one |
| Tag | many-to-one |
| Message | many-to-one |
| Event | many-to-one |
| BibleStudy | many-to-one |
| Video | many-to-one |
| DailyBread | many-to-one |
| MediaAsset | many-to-one |
| Announcement | many-to-one |
| ContactSubmission | many-to-one |
| Page | many-to-one |
| PageSection | many-to-one |
| Menu | many-to-one |
| SiteSettings | one-to-one |
| ThemeCustomization | one-to-one |

**Does NOT have `churchId` (shared or standalone — 7 tables):**

| Table | Why no churchId |
|---|---|
| Church | It IS the church |
| User | Users can belong to multiple churches (via ChurchMember) |
| Session | Belongs to User, not Church |
| Theme | Platform-level templates shared across all churches |
| ContentTag | Gets churchId indirectly via its Tag |
| MessageSeries | Gets churchId indirectly via Message and Series |
| EventLink | Gets churchId indirectly via Event |
| BibleStudyAttachment | Gets churchId indirectly via BibleStudy |
| MenuItem | Gets churchId indirectly via Menu |

#### How `churchId` is enforced

Three layers of protection (defense in depth):

```
Layer 1: Application Code (DAL)
   Every DAL function takes churchId as a parameter and includes it in WHERE clauses.
   This is the primary enforcement mechanism.

Layer 2: Prisma Client Extension (future)
   A Prisma middleware that automatically injects WHERE churchId = ? on every query
   for tenant-scoped models. Safety net if a developer forgets to filter.

Layer 3: PostgreSQL Row-Level Security (future)
   Database-level policies that prevent any query from seeing other tenants' data,
   even if the application layer has a bug. The ultimate safety net.
```

Right now, only Layer 1 is active. Layers 2 and 3 are planned for when multi-tenancy is enabled (Phase D).

#### The Slug Uniqueness Pattern

Slugs (URL-friendly identifiers) are unique **per church**, not globally. This is done with composite unique constraints:

```
@@unique([churchId, slug])   ← Speaker, Series, Ministry, Campus, Tag,
                                Message, Event, BibleStudy, Video,
                                DailyBread, Page, Menu
```

### 15.6 Index Strategy (Visual)

Almost every index starts with `churchId`:

```prisma
@@index([churchId, dateFor(sort: Desc)])      // Messages
@@index([churchId, status])                    // Messages, Events, Videos, etc.
@@index([churchId, dateStart])                 // Events
@@index([churchId, isActive])                  // Speakers, Series, Ministries
@@index([churchId, isPublished])               // Pages
```

**Why?** Because every query in a multi-tenant app starts with `WHERE churchId = ?`. By putting `churchId` first in the index, PostgreSQL can immediately narrow down to just that church's rows before filtering further.

### 15.7 Key Relationships Explained

#### Message ↔ BibleStudy (One-to-One, Optional)

```
Message                          BibleStudy
├── relatedStudyId (FK) ──────→  id
                                 │
                        (reverse: relatedMessage)
```

The FK lives on Message (`relatedStudyId` is `@unique`). Either side can exist without the other.

#### Message ↔ Series (Many-to-Many)

```
Message ←──── MessageSeries ────→ Series
                  │
                  └── sortOrder (position within the series)
```

#### Page ↔ PageSection (One-to-Many, Ordered)

```
Page
  └── sections: [
        { sortOrder: 0, sectionType: HERO_BANNER, content: {...} },
        { sortOrder: 1, sectionType: MEDIA_TEXT, content: {...} },
        { sortOrder: 2, sectionType: ALL_MESSAGES, content: {...} },
        { sortOrder: 3, sectionType: CTA_BANNER, content: {...} },
      ]
```

#### Theme → ThemeCustomization (One-to-Many, but One-per-Church)

```
Theme (platform-level, no churchId)
├── name: "Modern Light"
├── defaultTokens: { primaryColor: "#3b82f6", headingFont: "Inter", ... }
│
└── customizations[] ──→ ThemeCustomization (one per church)
                           ├── churchId (unique — one customization per church)
                           ├── primaryColor: "#22c55e"   ← overrides the default
                           ├── headingFont: null          ← uses the default
                           └── customCss: "..."           ← additional CSS
```

#### Menu → MenuItem (Tree Structure)

```
Menu (HEADER)
  └── items:
        ├── MenuItem: "Home"          (parentId: null, sortOrder: 0)
        ├── MenuItem: "About"         (parentId: null, sortOrder: 1)
        │     ├── MenuItem: "Our Story"    (parentId: "About", sortOrder: 0)
        │     ├── MenuItem: "Our Team"     (parentId: "About", sortOrder: 1)
        │     └── MenuItem: "Campus Life"  (parentId: "About", sortOrder: 2)
        ├── MenuItem: "Messages"      (parentId: null, sortOrder: 2)
        └── MenuItem: "Events"        (parentId: null, sortOrder: 3)
```

### 15.8 Key Design Principles (Visual Summary)

1. **Soft Deletes** — `deletedAt DateTime?` on most content tables. Null = active, non-null = soft-deleted.
2. **JSONB for Flexible Content** — `PageSection.content`, `Theme.defaultTokens`, `ThemeCustomization.tokenOverrides`, `Message.transcriptSegments`, `Event.links`, etc.
3. **Cascade Deletes** — Church deleted → all its content deleted automatically via `onDelete: Cascade`.
4. **SetNull for Optional References** — Speaker deleted → Messages keep existing but `speakerId` becomes null.
5. **Content Status Workflow** — `DRAFT → SCHEDULED → PUBLISHED → ARCHIVED` (used by Message, Event, BibleStudy, Video, DailyBread, Announcement).
6. **UUIDs Everywhere** — globally unique, no information leakage, client-side generation possible.

### 15.9 Table Count Summary

| Layer | Tables | Purpose |
|---|---|---|
| Tenant & Auth | 8 | Church, User, ChurchMember, Session, Subscription, CustomDomain, ApiKey, AuditLog |
| Shared References | 5 | Speaker, Series, Ministry, Campus, Tag |
| CMS Content | 12 | Message, Event, BibleStudy, Video, DailyBread, Announcement, MediaAsset, ContactSubmission + join tables (MessageSeries, EventLink, BibleStudyAttachment, ContentTag) |
| Website Builder | 7 | Page, PageSection, Menu, MenuItem, SiteSettings, Theme, ThemeCustomization |
| **Total** | **32** | |

| Enums | Count |
|---|---|
| Total enum types | 22 |
| Notable: SectionType | 42 variants (one per website section component) |
| Notable: BibleBook | 66 variants (one per book of the Bible) |
| Notable: ContentStatus | 4 variants (DRAFT → SCHEDULED → PUBLISHED → ARCHIVED) |

---

## Next Documents

- **[02 — CMS Schema](./02-cms-schema.md)**: Complete Prisma schema for all CMS content tables with exact field mappings from the current TypeScript types
- **[03 — Website Schema](./03-website-schema.md)**: Complete Prisma schema for website builder, pages, sections, menus, themes
