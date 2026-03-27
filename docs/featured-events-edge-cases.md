# Featured Events Section — Edge Case Layouts

> Source: `components/website/sections/highlight-cards.tsx`
> Data: `lib/website/resolve-section-data.ts` → `lib/dal/events.ts` (`getUpcomingEvents`)
> Default fetch count: **3** (configurable via section content JSON `count` field)

---

## Case 0: Zero Events

**Code path:** Line 40 — `if (events.length === 0) return null`

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              (nothing renders — returns null)            │
│                                                         │
│   The entire <SectionContainer> is skipped.             │
│   No heading, no subheading, no CTA, no empty state.   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Behavior:** The section is completely absent from the page. No "no events" message,
no skeleton, no placeholder. Adjacent sections collapse to fill the gap.

**Potential concern:** If this is the only section on a page or a prominent section,
the page may look unexpectedly empty with no explanation to the visitor.

---

## Case 1: One Event

**Code path:** Lines 66-70 — single full-width large card

```
DESKTOP (lg+)
┌─────────────────────────────────────────────────────────────────────┐
│  Section Header                                                     │
│  ┌─ heading ──────────────────────────────────── [View All →] ──┐  │
│  │  Upcoming Events                              ctaLabel/href   │  │
│  │  subheading text here                                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │                    LARGE EVENT CARD                            │  │
│  │              (full width, min-h: 280px)                       │  │
│  │                                                               │  │
│  │         ┌─────────────────────────────┐                       │  │
│  │         │  background: cover image    │                       │  │
│  │         │  OR mesh gradient + 📅 icon │                       │  │
│  │         └─────────────────────────────┘                       │  │
│  │                                                               │  │
│  │  ┌──────────────────────────────────────────────────┐  ┌──┐  │  │
│  │  │  [BADGE]                                         │  │→ │  │  │
│  │  │  Event Title                                     │  │  │  │  │
│  │  │  🕐 Mon, Jan 15                                  │  └──┘  │  │
│  │  │  📍 Church Building                              │         │  │
│  │  └──────────────────────────────────────────────────┘         │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

MOBILE (<lg)
┌───────────────────────────────┐
│  Upcoming Events              │
│  subheading                   │
│  [View All →]                 │
│                               │
│  ┌───────────────────────────┐│
│  │                           ││
│  │    LARGE EVENT CARD       ││
│  │    (full width, 280px)    ││
│  │                           ││
│  │  Event Title              ││
│  │  🕐 Mon, Jan 15           ││
│  │  📍 Church Building       ││
│  │  (no arrow btn on mobile) ││
│  └───────────────────────────┘│
└───────────────────────────────┘
```

**Notes:**
- Card stretches full container width (no grid applied)
- Uses `size="large"` → `min-h-[280px]`
- Arrow button hidden on mobile (`hidden lg:block`)

---

## Case 2: Two Events

**Code path:** Lines 71-79 — `grid gap-5 lg:grid-cols-2`, both `size="large"`

```
DESKTOP (lg+)
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─ Upcoming Events ──────────────────────────── [View All →] ──┐  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────┐  gap  ┌──────────────────────────┐   │
│  │                          │  20px │                          │   │
│  │     LARGE CARD #1        │   ▐   │     LARGE CARD #2        │   │
│  │     (50% width)          │   ▐   │     (50% width)          │   │
│  │     min-h: 280px         │   ▐   │     min-h: 280px         │   │
│  │                          │       │                          │   │
│  │                          │       │                          │   │
│  │                          │       │                          │   │
│  │  Event Title #1          │       │  Event Title #2          │   │
│  │  🕐 Mon, Jan 15    [→]   │       │  🕐 Tue, Jan 16    [→]   │   │
│  │  📍 Location A           │       │  📍 Location B           │   │
│  └──────────────────────────┘       └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

MOBILE (<lg — grid-cols-1 fallback)
┌───────────────────────────────┐
│  Upcoming Events              │
│  [View All →]                 │
│                               │
│  ┌───────────────────────────┐│
│  │     LARGE CARD #1         ││
│  │     (full width, 280px)   ││
│  │  Event Title #1           ││
│  │  🕐 Mon, Jan 15           ││
│  │  📍 Location A            ││
│  └───────────────────────────┘│
│          gap (20px)           │
│  ┌───────────────────────────┐│
│  │     LARGE CARD #2         ││
│  │     (full width, 280px)   ││
│  │  Event Title #2           ││
│  │  🕐 Tue, Jan 16           ││
│  │  📍 Location B            ││
│  └───────────────────────────┘│
└───────────────────────────────┘
```

**Notes:**
- Both cards are `size="large"` (equal visual weight)
- Equal 50/50 split on desktop
- Stacks vertically on mobile (CSS grid fallback to 1 column)
- Both cards have `h-full` via `AnimateOnScroll` wrapper, so they match height

---

## Case 3: Three Events (Default / Designed-for Case)

**Code path:** Lines 80-104 — asymmetric: 1 large left + 2 small stacked right

```
DESKTOP (lg+)
┌─────────────────────────────────────────────────────────────────────┐
│  ┌─ Upcoming Events ──────────────────────────── [View All →] ──┐  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────┐  gap  ┌──────────────────────────┐   │
│  │                          │  20px │                          │   │
│  │                          │   ▐   │     SMALL CARD #2        │   │
│  │     LARGE CARD #1        │   ▐   │     h: 240px (lg)        │   │
│  │     (50% width)          │   ▐   │                          │   │
│  │     h-full (stretches    │       │  Event #2 Title          │   │
│  │      to match right col) │       │  🕐 date    📍 loc  [→]  │   │
│  │                          │       ├──────────────────────────┤   │
│  │                          │       │      gap (20px)          │   │
│  │                          │       ├──────────────────────────┤   │
│  │                          │       │                          │   │
│  │                          │       │     SMALL CARD #3        │   │
│  │  Event #1 Title          │       │     h: 240px (lg)        │   │
│  │  🕐 date           [→]   │       │                          │   │
│  │  📍 location              │       │  Event #3 Title          │   │
│  │                          │       │  🕐 date    📍 loc  [→]  │   │
│  └──────────────────────────┘       └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

Height math (desktop):
  Right column = 240px + 20px gap + 240px = 500px
  Left card stretches to 500px via h-full (grid row alignment)

MOBILE (<lg)
┌───────────────────────────────┐
│  Upcoming Events              │
│  [View All →]                 │
│                               │
│  ┌───────────────────────────┐│
│  │     LARGE CARD #1         ││
│  │     (full width, 280px)   ││
│  │  Event #1 Title           ││
│  │  🕐 date  📍 location     ││
│  └───────────────────────────┘│
│          gap (20px)           │
│  ┌───────────────────────────┐│
│  │     SMALL CARD #2         ││
│  │     (full width, 280px*)  ││
│  │  Event #2 Title           ││
│  │  🕐 date  📍 location     ││
│  └───────────────────────────┘│
│          gap (20px)           │
│  ┌───────────────────────────┐│
│  │     SMALL CARD #3         ││
│  │     (full width, 280px*)  ││
│  │  Event #3 Title           ││
│  │  🕐 date  📍 location     ││
│  └───────────────────────────┘│
└───────────────────────────────┘
* sm:min-h-[280px], base min-h-[240px]
```

---

## Summary Table

| Events | Renders? | Layout | Card Sizes | Grid |
|--------|----------|--------|------------|------|
| **0** | No (`null`) | Nothing — entire section hidden | N/A | N/A |
| **1** | Yes | Single full-width card | 1 large | No grid |
| **2** | Yes | Equal 2-column grid | 2 large | `lg:grid-cols-2` |
| **3** | Yes | Asymmetric: large + 2 stacked small | 1 large + 2 small | `lg:grid-cols-2` |

---

## Potential Issues / Observations

1. **0 events = invisible section** — No empty state message. If a church has no upcoming
   events, this section silently disappears. Consider whether a "No upcoming events"
   message or a CMS-side warning would be better UX.

2. **1 event = very wide card** — On ultrawide screens the single large card spans the
   full container (~1280px standard). The `min-h-[280px]` means the aspect ratio gets
   very horizontal. This looks fine with a cover image but may feel sparse with the
   mesh gradient fallback.

3. **2 events = both large** — This is visually heavier than 3 events since both cards
   get the full "large" treatment. This is intentional (equal weight) but worth noting
   the visual difference when toggling between 2 and 3.

4. **3+ events only shows 3** — The `else` branch (line 80) renders `cardEvents[0]`,
   `[1]`, and `[2]` via hardcoded indices. If `count` is set to 4+ in the section
   config, the extra events are fetched but never rendered. The 4th+ event is silently
   dropped.

5. **No location = gap collapses** — The location line is conditionally rendered
   (`{data.location && ...}`), so cards without a location just show the date line.
   This is fine but means cards in the same row may have slightly different text heights.
