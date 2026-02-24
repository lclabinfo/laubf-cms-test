# Database Schema — Visual Guide

## How All the Tables Connect, How Multi-Tenancy Works, and Key Principles

> **Audience**: Someone who's worked with databases before but doesn't live in them daily. This is the "show me the big picture" document.

---

## 1. The Big Picture: Four Layers

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

---

## 2. The Church is the Center of Everything

`Church` is the root table. Almost every other table has a `churchId` column that points back to it. Here's what that looks like:

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

---

## 3. Relationship Map (All Tables)

Here's every table and how they connect. Arrows mean "belongs to" or "references."

### Layer 1: Tenant & Auth

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

### Layer 2: Shared References

These are things that CMS content points to. They're all scoped to a church.

```
Church
  ├──→ Speaker[]    ← Messages and BibleStudies reference these
  ├──→ Series[]     ← Messages belong to Series (via MessageSeries join table)
  ├──→ Ministry[]   ← Events belong to a Ministry
  ├──→ Campus[]     ← Events happen at a Campus
  └──→ Tag[]        ← Any content can be tagged (via ContentTag join table)
```

### Layer 3: CMS Content (the big one)

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

Instead of having `message_tags`, `event_tags`, `bible_study_tags` tables (one per content type), there's one `ContentTag` table that stores the type as a string. This is simpler to manage but means there's no foreign key constraint on `entityId` — the app layer is responsible for keeping it consistent.

### Layer 4: Website Builder

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

---

## 4. The Complete Relationship Diagram

Here's everything on one map. Read top-to-bottom. Lines mean foreign keys.

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

---

## 5. How Multi-Tenancy Works (The `churchId` Pattern)

### The Core Principle

Every table that stores church-specific data has a `churchId` column. This is the **tenant boundary**. When you query the database, you always filter by `churchId`:

```sql
-- ✅ Correct: always scoped to a church
SELECT * FROM messages WHERE church_id = 'abc-123' AND status = 'PUBLISHED';

-- ❌ NEVER do this: returns ALL churches' messages
SELECT * FROM messages WHERE status = 'PUBLISHED';
```

### Which tables have `churchId`?

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

### How `churchId` is enforced

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

### The Slug Uniqueness Pattern

Slugs (URL-friendly identifiers) are unique **per church**, not globally. This is done with composite unique constraints:

```
@@unique([churchId, slug])   ← Speaker, Series, Ministry, Campus, Tag,
                                Message, Event, BibleStudy, Video,
                                DailyBread, Page, Menu
```

This means:
- LA UBF can have a message with slug `grace-alone`
- Grace Church can also have a message with slug `grace-alone`
- They don't conflict because they belong to different churches

---

## 6. Index Strategy (Why Those `@@index` Lines Matter)

Indexes make queries fast. Without them, the database has to scan every row in the table to find what you're looking for. With them, it can jump directly to the right rows.

### The `churchId`-First Pattern

Almost every index starts with `churchId`:

```prisma
@@index([churchId, dateFor(sort: Desc)])      // Messages
@@index([churchId, status])                    // Messages, Events, Videos, etc.
@@index([churchId, dateStart])                 // Events
@@index([churchId, isActive])                  // Speakers, Series, Ministries
@@index([churchId, isPublished])               // Pages
```

**Why?** Because every query in a multi-tenant app starts with `WHERE churchId = ?`. By putting `churchId` first in the index, PostgreSQL can immediately narrow down to just that church's rows before filtering further.

Think of it like a phone book:
- Index on `[churchId, dateFor]` = "Find LA UBF's messages, sorted by date"
- Index on just `[dateFor]` = "Find messages by date across ALL churches" ← useless for us

### Composite Indexes for Common Queries

Some tables have multi-column indexes for specific query patterns:

```prisma
// "Get all published messages for a church, newest first"
@@index([churchId, status, dateFor(sort: Desc)])

// "Get all events of a specific type, by status and date"
@@index([churchId, type, status, dateStart])
```

These indexes let PostgreSQL answer the full query without touching the main table data at all — it just reads the index.

### Unique Constraints That Double as Indexes

Every `@@unique()` constraint automatically creates an index:

```prisma
@@unique([churchId, slug])     // Fast slug lookups AND prevents duplicate slugs per church
@@unique([churchId, userId])   // Fast membership lookups AND prevents duplicate memberships
@@unique([churchId, date])     // DailyBread: one entry per day per church
```

---

## 7. Key Relationships Explained

### Message ↔ BibleStudy (One-to-One, Optional)

A sermon (Message) can be linked to a BibleStudy, and vice versa. This is a one-to-one optional relationship:

```
Message                          BibleStudy
├── relatedStudyId (FK) ──────→  id
                                 │
                        (reverse: relatedMessage)
```

The FK lives on Message (`relatedStudyId` is `@unique`). Either side can exist without the other.

### Message ↔ Series (Many-to-Many)

A message can belong to multiple series, and a series can contain multiple messages. This uses a join table:

```
Message ←──── MessageSeries ────→ Series
                  │
                  └── sortOrder (position within the series)
```

### Page ↔ PageSection (One-to-Many, Ordered)

A page has multiple sections, ordered by `sortOrder`:

```
Page
  └── sections: [
        { sortOrder: 0, sectionType: HERO_BANNER, content: {...} },
        { sortOrder: 1, sectionType: MEDIA_TEXT, content: {...} },
        { sortOrder: 2, sectionType: ALL_MESSAGES, content: {...} },
        { sortOrder: 3, sectionType: CTA_BANNER, content: {...} },
      ]
```

The `content` field is JSONB — its shape depends on `sectionType`. A `HERO_BANNER` section's content looks completely different from an `ALL_MESSAGES` section's content.

### Theme → ThemeCustomization (One-to-Many, but One-per-Church)

`Theme` is a platform-level template (shared across all churches). `ThemeCustomization` is a church's overrides for that template:

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

The rendering pipeline merges `Theme.defaultTokens` with `ThemeCustomization` overrides to produce the final CSS variables for each church's website.

### Menu → MenuItem (Tree Structure)

Menus use a self-referencing tree for nested navigation:

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

Top-level items have `parentId: null`. Child items reference their parent's ID.

---

## 8. Key Design Principles

### 1. Single Source of Truth

Each piece of data lives in exactly one place. `Church.name` is the church's name — not duplicated in `SiteSettings.siteName` (well, `SiteSettings` has its own `siteName` for the public website display name, which can differ from the legal church name).

### 2. Soft Deletes

Most content tables have a `deletedAt` column instead of actually deleting rows:

```
deletedAt   DateTime?    // null = active, non-null = soft-deleted
```

This means:
- Deleted content can be recovered
- Foreign key references don't break
- Audit trail is preserved
- Queries must filter `WHERE deletedAt IS NULL` (the DAL handles this)

Tables with soft deletes: Church, User, Speaker, Series, Ministry, Campus, Message, Event, BibleStudy, Video, DailyBread, Announcement, MediaAsset, Page.

Tables WITHOUT soft deletes (hard delete): Session, ChurchMember, Subscription, CustomDomain, ApiKey, AuditLog, ContentTag, MessageSeries, EventLink, BibleStudyAttachment, PageSection, Menu, MenuItem, SiteSettings, ThemeCustomization, Theme.

### 3. JSONB for Flexible Content

Several tables use PostgreSQL's JSONB type for data that doesn't fit neatly into columns:

| Table | JSONB Column | What It Stores |
|---|---|---|
| PageSection | `content` | Section-specific data (different shape per SectionType) |
| Theme | `defaultTokens` | Default design tokens (colors, fonts, spacing) |
| Theme | `defaultPages` | Template's default page structure |
| ThemeCustomization | `tokenOverrides` | Church's design token overrides |
| ThemeCustomization | `navbarStyle`, `footerStyle`, `buttonStyle`, `cardStyle` | Component-level style overrides |
| Church | `settings` | Misc church settings |
| SiteSettings | `serviceTimes` | Structured service time data |
| Message | `transcriptSegments`, `studySections`, `attachments` | Structured content blocks |
| Event | `links`, `customRecurrence` | Flexible link lists, custom recurrence rules |
| ContactSubmission | `fields` | Dynamic form field values |
| AuditLog | `changes` | Before/after snapshots of edited records |

**Why JSONB instead of more columns?** For data that varies in shape. A `HERO_BANNER` section's content has `heading`, `subheading`, `backgroundImage`, `ctaText`, `ctaLink`. An `ALL_MESSAGES` section's content has `layout`, `itemsPerPage`, `showFilters`. These can't share the same columns — JSONB lets each section type define its own shape while sharing one table.

### 4. Cascade Deletes

When a Church is deleted, everything belonging to it is automatically deleted:

```prisma
church  Church  @relation(fields: [churchId], references: [id], onDelete: Cascade)
```

This `onDelete: Cascade` is on virtually every foreign key pointing to Church. Delete a church → all its messages, events, pages, settings, members, etc. are gone. Same for sub-relationships: delete a Page → all its PageSections are gone.

The cascade chain:
```
Church deleted
  → All Messages deleted → All MessageSeries deleted
  → All Events deleted → All EventLinks deleted
  → All BibleStudies deleted → All BibleStudyAttachments deleted
  → All Pages deleted → All PageSections deleted
  → All Menus deleted → All MenuItems deleted
  → All Tags deleted → All ContentTags deleted
  → All ChurchMembers deleted
  → SiteSettings deleted
  → ThemeCustomization deleted
  → etc.
```

### 5. SetNull for Optional References

When a referenced entity is deleted but the referencing entity should survive:

```prisma
speaker  Speaker?  @relation(fields: [speakerId], references: [id], onDelete: SetNull)
ministry Ministry? @relation(fields: [ministryId], references: [id], onDelete: SetNull)
campus   Campus?   @relation(fields: [campusId], references: [id], onDelete: SetNull)
```

Delete a Speaker → their Messages still exist, but `speakerId` becomes `null` instead of breaking.

### 6. Content Status Workflow

All publishable content shares the same status enum:

```
DRAFT → SCHEDULED → PUBLISHED → ARCHIVED
```

Used by: Message, Event, BibleStudy, Video, DailyBread, Announcement.

The public website only shows `PUBLISHED` content. The CMS admin shows all statuses.

### 7. Audit Trail

The `AuditLog` table records who did what:

```
AuditLog
├── churchId     ← which church
├── userId       ← who did it
├── action       ← "CREATE" | "UPDATE" | "DELETE" | etc.
├── entity       ← "Message" | "Event" | etc.
├── entityId     ← which record
├── changes      ← JSONB: { before: {...}, after: {...} }
├── ipAddress    ← where from
└── createdAt    ← when
```

This is append-only — audit logs are never updated or deleted.

### 8. UUIDs Everywhere

Every primary key is a UUID (`@default(uuid()) @db.Uuid`), not an auto-incrementing integer. This is important for multi-tenancy because:
- IDs are globally unique (no collision between churches)
- IDs don't leak information (you can't guess "there are 500 messages" from an ID of 500)
- IDs can be generated client-side before insert (useful for offline/batch operations)

---

## 9. Table Count Summary

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
| Notable: SectionType | 38 variants (one per website section component) |
| Notable: BibleBook | 66 variants (one per book of the Bible) |
| Notable: ContentStatus | 4 variants (DRAFT → SCHEDULED → PUBLISHED → ARCHIVED) |
