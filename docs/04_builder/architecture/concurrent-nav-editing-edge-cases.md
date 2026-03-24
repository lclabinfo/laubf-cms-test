# Concurrent Navigation Editing — Edge Cases & Strategy

> **Date:** March 19, 2026
> **Status:** IMPLEMENTED (March 18-19). Navigation editor fully shipped with DnD, inline CRUD, and concurrent editing support.
> **Prerequisite:** Read `concurrent-editing-strategy.md` for the page-section concurrent editing approach.
> **Key difference:** Page sections are scoped to a single page. Navigation is **shared global state** — every admin on every page sees and edits the same navbar.

---

## Why Navigation Is Harder Than Sections

Page sections have natural isolation: User A edits the Hero on the Home page, User B edits the Events page. Their edits never collide because they're scoped to different pages. Even on the same page, dirty section tracking means non-overlapping edits auto-merge.

Navigation has **none of this isolation:**
- There is ONE header menu shared across the entire site
- Every builder page shows the same navbar preview
- The navigation editor sidebar edits the same `MenuItem` rows regardless of which page is open
- There is no "dirty tracking" for nav items — every change is immediately persisted via API

This means any two admins who open the navigation editor at the same time are editing the same data with no protection.

---

## Current Behavior (No Protection)

Right now, navigation edits are **immediate-persist, last-write-wins** with no awareness:

```
User A opens nav editor, sees: [Our Church, Ministries, Resources, Giving]
User B opens nav editor, sees: [Our Church, Ministries, Resources, Giving]

User A drags "Giving" to position 1: API call reorders → [Giving, Our Church, Ministries, Resources]
User B drags "Resources" to position 1: API call reorders → [Resources, Our Church, Ministries, Giving]

Result: User B's order wins. User A's reorder is silently lost.
Neither user is warned. User A still sees their local order until they refresh.
```

This is fine for 1-admin churches. It's a problem when 2+ admins work simultaneously.

---

## Edge Case Catalog

### Category 1: Reorder Conflicts

#### 1A. Both users reorder top-level items
- **A** moves "Giving" to position 1
- **B** moves "Resources" to position 1
- **Result:** Last API call wins. First user's order is silently overwritten.
- **Severity:** Low — reordering is quick to redo
- **Current handling:** Last-write-wins (acceptable)

#### 1B. User A reorders while User B has expanded dropdown
- **A** reorders top-level items via drag
- **B** is editing children inside "Our Church" (dropdown expanded)
- **B's** local state still has old parent order; B hasn't refreshed
- **B** drags a child item — API call uses the parent's ID which is still valid
- **Result:** Child reorder succeeds (parent ID unchanged). But B's tree may show stale top-level order.
- **Severity:** Low — visual staleness, no data loss
- **Fix needed:** `refreshMenu()` should be called more aggressively, or background polling added for nav data

#### 1C. User A reorders children, User B reorders same children
- Both users reorder items within "Our Church > About" section
- **Result:** Last API call wins for that section's child order
- **Severity:** Low — same as 1A

### Category 2: Add/Delete Conflicts

#### 2A. User A deletes an item that User B is editing
- **A** deletes "Events" from the Connect section
- **B** has "Events" open in the right drawer editor, editing its description
- **B** clicks Save
- **Result:** B's PATCH call hits `/api/v1/menus/{menuId}/items/{itemId}` for a deleted item
- **Current behavior:** DAL's `updateMenuItem` does `findFirst` with churchId check — returns null → throws → API returns 500
- **Severity:** MEDIUM — user gets a generic error, not "this item was deleted"
- **Fix needed:** Return 404 specifically when item not found (not 500). Client should show "This item was deleted by another user" and close the editor.

#### 2B. User A deletes a top-level item with children, User B is editing a child
- **A** deletes "Our Church" (which recursively deletes all children)
- **B** is editing "Who We Are" (a child of Our Church)
- **B** saves
- **Result:** Same as 2A — PATCH for deleted item fails
- **Additionally:** B's entire nav tree is now stale (parent and all siblings gone)
- **Severity:** MEDIUM — B needs a full tree refresh
- **Fix needed:** Same 404 handling + force `refreshMenu()` on any 404

#### 2C. User A adds an item, User B's tree is stale
- **A** adds "Podcast" to the Resources section
- **B** doesn't see "Podcast" until they refresh
- **Result:** B's tree is stale but no data corruption
- **Severity:** LOW — staleness, not loss
- **Fix needed:** Background nav polling (see solution section)

#### 2D. User A adds an item, then User B reorders
- **A** adds "Podcast" at position 5 in a section
- **B** (who doesn't see "Podcast") reorders the section
- **B's** reorder PUT sends `itemIds: [id1, id2, id3, id4]` (missing id5)
- **Result:** Server reorders id1-id4, but id5 ("Podcast") keeps its sortOrder (unchanged by B's call)
- **Current DAL behavior:** `reorderChildMenuItems` uses `updateMany` scoped to `parentId + menuId` — only updates items in the `itemIds` array. Items NOT in the array are untouched.
- **Severity:** LOW — Podcast stays at its sortOrder (which may now conflict with another item's sortOrder). Display order may be unexpected.
- **Fix needed:** Server-side reconciliation for child reorder (similar to `reorderPageSections` which appends unknown items)

### Category 3: Section (groupLabel) Conflicts

#### 3A. User A renames a section, User B adds an item to the old section name
- **A** renames "About" → "Who We Are" (PATCHes all items' groupLabel)
- **B** (still seeing "About") clicks "+ Add item" in the "About" section
- **B's** POST sends `{ groupLabel: "About" }` — creates item with old groupLabel
- **Result:** New item has groupLabel "About" while siblings now have "Who We Are"
- **The item appears as an orphan section** — a new "About" section with one item
- **Severity:** MEDIUM — confusing UI, requires manual fix
- **Fix needed:** Consider making section rename atomic (server-side), or validate groupLabel against current server state on add

#### 3B. User A deletes a section, User B adds an item to it
- **A** deletes all items in "Quick Links" section
- **B** clicks "+ Add item" in "Quick Links"
- **B's** POST sends `{ parentId, groupLabel: "Quick Links" }` — creates a new item with that groupLabel
- **Result:** A lone item with groupLabel "Quick Links" recreates the section
- **Severity:** LOW — the item exists, just unexpected
- **Fix needed:** None critical — user can delete the orphan

### Category 4: Page Deletion While Referenced in Nav

#### 4A. User A deletes a page, User B's nav still references it
- **A** deletes the "Events" page from the Pages manager
- **B** has the nav editor open — "Events" item still shows with `href: "/events"`
- **Result:** Nav item still exists in the menu, pointing to a deleted page. Public site shows nav link to `/events` which returns 404.
- **Severity:** HIGH — broken link on public site
- **Current handling:** NONE — page deletion does not cascade to menu items
- **Fix needed:** Either (a) cascade: when a page is deleted, also delete/unlink menu items pointing to it, or (b) validate: show broken-link indicator in nav editor for items whose `href` points to a non-existent page

#### 4B. User A changes a page's slug, nav still references old slug
- **A** changes the "Events" page slug from `events` to `upcoming-events`
- Nav item still has `href: "/events"` → broken link
- **Severity:** HIGH — same as 4A
- **Current handling:** NONE
- **Fix needed:** Either (a) cascade: when a slug changes, update menu items referencing it, or (b) store `pageId` instead of `href` in menu items and resolve slugs at render time

#### 4C. User A unpublishes a page, nav still shows it
- **A** unpublishes the "Giving" page
- Nav item still visible in public navbar pointing to `/giving`
- Public site: page returns 404 (or redirect to homepage)
- **Severity:** MEDIUM — broken UX but not a crash
- **Fix needed:** Indicate unpublished pages in nav editor; optionally auto-hide nav items for unpublished pages

### Category 5: CTA / Navbar Settings Conflicts

#### 5A. Both users edit navbar settings simultaneously
- **A** changes scrollBehavior to "always-solid"
- **B** changes CTA label to "Visit Us"
- Both PATCH `/api/v1/site-settings/navbar`
- **Result:** Last PATCH wins on ALL fields (not just the one the user changed)
- **Severity:** MEDIUM — A's scrollBehavior change may be lost when B saves
- **Fix needed:** Field-level PATCH (only send changed fields) or use a read-modify-write pattern with optimistic locking

#### 5B. User A changes CTA target, User B deletes the target page
- **A** sets CTA to point to "/giving"
- **B** deletes the "Giving" page
- **Result:** CTA points to a deleted page
- **Severity:** Same as 4A — broken link on public site

### Category 6: Stale State After Operations

#### 6A. User edits nav item, navigates to different page, comes back
- User opens nav editor, edits "Events" label
- Navigates to a different page in the builder
- Another admin reorders the nav while User is on the other page
- User navigates back
- **Result:** `menuItems` state in `builder-shell` was refreshed via page RSC re-render, BUT the `headerMenuItemsFull` prop comes from the server component which re-fetches on each page navigation
- **Severity:** LOW — actually self-healing because page navigation triggers RSC re-render
- **Current handling:** PASS — server component always fetches fresh menu data

#### 6B. User has nav editor open for extended period (30+ min)
- User opens nav editor, goes to lunch
- Another admin makes 10 changes to the nav
- User comes back and starts editing
- **Result:** User's `menuItems` state is 30 minutes stale
- **Severity:** MEDIUM — all edits based on stale state
- **Current handling:** NONE — no background polling for nav data
- **Fix needed:** Background nav polling (similar to background-sync for sections) or refresh on tab visibility change

---

## Severity Summary

| Severity | Count | Items |
|----------|-------|-------|
| HIGH | 3 | 4A (page delete → broken link), 4B (slug change → broken link), 5B (CTA → deleted page) |
| MEDIUM | 5 | 2A, 2B (delete while editing), 3A (section rename race), 5A (settings overwrite), 6B (stale nav) |
| LOW | 6 | 1A-C (reorder races), 2C-D (add staleness), 3B (section delete+add), 4C (unpublish) |

---

## Proposed Solutions (Ranked by Impact/Effort)

### Solution 1: Page → Nav Cascade (HIGH impact, MEDIUM effort)

When a page is deleted or its slug changes, automatically update menu items that reference it.

**Option A: Cascade delete/unlink**
- When `deletePage(churchId, pageId)` is called, also find and delete/nullify menu items where `href` matches the page's slug
- Pro: Clean, no broken links
- Con: Surprises user — deleting a page silently removes nav items

**Option B: Store `pageId` instead of `href`**
- Change `MenuItem` to store `pageId` (FK to Page) instead of `href` string
- Resolve `href` at render time from `pageId → page.slug`
- Pro: Slug changes automatically reflected; delete can cascade via FK
- Con: Schema change, migration, external links still need `href`

**Option C: Validation indicator (lightest touch)**
- Keep current `href` string approach
- Add a validation check in nav editor: for each page-type item, verify the href matches an existing published page
- Show broken-link indicator (red icon / warning) for items pointing to missing pages
- Pro: No schema change, no cascade; admin sees the problem and fixes it
- Con: Doesn't prevent the problem, just surfaces it

**Recommendation:** Option C now (low effort, high visibility), Option B later (when we have time for schema migration).

### Solution 2: Nav Background Polling (MEDIUM impact, LOW effort)

Poll for nav changes every 15-30 seconds when the nav editor is open, similar to `use-background-sync.ts` for sections.

```
When activeTool === "navigation":
  - Every 15s, fetch GET /api/v1/menus/{menuId}/items
  - Compare with current menuItems (by hashing)
  - If different, update menuItems state
  - Preserve expandedIds and any open editors
```

This solves: 6B (stale state), 2C (missing new items), 1B (stale order).

### Solution 3: 404 Handling for Deleted Nav Items (MEDIUM impact, LOW effort)

When a PATCH to a menu item returns 404 (item was deleted by another user):
- Show toast: "This item was deleted by another user"
- Close the item editor
- Call `refreshMenu()` to get fresh state

Similar to the section 404 handling already implemented.

### Solution 4: Nav Reorder Reconciliation (LOW impact, MEDIUM effort)

Server-side reconciliation for reorder — similar to `reorderPageSections`:
- Accept client's itemIds array
- Filter out IDs that no longer exist in DB
- Append IDs that exist in DB but aren't in the client's array (new items)
- Apply the reconciled order

This solves: 2D (add + reorder race).

### Solution 5: Field-Level Nav Settings PATCH (LOW impact, LOW effort)

Only send changed fields in the navbar settings PATCH instead of all fields. This prevents 5A (settings overwrite).

Could be done client-side (track which fields changed) or server-side (merge instead of replace).

---

## What We Explicitly Do NOT Build for Nav

| Feature | Why Not |
|---------|---------|
| Nav-level locking | Same reasoning as page-level locking — blocks legitimate parallel work |
| Real-time nav sync (WebSocket) | Overkill for 1-3 admins editing monthly |
| Nav conflict modals | Church admins don't understand nav tree merge |
| Undo across users | "Undo User B's changes" is a different product (version history) |

---

## Implementation Priority

| Priority | Solution | Effort | Solves |
|----------|----------|--------|--------|
| P0 | Broken-link validation (Solution 1C) | 2h | 4A, 4B, 4C, 5B |
| P1 | 404 handling for deleted items (Solution 3) | 1h | 2A, 2B |
| P1 | Nav background polling (Solution 2) | 2h | 6B, 2C, 1B |
| P2 | Reorder reconciliation (Solution 4) | 2h | 2D |
| P2 | Field-level settings PATCH (Solution 5) | 1h | 5A |
| Future | `pageId` FK instead of `href` (Solution 1B) | 4h+ | 4A, 4B permanently |

---

## Why Builders Don't Do Merge Conflicts

You asked: *"I'm wondering if this is one of the reasons why they don't do merge conflict saves."*

Yes, exactly. Here's why every major builder avoids merge UIs:

1. **Navigation is a tree, not text.** Git-style diff/merge works for lines of code. A navigation tree has parent-child relationships, sort orders, groupLabels, and cross-references to pages. There's no natural "diff" view that a non-technical user could understand.

2. **The merge unit is too coarse.** A single menu item has 15+ fields (label, href, description, groupLabel, sortOrder, isExternal, openInNewTab, featuredImage, etc.). Merging at the field level within a JSON object is complex and the UI to present it would be overwhelming.

3. **Frequency doesn't justify complexity.** Real nav conflicts happen maybe once a month for a 3-admin church. Building a merge UI that's used once a month but must be maintained forever is poor ROI.

4. **Prevention > Resolution.** Presence awareness ("David is editing navigation") prevents 95% of conflicts by social convention. The remaining 5% are handled acceptably by last-write-wins + post-edit refresh.

The right approach is: **prevent conflicts through awareness, minimize blast radius through granularity (field-level PATCH), and accept last-write-wins for the rare true conflict.**
