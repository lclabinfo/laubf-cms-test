# 02. Database Schema

## Complete Database Design for Digital Church Platform

---

## 1. Database Overview

### Technology Choice
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.x
- **Hosting**: Neon / Supabase / AWS RDS

### Design Principles
1. **Multi-tenant by default**: All tables include `tenant_id`
2. **UUID primary keys**: For security and distribution
3. **Soft deletes**: `deleted_at` for recoverable data
4. **Audit trails**: `created_at`, `updated_at`, `created_by`
5. **Normalized design**: Minimize redundancy
6. **Indexed queries**: Optimize for common access patterns

---

## 2. Core Schema

### 2.1 Tenant & Platform Management

```prisma
// =====================================================
// TENANT & PLATFORM MANAGEMENT
// =====================================================

model Tenant {
  id            String    @id @default(uuid())
  subdomain     String    @unique
  domain        String?   @unique
  name          String
  description   String?   @db.Text
  logo          String?
  favicon       String?

  // Contact Information
  email         String?
  phone         String?
  address       String?   @db.Text
  city          String?
  state         String?
  zipCode       String?
  country       String    @default("US")
  timezone      String    @default("America/Chicago")

  // Status
  status        TenantStatus  @default(PENDING)
  onboardingStep Int          @default(0)

  // Subscription
  planId        String?   @map("plan_id")
  plan          Plan?     @relation(fields: [planId], references: [id])
  trialEndsAt   DateTime? @map("trial_ends_at")
  subscriptionType SubscriptionType @default(PLAN) @map("subscription_type")

  // Template
  templateId    String    @default("default") @map("template_id")

  // Social Links
  socialLinks   Json?     @map("social_links")
  // { facebook, instagram, twitter, youtube, tiktok }

  // Settings
  settings      Json?
  // { locale, dateFormat, currency, givingEnabled, etc }

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  users              User[]
  members            Member[]
  subscriptions      Subscription[]
  tenantModules      TenantModule[]
  menus              Menu[]
  pages              Page[]
  contentSections    ContentSection[]
  frontpageSections  FrontpageSection[]
  sermons            Sermon[]
  events             Event[]
  donations          Donation[]
  campaigns          Campaign[]
  ministries         Ministry[]
  groups             Group[]
  communications     Communication[]
  media              Media[]
  templateCustomizations TemplateCustomization[]

  // Additional Relations (Added for completeness)
  customDomains      CustomDomain[]
  auditLogs          AuditLog[]
  translations       Translation[]
  tenantLocales      TenantLocale[]
  aiShortClips       AIShortClip[]
  aiSocialContents   AISocialContent[]

  @@map("tenants")
  @@index([subdomain])
  @@index([domain])
  @@index([status])
}

enum TenantStatus {
  PENDING
  ACTIVE
  SUSPENDED
  CANCELLED
}

// Custom Domain Management for Tenant White-labeling
model CustomDomain {
  id                  String    @id @default(uuid())
  tenantId            String    @map("tenant_id")
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Domain Configuration
  domain              String    @unique
  isPrimary           Boolean   @default(false) @map("is_primary")

  // Verification
  verified            Boolean   @default(false)
  verificationToken   String    @map("verification_token")
  verificationMethod  VerificationMethod @default(DNS) @map("verification_method")
  verifiedAt          DateTime? @map("verified_at")

  // SSL/TLS
  sslStatus           SSLStatus @default(PENDING) @map("ssl_status")
  sslExpiresAt        DateTime? @map("ssl_expires_at")
  sslAutoRenew        Boolean   @default(true) @map("ssl_auto_renew")

  // Timestamps
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  @@map("custom_domains")
  @@index([tenantId])
  @@index([verified])
}

enum VerificationMethod {
  DNS       // TXT record verification
  HTTP      // File-based verification
  EMAIL     // Email verification
}

enum SSLStatus {
  PENDING
  PROVISIONING
  ACTIVE
  EXPIRED
  FAILED
}

// Internationalization / Multi-language Content Support
model Translation {
  id          String    @id @default(uuid())
  tenantId    String    @map("tenant_id")
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  // Entity Reference
  entityType  String    @map("entity_type")  // sermon, event, page, menu, etc.
  entityId    String    @map("entity_id")

  // Translation Data
  locale      String    // ISO 639-1 language code: ko, en, es, zh, etc.
  field       String    // title, description, content, etc.
  value       String    @db.Text

  // Metadata
  isAutoTranslated Boolean @default(false) @map("is_auto_translated")
  translatedBy     String? @map("translated_by")  // user_id or 'system'

  // Timestamps
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, entityType, entityId, locale, field])
  @@map("translations")
  @@index([tenantId])
  @@index([entityType, entityId])
  @@index([locale])
}

model Plan {
  id              String    @id @default(uuid())
  name            String
  slug            String    @unique
  description     String?   @db.Text

  // Pricing
  priceMonthly    Decimal   @map("price_monthly") @db.Decimal(10, 2)
  priceYearly     Decimal   @map("price_yearly") @db.Decimal(10, 2)
  stripePriceIdMonthly String? @map("stripe_price_id_monthly")
  stripePriceIdYearly  String? @map("stripe_price_id_yearly")

  // Limits (-1 for unlimited)
  maxUsers        Int       @default(10) @map("max_users")
  maxMembers      Int       @default(100) @map("max_members")
  maxStorageMB    Int       @default(5120) @map("max_storage_mb")
  maxSermons      Int       @default(50) @map("max_sermons")
  maxEvents       Int       @default(24) @map("max_events")
  maxPages        Int       @default(10) @map("max_pages")
  maxMinistries   Int       @default(5) @map("max_ministries")
  maxEmailsMonth  Int       @default(1000) @map("max_emails_month")
  maxSmsMonth     Int       @default(0) @map("max_sms_month")

  // Features
  customDomain      Boolean @default(false) @map("custom_domain")
  removeWatermark   Boolean @default(false) @map("remove_watermark")
  liveStreaming     Boolean @default(false) @map("live_streaming")
  mobileApp         Boolean @default(false) @map("mobile_app")
  apiAccess         Boolean @default(false) @map("api_access")
  analytics         Boolean @default(false)
  textToGive        Boolean @default(false) @map("text_to_give")
  childCheckin      Boolean @default(false) @map("child_checkin")
  cryptoGiving      Boolean @default(false) @map("crypto_giving")

  // Processing Fees
  processingFeePercent Decimal @default(3.0) @map("processing_fee_percent") @db.Decimal(4, 2)
  processingFeeFixed   Decimal @default(0.30) @map("processing_fee_fixed") @db.Decimal(10, 2)

  // Display
  isPopular       Boolean   @default(false) @map("is_popular")
  displayOrder    Int       @default(0) @map("display_order")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  deletedAt       DateTime? @map("deleted_at")

  // Relations
  tenants         Tenant[]
  subscriptions   Subscription[]
  features        PlanFeature[]

  @@map("plans")
  @@index([slug])
  @@index([displayOrder])
}

model PlanFeature {
  id          String  @id @default(uuid())
  planId      String  @map("plan_id")
  plan        Plan    @relation(fields: [planId], references: [id], onDelete: Cascade)
  feature     String
  description String?

  @@map("plan_features")
  @@index([planId])
}

model Subscription {
  id                String   @id @default(uuid())
  tenantId          String   @map("tenant_id")
  tenant            Tenant   @relation(fields: [tenantId], references: [id])
  planId            String   @map("plan_id")
  plan              Plan     @relation(fields: [planId], references: [id])

  // Stripe
  stripeSubscriptionId String? @unique @map("stripe_subscription_id")
  stripeCustomerId     String? @map("stripe_customer_id")

  // Billing
  status            SubscriptionStatus @default(ACTIVE)
  billingInterval   BillingInterval    @default(MONTHLY) @map("billing_interval")
  currentPeriodStart DateTime          @map("current_period_start")
  currentPeriodEnd   DateTime          @map("current_period_end")
  cancelAtPeriodEnd  Boolean           @default(false) @map("cancel_at_period_end")

  // Timestamps
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  cancelledAt       DateTime? @map("cancelled_at")

  // Relations
  payments          Payment[]

  @@map("subscriptions")
  @@index([tenantId])
  @@index([status])
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELLED
  PAUSED
  TRIALING
}

enum BillingInterval {
  MONTHLY
  YEARLY
}

model Payment {
  id              String   @id @default(uuid())
  subscriptionId  String   @map("subscription_id")
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])

  // Payment Details
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default("USD")
  status          PaymentStatus @default(PENDING)
  stripePaymentId String?  @map("stripe_payment_id")

  // Invoice
  invoiceNumber   String?  @map("invoice_number")
  invoiceUrl      String?  @map("invoice_url")

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  paidAt          DateTime? @map("paid_at")

  @@map("payments")
  @@index([subscriptionId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  REFUNDED
}
```

### 2.2 Users & Members

```prisma
// =====================================================
// USERS & MEMBERS
// =====================================================

model User {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Authentication
  email         String
  username      String
  password      String

  // Profile
  firstName     String?   @map("first_name")
  lastName      String?   @map("last_name")
  image         String?
  phone         String?

  // Role & Status
  role          UserRole  @default(MEMBER)
  status        UserStatus @default(ACTIVE)

  // Email Verification
  emailVerified DateTime? @map("email_verified")

  // Two-Factor Auth
  twoFactorEnabled Boolean @default(false) @map("two_factor_enabled")
  twoFactorSecret  String? @map("two_factor_secret")

  // Last Activity
  lastLoginAt   DateTime? @map("last_login_at")
  lastLoginIp   String?   @map("last_login_ip")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  member        Member?
  sessions      Session[]
  loginAttempts LoginAttempt[]
  passwordResets PasswordReset[]
  createdContent ContentSection[] @relation("ContentAuthor")
  createdSermons Sermon[]        @relation("SermonAuthor")
  createdEvents  Event[]         @relation("EventCreator")
  localePreference UserLocalePreference?

  @@unique([tenantId, email])
  @@unique([tenantId, username])
  @@map("users")
  @@index([tenantId])
  @@index([email])
  @@index([role])
}

enum UserRole {
  SUPERUSER
  ADMIN
  CONTENT_MANAGER
  MINISTRY_LEADER
  VOLUNTEER
  MEMBER
  GUEST
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model Session {
  id           String   @id @default(uuid())
  userId       String   @map("user_id")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessionToken String   @unique @map("session_token")
  expires      DateTime

  @@map("sessions")
  @@index([userId])
}

model LoginAttempt {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  email       String
  userId      String?  @map("user_id")
  user        User?    @relation(fields: [userId], references: [id])
  success     Boolean
  ipAddress   String   @map("ip_address")
  userAgent   String?  @map("user_agent")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("login_attempts")
  @@index([tenantId, email])
  @@index([createdAt])
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  used      Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@map("password_resets")
  @@index([token])
}

// Comprehensive Audit Logging for Security and Compliance
model AuditLog {
  id          String    @id @default(uuid())
  tenantId    String?   @map("tenant_id")
  tenant      Tenant?   @relation(fields: [tenantId], references: [id])
  userId      String?   @map("user_id")

  // Action Details
  action      AuditAction
  resource    String            // e.g., "user", "member", "donation"
  resourceId  String?   @map("resource_id")

  // Request Context
  ipAddress   String?   @map("ip_address")
  userAgent   String?   @map("user_agent")
  requestPath String?   @map("request_path")
  requestMethod String? @map("request_method")

  // Change Tracking
  oldValues   Json?     @map("old_values")
  newValues   Json?     @map("new_values")
  metadata    Json?                         // Additional context

  // Impersonation Tracking
  impersonatorId String? @map("impersonator_id")
  impersonatorType String? @map("impersonator_type") // 'platform_admin', 'support'

  // Status
  success     Boolean   @default(true)
  errorMessage String?  @map("error_message")

  // Timestamp
  createdAt   DateTime  @default(now()) @map("created_at")

  @@map("audit_logs")
  @@index([tenantId])
  @@index([userId])
  @@index([action])
  @@index([resource, resourceId])
  @@index([createdAt])
  @@index([impersonatorId])
}

enum AuditAction {
  // Authentication
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGE
  PASSWORD_RESET
  TWO_FACTOR_ENABLED
  TWO_FACTOR_DISABLED

  // User Management
  USER_CREATE
  USER_UPDATE
  USER_DELETE
  USER_ROLE_CHANGE
  USER_STATUS_CHANGE

  // Impersonation
  IMPERSONATION_START
  IMPERSONATION_END

  // Data Operations
  CREATE
  READ
  UPDATE
  DELETE
  BULK_CREATE
  BULK_UPDATE
  BULK_DELETE
  EXPORT

  // System
  SETTINGS_CHANGE
  MODULE_ACTIVATED
  MODULE_DEACTIVATED
  SUBSCRIPTION_CHANGE
  API_KEY_CREATED
  API_KEY_REVOKED
}

model Member {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  userId        String?   @unique @map("user_id")
  user          User?     @relation(fields: [userId], references: [id])

  // Personal Info
  firstName     String    @map("first_name")
  lastName      String    @map("last_name")
  email         String?
  phone         String?
  dateOfBirth   DateTime? @map("date_of_birth")
  gender        Gender?

  // Profile Photo
  photo         String?

  // Address
  address       String?   @db.Text
  city          String?
  state         String?
  zipCode       String?   @map("zip_code")
  country       String?

  // Church-Specific
  memberSince   DateTime? @map("member_since")
  baptismDate   DateTime? @map("baptism_date")
  status        MemberStatus @default(ACTIVE)
  memberNumber  String?   @map("member_number")

  // Family
  familyId      String?   @map("family_id")
  family        Family?   @relation(fields: [familyId], references: [id])
  familyRole    FamilyRole? @map("family_role")

  // Emergency Contact
  emergencyName  String?  @map("emergency_name")
  emergencyPhone String?  @map("emergency_phone")
  emergencyRelation String? @map("emergency_relation")

  // Custom Fields
  customFields  Json?     @map("custom_fields")

  // Notes (private to staff)
  notes         String?   @db.Text

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")

  // Relations
  donations     Donation[]
  eventRegistrations EventRegistration[]
  groupMemberships GroupMembership[]
  ministryAssignments MinistryMember[]
  attendances   Attendance[]
  checkins      Checkin[]
  communications CommunicationRecipient[]

  @@unique([tenantId, email])
  @@map("members")
  @@index([tenantId])
  @@index([lastName, firstName])
  @@index([status])
}

enum Gender {
  MALE
  FEMALE
  OTHER
  PREFER_NOT_TO_SAY
}

enum MemberStatus {
  PROSPECT
  ACTIVE
  INACTIVE
  TRANSFERRED
  DECEASED
}

enum FamilyRole {
  HEAD
  SPOUSE
  CHILD
  RELATIVE
  OTHER
}

model Family {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  name          String
  address       String?   @db.Text
  phone         String?
  email         String?

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  members       Member[]

  @@map("families")
  @@index([tenantId])
}
```

### 2.3 Content Management

```prisma
// =====================================================
// CONTENT MANAGEMENT (CMS)
// =====================================================

model Menu {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  parentId      String?   @map("parent_id")
  parent        Menu?     @relation("MenuHierarchy", fields: [parentId], references: [id])
  children      Menu[]    @relation("MenuHierarchy")

  // Menu Item
  title         String
  slug          String
  menuType      MenuType  @default(PAGE)
  url           String?
  icon          String?
  headerImage   String?   @map("header_image")
  description   String?   @db.Text

  // Display
  sortOrder     Int       @default(0) @map("sort_order")
  isVisible     Boolean   @default(true) @map("is_visible")
  openInNewTab  Boolean   @default(false) @map("open_in_new_tab")
  cssClass      String?   @map("css_class")

  // Template Settings
  templateVariant String? @map("template_variant")

  // Metadata
  metadata      Json?

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  page          Page?
  contentSections ContentSection[]

  @@unique([tenantId, slug])
  @@map("menus")
  @@index([tenantId, parentId, sortOrder])
}

enum MenuType {
  PAGE
  DROPDOWN
  EXTERNAL_LINK
  MINISTRY_PAGE
  SYSTEM_PAGE
  DIVIDER
}

model Page {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  menuId        String?   @unique @map("menu_id")
  menu          Menu?     @relation(fields: [menuId], references: [id])

  // Page Content
  title         String
  slug          String
  excerpt       String?   @db.Text
  content       String?   @db.Text
  featuredImage String?   @map("featured_image")

  // SEO
  metaTitle     String?   @map("meta_title")
  metaDescription String? @map("meta_description") @db.Text
  metaKeywords  String?   @map("meta_keywords")

  // Status
  status        PageStatus @default(DRAFT)
  publishedAt   DateTime? @map("published_at")

  // Template
  template      String?
  templateVariant String? @map("template_variant")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  sections      PageSection[]

  @@unique([tenantId, slug])
  @@map("pages")
  @@index([tenantId])
  @@index([status])
}

enum PageStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model PageSection {
  id            String    @id @default(uuid())
  pageId        String    @map("page_id")
  page          Page      @relation(fields: [pageId], references: [id], onDelete: Cascade)

  // Section Configuration
  sectionType   String    @map("section_type")
  title         String?
  subtitle      String?
  content       Json?
  settings      Json?

  // Display
  sortOrder     Int       @default(0) @map("sort_order")
  isVisible     Boolean   @default(true) @map("is_visible")

  // Template
  variant       String?
  cssClass      String?   @map("css_class")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("page_sections")
  @@index([pageId, sortOrder])
}

model ContentSection {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  menuId        String?   @map("menu_id")
  menu          Menu?     @relation(fields: [menuId], references: [id])

  // Section Configuration
  sectionType   String    @map("section_type")
  title         String?
  subtitle      String?
  content       Json?
  settings      Json?

  // Display
  sortOrder     Int       @default(0) @map("sort_order")
  isVisible     Boolean   @default(true) @map("is_visible")

  // Template
  variant       String?
  cssClass      String?   @map("css_class")

  // Author
  authorId      String?   @map("author_id")
  author        User?     @relation("ContentAuthor", fields: [authorId], references: [id])

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("content_sections")
  @@index([tenantId, menuId, sortOrder])
}

model FrontpageSection {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Section Configuration
  sectionType   String    @map("section_type")
  title         String?
  subtitle      String?
  content       Json?
  settings      Json?

  // Display
  sortOrder     Int       @default(0) @map("sort_order")
  isVisible     Boolean   @default(true) @map("is_visible")

  // Template
  variant       String?
  cssClass      String?   @map("css_class")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("frontpage_sections")
  @@index([tenantId, sortOrder])
}
```

### 2.4 Sermons & Media

```prisma
// =====================================================
// SERMONS & MEDIA
// =====================================================

model Sermon {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Sermon Info
  title         String
  slug          String
  description   String?   @db.Text
  scripture     String?
  speaker       String?

  // Date
  date          DateTime
  duration      Int?      // in seconds

  // Media
  videoUrl      String?   @map("video_url")
  audioUrl      String?   @map("audio_url")
  thumbnail     String?

  // Attachments
  notesUrl      String?   @map("notes_url")
  outlineUrl    String?   @map("outline_url")

  // Series
  seriesId      String?   @map("series_id")
  series        SermonSeries? @relation(fields: [seriesId], references: [id])
  seriesOrder   Int?      @map("series_order")

  // Categories & Tags
  categories    SermonCategory[]
  tags          String[]

  // Status
  status        SermonStatus @default(DRAFT)
  featuredOrder Int?      @map("featured_order")

  // Engagement
  viewCount     Int       @default(0) @map("view_count")

  // Author
  authorId      String?   @map("author_id")
  author        User?     @relation("SermonAuthor", fields: [authorId], references: [id])

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  publishedAt   DateTime? @map("published_at")

  @@unique([tenantId, slug])
  @@map("sermons")
  @@index([tenantId])
  @@index([date])
  @@index([status])
}

enum SermonStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model SermonSeries {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  title         String
  slug          String
  description   String?   @db.Text
  thumbnail     String?
  startDate     DateTime? @map("start_date")
  endDate       DateTime? @map("end_date")
  isActive      Boolean   @default(true) @map("is_active")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  sermons       Sermon[]

  @@unique([tenantId, slug])
  @@map("sermon_series")
  @@index([tenantId])
}

model SermonCategory {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  name          String
  slug          String
  description   String?
  sortOrder     Int       @default(0) @map("sort_order")

  // Relations
  sermons       Sermon[]

  @@unique([tenantId, slug])
  @@map("sermon_categories")
  @@index([tenantId])
}

model Media {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // File Info
  filename      String
  originalName  String    @map("original_name")
  mimeType      String    @map("mime_type")
  size          Int       // bytes
  url           String
  thumbnailUrl  String?   @map("thumbnail_url")

  // Metadata
  width         Int?
  height        Int?
  duration      Int?      // for video/audio
  alt           String?
  caption       String?

  // Organization
  folderId      String?   @map("folder_id")
  folder        MediaFolder? @relation(fields: [folderId], references: [id])

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("media")
  @@index([tenantId])
  @@index([mimeType])
}

model MediaFolder {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  parentId      String?   @map("parent_id")
  parent        MediaFolder? @relation("FolderHierarchy", fields: [parentId], references: [id])
  children      MediaFolder[] @relation("FolderHierarchy")
  name          String

  // Relations
  media         Media[]

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")

  @@map("media_folders")
  @@index([tenantId, parentId])
}
```

### 2.5 Events & Calendar

```prisma
// =====================================================
// EVENTS & CALENDAR
// =====================================================

model Event {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Event Info
  title         String
  slug          String
  description   String?   @db.Text
  shortDescription String? @map("short_description")

  // Dates
  startDate     DateTime  @map("start_date")
  endDate       DateTime  @map("end_date")
  allDay        Boolean   @default(false) @map("all_day")
  timezone      String    @default("America/Chicago")

  // Recurrence
  isRecurring   Boolean   @default(false) @map("is_recurring")
  recurrenceRule String?  @map("recurrence_rule") // RRULE format
  recurrenceEnd DateTime? @map("recurrence_end")
  parentEventId String?   @map("parent_event_id")

  // Location
  locationType  LocationType @default(IN_PERSON) @map("location_type")
  location      String?
  address       String?   @db.Text
  onlineUrl     String?   @map("online_url")
  coordinates   Json?     // { lat, lng }

  // Media
  featuredImage String?   @map("featured_image")
  images        String[]

  // Registration
  registrationEnabled Boolean @default(false) @map("registration_enabled")
  maxCapacity   Int?      @map("max_capacity")
  currentCount  Int       @default(0) @map("current_count")
  registrationDeadline DateTime? @map("registration_deadline")
  registrationFee Decimal? @map("registration_fee") @db.Decimal(10, 2)

  // Child Check-in
  checkinEnabled Boolean  @default(false) @map("checkin_enabled")
  checkinStartBefore Int? @map("checkin_start_before") // minutes

  // Ministry/Category
  ministryId    String?   @map("ministry_id")
  ministry      Ministry? @relation(fields: [ministryId], references: [id])
  categoryId    String?   @map("category_id")
  category      EventCategory? @relation(fields: [categoryId], references: [id])

  // Status
  status        EventStatus @default(DRAFT)
  isFeatured    Boolean   @default(false) @map("is_featured")
  visibility    EventVisibility @default(PUBLIC)

  // Author
  creatorId     String?   @map("creator_id")
  creator       User?     @relation("EventCreator", fields: [creatorId], references: [id])

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  publishedAt   DateTime? @map("published_at")

  // Relations
  registrations EventRegistration[]
  checkins      Checkin[]
  attendances   Attendance[]

  @@unique([tenantId, slug])
  @@map("events")
  @@index([tenantId])
  @@index([startDate])
  @@index([status])
}

enum LocationType {
  IN_PERSON
  ONLINE
  HYBRID
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
}

enum EventVisibility {
  PUBLIC
  MEMBERS_ONLY
  PRIVATE
}

model EventCategory {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  name          String
  slug          String
  color         String?

  // Relations
  events        Event[]

  @@unique([tenantId, slug])
  @@map("event_categories")
  @@index([tenantId])
}

model EventRegistration {
  id            String    @id @default(uuid())
  eventId       String    @map("event_id")
  event         Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  memberId      String?   @map("member_id")
  member        Member?   @relation(fields: [memberId], references: [id])

  // Guest Info (if not member)
  guestName     String?   @map("guest_name")
  guestEmail    String?   @map("guest_email")
  guestPhone    String?   @map("guest_phone")

  // Registration
  numGuests     Int       @default(1) @map("num_guests")
  guestNames    String[]  @map("guest_names")
  notes         String?   @db.Text

  // Payment
  amountPaid    Decimal?  @map("amount_paid") @db.Decimal(10, 2)
  paymentStatus PaymentStatus? @map("payment_status")

  // Status
  status        RegistrationStatus @default(CONFIRMED)
  checkedIn     Boolean   @default(false) @map("checked_in")
  checkedInAt   DateTime? @map("checked_in_at")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("event_registrations")
  @@index([eventId])
  @@index([memberId])
}

enum RegistrationStatus {
  PENDING
  CONFIRMED
  WAITLIST
  CANCELLED
}

model Checkin {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  eventId       String    @map("event_id")
  event         Event     @relation(fields: [eventId], references: [id])
  memberId      String    @map("member_id")
  member        Member    @relation(fields: [memberId], references: [id])

  // Check-in Details
  checkinTime   DateTime  @default(now()) @map("checkin_time")
  checkoutTime  DateTime? @map("checkout_time")

  // Location/Room
  room          String?
  checkinCode   String?   @map("checkin_code")
  securityCode  String?   @map("security_code")

  // Checked in by
  checkedInBy   String?   @map("checked_in_by")

  @@map("checkins")
  @@index([tenantId, eventId])
  @@index([memberId])
  @@index([checkinTime])
}

model Attendance {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  eventId       String    @map("event_id")
  event         Event     @relation(fields: [eventId], references: [id])
  memberId      String    @map("member_id")
  member        Member    @relation(fields: [memberId], references: [id])

  // Attendance
  date          DateTime
  present       Boolean   @default(true)
  notes         String?

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")

  @@unique([eventId, memberId, date])
  @@map("attendances")
  @@index([tenantId])
  @@index([memberId])
  @@index([date])
}
```

### 2.6 Giving & Donations

```prisma
// =====================================================
// GIVING & DONATIONS
// =====================================================

model Donation {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  memberId      String?   @map("member_id")
  member        Member?   @relation(fields: [memberId], references: [id])

  // Donor Info (for non-members)
  donorName     String?   @map("donor_name")
  donorEmail    String?   @map("donor_email")
  donorPhone    String?   @map("donor_phone")
  donorAddress  String?   @map("donor_address") @db.Text
  isAnonymous   Boolean   @default(false) @map("is_anonymous")

  // Amount
  amount        Decimal   @db.Decimal(10, 2)
  currency      String    @default("USD")
  feeAmount     Decimal?  @map("fee_amount") @db.Decimal(10, 2)
  netAmount     Decimal?  @map("net_amount") @db.Decimal(10, 2)
  feeCoveredByDonor Boolean @default(false) @map("fee_covered_by_donor")

  // Fund Designation
  fundId        String?   @map("fund_id")
  fund          Fund?     @relation(fields: [fundId], references: [id])
  campaignId    String?   @map("campaign_id")
  campaign      Campaign? @relation(fields: [campaignId], references: [id])

  // Payment
  paymentMethod PaymentMethod @map("payment_method")
  stripePaymentIntentId String? @map("stripe_payment_intent_id")
  stripeChargeId String?  @map("stripe_charge_id")

  // Recurring
  isRecurring   Boolean   @default(false) @map("is_recurring")
  recurringId   String?   @map("recurring_id")
  recurring     RecurringDonation? @relation(fields: [recurringId], references: [id])

  // Status
  status        DonationStatus @default(PENDING)

  // Source
  source        DonationSource @default(ONLINE)
  notes         String?   @db.Text

  // Tax Receipt
  receiptSent   Boolean   @default(false) @map("receipt_sent")
  receiptNumber String?   @map("receipt_number")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  processedAt   DateTime? @map("processed_at")

  @@map("donations")
  @@index([tenantId])
  @@index([memberId])
  @@index([createdAt])
  @@index([status])
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  ACH_BANK
  APPLE_PAY
  GOOGLE_PAY
  TEXT_TO_GIVE
  CASH
  CHECK
  CRYPTO
  STOCK
  OTHER
}

enum DonationStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum DonationSource {
  ONLINE
  MOBILE_APP
  TEXT
  KIOSK
  IN_PERSON
  MAIL
  TRANSFER
}

model Fund {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  name          String
  slug          String
  description   String?   @db.Text
  isDefault     Boolean   @default(false) @map("is_default")
  isActive      Boolean   @default(true) @map("is_active")
  sortOrder     Int       @default(0) @map("sort_order")

  // Goal
  goalAmount    Decimal?  @map("goal_amount") @db.Decimal(10, 2)
  currentAmount Decimal   @default(0) @map("current_amount") @db.Decimal(10, 2)

  // Relations
  donations     Donation[]

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, slug])
  @@map("funds")
  @@index([tenantId])
}

model Campaign {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Campaign Info
  name          String
  slug          String
  description   String?   @db.Text

  // Goal
  goalAmount    Decimal   @map("goal_amount") @db.Decimal(10, 2)
  currentAmount Decimal   @default(0) @map("current_amount") @db.Decimal(10, 2)

  // Dates
  startDate     DateTime  @map("start_date")
  endDate       DateTime? @map("end_date")

  // Media
  featuredImage String?   @map("featured_image")
  videoUrl      String?   @map("video_url")

  // Status
  isActive      Boolean   @default(true) @map("is_active")
  isFeatured    Boolean   @default(false) @map("is_featured")

  // Relations
  donations     Donation[]

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, slug])
  @@map("campaigns")
  @@index([tenantId])
  @@index([isActive])
}

model RecurringDonation {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  memberId      String    @map("member_id")
  fundId        String?   @map("fund_id")

  // Amount
  amount        Decimal   @db.Decimal(10, 2)
  currency      String    @default("USD")

  // Schedule
  frequency     RecurringFrequency
  dayOfMonth    Int?      @map("day_of_month")
  dayOfWeek     Int?      @map("day_of_week")

  // Stripe
  stripeSubscriptionId String? @unique @map("stripe_subscription_id")

  // Status
  status        RecurringStatus @default(ACTIVE)
  nextPaymentDate DateTime? @map("next_payment_date")

  // Relations
  donations     Donation[]

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  cancelledAt   DateTime? @map("cancelled_at")

  @@map("recurring_donations")
  @@index([tenantId])
  @@index([memberId])
  @@index([status])
}

enum RecurringFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
  QUARTERLY
  ANNUALLY
}

enum RecurringStatus {
  ACTIVE
  PAUSED
  CANCELLED
  FAILED
}
```

### 2.7 Groups & Ministries

```prisma
// =====================================================
// GROUPS & MINISTRIES
// =====================================================

model Ministry {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Ministry Info
  name          String
  slug          String
  description   String?   @db.Text
  shortDescription String? @map("short_description")

  // Media
  image         String?
  icon          String?

  // Contact
  email         String?
  phone         String?

  // Status
  isActive      Boolean   @default(true) @map("is_active")
  sortOrder     Int       @default(0) @map("sort_order")

  // Relations
  members       MinistryMember[]
  events        Event[]
  groups        Group[]

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, slug])
  @@map("ministries")
  @@index([tenantId])
}

model MinistryMember {
  id            String    @id @default(uuid())
  ministryId    String    @map("ministry_id")
  ministry      Ministry  @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  memberId      String    @map("member_id")
  member        Member    @relation(fields: [memberId], references: [id])

  // Role
  role          MinistryRole @default(MEMBER)
  title         String?

  // Dates
  joinedAt      DateTime  @default(now()) @map("joined_at")
  leftAt        DateTime? @map("left_at")

  @@unique([ministryId, memberId])
  @@map("ministry_members")
  @@index([ministryId])
  @@index([memberId])
}

enum MinistryRole {
  LEADER
  COORDINATOR
  VOLUNTEER
  MEMBER
}

model Group {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Group Info
  name          String
  slug          String
  description   String?   @db.Text
  groupType     GroupType @default(SMALL_GROUP) @map("group_type")

  // Schedule
  meetingDay    String?   @map("meeting_day")
  meetingTime   String?   @map("meeting_time")
  meetingFrequency String? @map("meeting_frequency")

  // Location
  locationType  LocationType @default(IN_PERSON) @map("location_type")
  location      String?
  address       String?   @db.Text
  onlineUrl     String?   @map("online_url")

  // Media
  image         String?

  // Ministry Association
  ministryId    String?   @map("ministry_id")
  ministry      Ministry? @relation(fields: [ministryId], references: [id])

  // Capacity
  maxMembers    Int?      @map("max_members")
  isOpenForRegistration Boolean @default(true) @map("is_open_for_registration")

  // Status
  isActive      Boolean   @default(true) @map("is_active")

  // Relations
  members       GroupMembership[]

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, slug])
  @@map("groups")
  @@index([tenantId])
  @@index([groupType])
}

enum GroupType {
  SMALL_GROUP
  BIBLE_STUDY
  PRAYER_GROUP
  SUPPORT_GROUP
  SERVICE_TEAM
  CLASS
  OTHER
}

model GroupMembership {
  id            String    @id @default(uuid())
  groupId       String    @map("group_id")
  group         Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  memberId      String    @map("member_id")
  member        Member    @relation(fields: [memberId], references: [id])

  // Role
  role          GroupRole @default(MEMBER)

  // Dates
  joinedAt      DateTime  @default(now()) @map("joined_at")
  leftAt        DateTime? @map("left_at")

  @@unique([groupId, memberId])
  @@map("group_memberships")
  @@index([groupId])
  @@index([memberId])
}

enum GroupRole {
  LEADER
  CO_LEADER
  HOST
  MEMBER
}
```

### 2.8 Communication

```prisma
// =====================================================
// COMMUNICATION
// =====================================================

model Communication {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])

  // Communication Details
  type          CommunicationType
  subject       String?
  content       String    @db.Text
  htmlContent   String?   @map("html_content") @db.Text

  // Scheduling
  scheduledFor  DateTime? @map("scheduled_for")
  sentAt        DateTime? @map("sent_at")

  // Status
  status        CommunicationStatus @default(DRAFT)

  // Analytics
  totalRecipients Int     @default(0) @map("total_recipients")
  delivered     Int       @default(0)
  opened        Int       @default(0)
  clicked       Int       @default(0)
  bounced       Int       @default(0)
  unsubscribed  Int       @default(0)

  // Relations
  recipients    CommunicationRecipient[]

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("communications")
  @@index([tenantId])
  @@index([status])
  @@index([scheduledFor])
}

enum CommunicationType {
  EMAIL
  SMS
  PUSH_NOTIFICATION
}

enum CommunicationStatus {
  DRAFT
  SCHEDULED
  SENDING
  SENT
  FAILED
  CANCELLED
}

model CommunicationRecipient {
  id              String    @id @default(uuid())
  communicationId String    @map("communication_id")
  communication   Communication @relation(fields: [communicationId], references: [id], onDelete: Cascade)
  memberId        String?   @map("member_id")
  member          Member?   @relation(fields: [memberId], references: [id])

  // Contact Info (if not member)
  email           String?
  phone           String?

  // Status
  status          DeliveryStatus @default(PENDING)
  deliveredAt     DateTime? @map("delivered_at")
  openedAt        DateTime? @map("opened_at")
  clickedAt       DateTime? @map("clicked_at")
  bouncedAt       DateTime? @map("bounced_at")

  // Metadata
  errorMessage    String?   @map("error_message")

  @@map("communication_recipients")
  @@index([communicationId])
  @@index([memberId])
}

enum DeliveryStatus {
  PENDING
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
  UNSUBSCRIBED
}
```

### 2.9 Template System

```prisma
// =====================================================
// TEMPLATE SYSTEM
// =====================================================

model TemplateCustomization {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  tenant        Tenant    @relation(fields: [tenantId], references: [id])
  templateId    String    @map("template_id")

  // Customizations
  customizations Json
  // {
  //   theme: { colors, fonts, borderRadius },
  //   layouts: { header, footer, sidebar },
  //   sections: { ... },
  //   custom: { ... }
  // }

  // Status
  isActive      Boolean   @default(true) @map("is_active")

  // Version Control
  version       Int       @default(1)
  previousVersion String? @map("previous_version")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, templateId])
  @@map("template_customizations")
  @@index([tenantId])
}

model TemplateCustomizationHistory {
  id            String    @id @default(uuid())
  tenantId      String    @map("tenant_id")
  templateId    String    @map("template_id")

  // Snapshot
  customizations Json
  version       Int

  // Change Info
  changedBy     String    @map("changed_by")
  changeNote    String?   @map("change_note")

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")

  @@map("template_customization_history")
  @@index([tenantId, templateId])
  @@index([createdAt])
}
```

### 2.10 Modular Solutions (À La Carte Subscriptions)

```prisma
// =====================================================
// MODULAR SOLUTIONS (À LA CARTE)
// =====================================================

model SolutionModule {
  id              String    @id @default(uuid())
  slug            String    @unique
  name            String
  description     String    @db.Text
  shortDescription String?  @map("short_description")

  // Pricing
  basePrice       Decimal   @db.Decimal(10, 2) @map("base_price")
  stripePriceId   String?   @map("stripe_price_id")

  // Categorization
  category        ModuleCategory
  icon            String?
  color           String?

  // Features included in this module
  features        Json?     // Array of feature descriptions

  // Module properties
  isCore          Boolean   @default(false) @map("is_core")
  isPopular       Boolean   @default(false) @map("is_popular")
  sortOrder       Int       @default(0) @map("sort_order")

  // Status
  isActive        Boolean   @default(true) @map("is_active")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  tenantModules   TenantModule[]
  dependencies    ModuleDependency[] @relation("DependentModule")
  dependents      ModuleDependency[] @relation("RequiredModule")
  bundleModules   BundleModule[]

  @@map("solution_modules")
  @@index([category])
  @@index([isActive])
}

enum ModuleCategory {
  CORE        // Website, basic features
  ENGAGEMENT  // Members, Groups, Communication
  GIVING      // Donations, Campaigns
  MEDIA       // Streaming, Sermons
  OPERATIONS  // Events, Check-in
}

model TenantModule {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  moduleId        String    @map("module_id")
  module          SolutionModule @relation(fields: [moduleId], references: [id])

  // Pricing (may differ from base due to discounts)
  price           Decimal   @db.Decimal(10, 2)
  discountPercent Decimal?  @db.Decimal(5, 2) @map("discount_percent")

  // Stripe subscription item
  stripeItemId    String?   @map("stripe_item_id")

  // Status
  status          ModuleStatus @default(ACTIVE)

  // Activation tracking
  activatedAt     DateTime  @default(now()) @map("activated_at")
  deactivatedAt   DateTime? @map("deactivated_at")

  // Trial
  trialEndsAt     DateTime? @map("trial_ends_at")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, moduleId])
  @@map("tenant_modules")
  @@index([tenantId])
  @@index([status])
}

enum ModuleStatus {
  ACTIVE
  TRIAL
  SUSPENDED
  CANCELLED
}

model ModuleDependency {
  id              String    @id @default(uuid())
  moduleId        String    @map("module_id")
  module          SolutionModule @relation("DependentModule", fields: [moduleId], references: [id])
  requiresModuleId String   @map("requires_module_id")
  requiresModule  SolutionModule @relation("RequiredModule", fields: [requiresModuleId], references: [id])

  // Dependency type
  isRequired      Boolean   @default(true) @map("is_required")
  description     String?

  @@unique([moduleId, requiresModuleId])
  @@map("module_dependencies")
  @@index([moduleId])
  @@index([requiresModuleId])
}

model ModuleBundle {
  id              String    @id @default(uuid())
  slug            String    @unique
  name            String
  description     String?   @db.Text

  // Discount
  discountPercent Decimal   @db.Decimal(5, 2) @map("discount_percent")

  // Display
  isPopular       Boolean   @default(false) @map("is_popular")
  sortOrder       Int       @default(0) @map("sort_order")

  // Status
  isActive        Boolean   @default(true) @map("is_active")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  modules         BundleModule[]

  @@map("module_bundles")
}

model BundleModule {
  id              String    @id @default(uuid())
  bundleId        String    @map("bundle_id")
  bundle          ModuleBundle @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  moduleId        String    @map("module_id")
  module          SolutionModule @relation(fields: [moduleId], references: [id])

  @@unique([bundleId, moduleId])
  @@map("bundle_modules")
  @@index([bundleId])
  @@index([moduleId])
}

// Add to Tenant model:
// subscriptionType SubscriptionType @default(PLAN) @map("subscription_type")
// tenantModules    TenantModule[]

enum SubscriptionType {
  PLAN      // Traditional tier-based subscription
  MODULAR   // À la carte module selection
  HYBRID    // Plan + additional modules
}
```

> 📘 See [21-modular-solutions.md](./21-modular-solutions.md) for complete modular architecture implementation details.

### 2.15 Internationalization Schema

Multi-language content storage and timezone handling for global church deployments.

```prisma
// =====================================================
// TRANSLATION SYSTEM
// =====================================================

model Translation {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  entityType  String   @map("entity_type")  // sermon, event, page, ministry, fund
  entityId    String   @map("entity_id")     // ID of the translated entity
  locale      String                         // ISO locale: en, ko, es, zh, etc.
  field       String                         // title, description, content, name
  value       String   @db.Text              // Translated value

  isAutoTranslated Boolean @default(false) @map("is_auto_translated")
  translatedBy     String? @map("translated_by")  // User ID if manual
  verifiedAt       DateTime? @map("verified_at")
  verifiedBy       String?   @map("verified_by")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([tenantId, entityType, entityId, locale, field])
  @@index([tenantId, entityType, entityId])
  @@index([tenantId, locale])
  @@map("translations")
}

// Supported locales for a tenant
model TenantLocale {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  locale      String                    // ISO locale code
  name        String                    // Display name (e.g., "한국어", "English")
  isDefault   Boolean  @default(false) @map("is_default")
  isEnabled   Boolean  @default(true)  @map("is_enabled")

  // Auto-translation settings
  autoTranslateEnabled Boolean @default(false) @map("auto_translate_enabled")
  autoTranslateFrom    String? @map("auto_translate_from")  // Source locale for auto-translation

  createdAt   DateTime @default(now()) @map("created_at")

  @@unique([tenantId, locale])
  @@index([tenantId])
  @@map("tenant_locales")
}

// User locale preferences
model UserLocalePreference {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  preferredLocale String @map("preferred_locale")
  timezone        String @default("UTC")           // IANA timezone
  dateFormat      String @default("YYYY-MM-DD")    // Date display format
  timeFormat      String @default("24h")           // 12h or 24h

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("user_locale_preferences")
}
```

#### Translation Service

```typescript
// lib/i18n/translation-service.ts
import { prisma } from '@/lib/prisma';
import { TranslationProvider } from './providers/translation-provider';

export interface TranslatableEntity {
  id: string;
  entityType: 'sermon' | 'event' | 'page' | 'ministry' | 'fund';
  fields: Record<string, string>;  // field name -> content
}

export class TranslationService {
  constructor(
    private tenantId: string,
    private provider?: TranslationProvider
  ) {}

  async getTranslation(
    entityType: string,
    entityId: string,
    field: string,
    locale: string
  ): Promise<string | null> {
    const translation = await prisma.translation.findUnique({
      where: {
        tenantId_entityType_entityId_locale_field: {
          tenantId: this.tenantId,
          entityType,
          entityId,
          locale,
          field,
        },
      },
    });

    return translation?.value ?? null;
  }

  async getEntityTranslations(
    entityType: string,
    entityId: string,
    locale: string
  ): Promise<Record<string, string>> {
    const translations = await prisma.translation.findMany({
      where: {
        tenantId: this.tenantId,
        entityType,
        entityId,
        locale,
      },
    });

    return translations.reduce(
      (acc, t) => ({ ...acc, [t.field]: t.value }),
      {}
    );
  }

  async setTranslation(
    entityType: string,
    entityId: string,
    field: string,
    locale: string,
    value: string,
    options?: { isAutoTranslated?: boolean; userId?: string }
  ): Promise<void> {
    await prisma.translation.upsert({
      where: {
        tenantId_entityType_entityId_locale_field: {
          tenantId: this.tenantId,
          entityType,
          entityId,
          locale,
          field,
        },
      },
      update: {
        value,
        isAutoTranslated: options?.isAutoTranslated ?? false,
        translatedBy: options?.userId,
        updatedAt: new Date(),
      },
      create: {
        tenantId: this.tenantId,
        entityType,
        entityId,
        locale,
        field,
        value,
        isAutoTranslated: options?.isAutoTranslated ?? false,
        translatedBy: options?.userId,
      },
    });
  }

  async autoTranslateEntity(
    entity: TranslatableEntity,
    sourceLocale: string,
    targetLocales: string[]
  ): Promise<void> {
    if (!this.provider) {
      throw new Error('Translation provider not configured');
    }

    for (const targetLocale of targetLocales) {
      for (const [field, content] of Object.entries(entity.fields)) {
        if (!content) continue;

        const translated = await this.provider.translate(
          content,
          sourceLocale,
          targetLocale
        );

        await this.setTranslation(
          entity.entityType,
          entity.id,
          field,
          targetLocale,
          translated,
          { isAutoTranslated: true }
        );
      }
    }
  }

  async getSupportedLocales(): Promise<Array<{ locale: string; name: string; isDefault: boolean }>> {
    const locales = await prisma.tenantLocale.findMany({
      where: {
        tenantId: this.tenantId,
        isEnabled: true,
      },
      select: {
        locale: true,
        name: true,
        isDefault: true,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return locales;
  }
}
```

#### Timezone Utilities

```typescript
// lib/i18n/timezone.ts
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';
import { parseISO } from 'date-fns';

export interface TimezoneConfig {
  timezone: string;      // IANA timezone (e.g., 'America/New_York')
  dateFormat: string;    // Date format pattern
  timeFormat: '12h' | '24h';
}

/**
 * All dates in the database are stored in UTC.
 * These utilities handle conversion for display and input.
 */

// Convert local time to UTC for storage
export function localToUtc(localDate: Date | string, timezone: string): Date {
  const date = typeof localDate === 'string' ? parseISO(localDate) : localDate;
  return zonedTimeToUtc(date, timezone);
}

// Convert UTC to local time for display
export function utcToLocal(utcDate: Date | string, timezone: string): Date {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  return utcToZonedTime(date, timezone);
}

// Format a UTC date in local timezone
export function formatInTimezone(
  utcDate: Date | string,
  timezone: string,
  formatString: string
): string {
  const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const localDate = utcToZonedTime(date, timezone);
  return formatTz(localDate, formatString, { timeZone: timezone });
}

// Get user's preferred timezone
export async function getUserTimezone(userId: string): Promise<string> {
  const preference = await prisma.userLocalePreference.findUnique({
    where: { userId },
    select: { timezone: true },
  });
  return preference?.timezone ?? 'UTC';
}

// Get tenant's default timezone
export async function getTenantTimezone(tenantId: string): Promise<string> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });
  return (tenant?.settings as any)?.timezone ?? 'UTC';
}

// Handle DST transitions for recurring events
export function getNextOccurrence(
  baseTime: Date,
  recurrenceRule: string,
  timezone: string
): Date {
  // Convert to local time for recurrence calculation
  const localBase = utcToZonedTime(baseTime, timezone);

  // Calculate next occurrence in local time
  // (using rrule library or similar)
  const rrule = RRule.fromString(recurrenceRule);
  const nextLocal = rrule.after(localBase, true);

  if (!nextLocal) {
    throw new Error('No more occurrences');
  }

  // Convert back to UTC for storage
  return zonedTimeToUtc(nextLocal, timezone);
}

// Common timezone list for UI
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
  { value: 'UTC', label: 'UTC' },
];
```

#### React Hook for Translations

```typescript
// hooks/useTranslation.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/providers/locale-provider';

interface TranslatedContent {
  [field: string]: string;
}

export function useTranslation(
  entityType: string,
  entityId: string,
  defaultContent: TranslatedContent
) {
  const { locale, defaultLocale } = useLocale();
  const [content, setContent] = useState<TranslatedContent>(defaultContent);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If current locale is default, use default content
    if (locale === defaultLocale) {
      setContent(defaultContent);
      return;
    }

    // Fetch translations for current locale
    const fetchTranslations = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/translations/${entityType}/${entityId}?locale=${locale}`
        );
        if (res.ok) {
          const translations = await res.json();
          // Merge with defaults for any missing fields
          setContent({ ...defaultContent, ...translations });
        } else {
          setContent(defaultContent);
        }
      } catch (error) {
        console.error('Failed to fetch translations:', error);
        setContent(defaultContent);
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [entityType, entityId, locale, defaultLocale, defaultContent]);

  const t = useCallback(
    (field: string): string => content[field] ?? defaultContent[field] ?? field,
    [content, defaultContent]
  );

  return { t, content, loading, locale };
}
```

---

## 3. Indexes & Performance

### 3.1 Key Indexes Summary

```sql
-- =====================================================
-- TENANT ISOLATION (All multi-tenant tables)
-- =====================================================
CREATE INDEX idx_[table]_tenant ON [table](tenant_id);

-- =====================================================
-- COMMON QUERY PATTERNS
-- =====================================================
CREATE INDEX idx_users_email ON users(tenant_id, email);
CREATE INDEX idx_members_name ON members(tenant_id, last_name, first_name);
CREATE INDEX idx_events_date ON events(tenant_id, start_date);
CREATE INDEX idx_donations_date ON donations(tenant_id, created_at);
CREATE INDEX idx_sermons_date ON sermons(tenant_id, date);

-- =====================================================
-- STATUS FILTERS
-- =====================================================
CREATE INDEX idx_events_status ON events(tenant_id, status);
CREATE INDEX idx_sermons_status ON sermons(tenant_id, status);
CREATE INDEX idx_donations_status ON donations(tenant_id, status);

-- =====================================================
-- FOREIGN KEY RELATIONSHIPS
-- =====================================================
CREATE INDEX idx_donations_member ON donations(member_id);
CREATE INDEX idx_events_ministry ON events(ministry_id);
CREATE INDEX idx_sermons_series ON sermons(series_id);

-- =====================================================
-- MODULE INDEXES
-- =====================================================
CREATE INDEX idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX idx_tenant_modules_module ON tenant_modules(module_id);
CREATE INDEX idx_tenant_modules_status ON tenant_modules(status);
CREATE INDEX idx_solution_modules_category ON solution_modules(category);
CREATE INDEX idx_module_dependencies_module ON module_dependencies(module_id);

-- =====================================================
-- ADDITIONAL COMPOSITE INDEXES (Performance Optimization)
-- Added based on common query patterns analysis
-- =====================================================

-- Donations: Donor-specific queries
CREATE INDEX idx_donations_tenant_member ON donations(tenant_id, member_id);
CREATE INDEX idx_donations_tenant_fund ON donations(tenant_id, fund_id);
CREATE INDEX idx_donations_status_date ON donations(tenant_id, status, created_at);

-- Events: Date + Status filtering (common calendar queries)
CREATE INDEX idx_events_date_status ON events(tenant_id, start_date, status);
CREATE INDEX idx_events_featured ON events(tenant_id, is_featured, start_date)
  WHERE is_featured = true;

-- Sermons: Series ordering
CREATE INDEX idx_sermons_series_order ON sermons(tenant_id, series_id, series_order);
CREATE INDEX idx_sermons_featured ON sermons(tenant_id, featured_order)
  WHERE featured_order IS NOT NULL;

-- Communications: Scheduled message delivery
CREATE INDEX idx_communications_schedule ON communications(tenant_id, scheduled_for, status);
CREATE INDEX idx_communications_pending ON communications(tenant_id, status)
  WHERE status = 'SCHEDULED';

-- Audit Logs: Investigation queries
CREATE INDEX idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);

-- Custom Domains: Verification status
CREATE INDEX idx_custom_domains_pending ON custom_domains(verified, created_at)
  WHERE verified = false;

-- Translations: Content lookup
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id, locale);

-- Members: Status and date ranges for reports
CREATE INDEX idx_members_status_date ON members(tenant_id, status, created_at);
CREATE INDEX idx_members_family ON members(tenant_id, family_id)
  WHERE family_id IS NOT NULL;

-- Groups: Active groups by type
CREATE INDEX idx_groups_active_type ON groups(tenant_id, group_type, is_active)
  WHERE is_active = true;

-- Recurring Donations: Next payment scheduling
CREATE INDEX idx_recurring_next_payment ON recurring_donations(
  tenant_id, status, next_payment_date
) WHERE status = 'ACTIVE';
```

### 3.2 Index Maintenance Guidelines

```sql
-- Regularly analyze table statistics for query optimization
ANALYZE VERBOSE;

-- Monitor index usage
SELECT
  schemaname, tablename, indexname,
  idx_scan as times_used,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes (candidates for removal)
SELECT
  schemaname || '.' || tablename as table,
  indexname as index,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 4. Migration Strategy

### 4.1 Initial Migration

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Seed database
npx prisma db seed
```

### 4.2 Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default plans
  const starterPlan = await prisma.plan.create({
    data: {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small churches getting started',
      priceMonthly: 0,
      priceYearly: 0,
      maxUsers: 2,
      maxMembers: 100,
      maxStorageMB: 5120,
      maxSermons: 50,
      maxEvents: 24,
      maxPages: 10,
      displayOrder: 1,
    },
  });

  const growthPlan = await prisma.plan.create({
    data: {
      name: 'Growth',
      slug: 'growth',
      description: 'For growing churches',
      priceMonthly: 49,
      priceYearly: 490,
      maxUsers: 5,
      maxMembers: 500,
      maxStorageMB: 51200,
      maxSermons: 500,
      maxEvents: 100,
      maxPages: 50,
      customDomain: true,
      textToGive: true,
      childCheckin: true,
      isPopular: true,
      displayOrder: 2,
    },
  });

  // Create demo tenant
  const demoTenant = await prisma.tenant.create({
    data: {
      subdomain: 'demo',
      name: 'Demo Church',
      email: 'admin@demo.digitalchurch.com',
      planId: growthPlan.id,
      status: 'ACTIVE',
      templateId: 'default',
    },
  });

  // Create admin user
  const adminPassword = await hash('demo123', 12);
  await prisma.user.create({
    data: {
      tenantId: demoTenant.id,
      email: 'admin@demo.digitalchurch.com',
      username: 'admin',
      password: adminPassword,
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'SUPERUSER',
      emailVerified: new Date(),
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

**Document Version**: 3.0 Enterprise Edition
**Last Updated**: December 2024
**Maintained By**: Digital Church Platform Team
