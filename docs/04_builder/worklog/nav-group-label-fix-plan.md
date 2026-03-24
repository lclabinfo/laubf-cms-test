# Navigation Editor: Group Label (Column) Fix Plan

**Date:** 2026-03-20
**Status:** Plan
**Priority:** P0

---

## Problems

### 1. Drag reorder breaks groupLabel contiguity
When a child item is dragged within the same parent to a new position, its `sortOrder` changes but its `groupLabel` stays the same. This causes groups to split visually — e.g., "THE WORD" appears twice with "MEDIA" in between.

**Root cause:** The child reorder API (`PUT /api/v1/menus/{menuId}/items/{parentId}/children`) only updates `sortOrder`, not `groupLabel`. When items move across group boundaries via drag, the groupLabel needs to be updated to match the group they're dropped into.

### 2. Section headers are not interactive
Section headers (ABOUT, CONNECT, THE WORD, MEDIA, etc.) have no context menu. Users cannot:
- Rename a group
- Delete a group (ungroup items back to no group)
- See that groups are editable at all

### 3. Cross-parent reparenting doesn't assign groupLabel
When an item is moved to a different parent via drag or "Move to" context menu, its `groupLabel` is cleared (`null`). It should either inherit the group of the item it's dropped near, or be placed at the end.

## Fix Plan

### Fix 1: Update groupLabel on drag reorder

When `handleDragEnd` processes a same-parent child reorder, after computing the new position, determine which group the item is now in and update its `groupLabel` via PATCH.

Logic:
1. After `arrayMove`, find the items immediately above and below the moved item in the new order
2. If the item above has a `groupLabel`, use that
3. If no item above (first position), use the first group's label
4. PATCH the moved item's `groupLabel` if it changed

### Fix 2: Make section headers interactive

Add a context menu to each section header in the flattened tree render with:
- **Rename** — inline edit to change the groupLabel on all items in that group
- **Delete group** — set `groupLabel: null` on all items in the group (ungroups them)

### Fix 3: Inherit groupLabel on reparent

When an item is dropped into a new parent at depth=1:
- Find the item above it in the new parent
- Inherit that item's `groupLabel`
- PATCH with both `parentId` and `groupLabel`

## Files to Change

| File | Change |
|---|---|
| `navigation-editor.tsx` | Update handleDragEnd to PATCH groupLabel on child reorder; add section header context menu; inherit groupLabel on reparent |
| `tree-utils.ts` | No changes needed |
| `sortable-tree-item.tsx` | No changes needed |

## API Compatibility

All changes use existing PATCH endpoint — `groupLabel` is already in the allowlist. No backend changes needed.
