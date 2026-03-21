/**
 * Pure utility functions for flattening/unflattening a navigation menu tree
 * and calculating depth projections during drag-and-drop.
 *
 * No React, no UI — just data transforms.
 */

import type { MenuItemData } from "./navigation-editor"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlattenedItem {
  /** The original menu item data */
  item: MenuItemData
  /** 0 = top-level, 1 = child */
  depth: number
  /** Parent item id, or null for top-level items */
  parentId: string | null
  /** Position in the flat array */
  index: number
  /** Whether this is a real item or a virtual section header */
  type: "item" | "section-header"
  /** Set for section headers and their member items */
  groupLabel?: string | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function sortBySortOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder)
}

// ---------------------------------------------------------------------------
// Section ID helpers
// ---------------------------------------------------------------------------

/**
 * Parse a virtual section header id like "section::parentId::groupLabel"
 * into its component parts. Returns null if the id is not a section header.
 */
export function parseSectionId(id: string): { parentId: string; groupLabel: string } | null {
  if (!id.startsWith("section::")) return null
  const parts = id.split("::")
  return { parentId: parts[1], groupLabel: parts.slice(2).join("::") }
}

/**
 * Check whether an id represents a virtual section header.
 */
export function isSectionId(id: string): boolean {
  return id.startsWith("section::")
}

// ---------------------------------------------------------------------------
// getItemsInGroup
// ---------------------------------------------------------------------------

/**
 * Return all real (non-header) flattened items that belong to a specific
 * group under the given parent.
 */
export function getItemsInGroup(items: FlattenedItem[], parentId: string, groupLabel: string): FlattenedItem[] {
  return items.filter(fi => fi.parentId === parentId && fi.type === "item" && fi.item.groupLabel === groupLabel)
}

// ---------------------------------------------------------------------------
// flattenTree
// ---------------------------------------------------------------------------

/**
 * Create a minimal fake MenuItemData for a virtual section header.
 */
function makeSectionHeaderItem(parentItem: MenuItemData, groupLabel: string): MenuItemData {
  return {
    id: `section::${parentItem.id}::${groupLabel}`,
    menuId: parentItem.menuId,
    label: groupLabel,
    href: null,
    description: null,
    iconName: null,
    openInNewTab: false,
    isExternal: false,
    parentId: parentItem.id,
    groupLabel: groupLabel,
    featuredImage: null,
    featuredTitle: null,
    featuredDescription: null,
    featuredHref: null,
    scheduleMeta: null,
    sortOrder: -1,
    isVisible: true,
  }
}

/**
 * Flatten a tree-shaped menu (top-level items with `children` arrays) into a
 * single ordered array. Top-level items get depth 0, their children get
 * depth 1. Items are sorted by `sortOrder` at each level. Children are only
 * included when their parent is in `expandedIds`.
 *
 * When a parent is expanded, children are grouped by `groupLabel`. A virtual
 * section header entry is inserted before each group of items that share a
 * non-null `groupLabel`. Items with `groupLabel: null` are emitted without
 * a header.
 */
export function flattenTree(
  items: MenuItemData[],
  expandedIds: Set<string>,
): FlattenedItem[] {
  const result: FlattenedItem[] = []
  let index = 0

  for (const item of sortBySortOrder(items)) {
    result.push({ item, depth: 0, parentId: null, index: index++, type: "item" })

    if (item.children?.length && expandedIds.has(item.id)) {
      const sortedChildren = sortBySortOrder(item.children)

      // Collect distinct group labels in their first-appearance order
      const seenGroups = new Set<string>()
      const groupOrder: (string | null)[] = []
      for (const child of sortedChildren) {
        const gl = child.groupLabel ?? null
        const key = gl ?? "__null__"
        if (!seenGroups.has(key)) {
          seenGroups.add(key)
          groupOrder.push(gl)
        }
      }

      // Emit children grouped, with section headers for non-null groups
      for (const gl of groupOrder) {
        const groupChildren = sortedChildren.filter(c => (c.groupLabel ?? null) === gl)

        if (gl !== null) {
          // Insert virtual section header
          result.push({
            item: makeSectionHeaderItem(item, gl),
            depth: 1,
            parentId: item.id,
            index: index++,
            type: "section-header",
            groupLabel: gl,
          })
        }

        for (const child of groupChildren) {
          result.push({
            item: child,
            depth: 1,
            parentId: item.id,
            index: index++,
            type: "item",
            groupLabel: gl,
          })
        }
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// getProjection
// ---------------------------------------------------------------------------

/**
 * During a drag operation, calculate where the dragged item would land based
 * on the current pointer position.
 *
 * @param items      - The current flattened list (with the active item still present)
 * @param activeId   - The id of the item being dragged
 * @param overId     - The id of the item the pointer is currently over
 * @param dragOffsetX - Horizontal drag distance in pixels (event.delta.x)
 * @param indentWidth - Pixels per depth level (typically 28)
 * @returns The projected depth and parentId, or null if projection is impossible
 */
export function getProjection(
  items: FlattenedItem[],
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentWidth: number,
): { depth: number; parentId: string | null } | null {
  const MAX_DEPTH = 1

  // If overId is a section header, resolve it to the first real item in that
  // section so we project against a valid drop target.
  let resolvedOverId = overId
  if (isSectionId(overId)) {
    const parsed = parseSectionId(overId)
    if (parsed) {
      const firstInGroup = items.find(
        i => i.type === "item" && i.parentId === parsed.parentId && i.item.groupLabel === parsed.groupLabel,
      )
      if (firstInGroup) {
        resolvedOverId = firstInGroup.item.id
      } else {
        // Section header with no items — find the parent instead
        const parent = items.find(i => i.item.id === parsed.parentId)
        if (parent) {
          resolvedOverId = parent.item.id
        } else {
          return null
        }
      }
    }
  }

  const overIndex = items.findIndex((i) => i.item.id === resolvedOverId)
  const activeIndex = items.findIndex((i) => i.item.id === activeId)

  if (overIndex === -1 || activeIndex === -1) return null

  const activeItem = items[activeIndex]

  // Build a list without the active item to reason about surroundings
  const itemsWithoutActive = items.filter((i) => i.item.id !== activeId)

  // Find where overId sits in the filtered list
  const overIndexFiltered = itemsWithoutActive.findIndex(
    (i) => i.item.id === resolvedOverId,
  )
  if (overIndexFiltered === -1) return null

  // The item directly above the insertion point
  const itemAbove = itemsWithoutActive[overIndexFiltered]

  // Calculate projected depth from the drag offset
  const depthOffset = Math.round(dragOffsetX / indentWidth)
  let projectedDepth = clamp(activeItem.depth + depthOffset, 0, MAX_DEPTH)

  // Depth cannot exceed one level deeper than the item above
  if (itemAbove) {
    const maxAllowed = Math.min(itemAbove.depth + 1, MAX_DEPTH)
    projectedDepth = clamp(projectedDepth, 0, maxAllowed)
  } else {
    // No item above means this is the very top — must be depth 0
    projectedDepth = 0
  }

  // Determine parentId based on projected depth
  let parentId: string | null = null

  if (projectedDepth === 1) {
    // Walk upward from the insertion point to find the nearest depth-0 item
    for (let i = overIndexFiltered; i >= 0; i--) {
      if (itemsWithoutActive[i].depth === 0) {
        parentId = itemsWithoutActive[i].item.id
        break
      }
    }

    // If no depth-0 parent found, fall back to top-level
    if (parentId === null) {
      projectedDepth = 0
    }
  }

  return { depth: projectedDepth, parentId }
}

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------

/**
 * Remove an item from the flat array by id and re-index the remaining items.
 */
export function removeItem(
  items: FlattenedItem[],
  id: string,
): FlattenedItem[] {
  return items
    .filter((i) => i.item.id !== id)
    .map((i, idx) => ({ ...i, index: idx }))
}

// ---------------------------------------------------------------------------
// insertItem
// ---------------------------------------------------------------------------

/**
 * Insert the active item into the flat array at the position of `overId`,
 * applying the projected depth and parentId.
 */
export function insertItem(
  items: FlattenedItem[],
  activeItem: FlattenedItem,
  overId: string,
  projected: { depth: number; parentId: string | null },
): FlattenedItem[] {
  const overIndex = items.findIndex((i) => i.item.id === overId)
  if (overIndex === -1) return items

  const updatedItem: FlattenedItem = {
    ...activeItem,
    depth: projected.depth,
    parentId: projected.parentId,
    index: 0, // will be re-indexed below
  }

  const result = [...items]
  result.splice(overIndex, 0, updatedItem)

  // Re-index
  return result.map((i, idx) => ({ ...i, index: idx }))
}
