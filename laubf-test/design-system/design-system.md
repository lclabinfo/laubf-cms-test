# LA UBF Design System

> Extracted from Figma file `LA UBF Website Design` (node 396:367)
> Desktop-first at 1440px · Responsive 320px–1440px+
> Tailwind CSS v4 · CSS-first configuration

---

## Table of Contents

1. [Color System](#1-color-system)
2. [Typography System](#2-typography-system)
3. [Spacing System](#3-spacing-system)
4. [Layout System](#4-layout-system)
5. [Breakpoint Strategy](#5-breakpoint-strategy)
6. [Component Tokens](#6-component-tokens)
7. [Responsive Behavior Patterns](#7-responsive-behavior-patterns)
8. [Homepage Section Inventory](#8-homepage-section-inventory)
9. [Tailwind v4 Implementation](#9-tailwind-v4-implementation)
10. [Decisions & Inconsistencies](#10-decisions--inconsistencies)

---

## 1. Color System

### 1.1 Raw Palette (from Figma variables)

| Figma Name   | Hex       | Role                        |
| ------------ | --------- | --------------------------- |
| black 1      | `#0D0D0D` | **Primary dark** — dark section backgrounds, text on light, primary buttons on light bg |
| black 2      | `#313131` | Secondary text on light backgrounds |
| black 3      | `#676767` | Muted/tertiary text, inactive filter pill text |
| white 0      | `#FFFFFF` | **Reserved** — NOT used on homepage. May appear in inner-page elements (e.g., event card bg). Avoid for section backgrounds. |
| white 1      | `#FAFAFA` | **Primary light** — page background, light section fills, text on dark, primary buttons on dark bg |
| white 1.5    | `#F2F2F2` | Light gray surfaces         |
| white 2      | `#E8E8E8` | Borders, dividers, inactive filter pill background |
| white 2.5    | `#DCDCDC` | Stronger borders            |
| white 3      | `#9E9E9E` | Placeholder text, verse numbers, icons |
| brand 1      | `#3667B1` | Primary brand blue (button shadows) |
| brand 2      | `#061B4F` | Dark navy accent            |

**Important:** The homepage uses `white-1` (#FAFAFA) as the light surface — NOT pure white (#FFFFFF). The primary color pair is **black-1 / white-1** throughout.

### 1.2 Extended Colors (from Figma design context, not in variables)

These colors appear in the homepage design but are not part of the declared Figma variables:

| Hex        | Usage                              | Suggested Token               |
| ---------- | ---------------------------------- | ----------------------------- |
| `#262626`  | Gradient start (Spiritual Direction) | `--color-black-gradient`    |
| `#009966`  | Schedule "MEETING" type pill       | `--color-accent-green`        |
| `#155DFC`  | Schedule "EVENT" type pill         | `--color-accent-blue`         |
| `#2F3689`  | Active campus name text            | `--color-campus-active`       |
| `#9EA4AF`  | Inactive campus name text          | `--color-campus-inactive`     |

### 1.3 Semantic Token Mapping

```
Text:
  --color-text-primary:     #0D0D0D   (black-1)
  --color-text-secondary:   #313131   (black-2)
  --color-text-muted:       #676767   (black-3)
  --color-text-placeholder: #9E9E9E   (white-3)
  --color-text-inverse:     #FAFAFA   (white-1)  ← NOT pure white

Surface:
  --color-surface-page:     #FAFAFA   (white-1)  ← page background
  --color-surface-light:    #FAFAFA   (white-1)  ← light section fill
  --color-surface-subtle:   #F2F2F2   (white-1.5)
  --color-surface-dark:     #0D0D0D   (black-1)  ← dark section fill
  --color-surface-navy:     #061B4F   (brand-2)

Border:
  --color-border-light:     #E8E8E8   (white-2)
  --color-border-medium:    #DCDCDC   (white-2.5)
  --color-border-muted:     #9E9E9E   (white-3)

Brand:
  --color-brand-primary:    #3667B1   (brand-1)
  --color-brand-dark:       #061B4F   (brand-2)

Accent:
  --color-accent-green:     #009966   (meeting pill)
  --color-accent-blue:      #155DFC   (event pill)
  --color-campus-active:    #2F3689   (active campus)
  --color-campus-inactive:  #9EA4AF   (inactive campus)
```

### 1.4 Section Background Pattern

| Section              | Background                          | Theme  | Text Colors                     |
| -------------------- | ----------------------------------- | ------ | ------------------------------- |
| Hero                 | Image + dark overlay gradient       | Dark   | white-1, white-2                |
| Who We Are           | `#0D0D0D` (black-1)                | **Dark** | white-1 (heading), white-2 (body), white-3 (muted) |
| Events & Schedule    | `#FAFAFA` (white-1)                | Light  | black-1 (heading), black-2 (body), black-3 (muted) |
| Spiritual Direction  | Gradient `#262626` → `#0D0D0D` (to 67%) | **Dark** | white-1 (heading), white-2 (body), #9E9E9E (verse numbers) |
| Next Steps           | `#FAFAFA` (white-1)                | Light  | black-1 (heading), black-2 (body) |
| Campus Ministries    | `#FAFAFA` (white-1)                | Light  | black-1 (heading), #2F3689 (active campus), #9EA4AF (inactive) |
| Message + Videos     | `#FAFAFA` (white-1)                | Light  | black-1 (heading), black-3 (metadata) |
| Visit Us Banner      | `#0D0D0D` (black-1) + 10% image   | **Dark** | white-1 (heading), white-2 (body) |
| Footer               | `#0D0D0D` (black-1)               | Dark   | white-1 (headings), white-2 (links), white-3 (muted) |

The homepage alternates: **Dark** (Hero) → **Dark** (Who We Are) → **Light** (Events/Schedule) → **Dark** (Spiritual Direction) → **Light** (Next Steps / Campus / Message) → **Dark** (Banner) → **Dark** (Footer).

---

## 2. Typography System

### 2.1 Font Families

| Token             | Family                              | Usage                            |
| ----------------- | ----------------------------------- | -------------------------------- |
| `--font-sans`     | `"Helvetica Neue", sans-serif`      | All body text, headings, UI, nav, buttons |
| `--font-serif`    | `"DM Serif Text", serif`            | Hero accent ("LA UBF"), italic decorative |
| `--font-display`  | `"DM Serif Display", serif`         | Next Steps section heading (italic) |
| `--font-script`   | `"strude", cursive`                 | Spiritual Direction yearly theme title |

**Notes:**
- Helvetica Neue is the **sole UI font** — all headings, body, buttons, nav.
- DM Serif Text appears in the hero for the italic "LA UBF" lockup.
- DM Serif Display (italic) is used for the "What We Do" heading in the Next Steps section.
- Strude (identified as `strude:Regular` in Figma) is a script face used for the yearly theme heading ("Not of the World") in the Spiritual Direction section.

### 2.2 Desktop Type Scale (from Figma Variables)

| Token                 | Size   | Weight  | Line Height | Letter Spacing | Usage                        |
| --------------------- | ------ | ------- | ----------- | -------------- | ---------------------------- |
| `h1-desktop`          | 80px   | 500 (Medium) | 1.0     | -0.03em        | Hero heading                 |
| `h2-desktop`          | 48px   | 500 (Medium) | 1.0     | -0.03em        | Section titles               |
| `h3-desktop`          | 36px   | 500 (Medium) | 1.2     | -0.03em        | Sub-section titles, card titles |
| `h4-desktop`          | 24px   | 400 (Regular) | 1.2    | -0.03em        | Small headings, labels       |
| `body-1-desktop`      | 20px   | 400 (Regular) | 1.5    | -0.02em        | Lead body text, descriptions |
| `body-2-desktop`      | 16px   | 400 (Regular) | 1.4    | -0.02em        | Standard body text           |
| `body-3-desktop`      | 14px   | 400 (Regular) | 1.4*   | -0.02em        | Small body text, metadata    |
| `button-1-desktop`    | 18px   | 500 (Medium) | 1.0     | -0.03em        | Primary button text          |
| `button-2-desktop`    | 14px   | 500 (Medium) | 1.0     | -0.03em        | Secondary/small button text  |
| `nav-desktop`         | 20px   | 500 (Medium) | 1.0     | -0.02em        | Main nav links               |
| `nav-main-desktop`    | 16px   | 500 (Medium) | 1.0*    | -0.03em        | Nav dropdown headings        |
| `nav-sub-desktop`     | 14px   | 400 (Regular) | 1.0*   | -0.03em        | Nav dropdown sub-items       |
| `pill`                | 12px   | 500 (Medium) | 1.0     | +0.02em        | Badges, tags, pill labels    |
| `input-label`         | 14px   | 500 (Medium) | 1.0*    | +0.01em        | Form field labels            |

*Line heights marked with `*` are inferred (not in Figma variable defs).

### 2.3 Responsive Type Scale

Mobile sizes are **not defined in Figma** — the following is the recommended scale based on reference code patterns and standard ratios (~60-70% of desktop for headings). An **xl (≥1280px)** intermediate breakpoint smooths the transition between tablet/small-desktop and full desktop sizes:

| Token     | Desktop (≥1280px) | Lg Desktop (≥1024px) | Tablet (≥768px) | Mobile (<768px) |
| --------- | ----------------- | -------------------- | --------------- | --------------- |
| h1        | 80px              | 64px                 | 56px            | 40px            |
| h2        | 48px              | 40px                 | 36px            | 28px            |
| h3        | 36px              | 30px                 | 28px            | 24px            |
| h4        | 24px              | 22px                 | 20px            | 18px            |
| body-1    | 20px              | 18px                 | 18px            | 16px            |
| body-2    | 16px              | 16px                 | 16px            | 14px            |
| body-3    | 14px              | 14px                 | 14px            | 13px            |
| button-1  | 18px              | 18px                 | 16px            | 16px            |
| nav       | 20px              | 18px                 | 16px            | 16px            |

**Hero special case:** The hero title in the reference code scales `40px → 80px → 160px` across breakpoints. The Figma design shows 80px for the heading at 1440px. The 160px size from the reference code may be the Figma Make version (not final). **Use 80px at desktop as the source of truth.**

---

## 3. Spacing System

### 3.1 Base Unit

The design uses a **4px base grid** with an **8px practical minimum** for most layout spacing. This aligns with Tailwind's default `--spacing: 0.25rem` (4px) multiplier.

### 3.2 Contextual Spacing Scale

Extracted from Figma measurements (positions and dimensions of actual frames):

```
Micro:
  4px   (1)   — Icon-to-text gaps, tight element pairs
  8px   (2)   — Badge internal padding, pill padding-y

Small:
  12px  (3)   — Button gaps, inline element spacing
  16px  (4)   — Card internal padding (small), list item padding
  20px  (5)   — Button padding-y, inner content gaps

Medium:
  24px  (6)   — Content block spacing
  32px  (8)   — Button padding-x, card content padding
  40px  (10)  — Header-to-grid gap, column gaps
  48px  (12)  — Card padding (large), between sub-sections

Large:
  64px  (16)  — Column gaps in split layouts
  80px  (20)  — Hero content left offset
  100px (25)  — Section top padding (events)
  120px (30)  — Section horizontal padding, section vertical padding

XL:
  150px (37.5) — Navbar horizontal padding from viewport edge
  240px (60)  — Narrow container padding (spiritual direction)
```

### 3.3 Section Spacing Pattern

| Spacing Context             | Value   | Tailwind  |
| --------------------------- | ------- | --------- |
| Section vertical padding    | 100-120px | `py-24` to `py-30` |
| Section horizontal padding  | 120px   | `px-30`   |
| Content block gap           | 40-48px | `gap-10` to `gap-12` |
| Card grid gap               | 20px    | `gap-5`   |
| Heading to content          | 42-56px | `gap-10` to `gap-14` |
| Button group gap            | 12px    | `gap-3`   |
| Metadata/detail stacking    | 26px    | `gap-6.5` or `gap-7` |

---

## 4. Layout System

### 4.1 Container Widths

Measured from Figma frame positions at 1440px viewport:

| Container      | Width   | Side Padding | Usage                           |
| -------------- | ------- | ------------ | ------------------------------- |
| Full-bleed     | 1440px  | 0px          | Hero, section backgrounds       |
| Standard       | 1200px  | 120px        | Events, Next Steps, Message, Banner, Footer |
| Navbar         | 1140px  | 150px        | Navigation bar                  |
| Narrow         | 960px   | 240px        | Spiritual Direction (centered content) |

**Pattern:** The primary content container is **1200px max-width** with **120px horizontal padding** from the 1440px viewport. All major content sections use this.

### 4.2 Content Width Percentages

At 1440px viewport:
- Standard container: 1200/1440 = **83.3%**
- Navbar container: 1140/1440 = **79.2%** ≈ 80%
- Narrow container: 960/1440 = **66.7%** ≈ 2/3

### 4.3 Grid Patterns

| Pattern                  | Columns | Gap  | Usage                  |
| ------------------------ | ------- | ---- | ---------------------- |
| Hero split               | ~33/67  | —    | Hero text left-aligned |
| Intro split              | 600 / 656 | 64px | Who We Are (images + text) |
| Events featured          | 590 / 590 | 20px | Large card + 2 stacked small |
| Next Steps               | 280 / 880 | 40px | Header text + 2×2 card grid |
| Steps card grid          | 430 / 430 | 20px | 2×2 cards              |
| Campus split             | 540 / 612 | 48px | Campus list + info     |
| Video grid               | 3 equal   | 20px | Featured videos        |
| Footer                   | Multi-col | 48px | Brand + nav columns    |

### 4.4 Content Max-Width Implementation

```css
/* Standard container pattern */
.container-standard {
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 24px;  /* 24px mobile → collapses at 1440px+ */
}

/* Narrow container pattern */
.container-narrow {
  max-width: 960px;
  margin-inline: auto;
  padding-inline: 24px;
}
```

---

## 5. Breakpoint Strategy

### 5.1 Breakpoints

| Name  | Width   | rem    | Target                      |
| ----- | ------- | ------ | --------------------------- |
| `xs`  | 320px   | 20rem  | Small phones (min supported) |
| `sm`  | 480px   | 30rem  | Large phones                |
| `md`  | 768px   | 48rem  | Tablets                     |
| `lg`  | 1024px  | 64rem  | Small desktops, landscape tablets |
| `xl`  | 1280px  | 80rem  | Standard desktops           |
| `2xl` | 1440px  | 90rem  | Design target (Figma artboard) |

### 5.2 Layout Behavior Per Breakpoint

| Element            | xs–sm (320-479)   | sm–md (480-767)   | md–lg (768-1023)  | lg+ (1024+)         |
| ------------------ | ----------------- | ----------------- | ----------------- | -------------------- |
| Container padding  | 16-24px           | 24px              | 32-48px           | 120px (or auto-center at 1200px) |
| Nav                | Hamburger menu    | Hamburger menu    | Full nav bar      | Full nav bar         |
| Hero text          | 40px h1           | 40px h1           | 56px h1           | 80px h1              |
| Event grid         | 1 column stacked  | 1 column stacked  | 2 columns         | 2 columns (1 large + 2 small) |
| Steps grid         | 1 column          | 1 column          | 2 columns         | Text sidebar + 2×2 grid |
| Video grid         | 1 column          | 2 columns         | 3 columns         | 3 columns            |
| Campus layout      | Stacked           | Stacked           | Side-by-side      | Side-by-side         |
| Footer             | Single column     | Single column     | 2 columns         | 4 columns            |

### 5.3 Container Padding Scale

```
xs:  px-4   (16px)
sm:  px-6   (24px)
md:  px-8   (32px)
lg:  px-12  (48px)
xl:  px-0 with max-w-[1200px] mx-auto
2xl: px-0 with max-w-[1200px] mx-auto
```

---

## 6. Component Tokens

### 6.1 Buttons

Buttons use a **context-inversion pattern** — the fill color flips based on the section background:

#### Primary Button (filled, on dark backgrounds — Hero, Banner)

```
Background:    var(--white-1)   → #FAFAFA
Text color:    var(--black-1)   → #0D0D0D
Border:        none
Border radius: 100px (rounded-full)
Padding:       20px 32px
Font:          button-1-desktop (18px, medium, -0.03em)
Shadow:        0 10px 15px rgba(54,103,177,0.20),
               0 4px 6px rgba(54,103,177,0.20)
Height:        ~58px
```

#### Primary Button (filled, on light backgrounds — Next Steps, Events)

```
Background:    var(--black-1)   → #0D0D0D
Text color:    var(--white-1)   → #FAFAFA
Border:        none
Border radius: 100px (rounded-full)
Padding:       20px 32px
Font:          button-1-desktop (18px, medium, -0.03em)
Shadow:        0 10px 15px rgba(54,103,177,0.20),
               0 4px 6px rgba(54,103,177,0.20)
Height:        ~58px
```

**Inversion rule:** Primary buttons always contrast with their section background. Dark bg → white-1 fill. Light bg → black-1 fill. Both variants use the brand-1 blue shadow.

#### Secondary Button (outline)

```
Background:    transparent
Text color:    context-dependent (black-1 on light, white-1 on dark)
Border:        1px solid currentColor (or border-white-1/30 on dark)
Border radius: 100px (rounded-full)
Padding:       21px 33px
Font:          button-1-desktop (18px, medium, -0.03em)
Shadow:        0 10px 15px rgba(54,103,177,0.20),
               0 4px 6px rgba(54,103,177,0.20)
Height:        ~60px
```

**Note on Visit Us Banner:** Both primary and secondary buttons on the banner have the brand blue shadow.

#### Arrow/Icon Button (circle)

```
Size:          56×56px or 48×48px
Border radius: rounded-full
Background:    context-dependent (white-1 or transparent)
Icon size:     20-22px
```

### 6.2 Badges / Pills

**Event card badge** (e.g., "UPCOMING" on featured event cards)
```
Background:    var(--black-1) → #0D0D0D
Border:        1px solid var(--white-1) → #FAFAFA
Text:          white-1, pill token (12px, medium, +0.02em, uppercase)
Padding:       12px 20px
Border radius: rounded-full
Height:        38px
```

**Filter pill** (Schedule: "ALL", "Events", "Meetings")
```
Active state:
  Background:  var(--black-1)  → #0D0D0D
  Text:        var(--white-1)  → #FAFAFA

Inactive state:
  Background:  var(--white-2)  → #E8E8E8
  Text:        var(--black-3)  → #676767

Shared:
  Font:        pill token (12px, medium, +0.02em, uppercase)
  Padding:     8px 12px
  Border radius: rounded-full
  Height:      30px
```

**Schedule type pill** (e.g., "MEETING", "EVENT" in event list)
```
MEETING:
  Background:  #009966  (--color-accent-green)
  Text:        white-1

EVENT:
  Background:  #155DFC  (--color-accent-blue)
  Text:        white-1

Shared:
  Font:        12px, medium, uppercase
  Padding:     6px 8px
  Border radius: rounded-full
  Height:      24px
```

### 6.3 Cards

**Event Card (large featured)**
```
Size:          590×500px
Border radius: 12px (rounded-xl)
Background:    var(--black-1) → #0D0D0D
Image:         full cover
Overlay:       gradient bottom (rgba(0,0,0,0) → rgba(0,0,0,0.71))
Content:       bottom-aligned with padding 48px
Text:          white-1 (title), white-2 (details)
```

**Event Card (small/stacked)**
```
Size:          590×240px
Border radius: 12px (rounded-xl)
Background:    var(--black-1)
Image:         full cover
Overlay:       gradient bottom
Content:       bottom-aligned with padding 32px
```

**What We Do Card (Next Steps)**
```
Size:          430×370px
Border radius: 12px (rounded-xl)
Image:         full cover background
Overlay:       gradient from rgba(0,0,0,0) to rgba(0,0,0,0.71)
Content:       bottom-aligned padding 32px
Text max-width: 302px
Arrow button:  48×48px, bottom-right
```

### 6.4 Event List Item

```
Height:        83px
Background:    var(--white-1) → #FAFAFA
Border:        bottom border var(--white-2) → #E8E8E8
Layout:        [date column 48px] [gap 24px] [info column flex-1] [arrow 16px]
Date format:   Month label (pill, 14px) + Day number (20px)
Info:          [type pill (MEETING/EVENT) + time] + [title h3-like 30px]
```

### 6.5 Campus List

```
Active campus:
  Font:        large (e.g., 48px h2-like)
  Color:       #2F3689  (--color-campus-active)
  Weight:      Medium (500)

Inactive campus:
  Font:        same size
  Color:       #9EA4AF  (--color-campus-inactive)
  Weight:      Regular (400)
```

### 6.6 Navbar

```
Height:        52px (content) + padding
Container:     1140px centered (150px from edges at 1440px)
Logo:          62×52px
Links gap:     20px between nav items
Link padding:  8px horizontal, 16px vertical
Font:          nav-desktop (20px, medium, -0.02em)
CTA button:    "I'm new" primary button, 134×52px
```

### 6.7 Video Player

```
Aspect ratio:  16:9 (1200×675px)
Play button:   144×144px centered
Border radius: 12px (rounded-xl)
```

---

## 7. Responsive Behavior Patterns

### 7.1 Container Collapse

```
Desktop (≥1280px):  max-width: 1200px, centered with auto margins
Tablet (768-1279):  full width with 32-48px side padding
Mobile (<768px):    full width with 16-24px side padding
```

### 7.2 Grid Collapse Strategy

```
Events Featured Grid:
  Desktop:  [590px large] [20px gap] [590px column → 2×240px stacked]
  Tablet:   [1col] large card stacked above 2 small cards
  Mobile:   [1col] all cards full-width stacked

Steps Grid:
  Desktop:  [280px text] [40px gap] [880px → 2×2 grid of 430px cards]
  Tablet:   [full-width text] then [2-col cards]
  Mobile:   [full-width text] then [1-col cards]

Video Grid:
  Desktop:  3 equal columns, 20px gap
  Tablet:   2 columns
  Mobile:   1 column
```

### 7.3 Section Reflow

```
Who We Are (intro split):
  Desktop:  Side-by-side (images left 600px, text right 656px)
  Mobile:   Stacked (images on top, text below)

Campus Ministries:
  Desktop:  Side-by-side (list left, info right)
  Mobile:   Stacked (info on top, list below)

Message Section:
  Desktop:  Title left, metadata right (same row) → video below
  Mobile:   Title → metadata → video (all stacked)
```

### 7.4 Hero Responsive

```
Desktop:  Full viewport height, text bottom-left at 80px offset
Tablet:   Full viewport height, text centered or bottom-center
Mobile:   Full viewport height (min-h-[600px]), text centered bottom
Font:     80px → 56px → 40px
```

---

## 8. Homepage Section Inventory

11 unique sections identified on the homepage:

| #  | Section Name           | Figma Node  | Background                        | Theme | Key Components |
| -- | ---------------------- | ----------- | --------------------------------- | ----- | -------------- |
| 1  | **Hero**               | 396:368     | Image + dark overlay gradient     | Dark  | Navbar, h1 (HN + DM Serif Text), 2 CTA buttons |
| 2  | **Who We Are**         | 396:407     | `#0D0D0D` (black-1)             | Dark  | Photo collage, overline label, heading, body, CTA |
| 3  | **Featured Events**    | 396:421     | `#FAFAFA` (white-1)             | Light | Section header + CTA, 1 large + 2 small event cards |
| 4  | **Schedule**           | 396:504     | `#FAFAFA` (white-1)             | Light | Calendar header, filter pills, event list items |
| 5  | **Spiritual Direction**| 396:620     | Gradient `#262626` → `#0D0D0D`  | Dark  | Decorative vector, overline, script heading (strude), verse |
| 6  | **Next Steps**         | 396:629     | `#FAFAFA` (white-1)             | Light | Sidebar heading (DM Serif Display italic), 2×2 card grid |
| 7  | **Campus Ministries**  | 396:671     | `#FAFAFA` (white-1)             | Light | Campus name list (typographic), image, heading, CTA |
| 8  | **This Week's Message**| 396:696     | `#FAFAFA` (white-1)             | Light | Heading, sermon title, pastor/date metadata, video player |
| 9  | **Featured Videos**    | 396:708     | `#FAFAFA` (white-1)             | Light | Sub-heading + CTA, 3-col video thumbnails |
| 10 | **Visit Us Banner**    | 396:723     | `#0D0D0D` (black-1) + 10% image | Dark  | Centered overline, heading, body, 2 CTA buttons |
| 11 | **Footer**             | 396:734     | `#0D0D0D` (black-1)             | Dark  | Logo, social links, nav columns, copyright |

### Component Reuse Map

| Component            | Used In Sections              | Notes                    |
| -------------------- | ----------------------------- | ------------------------ |
| Section Header       | Events, Videos                | Heading + CTA link       |
| CTA Button (primary) | Hero, Next Steps, Banner, Schedule | Fill inverts by context |
| CTA Button (outline) | Hero, Who We Are, Events, Videos, Banner, Campus | Border matches context |
| Event Card           | Featured Events               | 12px radius, gradient overlay |
| Event List Item      | Schedule                      | white-1 bg, white-2 divider |
| Filter Pill          | Schedule                      | black-1/white-2 toggle  |
| Type Pill            | Schedule (event list)         | Green (meeting) / Blue (event) |
| Image Card           | Next Steps                    | 12px radius, gradient overlay |
| Video Thumbnail      | Featured Videos, Message      |                          |
| Overline Label       | Who We Are, Spiritual Direction, Banner | Uppercase, pill-like |
| Campus Name          | Campus Ministries             | #2F3689 active / #9EA4AF inactive |
| Navbar               | Hero (overlay)                |                          |
| Footer               | Page bottom                   |                          |

---

## 9. Tailwind v4 Implementation

### 9.1 Main CSS File (`app.css` or `globals.css`)

```css
@import "tailwindcss";

/* ============================================
 * LA UBF Design System
 * Tailwind CSS v4 — CSS-first configuration
 * ============================================ */

/* ---- Font Loading ---- */
@font-face {
  font-family: "Helvetica Neue";
  src: local("Helvetica Neue"), local("HelveticaNeue");
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "DM Serif Text";
  src: url("/fonts/DMSerifText-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "DM Serif Display";
  src: url("/fonts/DMSerifDisplay-Italic.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@font-face {
  font-family: "strude";
  src: url("/fonts/strude-regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}

/* ---- Theme Tokens ---- */
@theme {
  /* ========================
   * COLORS
   * ======================== */

  /* Neutrals (black scale) */
  --color-black-1: #0D0D0D;
  --color-black-2: #313131;
  --color-black-3: #676767;
  --color-black-gradient: #262626;

  /* Neutrals (white scale) */
  --color-white-0: #FFFFFF;
  --color-white-1: #FAFAFA;
  --color-white-1-5: #F2F2F2;
  --color-white-2: #E8E8E8;
  --color-white-2-5: #DCDCDC;
  --color-white-3: #9E9E9E;

  /* Brand */
  --color-brand-1: #3667B1;
  --color-brand-2: #061B4F;

  /* Accent (schedule pills, campus) */
  --color-accent-green: #009966;
  --color-accent-blue: #155DFC;
  --color-campus-active: #2F3689;
  --color-campus-inactive: #9EA4AF;

  /* Semantic aliases */
  --color-text-primary: #0D0D0D;
  --color-text-secondary: #313131;
  --color-text-muted: #676767;
  --color-text-placeholder: #9E9E9E;
  --color-text-inverse: #FAFAFA;

  --color-surface-page: #FAFAFA;
  --color-surface-light: #FAFAFA;
  --color-surface-subtle: #F2F2F2;
  --color-surface-dark: #0D0D0D;
  --color-surface-navy: #061B4F;

  --color-border-light: #E8E8E8;
  --color-border-medium: #DCDCDC;

  /* Button shadow color */
  --color-brand-shadow: rgba(54, 103, 177, 0.2);

  /* ========================
   * FONTS
   * ======================== */
  --font-sans: "Helvetica Neue", "Helvetica", "Arial", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "DM Serif Text", ui-serif, Georgia, serif;
  --font-display: "DM Serif Display", ui-serif, Georgia, serif;
  --font-script: "strude", cursive;

  /* ========================
   * SPACING (4px base — Tailwind default)
   * ======================== */
  --spacing: 0.25rem;

  /* ========================
   * BREAKPOINTS
   * ======================== */
  --breakpoint-xs: 20rem;    /* 320px */
  --breakpoint-sm: 30rem;    /* 480px */
  --breakpoint-md: 48rem;    /* 768px */
  --breakpoint-lg: 64rem;    /* 1024px */
  --breakpoint-xl: 80rem;    /* 1280px */
  --breakpoint-2xl: 90rem;   /* 1440px */

  /* ========================
   * EASING
   * ======================== */
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
}

/* ---- Base Layer ---- */
@layer base {
  html {
    font-family: var(--font-sans);
    color: var(--color-text-primary);
    background-color: var(--color-surface-page);  /* white-1, not pure white */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* ---- Typography Utilities ---- */
@layer utilities {
  /* --- Headings --- */
  .text-h1 {
    font-family: var(--font-sans);
    font-size: 2.5rem;        /* 40px mobile */
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  @media (width >= 48rem) {
    .text-h1 { font-size: 3.5rem; }    /* 56px tablet */
  }
  @media (width >= 64rem) {
    .text-h1 { font-size: 5rem; }      /* 80px desktop */
  }

  .text-h2 {
    font-family: var(--font-sans);
    font-size: 1.75rem;       /* 28px mobile */
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  @media (width >= 48rem) {
    .text-h2 { font-size: 2.25rem; }   /* 36px tablet */
  }
  @media (width >= 64rem) {
    .text-h2 { font-size: 3rem; }      /* 48px desktop */
  }

  .text-h3 {
    font-family: var(--font-sans);
    font-size: 1.5rem;        /* 24px mobile */
    font-weight: 500;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }
  @media (width >= 48rem) {
    .text-h3 { font-size: 1.75rem; }   /* 28px tablet */
  }
  @media (width >= 64rem) {
    .text-h3 { font-size: 2.25rem; }   /* 36px desktop */
  }

  .text-h4 {
    font-family: var(--font-sans);
    font-size: 1.125rem;      /* 18px mobile */
    font-weight: 400;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }
  @media (width >= 48rem) {
    .text-h4 { font-size: 1.25rem; }   /* 20px tablet */
  }
  @media (width >= 64rem) {
    .text-h4 { font-size: 1.5rem; }    /* 24px desktop */
  }

  /* --- Body --- */
  .text-body-1 {
    font-family: var(--font-sans);
    font-size: 1rem;           /* 16px mobile */
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: -0.02em;
  }
  @media (width >= 48rem) {
    .text-body-1 { font-size: 1.125rem; }  /* 18px tablet */
  }
  @media (width >= 64rem) {
    .text-body-1 { font-size: 1.25rem; }   /* 20px desktop */
  }

  .text-body-2 {
    font-family: var(--font-sans);
    font-size: 0.875rem;      /* 14px mobile */
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: -0.02em;
  }
  @media (width >= 64rem) {
    .text-body-2 { font-size: 1rem; }      /* 16px desktop */
  }

  .text-body-3 {
    font-family: var(--font-sans);
    font-size: 0.8125rem;     /* 13px mobile */
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: -0.02em;
  }
  @media (width >= 64rem) {
    .text-body-3 { font-size: 0.875rem; }  /* 14px desktop */
  }

  /* --- UI Text --- */
  .text-button-1 {
    font-family: var(--font-sans);
    font-size: 1rem;           /* 16px mobile */
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  @media (width >= 64rem) {
    .text-button-1 { font-size: 1.125rem; }  /* 18px desktop */
  }

  .text-button-2 {
    font-family: var(--font-sans);
    font-size: 0.875rem;      /* 14px */
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .text-nav {
    font-family: var(--font-sans);
    font-size: 1rem;           /* 16px mobile */
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  @media (width >= 64rem) {
    .text-nav { font-size: 1.25rem; }    /* 20px desktop */
  }

  .text-pill {
    font-family: var(--font-sans);
    font-size: 0.75rem;       /* 12px */
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .text-overline {
    font-family: var(--font-sans);
    font-size: 0.875rem;      /* 14px */
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }

  /* --- Accent / Serif --- */
  .text-hero-accent {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 2.5rem;        /* 40px mobile */
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  @media (width >= 48rem) {
    .text-hero-accent { font-size: 5rem; }     /* 80px tablet */
  }
  @media (width >= 64rem) {
    .text-hero-accent { font-size: 5rem; }     /* 80px desktop */
  }

  /* Display serif for Next Steps heading */
  .text-display-heading {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 1.75rem;       /* 28px mobile */
    font-weight: 400;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  @media (width >= 48rem) {
    .text-display-heading { font-size: 2.25rem; }  /* 36px tablet */
  }
  @media (width >= 64rem) {
    .text-display-heading { font-size: 3rem; }     /* 48px desktop */
  }

  /* Script font for Spiritual Direction theme heading */
  .text-script-heading {
    font-family: var(--font-script);
    font-size: 2.5rem;        /* scaled for mobile */
    font-weight: 400;
    line-height: 1.1;
  }
  @media (width >= 64rem) {
    .text-script-heading { font-size: 4rem; }      /* approximate desktop */
  }
}

/* ---- Component Utilities ---- */
@layer utilities {
  /* Container variants */
  .container-standard {
    width: 100%;
    max-width: 1200px;
    margin-inline: auto;
    padding-inline: 1rem;     /* 16px mobile */
  }
  @media (width >= 30rem) {
    .container-standard { padding-inline: 1.5rem; }  /* 24px */
  }
  @media (width >= 48rem) {
    .container-standard { padding-inline: 2rem; }    /* 32px */
  }
  @media (width >= 80rem) {
    .container-standard { padding-inline: 0; }       /* auto-centered */
  }

  .container-narrow {
    width: 100%;
    max-width: 960px;
    margin-inline: auto;
    padding-inline: 1rem;
  }
  @media (width >= 30rem) {
    .container-narrow { padding-inline: 1.5rem; }
  }
  @media (width >= 48rem) {
    .container-narrow { padding-inline: 2rem; }
  }
  @media (width >= 80rem) {
    .container-narrow { padding-inline: 0; }
  }

  .container-nav {
    width: 100%;
    max-width: 1140px;
    margin-inline: auto;
    padding-inline: 1rem;
  }
  @media (width >= 30rem) {
    .container-nav { padding-inline: 1.5rem; }
  }
  @media (width >= 80rem) {
    .container-nav { padding-inline: 0; }
  }
}
```

### 9.2 Tailwind Utility Mapping Quick Reference

Use these Tailwind classes directly — they map to the design tokens above:

```
Colors:
  bg-black-1          → #0D0D0D   (dark sections, primary btn on light)
  bg-white-1          → #FAFAFA   (light sections, primary btn on dark)
  bg-white-2          → #E8E8E8   (inactive filter pill)
  bg-brand-1          → #3667B1   (brand accents)
  bg-accent-green     → #009966   (MEETING pill)
  bg-accent-blue      → #155DFC   (EVENT pill)
  bg-surface-dark     → #0D0D0D
  bg-surface-light    → #FAFAFA
  bg-surface-page     → #FAFAFA   (html body)
  text-text-primary   → #0D0D0D
  text-text-inverse   → #FAFAFA   (NOT pure white)
  text-campus-active  → #2F3689
  text-campus-inactive→ #9EA4AF
  border-border-light → #E8E8E8
  border-white-1      → #FAFAFA   (event badge border)

Fonts:
  font-sans           → Helvetica Neue stack
  font-serif          → DM Serif Text stack
  font-display        → DM Serif Display stack
  font-script         → strude stack

Breakpoints:
  xs:   → @media (width >= 320px)
  sm:   → @media (width >= 480px)
  md:   → @media (width >= 768px)
  lg:   → @media (width >= 1024px)
  xl:   → @media (width >= 1280px)
  2xl:  → @media (width >= 1440px)

Easing:
  ease-smooth         → cubic-bezier(0.16, 1, 0.3, 1)
  ease-snappy         → cubic-bezier(0.2, 0, 0, 1)

Common spacing (4px grid):
  gap-5  = 20px   (card grid gaps)
  gap-3  = 12px   (button groups)
  p-8    = 32px   (card padding)
  py-24  = 96px   (section vertical — close to 100px)
  py-30  = 120px  (section vertical — exact 120px)
  px-30  = 120px  (section horizontal — exact)
```

### 9.3 Usage Examples

**Primary Button (on dark section, e.g., Hero/Banner):**
```html
<a class="inline-flex items-center justify-center rounded-full bg-white-1 px-8 py-5 text-button-1 text-black-1 shadow-[0_10px_15px_var(--color-brand-shadow),0_4px_6px_var(--color-brand-shadow)] hover:bg-white-0 transition-colors ease-smooth duration-300">
  I'm new
</a>
```

**Primary Button (on light section, e.g., Next Steps/Events):**
```html
<a class="inline-flex items-center justify-center rounded-full bg-black-1 px-8 py-5 text-button-1 text-white-1 shadow-[0_10px_15px_var(--color-brand-shadow),0_4px_6px_var(--color-brand-shadow)] hover:bg-black-2 transition-colors ease-smooth duration-300">
  Explore More
</a>
```

**Secondary Button (on dark section):**
```html
<a class="inline-flex items-center justify-center rounded-full border border-white-1/30 px-8 py-5 text-button-1 text-white-1 shadow-[0_10px_15px_var(--color-brand-shadow),0_4px_6px_var(--color-brand-shadow)] hover:bg-white-1/10 transition-colors ease-smooth duration-300">
  Upcoming events
</a>
```

**Light section (white-1 background):**
```html
<section class="bg-white-1 py-24 lg:py-30">
  <div class="container-standard">
    <h2 class="text-h2 text-black-1">Section Title</h2>
    <p class="text-body-1 text-black-2">Body content here.</p>
  </div>
</section>
```

**Dark section (black-1 background):**
```html
<section class="bg-black-1 py-24 lg:py-30">
  <div class="container-standard">
    <h2 class="text-h2 text-white-1">Section Title</h2>
    <p class="text-body-1 text-white-2">Body content here.</p>
  </div>
</section>
```

**Gradient dark section (Spiritual Direction):**
```html
<section class="bg-gradient-to-b from-black-gradient to-black-1 to-[67%] py-24 lg:py-30">
  <div class="container-narrow text-center">
    <span class="text-overline text-white-3">2025 Spiritual Direction</span>
    <h2 class="text-script-heading text-white-1">Not of the World</h2>
    <p class="text-body-1 text-white-2">Verse content here.</p>
  </div>
</section>
```

**Filter pill group:**
```html
<div class="flex gap-2">
  <!-- Active -->
  <button class="rounded-full bg-black-1 px-3 py-2 text-pill text-white-1">ALL</button>
  <!-- Inactive -->
  <button class="rounded-full bg-white-2 px-3 py-2 text-pill text-black-3">Events</button>
  <button class="rounded-full bg-white-2 px-3 py-2 text-pill text-black-3">Meetings</button>
</div>
```

**Event card:**
```html
<div class="relative overflow-hidden rounded-xl">
  <img src="..." class="h-full w-full object-cover" />
  <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
  <div class="absolute bottom-0 p-8 lg:p-12">
    <span class="inline-block rounded-full border border-white-1 bg-black-1 px-5 py-3 text-pill text-white-1">UPCOMING</span>
    <h3 class="text-h3 text-white-1 mt-4">Event Title</h3>
  </div>
</div>
```

**Schedule type pill:**
```html
<span class="rounded-full bg-accent-green px-2 py-1.5 text-pill text-white-1">MEETING</span>
<span class="rounded-full bg-accent-blue px-2 py-1.5 text-pill text-white-1">EVENT</span>
```

---

## 10. Decisions & Inconsistencies

### 10.1 Decisions Needed

| #  | Item | Context | Recommendation |
| -- | ---- | ------- | -------------- |
| 1  | **Mobile type scale** | Figma only defines desktop sizes. No mobile artboards found. | The responsive scale in Section 2.3 is recommended but should be validated with designer. |
| 2  | **Hero heading size** | Reference code uses 160px at desktop; Figma design shows 80px. | **Use 80px** (Figma is source of truth). Reference code was from an earlier Figma Make version. |
| 3  | **Helvetica Neue licensing** | Helvetica Neue is a commercial font. Web font files need licensing. | Consider fallback: `"Helvetica Neue", "Helvetica", "Arial", system-ui, sans-serif`. May need to purchase web font license or substitute with a similar free alternative (e.g., Inter). |
| 4  | **Strude font licensing** | Script font identified as `strude:Regular` in Figma. Need web font files. | Source the `.woff2` files from designer or purchase license. |
| 5  | **DM Serif Display vs DM Serif Text** | Two different serif fonts are used: DM Serif Text in hero, DM Serif Display in Next Steps. Both are free (Google Fonts). | Use both as separate tokens. Verify with designer this is intentional, not a Figma inconsistency. |
| 6  | **brand-2 (#061B4F) usage** | Only appears in Figma variable list. Not clearly used as a section background on the homepage. | Reference code uses it for an "I'm New" section. Keep as token but monitor usage. |
| 7  | **Section vertical spacing** | Varies: 100px (events), 120px (next-steps, message), 80px (banner). | Standardize to `py-24` (96px) as base, `py-30` (120px) for emphasis. Use exact Figma values where critical. |
| 8  | **Extended palette colors** | Campus (#2F3689, #9EA4AF) and schedule pill (#009966, #155DFC) colors are not in the official Figma variables. | Confirm these are intentional with designer, then add to the variable collection. |

### 10.2 Resolved Decisions

| #  | Item | Resolution |
| -- | ---- | ---------- |
| 1  | **Spiritual Direction script font** | Identified as `strude` (strude:Regular) from Figma design context. Added as `--font-script`. |
| 2  | **Card border radius** | Confirmed as **12px** (`rounded-xl`) from Figma design context, not 24px from reference code. |
| 3  | **Section backgrounds** | Verified via Figma: all light sections use `white-1` (#FAFAFA), NOT white-0 (#FFFFFF). Who We Are and Visit Us Banner are DARK (black-1), not light. |
| 4  | **Button inversion pattern** | Confirmed: primary buttons swap fill color based on section background (white-1 on dark, black-1 on light). Both use brand-1 blue shadow. |
| 5  | **Visit Us Banner background** | Confirmed as DARK section: `bg-black-1` with a background image at 10% opacity, NOT a light section. |

### 10.3 Inconsistencies Found

| Item | Detail |
| ---- | ------ |
| **Button height variation** | Primary buttons are ~58px, secondary are ~60px. Likely a Figma rounding issue. Standardize to ~58-60px (let padding + line-height determine height naturally). |
| **Button padding** | Primary: `px-32 py-20`. Secondary: `px-33 py-21`. The 1px difference is likely unintentional. Standardize to `px-8 py-5` (32px / 20px). |
| **"who-we-are" frame name reuse** | Both the intro section (y=1080) and spiritual direction section (y=3141) share the frame name "who-we-are" in Figma. Rename in component code for clarity. |
| **body-3 line-height** | Not provided in Figma variable definitions. Using `1.4` (same as body-2) as a reasonable default. |
| **nav-main and nav-sub line-heights** | Not provided in variable defs. Using `1.0` as default for nav items. |
| **Campus colors not in palette** | #2F3689 and #9EA4AF are used for campus list but don't appear in the declared Figma color variables. |
| **Schedule pill colors not in palette** | #009966 and #155DFC are used for type pills but don't appear in the declared Figma color variables. |

### 10.4 CMS Considerations

For non-technical pastor content management:
- **Section ordering** should be configurable (drag-and-drop).
- **Text content** in all sections should be editable (headings, body, button labels).
- **Images** in hero, event cards, video thumbnails, campus photos should be uploadable.
- **Event data** should pull from a structured data source (not hard-coded).
- **Spiritual direction** (yearly theme verse) should be a simple text field.
- **Campus list** should be manageable (add/remove campuses).
- **Featured videos** should link to external providers (YouTube/Vimeo).

---

## Appendix: Figma-to-Tailwind Quick Mapping

| Figma Property | CSS | Tailwind v4 |
| -------------- | --- | ----------- |
| Fill: #0D0D0D | `background: #0D0D0D` | `bg-black-1` |
| Fill: #FAFAFA | `background: #FAFAFA` | `bg-white-1` |
| Fill: #3667B1 | `background: #3667B1` | `bg-brand-1` |
| Fill: #009966 | `background: #009966` | `bg-accent-green` |
| Fill: #155DFC | `background: #155DFC` | `bg-accent-blue` |
| Corner radius: 100 | `border-radius: 100px` | `rounded-full` |
| Corner radius: 12 | `border-radius: 12px` | `rounded-xl` |
| Font: HN Medium 80 | `font: 500 80px/1 "Helvetica Neue"` | `text-h1` |
| Font: HN Medium 48 | `font: 500 48px/1 "Helvetica Neue"` | `text-h2` |
| Font: HN Regular 20 | `font: 400 20px/1.5 "Helvetica Neue"` | `text-body-1` |
| Font: HN Medium 18 | `font: 500 18px/1 "Helvetica Neue"` | `text-button-1` |
| Font: HN Medium 12 +2% | `font: 500 12px/1 "Helvetica Neue"; letter-spacing: 0.02em; text-transform: uppercase` | `text-pill` |
| Font: DM Serif Display Italic | `font: italic 400 "DM Serif Display"` | `text-display-heading` |
| Font: strude Regular | `font: 400 "strude"` | `text-script-heading` |
| Padding: 120px horizontal | `padding-inline: 120px` | `px-30` |
| Gap: 20px | `gap: 20px` | `gap-5` |
| Gradient: #262626 → #0D0D0D | `background: linear-gradient(to bottom, #262626, #0D0D0D 67%)` | `bg-gradient-to-b from-black-gradient to-black-1 to-[67%]` |
| Shadow: brand blue | `box-shadow: 0 10px 15px rgba(54,103,177,0.2), 0 4px 6px rgba(54,103,177,0.2)` | `shadow-[0_10px_15px_var(--color-brand-shadow),0_4px_6px_var(--color-brand-shadow)]` |
