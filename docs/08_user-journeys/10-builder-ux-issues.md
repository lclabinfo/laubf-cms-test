# Website Builder Issues — 2026-02-25

This document tracks 8 specific issues reported by the user, with detailed requirements for each fix. Each issue has a dedicated agent working on it. All agents must cross-reference the Figma prototype at `figma-cms-2:25:26/` for the correct implementation patterns.

**General rule:** Use shadcn/ui components, but match the Figma prototype's UX, flows, positioning, and interactions exactly.

---

## Issue 1: Drag Preview — Gap + Wrong Visual

**Status:** TODO
**Files:** `components/cms/website/builder/builder-canvas.tsx`, `components/cms/website/builder/sortable-section.tsx`

### Problem
- When dragging a section, the preview/overlay has a huge gap between the cursor and the preview element.
- The preview shows a small "button-like" card (section label + type) instead of the actual section content.
- Preview is not centered on the cursor — it's offset far from where the user is dragging.

### Required Behavior
- The drag overlay should show a **semi-transparent (reduced opacity) visual clone of the actual section** being dragged, NOT a label card.
- The overlay should be **centered on the cursor** — both horizontally and vertically, the cursor should be "inside" the shadow preview.
- The clone should be at a **reduced scale** (e.g., 50-70% of original size) so it's manageable.
- The section being dragged in-place should show as `opacity-50` (ghosted).

### Figma Reference
The Figma prototype (`Builder.tsx` lines) uses a simple label card:
```jsx
<div className="p-2 bg-white rounded-md shadow-lg border border-slate-200 opacity-90 w-[240px]">
```
However, the user explicitly wants a **visual preview of the actual section**, not a label card.

### Implementation Notes
- Use `DragOverlay` from `@dnd-kit/core`
- Render the actual `BuilderSectionRenderer` inside the overlay with reduced opacity (~0.7) and a max-height constraint
- Apply `pointer-events-none` to the overlay content
- Use the `modifiers` prop on DndContext or custom CSS to center the overlay relative to the cursor
- Consider using `transform` to scale down the preview (e.g., `scale(0.5)`)
- The overlay should have `overflow: hidden` and a `max-height` to prevent very tall sections from creating giant overlays

---

## Issue 2: Blue Selection Border — Clipping / Only Top Visible

**Status:** TODO
**Files:** `components/cms/website/builder/sortable-section.tsx`, `components/cms/website/builder/builder-canvas.tsx`

### Problem
- The blue selection border (outline) is only showing at the **top edge** of sections, not fully around all 4 sides.
- The parent device-preview container has `overflow-hidden`, which clips the `outline` property.
- The navbar's selection border is also not fully visible due to clipping.
- This is a systemic issue — hot-fixes won't work; need a comprehensive, DRY, reusable approach.

### Required Behavior
- When a section is selected, a **complete blue border (all 4 sides)** should be visible.
- The border must NOT clip at container boundaries.
- Hover state: lighter blue border on all 4 sides.
- Selected state: solid blue-600 border + subtle blue glow shadow.
- The approach must work identically for:
  - Regular sections (in SortableSection)
  - The navbar (in BuilderCanvas)
  - Any future selectable elements

### Root Cause Analysis
The device-preview container (`div[data-website=""]`) has `overflow-hidden` which clips `outline` on child elements. Options:
1. **Remove `overflow-hidden`** from the preview container — may cause other layout issues.
2. **Switch from `outline` to `box-shadow`** — box-shadow doesn't expand outward in the same way but can be used with inset to avoid clipping.
3. **Use `border` but counteract with negative margin** — complex, fragile.
4. **Use `box-shadow` with `inset`** — e.g., `shadow-[inset_0_0_0_2px_rgb(37,99,235)]` — this paints INSIDE the element, guaranteed visible regardless of overflow.

### Recommended Approach: Inset Box-Shadow
```css
/* Selected */
shadow-[inset_0_0_0_2px_rgb(37,99,235)]

/* Hover */
shadow-[inset_0_0_0_2px_rgba(37,99,235,0.3)]
```
This:
- Is **always visible** regardless of parent overflow
- Does NOT affect layout (unlike border)
- Paints inside the element boundary (like outline but without clipping issues)
- Is a single CSS property change — DRY and reusable

### Figma Reference
The Figma prototype uses `border-2 border-blue-600` on an absolute overlay div. This works in Figma because their container doesn't have overflow-hidden. Our approach must account for `overflow-hidden` on the parent.

### Files to Change
- `sortable-section.tsx`: Replace outline with inset box-shadow on the overlay div
- `builder-canvas.tsx`: Replace outline with inset box-shadow on navbar wrapper
- Create a shared utility or CSS class for the selection/hover states

---

## Issue 3: Section Picker Modal — Wrong Positioning

**Status:** TODO
**Files:** `components/cms/website/pages/section-picker-dialog.tsx`, `components/cms/website/builder/builder-shell.tsx`, `components/cms/website/builder/builder-canvas.tsx`

### Problem
- The section picker opens as a **centered modal with blurred background** (standard Dialog behavior).
- It should open as a **non-modal panel positioned near the trigger button** — no background blur, positioned to the left/near the "+" button.
- When triggered from the sidebar "+" button, it should appear next to the sidebar (on the right side of the sidebar).
- When triggered from the "+" between sections, it should appear as a **popover** near the trigger.

### Required Behavior (from Figma prototype)
The Figma `SectionPickerModal.tsx` has 3 positioning modes:
1. **`sidebar` mode**: Fixed position at left: 70px (sidebar width), top: 20px. Dimensions: 700x500px.
2. **`popover` mode**: Positioned relative to the trigger button using `getBoundingClientRect()`. Centered horizontally on trigger, below or above based on available space.
3. **`center` mode**: Standard centered modal (fallback).

### Implementation Requirements
- **No background blur** — the background should NOT be darkened or blurred. Use a transparent click-outside-to-close overlay.
- **Sidebar trigger ("+" button)**: Opens in `sidebar` mode — positioned next to the sidebar, not center screen.
- **Section "+" trigger (between sections)**: Opens in `popover` mode — positioned near the trigger button.
- The modal dimensions should be ~700x500px with rounded corners and shadow.
- Click outside closes the modal.

### Positioning Logic (from Figma)
```typescript
// Sidebar mode
style = { position: 'fixed', left: '70px', top: '20px' }

// Popover mode
const triggerRect = triggerRef.getBoundingClientRect()
const MODAL_WIDTH = 700
const MODAL_HEIGHT = 500
const OFFSET = 24
left = triggerRect.left + (triggerRect.width / 2) - (MODAL_WIDTH / 2)
// Clamp to viewport
top = triggerRect.bottom + OFFSET // or above if no space below
```

### Key Changes
- Convert the section picker from a shadcn `Dialog` to a custom positioned panel.
- Store the trigger rect or mode in state.
- Render the picker as a fixed/absolute positioned div with z-50.
- Add a transparent backdrop div for click-outside-to-close.

---

## Issue 4: Modal Section Preview Borders — Black Outline Too Strong

**Status:** TODO
**Files:** `components/cms/website/pages/section-picker-dialog.tsx`, `components/cms/website/builder/section-preview.tsx`

### Problem
- In the section picker modal, each section preview card has a **black/dark border** that looks "really silly" in light mode.
- The same applies to menu items and category sections within the modal.

### Required Behavior
- All borders in the section picker should be **subtle gray** (e.g., `border-gray-200` or `border-slate-200`), not black.
- This applies to:
  - The preview card border in the right panel
  - Any list item borders in the left panel
  - Category group borders
  - The modal outer border itself

### Figma Reference
- Preview area: `bg-slate-50/50`, preview card: `shadow-sm border-slate-200`
- List items: no visible border, just `bg-slate-100` on active

### Files to Change
- `section-picker-dialog.tsx`: Find all `border` classes and soften them
- `section-preview.tsx`: Ensure preview cards use `border-gray-200` or `border-slate-200`

---

## Issue 5: Right Sidebar Not Scrollable

**Status:** TODO
**Files:** `components/cms/website/builder/builder-right-drawer.tsx`

### Problem
- The right sidebar (section editor drawer) content is not scrollable.
- When editing a section with many attributes, the content overflows and becomes inaccessible.

### Required Behavior
- The right drawer content area should be **fully scrollable** from top to bottom.
- The drawer header (with title and close button) should remain fixed at the top.
- All content below the header should be within a scrollable area.
- The scroll should be smooth and the scrollbar should be subtle (like shadcn ScrollArea).

### Current Implementation
The drawer already uses `<ScrollArea className="flex-1">` (line 234 of builder-right-drawer.tsx). The issue may be:
1. The parent flex container doesn't constrain height properly.
2. The ScrollArea isn't getting a proper height constraint.
3. The outer container needs `overflow-hidden` + fixed height.

### Fix
- Ensure the drawer container has `h-full overflow-hidden flex flex-col`.
- The ScrollArea should have `flex-1 min-h-0` (min-h-0 is crucial for flex children to shrink).
- The header should be `shrink-0`.

---

## Issue 6: Section Documentation

**Status:** TODO
**Output:** `docs/00_dev-notes/section-catalog-reference.md`

### Requirement
Create comprehensive documentation of:
1. Every section type available in the website builder (all 42 types)
2. Category organization (8 categories)
3. For each section:
   - Name and description
   - Category
   - Whether it's data-driven (pulls from CMS)
   - All builder-adjustable attributes (content fields)
   - Display settings available (color scheme, padding, container width, animations, visibility)
   - Default content template
4. Page templates (9 templates with their section compositions)

### Source Files
- `components/cms/website/builder/section-catalog.ts` — All 42 type metadata + defaults
- `components/cms/website/builder/section-editors/index.tsx` — Editor routing
- `components/cms/website/builder/section-editors/*.tsx` — Individual editor controls
- `components/cms/website/builder/section-editors/display-settings.tsx` — Shared display settings
- `components/cms/website/builder/builder-empty-state.tsx` — Page templates

---

## Issue 7: Navbar Link Navigation + Selective Click Handling

**Status:** TODO
**Files:** `components/cms/website/builder/builder-canvas.tsx`, `components/cms/website/builder/builder-shell.tsx`

### Problem
- Currently, ALL clicks inside the navbar open the navbar settings panel (because the entire navbar has `pointer-events-none` with a wrapper handling all clicks).
- Links inside the navbar should navigate to the **corresponding page in the builder** (not the actual website).
- Only clicking the **background areas** (non-link parts) of the navbar should open the navbar editor panel.

### Required Behavior
1. **Clicking a navbar link**: Navigate to the builder page for that link's target page. E.g., clicking "About Us" navigates to `/cms/website/builder/{about-us-page-id}`.
2. **Clicking the navbar background** (areas without links): Open the navbar editor in the right drawer.
3. The navbar should still show the blue selection border when the navbar editor is open.

### Implementation Approach
- Remove `pointer-events-none` from the inner WebsiteNavbar wrapper.
- Instead, intercept link clicks at the navbar level:
  - Attach an `onClick` handler to the navbar wrapper that captures `<a>` clicks.
  - For link clicks: Extract the `href`, resolve it to a builder page, navigate using `router.push`.
  - For non-link clicks (background): Open the navbar editor.
- Use event delegation: Check `e.target` to determine if a link was clicked.

### Navigation Resolution
- Navbar links point to paths like `/about`, `/events`, `/ministries/lbcc`.
- Need to resolve these to builder URLs: `/cms/website/builder/{pageId}`.
- Use the `pages` array (available in builder-shell) to find the matching page by slug.

---

## Issue 8: Pages/Navigation Sidebar — Complete Rewrite

**Status:** TODO
**Files:** `components/cms/website/builder/builder-shell.tsx`, new/refactored sidebar components

### Problem
- The current pages sidebar is basic — flat list, not draggable, wrong icons, no hierarchy.
- It doesn't match the Figma prototype's implementation at all.
- Needs to pull from the database and updating the sidebar should update the actual navbar.

### Required Behavior (from Figma prototype)

#### Visual Structure:
- **Header**: "SITE PAGES" title + X close button
- **Add Page button**: Full-width button at top with "+" icon
- **Page tree**: Hierarchical list with:
  - **Drag handles** (GripVertical icon) on every item
  - **Folder icons** for pages with children (collapsible with chevron)
  - **Page icons** for leaf pages
  - **Home icon** for the homepage
  - **Active page**: Blue highlight (`bg-blue-50 text-blue-700`) with checkmark
  - **Indentation**: Visual hierarchy with left padding per depth level
  - **Collapsible groups**: Chevron icon toggles child visibility

#### Functionality:
- **Click a page**: Navigate to that page in the builder
- **Drag to reorder**: Drag pages to change order (vertical reorder)
- **Drag to nest/unnest**: Horizontal drag to change hierarchy (indent/outdent)
- **Data source**: Pull from database (Menu + MenuItem tables)
- **Bidirectional sync**: Changes in sidebar update the navbar on the website
- **Add page**: Opens AddPageModal
- **Page settings**: Accessible per page (gear icon on hover)

#### Figma Sidebar Implementation Details:
```
SITE PAGES                              [X]
┌─────────────────────────────────────────┐
│  + Add Page                             │
├─────────────────────────────────────────┤
│  ⠿ 🏠 Home                         ✓  │  ← Active, blue bg
│  ⠿ ▼ 📁 Ministries                     │  ← Folder, expanded
│       ⠿ 📄 LBCC Campus                 │  ← Child page
│       ⠿ 📄 USC Campus                  │  ← Child page
│       ⠿ 📄 CSULB Campus               │  ← Child page
│  ⠿ 📄 About Us                         │
│  ⠿ 📄 Bible Study                      │
│  ⠿ 📄 Events                           │
└─────────────────────────────────────────┘
```

### Implementation Requirements
1. **Read from DB**: Fetch pages with their hierarchy (parentId) via existing API
2. **Tree building**: Convert flat page list to nested tree structure
3. **DnD**: Use @dnd-kit for drag-and-drop reordering + nesting
4. **API updates**: On reorder/nest, update page sortOrder and parentId via API
5. **Navbar sync**: When pages change, regenerate the menu items that the navbar uses
6. **Match Figma exactly**: Icons, spacing, colors, interactions, hierarchy display

### Files to Create/Modify
- Refactor or replace the pages drawer content in `builder-shell.tsx`
- May need a new `builder-page-tree.tsx` component
- API calls to update page order/hierarchy

---

## Cross-Cutting Concerns

### Overflow & Clipping
Multiple issues (2, 3) relate to the device-preview container's `overflow-hidden`. Any fix must ensure:
- Section outlines/borders are visible
- Modals/popovers are not clipped
- The preview container still constrains content width properly

### Consistency
All selection states (sections, navbar, future elements) must use the same visual language:
- Same border color (blue-600)
- Same border width (2px)
- Same hover state
- Same glow effect

### Figma as Source of Truth
For UX patterns, positioning, interactions, and flow — the Figma prototype at `figma-cms-2:25:26/` is the source of truth. For visual styling, use shadcn/ui design tokens.
