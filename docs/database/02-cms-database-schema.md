# CMS Database Schema

## Complete Prisma Schema for CMS Content Tables

This document maps every field from the current TypeScript implementations to Prisma models, designed for multi-tenant operation across 1,000+ churches.

> **Source code locations**: There are two sets of TypeScript types in this project:
> - **CMS admin**: `lib/events-data.ts`, `lib/messages-data.ts`, `lib/media-data.ts`, `lib/status.ts` — these define the types used by the CMS admin UI at `/cms/*`
> - **Public website**: `laubf-test/src/lib/types/*.ts` — these define types for the public-facing website
>
> Where these diverge, the schema must support both. Divergences are called out with migration notes.

---

## 1. Tenant & Auth Layer

These tables exist at the platform level and underpin the entire multi-tenant system.

### Church (Tenant)

```prisma
model Church {
  id            String   @id @default(uuid()) @db.Uuid
  name          String                        // "LA UBF", "Grace Community Church"
  slug          String   @unique              // subdomain: "la-ubf" → la-ubf.digitalchurch.com
  customDomain  String?  @unique              // "laubf.org" (verified custom domain)

  // Branding
  logoUrl       String?                       // Church logo
  faviconUrl    String?                       // Browser favicon
  accentColor   String?  @default("#000000")  // Primary brand color (hex)

  // Contact info
  email         String?                       // contact@laubf.org
  phone         String?                       // E.164 format
  address       String?
  city          String?
  state         String?
  zipCode       String?
  country       String   @default("US")

  // Social links
  websiteUrl    String?
  facebookUrl   String?
  instagramUrl  String?
  youtubeUrl    String?
  twitterUrl    String?

  // Operational
  timezone      String   @default("America/Los_Angeles")
  locale        String   @default("en-US")
  currency      String   @default("USD")
  status        ChurchStatus @default(ACTIVE)
  plan          PlanTier  @default(STARTER)

  // Metadata
  settings      Json?    @db.JsonB            // Flexible church-level settings
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations (all content belongs to a church)
  members          ChurchMember[]
  subscription     Subscription?
  customDomains    CustomDomain[]
  speakers         Speaker[]
  serieses         Series[]
  ministries       Ministry[]
  campuses         Campus[]
  messages         Message[]
  events           Event[]
  bibleStudies     BibleStudy[]
  videos           Video[]
  dailyBreads      DailyBread[]
  mediaAssets      MediaAsset[]
  tags             Tag[]
  announcements    Announcement[]
  contactSubmissions ContactSubmission[]
  pages            Page[]
  pageSections     PageSection[]
  menus            Menu[]
  siteSettings     SiteSettings?
  themeCustomization ThemeCustomization?
  apiKeys          ApiKey[]
  auditLogs        AuditLog[]

  @@index([slug])
  @@index([status])
}

enum ChurchStatus {
  TRIAL
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum PlanTier {
  FREE
  STARTER
  GROWTH
  PROFESSIONAL
  ENTERPRISE
}
```

### User (Global Accounts)

```prisma
model User {
  id              String   @id @default(uuid()) @db.Uuid
  email           String   @unique
  passwordHash    String
  firstName       String
  lastName        String
  avatarUrl       String?
  emailVerified   Boolean  @default(false)
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  memberships     ChurchMember[]
  sessions        Session[]

  @@index([email])
}
```

### ChurchMember (User ↔ Org)

```prisma
model ChurchMember {
  id        String     @id @default(uuid()) @db.Uuid
  churchId     String     @db.Uuid
  userId    String     @db.Uuid
  role      MemberRole @default(EDITOR)
  invitedAt DateTime?
  joinedAt  DateTime   @default(now())

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([churchId, userId])
  @@index([churchId])
  @@index([userId])
}

enum MemberRole {
  OWNER       // Full control, billing, can delete org
  ADMIN       // All content + member management
  EDITOR      // Create/edit/delete content
  VIEWER      // Read-only access to CMS
}
```

### Session

```prisma
model Session {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @db.Uuid
  token        String   @unique
  expiresAt    DateTime
  ipAddress    String?
  userAgent    String?

  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

### Subscription

```prisma
model Subscription {
  id                  String   @id @default(uuid()) @db.Uuid
  churchId               String   @unique @db.Uuid
  stripeCustomerId    String?  @unique
  stripeSubscriptionId String? @unique
  plan                PlanTier
  status              SubStatus @default(ACTIVE)
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  cancelAtPeriodEnd   Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  church              Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId])
  @@index([status])
}

enum SubStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
}
```

### CustomDomain

```prisma
model CustomDomain {
  id            String       @id @default(uuid()) @db.Uuid
  churchId         String       @db.Uuid
  domain        String       @unique              // "gracechurch.org"
  status        DomainStatus @default(PENDING)
  verificationToken String?                       // DNS TXT record value
  sslStatus     SslStatus    @default(PENDING)
  verifiedAt    DateTime?

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  church        Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId])
  @@index([domain])
}

enum DomainStatus {
  PENDING
  VERIFIED
  FAILED
}

enum SslStatus {
  PENDING
  ACTIVE
  ERROR
}
```

### ApiKey

```prisma
model ApiKey {
  id          String   @id @default(uuid()) @db.Uuid
  churchId       String   @db.Uuid
  name        String                            // "Mobile App Key"
  keyHash     String   @unique                  // SHA-256 hash (never store plaintext)
  keyPrefix   String                            // First 8 chars for identification: "dcp_abc1..."
  permissions String[]                          // ["messages:read", "events:read"]
  expiresAt   DateTime?
  lastUsedAt  DateTime?

  createdAt   DateTime @default(now())

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId])
  @@index([keyHash])
}
```

---

## 2. Shared Reference Tables

### Speaker

Currently `speaker` is a plain string on `Message`. Normalizing it allows:
- Consistent speaker names across messages
- Speaker profile pages (bio, photo)
- Filtering/grouping by speaker

```prisma
model Speaker {
  id        String   @id @default(uuid()) @db.Uuid
  churchId     String   @db.Uuid
  name      String                              // "P. William", "Pastor John Kim"
  slug      String                              // "p-william"
  title     String?                             // "Senior Pastor"
  bio       String?  @db.Text                   // Rich text biography
  photoUrl  String?
  email     String?
  isActive  Boolean  @default(true)
  sortOrder Int      @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  messages     Message[]
  bibleStudies BibleStudy[]

  @@unique([churchId, slug])
  @@index([churchId, isActive])
  @@index([churchId, name])
}
```

### Series

Currently `series` is a string on both `Message` and `BibleStudy`. Normalizing it:
- Provides series metadata (description, image, date range)
- Links messages and bible studies within the same series
- Enables series pages on the public website

```prisma
model Series {
  id          String   @id @default(uuid()) @db.Uuid
  churchId       String   @db.Uuid
  name        String                            // "Sunday Message", "Advent 2025"
  slug        String                            // "sunday-message"
  description String?  @db.Text
  imageUrl    String?                           // Series artwork
  startDate   DateTime?                         // When series began
  endDate     DateTime?                         // When series ended (null = ongoing)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  church        Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  messageSeries MessageSeries[]                 // Many-to-many via join table (CMS: seriesIds[])
  bibleStudies  BibleStudy[]

  @@unique([churchId, slug])
  @@index([churchId, isActive])
  @@index([churchId, name])
}
```

### Ministry

Currently hardcoded as `MinistryTag` enum ("young-adult" | "adult" | "children" | "high-school" | "church-wide"). Each church has different ministries, so this must be a table.

```prisma
model Ministry {
  id          String   @id @default(uuid()) @db.Uuid
  churchId       String   @db.Uuid
  name        String                            // "Young Adult", "Children"
  slug        String                            // "young-adult"
  description String?  @db.Text
  imageUrl    String?
  color       String?                           // Hex color for UI badges
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  events       Event[]

  @@unique([churchId, slug])
  @@index([churchId, isActive])
}
```

### Campus

Currently hardcoded as `CampusTag` enum with 11 specific campuses. Each church has different campuses/locations.

```prisma
model Campus {
  id          String   @id @default(uuid()) @db.Uuid
  churchId       String   @db.Uuid
  name        String                            // "CSULB", "UCLA"
  slug        String                            // "csulb"
  shortName   String?                           // Abbreviated name
  description String?  @db.Text
  imageUrl    String?
  address     String?
  city        String?
  state       String?
  zipCode     String?
  latitude    Decimal? @db.Decimal(10, 8)       // For map display
  longitude   Decimal? @db.Decimal(11, 8)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  events       Event[]

  @@unique([churchId, slug])
  @@index([churchId, isActive])
}
```

### Tag

Flexible tagging system that can be applied to any content type.

```prisma
model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  churchId     String   @db.Uuid
  name      String                              // "featured", "outreach"
  slug      String
  color     String?                             // Hex color

  createdAt DateTime @default(now())

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  contentTags  ContentTag[]

  @@unique([churchId, slug])
  @@index([churchId])
}

model ContentTag {
  id          String @id @default(uuid()) @db.Uuid
  tagId       String @db.Uuid
  entityType  String                            // "Message", "Event", "Video", etc.
  entityId    String @db.Uuid                   // Polymorphic FK

  tag         Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([tagId, entityType, entityId])
  @@index([entityType, entityId])
  @@index([tagId])
}
```

---

## 3. CMS Content Tables

### Message (Sermon)

**Source**: `lib/messages-data.ts` — `type Message` (CMS admin), `laubf-test/src/lib/types/message.ts` — `interface Message` (public website)

Every field from the current TypeScript `Message` type is mapped here, plus multi-tenant fields.

> **Migration note — Series relationship**: The CMS admin uses `seriesIds: string[]` (many-to-many),
> meaning a message can belong to multiple series simultaneously. The public website types use a
> single `series: string`. The schema uses a join table (`MessageSeries`) to support many-to-many.

> **Migration note — Video/Study flags**: The CMS admin uses `hasVideo` and `hasStudy` boolean
> flags plus `videoUrl`, `videoDescription`, `transcriptSegments`, `studySections`, and
> `attachments` fields not present in the public website types. These are captured below.

```prisma
model Message {
  id              String        @id @default(uuid()) @db.Uuid
  churchId           String        @db.Uuid
  slug            String                          // URL slug, unique per org
  title           String                          // "As The Spirit Gave Them Utterance"
  passage         String?                         // "Acts 2:1-13" — Bible reference
  speakerId       String?       @db.Uuid          // FK to Speaker (was: speaker string)
  dateFor         DateTime      @db.Date          // The date this sermon is for (e.g., the Sunday)
  description     String?       @db.Text          // Short description/summary

  // Video
  videoUrl        String?                         // CMS: videoUrl (YouTube/Vimeo full URL)
  videoDescription String?      @db.Text          // CMS: videoDescription
  youtubeId       String?                         // YouTube video ID (extracted from URL)
  thumbnailUrl    String?                         // Custom thumbnail (falls back to YouTube)
  duration        String?                         // "45:23" format

  // Audio
  audioUrl        String?                         // Standalone audio file URL

  // Transcripts
  rawTranscript   String?       @db.Text          // HTML — prepared/edited transcript
  liveTranscript  String?       @db.Text          // HTML — auto-generated from audio
  transcriptSegments Json?      @db.JsonB         // CMS: TranscriptSegment[] { id, startTime, endTime, text }

  // Study sections (inline study content, separate from BibleStudy relation)
  studySections   Json?         @db.JsonB         // CMS: StudySection[] { id, title, content }
  attachments     Json?         @db.JsonB         // CMS: Attachment[] { id, name, size, type }

  // Availability flags (derived, stored for query performance)
  hasVideo        Boolean       @default(false)   // CMS: hasVideo
  hasStudy        Boolean       @default(false)   // CMS: hasStudy

  // Publishing
  status          ContentStatus @default(DRAFT)
  publishedAt     DateTime?                       // When first published (CMS: publishedAt)

  // Relationship to Bible Study (bidirectional)
  relatedStudyId  String?       @unique @db.Uuid  // FK to BibleStudy

  // Metadata
  viewCount       Int           @default(0)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  createdBy       String?       @db.Uuid          // User who created
  updatedBy       String?       @db.Uuid          // User who last updated
  deletedAt       DateTime?

  // Relations
  church          Church  @relation(fields: [churchId], references: [id], onDelete: Cascade)
  speaker         Speaker?      @relation(fields: [speakerId], references: [id], onDelete: SetNull)
  messageSeries   MessageSeries[]                 // Many-to-many via join table
  relatedStudy    BibleStudy?   @relation("MessageStudy", fields: [relatedStudyId], references: [id], onDelete: SetNull)

  // Search
  searchVector    Unsupported("tsvector")?

  @@unique([churchId, slug])
  @@index([churchId, dateFor(sort: Desc)])
  @@index([churchId, speakerId])
  @@index([churchId, status])
  @@index([churchId, status, dateFor(sort: Desc)])
  @@index([churchId, hasVideo])
}

// Join table for Message <-> Series (many-to-many)
// The CMS admin allows a message to belong to multiple series (seriesIds: string[])
model MessageSeries {
  id        String   @id @default(uuid()) @db.Uuid
  messageId String   @db.Uuid
  seriesId  String   @db.Uuid
  sortOrder Int      @default(0)

  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  series    Series   @relation(fields: [seriesId], references: [id], onDelete: Cascade)

  @@unique([messageId, seriesId])
  @@index([seriesId])
  @@index([messageId])
}

// Maps to ContentStatus from lib/status.ts: "published" | "draft" | "scheduled" | "archived"
// The CMS uses lowercase strings; Prisma enums use UPPER_CASE.
// Conversion happens in the application layer.
enum ContentStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}
```

### Event

**Source**: `lib/events-data.ts` — `type ChurchEvent` (CMS admin), `laubf-test/src/lib/types/events.ts` — `interface Event` (public website)

The most complex content type. Supports one-time events, recurring meetings, and programs.

> **Migration note — Recurrence model**: The CMS admin currently uses a richer recurrence model
> (`Recurrence` type with `"yearly"`, `"weekday"`, `"custom"` values plus a `CustomRecurrence`
> object with `interval`, `days`, `endType`, `endDate`, `endAfter`). The schema below captures
> the full CMS model. The public website types use a simpler subset (`RecurrenceType` with only
> DAILY/WEEKLY/BIWEEKLY/MONTHLY). Both should converge on this schema at migration time.

> **Migration note — Location model**: The CMS uses `locationType: "in-person" | "online"` as
> a discriminator. The schema stores this as a `LocationType` enum to preserve the UI's two-mode
> behavior, rather than the earlier `isOnline` boolean approach.

```prisma
model Event {
  id                String        @id @default(uuid()) @db.Uuid
  churchId             String        @db.Uuid
  slug              String                          // URL slug
  title             String                          // "Welcome Week Outreach"
  type              EventType                       // MEETING, EVENT, PROGRAM

  // Scheduling
  dateStart         DateTime      @db.Date          // Start date (CMS: date)
  dateEnd           DateTime?     @db.Date          // End date (CMS: endDate)
  startTime         String?                         // "10:00" (24h format, CMS: startTime)
  endTime           String?                         // "12:00" (24h format, CMS: endTime)
  allDay            Boolean       @default(false)

  // Location
  locationType      LocationType  @default(IN_PERSON) // CMS: locationType
  location          String?                         // "LA UBF Center"
  address           String?                         // Full address for maps
  latitude          Decimal?      @db.Decimal(10, 8)
  longitude         Decimal?      @db.Decimal(11, 8)
  meetingUrl        String?                         // Zoom/Google Meet URL

  // Content
  shortDescription  String?       @db.Text          // CMS: shortDescription (card/list display)
  description       String?       @db.Text          // Rich HTML body (CMS: description)
  welcomeMessage    String?       @db.Text          // CMS: welcomeMessage (detail page)
  coverImage        String?                         // Event image (CMS: coverImage)
  imageAlt          String?
  imagePosition     String?                         // CSS object-position

  // Contacts
  contacts          String[]                        // CMS: contacts (array of names)

  // Categorization
  ministryId        String?       @db.Uuid          // FK to Ministry
  campusId          String?       @db.Uuid          // FK to Campus
  badge             String?                         // "UPCOMING", "FEATURED", "NEW"

  // Registration
  registrationUrl   String?                         // External registration link
  capacity          Int?                            // Max attendees
  registrationCount Int           @default(0)

  // Links
  links             Json?         @db.JsonB         // Array<{ label, href, external }>

  // Flags
  isFeatured        Boolean       @default(false)
  isPinned          Boolean       @default(false)   // CMS: isPinned (sticky ordering)
  isRecurring       Boolean       @default(false)   // Derived from recurrence != NONE

  // Recurrence (full model matching CMS admin UI)
  recurrence        Recurrence    @default(NONE)    // CMS: recurrence
  recurrenceDays    String[]                        // ["mon", "tue", ...] (CMS: DayOfWeek[])
  recurrenceEndType RecurrenceEndType @default(NEVER) // CMS: recurrenceEndType
  recurrenceEndDate DateTime?     @db.Date          // CMS: recurrenceEndDate (when endType = ON_DATE)
  recurrenceEndAfter Int?                           // CMS: endAfter (when endType = AFTER)
  customRecurrence  Json?         @db.JsonB         // CMS: CustomRecurrence { interval, days, endType, endDate, endAfter }
  recurrenceSchedule String?                        // Pre-computed label: "Every Saturday"

  // Publishing
  status            ContentStatus @default(DRAFT)
  publishedAt       DateTime?

  // Metadata
  viewCount         Int           @default(0)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  createdBy         String?       @db.Uuid
  updatedBy         String?       @db.Uuid
  deletedAt         DateTime?

  // Relations
  church            Church  @relation(fields: [churchId], references: [id], onDelete: Cascade)
  ministry          Ministry?     @relation(fields: [ministryId], references: [id], onDelete: SetNull)
  campus            Campus?       @relation(fields: [campusId], references: [id], onDelete: SetNull)
  eventLinks        EventLink[]

  @@unique([churchId, slug])
  @@index([churchId, dateStart])
  @@index([churchId, type])
  @@index([churchId, ministryId])
  @@index([churchId, campusId])
  @@index([churchId, status])
  @@index([churchId, isFeatured])
  @@index([churchId, isPinned])
  @@index([churchId, isRecurring])
  @@index([churchId, status, dateStart])
  @@index([churchId, type, status, dateStart])
}

enum EventType {
  MEETING     // Recurring meetings (Daily Bread, Bible Study)
  EVENT       // One-time events (conferences, outreach)
  PROGRAM     // Ongoing programs (summer, semester)
}

enum LocationType {
  IN_PERSON
  ONLINE
}

enum Recurrence {
  NONE        // Does not repeat
  DAILY       // Every day
  WEEKLY      // Every week
  MONTHLY     // Every month
  YEARLY      // Every year
  WEEKDAY     // Mon-Fri
  CUSTOM      // Custom interval + days (see customRecurrence JSONB)
}

enum RecurrenceEndType {
  NEVER       // Repeats indefinitely
  ON_DATE     // Ends on a specific date
  AFTER       // Ends after N occurrences
}
```

### EventLink

Normalized from the inline `links` array on Event. Kept as both JSONB (for simple reads) and a separate table (for querying). Use the JSONB `links` field for display; use this table only if you need to query/search across links.

```prisma
model EventLink {
  id        String  @id @default(uuid()) @db.Uuid
  eventId   String  @db.Uuid
  label     String                                // "Register Now"
  href      String                                // URL
  external  Boolean @default(false)               // Opens in new tab
  sortOrder Int     @default(0)

  event     Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([eventId])
}
```

### BibleStudy

**Source**: `laubf-test/src/lib/types/bible-study.ts` — `interface BibleStudy`

```prisma
model BibleStudy {
  id               String        @id @default(uuid()) @db.Uuid
  churchId            String        @db.Uuid
  slug             String                          // URL slug
  title            String                          // "Do You Truly Love Me More Than These?"
  book             BibleBook                       // JOHN, GENESIS, etc.
  passage          String                          // "John 21:1-25"

  // Dates
  datePosted       DateTime      @db.Date          // When published
  dateFor          DateTime      @db.Date          // The sermon date this study is for

  // Attribution
  seriesId         String?       @db.Uuid          // FK to Series
  speakerId        String?       @db.Uuid          // FK to Speaker (was: messenger string)

  // Content sections (all rich HTML from TinyMCE)
  questions        String?       @db.Text          // Study questions HTML
  answers          String?       @db.Text          // Answers HTML
  transcript       String?       @db.Text          // Transcript HTML
  bibleText        String?       @db.Text          // Scripture passage HTML

  // Key verse
  keyVerseRef      String?                         // "John 21:15" — the reference
  keyVerseText     String?       @db.Text          // The actual verse text

  // Availability flags (derived, but stored for query performance)
  hasQuestions      Boolean       @default(false)
  hasAnswers        Boolean       @default(false)
  hasTranscript     Boolean       @default(false)

  // Relationship to Message (bidirectional)
  relatedMessage   Message?      @relation("MessageStudy")

  // Publishing
  status           ContentStatus @default(DRAFT)
  publishedAt      DateTime?

  // Metadata
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  createdBy        String?       @db.Uuid
  updatedBy        String?       @db.Uuid
  deletedAt        DateTime?

  // Relations
  church           Church  @relation(fields: [churchId], references: [id], onDelete: Cascade)
  series           Series?       @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  speaker          Speaker?      @relation(fields: [speakerId], references: [id], onDelete: SetNull)
  attachments      BibleStudyAttachment[]

  @@unique([churchId, slug])
  @@index([churchId, dateFor(sort: Desc)])
  @@index([churchId, book])
  @@index([churchId, seriesId])
  @@index([churchId, speakerId])
  @@index([churchId, status])
}

// All 66 books of the Bible
enum BibleBook {
  GENESIS
  EXODUS
  LEVITICUS
  NUMBERS
  DEUTERONOMY
  JOSHUA
  JUDGES
  RUTH
  FIRST_SAMUEL
  SECOND_SAMUEL
  FIRST_KINGS
  SECOND_KINGS
  FIRST_CHRONICLES
  SECOND_CHRONICLES
  EZRA
  NEHEMIAH
  ESTHER
  JOB
  PSALMS
  PROVERBS
  ECCLESIASTES
  SONG_OF_SOLOMON
  ISAIAH
  JEREMIAH
  LAMENTATIONS
  EZEKIEL
  DANIEL
  HOSEA
  JOEL
  AMOS
  OBADIAH
  JONAH
  MICAH
  NAHUM
  HABAKKUK
  ZEPHANIAH
  HAGGAI
  ZECHARIAH
  MALACHI
  MATTHEW
  MARK
  LUKE
  JOHN
  ACTS
  ROMANS
  FIRST_CORINTHIANS
  SECOND_CORINTHIANS
  GALATIANS
  EPHESIANS
  PHILIPPIANS
  COLOSSIANS
  FIRST_THESSALONIANS
  SECOND_THESSALONIANS
  FIRST_TIMOTHY
  SECOND_TIMOTHY
  TITUS
  PHILEMON
  HEBREWS
  JAMES
  FIRST_PETER
  SECOND_PETER
  FIRST_JOHN
  SECOND_JOHN
  THIRD_JOHN
  JUDE
  REVELATION
}
```

### BibleStudyAttachment

**Source**: `laubf-test/src/lib/types/bible-study.ts` — `interface BibleStudyAttachment`

```prisma
model BibleStudyAttachment {
  id           String         @id @default(uuid()) @db.Uuid
  bibleStudyId String         @db.Uuid
  name         String                              // "Study Guide PDF"
  url          String                              // File URL
  type         AttachmentType                      // PDF, DOCX, IMAGE, OTHER
  fileSize     Int?                                // Bytes
  sortOrder    Int            @default(0)

  createdAt    DateTime       @default(now())

  bibleStudy   BibleStudy     @relation(fields: [bibleStudyId], references: [id], onDelete: Cascade)

  @@index([bibleStudyId])
}

enum AttachmentType {
  PDF
  DOCX
  IMAGE
  OTHER
}
```

### Video

**Source**: `laubf-test/src/lib/types/video.ts` — `interface Video`

```prisma
model Video {
  id            String        @id @default(uuid()) @db.Uuid
  churchId         String        @db.Uuid
  slug          String                              // URL slug
  title         String                              // "Easter 2025 Recap"
  youtubeId     String                              // YouTube video ID
  category      VideoCategory                       // EVENT_RECAP, WORSHIP, etc.
  datePublished DateTime      @db.Date              // Publication date
  duration      String?                             // "3:45" format
  description   String?       @db.Text
  thumbnailUrl  String?                             // Custom thumbnail
  isShort       Boolean       @default(false)       // YouTube Shorts flag

  // Publishing
  status        ContentStatus @default(DRAFT)
  publishedAt   DateTime?

  // Metadata
  viewCount     Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  createdBy     String?       @db.Uuid
  updatedBy     String?       @db.Uuid
  deletedAt     DateTime?

  church        Church  @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@unique([churchId, slug])
  @@index([churchId, datePublished(sort: Desc)])
  @@index([churchId, category])
  @@index([churchId, status])
  @@index([churchId, isShort])
}

enum VideoCategory {
  EVENT_RECAP
  WORSHIP
  TESTIMONY
  SPECIAL_FEATURE
  DAILY_BREAD
  PROMO
  OTHER
}
```

### DailyBread

**Source**: `laubf-test/src/lib/types/daily-bread.ts` — `interface DailyBread`

```prisma
model DailyBread {
  id          String        @id @default(uuid()) @db.Uuid
  churchId       String        @db.Uuid
  slug        String                                // URL slug
  title       String                                // "Kiss The Son"
  date        DateTime      @db.Date                // The day this devotional is for
  passage     String                                // "Psalm 2:1-12"
  keyVerse    String?                               // "12" — verse number(s)
  body        String        @db.Text                // Rich HTML devotional text
  bibleText   String?       @db.Text                // Rich HTML scripture passage
  author      String                                // "P. William"
  audioUrl    String?                               // Audio recording URL

  // Publishing
  status      ContentStatus @default(DRAFT)
  publishedAt DateTime?

  // Metadata
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  createdBy   String?       @db.Uuid
  updatedBy   String?       @db.Uuid
  deletedAt   DateTime?

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@unique([churchId, slug])
  @@unique([churchId, date])                           // One devotional per day per org
  @@index([churchId, date(sort: Desc)])
  @@index([churchId, status])
}
```

### MediaAsset

Centralized media management for all uploaded files (images, PDFs, audio, video).

```prisma
model MediaAsset {
  id          String    @id @default(uuid()) @db.Uuid
  churchId       String    @db.Uuid
  filename    String                                // Original filename
  url         String                                // CDN/storage URL
  mimeType    String                                // "image/jpeg", "application/pdf"
  fileSize    Int                                   // Bytes
  width       Int?                                  // Image width (pixels)
  height      Int?                                  // Image height (pixels)
  alt         String?                               // Alt text for accessibility
  folder      String    @default("/")               // Virtual folder path

  // Auto-generated variants
  thumbnailUrl String?                              // Auto-generated thumbnail

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  createdBy   String?   @db.Uuid
  deletedAt   DateTime?

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId, folder])
  @@index([churchId, mimeType])
  @@index([churchId, createdAt(sort: Desc)])
}
```

### Announcement

```prisma
model Announcement {
  id          String        @id @default(uuid()) @db.Uuid
  churchId       String        @db.Uuid
  title       String
  body        String?       @db.Text                // Rich HTML
  priority    AnnouncePriority @default(NORMAL)
  startDate   DateTime      @db.Date                // When to start showing
  endDate     DateTime?     @db.Date                // When to stop showing (null = indefinite)
  isPinned    Boolean       @default(false)

  status      ContentStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  createdBy   String?       @db.Uuid
  deletedAt   DateTime?

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId, status, startDate])
}

enum AnnouncePriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

### ContactSubmission

For the "Contact Us" and "I'm New" forms on the public website.

```prisma
model ContactSubmission {
  id          String   @id @default(uuid()) @db.Uuid
  churchId       String   @db.Uuid
  formType    String                                // "contact", "im-new", "prayer-request"
  name        String
  email       String
  phone       String?
  subject     String?
  message     String?  @db.Text

  // Form-specific fields (flexible)
  fields      Json?    @db.JsonB                    // { interest: "Bible Study", campus: "CSULB", wantsBibleTeacher: true }

  // Processing
  isRead      Boolean  @default(false)
  readAt      DateTime?
  assignedTo  String?  @db.Uuid                     // Staff member assigned
  notes       String?  @db.Text                     // Internal notes

  createdAt   DateTime @default(now())

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId, isRead])
  @@index([churchId, formType])
  @@index([churchId, createdAt(sort: Desc)])
}
```

### AuditLog

```prisma
model AuditLog {
  id          String   @id @default(uuid()) @db.Uuid
  churchId       String   @db.Uuid
  userId      String?  @db.Uuid
  action      String                                // "CREATE", "UPDATE", "DELETE", "PUBLISH"
  entity      String                                // "Message", "Event", "BibleStudy"
  entityId    String?  @db.Uuid
  changes     Json?    @db.JsonB                    // { field: { old: X, new: Y } }
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId, createdAt(sort: Desc)])
  @@index([churchId, entity, entityId])
  @@index([churchId, userId])
}
```

---

## 4. Field Mapping Reference

This table maps every field from the current TypeScript interfaces to their database columns.

### Message Fields

> **Two TypeScript sources**: The CMS admin uses `Message` from `lib/messages-data.ts`.
> The public website uses `Message` from `laubf-test/src/lib/types/message.ts`.
> The mapping below references both, noting divergences.

| CMS Field (`lib/messages-data.ts`) | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Auto-generated |
| — (website: `slug`) | `slug` | `String` | Unique per church |
| `title` | `title` | `String` | — |
| `passage` | `passage` | `String?` | Bible reference |
| `speaker` | `speakerId` | `UUID? → Speaker` | **Normalized**: string → FK |
| `seriesIds` | via `MessageSeries` | join table | **Many-to-many** (CMS allows multiple series) |
| `date` (CMS) / `dateFor` (website) | `dateFor` | `Date` | The sermon date |
| — (website: `description`) | `description` | `Text?` | Short summary |
| `videoUrl` | `videoUrl` | `String?` | Full video URL |
| `videoDescription` | `videoDescription` | `Text?` | Video description |
| — (website: `youtubeId`) | `youtubeId` | `String?` | YouTube video ID (extracted) |
| `rawTranscript` | `rawTranscript` | `Text?` | Edited transcript HTML |
| — (website: `liveTranscript`) | `liveTranscript` | `Text?` | Auto-generated HTML |
| `transcriptSegments` | `transcriptSegments` | `Json?` | `[{ id, startTime, endTime, text }]` |
| `studySections` | `studySections` | `Json?` | `[{ id, title, content }]` |
| `attachments` | `attachments` | `Json?` | `[{ id, name, size, type }]` |
| `hasVideo` | `hasVideo` | `Boolean` | Derived flag |
| `hasStudy` | `hasStudy` | `Boolean` | Derived flag |
| `status` | `status` | `ContentStatus` | from `lib/status.ts` |
| `publishedAt` | `publishedAt` | `DateTime?` | Publication timestamp |
| — (website: `relatedStudyId`) | `relatedStudyId` | `UUID? → BibleStudy` | Bidirectional link |
| — (website: `duration`) | `duration` | `String?` | "45:23" format |
| — (new) | `churchId` | `UUID → Church` | **Multi-tenant key** |
| — (new) | `thumbnailUrl` | `String?` | Custom thumbnail |
| — (new) | `audioUrl` | `String?` | Standalone audio |
| — (new) | `viewCount` | `Int` | Analytics |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit timestamps |
| — (new) | `createdBy/updatedBy` | `UUID?` | Audit user refs |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### Event Fields

> **Two TypeScript sources**: The CMS admin uses `ChurchEvent` from `lib/events-data.ts`.
> The public website uses `Event` from `laubf-test/src/lib/types/events.ts`.
> The mapping below references the CMS admin type (primary source of truth for form fields).

| CMS Field (`ChurchEvent`) | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Auto-generated |
| `slug` | `slug` | `String` | Unique per church |
| `title` | `title` | `String` | — |
| `type` | `type` | `EventType` | MEETING/EVENT/PROGRAM |
| `date` | `dateStart` | `Date` | **Renamed** |
| `endDate` | `dateEnd` | `Date?` | Multi-day events |
| `startTime` | `startTime` | `String?` | "10:00" 24h format |
| `endTime` | `endTime` | `String?` | "12:00" 24h format |
| `locationType` | `locationType` | `LocationType` | IN_PERSON/ONLINE |
| `location` | `location` | `String?` | — |
| `meetingUrl` | `meetingUrl` | `String?` | Zoom/Google Meet |
| `shortDescription` | `shortDescription` | `Text?` | Card/list display |
| `description` | `description` | `Text?` | Rich HTML body |
| `welcomeMessage` | `welcomeMessage` | `Text?` | Detail page greeting |
| `coverImage` | `coverImage` | `String?` | **Renamed** from `imageUrl` |
| `imageAlt` | `imageAlt` | `String?` | — |
| — (website: `image.objectPosition`) | `imagePosition` | `String?` | CSS object-position |
| `contacts` | `contacts` | `String[]` | Contact names |
| `badge` | `badge` | `String?` | "UPCOMING", "FEATURED" |
| `tags` | via `ContentTag` | — | **Normalized** to join table |
| `ministry` | `ministryId` | `UUID? → Ministry` | **Normalized**: enum → FK |
| `campus` | `campusId` | `UUID? → Campus` | **Normalized**: enum → FK |
| `isPinned` | `isPinned` | `Boolean` | Sticky ordering |
| `isFeatured` (website) | `isFeatured` | `Boolean` | Homepage highlight |
| `registrationUrl` | `registrationUrl` | `String?` | External registration |
| `links` | `links` (JSONB) + `EventLink` | `Json?` | Both JSONB and normalized |
| `recurrence` | `recurrence` | `Recurrence` | NONE/DAILY/WEEKLY/MONTHLY/YEARLY/WEEKDAY/CUSTOM |
| `recurrenceDays` | `recurrenceDays` | `String[]` | ["mon", "tue", ...] |
| `recurrenceEndType` | `recurrenceEndType` | `RecurrenceEndType` | NEVER/ON_DATE/AFTER |
| `recurrenceEndDate` | `recurrenceEndDate` | `Date?` | — |
| — (derived) | `recurrenceEndAfter` | `Int?` | After N occurrences |
| `customRecurrence` | `customRecurrence` | `Json?` | { interval, days, endType, endDate, endAfter } |
| — (computed) | `recurrenceSchedule` | `String?` | Pre-computed label |
| `status` | `status` | `ContentStatus` | from `lib/status.ts` |
| — (new) | `churchId` | `UUID → Church` | **Multi-tenant key** |
| — (new) | `address` | `String?` | Full address for maps |
| — (new) | `latitude/longitude` | `Decimal?` | Geolocation |
| — (new) | `allDay` | `Boolean` | All-day event |
| — (new) | `capacity` | `Int?` | Registration limit |
| — (new) | `publishedAt` | `DateTime?` | Publication time |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit timestamps |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### BibleStudy Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | — |
| `slug` | `slug` | `String` | Unique per church |
| `title` | `title` | `String` | — |
| `book` | `book` | `BibleBook` | Enum of 66 books |
| `passage` | `passage` | `String` | "John 21:1-25" |
| `datePosted` | `datePosted` | `Date` | Publication date |
| `dateFor` | `dateFor` | `Date` | Sermon date |
| `series` | `seriesId` | `UUID? → Series` | **Normalized** |
| `messenger` | `speakerId` | `UUID? → Speaker` | **Normalized + renamed** |
| `relatedMessageId` | via `Message.relatedStudyId` | — | **Inverse relation** |
| `keyVerse.verse` | `keyVerseRef` | `String?` | **Flattened** |
| `keyVerse.text` | `keyVerseText` | `Text?` | **Flattened** |
| `questions` | `questions` | `Text?` | HTML |
| `answers` | `answers` | `Text?` | HTML |
| `transcript` | `transcript` | `Text?` | HTML |
| `bibleText` | `bibleText` | `Text?` | HTML |
| `attachments` | `BibleStudyAttachment[]` | relation | **Normalized** |
| `hasQuestions` | `hasQuestions` | `Boolean` | Derived/cached |
| `hasAnswers` | `hasAnswers` | `Boolean` | Derived/cached |
| `hasTranscript` | `hasTranscript` | `Boolean` | Derived/cached |
| — (new) | `churchId` | `UUID → Church` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | DRAFT/PUBLISHED/etc. |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### Video Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | — |
| `slug` | `slug` | `String` | Unique per church |
| `title` | `title` | `String` | — |
| `youtubeId` | `youtubeId` | `String` | — |
| `category` | `category` | `VideoCategory` | Enum |
| `datePublished` | `datePublished` | `Date` | — |
| `duration` | `duration` | `String?` | "3:45" |
| `description` | `description` | `Text?` | — |
| `isShort` | `isShort` | `Boolean` | YouTube Shorts flag |
| — (new) | `churchId` | `UUID → Church` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | — |
| — (new) | `thumbnailUrl` | `String?` | Custom thumbnail |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### DailyBread Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | — |
| `slug` | `slug` | `String` | Unique per church |
| `title` | `title` | `String` | — |
| `date` | `date` | `Date` | Unique per church per day |
| `passage` | `passage` | `String` | — |
| `keyVerse` | `keyVerse` | `String?` | Verse number(s) |
| `body` | `body` | `Text` | Rich HTML |
| `bibleText` | `bibleText` | `Text?` | Rich HTML |
| `author` | `author` | `String` | — |
| `tags` | via `ContentTag` | — | **Normalized** |
| `audioUrl` | `audioUrl` | `String?` | — |
| — (new) | `churchId` | `UUID → Church` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | — |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

---

## 5. Query Patterns

### Common CMS Queries and Their Index Usage

```sql
-- 1. List latest messages for a church (Messages page)
SELECT * FROM messages
WHERE church_id = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_for DESC
LIMIT 20;
-- Uses: idx_messages_org_status_date

-- 2. Get message by slug (Message detail page)
SELECT * FROM messages
WHERE church_id = ? AND slug = ?;
-- Uses: unique(church_id, slug)

-- 3. List messages by series
SELECT * FROM messages
WHERE church_id = ? AND series_id = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_for DESC;
-- Uses: idx_messages_org_series

-- 4. List upcoming events
SELECT * FROM events
WHERE church_id = ? AND status = 'PUBLISHED' AND date_start >= CURRENT_DATE AND deleted_at IS NULL
ORDER BY date_start ASC
LIMIT 10;
-- Uses: idx_events_org_status_date

-- 5. List events by ministry
SELECT * FROM events
WHERE church_id = ? AND ministry_id = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_start;
-- Uses: idx_events_org_ministry

-- 6. Get recurring meetings
SELECT * FROM events
WHERE church_id = ? AND is_recurring = TRUE AND status = 'PUBLISHED' AND deleted_at IS NULL;
-- Uses: idx_events_org_recurring

-- 7. Search messages (full-text)
SELECT * FROM messages
WHERE church_id = ? AND search_vector @@ plainto_tsquery('english', ?)
  AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY ts_rank(search_vector, plainto_tsquery('english', ?)) DESC;
-- Uses: GIN index on search_vector + idx on church_id

-- 8. Today's daily bread
SELECT * FROM daily_breads
WHERE church_id = ? AND date = CURRENT_DATE AND status = 'PUBLISHED';
-- Uses: unique(church_id, date)

-- 9. Bible studies by book
SELECT * FROM bible_studies
WHERE church_id = ? AND book = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_for DESC;
-- Uses: idx_bible_studies_org_book
```

---

## 6. Prisma Middleware for Multi-Tenancy

```typescript
// lib/db/extensions/tenant.ts
import { Prisma } from '@/lib/generated/prisma/client'

const TENANT_SCOPED_MODELS = [
  'Message', 'Event', 'BibleStudy', 'Video', 'DailyBread',
  'Speaker', 'Series', 'Ministry', 'Campus', 'MediaAsset',
  'Page', 'PageSection', 'Menu', 'MenuItem', 'SiteSettings',
  'Tag', 'Announcement', 'ContactSubmission', 'AuditLog',
  'ThemeCustomization',
]

export function tenantExtension(churchId: string) {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.where = { ...args.where, churchId, deletedAt: null }
          }
          return query(args)
        },
        async findFirst({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.where = { ...args.where, churchId, deletedAt: null }
          }
          return query(args)
        },
        async findUnique({ model, args, query }) {
          // SECURITY NOTE: findUnique can't add arbitrary where clauses.
          // Two mitigations are required:
          // 1. RLS at the database level (defense-in-depth) will block cross-tenant reads
          // 2. Application layer MUST validate churchId on the returned record:
          //    const result = await query(args);
          //    if (result && TENANT_SCOPED_MODELS.includes(model) && result.churchId !== churchId) {
          //      throw new Error('Tenant isolation violation');
          //    }
          // TODO: Consider converting findUnique to findFirst with churchId filter
          //       for tenant-scoped models to avoid this gap entirely.
          return query(args)
        },
        async create({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.data = { ...args.data, churchId }
          }
          return query(args)
        },
        async update({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.where = { ...args.where, churchId }
          }
          return query(args)
        },
        async delete({ model, args, query }) {
          // Convert to soft delete
          if (TENANT_SCOPED_MODELS.includes(model)) {
            return (query as any)({
              ...args,
              data: { deletedAt: new Date() },
            })
          }
          return query(args)
        },
      },
    },
  })
}
```

---

## 7. Seed Data Structure

For initial deployment and testing, the seed script should:

1. Create a default `Church` for LA UBF
2. Create `Speaker` records from existing mock data speaker names
3. Create `Series` records from derived series names
4. Create `Ministry` records from the current `MINISTRY_LABELS`
5. Create `Campus` records from the current `CAMPUS_LABELS`
6. Migrate all `MOCK_MESSAGES` → `Message` table
7. Migrate all `MOCK_EVENTS` → `Event` table
8. Migrate all `MOCK_BIBLE_STUDIES` → `BibleStudy` table
9. Migrate all `MOCK_VIDEOS` → `Video` table
10. Migrate `TODAYS_DAILY_BREAD` → `DailyBread` table

This ensures the transition from mock data to database is seamless.
