# LA UBF Component Architecture

> CMS-ready component system for the LA UBF church website
> Modeled after Shopify's section-schema pattern
> See `design-system.md` for design tokens and visual specifications

---

## Table of Contents

1. [Foundational Architecture](#1-foundational-architecture)
2. [Shared Components](#2-shared-components)
3. [Section Specifications](#3-section-specifications)
4. [CMS Architecture](#4-cms-architecture)
5. [Conventions & Patterns](#5-conventions--patterns)
6. [PageBuilder & Implementation](#6-pagebuilder--implementation)

---

## 1. Foundational Architecture

### 1.1 Architecture Overview

Every homepage section is a self-contained **Section Component** that receives all data, settings, and visibility flags through a single typed props object. Sections compose from a library of **Shared Components** (buttons, cards, pills). A centralized **theme context** communicates the current section's dark/light theme downward so context-inverted buttons resolve automatically.

Pastors interact with a Shopify-style CMS editor where each section exposes:
- **BASIC settings** (always visible): content fields, visibility toggles, color scheme
- **ADVANCED settings** (collapsed accordion): spacing, layout variants, animation

### 1.2 Directory Structure

```
src/
  components/
    sections/               # 11 homepage section components
      HeroSection.tsx
      WhoWeAreSection.tsx
      FeaturedEventsSection.tsx
      ScheduleSection.tsx
      SpiritualDirectionSection.tsx
      NextStepsSection.tsx
      CampusMinistriesSection.tsx
      ThisWeeksMessageSection.tsx
      FeaturedVideosSection.tsx
      VisitUsBannerSection.tsx
      FooterSection.tsx
    shared/                 # Reusable components
      CTAButton.tsx
      EventCard.tsx
      ImageCard.tsx
      FilterPill.tsx
      TypePill.tsx
      EventBadge.tsx
      EventListItem.tsx
      OverlineLabel.tsx
      VideoThumbnail.tsx
      SectionHeader.tsx
      SectionContainer.tsx
      ArrowButton.tsx
    ui/                     # Base primitives (shadcn pattern)
      button.tsx
      utils.ts
    layout/
      Navbar.tsx
      PageBuilder.tsx       # Orchestrates section ordering
  lib/
    types/
      cms.ts                # CMS content types
      sections.ts           # Section prop interfaces
      shared.ts             # Shared component interfaces
    theme.ts                # Theme context + inversion logic
    defaults.ts             # Default CMS values per section
    validators.ts           # Content validation rules
```

### 1.3 Theme System & Context Inversion

The design system uses a binary theme model. Each section declares its theme. All child components inherit this to resolve their context-inverted appearance automatically.

```typescript
// lib/theme.ts

import { createContext, useContext } from 'react';

export type SectionTheme = 'dark' | 'light';

export interface ThemeTokens {
  bg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnOutlineBorder: string;
  btnOutlineText: string;
  borderColor: string;
}

export const themeTokens: Record<SectionTheme, ThemeTokens> = {
  dark: {
    bg:               'bg-black-1',
    textPrimary:      'text-white-1',
    textSecondary:    'text-white-2',
    textMuted:        'text-white-3',
    btnPrimaryBg:     'bg-white-1',
    btnPrimaryText:   'text-black-1',
    btnOutlineBorder: 'border-white-1/30',
    btnOutlineText:   'text-white-1',
    borderColor:      'border-white-1/10',
  },
  light: {
    bg:               'bg-white-1',
    textPrimary:      'text-black-1',
    textSecondary:    'text-black-2',
    textMuted:        'text-black-3',
    btnPrimaryBg:     'bg-black-1',
    btnPrimaryText:   'text-white-1',
    btnOutlineBorder: 'border-black-1/30',
    btnOutlineText:   'text-black-1',
    borderColor:      'border-border-light',
  },
};

export const SectionThemeContext = createContext<SectionTheme>('light');

export function useSectionTheme(): ThemeTokens {
  const theme = useContext(SectionThemeContext);
  return themeTokens[theme];
}

export function useRawSectionTheme(): SectionTheme {
  return useContext(SectionThemeContext);
}
```

**How button inversion works:** `CTAButton` calls `useSectionTheme()` internally. When rendered inside a dark section, it gets `btnPrimaryBg: 'bg-white-1'` and `btnPrimaryText: 'text-black-1'`. Inside a light section, those flip. No manual color props needed.

### 1.4 Base Section Settings

Every section extends this interface:

```typescript
// lib/types/cms.ts

import type { SectionTheme } from '../theme';

export interface BaseSectionSettings {
  /** Unique section instance ID */
  id: string;

  /** Whether the entire section is visible on the page */
  visible: boolean;

  /** Color scheme — sections have a design-default that can be overridden */
  colorScheme: SectionTheme;

  /** ADVANCED: Vertical padding preset */
  paddingY?: 'compact' | 'default' | 'spacious';

  /** ADVANCED: Container width override */
  containerWidth?: 'standard' | 'narrow' | 'full';

  /** ADVANCED: Enable/disable scroll-triggered animations */
  enableAnimations?: boolean;

  /** CMS metadata (not user-editable) */
  _meta?: {
    lastEditedBy?: string;
    lastEditedAt?: string;
    sectionType: SectionType;
  };
}
```

### 1.5 Spacing & Container Token Maps

Pastors never see pixel values — they select from semantic labels:

```typescript
// lib/types/cms.ts

/** Vertical padding presets */
export const paddingYMap = {
  compact:  'py-16 lg:py-20',    // 64px → 80px
  default:  'py-24 lg:py-30',    // 96px → 120px
  spacious: 'py-32 lg:py-40',    // 128px → 160px
} as const;

/** Container width presets */
export const containerWidthMap = {
  standard: 'container-standard',  // max-w 1200px
  narrow:   'container-narrow',    // max-w 960px
  full:     'w-full px-0',         // full bleed
} as const;
```

| CMS Label | Desktop Padding | Use Case |
|-----------|----------------|----------|
| Compact   | 80px           | Dense layouts, secondary sections |
| Default   | 120px          | Standard section spacing |
| Spacious  | 160px          | Hero, feature emphasis |

### 1.6 Default Values Strategy

Every section ships with complete defaults so pastors can publish immediately. Defaults are co-located and merged at render time:

```typescript
// lib/defaults.ts

import type { HeroSectionSettings } from './types/sections';

export const heroDefaults: HeroSectionSettings = {
  id: 'hero-1',
  visible: true,
  colorScheme: 'dark',
  paddingY: 'default',
  enableAnimations: true,
  content: {
    heading: { line1: 'Welcome to', line2: 'LA UBF' },
    subheading: 'University Bible Fellowship of Los Angeles',
    primaryButton: { label: "I'm New", href: '/im-new', visible: true },
    secondaryButton: { label: 'Upcoming Events', href: '/events', visible: true },
    backgroundImage: { src: '/images/hero-default.jpg', alt: 'LA UBF Church' },
  },
  showSubheading: true,
  showOverlayGradient: true,
  useVideoBackground: false,
};

// Similar complete defaults for all 11 sections...
```

---

## 2. Shared Components

### 2.1 SectionContainer

Wraps every section. Provides theme context, visibility gating, spacing, and container width.

```typescript
interface SectionContainerProps {
  settings: BaseSectionSettings;
  /** Override background class (e.g., gradient for Spiritual Direction) */
  bgOverride?: string;
  children: React.ReactNode;
  className?: string;
}
```

**Behavior:**
- Returns `null` if `settings.visible === false`
- Wraps children in `SectionThemeContext.Provider` with `settings.colorScheme`
- Applies `themeTokens[colorScheme].bg` or `bgOverride`
- Applies `paddingYMap[settings.paddingY ?? 'default']`
- Wraps content in `containerWidthMap[settings.containerWidth ?? 'standard']`
- Conditionally wraps in Motion `<motion.section>` when `settings.enableAnimations`

### 2.2 CTAButton

Context-aware button that auto-inverts based on section theme.

```typescript
interface CTAButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  variant: 'primary' | 'secondary' | 'icon';
  size?: 'default' | 'small';
  /** Explicit theme override (otherwise uses SectionThemeContext) */
  theme?: SectionTheme;
  icon?: React.ReactNode;
  className?: string;
}
```

**CVA definition:**
```typescript
const ctaButtonVariants = cva(
  // Base: all variants
  'inline-flex items-center justify-center rounded-full font-sans transition-colors ease-smooth duration-300',
  {
    variants: {
      variant: {
        primary: 'shadow-[0_10px_15px_var(--color-brand-shadow),0_4px_6px_var(--color-brand-shadow)]',
        secondary: 'bg-transparent border shadow-[0_10px_15px_var(--color-brand-shadow),0_4px_6px_var(--color-brand-shadow)]',
        icon: 'rounded-full p-0',
      },
      size: {
        default: 'px-8 py-5 text-button-1',   // 32px 20px
        small: 'px-6 py-3 text-button-2',       // 24px 12px
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);
```

**Theme-resolved colors** (applied at render time via `useSectionTheme()`):
- `primary` on dark: `bg-white-1 text-black-1`
- `primary` on light: `bg-black-1 text-white-1`
- `secondary` on dark: `border-white-1/30 text-white-1`
- `secondary` on light: `border-black-1/30 text-black-1`
- `icon`: `56×56` or `48×48`, background resolves from theme

### 2.3 EventCard

```typescript
type EventCardSize = 'large' | 'small';

interface EventCardData {
  id: string;
  title: string;
  date: string;
  location?: string;
  imageUrl: string;
  imageAlt?: string;
  badge?: string;        // "UPCOMING", "FEATURED"
  href?: string;
}

interface EventCardProps {
  data: EventCardData;
  size: EventCardSize;
  className?: string;
}
```

| Variant | Dimensions | Content Padding | Title Style |
|---------|-----------|----------------|-------------|
| `large` | 590×500 | `p-12` | `text-h3` |
| `small` | 590×240 | `p-8` | `text-h4` |

**Shared behavior:**
- `rounded-xl` (12px)
- `bg-black-1` fallback behind image
- Full-cover image with gradient overlay (`from-black/70 to-transparent`)
- Content bottom-aligned
- EventBadge positioned at top of content area
- Always dark internal theme (image + gradient = dark context)

### 2.4 ImageCard

```typescript
interface ImageCardData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt?: string;
  href?: string;
}

interface ImageCardProps {
  data: ImageCardData;
  className?: string;
}
```

- 430×370 aspect ratio (responsive)
- `rounded-xl` (12px)
- Gradient overlay: `rgba(0,0,0,0) → rgba(0,0,0,0.71)`
- Content bottom-aligned, `p-8`
- Title max-width 302px
- 48×48 ArrowButton bottom-right
- Always dark internal context

### 2.5 FilterPill

```typescript
interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}
```

| State | Background | Text |
|-------|-----------|------|
| Active | `bg-black-1` | `text-white-1` |
| Inactive | `bg-white-2` | `text-black-3` |

Shared: `text-pill` (12px medium uppercase +0.02em), `rounded-full`, `px-3 py-2`

### 2.6 TypePill

```typescript
type EventType = 'meeting' | 'event';

interface TypePillProps {
  type: EventType;
  className?: string;
}
```

| Type | Background | Text |
|------|-----------|------|
| `meeting` | `bg-accent-green` (#009966) | `text-white-1` |
| `event` | `bg-accent-blue` (#155DFC) | `text-white-1` |

Shared: `text-pill`, `rounded-full`, `px-2 py-1.5`

### 2.7 EventBadge

```typescript
interface EventBadgeProps {
  label: string;         // "UPCOMING", "FEATURED"
  className?: string;
}
```

- `bg-black-1`, `border border-white-1`, `text-white-1`
- `text-pill`, `rounded-full`, `px-5 py-3`

### 2.8 EventListItem

```typescript
interface EventListItemData {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: EventType;
  location?: string;
  href?: string;
}

interface EventListItemProps {
  data: EventListItemData;
  onClick?: () => void;
  className?: string;
}
```

- Height: 83px
- Layout: `[date 48px] [gap-6] [info flex-1] [arrow 16px]`
- Date column: month (`text-pill` 14px) + day number (`text-body-1`)
- Info row 1: TypePill + time string
- Info row 2: title (`text-h4`)
- Bottom border: `border-border-light`

### 2.9 OverlineLabel

```typescript
interface OverlineLabelProps {
  text: string;
  className?: string;
}
```

- `text-overline` (14px, medium, uppercase, +0.01em)
- Color inherits from section theme (`textMuted`)

### 2.10 VideoThumbnail

```typescript
interface VideoThumbnailData {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration?: string;
}

interface VideoThumbnailProps {
  data: VideoThumbnailData;
  size?: 'featured' | 'grid';
  onClick?: () => void;
  className?: string;
}
```

- Aspect ratio: 16:9
- `rounded-xl` (12px)
- Play button: 144×144 for `featured`, 48×48 for `grid`
- Hover: slight scale + overlay dim

### 2.11 SectionHeader

```typescript
interface SectionHeaderProps {
  heading: string;
  ctaLabel?: string;
  ctaHref?: string;
  showCta?: boolean;
  className?: string;
}
```

- Layout: heading left, CTA link right (desktop), stacked (mobile)
- Heading: `text-h2`, color from theme
- CTA: `text-body-2` medium + underline + arrow icon

### 2.12 ArrowButton

```typescript
interface ArrowButtonProps {
  size?: 56 | 48;
  direction?: 'right' | 'left' | 'up' | 'down';
  className?: string;
  onClick?: () => void;
}
```

- Circular, `rounded-full`
- Icon: 20-22px arrow
- Background resolves from theme context

---

## 3. Section Specifications

---

### 3.1 HeroSection

**Purpose:** Full-viewport hero with background image/video, heading lockup, and dual CTA buttons.

| Property | Value |
|----------|-------|
| Figma Node | 396:368 |
| Default Theme | `dark` |
| Default Container | `full` (full-bleed) |

#### Content Interface

```typescript
interface HeroContent {
  heading: {
    line1: string;            // "Welcome to" — Helvetica Neue
    line2: string;            // "LA UBF" — DM Serif Text italic
  };
  subheading?: string;
  primaryButton: {
    label: string;            // "I'm New"
    href: string;
    visible: boolean;
  };
  secondaryButton: {
    label: string;            // "Upcoming Events"
    href: string;
    visible: boolean;
  };
  backgroundImage: {
    src: string;
    alt: string;
  };
  backgroundVideo?: {
    src: string;
    poster?: string;
  };
}
```

#### Settings Interface

```typescript
interface HeroSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'hero' };
  content: HeroContent;

  // BASIC: Visibility
  showSubheading: boolean;              // default: true
  showOverlayGradient: boolean;         // default: true
  useVideoBackground: boolean;          // default: false

  // ADVANCED
  overlayOpacity?: number;              // 0–100, default: 60
  contentAlignment?: 'bottom-left' | 'bottom-center' | 'center';  // default: 'bottom-left'
  minHeight?: 'screen' | 'tall' | 'medium';  // 100vh | 800px | 600px, default: 'screen'
}
```

#### CMS Field Groups

| Group | Tier | Fields |
|-------|------|--------|
| **Content** | BASIC | heading.line1, heading.line2, subheading |
| **Buttons** | BASIC | primaryButton (label, href, visible), secondaryButton (label, href, visible) |
| **Media** | BASIC | backgroundImage, backgroundVideo, useVideoBackground toggle |
| **Visibility** | BASIC | showSubheading, showOverlayGradient |
| **Color** | BASIC | colorScheme (dark/light) |
| **Layout** | ADVANCED | contentAlignment, minHeight |
| **Overlay** | ADVANCED | overlayOpacity |
| **Spacing** | ADVANCED | paddingY |
| **Animation** | ADVANCED | enableAnimations |

---

### 3.2 WhoWeAreSection

**Purpose:** Introduction block with photo collage left and text content right on a dark background.

| Property | Value |
|----------|-------|
| Figma Node | 396:407 |
| Default Theme | `dark` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface WhoWeAreContent {
  overline: string;               // "WHO WE ARE"
  heading: string;                // Primary heading text
  headingAccent?: string;         // Serif italic portion (e.g., "College Students")
  body: string;                   // Paragraph description
  primaryButton: {
    label: string;                // "I'm New"
    href: string;
    visible: boolean;
  };
  secondaryButton: {
    label: string;                // "About Us"
    href: string;
    visible: boolean;
  };
  images: {
    src: string;
    alt: string;
  }[];                            // Photo collage (up to 4 images)
}
```

#### Settings Interface

```typescript
interface WhoWeAreSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'who-we-are' };
  content: WhoWeAreContent;

  // BASIC: Visibility
  showOverline: boolean;              // default: true
  showImages: boolean;                // default: true

  // ADVANCED
  layout?: 'split' | 'centered';     // split = images+text, centered = text-only
}
```

#### CMS Field Groups

| Group | Tier | Fields |
|-------|------|--------|
| **Content** | BASIC | overline, heading, headingAccent, body |
| **Buttons** | BASIC | primaryButton (label, href, visible), secondaryButton (label, href, visible) |
| **Images** | BASIC | images[] (up to 4, with src + alt) |
| **Visibility** | BASIC | showOverline, showImages |
| **Color** | BASIC | colorScheme |
| **Layout** | ADVANCED | layout (split/centered) |
| **Spacing** | ADVANCED | paddingY, containerWidth |

---

### 3.3 FeaturedEventsSection

**Purpose:** Featured event cards in a 1-large + 2-small grid layout with section header.

| Property | Value |
|----------|-------|
| Figma Node | 396:421 |
| Default Theme | `light` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface FeaturedEventsContent {
  heading: string;                  // "Featured Events"
  subheading?: string;
  ctaLabel: string;                 // "View All Events"
  ctaHref: string;                  // "/events"
  featuredEvents: EventCardData[];  // 3 events: [large, small-top, small-bottom]
}
```

#### Settings Interface

```typescript
interface FeaturedEventsSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'featured-events' };
  content: FeaturedEventsContent;

  // BASIC: Visibility
  showSubheading: boolean;          // default: false
  showCtaLink: boolean;             // default: true
  showEventBadges: boolean;         // default: true

  // ADVANCED
  layout?: 'featured-grid' | 'equal-grid';   // 1+2 stack or 3 equal columns
  cardRadius?: 'default' | 'none';            // 12px or 0
}
```

#### Validation

- `featuredEvents`: min 1, max 3 items for `featured-grid`; flexible for `equal-grid`
- Each event must have `title` and `imageUrl`

#### Data Source

Events can be **embedded** in section content (manually curated) or **referenced by ID** from the Events collection. The CMS should support both modes:
- Manual: pastor picks 3 events from a dropdown
- Auto: "most recent 3 upcoming events"

---

### 3.4 ScheduleSection

**Purpose:** Calendar/schedule view with filter pills and scrollable event list items.

| Property | Value |
|----------|-------|
| Figma Node | 396:504 |
| Default Theme | `light` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface ScheduleContent {
  heading: string;                  // "Calendar & Schedule"
  filters: string[];                // ["ALL", "Events", "Meetings"]
  defaultFilter: string;            // "ALL"
  maxItems: number;                 // default: 5
  ctaLabel: string;                 // "View Full Calendar"
  ctaHref: string;
}
```

#### Settings Interface

```typescript
interface ScheduleSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'schedule' };
  content: ScheduleContent;

  // BASIC: Visibility
  showFilters: boolean;             // default: true
  showCalendarNavigation: boolean;  // default: true
  showCtaLink: boolean;             // default: true

  // ADVANCED
  viewMode?: 'list' | 'calendar';        // default: 'list'
  showViewToggle?: boolean;               // default: false
  itemsPerPage?: number;                  // default: 5
}
```

#### Data Source

**Fetched from CMS collections** — not stored in section content. The section only configures display parameters (filters, max items, view mode). Events and meetings are pulled from the Events collection at render time.

---

### 3.5 SpiritualDirectionSection

**Purpose:** Yearly spiritual theme display with script font heading and Bible verse.

| Property | Value |
|----------|-------|
| Figma Node | 396:620 |
| Default Theme | `dark` (gradient) |
| Default Container | `narrow` (960px) |

#### Content Interface

```typescript
interface SpiritualDirectionContent {
  overline: string;                 // "2025 SPIRITUAL DIRECTION"
  heading: string;                  // "Not of the World" → rendered in strude font
  verse: {
    text: string;                   // Full verse text
    reference: string;              // "John 17:14-16"
  };
  decorativeElement?: {
    visible: boolean;
  };
}
```

#### Settings Interface

```typescript
interface SpiritualDirectionSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'spiritual-direction' };
  content: SpiritualDirectionContent;

  // BASIC: Visibility
  showOverline: boolean;            // default: true
  showVerse: boolean;               // default: true
  showDecorativeElement: boolean;   // default: true

  // ADVANCED
  backgroundStyle?: 'gradient' | 'solid';   // gradient = #262626→#0D0D0D, solid = black-1
  textAlignment?: 'center' | 'left';        // default: 'center'
}
```

#### Special Background Handling

```typescript
// SectionContainer receives bgOverride for this section
const bgClass = settings.backgroundStyle === 'gradient'
  ? 'bg-gradient-to-b from-black-gradient to-black-1 to-[67%]'
  : 'bg-black-1';

<SectionContainer settings={settings} bgOverride={bgClass}>
```

#### CMS Field Groups

| Group | Tier | Fields |
|-------|------|--------|
| **Theme** | BASIC | overline (text input, e.g., "2025 SPIRITUAL DIRECTION") |
| **Heading** | BASIC | heading (text input — rendered in script font) |
| **Verse** | BASIC | verse.text (textarea), verse.reference (text input) |
| **Visibility** | BASIC | showOverline, showVerse, showDecorativeElement |
| **Color** | BASIC | colorScheme |
| **Background** | ADVANCED | backgroundStyle (gradient/solid) |
| **Layout** | ADVANCED | textAlignment (center/left) |
| **Spacing** | ADVANCED | paddingY |

---

### 3.6 NextStepsSection

**Purpose:** "What We Do" display heading with 2×2 image card grid.

| Property | Value |
|----------|-------|
| Figma Node | 396:629 |
| Default Theme | `light` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface NextStepsContent {
  heading: string;                  // "Your Next Steps at LA UBF" → DM Serif Display italic
  subheading?: string;              // Description paragraph
  cards: ImageCardData[];           // 4 cards for 2×2 grid
}
```

#### Settings Interface

```typescript
interface NextStepsSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'next-steps' };
  content: NextStepsContent;

  // BASIC: Visibility
  showSubheading: boolean;          // default: true

  // ADVANCED
  layout?: 'sidebar-grid' | 'full-width-grid';  // sidebar = text left + 2×2 right
  cardHeight?: 'default' | 'tall';               // 370px or 420px
}
```

#### Validation

- `cards`: min 2, max 4 items
- Each card requires `title` and `imageUrl`

#### CMS Field Groups

| Group | Tier | Fields |
|-------|------|--------|
| **Content** | BASIC | heading, subheading |
| **Cards** | BASIC | cards[] (title, description, imageUrl, imageAlt, href) — repeatable block |
| **Visibility** | BASIC | showSubheading |
| **Color** | BASIC | colorScheme |
| **Layout** | ADVANCED | layout (sidebar-grid / full-width-grid) |
| **Cards** | ADVANCED | cardHeight (default / tall) |
| **Spacing** | ADVANCED | paddingY |

---

### 3.7 CampusMinistriesSection

**Purpose:** Interactive campus name list with image and detail panel.

| Property | Value |
|----------|-------|
| Figma Node | 396:671 |
| Default Theme | `light` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface CampusMinistriesContent {
  heading: string;                  // "Our Campus Ministries"
  campuses: {
    id: string;
    name: string;                   // "LBCC", "CSULB", etc.
    shortName: string;
    href?: string;
  }[];
  image: {
    src: string;
    alt: string;
  };
  ctaHeading: string;               // "Don't see your campus?"
  ctaButton: {
    label: string;                  // "Let us know your interest"
    href: string;
    visible: boolean;
  };
}
```

#### Settings Interface

```typescript
interface CampusMinistriesSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'campus-ministries' };
  content: CampusMinistriesContent;

  // BASIC: Visibility
  showCtaBlock: boolean;            // default: true
  showImage: boolean;               // default: true

  // ADVANCED
  layout?: 'split' | 'simple-list';   // split = sticky columns, simple = stacked
}
```

#### Data Source

Campus list is **fetched from CMS Campuses collection**. The section's `content.campuses` acts as a display-order override — the CMS auto-populates from the collection but allows manual reordering.

#### Special Styling

Campus name list uses colors outside the standard theme tokens:
- Active: `text-campus-active` (#2F3689), font-weight 500
- Inactive: `text-campus-inactive` (#9EA4AF), font-weight 400

---

### 3.8 ThisWeeksMessageSection

**Purpose:** Featured sermon with video player and metadata.

| Property | Value |
|----------|-------|
| Figma Node | 396:696 |
| Default Theme | `light` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface ThisWeeksMessageContent {
  heading: string;                  // "This Week's Message"
  headingAccent?: string;           // Serif italic portion ("Message")
  ctaLabel: string;                 // "View All Messages"
  ctaHref: string;
  sermon: {
    title: string;                  // "ETERNAL LIFE"
    speaker: string;                // "Pastor WILLIAM LARSEN"
    date: string;                   // "Dec 29"
    series?: string;                // "SUNDAY WORSHIP"
    videoUrl?: string;              // YouTube/Vimeo embed URL
    thumbnailUrl: string;
  };
}
```

#### Settings Interface

```typescript
interface ThisWeeksMessageSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'this-weeks-message' };
  content: ThisWeeksMessageContent;

  // BASIC: Visibility
  showCtaLink: boolean;             // default: true
  showSpeaker: boolean;             // default: true
  showDate: boolean;                // default: true
  showSeries: boolean;              // default: true

  // ADVANCED
  videoAspectRatio?: '16:9' | '4:3';   // default: '16:9'
}
```

#### Data Source

Sermon data is **fetched from CMS Sermons collection**. The section references the "featured" sermon — either manually selected by pastor or auto-populated with the most recent entry.

---

### 3.9 FeaturedVideosSection

**Purpose:** 3-column grid of video thumbnails below the message section.

| Property | Value |
|----------|-------|
| Figma Node | 396:708 |
| Default Theme | `light` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface FeaturedVideosContent {
  heading: string;                  // "Featured Videos"
  ctaLabel: string;                 // "View All Videos"
  ctaHref: string;
  videos: VideoThumbnailData[];     // 3 videos for grid
}
```

#### Settings Interface

```typescript
interface FeaturedVideosSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'featured-videos' };
  content: FeaturedVideosContent;

  // BASIC: Visibility
  showCtaLink: boolean;             // default: true

  // ADVANCED
  columns?: 2 | 3;                 // default: 3
}
```

#### Data Source

Videos can be **manually curated** (pastor picks 3) or **auto from collection** (3 most recent featured videos).

---

### 3.10 VisitUsBannerSection

**Purpose:** Full-width dark CTA banner encouraging visits.

| Property | Value |
|----------|-------|
| Figma Node | 396:723 |
| Default Theme | `dark` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface VisitUsBannerContent {
  overline: string;                 // "VISIT US"
  heading: string;                  // "Come Worship With Us"
  body?: string;                    // Optional descriptive text
  primaryButton: {
    label: string;                  // "Plan Your Visit"
    href: string;
    visible: boolean;
  };
  secondaryButton: {
    label: string;                  // "Get Directions"
    href: string;
    visible: boolean;
  };
  backgroundImage?: {
    src: string;
    alt: string;
  };
}
```

#### Settings Interface

```typescript
interface VisitUsBannerSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'visit-us-banner' };
  content: VisitUsBannerContent;

  // BASIC: Visibility
  showOverline: boolean;            // default: true
  showBody: boolean;                // default: true

  // ADVANCED
  backgroundImageOpacity?: number;  // 0–100, default: 10
  textAlignment?: 'center' | 'left';  // default: 'center'
}
```

#### Special Background

`bg-black-1` with optional background image at low opacity:

```html
<div class="relative bg-black-1">
  <!-- Background image at 10% opacity -->
  <img class="absolute inset-0 h-full w-full object-cover opacity-[0.10]" />
  <!-- Content on top -->
  <div class="relative container-standard text-center">...</div>
</div>
```

---

### 3.11 FooterSection

**Purpose:** Site footer with logo, navigation columns, contact info, social links, and legal.

| Property | Value |
|----------|-------|
| Figma Node | 396:734 |
| Default Theme | `dark` |
| Default Container | `standard` (1200px) |

#### Content Interface

```typescript
interface FooterColumn {
  heading: string;
  links: {
    label: string;
    href: string;
    external?: boolean;
  }[];
}

interface FooterContent {
  logo: {
    text: string;                   // "LA UBF"
    href: string;                   // "/"
  };
  description: string;              // Short church description
  socialLinks: {
    platform: 'instagram' | 'facebook' | 'youtube' | 'twitter';
    href: string;
    visible: boolean;
  }[];
  columns: FooterColumn[];          // Navigation columns (2-4)
  contactInfo: {
    address: string;
    phone: string;
    email: string;
  };
  copyright: string;                // "© 2025 Los Angeles University Bible Fellowship"
  legalLinks: {
    label: string;                  // "Privacy Policy", "Terms"
    href: string;
  }[];
}
```

#### Settings Interface

```typescript
interface FooterSectionSettings extends BaseSectionSettings {
  _meta: { sectionType: 'footer' };
  content: FooterContent;

  // BASIC: Visibility
  showSocialLinks: boolean;         // default: true
  showContactInfo: boolean;         // default: true
  showLegalLinks: boolean;          // default: true

  // ADVANCED
  columnCount?: 2 | 3 | 4;         // default: 4
}
```

---

## 4. CMS Architecture

### 4.1 Terminology

| Concept | Definition | Example |
|---------|-----------|---------|
| **Section** | Top-level page block. Independently orderable. | HeroSection, FooterSection |
| **Block** | Repeatable item within a section. | Event card, footer nav column, campus entry |
| **Field** | Single editable value within a section or block. | heading text, button label, image URL |
| **Setting** | Presentation control (not content). | color scheme, layout variant, visibility toggle |
| **Collection** | Shared data source used by multiple sections. | Events, Sermons, Campuses |

### 4.2 Section-to-Section Data Flow

```
CMS Data Layer (Collections)
  │
  ├── Events          ← FeaturedEventsSection, ScheduleSection
  ├── Sermons         ← ThisWeeksMessageSection
  ├── Videos          ← FeaturedVideosSection
  ├── Campuses        ← CampusMinistriesSection
  ├── Spiritual Dir.  ← SpiritualDirectionSection (yearly, 1 active record)
  └── Site Settings   ← FooterSection (contact, social), VisitUsBannerSection

Homepage Page Config
  │
  └── sections[] (ordered array)
       ├── { type: 'hero',               position: 0, settings: HeroSectionSettings }
       ├── { type: 'who-we-are',          position: 1, settings: WhoWeAreSectionSettings }
       ├── { type: 'featured-events',     position: 2, settings: FeaturedEventsSectionSettings }
       ├── { type: 'schedule',            position: 3, settings: ScheduleSectionSettings }
       ├── { type: 'spiritual-direction', position: 4, settings: SpiritualDirectionSectionSettings }
       ├── { type: 'next-steps',          position: 5, settings: NextStepsSectionSettings }
       ├── { type: 'campus-ministries',   position: 6, settings: CampusMinistriesSectionSettings }
       ├── { type: 'this-weeks-message',  position: 7, settings: ThisWeeksMessageSectionSettings }
       ├── { type: 'featured-videos',     position: 8, settings: FeaturedVideosSectionSettings }
       ├── { type: 'visit-us-banner',     position: 9, settings: VisitUsBannerSectionSettings }
       └── { type: 'footer',             position: 10, settings: FooterSectionSettings }
```

### 4.3 Content vs. Presentation Separation

**Content layer** (CMS database, owned by pastors):
- Collection data: events, sermons, campuses, videos
- Section text content: headings, body, button labels, image URLs
- Site-wide settings: contact info, social links, copyright

**Presentation layer** (section settings, CMS builder):
- Section ordering and visibility
- Color scheme (dark/light)
- Layout variants
- Spacing presets
- Animation toggles

**Merge at render time:**
```typescript
function renderHomepage(content: ContentLayer, presentation: PresentationLayer) {
  return presentation.sections
    .filter(s => s.settings.visible)
    .sort((a, b) => a.position - b.position)
    .map(section => {
      const Component = sectionRegistry[section.type];
      const merged = mergeWithDefaults(section.settings, sectionDefaults[section.type]);
      return <Component key={merged.id} settings={merged} />;
    });
}
```

### 4.4 Data Collections Summary

| Collection | Key Fields | Updated By | Frequency |
|-----------|-----------|-----------|-----------|
| **Events** | id, title, description, startDate, endDate, location, imageUrl, type, ministry | Pastors | Weekly |
| **Sermons** | id, videoId, title, speaker, date, passage, series, thumbnailUrl | Pastors | Weekly |
| **Campuses** | id, name, shortName, slug, meetingTime, location, imageUrl | Admin | Rarely |
| **Videos** | id, videoId, title, thumbnailUrl, duration, featured | Pastors | Weekly |
| **Meetings** | id, title, dayOfWeek, time, location, isOnline, ministry | Admin | Monthly |
| **Spiritual Direction** | year, theme, verseText, verseReference | Admin | Yearly |
| **Site Settings** | contactInfo, socialLinks, copyright, legalLinks | Admin | Rarely |

### 4.5 Validation Rules

```typescript
// lib/validators.ts

export const validationRules = {
  hero: {
    'content.heading.line1':           { required: true, maxLength: 50 },
    'content.heading.line2':           { required: true, maxLength: 30 },
    'content.primaryButton.label':     { required: true, maxLength: 25 },
    'content.primaryButton.href':      { required: true, pattern: /^(\/|https?:\/\/)/ },
    'content.backgroundImage.src':     { required: true },
  },
  'featured-events': {
    'content.heading':                 { required: true, maxLength: 60 },
    'content.featuredEvents':          { required: true, minItems: 1, maxItems: 3 },
    'content.featuredEvents[].title':  { required: true, maxLength: 80 },
    'content.featuredEvents[].imageUrl': { required: true },
  },
  'spiritual-direction': {
    'content.heading':                 { required: true, maxLength: 50 },
    'content.verse.text':              { required: true, maxLength: 500 },
    'content.verse.reference':         { required: true, maxLength: 40 },
  },
  'visit-us-banner': {
    'content.heading':                 { required: true, maxLength: 60 },
    'content.primaryButton.label':     { required: true, maxLength: 25 },
  },
  footer: {
    'content.copyright':              { required: true },
    'content.contactInfo.address':    { required: true },
  },
};
```

---

## 5. Conventions & Patterns

### 5.1 Variant Naming Table

Consistent naming across all sections and components:

| Category | Values | Used By |
|----------|--------|---------|
| `colorScheme` | `'dark' \| 'light'` | All sections |
| `paddingY` | `'compact' \| 'default' \| 'spacious'` | All sections |
| `containerWidth` | `'standard' \| 'narrow' \| 'full'` | All sections |
| `layout` | Section-specific (see below) | Sections with layout variants |
| `textAlignment` | `'center' \| 'left'` | SpiritualDirection, VisitUsBanner |
| `size` | `'large' \| 'small' \| 'default'` | EventCard, CTAButton |
| `variant` | `'primary' \| 'secondary' \| 'icon'` | CTAButton |
| `type` | `'meeting' \| 'event'` | TypePill, EventListItem |

**Section-specific layout values:**

| Section | Layout Options | Default |
|---------|---------------|---------|
| WhoWeAre | `'split' \| 'centered'` | `'split'` |
| FeaturedEvents | `'featured-grid' \| 'equal-grid'` | `'featured-grid'` |
| Schedule | `'list' \| 'calendar'` | `'list'` |
| NextSteps | `'sidebar-grid' \| 'full-width-grid'` | `'sidebar-grid'` |
| CampusMinistries | `'split' \| 'simple-list'` | `'split'` |

### 5.2 CVA Pattern

All shared components use `cva()` from `class-variance-authority`:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const componentVariants = cva(
  'base-classes-here',
  {
    variants: {
      variant: { /* ... */ },
      size: { /* ... */ },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

interface ComponentProps extends VariantProps<typeof componentVariants> {
  // additional props
}

function Component({ variant, size, className, ...props }: ComponentProps) {
  return <div className={cn(componentVariants({ variant, size }), className)} />;
}
```

### 5.3 CMS Editor UI Structure

Every section's editor panel follows this consistent layout:

```
┌─────────────────────────────────────────────┐
│ [Section Name]              [Visible Toggle] │
├─────────────────────────────────────────────┤
│                                             │
│ ── Content ──────────────────────────────── │
│   [text fields, image uploaders, links]     │
│                                             │
│ ── Buttons ──────────────────────────────── │
│   [button label + href + visible toggle]    │
│                                             │
│ ── Visibility ───────────────────────────── │
│   [show/hide toggles for optional elements] │
│                                             │
│ ── Color Scheme ─────────────────────────── │
│   ( ) Dark    ( ) Light                     │
│                                             │
│ ▸ Advanced Settings ─────────────────────── │
│   ┊  Spacing                                │
│   ┊    Vertical: [Compact|Default|Spacious] │
│   ┊  Layout                                 │
│   ┊    [section-specific variant selector]  │
│   ┊  Container                              │
│   ┊    Width: [Standard|Narrow|Full Width]  │
│   ┊  Animation                              │
│   ┊    [ ] Enable scroll animations         │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.4 Section Type Registry

```typescript
export type SectionType =
  | 'hero'
  | 'who-we-are'
  | 'featured-events'
  | 'schedule'
  | 'spiritual-direction'
  | 'next-steps'
  | 'campus-ministries'
  | 'this-weeks-message'
  | 'featured-videos'
  | 'visit-us-banner'
  | 'footer';
```

---

## 6. PageBuilder & Implementation

### 6.1 PageBuilder Component

The top-level orchestrator that renders sections in CMS-defined order:

```typescript
// components/layout/PageBuilder.tsx

import { sectionRegistry } from './sectionRegistry';
import { sectionDefaults } from '@/lib/defaults';
import type { SectionType, BaseSectionSettings } from '@/lib/types/cms';

interface PageSection {
  type: SectionType;
  position: number;
  settings: BaseSectionSettings;
}

interface PageConfig {
  sections: PageSection[];
}

function PageBuilder({ config }: { config: PageConfig }) {
  return (
    <main>
      {config.sections
        .filter(s => s.settings.visible)
        .sort((a, b) => a.position - b.position)
        .map(section => {
          const Component = sectionRegistry[section.type];
          if (!Component) return null;

          const merged = {
            ...sectionDefaults[section.type],
            ...section.settings,
          };

          return <Component key={merged.id} settings={merged} />;
        })}
    </main>
  );
}
```

### 6.2 Section Registry

```typescript
// components/layout/sectionRegistry.ts

const sectionRegistry: Record<SectionType, React.ComponentType<{ settings: any }>> = {
  'hero':                HeroSection,
  'who-we-are':          WhoWeAreSection,
  'featured-events':     FeaturedEventsSection,
  'schedule':            ScheduleSection,
  'spiritual-direction': SpiritualDirectionSection,
  'next-steps':          NextStepsSection,
  'campus-ministries':   CampusMinistriesSection,
  'this-weeks-message':  ThisWeeksMessageSection,
  'featured-videos':     FeaturedVideosSection,
  'visit-us-banner':     VisitUsBannerSection,
  'footer':              FooterSection,
};
```

### 6.3 Implementation Sequence

| Phase | Components | Dependencies |
|-------|-----------|-------------|
| **1. Foundation** | `theme.ts`, `SectionContainer`, `BaseSectionSettings`, `cn()`, `defaults.ts` | None |
| **2. Primitives** | CTAButton, OverlineLabel, SectionHeader, EventBadge, FilterPill, TypePill, ArrowButton | Phase 1 (theme context) |
| **3. Cards** | EventCard, ImageCard, VideoThumbnail, EventListItem | Phase 2 (badges, pills, buttons) |
| **4. Simple Sections** | SpiritualDirection, VisitUsBanner, WhoWeAre | Phase 1-2 (container, buttons, overline) |
| **5. Complex Sections** | Hero, FeaturedEvents, Schedule | Phase 1-3 (all cards, filters, list items) |
| **6. Interactive** | CampusMinistries, ThisWeeksMessage, NextSteps, FeaturedVideos | Phase 1-3 |
| **7. Structural** | Footer, Navbar | Phase 1-2 |
| **8. Orchestration** | PageBuilder, section registry, default config | All phases |
| **9. CMS Integration** | Settings editors, validation, preview | Phase 8 |

---

## Appendix: Quick Reference

### Section → Theme → Container Defaults

| Section | Default Theme | Default Container | Data Source |
|---------|--------------|------------------|-------------|
| Hero | dark | full | Section content |
| Who We Are | dark | standard | Section content |
| Featured Events | light | standard | Events collection + section overrides |
| Schedule | light | standard | Events collection (fetched) |
| Spiritual Direction | dark (gradient) | narrow | Spiritual Direction collection |
| Next Steps | light | standard | Section content |
| Campus Ministries | light | standard | Campuses collection |
| This Week's Message | light | standard | Sermons collection |
| Featured Videos | light | standard | Videos collection |
| Visit Us Banner | dark | standard | Section content + Site Settings |
| Footer | dark | standard | Site Settings collection |

### Shared Component Usage Map

| Component | Used By Sections |
|-----------|-----------------|
| CTAButton | Hero, WhoWeAre, FeaturedEvents, Schedule, NextSteps, CampusMinistries, VisitUsBanner |
| EventCard | FeaturedEvents |
| ImageCard | NextSteps |
| FilterPill | Schedule |
| TypePill | Schedule |
| EventBadge | FeaturedEvents |
| EventListItem | Schedule |
| OverlineLabel | WhoWeAre, SpiritualDirection, VisitUsBanner |
| VideoThumbnail | ThisWeeksMessage, FeaturedVideos |
| SectionHeader | FeaturedEvents, FeaturedVideos |
| SectionContainer | All sections |
| ArrowButton | ImageCard, EventListItem |
