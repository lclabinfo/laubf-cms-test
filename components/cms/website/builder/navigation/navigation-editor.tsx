"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import {
  DndContext,
  closestCenter,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import {
  ChevronDown,
  Copy,
  ExternalLink,
  EyeOff,
  FilePlus,
  Folder,
  Link,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  X,
  Check,
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
import { flattenTree, getProjection } from "./tree-utils"
import { SortableTreeItem, TreeItemOverlay } from "./sortable-tree-item"

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
  /** Opens the NavSettingsForm in the right drawer to edit CTA fields */
  onEditCTA?: () => void
  /** ID of the currently active page (for highlighting) */
  activePageId: string
  /** Navigate to a page in the canvas */
  onPageSelect: (pageId: string) => void
  /** Open page settings modal */
  onPageSettings?: (page: PageSummary) => void
  /** Open add page modal */
  onAddPage?: () => void
  /** Delete a page */
  onDeletePage?: (pageId: string) => void
  /** Duplicate a page */
  onDuplicatePage?: (pageId: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip leading "/" and /website/ prefix, query params for slug matching. */
function normalizeHref(href: string): string {
  let normalized = href
  if (normalized.startsWith("/website/")) {
    normalized = normalized.slice("/website".length)
  } else if (normalized === "/website") {
    normalized = "/"
  }
  const [pathPart] = normalized.split("?")
  return pathPart.replace(/^\//, "")
}

/** Resolve a nav item's href to a page ID using the pages array. */
function resolveHrefToPageId(
  href: string | null,
  pages: PageSummary[],
): string | null {
  if (!href) return null
  const slug = normalizeHref(href)
  // Homepage
  if (slug === "") {
    const homepage = pages.find((p) => p.isHomepage || p.slug === "")
    return homepage?.id ?? null
  }
  const match = pages.find((p) => p.slug === slug)
  return match?.id ?? null
}

// ---------------------------------------------------------------------------
// InlineAddInput -- replaces window.prompt() with inline field
// ---------------------------------------------------------------------------

interface InlineAddInputProps {
  placeholder: string
  onSubmit: (value: string) => void
  onCancel: () => void
}

function InlineAddInput({ placeholder, onSubmit, onCancel }: InlineAddInputProps) {
  const [value, setValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus on mount
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed) {
      onSubmit(trimmed)
    } else {
      onCancel()
    }
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-7 text-xs flex-1 bg-muted/30 border-border/50"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit()
          if (e.key === "Escape") onCancel()
        }}
        onBlur={onCancel}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-primary hover:text-primary"
        onMouseDown={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onMouseDown={(e) => {
          e.preventDefault()
          onCancel()
        }}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExternalLinkAddInput -- two-field inline input for adding external links
// ---------------------------------------------------------------------------

interface ExternalLinkAddInputProps {
  onSubmit: (label: string, url: string) => void
  onCancel: () => void
}

function ExternalLinkAddInput({ onSubmit, onCancel }: ExternalLinkAddInputProps) {
  const [label, setLabel] = useState("")
  const [url, setUrl] = useState("")
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    labelRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    const trimmedLabel = label.trim()
    const trimmedUrl = url.trim()
    if (trimmedLabel && trimmedUrl) {
      onSubmit(trimmedLabel, trimmedUrl)
    } else if (!trimmedLabel && !trimmedUrl) {
      onCancel()
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Input
          ref={labelRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label..."
          className="h-7 text-xs flex-1 bg-muted/30 border-border/50"
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel()
          }}
        />
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="h-7 text-xs flex-1 bg-muted/30 border-border/50"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit()
            if (e.key === "Escape") onCancel()
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-primary hover:text-primary"
          onMouseDown={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <Check className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
          onMouseDown={(e) => {
            e.preventDefault()
            onCancel()
          }}
        >
          <X className="size-3.5" />
        </Button>
      </div>
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
    <div className="border-t border-sidebar-border px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none mb-2">
        CTA Button
      </div>
      <div className="flex items-center justify-between gap-2 px-2 py-2 rounded-md bg-muted/20">
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
          <span className="text-[10px] text-muted-foreground/40 bg-muted/40 px-1.5 py-0.5 rounded-md shrink-0">
            hidden
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs shrink-0"
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
  activePageId: string
  onPageSelect: (pageId: string) => void
  onPageSettings?: (page: PageSummary) => void
  onDeletePage?: (pageId: string) => void
  onDuplicatePage?: (pageId: string) => void
  onAddHiddenPage?: () => void
}

function NavHiddenPagesSection({
  pages,
  menuItemHrefs,
  activePageId,
  onPageSelect,
  onPageSettings,
  onDeletePage,
  onDuplicatePage,
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
    <div className="border-t border-sidebar-border px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none mb-2">
        Hidden Pages
      </div>
      {hiddenPages.length === 0 ? (
        <p className="text-xs text-muted-foreground/40 px-2 py-1.5">
          All published pages are in the navigation.
        </p>
      ) : (
        <div className="space-y-1">
          {hiddenPages.map((page) => {
            const isActive = page.id === activePageId
            return (
              <div
                key={page.id}
                role="button"
                tabIndex={0}
                onClick={() => onPageSelect(page.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onPageSelect(page.id)
                  }
                }}
                className={cn(
                  "group/hidden flex items-center gap-2 px-2 py-2 rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent border-l-2 border-primary"
                    : "hover:bg-sidebar-accent",
                )}
              >
                <EyeOff className="size-3.5 shrink-0 text-muted-foreground/40" />
                <span className={cn(
                  "text-xs truncate flex-1",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground/70",
                )}>
                  {page.title}
                </span>
                <span className="text-[10px] text-muted-foreground/40 shrink-0">
                  /{page.slug}
                </span>

                {/* Active checkmark */}
                {isActive && (
                  <Check className="size-3.5 text-primary shrink-0" />
                )}

                {/* Context menu for page management */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6 rounded-md transition-opacity shrink-0",
                        "opacity-0 group-hover/hidden:opacity-100 data-[state=open]:opacity-100",
                        "hover:bg-muted text-muted-foreground",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {onPageSettings && (
                      <DropdownMenuItem onClick={() => onPageSettings(page)}>
                        <Settings className="size-3.5 mr-2" /> Page Settings
                      </DropdownMenuItem>
                    )}
                    {onDuplicatePage && (
                      <DropdownMenuItem onClick={() => onDuplicatePage(page.id)}>
                        <Copy className="size-3.5 mr-2" /> Duplicate Page
                      </DropdownMenuItem>
                    )}
                    {onDeletePage && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDeletePage(page.id)}
                        >
                          <Trash2 className="size-3.5 mr-2" /> Delete Page
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })}
        </div>
      )}
      {onAddHiddenPage && (
        <button
          type="button"
          onClick={onAddHiddenPage}
          className="flex items-center gap-2 px-2 py-2 mt-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full rounded-md hover:bg-muted/30"
        >
          <Plus className="size-3.5" />
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
  onEditCTA,
  activePageId,
  onPageSelect,
  onPageSettings,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
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

  // Inline add state for top-level
  const [addingTopLevel, setAddingTopLevel] = useState(false)
  const [addingExternalLink, setAddingExternalLink] = useState(false)

  // Drag state for flat tree
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [offsetLeft, setOffsetLeft] = useState(0)

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

  // Href-to-page resolver (memoized)
  const resolvePageId = useCallback(
    (href: string | null) => resolveHrefToPageId(href, pages),
    [pages],
  )

  // Top-level items (parentId === null), sorted
  const topLevelItems = useMemo(
    () =>
      [...items]
        .filter((i) => i.parentId === null)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  )

  // Flat tree for drag-and-drop
  const INDENT_WIDTH = 28

  const flattenedItems = useMemo(
    () => flattenTree(items.filter((i) => i.parentId === null), expandedIds),
    [items, expandedIds],
  )

  const sortableIds = useMemo(
    () => flattenedItems.map((fi) => fi.item.id),
    [flattenedItems],
  )

  // Projected depth during drag
  const projected = activeId && overId
    ? getProjection(flattenedItems, activeId, overId, offsetLeft, INDENT_WIDTH)
    : null

  // Collect all hrefs from all menu items (for hidden pages detection)
  const menuItemHrefs = useMemo(() => {
    const hrefs = new Set<string>()
    function collectHrefs(itemList: MenuItemData[]) {
      for (const item of itemList) {
        if (item.href && !item.isExternal) {
          // Strip query params for matching (e.g. "/events?tab=event" -> "/events")
          const [pathPart] = item.href.split("?")
          hrefs.add(pathPart)
          hrefs.add(item.href)
          // Also add without leading slash
          if (pathPart.startsWith("/")) {
            hrefs.add(pathPart.slice(1))
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

  // SINGLE DnD sensors for the entire tree
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

  // ---------------------------------------------------------------------------
  // Drag handlers
  // ---------------------------------------------------------------------------

  // Track which item was expanded before drag so we can restore after
  const dragExpandedRef = useRef<string | null>(null)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string
    setActiveId(id)
    setOverId(id)
    setOffsetLeft(0)

    // Collapse the dragged item's children during drag (visual clarity)
    // but remember it so we can re-expand after drop
    if (expandedIds.has(id)) {
      dragExpandedRef.current = id
      setExpandedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } else {
      dragExpandedRef.current = null
    }
  }, [expandedIds])

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    setOffsetLeft(event.delta.x)
    if (event.over) {
      setOverId(event.over.id as string)
    }
  }, [])

  const handleDragCancel = useCallback(() => {
    // Re-expand if we collapsed during drag
    if (dragExpandedRef.current) {
      setExpandedIds((prev) => new Set([...prev, dragExpandedRef.current!]))
      dragExpandedRef.current = null
    }
    setActiveId(null)
    setOverId(null)
    setOffsetLeft(0)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    // Re-expand if we collapsed during drag
    if (dragExpandedRef.current) {
      setExpandedIds((prev) => new Set([...prev, dragExpandedRef.current!]))
      dragExpandedRef.current = null
    }

    // Reset drag state
    setActiveId(null)
    setOverId(null)
    setOffsetLeft(0)

    if (!over || active.id === over.id) return

    const activeItem = flattenedItems.find((fi) => fi.item.id === active.id)
    const overItem = flattenedItems.find((fi) => fi.item.id === over.id)
    if (!activeItem || !overItem) return

    const projection = getProjection(
      flattenedItems,
      active.id as string,
      over.id as string,
      offsetLeft,
      INDENT_WIDTH,
    )
    if (!projection) return

    const { parentId: newParentId } = projection
    const oldParentId = activeItem.parentId

    if (oldParentId === newParentId) {
      // Same parent -- reorder
      if (newParentId === null) {
        // Top-level reorder
        const topItems = items
          .filter((i) => i.parentId === null)
          .sort((a, b) => a.sortOrder - b.sortOrder)
        const ids = topItems.map((i) => i.id)
        const oldIndex = ids.indexOf(active.id as string)
        const newIndex = ids.indexOf(over.id as string)
        if (oldIndex === -1 || newIndex === -1) return

        const reordered = arrayMove(ids, oldIndex, newIndex)

        // Optimistic update
        setItems((prev) =>
          prev.map((item) => {
            if (item.parentId !== null) return item
            const idx = reordered.indexOf(item.id)
            return idx !== -1 ? { ...item, sortOrder: idx } : item
          }),
        )

        try {
          await fetch(`/api/v1/menus/${menuId}/items`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemIds: reordered }),
          })
          await refreshMenu()
        } catch {
          toast.error("Failed to reorder items")
          await refreshMenu()
        }
      } else {
        // Same parent child reorder
        const parent = items.find((i) => i.id === newParentId)
        if (!parent?.children?.length) return
        const childIds = [...parent.children]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((c) => c.id)
        const oldIndex = childIds.indexOf(active.id as string)
        const newIndex = childIds.indexOf(over.id as string)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

        const reordered = arrayMove(childIds, oldIndex, newIndex)

        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== newParentId) return item
            const newChildren = (item.children ?? []).map((c) => {
              const idx = reordered.indexOf(c.id)
              return idx !== -1 ? { ...c, sortOrder: idx } : c
            })
            return { ...item, children: newChildren }
          }),
        )

        try {
          await fetch(`/api/v1/menus/${menuId}/items/${newParentId}/children`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemIds: reordered }),
          })
          await refreshMenu()
        } catch {
          toast.error("Failed to reorder items")
          await refreshMenu()
        }
      }
    } else {
      // Different parent -- reparent via PATCH
      try {
        await fetch(`/api/v1/menus/${menuId}/items/${active.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ parentId: newParentId, groupLabel: null }),
        })
        toast.success(newParentId ? "Item moved" : "Item moved to top level")
        await refreshMenu()
      } catch {
        toast.error("Failed to move item")
        await refreshMenu()
      }
    }
  }, [menuId, flattenedItems, items, offsetLeft, refreshMenu])

  // ---------------------------------------------------------------------------
  // API handler callbacks
  // ---------------------------------------------------------------------------

  // Add top-level item -- inline input replaces prompt()
  const handleAddTopLevel = useCallback(async (label: string) => {
    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      })
      if (!res.ok) throw new Error("Failed to add item")
      toast.success("Item added")
      await refreshMenu()
    } catch {
      toast.error("Failed to add item")
    }
  }, [menuId, refreshMenu])

  // Add external link -- inline input creates a MenuItem with isExternal
  const handleAddExternalLink = useCallback(async (label: string, url: string) => {
    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, href: url, isExternal: true, openInNewTab: true }),
      })
      if (!res.ok) throw new Error("Failed to add external link")
      toast.success("External link added")
      await refreshMenu()
    } catch {
      toast.error("Failed to add external link")
    }
  }, [menuId, refreshMenu])

  // Convert item to dropdown (remove href)
  const handleConvertToDropdown = useCallback(async (item: MenuItemData) => {
    try {
      const res = await fetch(`/api/v1/menus/${menuId}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ href: null }),
      })
      if (!res.ok) throw new Error("Failed to convert to dropdown")
      toast.success("Converted to dropdown")
      await refreshMenu()
    } catch {
      toast.error("Failed to convert to dropdown")
    }
  }, [menuId, refreshMenu])

  // Convert dropdown to page -- open the editor so user can set URL
  const handleConvertToPage = useCallback((item: MenuItemData) => {
    onEditItem?.(item.id)
  }, [onEditItem])

  // Move a child item to a different parent or top level
  const handleMoveToParent = useCallback(
    async (itemId: string, newParentId: string | null) => {
      // Prevent circular reference: can't move an item into itself or its own children
      if (newParentId === itemId) return
      const targetItem = items.find((i) => i.id === newParentId)
      if (targetItem?.parentId === itemId) {
        toast.error("Cannot move an item into its own child")
        return
      }

      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentId: newParentId,
            groupLabel: null, // clear section assignment on move
          }),
        })
        if (!res.ok) throw new Error("Failed to move item")
        toast.success(newParentId ? "Item moved" : "Item moved to top level")
        await refreshMenu()
      } catch {
        toast.error("Failed to move item")
      }
    },
    [menuId, items, refreshMenu],
  )

  // List of top-level dropdown items available as move targets
  const moveTargets = useMemo(
    () =>
      topLevelItems
        .filter((i) => !i.href || (i.children ?? []).length > 0) // dropdowns only
        .map((i) => ({ id: i.id, label: i.label })),
    [topLevelItems],
  )

  // Delete item
  const handleDeleteItem = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId)
        ?? items.flatMap((i) => i.children ?? []).find((c) => c.id === itemId)
      if (!item) return

      const hasChildren = 'children' in item && Array.isArray(item.children) && item.children.length > 0
      const message = hasChildren
        ? `Delete "${item.label}" and all its children?`
        : `Delete "${item.label}"?`

      if (!confirm(message)) return

      // Optimistic removal
      setItems((prev) => {
        const filtered = prev.filter((i) => i.id !== itemId)
        return filtered.map((i) => {
          if (!i.children) return i
          const newChildren = i.children.filter((c) => c.id !== itemId)
          return newChildren.length !== i.children.length
            ? { ...i, children: newChildren }
            : i
        })
      })

      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete item")
        toast.success("Item deleted")
        await refreshMenu()
      } catch {
        toast.error("Failed to delete item")
        await refreshMenu()
      }
    },
    [menuId, items, refreshMenu],
  )

  // Loading state: if no items and no pages, show empty
  const isEmpty = topLevelItems.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header with single Add dropdown */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-sidebar-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground">Pages & Navigation</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Plus className="size-3.5" />
              Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => onAddPage?.()}>
              <FilePlus className="size-3.5 mr-2" />
              New Page
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Menu Items</span>
            </div>
            <DropdownMenuItem onClick={() => setAddingTopLevel(true)}>
              <ChevronDown className="size-3.5 mr-2" />
              Dropdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddingExternalLink(true)}>
              <ExternalLink className="size-3.5 mr-2" />
              External Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Inline add for top-level dropdown */}
      {addingTopLevel && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <InlineAddInput
            placeholder="Dropdown label..."
            onSubmit={(label) => {
              setAddingTopLevel(false)
              handleAddTopLevel(label)
            }}
            onCancel={() => setAddingTopLevel(false)}
          />
        </div>
      )}

      {/* Inline add for external link */}
      {addingExternalLink && (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <ExternalLinkAddInput
            onSubmit={(label, url) => {
              setAddingExternalLink(false)
              handleAddExternalLink(label, url)
            }}
            onCancel={() => setAddingExternalLink(false)}
          />
        </div>
      )}

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
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                {flattenedItems.map((fi, idx) => {
                  const { item, depth, parentId: fiParentId } = fi
                  const hasChildren = (item.children?.length ?? 0) > 0
                  const isExpanded = expandedIds.has(item.id)
                  const resolvedPage = item.isExternal ? null : resolvePageId(item.href)

                  // Show section header when groupLabel changes between consecutive children
                  const prevFi = idx > 0 ? flattenedItems[idx - 1] : null
                  const showSectionHeader = depth > 0 && item.groupLabel &&
                    (!prevFi || prevFi.depth === 0 || prevFi.item.groupLabel !== item.groupLabel)

                  return (
                    <div key={item.id}>
                      {showSectionHeader && (
                        <div className="py-1 mt-2" style={{ paddingLeft: depth * INDENT_WIDTH + 8 }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 truncate block">
                            {item.groupLabel}
                          </span>
                        </div>
                      )}
                      <SortableTreeItem
                        item={item}
                        depth={activeId === item.id && projected ? projected.depth : depth}
                        indentWidth={INDENT_WIDTH}
                        isGhost={activeId === item.id}
                        hasChildren={hasChildren}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleExpand(item.id)}
                        resolvedPageId={resolvedPage}
                        activePageId={activePageId}
                        onPageSelect={onPageSelect}
                        onEditItem={onEditItem}
                        onDeleteItem={handleDeleteItem}
                        pages={pages}
                        onPageSettings={onPageSettings}
                        onDeletePage={onDeletePage}
                        onDuplicatePage={onDuplicatePage}
                        onMoveToParent={handleMoveToParent}
                        moveTargets={moveTargets.filter((t) => t.id !== fiParentId)}
                        onConvertToDropdown={handleConvertToDropdown}
                        onConvertToPage={handleConvertToPage}
                      />
                    </div>
                  )
                })}
              </SortableContext>

              <DragOverlay>
                {activeId && (() => {
                  const activeItem = flattenedItems.find((fi) => fi.item.id === activeId)
                  if (!activeItem) return null
                  return (
                    <TreeItemOverlay
                      item={activeItem.item}
                      depth={activeItem.depth}
                      hasChildren={(activeItem.item.children?.length ?? 0) > 0}
                    />
                  )
                })()}
              </DragOverlay>
            </DndContext>
          )}

          {/* CTA Section */}
          <NavCTASection
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            ctaVisible={ctaVisible}
            onEditCTA={onEditCTA}
          />

          {/* Hidden Pages Section */}
          <NavHiddenPagesSection
            pages={pages}
            menuItemHrefs={menuItemHrefs}
            activePageId={activePageId}
            onPageSelect={onPageSelect}
            onPageSettings={onPageSettings}
            onDeletePage={onDeletePage}
            onDuplicatePage={onDuplicatePage}
          />
        </div>
      </ScrollArea>
    </div>
  )
}
