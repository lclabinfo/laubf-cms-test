# Navigation Editor -- Technical Architecture

> **Date:** March 20, 2026
> **Status:** Implemented
> **Companion docs:** `navigation-editor-spec.md` (requirements), `../worklog/nav-dnd-reparenting-plan.md` (design plan + implementation notes)

---

## Overview

The navigation editor lets admins manage the website's navbar menu structure via drag-and-drop in the builder sidebar. It uses a **flat tree DnD pattern** -- all items (top-level and expanded children) live in a single `SortableContext`, with horizontal drag offset determining nesting depth.

This replaces an earlier architecture that used nested `SortableContext` instances (one per parent), which prevented cross-parent drag-and-drop.

---

## File Map

| File | Lines | Responsibility |
|------|-------|---------------|
| `components/cms/website/builder/navigation/tree-utils.ts` | ~190 | Pure data transforms. No React, no side effects. |
| `components/cms/website/builder/navigation/sortable-tree-item.tsx` | ~490 | Unified tree item component + DragOverlay snapshot + context menu. |
| `components/cms/website/builder/navigation/navigation-editor.tsx` | ~1100 | Main editor component: DnD orchestration, CRUD operations, inline add UI, CTA section, hidden pages. |
| `components/cms/website/builder/navigation-item-editor.tsx` | ~400 | Right-drawer form for editing individual nav item properties (label, URL, description, featured fields, schedule metadata). |

---

## Core Pattern: Flat Tree DnD

### The Problem

`@dnd-kit`'s `SortableContext` creates an isolated drop zone. With nested contexts (one for top-level, one per parent's children), items cannot be dragged between parents. This is an architectural limitation, not a bug.

### The Solution

Flatten the entire visible tree into a single ordered array. One `SortableContext` holds all items. Visual nesting is achieved via CSS `paddingLeft` based on depth. During drag, the horizontal pointer offset (`delta.x`) determines the user's intended depth level.

```
DndContext
  SortableContext items=[allVisibleItemIds]
    SortableTreeItem  "Our Church"       depth=0
    SortableTreeItem  "Who We Are"       depth=1  (paddingLeft: 28px)
    SortableTreeItem  "Events"           depth=1
    SortableTreeItem  "Ministries"       depth=0
    SortableTreeItem  "Resources"        depth=0
  DragOverlay
    TreeItemOverlay (clean snapshot of dragged item)
```

### Max Depth

Enforced at 1 (top-level items at depth 0, children at depth 1). This matches the website's mega-menu structure which supports only one level of nesting.

---

## tree-utils.ts -- Data Transform Functions

### `flattenTree(items, expandedIds)`

Converts a tree-shaped menu (top-level items with `children` arrays) into a flat ordered array of `FlattenedItem` objects. Each item gets a `depth` (0 or 1), `parentId`, and `index`.

- Items are sorted by `sortOrder` at each level
- Children are only included when their parent's ID is in `expandedIds`
- This means collapsed parents hide their children from the `SortableContext`, preventing invalid drops

### `getProjection(items, activeId, overId, dragOffsetX, indentWidth)`

The core algorithm. During a drag, calculates where the dragged item would land:

1. Removes the active item from the list to reason about surrounding items
2. Finds the item at the `overId` position (the item the pointer is over)
3. Calculates projected depth: `clamp(currentDepth + round(dragOffsetX / indentWidth), 0, MAX_DEPTH)`
4. Constrains depth: cannot exceed `itemAbove.depth + 1` (can nest at most one level deeper than the item above)
5. Determines `parentId`: if projected depth is 1, walks upward from `overId` to find the nearest depth-0 item

Returns `{ depth, parentId }` or `null` if projection is impossible.

### `removeItem(items, id)` and `insertItem(items, activeItem, overId, projected)`

Array manipulation helpers for reordering within the flattened list. Used internally for computing new positions.

---

## sortable-tree-item.tsx -- Unified Item Component

### `SortableTreeItem`

A single component that renders both top-level items and children. Visual differentiation comes from props, not separate component types.

Key visual elements per item:
- **Drag handle** (`GripVertical`) -- touch-none, cursor-grab
- **Expand/collapse chevron** -- only on top-level items with children
- **Type icon** -- `Folder` (dropdown), `FileText` (page), `ExternalLink`, `Star` (featured)
- **Label** -- clickable when item resolves to a page (navigates to that page in the canvas)
- **Type badge** -- "dropdown", "page + dropdown", "external", "featured"
- **Active page indicator** -- checkmark + accent border when the item's page matches the active canvas page
- **Context menu** (`MoreHorizontal`) -- appears on hover

Indentation is applied via `style={{ paddingLeft: depth * indentWidth }}`.

When `isGhost` is true (the item is being dragged), opacity drops to 0.3 to show the item's original position.

### `TreeItemOverlay`

A static (non-interactive) render of an item used inside `DragOverlay`. Shows the same visual layout but without drag handles, expand/collapse, or context menus. Has `shadow-lg` and border for visual lift.

### `ItemContextMenu`

Context menu attached to each tree item. Actions vary by item type and depth:

| Action | When available |
|--------|--------------|
| Edit Properties | Always (opens NavItemEditor in right drawer) |
| Add Item | Dropdown items only |
| Add Section | Dropdown items only |
| Convert to Page / Convert to Dropdown | Type conversion for top-level items |
| Page Settings / Duplicate Page / Delete Page | Items that resolve to a page |
| Move to (submenu) | Child items only (depth > 0) -- lists all top-level items + "Top Level" |
| Remove from Menu | Always (destructive, last item) |

---

## navigation-editor.tsx -- DnD Orchestration

### State

```typescript
const [items, setItems] = useState<MenuItemData[]>(menuItems)
const [expandedIds, setExpandedIds] = useState<Set<string>>(/* initially all top-level */)
const [activeId, setActiveId] = useState<string | null>(null)
const [overId, setOverId] = useState<string | null>(null)
const [offsetLeft, setOffsetLeft] = useState(0)
```

### DnD Setup

```typescript
<DndContext
  sensors={sensors}                    // PointerSensor (distance: 5) + KeyboardSensor
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragMove={handleDragMove}
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
  <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
    {/* flattenedItems mapped to SortableTreeItem components */}
    {/* Non-sortable section headers inserted between groupLabel boundaries */}
  </SortableContext>
  <DragOverlay>
    {activeItem && <TreeItemOverlay ... />}
  </DragOverlay>
</DndContext>
```

### Drag Lifecycle

1. **`onDragStart`**: Records `activeId`. If the dragged item is an expanded top-level parent, collapses it (removes from `expandedIds`) so children disappear from the flat list during drag.

2. **`onDragMove`**: Records `delta.x` as `offsetLeft` and the current `overId`. The `projected` value (depth + parentId) is recalculated on every render via `getProjection()`.

3. **`onDragEnd`**: Computes the final projection, then dispatches one of three outcomes:

| Outcome | Condition | API Call | Payload |
|---------|-----------|----------|---------|
| **Top-level reorder** | `oldParentId === null && newParentId === null` | `PUT /api/v1/menus/{menuId}/items` | `{ itemIds: [reorderedIds] }` |
| **Child reorder** | `oldParentId === newParentId` (non-null) | `PUT /api/v1/menus/{menuId}/items/{parentId}/children` | `{ itemIds: [reorderedIds] }` |
| **Reparent** | `oldParentId !== newParentId` | `PATCH /api/v1/menus/{menuId}/items/{itemId}` | `{ parentId, groupLabel: null }` |

All outcomes use **optimistic updates** (`setItems()` before the API call) followed by `refreshMenu()` to sync with server truth.

4. **`onDragCancel`**: Resets all drag state (`activeId`, `overId`, `offsetLeft`).

### Section Headers

Section headers (e.g., "ABOUT", "CONNECT", "QUICK LINKS") are non-sortable visual dividers rendered between items when the `groupLabel` changes. They are not part of the `SortableContext` items array -- they are plain `<div>` elements inserted during the `flattenedItems.map()` render loop.

When an item is reparented to a new parent, its `groupLabel` is set to `null` via the PATCH call. The admin can then assign a new group via the item editor.

---

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/menus/{menuId}/items` | Fetch full menu tree (used by `refreshMenu()`) |
| `POST` | `/api/v1/menus/{menuId}/items` | Create a new menu item |
| `PUT` | `/api/v1/menus/{menuId}/items` | Reorder top-level items (`{ itemIds }`) |
| `PUT` | `/api/v1/menus/{menuId}/items/{parentId}/children` | Reorder children within a parent (`{ itemIds }`) |
| `PATCH` | `/api/v1/menus/{menuId}/items/{itemId}` | Update item fields (reparenting uses `parentId` + `groupLabel`) |
| `DELETE` | `/api/v1/menus/{menuId}/items/{itemId}` | Delete item (cascades to children via `deleteDescendants`) |

The PATCH endpoint uses a field allowlist: `label`, `href`, `description`, `iconName`, `openInNewTab`, `isExternal`, `parentId`, `groupLabel`, `featuredImage`, `featuredTitle`, `featuredDescription`, `featuredHref`, `sortOrder`, `isVisible`, `scheduleMeta`.

All mutation endpoints call `revalidatePath('/website', 'layout')` to bust the public site's menu cache.

---

## Data Flow

```
User drags item
  |
  v
handleDragMove -> setOffsetLeft(delta.x), setOverId
  |
  v
getProjection(flattenedItems, activeId, overId, offsetLeft, 28)
  -> { depth: 0|1, parentId: string|null }
  |
  v
handleDragEnd
  |
  +-- same parent? --> arrayMove + PUT reorder endpoint
  |
  +-- different parent? --> PATCH with { parentId, groupLabel: null }
  |
  v
Optimistic setItems() -> UI updates instantly
  |
  v
refreshMenu() -> GET fresh tree from server -> setItems() with server truth
  |
  v
onMenuChange() -> triggers iframe reload so public preview reflects changes
```

---

## NavItemEditor (Right Drawer Form)

Located at `navigation-item-editor.tsx`. Opens in the builder's right drawer when "Edit Properties" is selected from the context menu.

The editor form adapts based on item type (inferred from field combinations):

| Item Type | Fields Shown |
|-----------|-------------|
| Page | Label, Page Select dropdown, Description |
| External Link | Label, URL, Open in New Tab toggle, Schedule Metadata, Description |
| Featured | Label, Featured Title, Featured Description, Featured Href, Featured Image |
| Top-Level Folder | Label, Description |
| Top-Level Page | Label, Page Select dropdown, Description |

Uses shared editor primitives from `section-editors/shared/field-primitives.tsx` (`EditorInput`, `EditorTextarea`, `EditorToggle`, `EditorSelect`) and `media-fields.tsx` (`ImagePickerField`).

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Flat tree, not nested contexts | `@dnd-kit` nested `SortableContext` prevents cross-context drops. Flat tree is the official recommended pattern. |
| Max depth = 1 | Matches the website mega-menu structure. Deeper nesting adds complexity without UX value. |
| `getProjection()` uses horizontal offset | Matches WordPress menu editor UX -- drag left/right to change nesting level. Intuitive for tree reordering. |
| Optimistic updates + server refresh | Instant UI feedback. Server is source of truth. If API fails, `refreshMenu()` restores correct state. |
| "Move to" context menu retained | Accessibility fallback for drag. Also useful when source and target are far apart in the tree. |
| Auto-collapse on drag | Prevents confusing state where children appear as separate drag targets while their parent is being dragged. |
| Phase 5 (auto-expand on hover) deferred | Menu trees are small enough that manual expand/collapse works well. Can add later if menus grow. |
| No separate `depth-indicator.tsx` | The `paddingLeft` on `SortableTreeItem` provides sufficient visual feedback during drag. A dedicated indicator line was unnecessary. |
