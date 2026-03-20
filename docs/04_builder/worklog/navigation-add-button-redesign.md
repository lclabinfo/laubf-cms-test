# Navigation Panel — Add Button Redesign

> **Date:** March 19, 2026
> **Status:** Approved approach, pending implementation
> **Prerequisite:** Consolidation complete (see `consolidate-pages-navigation-plan.md`)

---

## Problem

The consolidated navigation panel currently has **two separate CTA buttons** at the top:
- **"Add Page"** — opens AddPageModal to create a new Page (database record, real URL)
- **"Add Menu Item"** — inline text input to create a bare MenuItem (just a nav label, no page behind it)

This is confusing because:
1. Two buttons with unclear distinction
2. "Add Menu Item" is vague — what kind of menu item?
3. No way to convert between page and dropdown after creation

## Solution

### Single dropdown button

Replace both buttons with **one "Add" button** that opens a dropdown menu (not a side panel — per user preference):

```
[ + Add ]  ← single button, opens DropdownMenu
  ──────────────────
  New Page              ← opens AddPageModal (creates Page + MenuItem)
  ──────────────────
  MENU ITEMS
  Dropdown              ← creates a non-linking parent MenuItem (opens submenu)
  External Link         ← creates an external link MenuItem
```

### Terminology

Based on competitor research across Squarespace, Wix, Webflow, Framer, and Shopify:

| Our term | What it means | Industry standard |
|---|---|---|
| **Page** | A navigable page with content | Universal |
| **Dropdown** | A non-linking nav label that opens a submenu | Squarespace, Wix, Webflow, Framer all use "Dropdown" |
| **External Link** | Points to an outside URL | Universal |

**Do NOT use "Folder"** — that's a file system metaphor. "Dropdown" is the standard across all major website builders for a nav item that only opens a submenu.

### Type conversion via context menu

Add to the three-dot context menu for nav items:

**On a page item (has href):**
- "Convert to Dropdown" — removes the `href` from the MenuItem, making it a non-linking parent. The Page record is **preserved** (not deleted). If the user converts back later, the page content is still there.

**On a dropdown item (no href, has children):**
- "Convert to Page" — opens a picker to either:
  - Link to an existing page (sets `href` on the MenuItem)
  - Create a new page (opens AddPageModal, then links it)

### Data model behavior during conversion

**Page -> Dropdown conversion:**
1. Store the current `href` value in a transient field or just clear it
2. The Page record in the database is untouched — still exists, still accessible by URL
3. The MenuItem loses its `href` → becomes a folder-dropdown type
4. If the page was only linked from this MenuItem, it appears in the "Hidden Pages" section

**Dropdown -> Page conversion:**
1. User picks a page or creates a new one
2. The MenuItem gets an `href` pointing to that page
3. It becomes a page-dropdown type (navigable + has children)

**Key principle:** Converting types never deletes content. Pages persist through conversions. Only the MenuItem's `href` field changes.

### Where new pages appear

When "New Page" is selected from the Add dropdown:
- The AddPageModal opens as usual
- After creation, a new MenuItem is automatically created pointing to the new page
- The MenuItem is added at the **bottom of the top-level items** in the nav tree
- The user can then drag it to the desired position

When "Dropdown" is selected:
- An inline text input appears (existing behavior for `handleAddTopLevel`)
- Creates a bare MenuItem with no href — appears as a dropdown folder in the nav

When "External Link" is selected:
- An inline input appears for label + URL
- Creates a MenuItem with `isExternal: true` and `openInNewTab: true`

---

## Implementation

### Changes to `navigation-editor.tsx`

1. **Replace the two-button header** with a single `<DropdownMenu>` button
2. **Add "Convert to Dropdown" / "Convert to Page"** to item context menus
3. **For "External Link" add flow**: create a two-field inline input (label + URL) or a small popover

### Changes to `builder-shell.tsx`

1. Wire up `onAddPage` to also create a MenuItem after the page is created (via `handleAddPage` callback enhancement)

### No schema changes needed

The existing MenuItem model supports all conversions — it's just toggling the `href` field.
