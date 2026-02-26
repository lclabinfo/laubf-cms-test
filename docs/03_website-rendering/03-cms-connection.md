# CMS ↔ Website Connection

## How CMS Content Flows to the Public Website

This document explains the full data pipeline from when an admin publishes content in the CMS to when a visitor sees it on the public website. Understanding this connection is essential before building either the website rendering layer or the website builder admin.

---

## 1. The Three Systems

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  CMS Admin     │     │  Database      │     │  Public Website│
│  (Write Side)  │ ──→ │  (Source of    │ ──→ │  (Read Side)   │
│                │     │   Truth)       │     │                │
│  /cms/*        │     │  PostgreSQL    │     │  /(website)/*  │
│  /api/v1/*     │     │  + Redis cache │     │  [[...slug]]   │
└────────────────┘     └────────────────┘     └────────────────┘
```

### Write Side (CMS Admin)
- Admin creates/edits a sermon, event, page section, theme, or menu
- API route validates input, writes to database
- Cache invalidation fires for the affected church + entity

### Storage (Database)
- PostgreSQL is the single source of truth
- All content is tenant-scoped by `church_id`
- JSONB stores flexible section content

### Read Side (Public Website)
- Server Components query the database via DAL
- Data is optionally cached (Next.js cache or Redis)
- Sections render RSC output streamed to the browser

---

## 2. Content Types and Their Website Representation

| CMS Content | Created In | Displayed By (Section) | Website Page |
|---|---|---|---|
| **Sermon/Message** | CMS → Messages | `ALL_MESSAGES`, `SPOTLIGHT_MEDIA` | `/messages`, `/messages/[slug]` |
| **Event** | CMS → Events | `ALL_EVENTS`, `UPCOMING_EVENTS`, `HIGHLIGHT_CARDS`, `EVENT_CALENDAR`, `RECURRING_MEETINGS` | `/events`, `/events/[slug]` |
| **Bible Study** | CMS → Bible Studies | `ALL_BIBLE_STUDIES` | `/bible-study`, `/bible-study/[slug]` |
| **Video** | CMS → Videos | `ALL_VIDEOS` | `/videos` |
| **Daily Bread** | CMS → Daily Bread | `DAILY_BREAD_FEATURE` | `/daily-bread` |
| **Page Content** | Website Builder → Pages | Any static section | Any custom page |
| **Navigation** | Website Builder → Menus | Layout navbar/footer | Every page |
| **Theme** | Website Builder → Theme | CSS variables | Every page |
| **Site Settings** | Settings → General | Footer, meta tags | Every page |

### Two Categories of Website Content

**Category 1: CMS-Driven Content** — Admins create content items (sermons, events, etc.) through CMS forms. Dynamic section components automatically display this content on the public website. The admin never touches the website builder for these — creating a sermon in the CMS means it appears on the Messages page automatically.

**Category 2: Builder-Driven Content** — Admins configure page structure, section JSONB content, navigation, and theme through the Website Builder admin. This controls the static sections (hero banners, CTAs, FAQs) and the overall site structure. Changes here affect layout and design, not content.

---

## 3. Data Flow Examples

### Example A: Admin Publishes a New Sermon

```
1. Admin fills out sermon form in CMS (title, speaker, passage, video URL)
2. Admin clicks "Publish"
3. POST /api/v1/messages → DAL createMessage() → INSERT into messages table
4. API route calls invalidateOnContentChange(churchId, 'messages')
5. Next.js revalidateTag("church:abc123:messages") fires
6. Next.js revalidateTag("church:abc123:pages") fires (because messages affect dynamic sections)

Next visitor to /messages:
7. (website)/[[...slug]] loads page from DB
8. SectionRenderer renders ALL_MESSAGES section
9. AllMessagesSection (async RSC) calls getMessages(churchId)
10. New sermon appears in the list
11. SPOTLIGHT_MEDIA on homepage also shows the new sermon (if configured for "latest")
```

Time from publish to visible: **< 1 second** (with on-demand revalidation) or **< 5 minutes** (with TTL-based caching).

### Example B: Admin Changes the Hero Banner

```
1. Admin opens Website Builder → Pages → Home
2. Admin edits HERO_BANNER section: changes heading text, uploads new background
3. Admin clicks "Save"
4. PATCH /api/v1/pages/home/sections/{sectionId}
   → Validates JSONB content against heroBannerSchema
   → UPDATE page_sections SET content = {...} WHERE id = ?
5. API route calls revalidateTag("church:abc123:pages")

Next visitor to /:
7. (website)/[[...slug]] loads homepage from DB
8. SectionRenderer renders HERO_BANNER with new content
9. Updated heading and background appear
```

### Example C: Admin Switches Theme Colors

```
1. Admin opens Website Builder → Theme
2. Admin changes primary color from blue to green
3. Admin clicks "Save"
4. PATCH /api/v1/site-settings/theme
   → UPDATE theme_customizations SET primary_color = '#22c55e' WHERE church_id = ?
5. revalidateTag("church:abc123:theme")

Next visitor to any page:
6. (website)/layout.tsx fetches ThemeCustomization
7. ThemeProvider injects --color-primary: #22c55e
8. Every button, link, and accent on the site is now green
```

---

## 4. Template-Governed Pages vs. Custom Pages

### Template-Governed Pages

These pages have a **fixed section structure** defined by the template. The admin controls what content appears (via CMS) but not which sections exist or their order.

| Page | Fixed Sections | Admin Controls |
|---|---|---|
| Messages | `SPOTLIGHT_MEDIA → ALL_MESSAGES` | Which sermon is featured, filter defaults |
| Events | `EVENTS_HERO → ALL_EVENTS` | Hero heading/image |
| Bible Study | `EVENTS_HERO → ALL_BIBLE_STUDIES` | Hero heading/image |
| Videos | `EVENTS_HERO → ALL_VIDEOS` | Hero heading/image |
| Daily Bread | `DAILY_BREAD_FEATURE` | Nothing — auto-populated from today's entry |

**Why lock them?** These pages exist to display CMS content. Letting admins remove the `ALL_MESSAGES` section from the Messages page would break the fundamental purpose. The template protects them from this.

**Implementation**: Template-governed pages have a `pageType` of `STANDARD` or a specific type like `MINISTRY`/`CAMPUS`. The page builder UI shows these sections as non-removable but editable.

### Custom Pages

These pages are fully admin-configurable: add, remove, reorder, and edit sections freely. Examples: Home, About, I'm New, Giving, any custom page.

**Implementation**: Custom pages have no section restrictions. The page builder shows the full section gallery when adding new sections.

---

## 5. Section Component Contract

Every section component follows this contract:

```typescript
interface SectionComponentProps {
  content: Record<string, any>   // JSONB payload (typed per section)
  churchId: string               // For dynamic sections that fetch data
  enableAnimations: boolean       // From PageSection.enableAnimations
}
```

### Static Section Contract
- Receives JSONB `content` as props
- Renders synchronously (regular RSC)
- No database calls
- Pure function of content → HTML

### Dynamic Section Contract
- Receives JSONB `content` (configuration) + `churchId`
- Is an `async` RSC
- Calls DAL functions to fetch CMS data
- Renders data + configuration → HTML

### Section Container Contract
Every section component wraps itself in `SectionContainer` (`components/website/shared/section-container.tsx`) which handles:
- `colorScheme`: "light" or "dark" background + `SectionThemeContext` for child components
- `paddingY`: "none", "compact", "default", or "spacious" vertical spacing
- `containerWidth`: "standard", "narrow", or "full" content width

These settings are stored on `PageSection` (not in JSONB `content`) because they're universal to all section types. The `SectionRenderer` (registry) converts DB enum values (e.g., `DARK`) to lowercase strings (e.g., `"dark"`) before passing to section components.

---

## 6. Website Builder Admin API Routes

All API routes listed below are **COMPLETE** (implemented as part of Phase C v1). See `docs/00_dev-notes/website-admin-implementation.md` for the full list of 20 endpoints.

```
app/api/v1/
├── pages/
│   ├── route.ts                    GET (list pages) + POST (create page)
│   └── [slug]/
│       ├── route.ts                GET (page + sections) + PATCH (update) + DELETE
│       └── sections/
│           ├── route.ts            POST (add section) + PUT (reorder all)
│           └── [sectionId]/route.ts PATCH (update content) + DELETE (remove)
├── menus/
│   ├── route.ts                    GET (list menus)
│   └── [slug]/
│       ├── route.ts                GET (menu + items) + PATCH
│       └── items/
│           ├── route.ts            POST (add item) + PUT (reorder)
│           └── [itemId]/route.ts   PATCH + DELETE
├── theme/
│   └── route.ts                    GET + PATCH (theme customization)
└── site-settings/
    └── route.ts                    GET + PATCH (already exists)
```

Every write endpoint must:
1. Validate input (Zod for JSONB content)
2. Write to database
3. Call `invalidateOnContentChange()` for cache busting
4. Return the updated record

---

## 7. Real-Time Preview

When admins edit a section in the page builder, they should see a preview.

### Current Implementation (v1 Editor)
The v1 list-based editor at `/cms/website/pages/[slug]` does not provide live preview. Admins save changes and view the public website to see results.

### Full-Screen Builder (v2, In Progress)
The v2 builder at `app/cms/website/builder/` renders actual `SectionRenderer` components in the canvas, providing true WYSIWYG preview. When an admin edits section content in the modal editor:
1. Admin clicks Edit on a section's floating toolbar
2. SectionEditorModal opens with type-specific form fields
3. On save, the API is called (PATCH) and the canvas re-renders with updated content
4. The canvas shows the same section components used on the public website

This approach (Approach B from the original design) provides live preview without a separate preview mode, because the canvas IS the preview. See `docs/00_dev-notes/website-builder-plan.md` Phase 2 (Canvas) and Phase 5 (Section Editors).

**Known limitation:** The builder's device preview (mobile/tablet) constrains the canvas container width but does not change the browser viewport. CSS media queries (`@media (min-width: ...)`) and Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) still evaluate against the full viewport, so responsive breakpoint behavior (show/hide elements, grid column changes) is not accurately previewed. See `docs/03_website-rendering/10-builder-rendering.md` Section 5 for the full analysis and future options.

**Rendering parity:** The builder canvas applies the same theme CSS variables, custom CSS, font loading, and section component props as the live website. See `docs/03_website-rendering/10-builder-rendering.md` for the complete comparison.

---

## 8. Sitemap and SEO Integration

The public website generates SEO metadata dynamically:

### Sitemap Generation
```typescript
// app/(website)/sitemap.ts
export default async function sitemap() {
  const churchId = await getChurchId()
  const pages = await getPublishedPages(churchId)

  return pages.map(page => ({
    url: `https://${getDomain(churchId)}${page.slug}`,
    lastModified: page.updatedAt,
    priority: page.isHomepage ? 1.0 : 0.8,
  }))
}
```

### robots.txt
```typescript
// app/(website)/robots.ts
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/cms/' },
    sitemap: 'https://domain.com/sitemap.xml',
  }
}
```

### Structured Data (JSON-LD)
For church websites, add structured data for:
- `Church` / `LocalBusiness` on the homepage
- `Event` on event detail pages
- `VideoObject` on sermon detail pages
- `BreadcrumbList` on all pages

---

## 9. Error States

### Missing Page (404)
The catch-all route returns `notFound()` if no page exists for the slug. The `(website)` route group has its own `not-found.tsx` styled with the church's theme.

### Unconfigured Church
If `SiteSettings` doesn't exist for a church, the layout renders a "Setup Required" page prompting the admin to complete onboarding.

### Missing Section Component
If a `SectionType` doesn't have a matching component in the registry, the section is silently skipped in production. In development, a warning is logged.

### Database Connection Error
If the database is unreachable, Next.js's built-in error boundary catches the error. The `error.tsx` in the website route group shows a branded error page.
