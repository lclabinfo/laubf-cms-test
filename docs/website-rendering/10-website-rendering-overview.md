# Website Rendering — High-Level Overview & Section Data Flow

## How the Website Renders Pages End-to-End

> **Last updated**: February 24, 2026

---

## 1. Rendering Pipeline

The public website uses a **single catch-all route** that renders any page from the database:

```
Browser request → Next.js App Router
  → app/(website)/layout.tsx
    → ThemeProvider (injects CSS vars from ThemeCustomization)
    → FontLoader (loads Google Fonts + custom @font-face per tenant)
    → Navbar (from Menu records, location=HEADER)
    → app/(website)/[[...slug]]/page.tsx
      → Resolves churchId (from tenant context)
      → Fetches Page by slug (or homepage if no slug)
      → For each PageSection (sorted by sortOrder):
        → resolveSectionData() if content.dataSource exists
        → SectionWrapper (padding, color scheme, visibility, animations)
          → Registry lookup → Render section component
    → Footer (from Menu records, location=FOOTER + SiteSettings)
    → QuickLinksFAB (floating quick links)
```

### Key Files

| File | Purpose |
|---|---|
| `app/(website)/layout.tsx` | Website layout shell — theme, fonts, navbar, footer |
| `app/(website)/[[...slug]]/page.tsx` | Catch-all page route — fetches page + sections from DB |
| `lib/website/resolve-section-data.ts` | Resolves `dataSource` fields by calling DAL functions |
| `lib/tenant/context.ts` | `getChurchId()` — reads `x-tenant-id` header or env var |
| `components/website/sections/registry.tsx` | Maps SectionType enum → React component |
| `components/website/sections/section-wrapper.tsx` | Wraps each section with padding, theme, animation |
| `components/website/theme/theme-provider.tsx` | Injects CSS custom properties from ThemeCustomization |
| `components/website/font-loader.tsx` | Generates `<link>` or `@font-face` for tenant fonts |

---

## 2. Data Flow: How Sections Receive Data

There are **two categories** of sections:

### A. Static Sections (Content from JSONB)

These sections render directly from the `PageSection.content` JSON column. No additional data fetching needed.

```
PageSection.content (JSONB) → SectionWrapper → Component(content, colorScheme, ...)
```

**Examples**: HeroBanner, QuoteBanner, CTABanner, ActionCardGrid, DirectoryList, MediaText, TextImageHero, FormSection, FAQSection, PillarsSection, TimelineSection, etc.

The CMS admin edits these fields directly via the page builder UI. The JSONB structure mirrors the component's props interface.

### B. Dynamic Sections (Content + Data Resolution)

These sections have a `dataSource` field in their JSONB content. The `resolveSectionData()` function reads this field, calls the appropriate DAL function, and merges the result into the content before passing to the component.

```
PageSection.content = { heading: "...", dataSource: "latest-message" }
  ↓ resolveSectionData(churchId, sectionType, content)
  ↓ Calls getLatestMessage(churchId) from DAL
  ↓ Returns { content: { ...content, sermon: { title, speaker, ... } } }
  ↓ Component receives fully-populated content object
```

**Supported `dataSource` values:**

| dataSource | DAL Function | Used By |
|---|---|---|
| `latest-message` | `getLatestMessage()` | SpotlightMedia |
| `featured-events` | `getFeaturedEvents()` | HighlightCards |
| `upcoming-events` | `getUpcomingEvents()` | EventCalendar, UpcomingEvents |
| `ministry-events` | `getUpcomingEvents()` + filter | Ministry pages |
| `latest-videos` | `getVideos()` | MediaGrid |
| `all-messages` | _(self-fetching RSC)_ | AllMessages |
| `all-events` | _(self-fetching RSC)_ | AllEvents |
| `all-bible-studies` | `getBibleStudies()` | AllBibleStudies |
| `all-videos` | `getVideos()` | AllVideos |
| `latest-daily-bread` | `getTodaysDailyBread()` | DailyBreadFeature |

### C. Self-Fetching Server Components

`AllMessages` and `AllEvents` are async Server Components that receive `churchId` and fetch their own data internally. They don't use `resolveSectionData()`.

---

## 3. Section Registry

The registry (`components/website/sections/registry.tsx`) maps every `SectionType` enum value to a React component:

```typescript
const SECTION_REGISTRY: Record<SectionType, ComponentType> = {
  HERO_BANNER: HeroBannerSection,
  MEDIA_TEXT: MediaTextSection,
  SPOTLIGHT_MEDIA: SpotlightMediaSection,
  // ... 35+ entries
}
```

When a `PageSection` record has `sectionType: "HERO_BANNER"`, the registry resolves to `HeroBannerSection` and renders it with the resolved content.

---

## 4. Section Component Prop Interface

All section components in the root project follow a **standardized prop interface**:

```typescript
interface SectionProps {
  content: Record<string, unknown>  // JSONB content, section-specific shape
  colorScheme?: 'LIGHT' | 'DARK'   // From PageSection.colorScheme
  enableAnimations?: boolean         // From PageSection.enableAnimations
  churchId?: string                  // For self-fetching components
  resolvedData?: Record<string, unknown>  // From resolveSectionData()
}
```

**vs. laubf-test (source of truth) pattern:**

```typescript
interface SectionProps {
  settings: {
    id: string
    visible: boolean
    colorScheme: 'light' | 'dark'
    enableAnimations: boolean
    content: { /* section-specific fields */ }
  }
  // Some sections also receive data arrays:
  events?: Event[]
  messages?: Message[]
}
```

The root project flattens the `settings` wrapper — `content` is passed directly, and `colorScheme` / `enableAnimations` are separate props. The `SectionWrapper` handles `visible`, `paddingY`, and `containerWidth`.

---

## 5. Navbar Architecture & Edge Cases

The navbar is the most complex layout component. It uses a **mega menu** pattern with multiple structural elements per dropdown.

### 5.1 Navigation Data Structure

```
Navigation
├── Dropdowns (3): "Our Church", "Ministries", "Resources"
│   ├── Sections (2-4 per dropdown): grouped columns of links
│   │   ├── title: string (section header, e.g., "About")
│   │   ├── items[]: { label, href, description?, icon?, isExternal? }
│   │   ├── compact?: boolean (for Quick Links section — 2-col grid)
│   │   ├── columns?: number (grid column count override)
│   │   ├── footerLink?: { label, href } (bottom link per section)
│   │   └── width?: string (CSS width override)
│   ├── featuredCard?: { image, title, description, href }
│   ├── overviewLink?: { label, description, href }
│   └── offsetX?: number (dropdown horizontal position offset)
├── Direct Links (1): "Giving" (no dropdown)
├── CTA Button: "I'm New" (right side)
└── Member Login Link: small text link
```

### 5.2 Database Mapping (MenuItem Model)

The `MenuItem` model stores this hierarchy:

| laubf-test Field | MenuItem Column | Notes |
|---|---|---|
| dropdown.label | `label` | Top-level item (parentId=null) |
| section.title | `groupLabel` | On child items, groups them visually |
| item.label | `label` | Child item |
| item.href | `href` | Navigation URL |
| item.description | `description` | Shown under label in wide columns |
| item.icon | `iconName` | Lucide icon name string |
| item.isExternal | `isExternal` | Shows external arrow icon |
| featuredCard.image | `featuredImage` | On parent item |
| featuredCard.title | `featuredTitle` | On parent item |
| featuredCard.description | `featuredDescription` | On parent item |
| featuredCard.href | `featuredHref` | On parent item |
| overviewLink | stored as special child | `sortOrder: 999` convention |
| compact mode | via `groupLabel` convention | e.g., groupLabel starts with "compact:" |

### 5.3 Edge Cases & Scalability

**Fewer items than LA UBF:**
- A church with 1 dropdown + 2 direct links → mega menu degrades to simple dropdown
- If a dropdown has only 1 section with 2-3 items → render as standard dropdown (no featured card, no dividers)
- Minimum viable nav: logo + 3 direct links + CTA button

**More items than LA UBF:**
- Additional dropdowns (4+) → horizontal scroll or "More" overflow menu on desktop
- Deep nesting (3+ levels) → not supported by current design; flatten to 2 levels
- 10+ items per section → scrollable section column with max-height

**Different structures:**
- No dropdowns at all → simple horizontal link bar
- All direct links → no mega menu, just nav items
- Single mega menu → full-width dropdown panel
- Mixed: some dropdowns + some direct links → current LA UBF pattern

**Mobile adaptation:**
- All dropdowns → accordion sections in mobile drawer
- Featured cards → hidden on mobile (too much visual weight)
- Compact sections → rendered as standard list on mobile
- CTA button → shown in mobile drawer footer
- Overview links → shown at bottom of each accordion section

### 5.4 Logo Behavior

- **Over hero section** (not scrolled): Light/inverted logo (`logoInvertedUrl`)
- **Scrolled past hero**: Dark logo (`logoUrl`) with white background navbar
- **Transition**: Smooth opacity crossfade on scroll threshold

---

## 6. Font System

### 6.1 LA UBF Fonts (Source of Truth)

| CSS Variable | Font | Source | Usage |
|---|---|---|---|
| `--font-sans` | Helvetica Neue | Custom `@font-face` (3 weights: 400, 500, 700) | Body text, UI elements |
| `--font-serif` | DM Serif Display | Google Fonts (weight: 400, italic) | Heading accents, display |
| `--font-display` | DM Serif Display | Same as serif | Hero headings |
| `--font-script` | Strude | Custom `@font-face` | Script/decorative headings |

### 6.2 Typography Scale

The design system defines 13 text utilities in `globals.css`:

| Utility | Mobile | Desktop | Font | Usage |
|---|---|---|---|---|
| `.text-h1` | 32px/110% | 48px/110% | sans, 700 | Page headings |
| `.text-h2` | 24px/120% | 36px/120% | sans, 700 | Section headings |
| `.text-h3` | 18px/130% | 24px/130% | sans, 600 | Subsection headings |
| `.text-h4` | 16px/140% | 18px/140% | sans, 600 | Card headings |
| `.text-body-1` | 16px/160% | 18px/160% | sans, 400 | Primary body |
| `.text-body-2` | 14px/160% | 16px/160% | sans, 400 | Secondary body |
| `.text-body-3` | 13px/150% | 14px/150% | sans, 400 | Small body |
| `.text-button-1` | 14px/100% | 16px/100% | sans, 600 | Primary buttons |
| `.text-button-2` | 12px/100% | 13px/100% | sans, 600 | Secondary buttons |
| `.text-nav` | 14px/100% | 14px/100% | sans, 500 | Navigation items |
| `.text-pill` | 11px/100% | 12px/100% | sans, 600 | Pill/badge labels |
| `.text-overline` | 11px/150% | 12px/150% | sans, 600 | Overline labels |
| `.text-hero-accent` | 28px/120% | 40px/120% | serif (italic) | Hero accent lines |
| `.text-display-heading` | 40px/100% | 80px/100% | serif (italic) | Display headings |
| `.text-script-heading` | 28px/120% | 40px/120% | script | Decorative headings |

### 6.3 Container Utilities

| Utility | Width | Max Width | Padding |
|---|---|---|---|
| `.container-standard` | 85% | 1200px | auto margins |
| `.container-narrow` | 85% | 840px | auto margins |
| `.container-nav` | 100% → 90% (lg) | 1140px | 1.25rem → 0 (lg) |

### 6.4 Multi-Tenant Font Loading

The `FontLoader` component supports both patterns:
1. **Google Fonts**: Builds `<link>` tag dynamically from `ThemeCustomization.headingFont` / `bodyFont`
2. **Custom fonts**: Generates `@font-face` from `ThemeCustomization.tokenOverrides.customFonts[]`

LA UBF uses custom fonts (Helvetica Neue, Strude) + Google Fonts (DM Serif Display). The font loader must handle this mixed pattern.

---

## 7. Color System

### 7.1 Color Palette (CSS Variables)

```css
/* Blacks */
--color-black-1: #111111    /* Primary dark bg */
--color-black-2: #1A1A1A    /* Secondary dark bg */
--color-black-3: #2A2A2A    /* Tertiary dark */

/* Whites */
--color-white-0: #FFFFFF    /* Pure white */
--color-white-1: #FAFAFA    /* Off-white bg */
--color-white-1-5: #F5F5F5  /* Light gray bg */
--color-white-2: #E5E5E5    /* Muted text on dark */
--color-white-3: #999999    /* Secondary text on dark */

/* Brand */
--color-brand-1: #2563EB    /* Primary brand (blue) */
--color-brand-2: #1E3A5F    /* Dark brand / navy */

/* Semantic */
--color-surface-page: var(--color-white-1)
--color-surface-dark: var(--color-black-1)
--color-border-light: #E5E5E5
```

### 7.2 Section Color Schemes

Each `PageSection` has a `colorScheme` field (`LIGHT` or `DARK`). The `SectionWrapper` applies the corresponding theme:

- **LIGHT**: white background, dark text
- **DARK**: black-1 background, white text

Components use `themeTokens[colorScheme]` to get the appropriate CSS classes for text colors, backgrounds, borders, etc.

---

## 8. Animation System

### 8.1 AnimateOnScroll

The primary animation wrapper uses Intersection Observer:

```tsx
<AnimateOnScroll animation="fade-up" staggerIndex={0} staggerBaseMs={100}>
  <div>Content fades up when scrolled into view</div>
</AnimateOnScroll>
```

**Animations available**: `fade-up`, `fade-left`, `fade-right`, `scale-up`, `fade-in`

**Stagger**: Items with increasing `staggerIndex` values animate with progressive delays.

### 8.2 CSS Keyframe Animations

Defined in `globals.css`:
- `dropdown-in` — navbar dropdown entrance
- `hero-fade-up` / `hero-fade-in` — hero section entrance
- `scale-in` — scale from 95% to 100%
- `slide-in-left` / `slide-in-right` — horizontal slides
- `pulse-glow` — accent glow effect

### 8.3 Motion Library

Some sections use `motion/react` (from Framer Motion) for physics-based animations:
- `MediaTextSection` — rotating image wheel
- `StatementSection` — scroll-tracked color transitions
- `DirectoryListSection` — parallax scroll effects

---

## 9. Complete Section Catalog (38 Sections)

See `docs/website-rendering/09-section-component-guide.md` for the full catalog with CMS field specifications, comment header format, and migration instructions.

### By Category

| Category | Sections | Count |
|---|---|---|
| **Hero & Banner** | HeroBanner, PageHero, TextImageHero, MinistryHero, EventsHero, QuoteBanner | 6 |
| **Content Grids** | HighlightCards, ActionCardGrid, MediaGrid, AllMessages, AllBibleStudies, AllVideos, AllEvents, DailyBreadFeature | 8 |
| **Feature & Showcase** | SpotlightMedia, MediaText, Timeline, Pillars, FeatureBreakdown, Statement, AboutDescription | 7 |
| **Events & Schedule** | UpcomingEvents, EventCalendar, QuickLinks, RecurringMeetings, RecurringSchedule, MinistrySchedule | 6 |
| **Directory & Gallery** | DirectoryList, PhotoGallery, FormSection, PathwayCard, CampusCardGrid | 5 |
| **Team & Ministry** | MeetTeam, MinistryIntro, Newcomer, CTABanner | 4 |
| **Navigation** | Footer, LocationDetail | 2 |

### Static vs. Dynamic

| Type | Sections | Data Source |
|---|---|---|
| **Static** (JSONB only) | 28 sections | Content edited in CMS page builder |
| **Dynamic** (dataSource) | 6 sections | `resolveSectionData()` fetches from DAL |
| **Self-fetching RSC** | 2 sections | AllMessages, AllEvents fetch own data |
| **Layout** | 2 sections | Navbar, Footer rendered in layout |
