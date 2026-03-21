"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  GripVertical,
  MoreHorizontal,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { PageSummary } from "../types"
import type { MenuItemData, NavItemType } from "./navigation-editor"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SortableTreeItemProps {
  item: MenuItemData
  depth: number
  indentWidth?: number
  isGhost?: boolean
  isOverlay?: boolean

  hasChildren: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void

  resolvedPageId: string | null
  activePageId: string

  onPageSelect: (pageId: string) => void
  onEditItem?: (itemId: string) => void
  onDeleteItem: (itemId: string) => void

  pages: PageSummary[]
  onPageSettings?: (page: PageSummary) => void
  onDeletePage?: (pageId: string) => void
  onDuplicatePage?: (pageId: string) => void

  onMoveToParent?: (itemId: string, newParentId: string | null) => void
  moveTargets?: Array<{ id: string; label: string }>

  onConvertToDropdown?: (item: MenuItemData) => void
  onConvertToPage?: (item: MenuItemData) => void

  onAddChildItem?: (groupLabel: string | null) => void
  onAddSection?: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferItemType(item: MenuItemData, hasChildren: boolean): NavItemType {
  if (item.parentId === null) {
    if (item.href && hasChildren) return "page-dropdown"
    if (!item.href && hasChildren) return "folder-dropdown"
    if (item.href) return "page"
    if (!item.href) return "folder-dropdown"
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

// ---------------------------------------------------------------------------
// Context Menu
// ---------------------------------------------------------------------------

interface ItemContextMenuProps {
  item: MenuItemData
  itemType: NavItemType
  depth: number
  resolvedPageId: string | null
  pages: PageSummary[]
  moveTargets?: Array<{ id: string; label: string }>
  onEditItem?: (itemId: string) => void
  onDeleteItem: (itemId: string) => void
  onPageSettings?: (page: PageSummary) => void
  onDeletePage?: (pageId: string) => void
  onDuplicatePage?: (pageId: string) => void
  onMoveToParent?: (itemId: string, newParentId: string | null) => void
  onConvertToDropdown?: (item: MenuItemData) => void
  onConvertToPage?: (item: MenuItemData) => void
  onAddChildItem?: (groupLabel: string | null) => void
  onAddSection?: () => void
}

function ItemContextMenu({
  item,
  itemType,
  depth,
  resolvedPageId,
  pages,
  moveTargets,
  onEditItem,
  onDeleteItem,
  onPageSettings,
  onDeletePage,
  onDuplicatePage,
  onMoveToParent,
  onConvertToDropdown,
  onConvertToPage,
  onAddChildItem,
  onAddSection,
}: ItemContextMenuProps) {
  const isDropdown = itemType === "folder-dropdown" || itemType === "page-dropdown"
  const isPageItem = resolvedPageId !== null
  const resolvedPage = isPageItem
    ? pages.find((p) => p.id === resolvedPageId) ?? null
    : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 opacity-0 group-hover/tree-item:opacity-100 data-[state=open]:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Edit Properties */}
        {onEditItem && (
          <DropdownMenuItem onClick={() => onEditItem(item.id)}>
            Edit Properties
          </DropdownMenuItem>
        )}

        {/* Dropdown-specific: Add Item / Add Section */}
        {isDropdown && onAddChildItem && (
          <DropdownMenuItem onClick={() => onAddChildItem(null)}>
            Add Item
          </DropdownMenuItem>
        )}
        {isDropdown && onAddSection && (
          <DropdownMenuItem onClick={() => onAddSection()}>
            Add Section
          </DropdownMenuItem>
        )}

        {/* Type conversion */}
        {(onConvertToDropdown || onConvertToPage) && <DropdownMenuSeparator />}
        {itemType === "folder-dropdown" && onConvertToPage && (
          <DropdownMenuItem onClick={() => onConvertToPage(item)}>
            Convert to Page
          </DropdownMenuItem>
        )}
        {(itemType === "page" || itemType === "page-dropdown") && onConvertToDropdown && (
          <DropdownMenuItem onClick={() => onConvertToDropdown(item)}>
            Convert to Dropdown
          </DropdownMenuItem>
        )}

        {/* Page management */}
        {isPageItem && resolvedPage && (
          <>
            <DropdownMenuSeparator />
            {onPageSettings && (
              <DropdownMenuItem onClick={() => onPageSettings(resolvedPage)}>
                Page Settings
              </DropdownMenuItem>
            )}
            {onDuplicatePage && (
              <DropdownMenuItem onClick={() => onDuplicatePage(resolvedPageId!)}>
                Duplicate Page
              </DropdownMenuItem>
            )}
            {onDeletePage && !resolvedPage.isHomepage && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeletePage(resolvedPageId!)}
              >
                Delete Page
              </DropdownMenuItem>
            )}
          </>
        )}

        {/* Move to submenu (child items only) */}
        {depth > 0 && onMoveToParent && moveTargets && moveTargets.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-44">
                <DropdownMenuItem onClick={() => onMoveToParent(item.id, null)}>
                  Top Level
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {moveTargets.map((target) => (
                  <DropdownMenuItem
                    key={target.id}
                    onClick={() => onMoveToParent(item.id, target.id)}
                  >
                    {target.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {/* Remove from Menu (always last, destructive) */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDeleteItem(item.id)}
        >
          Remove from Menu
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------------
// SortableTreeItem
// ---------------------------------------------------------------------------

export function SortableTreeItem({
  item,
  depth,
  indentWidth = 28,
  isGhost = false,
  isOverlay = false,
  hasChildren,
  isExpanded,
  onToggleExpand,
  resolvedPageId,
  activePageId,
  onPageSelect,
  onEditItem,
  onDeleteItem,
  pages,
  onPageSettings,
  onDeletePage,
  onDuplicatePage,
  onMoveToParent,
  moveTargets,
  onConvertToDropdown,
  onConvertToPage,
  onAddChildItem,
  onAddSection,
}: SortableTreeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isOverlay })

  const itemType = inferItemType(item, hasChildren)
  const isActive = resolvedPageId !== null && resolvedPageId === activePageId
  const isTopLevel = depth === 0

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Translate.toString(transform),
        transition,
      }

  const handleLabelClick = () => {
    if (resolvedPageId) {
      onPageSelect(resolvedPageId)
    }
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={{
        ...style,
        paddingLeft: depth * indentWidth,
        opacity: isGhost ? 0.3 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className={cn(
        "group/tree-item flex items-center gap-1.5 rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent overflow-hidden min-w-0",
        isActive && "bg-sidebar-accent border-l-2 border-primary",
        isOverlay && "shadow-md bg-sidebar rounded-md border border-border",
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
        tabIndex={-1}
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* Expand/collapse chevron (top-level dropdowns only) */}
      {hasChildren && isTopLevel ? (
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onToggleExpand}
          tabIndex={-1}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
      ) : isTopLevel ? (
        // Spacer to keep alignment with items that have chevrons
        <span className="w-3.5 shrink-0" />
      ) : null}

      {/* Type icon */}
      <TypeIcon
        type={itemType}
        className={cn(
          "size-3.5 shrink-0",
          isTopLevel ? "text-muted-foreground" : "text-muted-foreground/60",
        )}
      />

      {/* Label */}
      <button
        type="button"
        className={cn(
          "flex-1 min-w-0 truncate text-left transition-colors",
          isTopLevel ? "text-xs font-medium" : "text-xs text-muted-foreground",
          isActive && "font-semibold text-foreground",
          resolvedPageId && "hover:text-foreground cursor-pointer",
          !resolvedPageId && "cursor-default",
        )}
        onClick={handleLabelClick}
        disabled={!resolvedPageId}
        tabIndex={-1}
      >
        {item.label}
      </button>

      {/* Right side: checkmark + context menu */}
      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {isActive && (
          <Check className="size-3.5 shrink-0 text-primary" />
        )}
        <ItemContextMenu
          item={item}
          itemType={itemType}
          depth={depth}
          resolvedPageId={resolvedPageId}
          pages={pages}
          moveTargets={moveTargets}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onPageSettings={onPageSettings}
          onDeletePage={onDeletePage}
          onDuplicatePage={onDuplicatePage}
          onMoveToParent={onMoveToParent}
          onConvertToDropdown={onConvertToDropdown}
          onConvertToPage={onConvertToPage}
          onAddChildItem={onAddChildItem}
          onAddSection={onAddSection}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TreeItemOverlay — static render for DragOverlay
// ---------------------------------------------------------------------------

export function TreeItemOverlay({
  item,
  depth,
  hasChildren = false,
}: {
  item: MenuItemData
  depth: number
  hasChildren?: boolean
}) {
  const itemType = inferItemType(item, hasChildren)
  const isTopLevel = depth === 0

  return (
    <div
      className="flex items-center gap-1.5 rounded-md border border-border bg-sidebar px-2 py-2 shadow-lg max-w-[280px]"
      style={{ paddingLeft: depth * 28 }}
    >
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/50" />

      {hasChildren && isTopLevel ? (
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      ) : isTopLevel ? (
        <span className="w-3.5 shrink-0" />
      ) : null}

      <TypeIcon
        type={itemType}
        className={cn(
          "size-3.5 shrink-0",
          isTopLevel ? "text-muted-foreground" : "text-muted-foreground/60",
        )}
      />

      <span
        className={cn(
          "flex-1 min-w-0 truncate text-left",
          isTopLevel ? "text-xs font-medium" : "text-xs text-muted-foreground",
        )}
      >
        {item.label}
      </span>
    </div>
  )
}
