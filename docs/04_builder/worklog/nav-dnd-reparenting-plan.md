# Navigation Editor: Cross-Level Drag-and-Drop Reparenting

**Date:** 2026-03-20
**Status:** IMPLEMENTED (2026-03-20)
**Priority:** P0 (blocks core builder UX)

---

## Problem

The navigation editor supports drag-and-drop reordering within the same level (top-level items among themselves, children within the same parent), but **cannot move items between parents via drag**. For example, dragging "Meetings" from the "Resources" dropdown into the "Our Church" dropdown doesn't work.

The root cause is architectural: nested `SortableContext` instances in `@dnd-kit` create **isolated drop zones**. Items in one context can't be dropped into a sibling context.

## Research Summary

Five parallel research tracks produced a clear consensus on the best approach:

| Approach | Description | Verdict |
|---|---|---|
| **A. Flattened tree + indentation** | Single `SortableContext` with all items flattened; horizontal drag offset determines depth | **Recommended** — used by dnd-kit's official SortableTree example, WordPress menu editor |
| B. `onDragOver` container swap | Keep nested contexts; move items between containers mid-drag via state updates in `onDragOver` | Complex, fragile with visual section grouping |
| C. `dnd-kit-sortable-tree` package | Drop-in npm package built from dnd-kit's tree example | Good fallback if custom impl is too costly |
| D. `useDroppable` on parents | Add drop targets on top-level items for reparenting | Works but no visual feedback during drag |
| E. Context menu "Move to" | No drag — use submenu to reparent | Already implemented as interim solution |

## Recommended Approach: Flattened Tree with Indentation

This is the pattern used by **dnd-kit's official SortableTree example** and the **WordPress menu editor**. It's proven, intuitive, and works within `@dnd-kit@6.x` (our current version).

### Core Concept

1. **Flatten the entire tree** into a single ordered array
2. **One `SortableContext`** with all items (no nesting)
3. **Visual indentation** via CSS `paddingLeft` based on depth
4. **During drag:** track horizontal offset (`delta.x`) to calculate the user's intended depth
5. **On drop:** determine new `parentId` based on the item above and the intended depth

### Data Model

```typescript
interface FlattenedItem {
  id: string              // MenuItem ID
  parentId: string | null // null = top-level
  depth: number           // 0 = top-level, 1 = child, 2 = grandchild...
  label: string
  // ... other MenuItem fields
}

// Example: flattening a tree
// Our Church (depth 0)
//   About (depth 1, section: "About")
//   Who We Are (depth 1, section: "About")
//   Events (depth 1, section: "Connect")
//   Meetings (depth 1, section: "Connect")
// Resources (depth 0)
//   Messages (depth 1, section: "The Word")
```

### Key Functions

```typescript
// 1. Flatten tree → ordered array
function flattenTree(items: MenuItemData[]): FlattenedItem[]

// 2. Calculate projected depth during drag
function getProjectedDepth(
  items: FlattenedItem[],
  activeId: string,
  overId: string,
  dragOffsetX: number,   // event.delta.x
  indentWidth: number,   // pixels per depth level (e.g. 28)
): { depth: number; parentId: string | null }

// 3. Reconstruct tree from flat array after drop
function buildTree(flatItems: FlattenedItem[]): MenuItemData[]
```

### Depth Projection Logic

The depth calculation is the heart of the system. During drag:

```
targetDepth = clamp(
  currentDepth + Math.round(dragOffset.x / INDENT_WIDTH),
  0,                          // min: top-level
  itemAbove.depth + 1         // max: one level deeper than item above
)
```

Rules:
- An item can only be a child of the **item directly above it** (or a sibling of it)
- Max depth = depth of item above + 1 (you can nest one level deeper)
- Min depth = 0 (top-level)
- The new `parentId` is determined by walking up from the item above until finding an item at `targetDepth - 1`

### Visual Feedback During Drag

```
INDENT_WIDTH = 28px

[item above]          depth=0
  [item above child]  depth=1
    ··· drop here ··· depth=2 (indented, shows as child of child)
  ··· drop here ···   depth=1 (same level as child)
··· drop here ···     depth=0 (top-level)
```

A **depth indicator line** shows the projected nesting level as the user drags left/right.

### DndContext Setup

```typescript
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragMove={handleDragMove}    // Track delta.x for depth projection
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
  <SortableContext
    items={flattenedIds}          // ALL items in one flat list
    strategy={verticalListSortingStrategy}
  >
    {flattenedItems.map(item => (
      <SortableNavItem
        key={item.id}
        id={item.id}
        depth={item.depth}
        indentWidth={INDENT_WIDTH}
        isGhost={item.id === activeId}
        projectedDepth={projected?.id === item.id ? projected.depth : undefined}
      />
    ))}
  </SortableContext>

  <DragOverlay>
    {activeItem && <NavItemOverlay item={activeItem} />}
  </DragOverlay>
</DndContext>
```

### API Integration

On `onDragEnd`, compute the final `parentId` and `sortOrder`, then:

1. **Same parent, different position:** `PUT /api/v1/menus/{menuId}/items` or `.../children` (reorder)
2. **Different parent:** `PATCH /api/v1/menus/{menuId}/items/{itemId}` with `{ parentId, sortOrder, groupLabel }`
3. **Promoted to top-level:** `PATCH` with `{ parentId: null, groupLabel: null }`

All existing API endpoints support these operations (verified: `parentId`, `sortOrder`, `groupLabel` are in the PATCH allowlist).

## Implementation Plan

### Phase 1: Flatten/Unflatten Utilities (no UI changes)

**Files:** New `components/cms/website/builder/navigation/tree-utils.ts`

- `flattenTree(items: MenuItemData[]): FlattenedItem[]`
- `buildTree(flatItems: FlattenedItem[]): MenuItemData[]`
- `getProjectedDepth(...)` — depth projection from drag offset
- `findNewParentId(items, activeId, overId, depth)` — resolve parent from projected depth
- Unit-testable, no side effects

### Phase 2: Replace SortableContext Architecture

**File:** `navigation-editor.tsx`

1. Replace `topLevelPrefixedIds` + nested `SortableContext` with single flat `SortableContext`
2. Remove prefix system (`top::`, `child::`) — no longer needed with flat list
3. Remove `childPrefixedIdsByParent` computation
4. Add `activeId` state for `DragOverlay`
5. Add `projectedDepth` state updated in `onDragMove`
6. Rewrite `handleDragEnd` to use `getProjectedDepth` result

### Phase 3: Visual Indentation + Drag Feedback

**File:** `SortableNavItem` and `SortableTopLevelItem` → unified into single `SortableTreeItem`

1. Merge `SortableTopLevelItem` and `SortableNavItem` into one component
2. Depth-based indentation: `paddingLeft: depth * INDENT_WIDTH`
3. During drag: show a **projected depth indicator** (vertical line at the projected indent level)
4. `DragOverlay` renders a clean snapshot of the dragged item (no children)
5. Collapse children when their parent starts being dragged

### Phase 4: Section Headers (groupLabel)

Section headers (`ABOUT`, `CONNECT`, `QUICK LINKS`, etc.) become non-draggable visual dividers:

- Render between items based on `groupLabel` changes in the flat list
- Not part of the `SortableContext` items array
- When an item is dropped into a new parent, inherit the `groupLabel` of the item it's dropped near (or `null` if at the start)

### Phase 5: Auto-Expand on Hover

During drag, if the user hovers over a collapsed parent for 500ms:
- Auto-expand it so children become visible drop targets
- Track via `onDragOver` + a timeout ref
- Clear timeout on drag leave or drop

## Technical Constraints

| Constraint | How Addressed |
|---|---|
| @dnd-kit version (`core@6.3.1`, `sortable@10.0.0`) | Flattened tree pattern works with v6.x — no upgrade needed |
| Section headers (groupLabel) | Non-sortable visual dividers between items in flat list |
| Expand/collapse | Collapsed items excluded from flat list; auto-expand on hover during drag |
| API compatibility | All endpoints already support `parentId` + `sortOrder` changes via PATCH |
| Max nesting depth | Enforce max depth of 1 (top-level + children only, matching current menu structure) |
| DragOverlay | Required for flattened approach — prevents DOM tree disruption during drag |

## Reference Implementations

| Source | URL | Notes |
|---|---|---|
| dnd-kit SortableTree example | `github.com/clauderic/dnd-kit/tree/master/stories/3 - Examples/Tree` | Official reference implementation |
| dnd-kit-sortable-tree npm | `github.com/Shaddix/dnd-kit-sortable-tree` | Drop-in package extracted from dnd-kit examples |
| WordPress Menu Editor | Built-in WP admin | Indentation-based reparenting UX reference |
| react-arborist | `github.com/brimdata/react-arborist` | VSCode/Figma-style tree with full reparenting |

## Files to Create/Modify

| File | Action | Description |
|---|---|---|
| `navigation/tree-utils.ts` | **Create** | Flatten/unflatten/projection utilities |
| `navigation/navigation-editor.tsx` | **Major rewrite** | Replace nested SortableContext with flat tree DnD |
| `navigation/sortable-tree-item.tsx` | **Create** | Unified sortable item component (replaces SortableTopLevelItem + SortableNavItem) |
| `navigation/depth-indicator.tsx` | **Create** | Visual depth indicator shown during drag |

## Estimated Scope

- **Phase 1 (utilities):** ~100 lines, self-contained
- **Phase 2 (architecture):** ~200 lines changed in navigation-editor.tsx
- **Phase 3 (visual):** ~150 lines for new unified component + DragOverlay
- **Phase 4 (sections):** ~50 lines for section header rendering in flat list
- **Phase 5 (auto-expand):** ~30 lines

**Total:** ~500 lines of focused changes. The navigation-editor.tsx will get shorter overall because the dual-component system (SortableTopLevelItem + SortableNavItem) merges into one.

## Interim Solution (Already Shipped)

While this plan is implemented, users can reparent items via:
- **Context menu (three dots) > "Move to"** submenu on any child item
- Lists all top-level dropdowns + "Top Level" as targets
- PATCHes `parentId` and refreshes the tree

---

## Implementation Notes (2026-03-20)

The plan was implemented as designed with the following deviations and details.

### What was built vs. planned

| Planned | Actual | Notes |
|---------|--------|-------|
| Phase 1: `tree-utils.ts` | Built as planned | `flattenTree`, `getProjection`, `removeItem`, `insertItem` -- 189 lines |
| Phase 2: Replace nested `SortableContext` | Built as planned | Single flat `SortableContext` with real item IDs (no `top::`/`child::` prefixes) |
| Phase 3: Unified `SortableTreeItem` | Built as planned | `sortable-tree-item.tsx` -- 489 lines, includes `TreeItemOverlay` for `DragOverlay` |
| Phase 4: Section headers | Built as planned | Non-sortable `groupLabel` dividers rendered between items based on boundary changes |
| Phase 5: Auto-expand on hover | **Not implemented** | Deferred -- manual expand/collapse works well enough for current menu sizes |
| `depth-indicator.tsx` | **Not created** | Visual depth feedback handled inline via `paddingLeft` on `SortableTreeItem` |

### Three new files created

| File | Lines | Responsibility |
|------|-------|---------------|
| `navigation/tree-utils.ts` | 189 | Pure data transforms: `flattenTree()`, `getProjection()`, `removeItem()`, `insertItem()`. No React, no side effects. |
| `navigation/sortable-tree-item.tsx` | 489 | Unified tree item component (replaces the old separate `SortableTopLevelItem` + `SortableNavItem`). Includes `SortableTreeItem` (drag-aware) and `TreeItemOverlay` (static snapshot for `DragOverlay`). Also contains `ItemContextMenu` with Move To submenu, type conversion, and page management. |
| `navigation/navigation-editor.tsx` | ~1100 | Rewritten to use flat tree DnD. Single `DndContext` + single `SortableContext`. Handles three drag outcomes: same-parent reorder, cross-parent reparent, promote to top-level. |

### Key implementation details

- **`flattenTree()`** takes `expandedIds: Set<string>` and only includes children of expanded parents. This means collapsed children are invisible to the `SortableContext`, preventing drops into collapsed groups.
- **`getProjection()`** enforces `MAX_DEPTH = 1` (top-level + one level of children only). It walks upward from the `overId` to find the nearest depth-0 item as the potential parent.
- **Drag outcomes** in `handleDragEnd`:
  - `oldParentId === newParentId && newParentId === null` -- top-level reorder via `PUT /api/v1/menus/{menuId}/items` with `{ itemIds }`
  - `oldParentId === newParentId && newParentId !== null` -- child reorder via `PUT /api/v1/menus/{menuId}/items/{parentId}/children` with `{ itemIds }`
  - `oldParentId !== newParentId` -- reparent via `PATCH /api/v1/menus/{menuId}/items/{itemId}` with `{ parentId, groupLabel: null }`
- **Optimistic updates**: `setItems()` called immediately before API call for instant UI feedback. `refreshMenu()` called after API to sync with server truth.
- **Auto-collapse on drag start**: When a top-level item is dragged, its children are collapsed (removed from `expandedIds`) so they don't appear as stale items in the list.
- **"Move to" context menu** retained as an alternative to drag for reparenting -- useful for accessibility and when items are far apart in the tree.
- **PointerSensor** activation constraint set to `{ distance: 5 }` to prevent accidental drags from clicks.
