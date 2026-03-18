# Builder Responsive Rendering Bug — Root Cause Analysis

> **Date:** 2026-03-18
> **Status:** Analysis complete, fix not yet implemented
> **Severity:** Systemic — blocks all builder visual fidelity work

---

## The Problem

Sections in the website builder canvas do not respond to responsive breakpoints correctly. On the public website, sections are fully responsive and adapt to viewport width. In the builder, they appear broken — desktop layouts are squeezed, mobile previews show desktop layouts, and tablet mode looks wrong.

## Root Cause: Viewport Media Queries vs. Container Width

**This is a fundamental architectural mismatch, not a bug in any individual section.**

### How the public website works

```
Viewport (e.g. 1440px wide)
└── <main> (full viewport width)
    └── <SectionRenderer>
        └── <SectionContainer> uses container-standard (width: 85%, max-width: 1200px)
            └── Section content with Tailwind responsive classes (sm:, md:, lg:)
```

Tailwind responsive utilities (`sm:`, `md:`, `lg:`) compile to **CSS `@media` queries** — they respond to **viewport width**. On the public site, viewport width ≈ available content width, so everything works.

### How the builder works

```
Viewport (e.g. 1440px wide)
└── BuilderShell (full viewport)
    ├── BuilderSidebar (60px fixed)
    ├── BuilderDrawer (320px, toggleable)
    ├── BuilderCanvas (flex-1, what's left)
    │   └── Device preview container (maxWidth: 100% / 768px / 375px)
    │       └── [data-website] scope
    │           └── <BuilderSectionRenderer>
    │               └── Section component (same as public site)
    │                   └── Tailwind responsive classes (sm:, md:, lg:)
    └── BuilderRightDrawer (320px, toggleable)
```

**The viewport is still 1440px**, but the canvas container might only be **~640px wide** (1440 - 60 sidebar - 320 left drawer - 320 right drawer - padding). Yet `lg:` breakpoints (1024px) still fire because they check **viewport width, not container width**.

### The mismatch in each device mode

| Device Mode | Container maxWidth | Actual available width | Viewport width | Breakpoints that fire |
|---|---|---|---|---|
| Desktop | 100% | ~640–1060px (depends on drawers) | 1440px | sm ✓ md ✓ lg ✓ (wrong — lg layout in 640px) |
| Tablet | 768px | 768px | 1440px | sm ✓ md ✓ lg ✓ (wrong — should only fire sm, md) |
| Mobile | 375px | 375px | 1440px | sm ✓ md ✓ lg ✓ (wrong — should fire none) |

**Every device preview mode is broken.** Desktop shows large-screen layouts in a squished container. Tablet and mobile previews show desktop layouts crammed into narrow containers.

### Concrete examples

1. **`media-text.tsx`** — Uses `hidden md:grid` for desktop layout and `flex md:hidden` for mobile. In builder tablet/mobile mode, the desktop layout still shows (viewport > 768px) but crammed into 375px.

2. **`hero-banner.tsx`** — Uses `hidden sm:block` for desktop gradient, `block sm:hidden` for mobile gradient, `lg:pb-14`, `lg:ml-20`. All fire at desktop viewport width regardless of container.

3. **`action-card-grid.tsx`** — Uses `sm:grid-cols-2`. Fires in mobile preview mode because viewport is wide.

4. **`container-standard`** — `width: 85%; max-width: 1200px`. On the public site at 1440px viewport, this gives ~1200px of content. In the builder canvas at ~700px available, 85% = 595px, which is fine — but sections using `lg:` classes still layout for 1024px+ screens inside 595px.

---

## Fix Options

### Option A: Iframe Isolation (Recommended)

Render the builder canvas inside an `<iframe>` whose width matches the target device.

**How it works:**
- Create a lightweight route (e.g. `/cms/website/builder/preview/[pageId]`) that renders sections with the website theme but no builder chrome
- `<BuilderCanvas>` renders an `<iframe src={previewRoute}>` sized to the device width
- The iframe's viewport IS the device width, so all media queries work correctly
- Communicate between builder and iframe via `postMessage` (content updates, section selection, scroll sync)

**Why this is the right answer:**
- This is exactly how **Framer**, **Webflow**, **Squarespace**, and **WordPress Gutenberg** handle this problem
- Zero changes to any of the 40+ section components
- Device preview (mobile/tablet) works perfectly — you literally change the iframe width
- CSS isolation is free — no CMS styles bleed into website styles and vice versa
- Theme tokens, custom CSS, and fonts are loaded naturally inside the iframe

**Tradeoffs:**
- Cross-frame communication adds complexity (postMessage protocol for edits, selection, scrolling)
- DnD needs a bridge (drag handle in parent, drop targets in iframe, or overlay-based DnD)
- Initial load is slightly heavier (iframe loads its own bundle)
- DevTools debugging crosses frame boundaries

**Effort:** Medium-high (~2-3 days for core, additional polish for DnD + selection sync)

### Option B: CSS Container Queries

Replace all Tailwind viewport breakpoints (`sm:`, `md:`, `lg:`) with CSS container queries (`@container`) in section components.

**How it works:**
- Add `container-type: inline-size` to the canvas preview container
- Rewrite all responsive utilities in 40+ section components from `sm:X` → `@sm:X` (Tailwind v4 `@container` syntax)
- Section components become container-width-aware instead of viewport-width-aware

**Why this is tempting but wrong:**
- Requires modifying **every section component** (40+ files, hundreds of responsive classes)
- The public website would also switch to container queries — may have subtle rendering differences
- Two parallel systems to maintain (public site uses viewport queries, builder uses container queries) unless you commit fully
- Tailwind v4's `@container` support is good but not every responsive pattern maps 1:1
- Some section patterns (e.g., `min-h-screen`, viewport-relative units) don't have container-query equivalents

**Effort:** High (3-5 days, touches every section file, high regression risk)

### Option C: CSS Zoom / Transform Scale (Hack)

Render sections at full viewport width and use `zoom` or `transform: scale()` to fit the canvas.

**Why this is bad:**
- `zoom` is not supported in Firefox
- `transform: scale()` doesn't affect layout flow (element takes up original space)
- Mouse coordinates for interaction (clicks, DnD) need manual transformation
- Fundamentally a visual trick, not a real solution

**Effort:** Low initially, high maintenance burden. Not recommended.

---

## Recommendation: Option A (Iframe)

The iframe approach is the industry standard for website builders. It provides:

1. **Perfect responsive fidelity** — sections see the real viewport they'll run in
2. **Zero section component changes** — the 40+ components stay untouched
3. **Clean CSS isolation** — CMS admin styles never interfere with website styles
4. **Accurate device preview** — change iframe width for pixel-perfect mobile/tablet
5. **Future-proof** — adding new sections never requires builder-specific responsive work

### Implementation sketch

```
Builder (parent)                          Preview iframe
┌──────────────────┐                     ┌──────────────────┐
│ BuilderCanvas     │                     │ Preview route     │
│                   │                     │                   │
│ <iframe           │  ◄── postMessage ──►│ Renders sections  │
│   src="/preview"  │      protocol       │ with real theme   │
│   width={device}  │                     │ and real viewport │
│ />                │                     │                   │
│                   │                     │ Sections respond  │
│ DnD overlay layer │                     │ to iframe width   │
│ Selection overlay │                     │ (media queries    │
│                   │                     │  work correctly)  │
└──────────────────┘                     └──────────────────┘
```

**postMessage protocol (bidirectional):**
- Parent → iframe: `{ type: 'UPDATE_SECTIONS', sections: [...] }`
- Parent → iframe: `{ type: 'UPDATE_THEME', tokens: {...} }`
- Parent → iframe: `{ type: 'SELECT_SECTION', id: '...' }`
- Iframe → parent: `{ type: 'SECTION_CLICKED', id: '...' }`
- Iframe → parent: `{ type: 'CONTENT_HEIGHT', height: 1234 }` (for iframe auto-sizing)

**DnD strategy:**
- Keep drag handles and drop indicators in the parent frame (overlay on top of iframe)
- Use `pointer-events: none` on iframe during drag
- Map drop positions to section indices via coordinates

---

## Impact on Day 1 Tasks

**This analysis should be done BEFORE the Day 1 tasks in `dev-guide-day1.md`:**

- **Task 0 (Infrastructure Refactors):** Still valid and should proceed — shared editor extraction, right sidebar scroll fix, dirty tracking. These are editor-side, not canvas-side.
- **Task 1 (Fix Hardcoded URLs):** Still valid — these are content/component fixes that apply to both public site and builder.
- **Task 2 (Navigation Fix):** Still valid — page tree and navbar editing are builder chrome, not canvas rendering.
- **Task 3 (Undo/Redo):** Still valid — state management, not rendering.
- **Task 4 (Section Editor Spec Review):** Still valid — editor fields, not rendering.

**However**: Any work that involves visually verifying sections in the builder canvas will show incorrect responsive behavior until the iframe migration is done. This doesn't block the editor work but it means "check canvas" verification steps in the dev guide will not reflect real responsive behavior.

### Recommended sequencing

1. Do Task 0a-0c (editor infrastructure) — these are unaffected
2. Implement iframe canvas (this fix)
3. Then proceed with Tasks 1-4, using the iframe canvas for accurate visual verification

---

## Files involved in the iframe migration

| File | Change |
|---|---|
| `builder-canvas.tsx` | Replace inline section rendering with `<iframe>` + overlay layer |
| New: `app/cms/website/builder/preview/[pageId]/page.tsx` | Lightweight preview route (sections + theme, no builder chrome) |
| New: `components/cms/website/builder/builder-preview-client.tsx` | Client component inside iframe, listens for postMessage updates |
| `builder-section-renderer.tsx` | Move into preview route (no longer needed in parent) |
| `builder-shell.tsx` | Add postMessage send logic for section/theme updates |
| `sortable-section.tsx` | Adapt to overlay-based selection (coordinates over iframe) |
