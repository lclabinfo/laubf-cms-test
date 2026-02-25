# Section Component Guide

## Comment Header Format, Migration Process, and Complete Section Catalog

---

## 1. Comment Header Format

Every section component in `laubf-test/src/components/sections/` follows a standardized comment header at the top of the file. This header serves as inline documentation for the CMS admin, database schema, and rendering behavior.

### Header Structure

```
/*
 * CMS SETTINGS:
 * -- Content (BASIC) --
 *   fieldName: type -- description
 * -- Buttons (BASIC) --
 *   buttonName: { label, href, visible }
 * -- Media (BASIC) --
 *   imageName: { src, alt }
 * -- Animation (ADVANCED) --
 *   enableAnimations?: boolean (default true) -- description of animations
 * -- Layout (ADVANCED) --
 *   visible, colorScheme, paddingY, containerWidth
 *
 * DB SCHEMA: table_name (column1, column2, ...)
 * DB SCHEMA: child_table (id, parent_id, columns..., sort_order)
 */
```

### Section Categories

Headers organize settings into labeled groups. The categories used are:

| Category | Priority | Description |
|---|---|---|
| **Content (BASIC)** | Required | Headings, text, overlines — the main content fields |
| **Buttons (BASIC)** | Common | CTA buttons with `{ label, href, visible }` shape |
| **Media (BASIC)** | Common | Images, videos, backgrounds with `{ src, alt }` shape |
| **Data** | Dynamic sections only | Data arrays passed from the page (e.g., `messages: Message[]`) |
| **Items / FAQ Items / Paragraphs** | Varies | Repeated sub-elements (FAQ answers, pillar items, etc.) |
| **Animation (ADVANCED)** | Optional | `enableAnimations` flag and description of scroll/entry animations |
| **Layout (ADVANCED)** | Standard | `visible`, `colorScheme`, `paddingY`, `containerWidth` |

**Variant notation**: Some headers use `--` dashes and some use Unicode em dashes (`──`). Both are equivalent. The format is not strictly enforced but follows the pattern above.

### DB SCHEMA Lines

The `DB SCHEMA` lines document the hypothetical normalized database tables for each section type. In the actual implementation, section content is stored as JSONB in the `PageSection.content` column (see doc 03). The DB SCHEMA comments serve as:

1. A reference for what fields the section needs
2. Documentation for child/repeated elements (items with `sort_order`)
3. A guide for building CMS admin forms (Phase C)

Example:
```
 * DB SCHEMA: faq_sections (id, heading, show_icon, visible, color_scheme)
 * DB SCHEMA: faq_items (id, section_id, question, answer, sort_order)
```

This means the section needs a `heading`, `showIcon` boolean, and an array of `{ question, answer }` items in its JSONB content.

---

## 2. Migration Process: laubf-test to Root Project

### Overview

Section components are migrated from `laubf-test/src/components/sections/` to `components/website/sections/` in the root project. The migration changes how data flows into the component but preserves all visual rendering.

### Step-by-Step Migration

#### Step 1: Read the Source Component

Read the full source file in `laubf-test/src/components/sections/`. Note:
- What imports it uses (shared components, types, theme, utils)
- Whether it receives data as props or is purely content-driven
- Whether it uses `"use client"` (most do, for interactivity)
- What the comment header documents

#### Step 2: Create the Target File

Create a new file in `components/website/sections/` using kebab-case naming:

| laubf-test filename | Root project filename |
|---|---|
| `HeroBannerSection.tsx` | `hero-banner.tsx` |
| `AllMessagesSection.tsx` | `all-messages.tsx` |
| `FAQSection.tsx` | `faq.tsx` |
| `EventCalendarSection.tsx` | `event-calendar.tsx` |

#### Step 3: Update Imports

| laubf-test import | Root project import |
|---|---|
| `@/lib/theme` | `@/lib/theme` (recreate or import from shared) |
| `@/lib/types/sections` | Define types inline or in `@/lib/types/sections` |
| `@/lib/utils` | `@/lib/utils` (already exists in root) |
| `@/components/shared/SectionContainer` | `@/components/website/sections/section-wrapper` |
| `@/components/shared/AnimateOnScroll` | Migrate shared component to `@/components/website/shared/` |
| `@/components/shared/CTAButton` | Migrate shared component to `@/components/website/shared/` |
| `@/components/layout/icons` | Migrate icon components or use `lucide-react` directly |
| `@/components/ui/*` | `@/components/ui/*` (shadcn/ui already in root) |
| `lucide-react` | `lucide-react` (already in root) |

#### Step 4: Adapt the Props Interface

In laubf-test, components receive a `settings` prop with the full section configuration:

```typescript
// laubf-test pattern
export default function FAQSection(props: { settings: FAQSectionProps }) {
  const { settings } = props;
  const { content } = settings;
  // ...
}
```

In the root project, components receive JSONB `content` as props, plus layout settings from the SectionWrapper:

```typescript
// Root project pattern — static section
interface FAQSectionContent {
  heading: string;
  showIcon: boolean;
  items: { question: string; answer: string }[];
}

interface Props {
  content: FAQSectionContent;
  enableAnimations: boolean;
}

export default function FAQSection({ content, enableAnimations }: Props) {
  // Layout (colorScheme, paddingY, visible) is handled by SectionWrapper
}
```

```typescript
// Root project pattern — dynamic section
interface AllMessagesContent {
  heading: string;
}

interface Props {
  content: AllMessagesContent;
  churchId: string;
  enableAnimations: boolean;
}

export default async function AllMessagesSection({ content, churchId }: Props) {
  const messages = await getMessages(churchId);
  // ...
}
```

#### Step 5: Handle the SectionWrapper

In laubf-test, `SectionContainer` wraps most sections and handles:
- Visibility toggle (`settings.visible`)
- Color scheme context (`SectionThemeContext.Provider`)
- Padding Y (`py-*` classes)
- Container width (`container-standard`, `container-narrow`, `w-full`)

In the root project, `section-wrapper.tsx` handles these same concerns, reading from the `PageSection` database record:

```typescript
// section-wrapper.tsx reads from PageSection record:
// - colorScheme (ColorScheme enum)
// - paddingY (JSONB settings)
// - containerWidth (JSONB settings)
// - isVisible (boolean)
```

The migrated component no longer needs to handle layout — it focuses purely on rendering content.

#### Step 6: Update the Registry

After migration, add the component to `components/website/sections/registry.tsx`:

```typescript
import { SectionType } from '@/lib/generated/prisma/client';
import FAQSection from './faq';

export const sectionRegistry: Record<SectionType, React.ComponentType<any>> = {
  // ...
  FAQ_SECTION: FAQSection,
  // ...
};
```

---

## 3. Static vs. Dynamic Sections

### Static Sections

Content lives entirely in the JSONB payload stored in `PageSection.content`. No database queries at render time. These are fast, fully cacheable, and render from the JSONB props alone.

**Characteristics:**
- All content is in the `content` JSONB prop
- No `churchId` prop needed
- Can remain as `"use client"` components for interactivity (accordions, carousels, etc.)
- Only change when an admin edits the page in the website builder

### Dynamic Sections

The JSONB payload contains configuration (heading text, display options), but the actual content comes from CMS tables at render time. These sections need a `churchId` prop and make DAL calls.

**Characteristics:**
- Receive `churchId` as a prop
- Call DAL functions (e.g., `getMessages(churchId)`)
- In the root project, the page-level RSC fetches the data and passes it down
- Change when CMS content is created/edited/deleted
- Cache invalidation is tied to the content entity (messages, events, etc.)

---

## 4. JSONB Content to Component Props Mapping

The `PageSection.content` JSONB maps to component props. The JSONB structure is documented in `docs/database/03-website-schema.md` section 4 and verified against the TypeScript interfaces in `laubf-test/src/lib/types/sections.ts`.

Example mapping for `HERO_BANNER`:

```
PageSection record:
  sectionType: HERO_BANNER
  content: {
    "heading": { "line1": "Welcome to", "line2": "LA UBF" },
    "subheading": "Where people find...",
    "primaryButton": { "label": "I'm new", "href": "/im-new", "visible": true },
    "secondaryButton": { "label": "Events", "href": "/events", "visible": true },
    "backgroundImage": { "src": "/videos/hero.mp4", "alt": "Community" }
  }

→ HeroBannerSection receives: content.heading, content.subheading, etc.
```

---

## 5. SectionWrapper Contract

The `SectionWrapper` component (equivalent to laubf-test's `SectionContainer`) provides the standard layout for every section. It reads settings from the `PageSection` database record.

### Props

| Prop | Type | Source | Description |
|---|---|---|---|
| `colorScheme` | `"light" \| "dark"` | `PageSection.colorScheme` | Sets the color scheme context for all children |
| `paddingY` | `"none" \| "compact" \| "default" \| "spacious"` | `PageSection` settings JSONB | Controls vertical padding |
| `containerWidth` | `"narrow" \| "standard" \| "full"` | `PageSection` settings JSONB | Controls content max-width |
| `isVisible` | `boolean` | `PageSection.isVisible` | Toggles entire section rendering |
| `id` | `string` | Generated from section type + index | HTML `id` attribute for anchor links |

### Padding Values

| Value | Classes |
|---|---|
| `none` | `py-0` |
| `compact` | `py-16 lg:py-20` |
| `default` | `py-24 lg:py-30` |
| `spacious` | `py-32 lg:py-40` |

### Container Widths

| Value | Classes | Max Width |
|---|---|---|
| `narrow` | `container-narrow` | 960px |
| `standard` | `container-standard` | 1200px |
| `full` | `w-full` | None |

### Behavior

1. If `isVisible` is `false`, returns `null` (section is hidden)
2. Wraps children in a `SectionThemeContext.Provider` with the `colorScheme`
3. Applies background color from the color scheme tokens
4. Applies vertical padding from `paddingY`
5. Wraps children in a container div with the specified width

---

## 6. Complete Section Catalog (38 Sections)

### Hero Sections (5)

| # | Component | SectionType Enum | Type | Data Dependencies |
|---|---|---|---|---|
| 1 | `HeroBannerSection` | `HERO_BANNER` | Static | None (JSONB content only) |
| 2 | `PageHeroSection` | `PAGE_HERO` | Static | None |
| 3 | `TextImageHeroSection` | `TEXT_IMAGE_HERO` | Static | None |
| 4 | `EventsHeroSection` | `EVENTS_HERO` | Static | None |
| 5 | `MinistryHeroSection` | `MINISTRY_HERO` | Static | None |

### Content Sections (8)

| # | Component | SectionType Enum | Type | Data Dependencies |
|---|---|---|---|---|
| 6 | `MediaTextSection` | `MEDIA_TEXT` | Static | None |
| 7 | `MediaGridSection` | `MEDIA_GRID` | Static | None (videos in JSONB) |
| 8 | `SpotlightMediaSection` | `SPOTLIGHT_MEDIA` | Dynamic | Latest Message (or by slug) |
| 9 | `PhotoGallerySection` | `PHOTO_GALLERY` | Static | None |
| 10 | `QuoteBannerSection` | `QUOTE_BANNER` | Static | None |
| 11 | `CTABannerSection` | `CTA_BANNER` | Static | None |
| 12 | `AboutDescriptionSection` | `ABOUT_DESCRIPTION` | Static | None |
| 13 | `StatementSection` | `STATEMENT` | Static | None |

### Card Layout Sections (6)

| # | Component | SectionType Enum | Type | Data Dependencies |
|---|---|---|---|---|
| 14 | `ActionCardGridSection` | `ACTION_CARD_GRID` | Static | None |
| 15 | `HighlightCardsSection` | `HIGHLIGHT_CARDS` | Dynamic | Featured Events |
| 16 | `FeatureBreakdownSection` | `FEATURE_BREAKDOWN` | Static | None |
| 17 | `PathwayCardSection` | `PATHWAY_CARD` | Static | None |
| 18 | `PillarsSection` | `PILLARS` | Static | None |
| 19 | `NewcomerSection` | `NEWCOMER` | Static | None |

### List & Data Sections (8)

| # | Component | SectionType Enum | Type | Data Dependencies |
|---|---|---|---|---|
| 20 | `AllMessagesSection` | `ALL_MESSAGES` | Dynamic | Message + Speaker + Series |
| 21 | `AllEventsSection` | `ALL_EVENTS` | Dynamic | Event + Ministry + Campus |
| 22 | `AllBibleStudiesSection` | `ALL_BIBLE_STUDIES` | Dynamic | BibleStudy + Speaker + Series |
| 23 | `AllVideosSection` | `ALL_VIDEOS` | Dynamic | Video |
| 24 | `UpcomingEventsSection` | `UPCOMING_EVENTS` | Dynamic | Event (upcoming, limited) |
| 25 | `EventCalendarSection` | `EVENT_CALENDAR` | Dynamic | Event (date range) |
| 26 | `RecurringMeetingsSection` | `RECURRING_MEETINGS` | Dynamic | Event (isRecurring = true) |
| 27 | `RecurringScheduleSection` | `RECURRING_SCHEDULE` | Static | None (schedule in JSONB) |

### Ministry-Specific Sections (6)

| # | Component | SectionType Enum | Type | Data Dependencies |
|---|---|---|---|---|
| 28 | `MinistryIntroSection` | `MINISTRY_INTRO` | Static | None |
| 29 | `MinistryScheduleSection` | `MINISTRY_SCHEDULE` | Static | None |
| 30 | `CampusCardGridSection` | `CAMPUS_CARD_GRID` | Static | None |
| 31 | `DirectoryListSection` | `DIRECTORY_LIST` | Static | None |
| 32 | `MeetTeamSection` | `MEET_TEAM` | Static | None |
| 33 | `LocationDetailSection` | `LOCATION_DETAIL` | Static | None |

### Interactive Sections (3)

| # | Component | SectionType Enum | Type | Data Dependencies |
|---|---|---|---|---|
| 34 | `FAQSection` | `FAQ_SECTION` | Static | None |
| 35 | `FormSection` | `FORM_SECTION` | Static | None (form config in JSONB) |
| 36 | `TimelineSection` | `TIMELINE_SECTION` | Static | None |

### Navigation & Layout Sections (2)

| # | Component | SectionType Enum | Type | Data Dependencies |
|---|---|---|---|---|
| 37 | `FooterSection` | `FOOTER` | Static | SiteSettings (via layout, not per-page) |
| 38 | `QuickLinksSection` | `QUICK_LINKS` | Static | None |

> **Note**: `Navbar` is listed in the `SectionType` enum but is rendered in the layout, not as a per-page section. Similarly, `FooterSection` is rendered in the layout. Both read from `Menu`, `SiteSettings`, and `ThemeCustomization` at the layout level.

### Summary

| Category | Total | Static | Dynamic |
|---|---|---|---|
| Hero | 5 | 5 | 0 |
| Content | 8 | 7 | 1 |
| Card Layout | 6 | 5 | 1 |
| List & Data | 8 | 1 | 7 |
| Ministry | 6 | 6 | 0 |
| Interactive | 3 | 3 | 0 |
| Navigation & Layout | 2 | 2 | 0 |
| **Total** | **38** | **29** | **9** |

---

## 7. Dynamic Section Data Dependencies

Dynamic sections require database queries at render time. The page-level RSC (or the section itself if made async) fetches this data.

| Section | DAL Function | Tables Queried |
|---|---|---|
| `SPOTLIGHT_MEDIA` | `getLatestMessage(churchId)` or `getMessageBySlug(churchId, slug)` | Message, Speaker, MessageSeries, Series |
| `ALL_MESSAGES` | `getMessages(churchId)` | Message, Speaker, MessageSeries, Series |
| `ALL_EVENTS` | `getEvents(churchId)` | Event, Ministry, Campus |
| `ALL_BIBLE_STUDIES` | `getBibleStudies(churchId)` | BibleStudy, Speaker, Series, BibleStudyAttachment |
| `ALL_VIDEOS` | `getVideos(churchId)` | Video |
| `UPCOMING_EVENTS` | `getUpcomingEvents(churchId, limit)` | Event, Ministry, Campus |
| `HIGHLIGHT_CARDS` | `getFeaturedEvents(churchId, limit)` | Event |
| `RECURRING_MEETINGS` | `getRecurringEvents(churchId)` | Event |
| `EVENT_CALENDAR` | `getEvents(churchId, { dateFrom, dateTo })` | Event |

---

## 8. Shared Components Used by Sections

Many section components depend on shared UI components from `laubf-test/src/components/shared/`. These must also be migrated to the root project.

| Shared Component | Used By | Purpose |
|---|---|---|
| `SectionContainer` | Nearly all sections | Layout wrapper (becomes `section-wrapper` in root) |
| `AnimateOnScroll` | Most sections | Intersection Observer scroll animations |
| `CTAButton` | HeroBanner, MediaText, CTABanner, PageHero, etc. | Primary/secondary CTA buttons |
| `OverlineLabel` | MediaText, UpcomingEvents, CTABanner, etc. | Uppercase overline text |
| `VideoThumbnail` | SpotlightMedia, AboutDescription, MediaGrid | YouTube thumbnail with play overlay |
| `FilterToolbar` | AllMessages, AllEvents, AllBibleStudies, AllVideos | Tabs, search, filters, sort controls |
| `MessageCard` | AllMessages | Message card with thumbnail, metadata |
| `EventGridCard` | AllEvents, UpcomingEvents | Event card with date badge |
| `EventListItem` | EventCalendar | Compact event row |
| `EventCalendarGrid` | EventCalendar | Monthly calendar grid |

---

## 9. Migration Priority Order

Components should be migrated in the following order based on page importance:

### Batch 1 — P0: Homepage + Core Content Pages
1. `HeroBannerSection` (homepage hero)
2. `MediaTextSection` (homepage, about)
3. `SpotlightMediaSection` (homepage — dynamic)
4. `HighlightCardsSection` (homepage — dynamic)
5. `UpcomingEventsSection` (homepage — dynamic)
6. `CTABannerSection` (homepage, multiple pages)
7. `AllMessagesSection` (messages page — dynamic)
8. `AllEventsSection` (events page — dynamic)
9. `EventCalendarSection` (events page — dynamic)
10. `RecurringMeetingsSection` (events page — dynamic)

### Batch 2 — P1: Content + Ministry Pages
11. `AllBibleStudiesSection` (bible-study page — dynamic)
12. `AllVideosSection` (videos page — dynamic)
13. `MediaGridSection` (homepage)
14. `EventsHeroSection` (events page)
15. `MinistryHeroSection` (ministry pages)
16. `MinistryIntroSection` (ministry pages)
17. `MinistryScheduleSection` (ministry pages)
18. `CampusCardGridSection` (ministries page)
19. `MeetTeamSection` (ministry pages)
20. `LocationDetailSection` (campus pages)

### Batch 3 — P2: About, I'm New, Misc
21. `PageHeroSection` (about, I'm new)
22. `TextImageHeroSection` (about)
23. `AboutDescriptionSection` (about)
24. `PillarsSection` (about)
25. `StatementSection` (about)
26. `NewcomerSection` (I'm new)
27. `FeatureBreakdownSection` (I'm new)
28. `PathwayCardSection` (I'm new)
29. `TimelineSection` (about)
30. `PhotoGallerySection` (about)
31. `FAQSection` (I'm new, about)
32. `FormSection` (I'm new, contact)
33. `DirectoryListSection` (ministries)
34. `RecurringScheduleSection` (ministry pages)
35. `QuickLinksSection` (I'm new)

### Batch 4 — Layout + Remaining
36. `QuoteBannerSection` (homepage)
37. `ActionCardGridSection` (homepage)
38. `FooterSection` (layout — not per-page)

---

## 10. File Reference

| Path | Status | Description |
|---|---|---|
| `laubf-test/src/components/sections/` | EXISTS (38 files) | Source section components |
| `laubf-test/src/components/shared/` | EXISTS | Source shared components (SectionContainer, AnimateOnScroll, etc.) |
| `laubf-test/src/lib/types/sections.ts` | EXISTS | TypeScript interfaces for section props and JSONB content |
| `laubf-test/src/lib/theme.ts` | EXISTS | Theme tokens and color scheme context |
| `laubf-test/src/app/globals.css` | EXISTS | Typography utility classes referenced by sections |
| `docs/database/03-website-schema.md` | EXISTS | SectionType enum, JSONB examples, page templates |
| `docs/website-rendering/01-architecture.md` | EXISTS | Static vs dynamic section architecture |
| `components/website/sections/` | PARTIAL | Target directory — 6 sections migrated + placeholders for rest |
| `components/website/sections/registry.tsx` | EXISTS | Maps all 40 SectionType enum values to components (6 real, 34 placeholders) |
| `components/website/sections/section-wrapper.tsx` | EXISTS | SectionWrapper with colorScheme, paddingY, containerWidth, visible |
| `components/website/sections/hero-banner.tsx` | EXISTS | Migrated HeroBanner section |
| `components/website/sections/media-text.tsx` | EXISTS | Migrated MediaText section |
| `components/website/sections/spotlight-media.tsx` | EXISTS | Migrated SpotlightMedia section |
| `components/website/sections/cta-banner.tsx` | EXISTS | Migrated CTABanner section |
| `components/website/sections/all-messages.tsx` | EXISTS | Migrated AllMessages dynamic section (async RSC) |
| `components/website/sections/all-messages-client.tsx` | EXISTS | Client component for AllMessages interactivity |
| `components/website/sections/all-events.tsx` | EXISTS | Migrated AllEvents dynamic section (async RSC) |
| `components/website/sections/all-events-client.tsx` | EXISTS | Client component for AllEvents interactivity |
| `components/website/shared/` | EXISTS | Migrated shared components (theme-tokens, animate-on-scroll, section-container, cta-button, overline-label, video-thumbnail) |
| `components/website/theme/theme-provider.tsx` | EXISTS | ThemeProvider with CSS variable injection |
| `components/website/font-loader.tsx` | EXISTS | FontLoader RSC for Google/custom font loading |
| `lib/tenant/context.ts` | EXISTS | `getChurchId()` with middleware header + env var fallback |

### Route Group Files

| Path | Status | Description |
|---|---|---|
| `app/(website)/layout.tsx` | EXISTS | Wraps pages with ThemeProvider + FontLoader. Navbar/footer are placeholder comments (to be built from Menu/SiteSettings data) |
| `app/(website)/[[...slug]]/page.tsx` | EXISTS | Catch-all route: resolves churchId, fetches Page + sections, renders via registry + SectionWrapper |

### Migration Progress (Phase B.1 COMPLETE, B.2 COMPLETE — 40/42 migrated)

40 out of 42 section types have real component implementations. Only 2 remain as placeholders:

| Placeholder | Reason |
|---|---|
| `NAVBAR` | Rendered in the layout, not as a per-page section. Placeholder is intentional. |
| `DAILY_BREAD_FEATURE` | No source implementation exists in laubf-test. |

The registry (`registry.tsx`) maps all 42 `SectionType` enum values. The 2 placeholder sections render a development-only yellow box showing the section type name (hidden in production).

### Design System CSS (Ported to Root)

The website design system CSS has been ported from `laubf-test/src/app/globals.css` to root `app/globals.css`. This includes:
- Color tokens (neutrals, brand, accent, semantic, surface)
- Typography utility classes (`text-h1` through `text-body-sm`, `text-hero-*`, `text-section-*`)
- Container width classes (`container-narrow`, `container-standard`)
- Animation keyframes and scroll-based animation utilities
- Font stack CSS variables (`--font-serif`, `--font-display`, `--font-script`)

The `motion` package (Framer Motion successor) is installed in the root project for animation support used by `AnimateOnScroll` and other interactive components.
