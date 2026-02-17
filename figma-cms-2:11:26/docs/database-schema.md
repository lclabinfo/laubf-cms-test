# Church CMS Database Schema Design
## Multi-Tenant PostgreSQL + Prisma Schema

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [Core Tables](#core-tables)
4. [Church Management](#church-management)
5. [People & Relationships](#people--relationships)
6. [Content Management](#content-management)
7. [Media Library](#media-library)
8. [Website Builder](#website-builder)
9. [Custom Content Types](#custom-content-types)
10. [Integrations](#integrations)
11. [Audit & History](#audit--history)
12. [Indexes & Performance](#indexes--performance)

---

## Overview

This database schema supports a multi-tenant Church CMS platform with integrated website builder. It is designed to:

- Support unlimited organizations (churches) with isolated data
- Enable flexible, church-specific custom content types
- Power a drag-and-drop website builder with reusable sections
- Integrate with external services (Google Photos, YouTube, Vimeo)
- Scale horizontally with proper indexing and partitioning strategies
- Maintain full audit trails for compliance and recovery

**Tech Stack:** PostgreSQL 14+, Prisma ORM, Multi-tenant Row-Level Security

---

## Architecture Principles

### 1. Multi-Tenancy Strategy
- **Row-Level Isolation**: All tenant-scoped tables include `organizationId`
- **Shared Schema**: Single database, multiple organizations
- **Data Isolation**: Enforced via application logic + database constraints

### 2. Flexibility via Custom Content Types
- `CustomEntityDefinition` table allows churches to define their own content models
- `CustomEntityData` stores JSON-based dynamic fields
- Pre-built modules (Events, Sermons, etc.) exist as first-class entities with full schema

### 3. Versioning & Audit
- Critical tables include `version`, `createdAt`, `updatedAt`, `deletedAt` (soft deletes)
- Separate audit log tables for compliance
- Change history for website content

### 4. Performance Considerations
- Composite indexes on `(organizationId, status, createdAt)`
- Partial indexes for soft-deleted records
- JSONB columns for flexible metadata with GIN indexes
- Read replicas for public-facing websites

---

## Core Tables

### Organizations (Churches)

**Table: `Organization`**

The root tenant entity. Each church is an organization.

```prisma
model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique // e.g., "la-ubf" for subdomain/routing
  type              String   @default("church") // church, ministry, network
  
  // Contact & Branding
  email             String?
  phone             String?
  website           String?
  address           String?
  city              String?
  state             String?
  country           String   @default("US")
  timezone          String   @default("America/Los_Angeles")
  logoUrl           String?
  primaryColor      String   @default("#3667b1")
  
  // Subscription & Features
  plan              String   @default("free") // free, basic, pro, enterprise
  features          Json     @default("{}") // Feature flags as JSON
  
  // Settings
  settings          Json     @default("{}") // Organization-specific settings
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime? // Soft delete
  
  // Relations
  users             User[]
  people            Person[]
  events            Event[]
  announcements     Announcement[]
  ministries        Ministry[]
  contentEntries    ContentEntry[]
  mediaSources      MediaSource[]
  websitePages      WebsitePage[]
  customDefinitions CustomEntityDefinition[]
  
  @@index([slug])
  @@index([deletedAt])
}
```

### Users & Authentication

**Table: `User`**

Staff and administrators who manage the CMS.

```prisma
model User {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Auth
  email             String   @unique
  passwordHash      String?  // Null if using OAuth only
  emailVerified     DateTime?
  
  // Profile
  firstName         String
  lastName          String
  avatarUrl         String?
  phone             String?
  
  // Authorization
  role              String   @default("member") // super_admin, admin, editor, contributor, member
  permissions       Json     @default("[]") // Fine-grained permissions array
  
  // Status
  status            String   @default("active") // active, suspended, invited
  lastLoginAt       DateTime?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAnnouncements Announcement[] @relation("AnnouncementAuthor")
  createdEvents     Event[] @relation("EventCreator")
  auditLogs         AuditLog[]
  
  @@index([organizationId, email])
  @@index([organizationId, status])
}
```

**Table: `Session`** (for JWT/session management)

```prisma
model Session {
  id             String   @id @default(cuid())
  userId         String
  token          String   @unique
  expiresAt      DateTime
  createdAt      DateTime @default(now())
  
  user           User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

---

## Church Management

### People & Relationships

**Table: `Person`**

Church members, attendees, contacts. Different from `User` (staff).

```prisma
model Person {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Basic Info
  firstName         String
  lastName          String
  email             String?
  phone             String?
  photoUrl          String?
  
  // Demographics (optional)
  birthdate         DateTime?
  gender            String? // male, female, other, prefer-not-to-say
  maritalStatus     String? // single, married, divorced, widowed
  
  // Address
  address           String?
  city              String?
  state             String?
  zipCode           String?
  
  // Church Status
  status            String   @default("active") // active, inactive, archived, visitor
  memberSince       DateTime?
  
  // Relationships (stored as JSON for flexibility)
  relationships     Json     @default("[]") // [{type: "spouse", personId: "..."}, {type: "child", personId: "..."}]
  
  // Notes
  notes             String?  @db.Text
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  roles             PersonRole[]
  groupMemberships  GroupMembership[]
  eventRegistrations EventRegistration[]
  ministryLeaderships MinistryLeader[]
  
  @@index([organizationId, status])
  @@index([organizationId, email])
  @@index([organizationId, lastName, firstName])
}
```

**Table: `Role`**

Roles that can be assigned to people (different from User roles).

```prisma
model Role {
  id                String   @id @default(cuid())
  organizationId    String
  
  name              String
  description       String?
  color             String   @default("#3b82f6") // For UI badges
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  personRoles       PersonRole[]
  
  @@unique([organizationId, name])
  @@index([organizationId])
}
```

**Table: `PersonRole`** (Many-to-Many junction)

```prisma
model PersonRole {
  id         String   @id @default(cuid())
  personId   String
  roleId     String
  assignedAt DateTime @default(now())
  
  person     Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  role       Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  
  @@unique([personId, roleId])
  @@index([personId])
  @@index([roleId])
}
```

**Table: `Group`**

Small groups, ministries, teams, classes, etc.

```prisma
model Group {
  id                String   @id @default(cuid())
  organizationId    String
  
  name              String
  description       String?  @db.Text
  category          String   @default("general") // community, serving, ministry, class
  
  // Meeting Info
  meetingDay        String?  // e.g., "Wednesday"
  meetingTime       String?  // e.g., "19:00"
  meetingLocation   String?
  
  // Settings
  isPublic          Boolean  @default(true)
  maxMembers        Int?
  imageUrl          String?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  memberships       GroupMembership[]
  
  @@index([organizationId, category])
}
```

**Table: `GroupMembership`** (Many-to-Many junction)

```prisma
model GroupMembership {
  id         String   @id @default(cuid())
  personId   String
  groupId    String
  role       String   @default("member") // leader, co-leader, member
  joinedAt   DateTime @default(now())
  
  person     Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  group      Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  
  @@unique([personId, groupId])
  @@index([groupId])
}
```

---

## Content Management

### Events

**Table: `Event`**

Church events, meetings, programs with support for recurrence.

```prisma
model Event {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Basic Info
  title             String
  description       String?  @db.Text
  type              String   @default("event") // event, meeting, program
  
  // Date & Time
  startDate         DateTime
  endDate           DateTime
  startTime         String   // Stored as "HH:mm" for timezone flexibility
  endTime           String
  isAllDay          Boolean  @default(false)
  
  // Recurrence
  recurrencePattern String   @default("none") // none, daily, weekly, monthly, yearly, custom
  recurrenceInterval Int     @default(1)
  recurrenceDays    Json     @default("[]") // [0,1,2,3,4,5,6] for days of week
  recurrenceEndDate DateTime?
  recurrenceEndCount Int?
  parentEventId     String?  // For recurring event instances
  
  // Location
  locationType      String   @default("in-person") // in-person, online, hybrid
  location          String?
  locationAddress   String?
  locationMapUrl    String?
  onlineUrl         String?  // Zoom, Google Meet, etc.
  
  // Content
  coverImageUrl     String?
  welcomeMessage    String?  @db.Text
  
  // Organization
  ministryId        String?
  contactPersonIds  Json     @default("[]") // Array of Person IDs
  
  // Settings
  status            String   @default("draft") // draft, published, archived
  isPinned          Boolean  @default(false)
  requiresRegistration Boolean @default(false)
  maxRegistrations  Int?
  registrationDeadline DateTime?
  
  // Stats
  viewCount         Int      @default(0)
  
  // Metadata
  createdById       String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  ministry          Ministry? @relation(fields: [ministryId], references: [id], onDelete: SetNull)
  createdBy         User @relation("EventCreator", fields: [createdById], references: [id])
  registrations     EventRegistration[]
  parentEvent       Event? @relation("RecurringEvents", fields: [parentEventId], references: [id])
  recurringInstances Event[] @relation("RecurringEvents")
  
  @@index([organizationId, status, startDate])
  @@index([organizationId, ministryId])
  @@index([startDate, endDate])
}
```

**Table: `EventRegistration`**

Track who registered for events.

```prisma
model EventRegistration {
  id                String   @id @default(cuid())
  eventId           String
  personId          String
  
  status            String   @default("registered") // registered, waitlisted, attended, cancelled
  registeredAt      DateTime @default(now())
  attendedAt        DateTime?
  
  // Custom Form Data
  formData          Json     @default("{}")
  
  event             Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  person            Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, personId])
  @@index([eventId, status])
}
```

### Announcements

**Table: `Announcement`**

Church-wide or ministry-specific announcements.

```prisma
model Announcement {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Content
  title             String
  content           String   @db.Text // Rich HTML content
  excerpt           String?  // Plain text summary
  
  // Classification
  category          String   @default("general") // general, urgent, news, event
  ministry          String?  // Ministry name or ID reference
  
  // Publishing
  status            String   @default("draft") // draft, scheduled, published, archived
  publishDate       DateTime @default(now())
  expiryDate        DateTime?
  
  // Display
  isPinned          Boolean  @default(false)
  showAuthor        Boolean  @default(true)
  
  // Author
  authorId          String
  authorName        String?  // Override display name
  
  // Media
  featuredImageUrl  String?
  
  // Stats
  viewCount         Int      @default(0)
  clickCount        Int      @default(0)
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  author            User @relation("AnnouncementAuthor", fields: [authorId], references: [id])
  attachments       AnnouncementAttachment[]
  emailLogs         AnnouncementEmail[]
  
  @@index([organizationId, status, publishDate])
  @@index([publishDate, expiryDate])
}
```

**Table: `AnnouncementAttachment`**

Files or links attached to announcements.

```prisma
model AnnouncementAttachment {
  id              String   @id @default(cuid())
  announcementId  String
  
  type            String   // file, link
  name            String
  url             String
  size            Int?     // In bytes
  mimeType        String?
  
  createdAt       DateTime @default(now())
  
  announcement    Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  
  @@index([announcementId])
}
```

**Table: `AnnouncementEmail`**

Track email sends for announcements.

```prisma
model AnnouncementEmail {
  id              String   @id @default(cuid())
  announcementId  String
  
  subject         String
  recipients      String   // Description like "All Members"
  recipientCount  Int
  recipientFilter Json     // Criteria used to filter recipients
  
  status          String   @default("scheduled") // scheduled, sent, failed
  scheduledFor    DateTime
  sentAt          DateTime?
  
  // Analytics
  openCount       Int      @default(0)
  clickCount      Int      @default(0)
  openRate        Float?   // Calculated percentage
  
  createdAt       DateTime @default(now())
  
  announcement    Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  
  @@index([announcementId])
  @@index([status, scheduledFor])
}
```

### Ministries

**Table: `Ministry`**

Campus ministries, departments, or organizational units.

```prisma
model Ministry {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Basic Info
  name              String
  slug              String   // URL-friendly identifier
  description       String?  @db.Text
  
  // Hero Section
  heroSubtitle      String?
  heroDescription   String?
  bannerImageUrl    String?
  
  // Status
  status            String   @default("published") // draft, published, archived
  
  // Stats
  memberCount       Int      @default(0)
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  meetings          MinistryMeeting[]
  leaders           MinistryLeader[]
  testimonials      MinistryTestimonial[]
  faqs              MinistryFAQ[]
  events            Event[]
  websitePage       WebsitePage? // One-to-one with ministry page
  
  @@unique([organizationId, slug])
  @@index([organizationId, status])
}
```

**Table: `MinistryMeeting`**

Regular meeting information for ministries.

```prisma
model MinistryMeeting {
  id              String   @id @default(cuid())
  ministryId      String
  
  label           String   // e.g., "Weekly Fellowship"
  day             String   // e.g., "Thursday"
  time            String   // e.g., "19:00"
  location        String
  type            String   @default("in-person") // in-person, online, hybrid
  mapUrl          String?
  onlineUrl       String?
  
  displayOrder    Int      @default(0)
  
  ministry        Ministry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  
  @@index([ministryId])
}
```

**Table: `MinistryLeader`**

Leaders associated with a ministry.

```prisma
model MinistryLeader {
  id              String   @id @default(cuid())
  ministryId      String
  personId        String
  
  role            String   // Campus Minister, President, Worship Leader, etc.
  bio             String?  @db.Text
  isContact       Boolean  @default(false)
  displayOrder    Int      @default(0)
  
  ministry        Ministry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  person          Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  
  @@index([ministryId])
}
```

**Table: `MinistryTestimonial`**

Testimonials/stories for ministry pages.

```prisma
model MinistryTestimonial {
  id              String   @id @default(cuid())
  ministryId      String
  
  author          String
  role            String?  // e.g., "Freshman"
  content         String   @db.Text
  imageUrl        String?
  
  displayOrder    Int      @default(0)
  isPublished     Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  
  ministry        Ministry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  
  @@index([ministryId, isPublished])
}
```

**Table: `MinistryFAQ`**

Frequently asked questions for ministries.

```prisma
model MinistryFAQ {
  id              String   @id @default(cuid())
  ministryId      String
  
  question        String
  answer          String   @db.Text
  displayOrder    Int      @default(0)
  
  ministry        Ministry @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  
  @@index([ministryId])
}
```

### Content Library (Sermons & Bible Studies)

**Table: `ContentEntry`**

Unified table for sermons, bible studies, and other teaching content.

```prisma
model ContentEntry {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Basic Info
  title             String
  type              String   @default("sermon") // sermon, study, devotional, article
  
  // Biblical Reference
  passage           String   // e.g., "John 3:16-21"
  book              String?  // Extracted for filtering
  
  // Speaker/Author
  speaker           String   // Name of speaker/author
  
  // Dates
  date              DateTime // Preached/published date
  
  // Series
  seriesIds         Json     @default("[]") // Array of Series IDs
  
  // Content
  description       String?  @db.Text
  
  // Media
  videoUrl          String?  // YouTube, Vimeo, etc.
  videoThumbnailUrl String?
  audioUrl          String?
  
  // Transcript
  transcript        String?  @db.Text
  hasTranscript     Boolean  @default(false)
  
  // Study Materials (for bible studies)
  studyTabs         Json     @default("[]") // [{id, title, content}]
  
  // Stats
  viewCount         Int      @default(0)
  downloadCount     Int      @default(0)
  
  // Status
  status            String   @default("draft") // draft, published, scheduled, archived
  isUpcoming        Boolean  @default(false)
  isFeatured        Boolean  @default(false)
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  attachments       ContentAttachment[]
  
  @@index([organizationId, status, date])
  @@index([organizationId, type, status])
  @@index([date])
}
```

**Table: `ContentSeries`**

Series/collections for content entries.

```prisma
model ContentSeries {
  id                String   @id @default(cuid())
  organizationId    String
  
  name              String
  description       String?  @db.Text
  imageUrl          String?
  
  displayOrder      Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId])
}
```

**Table: `ContentAttachment`**

PDFs, study guides, handouts attached to content.

```prisma
model ContentAttachment {
  id                String   @id @default(cuid())
  contentEntryId    String
  
  name              String
  url               String
  size              Int?     // In bytes
  type              String   // pdf, docx, etc.
  
  createdAt         DateTime @default(now())
  
  contentEntry      ContentEntry @relation(fields: [contentEntryId], references: [id], onDelete: Cascade)
  
  @@index([contentEntryId])
}
```

---

## Media Library

### Media Sources & Folders

**Table: `MediaSource`**

External media sources (Google Photos, local uploads, etc.)

```prisma
model MediaSource {
  id                String   @id @default(cuid())
  organizationId    String
  
  name              String
  type              String   // local, google_photos, google_drive
  
  // External Integration
  externalId        String?  // Google Album ID, Drive Folder ID
  externalUrl       String?
  
  // Sync Status
  status            String   @default("disconnected") // connected, disconnected, syncing, error
  lastSyncedAt      DateTime?
  syncError         String?
  
  // Metadata
  itemCount         Int      @default(0)
  coverImageUrl     String?
  
  // Settings
  isPublic          Boolean  @default(false)
  autoSync          Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  mediaItems        MediaItem[]
  
  @@index([organizationId, type])
  @@index([organizationId, status])
}
```

**Table: `MediaItem`**

Individual media items (photos, videos).

```prisma
model MediaItem {
  id                String   @id @default(cuid())
  organizationId    String
  sourceId          String
  
  // Media Details
  name              String
  originalName      String?
  type              String   // image, video
  mimeType          String   // image/jpeg, video/mp4
  
  // URLs
  url               String   // Primary display URL
  thumbnailUrl      String?
  originalUrl       String?  // Full resolution
  
  // File Info
  size              Int?     // In bytes
  width             Int?
  height            Int?
  duration          Int?     // For videos, in seconds
  
  // Video Specific
  videoProvider     String?  // youtube, vimeo, uploaded
  videoId           String?  // External video ID
  
  // Organization
  tags              Json     @default("[]")
  description       String?  @db.Text
  
  // External
  externalId        String?  // ID from Google Photos, etc.
  
  // Usage Tracking
  usageCount        Int      @default(0) // How many times used in content
  
  // Dates
  capturedAt        DateTime? // When photo/video was taken
  uploadedAt        DateTime @default(now())
  lastModified      DateTime @updatedAt
  
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  source            MediaSource @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  
  @@index([organizationId, type])
  @@index([sourceId])
  @@index([lastModified])
}
```

---

## Website Builder

### Pages & Navigation

**Table: `WebsitePage`**

Pages in the church website.

```prisma
model WebsitePage {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Basic Info
  title             String
  slug              String   // URL path
  type              String   @default("custom") // home, custom, ministry, blog, blank
  
  // Hierarchy
  parentId          String?  // For nested pages/folders
  isFolder          Boolean  @default(false)
  displayOrder      Int      @default(0)
  
  // Template
  templateId        String?  // Reference to page template
  
  // Ministry Link (if type = ministry)
  ministryId        String?  @unique
  
  // SEO
  metaTitle         String?
  metaDescription   String?
  ogImageUrl        String?
  
  // Settings
  status            String   @default("draft") // draft, published
  isPublished       Boolean  @default(false)
  requiresAuth      Boolean  @default(false)
  
  // Layout
  layoutVariant     String   @default("standard")
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  publishedAt       DateTime?
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  ministry          Ministry? @relation(fields: [ministryId], references: [id])
  parent            WebsitePage? @relation("PageHierarchy", fields: [parentId], references: [id])
  children          WebsitePage[] @relation("PageHierarchy")
  sections          PageSection[]
  versions          PageVersion[]
  
  @@unique([organizationId, slug])
  @@index([organizationId, status])
  @@index([organizationId, parentId, displayOrder])
}
```

**Table: `PageSection`**

Drag-and-drop sections that make up a page.

```prisma
model PageSection {
  id                String   @id @default(cuid())
  pageId            String
  
  // Section Type
  type              String   // hero, banner, features, content, gallery, cta, testimonials, custom
  
  // Content Data (stored as JSON for flexibility)
  data              Json     @default("{}")
  
  // Layout
  displayOrder      Int      @default(0)
  
  // Settings
  isVisible         Boolean  @default(true)
  backgroundColor   String?
  padding           String?  // CSS padding value
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  page              WebsitePage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  @@index([pageId, displayOrder])
}
```

**Table: `PageVersion`**

Version history for pages (for undo/redo and audit).

```prisma
model PageVersion {
  id                String   @id @default(cuid())
  pageId            String
  
  version           Int
  title             String
  slug              String
  sections          Json     // Snapshot of all sections
  
  // Author
  createdBy         String?  // User ID
  comment           String?
  
  createdAt         DateTime @default(now())
  
  page              WebsitePage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  @@index([pageId, version])
}
```

**Table: `Navigation`**

Website navigation menus.

```prisma
model Navigation {
  id                String   @id @default(cuid())
  organizationId    String
  
  name              String   // Header, Footer, Mobile, etc.
  type              String   @default("header") // header, footer, sidebar
  
  items             Json     @default("[]") // Array of menu items with hierarchy
  
  isActive          Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, name])
  @@index([organizationId, type])
}
```

### Themes & Templates

**Table: `Theme`**

Website themes and styling.

```prisma
model Theme {
  id                String   @id @default(cuid())
  organizationId    String?  // Null = global template
  
  name              String
  description       String?
  
  // Colors
  primaryColor      String   @default("#3667b1")
  secondaryColor    String   @default("#1e40af")
  accentColor       String   @default("#f59e0b")
  backgroundColor   String   @default("#ffffff")
  textColor         String   @default("#111827")
  
  // Typography
  fontHeading       String   @default("Inter")
  fontBody          String   @default("Inter")
  
  // Custom CSS
  customCss         String?  @db.Text
  
  // Settings
  isActive          Boolean  @default(false)
  isPublic          Boolean  @default(false) // Can other orgs use it?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@index([organizationId])
  @@index([isPublic])
}
```

**Table: `PageTemplate`**

Reusable page templates.

```prisma
model PageTemplate {
  id                String   @id @default(cuid())
  organizationId    String?  // Null = global template
  
  name              String
  description       String?
  category          String   @default("general") // home, ministry, blog, landing
  
  thumbnailUrl      String?
  
  // Template Structure
  sections          Json     @default("[]") // Array of section definitions
  
  isPublic          Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  
  @@index([organizationId])
  @@index([category, isPublic])
}
```

---

## Custom Content Types

**Table: `CustomEntityDefinition`**

Allows churches to define their own content types (e.g., "Bible Study Resources", "Mission Trips", etc.)

```prisma
model CustomEntityDefinition {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Entity Info
  name              String   // Singular name
  namePlural        String   // Plural name
  slug              String   // URL-friendly identifier
  icon              String?  // Icon identifier
  
  // Schema Definition
  fields            Json     // Array of field definitions with types
  /*
  Example fields JSON:
  [
    {
      "name": "title",
      "type": "text",
      "label": "Title",
      "required": true,
      "validation": {}
    },
    {
      "name": "startDate",
      "type": "date",
      "label": "Start Date",
      "required": true
    },
    {
      "name": "cost",
      "type": "number",
      "label": "Cost ($)",
      "required": false
    }
  ]
  */
  
  // UI Settings
  listViewFields    Json     @default("[]") // Which fields to show in list view
  sortField         String   @default("createdAt")
  sortDirection     String   @default("desc")
  
  // Permissions
  viewPermission    String   @default("member") // Who can view
  editPermission    String   @default("editor") // Who can edit
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  entities          CustomEntity[]
  
  @@unique([organizationId, slug])
  @@index([organizationId])
}
```

**Table: `CustomEntity`**

Instances of custom content types.

```prisma
model CustomEntity {
  id                String   @id @default(cuid())
  organizationId    String
  definitionId      String
  
  // Dynamic Data
  data              Json     // All custom fields stored as JSON
  /*
  Example data JSON:
  {
    "title": "Summer Mission Trip 2026",
    "startDate": "2026-07-15",
    "endDate": "2026-07-22",
    "location": "Mexico",
    "cost": 850,
    "description": "Join us for a week of...",
    "maxParticipants": 20
  }
  */
  
  // Status
  status            String   @default("draft") // draft, published, archived
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  definition        CustomEntityDefinition @relation(fields: [definitionId], references: [id], onDelete: Cascade)
  
  @@index([organizationId, definitionId, status])
  @@index([createdAt])
}
```

---

## Integrations

**Table: `Integration`**

External service integrations per organization.

```prisma
model Integration {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Integration Type
  provider          String   // google_photos, google_calendar, mailchimp, youtube, vimeo
  
  // Credentials (encrypted)
  credentials       Json     // Stored encrypted, contains tokens/API keys
  
  // Configuration
  settings          Json     @default("{}")
  
  // Status
  status            String   @default("active") // active, inactive, error
  lastSyncAt        DateTime?
  lastError         String?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  @@unique([organizationId, provider])
  @@index([organizationId, status])
}
```

---

## Audit & History

**Table: `AuditLog`**

Comprehensive audit trail for all important actions.

```prisma
model AuditLog {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Actor
  userId            String?
  userEmail         String?
  userIp            String?
  
  // Action
  action            String   // create, update, delete, publish, etc.
  entityType        String   // Event, Announcement, Person, etc.
  entityId          String
  
  // Changes
  oldValues         Json?
  newValues         Json?
  
  // Metadata
  timestamp         DateTime @default(now())
  
  user              User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  
  @@index([organizationId, entityType, entityId])
  @@index([organizationId, timestamp])
  @@index([userId])
}
```

**Table: `ActivityFeed`**

User-facing activity feed for dashboard.

```prisma
model ActivityFeed {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Activity
  type              String   // event_created, announcement_published, person_added
  title             String
  description       String?
  
  // Actor
  actorId           String?
  actorName         String
  
  // Linked Entity
  entityType        String?
  entityId          String?
  entityUrl         String?
  
  // Metadata
  timestamp         DateTime @default(now())
  
  @@index([organizationId, timestamp])
}
```

---

## Indexes & Performance

### Recommended Composite Indexes

```sql
-- Organizations
CREATE INDEX idx_org_slug_deleted ON "Organization"(slug, "deletedAt");

-- Users
CREATE INDEX idx_user_org_role ON "User"("organizationId", role, status);

-- People
CREATE INDEX idx_person_org_status_name ON "Person"("organizationId", status, "lastName", "firstName");
CREATE INDEX idx_person_org_email ON "Person"("organizationId", email) WHERE email IS NOT NULL;

-- Events
CREATE INDEX idx_event_org_date_status ON "Event"("organizationId", "startDate", status);
CREATE INDEX idx_event_recurring ON "Event"("parentEventId") WHERE "parentEventId" IS NOT NULL;

-- Announcements
CREATE INDEX idx_announcement_org_published ON "Announcement"("organizationId", "publishDate", status) 
  WHERE status = 'published' AND "deletedAt" IS NULL;

-- Media
CREATE INDEX idx_media_org_type_modified ON "MediaItem"("organizationId", type, "lastModified");

-- Website Pages
CREATE INDEX idx_page_org_slug ON "WebsitePage"("organizationId", slug);
CREATE INDEX idx_page_org_published ON "WebsitePage"("organizationId", "isPublished", "updatedAt")
  WHERE "isPublished" = true AND "deletedAt" IS NULL;

-- Custom Entities
CREATE INDEX idx_custom_entity_def_status ON "CustomEntity"("definitionId", status, "createdAt");
CREATE UNIQUE INDEX idx_custom_def_org_slug ON "CustomEntityDefinition"("organizationId", slug)
  WHERE "deletedAt" IS NULL;
```

### GIN Indexes for JSONB

```sql
-- For searching within JSON fields
CREATE INDEX idx_event_contact_persons ON "Event" USING GIN ("contactPersonIds");
CREATE INDEX idx_person_relationships ON "Person" USING GIN (relationships);
CREATE INDEX idx_media_tags ON "MediaItem" USING GIN (tags);
CREATE INDEX idx_custom_entity_data ON "CustomEntity" USING GIN (data);
```

### Partitioning Strategy (for large deployments)

For tables that grow very large (AuditLog, ActivityFeed, PageVersion):

```sql
-- Example: Partition AuditLog by month
CREATE TABLE "AuditLog" (
  -- columns as defined above
) PARTITION BY RANGE (timestamp);

CREATE TABLE "AuditLog_2026_01" PARTITION OF "AuditLog"
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE "AuditLog_2026_02" PARTITION OF "AuditLog"
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Create partitions programmatically each month
```

---

## Migration Strategy

### Phase 1: Core Foundation
1. Organizations, Users, Session
2. People, Roles, Groups

### Phase 2: Content
3. Events, Announcements
4. Ministries
5. Content Library (Sermons/Studies)

### Phase 3: Media & Website
6. Media Sources & Items
7. Website Pages & Sections
8. Navigation, Themes

### Phase 4: Advanced Features
9. Custom Entity Definitions & Entities
10. Integrations
11. Audit & Activity Logs

### Phase 5: Optimization
12. Add composite indexes
13. Enable Row-Level Security policies
14. Set up read replicas

---

## Security Considerations

### Row-Level Security (RLS)

Enable RLS on all tenant-scoped tables:

```sql
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event_org_isolation" ON "Event"
  USING ("organizationId" = current_setting('app.current_org_id')::text);
```

### Data Encryption

- Encrypt `Integration.credentials` at rest
- Use environment-specific encryption keys
- Rotate keys annually

### Soft Deletes

- All major entities use `deletedAt` for soft deletes
- Implement data retention policies
- Hard delete after 90 days (configurable per org)

---

## Scaling Considerations

### Horizontal Scaling
- Multi-region deployment with read replicas
- CDN for media assets
- Redis for session/cache layer

### Query Optimization
- Use connection pooling (PgBouncer)
- Implement query result caching
- Monitor slow queries with pg_stat_statements

### Data Archival
- Archive old events/announcements after 2 years
- Move to separate archive database
- Maintain foreign key integrity

---

## Example Prisma Schema File

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgcrypto, pg_trgm]
}

// Copy all models from above sections
// ...

```

---

## Conclusion

This database schema provides:

✅ **Multi-tenancy** with row-level isolation  
✅ **Flexibility** via custom content types and JSON fields  
✅ **Scalability** with proper indexing and partitioning strategies  
✅ **Rich features** for events, content, media, and website building  
✅ **Audit trails** for compliance and debugging  
✅ **Extensibility** for future integrations and modules  

This design can support hundreds of churches with thousands of users each, while remaining flexible enough to accommodate church-specific needs through custom entity definitions.

---

**Next Steps:**
1. Convert to actual Prisma schema file (`schema.prisma`)
2. Set up database migrations with Prisma Migrate
3. Implement seed data for development
4. Add RLS policies for production
5. Set up monitoring and query optimization

**Questions or Modifications?** This schema can be adjusted based on:
- Specific feature priorities
- Performance requirements
- Compliance needs (GDPR, COPPA, etc.)
- Integration requirements
