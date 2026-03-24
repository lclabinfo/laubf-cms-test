# Consolidate Pages & Menu + Navigation Editor

> **Date:** March 19, 2026
> **Status:** In progress — implementation deploying
> **Goal:** Merge the two overlapping left-sidebar panels ("Pages & Menu" and "Navigation") into a single unified panel. Clean up old code. Ensure design token compliance.

---

## Problem

The builder currently has **two separate sidebar tools** that overlap in purpose:

| Tool | Component | What it does |
|---|---|---|
| **Pages & Menu** (`pages` tool) | `page-tree.tsx` (651 lines) | Shows pages organized by menu structure. Clicking a page navigates to it in the canvas. Has Add/Settings/Duplicate/Delete via context menu. |
| **Navigation** (`navigation` tool) | `navigation-editor.tsx` (1,246 lines) | Edits menu structure with DnD reordering, sections, item types, CTA config, hidden pages. Clicking a nav item opens a **right-drawer editor** instead of navigating. |

**Issues:**
1. Two panels doing related work — confusing for the user
2. Navigation Editor has richer functionality but **doesn't navigate to pages** when you click them
3. Clicking a nav item in the Navigation Editor opens a right-side property editor — not the intended behavior (should navigate to the page)
4. The panel shouldn't close after clicking a page
5. Page management actions (Add, Settings, Duplicate, Delete) only exist in Pages & Menu
6. **Old/dead code** — previous iterations left stale references, unused imports, and duplicated logic across the codebase that need cleanup
7. **Design token non-compliance** — the navigation editor's font sizes and padding don't match the project's design tokens and shadcn/ui spacing conventions. Needs more generous padding and correct font sizing per `docs/00_dev-notes/design-tokens.md`.

---

## Solution

**Keep the Navigation Editor as the sole panel.** Absorb the page navigation + page management features from PageTree, then remove the separate "Pages & Menu" tool entirely. Perform a full codebase audit for stale navigation code. UI/design review pass for design token compliance.

### Behavior changes for the consolidated panel

| Action | Current behavior | New behavior |
|---|---|---|
| **Click a page-type nav item** | Opens right-drawer NavItemEditor | **Navigates to that page** in the canvas. Panel stays open. |
| **Click a page-dropdown top-level item** | Toggles expand/collapse | **Navigates to the landing page** + toggles expand/collapse |
| **Click an external link item** | Opens right-drawer NavItemEditor | No navigation (it's external). Keep current behavior or show a subtle indicator. |
| **Click a featured item** | Opens right-drawer NavItemEditor | No navigation. Keep current behavior. |
| **Edit a nav item's properties** | Click the label | **Context menu (three-dot) → "Edit Properties"** opens the right-drawer NavItemEditor |
| **Click a hidden page** | N/A (currently just displays) | **Navigates to that page** in the canvas |
| **Active page indicator** | Only in PageTree (checkmark) | Show active page highlight in the consolidated panel |

### Add Page behavior

When a user adds a new page from the consolidated panel:
- **If the page is associated with a nav item** (e.g., created under a dropdown section): it should appear in the correct position within the navbar tree, auto-creating a MenuItem if needed
- **If the page is standalone** (not tied to nav): it goes into the "Other Pages" / hidden section at the bottom of the panel — visible and editable but not in the public navigation
- The "Add Page" flow should make it clear whether the page will be visible in navigation or hidden

### Features to absorb from PageTree

1. **Page navigation** — `onPageSelect(pageId)` callback for page-type items
2. **Active page indicator** — highlight the currently-edited page in the tree
3. **Add Page button** — keep at top of panel (already exists in PageTree)
4. **Page context menu** — Settings, Duplicate, Delete (add to nav item context menus for page-type items)
5. **"Other Pages" section** — pages not in any menu (similar to current "Hidden Pages" but includes unpublished pages too)

### Features that stay in the Navigation Editor as-is

1. DnD reordering (top-level, sections, items)
2. Add/rename/delete sections and items
3. CTA button configuration
4. Item type badges and icons
5. Inline add item/section inputs
6. Group label management

---

## Implementation Plan

### Step 1: Update NavigationEditor props and callbacks (~1 hour)

**File:** `navigation-editor.tsx`

1. Add new props:
   - `activePageId: string` — to highlight the current page
   - `onPageSelect: (pageId: string) => void` — to navigate to a page
   - `onPageSettings: (page: PageSummary) => void` — to open page settings modal
   - `onAddPage: () => void` — to open add page modal
   - `onDeletePage: (pageId: string) => void` — to delete a page
   - `onDuplicatePage: (pageId: string) => void` — to duplicate a page

2. Change click behavior:
   - **Page items**: clicking the label calls `onPageSelect(pageId)` by resolving the nav item's `href` to a page ID (same logic PageTree uses in `normalizeHref`)
   - **Page-dropdown items**: clicking navigates to landing page AND toggles expand
   - **External links / featured**: clicking does nothing (no page to navigate to), or shows a tooltip "External link — edit via context menu"
   - **Editing nav item properties**: move to context menu → "Edit Properties" → calls `onEditItem(itemId)` which opens the right drawer

3. Add active page highlighting:
   - Compare each item's resolved `href` against `activePageId`
   - Apply a highlight style (similar to PageTree's checkmark/bg highlight)

4. Add page management to context menus:
   - For page-type items that resolve to a real page: add Settings / Duplicate / Delete options
   - Reuse the same callbacks as PageTree

5. Add "Add Page" button at the top of the panel (above or next to "Add item")

### Step 2: Update BuilderShell wiring (~30 min)

**File:** `builder-shell.tsx`

1. Pass new props to `NavigationEditor`:
   - `activePageId={pageData.id}`
   - `onPageSelect={handlePageSelect}`
   - `onPageSettings={handlePageSettings}`
   - `onAddPage={() => setAddPageOpen(true)}`
   - `onDeletePage={handleDeletePage}`
   - `onDuplicatePage={handleDuplicatePage}`

2. **Do NOT close `activeTool`** when navigating pages — the panel should stay open. Currently `handlePageSelect` navigates away, which resets state on the new page load. The new builder page load should detect that the navigation tool was active and re-open it. Options:
   - **Option A (simple):** Store `activeTool` in URL search params (e.g., `?tool=navigation`) so it persists across page navigations
   - **Option B (simpler):** Store `activeTool` in `sessionStorage` and restore on mount
   - **Recommended: Option B** — minimal URL clutter, works across page loads within the same session

3. Remove the `"pages"` tool from `BuilderSidebar` (or repurpose the icon for the consolidated panel)

### Step 3: Update BuilderSidebar (~15 min)

**File:** `builder-sidebar.tsx`

1. Remove the `"pages"` tool entry
2. Rename `"navigation"` tool:
   - Icon: keep `FileText` (or use a combined icon like `LayoutList`)
   - Tooltip: "Pages & Navigation" (or "Pages & Menu" to match the screenshot label)
3. Reorder if needed — the page/nav tool should be the first tool in the sidebar

### Step 4: Ensure panel stays open on page navigation (~30 min)

**File:** `builder-shell.tsx`

1. On mount, check `sessionStorage` for `builder-active-tool`
2. If found, set `activeTool` to that value
3. On `activeTool` change, write to `sessionStorage`
4. On `handlePageSelect` navigation, do NOT reset `activeTool` — let it persist

This is the trickiest part because the builder does a full page navigation (`router.push`) when switching pages, which unmounts and remounts `BuilderShell`. The sessionStorage approach ensures the tool state survives.

### Step 5: Clean up PageTree (~15 min)

1. **Do not delete `page-tree.tsx` yet** — keep it as a fallback or reference
2. Remove it from `builder-shell.tsx`'s `renderDrawerContent()` (remove the `case "pages":` branch)
3. Remove `"pages"` from the `BuilderTool` type
4. Remove `PageTree` import from `builder-shell.tsx`
5. After verification, delete `page-tree.tsx` entirely

### Step 6: Handle edge case — no header menu (~15 min)

Currently when `headerMenuId` is null, the navigation tool shows "No header menu found." After consolidation, this panel is the only way to manage pages, so it needs a fallback:

- If no header menu exists: show a flat page list (similar to PageTree's fallback mode) with an "Add Page" button
- Optionally: auto-create a header menu when the first page is created

### Step 7: Codebase audit — remove old navigation code (~1 hour)

Full sweep of the codebase for stale navigation-related code:

1. **Search for all imports** of `PageTree`, `page-tree`, `NavTreeMenuItem`, `NavTreeNode` — remove unused references
2. **Check `types.ts`** — remove types only used by PageTree if no longer needed
3. **Check builder server component** (`[pageId]/page.tsx`) — remove `headerMenuItems` prop if it was only used by PageTree
4. **Check for orphaned CSS classes** or styles that only applied to the old page tree
5. **Check the CMS navigation admin page** (`app/cms/(dashboard)/website/navigation/page.tsx`) — determine if it should redirect to the builder or be removed
6. **Grep for `"pages"` tool references** across the codebase — ensure no hardcoded references remain
7. **Check for any other page-tree-like components** that may have been partially implemented or abandoned

### Step 8: UI/Design token audit (~1 hour)

Review the consolidated navigation editor for design system compliance:

1. **Font sizes** — Audit all `text-*` classes against project conventions. The builder panels should use:
   - `text-sm` (14px) for primary labels
   - `text-xs` (12px) for secondary text, badges, metadata
   - `text-[10px]` only for micro labels like section headings (uppercase tracking)
2. **Padding & spacing** — Increase padding to match shadcn/ui component feel:
   - Item rows: `px-3 py-2` minimum (currently may be tighter)
   - Section headers: `px-3 pt-4 pb-1.5`
   - Panel padding: `p-4` for header area, `p-3` for scroll content
   - Match shadcn `Sidebar` component spacing patterns
3. **Colors** — Ensure all colors use design token variables:
   - Backgrounds: `bg-sidebar`, `bg-sidebar-accent`
   - Text: `text-sidebar-foreground`, `text-muted-foreground`
   - Borders: `border-sidebar-border`
   - Hover states: `hover:bg-sidebar-accent`
4. **Border radius** — Use `rounded-md` or `rounded-lg` per design tokens, not arbitrary values
5. **Interactive states** — Hover, focus, active states should feel consistent with shadcn components
6. **Scroll area** — Use `<ScrollArea>` component (already in use, verify styling)
7. **Icons** — Verify `size-4` (16px) default per design tokens doc

---

## Agent Team Deployment

### Team Structure

```
Phase 1 (parallel):
  Agent A (nav-consolidation):   Steps 1-6     Core implementation
  Agent B (nav-audit):           Step 7        Codebase audit for old/dead code

Phase 2 (after Agent A):
  Agent C (nav-ui-review):       Step 8        UI/design token compliance review
```

### Agent Descriptions

**Agent A: `nav-consolidation`**
- **Scope:** Core consolidation work — merge panels, update click behavior, add page management, sessionStorage persistence, sidebar cleanup
- **Files to modify:** `navigation-editor.tsx`, `builder-shell.tsx`, `builder-sidebar.tsx`, `types.ts`
- **Critical:** Click behavior change (navigate vs. edit), panel persistence, Add Page flow
- **Must complete before:** Agent C

**Agent B: `nav-audit`**
- **Scope:** Full codebase sweep for stale navigation code
- **Output:** List of files with dead imports, unused types, orphaned components, stale references
- **Can run parallel with:** Agent A

**Agent C: `nav-ui-review`**
- **Scope:** Design token compliance audit of the consolidated panel
- **Reference:** `docs/00_dev-notes/design-tokens.md`, shadcn/ui sidebar component patterns
- **Focus:** Font sizes, padding, spacing, colors, interactive states
- **Depends on:** Agent A completing

---

## What NOT to change

- **Right drawer behavior for section editing** — untouched, works independently
- **NavItemEditor / NavSettingsForm** — keep as-is, just triggered from context menu instead of label click
- **Public website rendering** — no changes needed
- **Menu API / DAL** — no changes needed
- **DnD reordering** — keep exactly as-is

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Panel state lost on page navigation | sessionStorage persistence (Step 4) |
| Resolving nav item href to page ID could fail for some items | Reuse PageTree's proven `normalizeHref` logic; gracefully handle unmatched items (no navigation, just expand/collapse) |
| Losing page management features during transition | Keep PageTree code until consolidation is verified end-to-end |
| Context menu getting too crowded with both nav + page actions | Group page actions under a separator: "Edit Properties" / "Rename" above, separator, then "Page Settings" / "Duplicate" / "Delete" below |
| Add Page creates page but not a MenuItem | Add Page flow should optionally create a MenuItem in the correct position if the user adds within a nav section |
| Design token fixes break existing layout | UI review agent makes incremental changes, tests each visually |

---

## Verification Checklist

- [ ] Only one sidebar tool for pages + navigation (no duplicate panels)
- [ ] Clicking a page-type nav item navigates to that page in the canvas
- [ ] Panel stays open after page navigation
- [ ] Active page is visually highlighted in the tree
- [ ] Add Page button works from the consolidated panel
- [ ] New pages appear in correct nav position (or in hidden/other section if not nav-linked)
- [ ] Page Settings / Duplicate / Delete accessible via context menu on page items
- [ ] DnD reordering still works for all levels (top-level, sections, items)
- [ ] Nav item property editing accessible via context menu → "Edit Properties"
- [ ] CTA config still works
- [ ] Hidden pages section still works (and clicking a hidden page navigates to it)
- [ ] External links don't attempt navigation (no page to navigate to)
- [ ] No header menu fallback shows a usable page list
- [ ] `BuilderTool` type no longer includes `"pages"`
- [ ] No stale imports or dead code referencing old PageTree
- [ ] Font sizes match design tokens (text-sm for labels, text-xs for metadata)
- [ ] Padding matches shadcn/ui component spacing (generous, not cramped)
- [ ] Colors use sidebar design token variables
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
