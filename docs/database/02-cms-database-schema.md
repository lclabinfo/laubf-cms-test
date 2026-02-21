# CMS Database Schema

## Complete Prisma Schema for CMS Content Tables

This document maps every field from the current TypeScript implementation to Prisma models, designed for multi-tenant operation across 1,000+ churches.

---

## 1. Tenant & Auth Layer

These tables exist at the platform level and underpin the entire multi-tenant system.

### Organization (Tenant)

```prisma
model Organization {
  id            String   @id @default(uuid()) @db.Uuid
  name          String                        // "LA UBF", "Grace Community Church"
  slug          String   @unique              // subdomain: "la-ubf" → la-ubf.digitalchurch.com
  customDomain  String?  @unique              // "laubf.org" (verified custom domain)

  // Branding
  logoUrl       String?                       // Organization logo
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
  status        OrgStatus @default(ACTIVE)
  plan          PlanTier  @default(STARTER)

  // Metadata
  settings      Json?    @db.JsonB            // Flexible org-level settings
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations (all content belongs to an org)
  members          OrganizationMember[]
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

enum OrgStatus {
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

  memberships     OrganizationMember[]
  sessions        Session[]

  @@index([email])
}
```

### OrganizationMember (User ↔ Org)

```prisma
model OrganizationMember {
  id        String     @id @default(uuid()) @db.Uuid
  orgId     String     @db.Uuid
  userId    String     @db.Uuid
  role      MemberRole @default(EDITOR)
  invitedAt DateTime?
  joinedAt  DateTime   @default(now())

  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([orgId, userId])
  @@index([orgId])
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
  orgId               String   @unique @db.Uuid
  stripeCustomerId    String?  @unique
  stripeSubscriptionId String? @unique
  plan                PlanTier
  status              SubStatus @default(ACTIVE)
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  cancelAtPeriodEnd   Boolean  @default(false)

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  organization        Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
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
  orgId         String       @db.Uuid
  domain        String       @unique              // "gracechurch.org"
  status        DomainStatus @default(PENDING)
  verificationToken String?                       // DNS TXT record value
  sslStatus     SslStatus    @default(PENDING)
  verifiedAt    DateTime?

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
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
  orgId       String   @db.Uuid
  name        String                            // "Mobile App Key"
  keyHash     String   @unique                  // SHA-256 hash (never store plaintext)
  keyPrefix   String                            // First 8 chars for identification: "dcp_abc1..."
  permissions String[]                          // ["messages:read", "events:read"]
  expiresAt   DateTime?
  lastUsedAt  DateTime?

  createdAt   DateTime @default(now())

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
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
  orgId     String   @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  messages     Message[]
  bibleStudies BibleStudy[]

  @@unique([orgId, slug])
  @@index([orgId, isActive])
  @@index([orgId, name])
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
  orgId       String   @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  messages     Message[]
  bibleStudies BibleStudy[]

  @@unique([orgId, slug])
  @@index([orgId, isActive])
  @@index([orgId, name])
}
```

### Ministry

Currently hardcoded as `MinistryTag` enum ("young-adult" | "adult" | "children" | "high-school" | "church-wide"). Each church has different ministries, so this must be a table.

```prisma
model Ministry {
  id          String   @id @default(uuid()) @db.Uuid
  orgId       String   @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  events       Event[]

  @@unique([orgId, slug])
  @@index([orgId, isActive])
}
```

### Campus

Currently hardcoded as `CampusTag` enum with 11 specific campuses. Each church has different campuses/locations.

```prisma
model Campus {
  id          String   @id @default(uuid()) @db.Uuid
  orgId       String   @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  events       Event[]

  @@unique([orgId, slug])
  @@index([orgId, isActive])
}
```

### Tag

Flexible tagging system that can be applied to any content type.

```prisma
model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  orgId     String   @db.Uuid
  name      String                              // "featured", "outreach"
  slug      String
  color     String?                             // Hex color

  createdAt DateTime @default(now())

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  contentTags  ContentTag[]

  @@unique([orgId, slug])
  @@index([orgId])
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

**Source**: `src/lib/types/message.ts` — `interface Message`

Every field from the current TypeScript `Message` type is mapped here, plus multi-tenant fields.

```prisma
model Message {
  id              String        @id @default(uuid()) @db.Uuid
  orgId           String        @db.Uuid
  slug            String                          // URL slug, unique per org
  title           String                          // "As The Spirit Gave Them Utterance"
  youtubeId       String?                         // YouTube video ID for embed
  speakerId       String?       @db.Uuid          // FK to Speaker (was: speaker string)
  seriesId        String?       @db.Uuid          // FK to Series (was: series string)
  passage         String?                         // "Acts 2:1-13" — Bible reference
  dateFor         DateTime      @db.Date          // The date this sermon is for (e.g., the Sunday)
  description     String?       @db.Text          // Short description/summary
  rawTranscript   String?       @db.Text          // HTML — prepared/edited transcript
  liveTranscript  String?       @db.Text          // HTML — auto-generated from audio
  duration        String?                         // "45:23" format
  thumbnailUrl    String?                         // Custom thumbnail (falls back to YouTube)
  audioUrl        String?                         // Standalone audio file URL
  status          ContentStatus @default(DRAFT)
  publishedAt     DateTime?                       // When first published

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
  organization    Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  speaker         Speaker?      @relation(fields: [speakerId], references: [id], onDelete: SetNull)
  series          Series?       @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  relatedStudy    BibleStudy?   @relation("MessageStudy", fields: [relatedStudyId], references: [id], onDelete: SetNull)

  // Search
  searchVector    Unsupported("tsvector")?

  @@unique([orgId, slug])
  @@index([orgId, dateFor(sort: Desc)])
  @@index([orgId, speakerId])
  @@index([orgId, seriesId])
  @@index([orgId, status])
  @@index([orgId, status, dateFor(sort: Desc)])
}

enum ContentStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}
```

### Event

**Source**: `src/lib/types/events.ts` — `interface Event`

The most complex content type. Supports one-time events, recurring meetings, and programs.

```prisma
model Event {
  id                String        @id @default(uuid()) @db.Uuid
  orgId             String        @db.Uuid
  slug              String                          // URL slug
  title             String                          // "Welcome Week Outreach"
  type              EventType                       // MEETING, EVENT, PROGRAM

  // Scheduling
  dateStart         DateTime      @db.Date          // Start date
  dateEnd           DateTime?     @db.Date          // End date (multi-day events)
  time              String?                         // "7:00 PM - 9:00 PM" (display string)
  timeStart         DateTime?     @db.Time          // Structured start time
  timeEnd           DateTime?     @db.Time          // Structured end time
  allDay            Boolean       @default(false)

  // Location
  location          String?                         // "LA UBF Center"
  address           String?                         // Full address for maps
  latitude          Decimal?      @db.Decimal(10, 8)
  longitude         Decimal?      @db.Decimal(11, 8)
  isOnline          Boolean       @default(false)
  meetingUrl        String?                         // Zoom/Google Meet URL

  // Content
  description       String?       @db.Text          // Short summary
  body              String?       @db.Text          // Rich HTML body
  imageUrl          String?                         // Event image
  imageAlt          String?
  imagePosition     String?                         // CSS object-position

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
  isRecurring       Boolean       @default(false)

  // Recurrence (only when isRecurring = true)
  recurrenceType    RecurrenceType?                 // DAILY, WEEKLY, BIWEEKLY, MONTHLY
  recurrenceDays    String[]                        // ["MON", "TUE", "WED", ...]
  recurrenceStart   DateTime?     @db.Date          // Recurrence window start
  recurrenceEnd     DateTime?     @db.Date          // Recurrence window end (null = indefinite)
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
  organization      Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  ministry          Ministry?     @relation(fields: [ministryId], references: [id], onDelete: SetNull)
  campus            Campus?       @relation(fields: [campusId], references: [id], onDelete: SetNull)
  eventLinks        EventLink[]

  @@unique([orgId, slug])
  @@index([orgId, dateStart])
  @@index([orgId, type])
  @@index([orgId, ministryId])
  @@index([orgId, campusId])
  @@index([orgId, status])
  @@index([orgId, isFeatured])
  @@index([orgId, isRecurring])
  @@index([orgId, status, dateStart])
  @@index([orgId, type, status, dateStart])
}

enum EventType {
  MEETING     // Recurring meetings (Daily Bread, Bible Study)
  EVENT       // One-time events (conferences, outreach)
  PROGRAM     // Ongoing programs (summer, semester)
}

enum RecurrenceType {
  DAILY
  WEEKLY
  BIWEEKLY
  MONTHLY
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

**Source**: `src/lib/types/bible-study.ts` — `interface BibleStudy`

```prisma
model BibleStudy {
  id               String        @id @default(uuid()) @db.Uuid
  orgId            String        @db.Uuid
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
  organization     Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)
  series           Series?       @relation(fields: [seriesId], references: [id], onDelete: SetNull)
  speaker          Speaker?      @relation(fields: [speakerId], references: [id], onDelete: SetNull)
  attachments      BibleStudyAttachment[]

  @@unique([orgId, slug])
  @@index([orgId, dateFor(sort: Desc)])
  @@index([orgId, book])
  @@index([orgId, seriesId])
  @@index([orgId, speakerId])
  @@index([orgId, status])
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

**Source**: `src/lib/types/bible-study.ts` — `interface BibleStudyAttachment`

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

**Source**: `src/lib/types/video.ts` — `interface Video`

```prisma
model Video {
  id            String        @id @default(uuid()) @db.Uuid
  orgId         String        @db.Uuid
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

  organization  Organization  @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([orgId, slug])
  @@index([orgId, datePublished(sort: Desc)])
  @@index([orgId, category])
  @@index([orgId, status])
  @@index([orgId, isShort])
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

**Source**: `src/lib/types/daily-bread.ts` — `interface DailyBread`

```prisma
model DailyBread {
  id          String        @id @default(uuid()) @db.Uuid
  orgId       String        @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@unique([orgId, slug])
  @@unique([orgId, date])                           // One devotional per day per org
  @@index([orgId, date(sort: Desc)])
  @@index([orgId, status])
}
```

### MediaAsset

Centralized media management for all uploaded files (images, PDFs, audio, video).

```prisma
model MediaAsset {
  id          String    @id @default(uuid()) @db.Uuid
  orgId       String    @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId, folder])
  @@index([orgId, mimeType])
  @@index([orgId, createdAt(sort: Desc)])
}
```

### Announcement

```prisma
model Announcement {
  id          String        @id @default(uuid()) @db.Uuid
  orgId       String        @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId, status, startDate])
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
  orgId       String   @db.Uuid
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

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId, isRead])
  @@index([orgId, formType])
  @@index([orgId, createdAt(sort: Desc)])
}
```

### AuditLog

```prisma
model AuditLog {
  id          String   @id @default(uuid()) @db.Uuid
  orgId       String   @db.Uuid
  userId      String?  @db.Uuid
  action      String                                // "CREATE", "UPDATE", "DELETE", "PUBLISH"
  entity      String                                // "Message", "Event", "BibleStudy"
  entityId    String?  @db.Uuid
  changes     Json?    @db.JsonB                    // { field: { old: X, new: Y } }
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId, createdAt(sort: Desc)])
  @@index([orgId, entity, entityId])
  @@index([orgId, userId])
}
```

---

## 4. Field Mapping Reference

This table maps every field from the current TypeScript interfaces to their database columns.

### Message Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | Auto-generated |
| `slug` | `slug` | `String` | Unique per org |
| `title` | `title` | `String` | — |
| `youtubeId` | `youtubeId` | `String?` | YouTube video ID |
| `speaker` | `speakerId` | `UUID? → Speaker` | **Normalized**: string → FK |
| `series` | `seriesId` | `UUID? → Series` | **Normalized**: string → FK |
| `passage` | `passage` | `String?` | Bible reference |
| `dateFor` | `dateFor` | `Date` | The sermon date |
| `description` | `description` | `Text?` | Short summary |
| `rawTranscript` | `rawTranscript` | `Text?` | Edited transcript HTML |
| `liveTranscript` | `liveTranscript` | `Text?` | Auto-generated HTML |
| `relatedStudyId` | `relatedStudyId` | `UUID? → BibleStudy` | Bidirectional link |
| `duration` | `duration` | `String?` | "45:23" format |
| — (new) | `orgId` | `UUID → Organization` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | DRAFT/PUBLISHED/etc. |
| — (new) | `thumbnailUrl` | `String?` | Custom thumbnail |
| — (new) | `audioUrl` | `String?` | Standalone audio |
| — (new) | `publishedAt` | `DateTime?` | Publication timestamp |
| — (new) | `viewCount` | `Int` | Analytics |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit timestamps |
| — (new) | `createdBy/updatedBy` | `UUID?` | Audit user refs |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### Event Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `slug` | `slug` | `String` | Unique per org |
| `title` | `title` | `String` | — |
| `type` | `type` | `EventType` | MEETING/EVENT/PROGRAM |
| `dateStart` | `dateStart` | `Date` | — |
| `dateEnd` | `dateEnd` | `Date?` | Multi-day events |
| `time` | `time` | `String?` | Display string "7:00 PM - 9:00 PM" |
| — (new) | `timeStart` | `Time?` | Structured time for sorting |
| — (new) | `timeEnd` | `Time?` | Structured end time |
| `location` | `location` | `String?` | — |
| `description` | `description` | `Text?` | Short summary |
| `body` | `body` | `Text?` | Rich HTML content |
| `image.src` | `imageUrl` | `String?` | **Flattened** from object |
| `image.alt` | `imageAlt` | `String?` | **Flattened** from object |
| `image.objectPosition` | `imagePosition` | `String?` | **Flattened** from object |
| `badge` | `badge` | `String?` | "UPCOMING", "FEATURED" |
| `tags` | via `ContentTag` | — | **Normalized** to join table |
| `ministry` | `ministryId` | `UUID? → Ministry` | **Normalized**: enum → FK |
| `campus` | `campusId` | `UUID? → Campus` | **Normalized**: enum → FK |
| `isRecurring` | `isRecurring` | `Boolean` | — |
| `meetingUrl` | `meetingUrl` | `String?` | Zoom/Google Meet |
| `registrationUrl` | `registrationUrl` | `String?` | External registration |
| `links` | `links` (JSONB) + `EventLink` | `Json?` | Both JSONB and normalized |
| `isFeatured` | `isFeatured` | `Boolean` | — |
| `recurrenceType` | `recurrenceType` | `RecurrenceType?` | — |
| `recurrenceDays` | `recurrenceDays` | `String[]` | ["MON", "WED", "FRI"] |
| `recurrenceStart` | `recurrenceStart` | `Date?` | — |
| `recurrenceEnd` | `recurrenceEnd` | `Date?` | — |
| `recurrenceSchedule` | `recurrenceSchedule` | `String?` | Pre-computed label |
| — (new) | `orgId` | `UUID → Organization` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | DRAFT/PUBLISHED/etc. |
| — (new) | `address` | `String?` | Full address for maps |
| — (new) | `latitude/longitude` | `Decimal?` | Geolocation |
| — (new) | `isOnline` | `Boolean` | Online event flag |
| — (new) | `allDay` | `Boolean` | All-day event |
| — (new) | `capacity` | `Int?` | Registration limit |
| — (new) | `publishedAt` | `DateTime?` | Publication time |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit timestamps |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### BibleStudy Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | — |
| `slug` | `slug` | `String` | Unique per org |
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
| — (new) | `orgId` | `UUID → Organization` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | DRAFT/PUBLISHED/etc. |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### Video Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | — |
| `slug` | `slug` | `String` | Unique per org |
| `title` | `title` | `String` | — |
| `youtubeId` | `youtubeId` | `String` | — |
| `category` | `category` | `VideoCategory` | Enum |
| `datePublished` | `datePublished` | `Date` | — |
| `duration` | `duration` | `String?` | "3:45" |
| `description` | `description` | `Text?` | — |
| `isShort` | `isShort` | `Boolean` | YouTube Shorts flag |
| — (new) | `orgId` | `UUID → Organization` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | — |
| — (new) | `thumbnailUrl` | `String?` | Custom thumbnail |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

### DailyBread Fields

| TypeScript Field | Prisma Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | `UUID` | — |
| `slug` | `slug` | `String` | Unique per org |
| `title` | `title` | `String` | — |
| `date` | `date` | `Date` | Unique per org per day |
| `passage` | `passage` | `String` | — |
| `keyVerse` | `keyVerse` | `String?` | Verse number(s) |
| `body` | `body` | `Text` | Rich HTML |
| `bibleText` | `bibleText` | `Text?` | Rich HTML |
| `author` | `author` | `String` | — |
| `tags` | via `ContentTag` | — | **Normalized** |
| `audioUrl` | `audioUrl` | `String?` | — |
| — (new) | `orgId` | `UUID → Organization` | **Multi-tenant key** |
| — (new) | `status` | `ContentStatus` | — |
| — (new) | `createdAt/updatedAt` | `DateTime` | Audit |
| — (new) | `deletedAt` | `DateTime?` | Soft delete |

---

## 5. Query Patterns

### Common CMS Queries and Their Index Usage

```sql
-- 1. List latest messages for a church (Messages page)
SELECT * FROM messages
WHERE org_id = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_for DESC
LIMIT 20;
-- Uses: idx_messages_org_status_date

-- 2. Get message by slug (Message detail page)
SELECT * FROM messages
WHERE org_id = ? AND slug = ?;
-- Uses: unique(org_id, slug)

-- 3. List messages by series
SELECT * FROM messages
WHERE org_id = ? AND series_id = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_for DESC;
-- Uses: idx_messages_org_series

-- 4. List upcoming events
SELECT * FROM events
WHERE org_id = ? AND status = 'PUBLISHED' AND date_start >= CURRENT_DATE AND deleted_at IS NULL
ORDER BY date_start ASC
LIMIT 10;
-- Uses: idx_events_org_status_date

-- 5. List events by ministry
SELECT * FROM events
WHERE org_id = ? AND ministry_id = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_start;
-- Uses: idx_events_org_ministry

-- 6. Get recurring meetings
SELECT * FROM events
WHERE org_id = ? AND is_recurring = TRUE AND status = 'PUBLISHED' AND deleted_at IS NULL;
-- Uses: idx_events_org_recurring

-- 7. Search messages (full-text)
SELECT * FROM messages
WHERE org_id = ? AND search_vector @@ plainto_tsquery('english', ?)
  AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY ts_rank(search_vector, plainto_tsquery('english', ?)) DESC;
-- Uses: GIN index on search_vector + idx on org_id

-- 8. Today's daily bread
SELECT * FROM daily_breads
WHERE org_id = ? AND date = CURRENT_DATE AND status = 'PUBLISHED';
-- Uses: unique(org_id, date)

-- 9. Bible studies by book
SELECT * FROM bible_studies
WHERE org_id = ? AND book = ? AND status = 'PUBLISHED' AND deleted_at IS NULL
ORDER BY date_for DESC;
-- Uses: idx_bible_studies_org_book
```

---

## 6. Prisma Middleware for Multi-Tenancy

```typescript
// prisma/extensions/tenant.ts
import { Prisma } from '@prisma/client'

const TENANT_SCOPED_MODELS = [
  'Message', 'Event', 'BibleStudy', 'Video', 'DailyBread',
  'Speaker', 'Series', 'Ministry', 'Campus', 'MediaAsset',
  'Page', 'PageSection', 'Menu', 'MenuItem', 'SiteSettings',
  'Tag', 'Announcement', 'ContactSubmission', 'AuditLog',
  'ThemeCustomization',
]

export function tenantExtension(orgId: string) {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.where = { ...args.where, orgId, deletedAt: null }
          }
          return query(args)
        },
        async findFirst({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.where = { ...args.where, orgId, deletedAt: null }
          }
          return query(args)
        },
        async findUnique({ model, args, query }) {
          // findUnique can't add arbitrary where clauses
          // Validate org_id in application layer after fetch
          return query(args)
        },
        async create({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.data = { ...args.data, orgId }
          }
          return query(args)
        },
        async update({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.includes(model)) {
            args.where = { ...args.where, orgId }
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

1. Create a default `Organization` for LA UBF
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
