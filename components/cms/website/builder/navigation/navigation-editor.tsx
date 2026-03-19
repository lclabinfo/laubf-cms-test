"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  EyeOff,
  FileText,
  Folder,
  GripVertical,
  Link,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { PageSummary } from "../types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw MenuItem from the API (matches Prisma shape). */
export interface MenuItemData {
  id: string
  menuId: string
  label: string
  href: string | null
  description: string | null
  iconName: string | null
  openInNewTab: boolean
  isExternal: boolean
  parentId: string | null
  groupLabel: string | null
  featuredImage: string | null
  featuredTitle: string | null
  featuredDescription: string | null
  featuredHref: string | null
  scheduleMeta: string | null
  sortOrder: number
  isVisible: boolean
  children?: MenuItemData[]
}

export type NavItemType =
  | "folder-dropdown"
  | "page-dropdown"
  | "page"
  | "external-link"
  | "featured"

export interface NavigationEditorProps {
  churchId: string
  menuId: string
  menuItems: MenuItemData[]
  pages: PageSummary[]
  ctaLabel: string | null
  ctaHref: string | null
  ctaVisible: boolean
  onEditItem?: (itemId: string) => void
  onMenuChange?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferItemType(item: MenuItemData, hasChildren: boolean): NavItemType {
  if (item.parentId === null) {
    if (item.href && hasChildren) return "page-dropdown"
    if (!item.href && hasChildren) return "folder-dropdown"
    if (item.href) return "page"
  }
  if (item.featuredTitle && item.sortOrder >= 99) return "featured"
  if (item.isExternal) return "external-link"
  return "page"
}

function TypeIcon({ type, className }: { type: NavItemType; className?: string }) {
  switch (type) {
    case "folder-dropdown":
      return <Folder className={className} />
    case "page-dropdown":
      return <FileText className={className} />
    case "page":
      return <FileText className={className} />
    case "external-link":
      return <ExternalLink className={className} />
    case "featured":
      return <Star className={className} />
  }
}

function getTypeBadge(type: NavItemType): string | null {
  switch (type) {
    case "folder-dropdown":
      return "dropdown"
    case "page-dropdown":
      return "page + dropdown"
    case "external-link":
      return "external"
    case "featured":
      return "featured"
    default:
      return null
  }
}

/** Group children by groupLabel, preserving order. */
interface ChildGroup {
  label: string | null
  items: MenuItemData[]
}

function groupChildrenByLabel(children: MenuItemData[]): ChildGroup[] {
  const groups: ChildGroup[] = []
  let currentLabel: string | null | undefined = undefined

  const sorted = [...children].sort((a, b) => a.sortOrder - b.sortOrder)

  for (const child of sorted) {
    if (child.groupLabel !== currentLabel) {
      currentLabel = child.groupLabel
      groups.push({ label: child.groupLabel, items: [] })
    }
    groups[groups.length - 1].items.push(child)
  }

  return groups
}

// ---------------------------------------------------------------------------
// SortableNavItem
// ---------------------------------------------------------------------------

interface SortableNavItemProps {
  item: MenuItemData
  onEditItem?: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
}

function SortableNavItem({ item, onEditItem, onDeleteItem }: SortableNavItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  const type = inferItemType(item, false)
  const badge = getTypeBadge(type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/item flex items-center gap-1.5 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/50",
        isDragging && "opacity-50 bg-muted/30",
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground shrink-0 touch-none"
      >
        <GripVertical className="size-3.5" />
      </div>

      {/* Icon */}
      <TypeIcon type={type} className="size-3.5 shrink-0 text-muted-foreground/70" />

      {/* Label + description */}
      <button
        type="button"
        className="flex-1 min-w-0 text-left"
        onClick={() => onEditItem?.(item.id)}
      >
        <span className="text-xs font-medium text-foreground truncate block">
          {item.label}
        </span>
      </button>

      {/* Right side: description / scheduleMeta + badge */}
      <div className="flex items-center gap-1.5 shrink-0">
        {item.description && type === "page" && (
          <span className="text-[10px] text-muted-foreground/60 max-w-24 truncate hidden sm:inline">
            {item.description}
          </span>
        )}
        {item.scheduleMeta && type === "external-link" && (
          <span className="text-[10px] text-muted-foreground/60 max-w-28 truncate">
            {item.scheduleMeta}
          </span>
        )}
        {badge && (
          <span className="text-[9px] font-medium text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}

        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-5 w-5 rounded-sm transition-opacity shrink-0",
            "opacity-0 group-hover/item:opacity-100",
            "hover:bg-destructive/10 text-muted-foreground hover:text-destructive",
          )}
          onClick={(e) => {
            e.stopPropagation()
            onDeleteItem(item.id)
          }}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NavSectionHeader
// ---------------------------------------------------------------------------

interface NavSectionHeaderProps {
  label: string
  onRename: (newLabel: string) => void
  onDelete: () => void
}

function NavSectionHeader({ label, onRename, onDelete }: NavSectionHeaderProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [editValue, setEditValue] = useState(label)

  const handleRenameSubmit = () => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== label) {
      onRename(trimmed)
    }
    setIsRenaming(false)
  }

  return (
    <div className="flex items-center justify-between px-1 pt-3 pb-1">
      {isRenaming ? (
        <Input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSubmit()
            if (e.key === "Escape") setIsRenaming(false)
          }}
          className="h-5 text-[10px] font-semibold uppercase tracking-wider bg-transparent border-0 border-b border-muted-foreground/30 rounded-none px-0 py-0 focus-visible:ring-0"
        />
      ) : (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none">
          {label}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 rounded-sm hover:bg-muted/50 text-muted-foreground/40 hover:text-muted-foreground"
          >
            <MoreHorizontal className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => { setEditValue(label); setIsRenaming(true) }}>
            <Pencil className="size-3 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3 mr-2" /> Delete section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NavTopLevelItem
// ---------------------------------------------------------------------------

interface NavTopLevelItemProps {
  item: MenuItemData
  menuId: string
  isExpanded: boolean
  onToggleExpand: () => void
  onEditItem?: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onMenuChange?: () => void
}

function SortableTopLevelItem({
  item,
  menuId,
  isExpanded,
  onToggleExpand,
  onEditItem,
  onDeleteItem,
  onMenuChange,
}: NavTopLevelItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  const children = useMemo(() => item.children ?? [], [item.children])
  const hasChildren = children.length > 0
  const type = inferItemType(item, hasChildren)
  const badge = getTypeBadge(type)
  const groups = useMemo(() => groupChildrenByLabel(children), [children])

  // Sensors for child DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Add child item to a specific section
  const handleAddChildItem = useCallback(
    async (groupLabel: string | null) => {
      const label = prompt("Item label:")
      if (!label?.trim()) return

      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: label.trim(),
            parentId: item.id,
            groupLabel,
          }),
        })
        if (!res.ok) throw new Error("Failed to add item")
        toast.success("Item added")
        onMenuChange?.()
      } catch {
        toast.error("Failed to add item")
      }
    },
    [menuId, item.id, onMenuChange],
  )

  // Add a new section (group)
  const handleAddSection = useCallback(async () => {
    const label = prompt("Section name:")
    if (!label?.trim()) return

    try {
      // Create a placeholder item to establish the section
      const res = await fetch(`/api/v1/menus/${menuId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "New Item",
          parentId: item.id,
          groupLabel: label.trim(),
        }),
      })
      if (!res.ok) throw new Error("Failed to add section")
      toast.success("Section added")
      onMenuChange?.()
    } catch {
      toast.error("Failed to add section")
    }
  }, [menuId, item.id, onMenuChange])

  // Rename a section (update groupLabel on all items in that section)
  const handleRenameSection = useCallback(
    async (oldLabel: string, newLabel: string) => {
      const sectionItems = children.filter((c) => c.groupLabel === oldLabel)
      try {
        await Promise.all(
          sectionItems.map((child) =>
            fetch(`/api/v1/menus/${menuId}/items/${child.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ groupLabel: newLabel }),
            }),
          ),
        )
        toast.success("Section renamed")
        onMenuChange?.()
      } catch {
        toast.error("Failed to rename section")
      }
    },
    [menuId, children, onMenuChange],
  )

  // Delete a section (delete all items in that section)
  const handleDeleteSection = useCallback(
    async (groupLabel: string) => {
      const sectionItems = children.filter((c) => c.groupLabel === groupLabel)
      if (
        !confirm(
          `Delete section "${groupLabel}" and its ${sectionItems.length} item(s)?`,
        )
      )
        return

      try {
        await Promise.all(
          sectionItems.map((child) =>
            fetch(`/api/v1/menus/${menuId}/items/${child.id}`, {
              method: "DELETE",
            }),
          ),
        )
        toast.success("Section deleted")
        onMenuChange?.()
      } catch {
        toast.error("Failed to delete section")
      }
    },
    [menuId, children, onMenuChange],
  )

  // Child reorder within a parent
  const handleChildDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      // Flatten all children IDs in current order
      const allChildren = [...children].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      )
      const ids = allChildren.map((c) => c.id)
      const oldIndex = ids.indexOf(active.id as string)
      const newIndex = ids.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      // Reorder
      const reordered = [...ids]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      try {
        const res = await fetch(
          `/api/v1/menus/${menuId}/items/${item.id}/children`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemIds: reordered }),
          },
        )
        if (!res.ok) throw new Error("Failed to reorder")
        onMenuChange?.()
      } catch {
        toast.error("Failed to reorder items")
      }
    },
    [menuId, item.id, children, onMenuChange],
  )

  const allChildIds = useMemo(
    () =>
      [...children]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => c.id),
    [children],
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-border/50",
        isDragging && "opacity-50",
      )}
    >
      {/* Top-level row */}
      <div className="group/top flex items-center gap-1.5 px-2 py-2.5 hover:bg-muted/30 transition-colors">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground shrink-0 touch-none"
        >
          <GripVertical className="size-3.5" />
        </div>

        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="shrink-0 p-0.5 rounded hover:bg-muted/60"
          >
            {isExpanded ? (
              <ChevronDown className="size-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Icon */}
        <TypeIcon type={type} className="size-3.5 shrink-0 text-muted-foreground/70" />

        {/* Label */}
        <button
          type="button"
          className="flex-1 min-w-0 text-left"
          onClick={() => onEditItem?.(item.id)}
        >
          <span className="text-xs font-semibold text-foreground truncate block">
            {item.label}
          </span>
        </button>

        {/* Right side: badge + menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className="text-[9px] font-medium text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">
              {badge}
            </span>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 rounded-sm transition-opacity shrink-0",
                  "opacity-0 group-hover/top:opacity-100 data-[state=open]:opacity-100",
                  "hover:bg-muted text-muted-foreground",
                )}
              >
                <MoreHorizontal className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEditItem?.(item.id)}>
                <Pencil className="size-3 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteItem(item.id)}
              >
                <Trash2 className="size-3 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expanded children */}
      {hasChildren && isExpanded && (
        <div className="pl-6 pb-2">
          {/* Landing page indicator for page+dropdown */}
          {type === "page-dropdown" && item.href && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
              <div className="size-1.5 rounded-full bg-primary/60" />
              <span className="text-[10px] text-muted-foreground/70">
                Landing page{" "}
                <span className="text-muted-foreground/50">{item.href}</span>
              </span>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleChildDragEnd}
          >
            <SortableContext
              items={allChildIds}
              strategy={verticalListSortingStrategy}
            >
              {groups.map((group, gi) => (
                <div key={group.label ?? `group-${gi}`}>
                  {/* Section header */}
                  {group.label && (
                    <NavSectionHeader
                      label={group.label}
                      onRename={(newLabel) =>
                        handleRenameSection(group.label!, newLabel)
                      }
                      onDelete={() => handleDeleteSection(group.label!)}
                    />
                  )}

                  {/* Items in section */}
                  {group.items.map((child) => (
                    <SortableNavItem
                      key={child.id}
                      item={child}
                      onEditItem={onEditItem}
                      onDeleteItem={onDeleteItem}
                    />
                  ))}

                  {/* Add item to this section */}
                  <button
                    type="button"
                    onClick={() => handleAddChildItem(group.label)}
                    className="flex items-center gap-1.5 px-1 py-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full"
                  >
                    <Plus className="size-3" />
                    Add item
                  </button>
                </div>
              ))}
            </SortableContext>
          </DndContext>

          {/* Add section */}
          <button
            type="button"
            onClick={handleAddSection}
            className="flex items-center gap-1.5 px-1 py-1.5 mt-1 text-[10px] text-primary/70 hover:text-primary transition-colors w-full border-t border-border/30 pt-2"
          >
            <Plus className="size-3" />
            Add section
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NavCTASection
// ---------------------------------------------------------------------------

interface NavCTASectionProps {
  ctaLabel: string | null
  ctaHref: string | null
  ctaVisible: boolean
  onEditCTA?: () => void
}

function NavCTASection({
  ctaLabel,
  ctaHref,
  ctaVisible,
  onEditCTA,
}: NavCTASectionProps) {
  if (!ctaLabel && !ctaHref) return null

  return (
    <div className="border-t border-border/50 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none mb-2">
        CTA Button
      </div>
      <div className="flex items-center justify-between gap-2 px-1 py-1.5 rounded-md bg-muted/20">
        <div className="flex items-center gap-2 min-w-0">
          <Link className="size-3.5 shrink-0 text-primary/70" />
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground truncate">
              {ctaLabel || "CTA Button"}
            </div>
            {ctaHref && (
              <div className="text-[10px] text-muted-foreground/60 truncate">
                {ctaHref}
              </div>
            )}
          </div>
        </div>
        {!ctaVisible && (
          <span className="text-[9px] text-muted-foreground/40 bg-muted/40 px-1.5 py-0.5 rounded shrink-0">
            hidden
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] shrink-0"
          onClick={onEditCTA}
        >
          Edit
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NavHiddenPagesSection
// ---------------------------------------------------------------------------

interface NavHiddenPagesSectionProps {
  pages: PageSummary[]
  menuItemHrefs: Set<string>
  onAddHiddenPage?: () => void
}

function NavHiddenPagesSection({
  pages,
  menuItemHrefs,
  onAddHiddenPage,
}: NavHiddenPagesSectionProps) {
  // Hidden pages = published pages not referenced by any menu item
  const hiddenPages = useMemo(() => {
    return pages.filter((p) => {
      if (!p.isPublished) return false
      // Check if this page's slug is referenced by any menu item href
      const slug = p.slug || ""
      return (
        !menuItemHrefs.has(`/${slug}`) &&
        !menuItemHrefs.has(slug) &&
        !p.isHomepage
      )
    })
  }, [pages, menuItemHrefs])

  if (hiddenPages.length === 0 && !onAddHiddenPage) return null

  return (
    <div className="border-t border-border/50 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none mb-2">
        Hidden Pages
      </div>
      {hiddenPages.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/40 px-1 py-1">
          All published pages are in the navigation.
        </p>
      ) : (
        <div className="space-y-0.5">
          {hiddenPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center gap-2 px-1 py-1.5 rounded-md hover:bg-muted/30 transition-colors"
            >
              <EyeOff className="size-3 shrink-0 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/70 truncate flex-1">
                {page.title}
              </span>
              <span className="text-[10px] text-muted-foreground/40 shrink-0">
                /{page.slug}
              </span>
            </div>
          ))}
        </div>
      )}
      {onAddHiddenPage && (
        <button
          type="button"
          onClick={onAddHiddenPage}
          className="flex items-center gap-1.5 px-1 py-1.5 mt-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full"
        >
          <Plus className="size-3" />
          Add hidden page
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NavigationEditor (main component)
// ---------------------------------------------------------------------------

export function NavigationEditor({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  churchId,
  menuId,
  menuItems,
  pages,
  ctaLabel,
  ctaHref,
  ctaVisible,
  onEditItem,
  onMenuChange,
}: NavigationEditorProps) {
  // Local state for menu items
  const [items, setItems] = useState<MenuItemData[]>(menuItems)

  // Keep items in sync with props
  useEffect(() => {
    setItems(menuItems)
  }, [menuItems])

  // Expand/collapse state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // Start with all top-level items expanded
    return new Set(
      menuItems
        .filter((i) => i.parentId === null && (i.children?.length ?? 0) > 0)
        .map((i) => i.id),
    )
  })

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Top-level items (parentId === null), sorted
  const topLevelItems = useMemo(
    () =>
      [...items]
        .filter((i) => i.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  )

  const topLevelIds = useMemo(
    () => topLevelItems.map((i) => i.id),
    [topLevelItems],
  )

  // Collect all hrefs from all menu items (for hidden pages detection)
  const menuItemHrefs = useMemo(() => {
    const hrefs = new Set<string>()
    function collectHrefs(itemList: MenuItemData[]) {
      for (const item of itemList) {
        if (item.href && !item.isExternal) {
          hrefs.add(item.href)
          // Also add without leading slash
          if (item.href.startsWith("/")) {
            hrefs.add(item.href.slice(1))
          }
        }
        if (item.children) {
          collectHrefs(item.children)
        }
      }
    }
    collectHrefs(items)
    return hrefs
  }, [items])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Refresh menu data from API
  const refreshMenu = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items`)
      if (!res.ok) throw new Error("Failed to fetch menu")
      const { data } = await res.json()
      setItems(data.items ?? [])
      onMenuChange?.()
    } catch {
      toast.error("Failed to refresh menu data")
    }
  }, [menuId, onMenuChange])

  // Top-level reorder
  const handleTopLevelDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = topLevelIds.indexOf(active.id as string)
      const newIndex = topLevelIds.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...topLevelIds]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      // Optimistic update (immutable — create new objects, don't mutate)
      setItems((prev) =>
        prev.map((item) => {
          if (item.parentId !== null) return item
          const idx = reordered.indexOf(item.id)
          return idx !== -1 ? { ...item, sortOrder: idx } : item
        })
      )

      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIds: reordered }),
        })
        if (!res.ok) throw new Error("Failed to reorder")
        await refreshMenu()
      } catch {
        toast.error("Failed to reorder items")
        await refreshMenu()
      }
    },
    [menuId, topLevelIds, refreshMenu],
  )

  // Add top-level item
  const handleAddTopLevel = useCallback(async () => {
    const label = prompt("Item label:")
    if (!label?.trim()) return

    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      })
      if (!res.ok) throw new Error("Failed to add item")
      toast.success("Item added")
      await refreshMenu()
    } catch {
      toast.error("Failed to add item")
    }
  }, [menuId, refreshMenu])

  // Delete item
  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId)
        ?? items.flatMap((i) => i.children ?? []).find((c) => c.id === itemId)
      const hasChildren = item && 'children' in item && Array.isArray(item.children) && item.children.length > 0
      const message = hasChildren
        ? `Delete "${item?.label}" and all its children?`
        : `Delete "${item?.label}"?`

      if (!confirm(message)) return

      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete item")
        toast.success("Item deleted")
        await refreshMenu()
      } catch {
        toast.error("Failed to delete item")
      }
    },
    [menuId, items, refreshMenu],
  )

  // Loading state: if no items and no pages, show empty
  const isEmpty = topLevelItems.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add button */}
      <div className="flex items-center justify-between p-4 pb-2 border-b shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Navigation</h3>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={handleAddTopLevel}
        >
          <Plus className="size-3" />
          Add item
        </Button>
      </div>

      {/* Tree content */}
      <ScrollArea className="flex-1">
        <div>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Folder className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No navigation items</p>
              <p className="text-xs mt-1">
                Add your first menu item to get started.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleTopLevelDragEnd}
            >
              <SortableContext
                items={topLevelIds}
                strategy={verticalListSortingStrategy}
              >
                {topLevelItems.map((item) => (
                  <SortableTopLevelItem
                    key={item.id}
                    item={item}
                    menuId={menuId}
                    isExpanded={expandedIds.has(item.id)}
                    onToggleExpand={() => toggleExpand(item.id)}
                    onEditItem={onEditItem}
                    onDeleteItem={handleDeleteItem}
                    onMenuChange={refreshMenu}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {/* CTA Section */}
          <NavCTASection
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            ctaVisible={ctaVisible}
            onEditCTA={() => {
              // CTA editing would open in the right drawer
              // For now, this is a placeholder for Job C integration
            }}
          />

          {/* Hidden Pages Section */}
          <NavHiddenPagesSection
            pages={pages}
            menuItemHrefs={menuItemHrefs}
          />
        </div>
      </ScrollArea>
    </div>
  )
}
