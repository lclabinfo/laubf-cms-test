# Website Database Schema

## Complete Prisma Schema for Website Builder, Pages, Sections, Menus, and Themes

This document covers the database tables that define each church's public-facing website structure. These tables are separate from CMS content (messages, events, etc.) — they define *how* that content is displayed on the website.

---

## 1. Architecture: How the Website Builder Works

```
Organization
└── SiteSettings          ← Global site configuration (name, logo, colors, social links)
    ├── Theme             ← Selected template/theme
    │   └── ThemeCustomization  ← Per-org overrides (fonts, colors, spacing)
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

One row per organization. Stores global website configuration that applies across all pages.

```prisma
model SiteSettings {
  id             String       @id @default(uuid()) @db.Uuid
  orgId          String       @unique @db.Uuid

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

  organization   Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([orgId])
}
```

---

## 3. Pages

Each page on the public website. Pages are composed of ordered sections.

```prisma
model Page {
  id            String       @id @default(uuid()) @db.Uuid
  orgId         String       @db.Uuid

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

  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  sections      PageSection[]

  @@unique([orgId, slug])
  @@index([orgId, isPublished])
  @@index([orgId, pageType])
  @@index([orgId, parentId])
  @@index([orgId, isHomepage])
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
  orgId         String       @db.Uuid
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
  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)

  @@index([pageId, sortOrder])
  @@index([orgId, sectionType])
}

// Maps to the 40+ section types from src/lib/types/sections.ts
enum SectionType {
  // Hero sections
  HERO_BANNER
  PAGE_HERO
  TEXT_IMAGE_HERO
  EVENTS_HERO
  MINISTRY_HERO

  // Content sections
  MEDIA_TEXT
  MEDIA_GRID
  SPOTLIGHT_MEDIA
  PHOTO_GALLERY
  QUOTE_BANNER
  CTA_BANNER

  // Card layouts
  ACTION_CARD_GRID
  HIGHLIGHT_CARDS
  FEATURE_BREAKDOWN
  PATHWAY_CARD
  NEXT_STEPS_CARDS
  PILLARS_SECTION

  // Lists & data
  ALL_MESSAGES
  ALL_EVENTS
  ALL_BIBLE_STUDIES
  ALL_VIDEOS
  UPCOMING_EVENTS
  EVENT_CALENDAR
  RECURRING_MEETINGS
  RECURRING_SCHEDULE

  // Ministry-specific
  MINISTRY_INTRO
  MINISTRY_SCHEDULE
  CAMPUS_LIST
  CAMPUS_HERO

  // Interactive
  FORM_SECTION
  FAQ_SECTION
  TIMELINE_SECTION

  // Navigation & layout
  NAVBAR
  FOOTER
  QUICK_LINKS

  // Special
  DAILY_BREAD_FEATURE
  THIS_WEEKS_MESSAGE
  VIDEO_GRID
  STATEMENT_OF_FAITH
  SPIRITUAL_DIRECTION
  VISIT_CTA
  WHO_WE_ARE

  // Generic / custom
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

Each `sectionType` has a specific JSONB structure. Here are the key ones based on the current codebase:

**HERO_BANNER**
```json
{
  "heading": "Welcome to LA UBF",
  "subheading": "University Bible Fellowship of Los Angeles",
  "backgroundImageUrl": "/images/hero-bg.jpg",
  "backgroundVideoUrl": "/videos/hero.mp4",
  "ctaButtons": [
    { "label": "I'm New", "href": "/im-new", "variant": "primary" },
    { "label": "Watch Live", "href": "/events/sunday-livestream", "variant": "secondary" }
  ],
  "overlayOpacity": 0.5
}
```

**ALL_MESSAGES**
```json
{
  "heading": "Messages",
  "subheading": "Watch and listen to our weekly sermons",
  "defaultView": "grid",
  "showFilters": true,
  "showSeriesTab": true,
  "itemsPerPage": 12,
  "featuredMessageSlug": "as-the-spirit-gave-them-utterance"
}
```

**ALL_EVENTS**
```json
{
  "heading": "Events & Meetings",
  "defaultTab": "events",
  "defaultView": "grid",
  "showCalendarView": true,
  "showFilters": true,
  "itemsPerPage": 12
}
```

**RECURRING_MEETINGS**
```json
{
  "heading": "Weekly Schedule",
  "meetings": [
    {
      "eventSlug": "daily-bread-prayer",
      "overrideTitle": null,
      "overrideTime": null
    }
  ],
  "showJoinButtons": true
}
```

**SPOTLIGHT_MEDIA**
```json
{
  "heading": "This Week's Message",
  "messageSlug": "as-the-spirit-gave-them-utterance",
  "autoSelectLatest": true,
  "showDescription": true,
  "showTranscriptLink": true
}
```

**MEDIA_TEXT**
```json
{
  "heading": "Who We Are",
  "body": "<p>LA UBF is a community of...</p>",
  "imageUrl": "/images/community.jpg",
  "imageAlt": "Community gathering",
  "imagePosition": "left",
  "ctaButton": { "label": "Learn More", "href": "/about" }
}
```

**FORM_SECTION**
```json
{
  "heading": "Get In Touch",
  "formType": "contact",
  "fields": [
    { "name": "name", "type": "text", "label": "Name", "required": true },
    { "name": "email", "type": "email", "label": "Email", "required": true },
    { "name": "interest", "type": "select", "label": "I'm interested in...", "options": ["Bible Study", "Sunday Service", "Campus Ministry"] },
    { "name": "campus", "type": "select", "label": "Campus", "options": ["LBCC", "CSULB", "UCLA"] },
    { "name": "wantsBibleTeacher", "type": "checkbox", "label": "I'd like a Bible teacher" },
    { "name": "message", "type": "textarea", "label": "Message" }
  ],
  "submitLabel": "Send Message",
  "successMessage": "Thank you! We'll be in touch soon."
}
```

**FAQ_SECTION**
```json
{
  "heading": "Frequently Asked Questions",
  "items": [
    { "question": "What should I expect on Sunday?", "answer": "<p>Our Sunday worship...</p>" },
    { "question": "Is there parking available?", "answer": "<p>Yes, free parking...</p>" }
  ]
}
```

**FOOTER**
```json
{
  "columns": [
    {
      "heading": "Our Church",
      "links": [
        { "label": "About", "href": "/about" },
        { "label": "I'm New", "href": "/im-new" }
      ]
    },
    {
      "heading": "Resources",
      "links": [
        { "label": "Messages", "href": "/messages" },
        { "label": "Bible Studies", "href": "/bible-study" }
      ]
    }
  ],
  "showSocialLinks": true,
  "showContactInfo": true,
  "copyrightText": "LA UBF"
}
```

---

## 5. Menus

Navigation menus for the website header, footer, and mobile navigation.

```prisma
model Menu {
  id          String   @id @default(uuid()) @db.Uuid
  orgId       String   @db.Uuid
  name        String                                // "Main Navigation", "Footer", "Mobile"
  slug        String                                // "main", "footer", "mobile"
  location    MenuLocation                          // WHERE this menu appears

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  items        MenuItem[]

  @@unique([orgId, slug])
  @@index([orgId, location])
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

Platform-level templates that churches can choose from. These are NOT per-org — they're shared across the platform.

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

Each organization customizes their chosen theme's design tokens.

```prisma
model ThemeCustomization {
  id            String   @id @default(uuid()) @db.Uuid
  orgId         String   @unique @db.Uuid
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

  organization  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  theme         Theme        @relation(fields: [themeId], references: [id])

  @@index([orgId])
  @@index([themeId])
}
```

---

## 7. How It All Connects: Page Rendering Flow

When a visitor hits `gracechurch.org/about`:

```
1. Edge Middleware
   → Resolve "gracechurch.org" → org_id = "abc123"
   → Set tenant context headers

2. Next.js Route Handler
   → Read org_id from context

3. Parallel Database Queries:
   a) SiteSettings WHERE org_id = "abc123"
      → Site name, logos, social links, feature flags

   b) ThemeCustomization WHERE org_id = "abc123"
      → JOIN Theme for default tokens
      → Merge overrides → CSS variables

   c) Menu WHERE org_id = "abc123" AND location = "HEADER"
      → JOIN MenuItem (tree query)
      → Build navigation structure

   d) Page WHERE org_id = "abc123" AND slug = "/about"
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

### Static Sections (content-only, no DB queries)

| Section Type | JSONB Contains |
|---|---|
| `HERO_BANNER` | Heading, subheading, image/video URL, CTA buttons |
| `PAGE_HERO` | Heading, subheading, breadcrumbs |
| `MEDIA_TEXT` | Heading, body HTML, image, CTA |
| `QUOTE_BANNER` | Quote text, attribution |
| `CTA_BANNER` | Heading, body, CTA buttons |
| `ACTION_CARD_GRID` | Array of cards (title, description, image, link) |
| `HIGHLIGHT_CARDS` | Array of cards |
| `FEATURE_BREAKDOWN` | Array of features |
| `FAQ_SECTION` | Array of Q&A pairs |
| `TIMELINE_SECTION` | Array of timeline entries |
| `FORM_SECTION` | Form field definitions |
| `CUSTOM_HTML` | Raw HTML |
| `FOOTER` | Column definitions, links |

### Dynamic Sections (require CMS data queries)

| Section Type | Queries | Data Needed |
|---|---|---|
| `ALL_MESSAGES` | `Message` + `Speaker` + `Series` | Full message listing with filters |
| `ALL_EVENTS` | `Event` + `Ministry` + `Campus` | Full event listing with filters |
| `ALL_BIBLE_STUDIES` | `BibleStudy` + `Series` | Full study listing with filters |
| `ALL_VIDEOS` | `Video` | Full video listing |
| `SPOTLIGHT_MEDIA` | `Message` (single) | Featured message details |
| `THIS_WEEKS_MESSAGE` | `Message` (latest) | Most recent published message |
| `UPCOMING_EVENTS` | `Event` (filtered) | Next N upcoming events |
| `EVENT_CALENDAR` | `Event` (date range) | Events for calendar month |
| `RECURRING_MEETINGS` | `Event` (recurring only) | Recurring meeting schedule |
| `RECURRING_SCHEDULE` | `Event` (recurring only) | Weekly schedule display |
| `DAILY_BREAD_FEATURE` | `DailyBread` (today) | Today's devotional |
| `CAMPUS_LIST` | `Campus` | All active campuses |
| `MINISTRY_INTRO` | `Ministry` (single) | Ministry details |
| `MINISTRY_SCHEDULE` | `Event` (by ministry) | Ministry-specific events |

---

## 9. Indexing for Website Queries

Website pages are read-heavy and latency-sensitive. Every query must be fast.

```sql
-- Page lookup (every page load)
-- Uses: unique(org_id, slug)
SELECT * FROM pages WHERE org_id = ? AND slug = ? AND is_published = true;

-- Page sections (every page load)
-- Uses: idx_page_sections_page_sort
SELECT * FROM page_sections WHERE page_id = ? ORDER BY sort_order;

-- Menu with items (every page load, cached)
-- Uses: idx_menus_org_location + idx_menu_items_menu_sort
SELECT m.*, mi.* FROM menus m
JOIN menu_items mi ON mi.menu_id = m.id
WHERE m.org_id = ? AND m.location = 'HEADER'
ORDER BY mi.sort_order;

-- Site settings (every page load, cached 60 min)
-- Uses: unique(org_id) on site_settings
SELECT * FROM site_settings WHERE org_id = ?;

-- Theme + customization (every page load, cached 60 min)
-- Uses: unique(org_id) on theme_customizations
SELECT tc.*, t.default_tokens FROM theme_customizations tc
JOIN themes t ON t.id = tc.theme_id
WHERE tc.org_id = ?;
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
    orgId,
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
      orgId,
      pageId: page.id,
      sectionType: 'PAGE_HERO',
      sortOrder: 0,
      content: { heading: 'New Page', subheading: '' },
    },
    {
      orgId,
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

When a new organization is created, the system seeds default pages based on the LA UBF structure:

| Page | Slug | Sections (in order) |
|---|---|---|
| **Home** | `/` | HERO_BANNER → WHO_WE_ARE → UPCOMING_EVENTS → RECURRING_SCHEDULE → SPIRITUAL_DIRECTION → NEXT_STEPS_CARDS → CAMPUS_LIST → THIS_WEEKS_MESSAGE → VIDEO_GRID → VISIT_CTA |
| **About** | `/about` | PAGE_HERO → MEDIA_TEXT → PILLARS_SECTION → STATEMENT_OF_FAITH → CTA_BANNER |
| **I'm New** | `/im-new` | HERO_BANNER → MEDIA_TEXT → PATHWAY_CARD → TIMELINE_SECTION → MEDIA_TEXT → CAMPUS_LIST → FORM_SECTION → FAQ_SECTION |
| **Messages** | `/messages` | SPOTLIGHT_MEDIA → ALL_MESSAGES |
| **Events** | `/events` | EVENTS_HERO → ALL_EVENTS |
| **Bible Study** | `/bible-study` | PAGE_HERO → ALL_BIBLE_STUDIES |
| **Videos** | `/videos` | PAGE_HERO → ALL_VIDEOS |
| **Daily Bread** | `/daily-bread` | DAILY_BREAD_FEATURE |
| **Ministries** | `/ministries` | PAGE_HERO → HIGHLIGHT_CARDS → CAMPUS_LIST |
| **Giving** | `/giving` | PAGE_HERO → MEDIA_TEXT → CTA_BANNER |

Each organization can then customize these pages, add new ones, remove sections, or reorder them through the CMS.
