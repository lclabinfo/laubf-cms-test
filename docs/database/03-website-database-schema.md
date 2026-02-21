# Website Database Schema

## Complete Prisma Schema for Website Builder, Pages, Sections, Menus, and Themes

This document covers the database tables that define each church's public-facing website structure. These tables are separate from CMS content (messages, events, etc.) — they define *how* that content is displayed on the website.

---

## 1. Architecture: How the Website Builder Works

```
Church
└── SiteSettings          ← Global site configuration (name, logo, colors, social links)
    ├── Theme             ← Selected template/theme
    │   └── ThemeCustomization  ← Per-church overrides (fonts, colors, spacing)
    ├── Menu[]            ← Navigation menus (header, footer, mobile)
    │   └── MenuItem[]    ← Menu items (nested tree structure)
    └── Page[]            ← Website pages
        └── PageSection[] ← Ordered sections with JSONB content
```

### Why JSONB for Section Content

Each section type (hero banner, media grid, event calendar, etc.) has a **different content structure**. Rather than creating 40+ separate tables (one per section type), we use a single `PageSection` table with:

- `sectionType` — enum identifying which section it is
- `content` — JSONB containing the type-specific data
- `settings` — JSONB containing display settings (theme, padding, animations)

This approach:
- Avoids schema explosion (40+ tables → 1 table)
- Makes adding new section types trivial (no migration needed)
- Keeps page assembly as a simple ordered query
- Uses PostgreSQL's JSONB indexing for any queries into content

The **TypeScript types** in `src/lib/types/sections.ts` serve as the application-level schema for validating JSONB content. Prisma validates the outer structure; Zod/TypeScript validates the inner JSONB.

---

## 2. Site Settings

One row per church. Stores global website configuration that applies across all pages.

```prisma
model SiteSettings {
  id             String       @id @default(uuid()) @db.Uuid
  churchId          String       @unique @db.Uuid

  // Site identity
  siteName       String                            // "LA UBF" — displayed in browser tab
  tagline        String?                           // "University Bible Fellowship of Los Angeles"
  description    String?      @db.Text             // SEO meta description
  logoUrl        String?                           // Header logo
  logoAlt        String?
  faviconUrl     String?
  ogImageUrl     String?                           // Default Open Graph image

  // Contact info (displayed in footer, contact pages)
  contactEmail   String?
  contactPhone   String?
  contactAddress String?      @db.Text             // Full address block

  // Social media URLs
  facebookUrl    String?
  instagramUrl   String?
  youtubeUrl     String?
  twitterUrl     String?
  tiktokUrl      String?
  spotifyUrl     String?
  podcastUrl     String?

  // Service times (structured for display)
  serviceTimes   Json?        @db.JsonB            // [{ day: "Sunday", time: "11:00 AM", label: "Worship Service" }]

  // SEO & Analytics
  googleAnalyticsId String?                        // "G-XXXXXXXXXX"
  metaPixelId       String?                        // Facebook Pixel

  // Feature flags
  enableBlog           Boolean @default(false)
  enableGiving         Boolean @default(false)
  enableMemberLogin    Boolean @default(false)
  enablePrayerRequests Boolean @default(false)
  enableAnnouncements  Boolean @default(false)
  enableSearch         Boolean @default(true)

  // Custom code injection
  customHeadHtml  String?     @db.Text             // Injected into <head>
  customBodyHtml  String?     @db.Text             // Injected before </body>

  // Maintenance mode
  maintenanceMode    Boolean  @default(false)
  maintenanceMessage String?  @db.Text

  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  church         Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([churchId])
}
```

---

## 3. Pages

Each page on the public website. Pages are composed of ordered sections.

```prisma
model Page {
  id            String       @id @default(uuid()) @db.Uuid
  churchId         String       @db.Uuid

  // Identity
  slug          String                              // "/" for home, "/about", "/messages"
  title         String                              // "About Us" — displayed in nav + browser tab

  // SEO metadata
  metaTitle     String?                             // SEO title override (falls back to title)
  metaDescription String?    @db.Text               // SEO description
  ogImageUrl    String?                             // Page-specific OG image
  canonicalUrl  String?                             // Canonical URL override
  noIndex       Boolean      @default(false)        // Exclude from search engines

  // Page settings
  pageType      PageType     @default(STANDARD)     // STANDARD, LANDING, MINISTRY, CAMPUS
  layout        PageLayout   @default(DEFAULT)      // DEFAULT, FULL_WIDTH, NARROW
  isHomepage    Boolean      @default(false)        // Only one per org
  isPublished   Boolean      @default(false)
  publishedAt   DateTime?

  // Ordering (for sitemap and navigation)
  sortOrder     Int          @default(0)

  // Parent page (for nested URLs like /ministries/college)
  parentId      String?      @db.Uuid
  parent        Page?        @relation("PageHierarchy", fields: [parentId], references: [id])
  children      Page[]       @relation("PageHierarchy")

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  createdBy     String?      @db.Uuid
  updatedBy     String?      @db.Uuid
  deletedAt     DateTime?

  church        Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  sections      PageSection[]

  @@unique([churchId, slug])
  @@index([churchId, isPublished])
  @@index([churchId, pageType])
  @@index([churchId, parentId])
  @@index([churchId, isHomepage])
}

enum PageType {
  STANDARD      // Regular content page
  LANDING       // Landing page (no header/footer nav)
  MINISTRY      // Ministry group page
  CAMPUS        // Campus ministry page
  SYSTEM        // System pages (404, maintenance)
}

enum PageLayout {
  DEFAULT       // Standard width with nav + footer
  FULL_WIDTH    // Edge-to-edge sections
  NARROW        // Narrow content column (for text-heavy pages)
}
```

---

## 4. Page Sections

The core of the website builder. Each section is a configurable block within a page.

```prisma
model PageSection {
  id            String       @id @default(uuid()) @db.Uuid
  churchId         String       @db.Uuid
  pageId        String       @db.Uuid

  // Section identity
  sectionType   SectionType                         // Which section component to render
  label         String?                             // Admin-friendly label: "Homepage Hero"

  // Position within the page
  sortOrder     Int          @default(0)            // 0, 1, 2, ... determines render order

  // Display settings (maps to BaseSectionSettings)
  visible       Boolean      @default(true)
  colorScheme   ColorScheme  @default(LIGHT)        // LIGHT or DARK
  paddingY      PaddingSize  @default(DEFAULT)
  containerWidth ContainerWidth @default(STANDARD)
  enableAnimations Boolean   @default(true)

  // Section-specific content (JSONB)
  // The structure depends on sectionType.
  // Validated at the application layer by TypeScript types.
  content       Json         @db.JsonB              // Type-specific content payload

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  createdBy     String?      @db.Uuid
  updatedBy     String?      @db.Uuid

  page          Page         @relation(fields: [pageId], references: [id], onDelete: Cascade)
  church        Church @relation(fields: [churchId], references: [id], onDelete: Cascade)

  @@index([pageId, sortOrder])
  @@index([churchId, sectionType])
}

// Verified against src/lib/types/sections.ts SectionType union
// and src/components/sections/ component files in the laubf-test codebase.
//
// Each enum value maps 1:1 to a TypeScript SectionType string
// (e.g. HERO_BANNER -> "hero-banner") and a React component
// (e.g. HeroBannerSection.tsx).
enum SectionType {
  // Hero sections
  HERO_BANNER           // "hero-banner"    → HeroBannerSection
  PAGE_HERO             // "page-hero"      → PageHeroSection
  TEXT_IMAGE_HERO       // "text-image-hero" → TextImageHeroSection
  EVENTS_HERO           // "events-hero"    → EventsHeroSection
  MINISTRY_HERO         // "ministry-hero"  → MinistryHeroSection

  // Content sections
  MEDIA_TEXT            // "media-text"      → MediaTextSection
  MEDIA_GRID            // "media-grid"      → MediaGridSection
  SPOTLIGHT_MEDIA       // "spotlight-media" → SpotlightMediaSection
  PHOTO_GALLERY         // "photo-gallery"   → PhotoGallerySection
  QUOTE_BANNER          // "quote-banner"    → QuoteBannerSection
  CTA_BANNER            // "cta-banner"      → CTABannerSection
  ABOUT_DESCRIPTION     // "about-description" → AboutDescriptionSection
  STATEMENT             // "statement"       → StatementSection

  // Card layouts
  ACTION_CARD_GRID      // "action-card-grid" → ActionCardGridSection
  HIGHLIGHT_CARDS       // "highlight-cards"  → HighlightCardsSection
  FEATURE_BREAKDOWN     // "feature-breakdown" → FeatureBreakdownSection
  PATHWAY_CARD          // "pathway-card"     → PathwayCardSection
  PILLARS               // "pillars"          → PillarsSection
  NEWCOMER              // "newcomer"         → NewcomerSection (CTA card)

  // Lists & data
  ALL_MESSAGES          // "all-messages"     → AllMessagesSection
  ALL_EVENTS            // "all-events"       → AllEventsSection
  ALL_BIBLE_STUDIES     // "all-bible-studies" → AllBibleStudiesSection
  ALL_VIDEOS            // "all-videos"       → AllVideosSection
  UPCOMING_EVENTS       // "upcoming-events"  → UpcomingEventsSection
  EVENT_CALENDAR        // "event-calendar"   → EventCalendarSection
  RECURRING_MEETINGS    // "recurring-meetings" → RecurringMeetingsSection
  RECURRING_SCHEDULE    // "recurring-schedule" → RecurringScheduleSection

  // Ministry-specific
  MINISTRY_INTRO        // "ministry-intro"    → MinistryIntroSection
  MINISTRY_SCHEDULE     // "ministry-schedule" → MinistryScheduleSection
  CAMPUS_CARD_GRID      // "campus-card-grid"  → CampusCardGridSection
  DIRECTORY_LIST        // "directory-list"     → DirectoryListSection
  MEET_TEAM             // "meet-team"          → MeetTeamSection
  LOCATION_DETAIL       // "location-detail"    → LocationDetailSection

  // Interactive
  FORM_SECTION          // "form"             → FormSection
  FAQ_SECTION           // "faq"              → FAQSection
  TIMELINE_SECTION      // "timeline"         → TimelineSection

  // Navigation & layout
  NAVBAR                // "navbar"           → Navbar (in layout, not per-page)
  FOOTER                // "footer"           → FooterSection (in layout, not per-page)
  QUICK_LINKS           // "quick-links"      → QuickLinksSection

  // Special (standalone page, not a reusable section)
  DAILY_BREAD_FEATURE   // DailyBreadDetailPage (dedicated page component, not a generic section)

  // Generic / custom (planned, no components built yet)
  CUSTOM_HTML
  CUSTOM_EMBED
}

enum ColorScheme {
  LIGHT
  DARK
}

enum PaddingSize {
  NONE
  COMPACT
  DEFAULT
  SPACIOUS
}

enum ContainerWidth {
  NARROW
  STANDARD
  FULL
}
```

### Section Content JSONB Examples

Each `sectionType` has a specific JSONB structure. These examples are **verified against the actual TypeScript interfaces** in `src/lib/types/sections.ts` and the live page data in the laubf-test codebase.

**HERO_BANNER** (maps to `HeroBannerContent`)
```json
{
  "heading": { "line1": "Welcome to", "line2": "LA UBF" },
  "subheading": "Where people find their community.\nWhere disciples are raised.",
  "primaryButton": { "label": "I'm new", "href": "/im-new", "visible": true },
  "secondaryButton": { "label": "Upcoming events", "href": "/events", "visible": true },
  "backgroundImage": { "src": "/videos/compressed-hero-vid.mp4", "alt": "LA UBF community" }
}
```
> Note: `showSubheading` is a top-level section prop, not inside `content`.

**MEDIA_TEXT** (maps to `MediaTextContent`)
```json
{
  "overline": "WHO WE ARE",
  "heading": "Christian Ministry for College Students",
  "body": "LA UBF is a community of...",
  "button": { "label": "More about us", "href": "/about", "visible": true },
  "images": [
    { "src": "/images/bible-study.png", "alt": "Bible study" },
    { "src": "/images/campus.png", "alt": "Campus ministry" }
  ],
  "rotationSpeed": 40
}
```

**SPOTLIGHT_MEDIA** (maps to `SpotlightMediaContent`)
```json
{
  "sectionHeading": "This Week's Message",
  "sermon": {
    "slug": "as-the-spirit-gave-them-utterance",
    "title": "As The Spirit Gave Them Utterance",
    "speaker": "P. William",
    "date": "FEB 8",
    "series": "SUNDAY MESSAGE",
    "thumbnailUrl": "https://img.youtube.com/vi/U-vvxbOHQEM/maxresdefault.jpg",
    "videoUrl": "https://www.youtube.com/watch?v=U-vvxbOHQEM"
  }
}
```

**ALL_MESSAGES** (maps to `AllMessagesContent`)
```json
{
  "heading": "All Messages"
}
```
> Note: The actual TypeScript type is minimal — only `heading`. Filtering, pagination, and display options are handled by the component itself, not stored in JSONB.

**ALL_EVENTS** (maps to `AllEventsContent`)
```json
{
  "heading": "All Events"
}
```

**ALL_BIBLE_STUDIES** (maps to `AllBibleStudiesContent`)
```json
{
  "heading": "All Bible studies"
}
```

**ALL_VIDEOS** (maps to `AllVideosContent`)
```json
{
  "heading": "All Videos"
}
```

**RECURRING_MEETINGS** (maps to `RecurringMeetingsContent`)
```json
{
  "heading": "Recurring Meetings & Programs",
  "maxVisible": 4,
  "viewAllHref": "/events"
}
```
> Note: Meetings are fetched from the events table (where `isRecurring = true`), not embedded in JSONB.

**RECURRING_SCHEDULE** (maps to `RecurringScheduleContent`)
```json
{
  "heading": "Weekly Schedule",
  "subtitle": "Join us for weekly meetings",
  "meetings": [
    {
      "title": "Daily Bread & Prayer",
      "description": "Morning devotional",
      "time": "6:00 AM",
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
      "location": "Zoom"
    }
  ]
}
```

**EVENT_CALENDAR** (maps to `EventCalendarContent`)
```json
{
  "heading": "Schedule",
  "currentMonth": "FEBRUARY 2026",
  "filters": ["ALL", "Events", "Meetings", "Programs"],
  "events": [],
  "ctaButtons": [
    { "label": "2026 LA UBF Calendar", "href": "/calendar", "icon": true },
    { "label": "View all events", "href": "/events" }
  ]
}
```

**FORM_SECTION** (maps to `FormContent`)
```json
{
  "overline": "Plan Your Visit",
  "heading": "Let us help you start",
  "description": "Let us know you're coming and we'll save a seat for you!",
  "interestOptions": [
    { "label": "Sunday Service", "value": "sunday-service" },
    { "label": "College Campus Group", "value": "college-group" },
    { "label": "Personal Bible Study", "value": "personal-bible-study" }
  ],
  "campusOptions": [
    { "label": "LBCC", "value": "lbcc" },
    { "label": "CSULB", "value": "csulb" }
  ],
  "bibleTeacherLabel": "I'd like to be matched with a personal bible teacher",
  "submitLabel": "Submit",
  "successMessage": "Thank you! We've received your message."
}
```

**FAQ_SECTION** (maps to `FAQContent`)
```json
{
  "heading": "Frequently Asked Questions",
  "showIcon": true,
  "items": [
    { "question": "What should I expect on Sunday?", "answer": "Our Sunday worship..." },
    { "question": "Is there parking available?", "answer": "Yes, free parking..." }
  ]
}
```

**CTA_BANNER** (maps to `CTABannerContent`)
```json
{
  "overline": "New Here?",
  "heading": "Visit us this Sunday",
  "body": "All are welcome. Come connect with us.",
  "primaryButton": { "label": "Plan your visit", "href": "/im-new", "visible": true },
  "secondaryButton": { "label": "See our ministries", "href": "/ministries", "visible": true },
  "backgroundImage": { "src": "/images/visit-us.jpg", "alt": "LA UBF community" }
}
```

**PAGE_HERO** (maps to `PageHeroContent`)
```json
{
  "overline": "New here?",
  "heading": "We're glad you're here.",
  "primaryButton": { "label": "Plan Your Visit", "href": "#plan-visit", "visible": true },
  "secondaryButton": { "label": "FAQ", "href": "#faq", "visible": true },
  "floatingImages": [
    { "src": "/images/baptism.jpg", "alt": "Baptism", "width": 219, "height": 146 }
  ]
}
```

**TEXT_IMAGE_HERO** (maps to `TextImageHeroContent`)
```json
{
  "overline": "WHO WE ARE",
  "headingLine1": "Christian Ministry for",
  "headingAccent": "College Students +",
  "description": "Our main focus is to study the Bible...",
  "image": { "src": "/images/header.jpg", "alt": "LA UBF community" }
}
```

**ABOUT_DESCRIPTION** (maps to `AboutDescriptionContent`)
```json
{
  "logoSrc": "/logo/laubf-logo-blue.svg",
  "heading": "About UBF",
  "description": "University Bible Fellowship (UBF) is an international evangelical church...",
  "videoUrl": "https://www.youtube.com/embed/WqeW4HtM06M",
  "videoTitle": "Describe UBF in 3 Words"
}
```

**PILLARS** (maps to `PillarsContent`)
```json
{
  "overline": "WHAT WE DO",
  "heading": "The 3 Pillars of LA UBF",
  "items": [
    {
      "title": "Bible Study",
      "description": "We help students study the Bible...",
      "images": [{ "src": "/images/bible-study.jpg", "alt": "Bible study" }],
      "button": { "label": "Learn more", "href": "/about" }
    }
  ]
}
```

**STATEMENT** (maps to `StatementContent`)
```json
{
  "overline": "STATEMENT OF FAITH",
  "heading": "What We Believe",
  "showIcon": true,
  "leadIn": "We believe that",
  "paragraphs": [
    { "text": "there is one God in three Persons...", "isBold": true },
    { "text": "the Bible is inspired by God...", "isBold": false }
  ]
}
```

**QUOTE_BANNER** (maps to `QuoteBannerContent`)
```json
{
  "overline": "2026 SPIRITUAL DIRECTION",
  "heading": "Not of the World",
  "verse": {
    "text": "They are not of the world, just as I am not of the world...",
    "reference": "John 17:16-18"
  }
}
```

**FOOTER** (maps to `FooterContent`)
```json
{
  "description": "A Bible-centered community raising lifelong disciples.",
  "socialLinks": [
    { "platform": "instagram", "href": "https://instagram.com/la.ubf" },
    { "platform": "youtube", "href": "https://youtube.com/@laubf" }
  ],
  "columns": [
    {
      "heading": "EXPLORE",
      "links": [
        { "label": "About Us", "href": "/about" },
        { "label": "Events", "href": "/events" }
      ]
    },
    {
      "heading": "RESOURCES",
      "links": [
        { "label": "UBF HQ", "href": "https://ubf.org/", "external": true }
      ]
    }
  ],
  "contactInfo": {
    "address": ["11625 Paramount Blvd", "Downey, CA 90241"],
    "phone": "(562) 396-6350",
    "email": "laubf.downey@gmail.com"
  }
}
```

**MINISTRY_HERO** (maps to `MinistryHeroContent`)
```json
{
  "overline": "CAMPUS MINISTRY",
  "heading": "LBCC\nTrue Vine Club",
  "headingStyle": "sans",
  "ctaButton": { "label": "Start Bible Study", "href": "https://startbiblestudy.org/lbcc", "visible": true },
  "socialLinks": [
    { "platform": "Email", "href": "mailto:fishformen123@gmail.com" },
    { "platform": "Instagram", "href": "https://instagram.com/lbcc.ubf" }
  ],
  "heroImage": { "src": "/images/lbcc.jpg", "alt": "LBCC campus ministry" }
}
```

**MINISTRY_SCHEDULE** (maps to `MinistryScheduleContent`)
```json
{
  "heading": "Join Us",
  "description": "Whether you're a believer or just curious, you're welcome here.",
  "scheduleLabel": "WHEN & WHERE",
  "scheduleEntries": [
    { "day": "Tuesdays", "time": "12:00 PM - 1:00 PM", "location": "College Center" }
  ],
  "buttons": [
    { "label": "Start Bible Study", "href": "https://startbiblestudy.org/lbcc", "variant": "primary" }
  ]
}
```

**MEET_TEAM** (maps to `MeetTeamContent`)
```json
{
  "overline": "YOUNG ADULT MINISTRY",
  "heading": "Meet Our Team",
  "members": [
    {
      "name": "William Larsen",
      "role": "Campus Leader",
      "bio": "Bio here",
      "image": { "src": "/images/leader.jpg", "alt": "William Larsen" }
    }
  ]
}
```

**CAMPUS_CARD_GRID** (maps to `CampusCardGridContent`)
```json
{
  "overline": "Are you a college student?",
  "heading": "Join a Campus Ministry",
  "description": "We have bible study clubs across different college campuses.",
  "decorativeImages": [
    { "src": "/images/campus-1.jpg", "alt": "Campus group" }
  ],
  "campuses": [
    { "id": "lbcc", "abbreviation": "LBCC", "fullName": "Long Beach City College", "href": "/ministries/campus/lbcc" }
  ],
  "ctaHeading": "Don't see your campus?",
  "ctaButton": { "label": "Let us know your interest", "href": "/im-new" }
}
```

**NEWCOMER** (maps to `NewcomerContent`)
```json
{
  "heading": "Are you a newcomer?",
  "description": "We know that visiting a new church can be intimidating.",
  "buttonLabel": "I'm new",
  "buttonHref": "/im-new",
  "image": { "src": "/images/sunday-worship.jpg", "alt": "Sunday worship" }
}
```

**NAVBAR** (maps to `NavbarContent` — rendered in layout, not per-page)
```json
{
  "logo": { "lightSrc": "/logo/laubf-logo.svg", "darkSrc": "/logo/laubf-logo-blue.svg", "alt": "LA UBF" },
  "ctaButton": { "label": "I'm new", "href": "/im-new", "visible": true },
  "memberLogin": { "label": "Member Login", "href": "/member-login", "visible": false }
}
```

---

## 5. Menus

Navigation menus for the website header, footer, and mobile navigation.

```prisma
model Menu {
  id          String   @id @default(uuid()) @db.Uuid
  churchId       String   @db.Uuid
  name        String                                // "Main Navigation", "Footer", "Mobile"
  slug        String                                // "main", "footer", "mobile"
  location    MenuLocation                          // WHERE this menu appears

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  church       Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  items        MenuItem[]

  @@unique([churchId, slug])
  @@index([churchId, location])
}

enum MenuLocation {
  HEADER       // Top navigation bar
  FOOTER       // Footer navigation
  MOBILE       // Mobile-specific menu
  SIDEBAR      // Sidebar navigation
}
```

### Menu Items

Menu items form a **tree structure** using `parentId`. This maps to the current dropdown navigation structure in `nav-data.ts`.

```prisma
model MenuItem {
  id          String   @id @default(uuid()) @db.Uuid
  menuId      String   @db.Uuid

  // Content
  label       String                                // "Our Church", "Messages"
  href        String?                               // "/about" (null for dropdown parents)
  description String?                               // Shown in mega-menu dropdowns
  iconName    String?                               // Lucide icon name: "Church", "BookOpen"

  // Behavior
  openInNewTab Boolean @default(false)
  isExternal   Boolean @default(false)              // External URL

  // Hierarchy
  parentId    String?  @db.Uuid                     // null = top level
  parent      MenuItem? @relation("MenuItemTree", fields: [parentId], references: [id])
  children    MenuItem[] @relation("MenuItemTree")

  // Grouping (for mega-menu sections)
  groupLabel  String?                               // "About", "Connect" (section heading in dropdown)

  // Featured card in dropdown (maps to NavDropdown.featuredCard)
  featuredImage String?
  featuredTitle String?
  featuredDescription String?
  featuredHref  String?

  // Ordering
  sortOrder   Int      @default(0)

  // Visibility
  isVisible   Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  menu        Menu     @relation(fields: [menuId], references: [id], onDelete: Cascade)

  @@index([menuId, parentId, sortOrder])
  @@index([menuId, sortOrder])
}
```

### Menu Data Mapping

The current `nav-data.ts` mega-menu structure maps to this table as follows:

```
NavDropdown "Our Church"
  → MenuItem { label: "Our Church", href: null, parentId: null }
    → NavSection "About"
      → MenuItem { groupLabel: "About", parentId: "our-church" }
        → MenuItem { label: "About LA UBF", href: "/about", parentId: "about-group" }
        → MenuItem { label: "I'm New", href: "/im-new", parentId: "about-group" }
    → NavSection "Connect"
      → MenuItem { groupLabel: "Connect", parentId: "our-church" }
        → MenuItem { label: "Events", href: "/events", parentId: "connect-group" }
    → FeaturedCard
      → MenuItem { featuredImage: "...", featuredTitle: "...", featuredHref: "..." }

NavDropdown "Ministries"
  → MenuItem { label: "Ministries", href: null }
    → Group "Ministry Groups"
      → Children: College, Adults, High School, Children
    → Group "Campus Ministries"
      → Children: LBCC, CSULB, CSUF, UCLA, USC, etc.

NavDropdown "Resources"
  → MenuItem { label: "Resources", href: null }
    → Group "The Word"
      → Children: Messages, Bible Studies, Daily Bread
    → Group "Media"
      → Children: Videos

Direct Link "Giving"
  → MenuItem { label: "Giving", href: "/giving", parentId: null }
```

---

## 6. Themes & Customization

### Theme (Template Gallery)

Platform-level templates that churches can choose from. These are NOT per-church — they're shared across the platform.

```prisma
model Theme {
  id            String   @id @default(uuid()) @db.Uuid
  name          String                              // "Modern Church", "Classic", "Minimalist"
  slug          String   @unique
  description   String?  @db.Text
  previewUrl    String?                             // Screenshot/preview image
  category      String?                             // "Modern", "Traditional", "Minimal"
  isDefault     Boolean  @default(false)
  isActive      Boolean  @default(true)

  // Default design tokens
  defaultTokens Json     @db.JsonB                  // Default color/font/spacing values

  // Template structure: default pages + sections for new orgs
  defaultPages  Json?    @db.JsonB                  // Page templates with section definitions

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  customizations ThemeCustomization[]
}
```

### ThemeCustomization (Per-Org Overrides)

Each church customizes their chosen theme's design tokens.

```prisma
model ThemeCustomization {
  id            String   @id @default(uuid()) @db.Uuid
  churchId         String   @unique @db.Uuid
  themeId       String   @db.Uuid

  // Color overrides (hex values)
  primaryColor    String?                           // Main brand color
  secondaryColor  String?                           // Accent color
  backgroundColor String?                           // Page background
  textColor       String?                           // Body text color
  headingColor    String?                           // Heading text color

  // Typography overrides
  headingFont   String?                             // Google Font name: "Inter"
  bodyFont      String?                             // "Source Sans Pro"
  baseFontSize  Int?                                // px: 16

  // Spacing overrides
  borderRadius  String?                             // "0.5rem", "0", "1rem"

  // Component-level overrides
  navbarStyle   Json?    @db.JsonB                  // { sticky: true, transparent: false, ... }
  footerStyle   Json?    @db.JsonB                  // { columns: 3, ... }
  buttonStyle   Json?    @db.JsonB                  // { borderRadius: "full", ... }
  cardStyle     Json?    @db.JsonB                  // { shadow: "md", ... }

  // Custom CSS (advanced users)
  customCss     String?  @db.Text

  // All overrides as a flat map (for CSS variable injection)
  tokenOverrides Json?   @db.JsonB                  // { "--color-primary": "#1a1a1a", ... }

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  church        Church @relation(fields: [churchId], references: [id], onDelete: Cascade)
  theme         Theme        @relation(fields: [themeId], references: [id])

  @@index([churchId])
  @@index([themeId])
}
```

---

## 7. How It All Connects: Page Rendering Flow

When a visitor hits `gracechurch.org/about`:

```
1. Edge Middleware
   → Resolve "gracechurch.org" → church_id = "abc123"
   → Set tenant context headers

2. Next.js Route Handler
   → Read church_id from context

3. Parallel Database Queries:
   a) SiteSettings WHERE church_id = "abc123"
      → Site name, logos, social links, feature flags

   b) ThemeCustomization WHERE church_id = "abc123"
      → JOIN Theme for default tokens
      → Merge overrides → CSS variables

   c) Menu WHERE church_id = "abc123" AND location = "HEADER"
      → JOIN MenuItem (tree query)
      → Build navigation structure

   d) Page WHERE church_id = "abc123" AND slug = "/about"
      → Page metadata + SEO

   e) PageSection WHERE page_id = {page.id} ORDER BY sort_order
      → Array of sections with content JSONB

4. Render Pipeline
   → Inject CSS variables from theme
   → Render navbar from menu data
   → For each section:
     → Match sectionType to React component
     → Pass content JSONB as props
     → Some sections fetch additional data:
       - ALL_MESSAGES → query messages table
       - ALL_EVENTS → query events table
       - SPOTLIGHT_MEDIA → query single message
       - UPCOMING_EVENTS → query upcoming events
   → Render footer from menu + site settings

5. Cache
   → Cache entire rendered page at CDN (5 min TTL)
   → Invalidate on CMS content update for this org
```

---

## 8. Page Section Data Dependencies

Some sections are purely static (content lives entirely in their JSONB). Others need to query CMS content tables at render time.

### Static Sections (content-only, no DB queries at render time)

| Section Type | JSONB Contains |
|---|---|
| `HERO_BANNER` | Heading (line1/line2), subheading, background image/video, CTA buttons |
| `PAGE_HERO` | Overline, heading, CTA buttons, floating images |
| `TEXT_IMAGE_HERO` | Overline, heading, accent text, description, image |
| `EVENTS_HERO` | Heading, subtitle |
| `MINISTRY_HERO` | Overline, heading, CTA button, social links, hero image |
| `MEDIA_TEXT` | Overline, heading, body, button, rotating images |
| `QUOTE_BANNER` | Overline, heading, verse text + reference |
| `CTA_BANNER` | Overline, heading, body, CTA buttons, background image |
| `ACTION_CARD_GRID` | Multi-line heading, subheading, CTA button, array of image cards |
| `FEATURE_BREAKDOWN` | Heading, acronym lines, description, button |
| `PATHWAY_CARD` | Heading, description, array of cards with icons |
| `PILLARS` | Overline, heading, array of items (title, description, images, button) |
| `ABOUT_DESCRIPTION` | Logo, heading, description, video URL |
| `STATEMENT` | Overline, heading, lead-in, paragraphs (with bold flag) |
| `NEWCOMER` | Heading, description, button, image |
| `DIRECTORY_LIST` | Heading, items, image, CTA |
| `CAMPUS_CARD_GRID` | Heading, description, decorative images, campus list, CTA |
| `MEET_TEAM` | Overline, heading, array of team members (name, role, bio, image) |
| `PHOTO_GALLERY` | Heading, array of images |
| `LOCATION_DETAIL` | Overline, time/location labels, address, directions URL, images |
| `TIMELINE_SECTION` | Overline, heading, video/image, array of timeline items |
| `FAQ_SECTION` | Heading, showIcon flag, array of Q&A pairs |
| `FORM_SECTION` | Overline, heading, description, interest/campus options, submit label |
| `MEDIA_GRID` | Heading, CTA label/href, array of video thumbnails |
| `NAVBAR` | Logo (light/dark), CTA button, member login config |
| `FOOTER` | Description, social links, column definitions, contact info |
| `QUICK_LINKS` | Heading, subtitle |
| `CUSTOM_HTML` | Raw HTML (planned) |

### Dynamic Sections (require CMS data queries at render time)

| Section Type | Queries | Data Needed |
|---|---|---|
| `ALL_MESSAGES` | `Message` + `Speaker` + `Series` | Full message listing with filters |
| `ALL_EVENTS` | `Event` + `Ministry` + `Campus` | Full event listing with tab filters |
| `ALL_BIBLE_STUDIES` | `BibleStudy` + `Series` | Full study listing with filters |
| `ALL_VIDEOS` | `Video` | Full video listing |
| `SPOTLIGHT_MEDIA` | `Message` (by slug or latest) | Featured message details |
| `UPCOMING_EVENTS` | `Event` (filtered, upcoming) | Next N upcoming events by ministry |
| `EVENT_CALENDAR` | `Event` (date range) | Events for calendar month display |
| `RECURRING_MEETINGS` | `Event` (where isRecurring = true) | Recurring meeting cards with join links |
| `RECURRING_SCHEDULE` | Static JSONB meetings array | Weekly schedule display (currently static) |
| `HIGHLIGHT_CARDS` | `Event` (featured) | Featured event cards for homepage |
| `DAILY_BREAD_FEATURE` | `DailyBread` (today) | Today's devotional content |
| `MINISTRY_INTRO` | Static JSONB | Ministry details (currently static content) |
| `MINISTRY_SCHEDULE` | Static JSONB | Ministry schedule entries (currently static) |

---

## 9. Indexing for Website Queries

Website pages are read-heavy and latency-sensitive. Every query must be fast.

```sql
-- Page lookup (every page load)
-- Uses: unique(church_id, slug)
SELECT * FROM pages WHERE church_id = ? AND slug = ? AND is_published = true;

-- Page sections (every page load)
-- Uses: idx_page_sections_page_sort
SELECT * FROM page_sections WHERE page_id = ? ORDER BY sort_order;

-- Menu with items (every page load, cached)
-- Uses: idx_menus_org_location + idx_menu_items_menu_sort
SELECT m.*, mi.* FROM menus m
JOIN menu_items mi ON mi.menu_id = m.id
WHERE m.church_id = ? AND m.location = 'HEADER'
ORDER BY mi.sort_order;

-- Site settings (every page load, cached 60 min)
-- Uses: unique(church_id) on site_settings
SELECT * FROM site_settings WHERE church_id = ?;

-- Theme + customization (every page load, cached 60 min)
-- Uses: unique(church_id) on theme_customizations
SELECT tc.*, t.default_tokens FROM theme_customizations tc
JOIN themes t ON t.id = tc.theme_id
WHERE tc.church_id = ?;
```

### Recommended Cache TTLs

| Data | TTL | Invalidation Trigger |
|---|---|---|
| Site settings | 60 min | Admin updates settings |
| Theme/customization | 60 min | Admin changes theme |
| Menu structure | 30 min | Admin edits navigation |
| Page metadata | 10 min | Admin publishes/unpublishes page |
| Page sections | 10 min | Admin edits page content |
| Dynamic section data (messages, events) | 5 min | CMS content updated |
| Full rendered page (CDN) | 5 min | Any content change for this org |

---

## 10. Website Builder Operations

### Creating a New Page

```typescript
// 1. Create the page
const page = await prisma.page.create({
  data: {
    churchId,
    slug: '/new-page',
    title: 'New Page',
    pageType: 'STANDARD',
    layout: 'DEFAULT',
    isPublished: false,
  }
})

// 2. Add sections
await prisma.pageSection.createMany({
  data: [
    {
      churchId,
      pageId: page.id,
      sectionType: 'PAGE_HERO',
      sortOrder: 0,
      content: { heading: 'New Page', subheading: '' },
    },
    {
      churchId,
      pageId: page.id,
      sectionType: 'MEDIA_TEXT',
      sortOrder: 1,
      content: { heading: '', body: '<p>Content here...</p>' },
    },
  ]
})
```

### Reordering Sections

```typescript
// Batch update sort orders
await prisma.$transaction(
  sectionIds.map((id, index) =>
    prisma.pageSection.update({
      where: { id },
      data: { sortOrder: index },
    })
  )
)
```

### Duplicating a Page

```typescript
// 1. Copy page metadata
const newPage = await prisma.page.create({
  data: {
    ...existingPage,
    id: undefined,
    slug: `${existingPage.slug}-copy`,
    title: `${existingPage.title} (Copy)`,
    isPublished: false,
  }
})

// 2. Copy all sections
const sections = await prisma.pageSection.findMany({
  where: { pageId: existingPage.id },
  orderBy: { sortOrder: 'asc' },
})

await prisma.pageSection.createMany({
  data: sections.map(s => ({
    ...s,
    id: undefined,
    pageId: newPage.id,
  }))
})
```

---

## 11. Default Page Templates

When a new church is created, the system seeds default pages based on the LA UBF structure.

> **Verified against the actual `src/app/` pages** in the laubf-test codebase.

| Page | Slug | Sections (in order) |
|---|---|---|
| **Home** | `/` | HERO_BANNER → MEDIA_TEXT → HIGHLIGHT_CARDS → EVENT_CALENDAR → QUOTE_BANNER → ACTION_CARD_GRID → DIRECTORY_LIST → SPOTLIGHT_MEDIA → MEDIA_GRID → CTA_BANNER |
| **About** | `/about` | TEXT_IMAGE_HERO → ABOUT_DESCRIPTION → PILLARS → STATEMENT → NEWCOMER |
| **I'm New** | `/im-new` | PAGE_HERO → FEATURE_BREAKDOWN → PATHWAY_CARD → TIMELINE_SECTION → LOCATION_DETAIL → CAMPUS_CARD_GRID → FORM_SECTION → FAQ_SECTION |
| **Messages** | `/messages` | SPOTLIGHT_MEDIA → ALL_MESSAGES |
| **Events** | `/events` | EVENTS_HERO → ALL_EVENTS |
| **Bible Study** | `/bible-study` | EVENTS_HERO → ALL_BIBLE_STUDIES |
| **Videos** | `/videos` | EVENTS_HERO → ALL_VIDEOS |
| **Daily Bread** | `/daily-bread` | DAILY_BREAD_FEATURE (standalone page component) |
| **Ministries** | `/ministries` | TEXT_IMAGE_HERO → PILLARS → CAMPUS_CARD_GRID → NEWCOMER |
| **Giving** | `/giving` | (Coming soon — placeholder page) |
| **College Ministry** | `/ministries/college` | MINISTRY_HERO → MINISTRY_INTRO → PILLARS → PHOTO_GALLERY → CAMPUS_CARD_GRID → MEET_TEAM → UPCOMING_EVENTS → NEWCOMER |
| **Campus (e.g. LBCC)** | `/ministries/campus/lbcc` | MINISTRY_HERO → MINISTRY_INTRO → MINISTRY_SCHEDULE → MEET_TEAM → FAQ_SECTION → CAMPUS_CARD_GRID |

**Layout-level sections** (rendered in `layout.tsx`, not per-page):
- **NAVBAR** — rendered at the top of every page
- **FOOTER** — rendered at the bottom of every page
- **QuickLinksFAB** — floating action button with quick links (layout-level component)

Each church can then customize these pages, add new ones, remove sections, or reorder them through the CMS.

---

## 12. Review Notes & Design Considerations

> Added during schema review — cross-referencing doc against the live laubf-test codebase.

### Changes Made in This Review

1. **SectionType enum corrected** — removed 9 phantom enum values that had no matching component or TypeScript type (`NEXT_STEPS_CARDS`, `CAMPUS_LIST`, `CAMPUS_HERO`, `THIS_WEEKS_MESSAGE`, `VIDEO_GRID`, `STATEMENT_OF_FAITH`, `SPIRITUAL_DIRECTION`, `VISIT_CTA`, `WHO_WE_ARE`). Added 7 missing values that DO exist in the codebase (`ABOUT_DESCRIPTION`, `STATEMENT`, `NEWCOMER`, `CAMPUS_CARD_GRID`, `DIRECTORY_LIST`, `MEET_TEAM`, `LOCATION_DETAIL`). Renamed `PILLARS_SECTION` to `PILLARS` to match the TypeScript type.

2. **JSONB content examples rewritten** — every example now matches the actual TypeScript interface from `src/lib/types/sections.ts`. Previously, examples were fabricated with field names that don't exist in the codebase (e.g., `backgroundImageUrl` instead of `backgroundImage.src`, `ctaButtons[]` array instead of `primaryButton`/`secondaryButton`).

3. **Default page templates corrected** — the section sequences for Home, About, I'm New, Ministries, Bible Study, and Videos pages were wrong. They now match the actual `src/app/*/page.tsx` files. Added College Ministry and Campus page templates that were missing.

4. **Static/dynamic section classification updated** — added all newly recognized section types and corrected the data dependency descriptions.

### Design Assessment

**JSONB approach: SOLID for this use case.** The 35+ section types would create an unmanageable number of tables. The TypeScript types in `sections.ts` serve as an effective application-level schema. Recommendation: add Zod validation schemas that mirror the TypeScript types and validate JSONB on write. This closes the gap between "no schema" in PostgreSQL and "full schema" in TypeScript.

**Menu tree structure: ADEQUATE but watch depth.** The self-referential `parentId` works for the current 3-level mega-menu structure (dropdown -> group -> item). The `groupLabel` field cleverly handles section headings within dropdowns. At scale, recursive CTEs for deep trees could be a concern, but church navigation rarely exceeds 3 levels. The `overviewLink` from `nav-data.ts` is not captured in MenuItem — consider adding it or modeling it as a special MenuItem type.

**Theme/ThemeCustomization: GOOD foundation, needs expansion.** The split between platform-level `Theme` and per-org `ThemeCustomization` is correct. The current LA UBF site uses CSS custom properties (`--color-black-1`, `--color-white-1`, `--color-brand-1`, etc.) defined in `globals.css` — the `tokenOverrides` JSONB field maps well to this. Missing: dark mode toggle support (the site has `colorScheme` per-section but no global dark mode), and the actual font stack uses `DM Serif Display` via `next/font` which should be documented as a theme token.

**Cache TTLs: REASONABLE.** The 5-min CDN TTL for rendered pages is appropriate for a church site. However, consider using Next.js ISR with on-demand revalidation via `revalidateTag()` instead of time-based TTLs — this gives instant updates when an admin publishes content without waiting for cache expiry. For 10K tenants, tag-based invalidation (`church:{churchId}:page:{slug}`) is more efficient than blanket time-based expiry.

**QuickLinksFAB not modeled.** The floating action button with quick meeting links (rendered in `layout.tsx`) is a layout-level component but not represented in the database schema. Consider adding it to `SiteSettings` as a JSONB field or as a separate table, since it contains org-specific meeting links that change.

**SiteSettings coverage is good.** The `SiteSettings` model covers the actual footer data (contact info, social links) and feature flags well. The `serviceTimes` JSONB field maps to the existing timeline/location sections.

**Page model: `deletedAt` is defined but soft-delete middleware not mentioned.** The `Page` model has `deletedAt` but the Prisma middleware for soft-delete exclusion (mentioned in the architecture doc) should be referenced here for completeness.

**Missing from schema: Page versioning/drafts.** The current design has `isPublished` but no draft/published versioning. For a CMS, consider adding a `PageVersion` table or a `draftContent` JSONB field so admins can preview changes before publishing.
