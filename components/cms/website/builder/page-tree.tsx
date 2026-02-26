"use client"

import { useState, useMemo } from "react"
import {
  ChevronRight,
  ChevronDown,
  Layout,
  FileText,
  Folder,
  GripVertical,
  Plus,
  Check,
  MoreHorizontal,
  Settings,
  Copy,
  Trash2,
} from "lucide-react"
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
import type { PageSummary } from "./types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageTreeProps {
  pages: PageSummary[]
  activePageId: string
  onPageSelect: (pageId: string) => void
  onPageSettings: (page: PageSummary) => void
  onAddPage: () => void
  onDeletePage: (pageId: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TreeNode extends PageSummary {
  children: TreeNode[]
}

/** Build a nested tree from a flat list of pages using `parentId`. */
function buildTree(pages: PageSummary[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // Create tree nodes
  for (const page of pages) {
    map.set(page.id, { ...page, children: [] })
  }

  // Assign children to parents
  for (const page of pages) {
    const node = map.get(page.id)!
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort each level by sortOrder
  const sortChildren = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    for (const node of nodes) {
      sortChildren(node.children)
    }
  }
  sortChildren(roots)

  return roots
}

/** Collect IDs of all ancestor nodes of a given target. */
function collectAncestorIds(
  nodes: TreeNode[],
  targetId: string,
  path: string[] = [],
): string[] | null {
  for (const node of nodes) {
    if (node.id === targetId) return path
    if (node.children.length > 0) {
      const result = collectAncestorIds(node.children, targetId, [
        ...path,
        node.id,
      ])
      if (result) return result
    }
  }
  return null
}

/** Collect IDs of all nodes that have children. */
function collectFolderIds(nodes: TreeNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(node.id)
      ids.push(...collectFolderIds(node.children))
    }
  }
  return ids
}

// ---------------------------------------------------------------------------
// PageTreeItem (recursive)
// ---------------------------------------------------------------------------

interface PageTreeItemProps {
  node: TreeNode
  depth: number
  activePageId: string
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onPageSelect: (pageId: string) => void
  onPageSettings: (page: PageSummary) => void
  onDeletePage: (pageId: string) => void
}

function PageTreeItem({
  node,
  depth,
  activePageId,
  expandedIds,
  onToggleExpand,
  onPageSelect,
  onPageSettings,
  onDeletePage,
}: PageTreeItemProps) {
  const isActive = node.id === activePageId
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isFolder = hasChildren
  const isHomepage = node.isHomepage

  // Determine the page icon
  const PageIcon = isHomepage ? Layout : isFolder ? Folder : FileText

  return (
    <div>
      {/* Page item row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          onPageSelect(node.id)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onPageSelect(node.id)
          }
        }}
        className={cn(
          "group relative flex items-center justify-between rounded-md cursor-pointer transition-all my-0.5",
          "py-2 pr-2",
          isActive
            ? "bg-primary/10 text-primary"
            : "hover:bg-muted/60 text-foreground",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Left side: grip, chevron, icon, title */}
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          {/* Drag handle */}
          <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground shrink-0 touch-none">
            <GripVertical className="size-3.5" />
          </div>

          {/* Expand/collapse chevron for folders */}
          {isFolder ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(node.id)
              }}
              className="shrink-0 p-0.5 rounded hover:bg-muted/80"
            >
              {isExpanded ? (
                <ChevronDown className="size-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3 text-muted-foreground" />
              )}
            </button>
          ) : (
            /* Spacer to align non-folder items with folder items */
            <div className="w-4 shrink-0" />
          )}

          {/* Page type icon */}
          <PageIcon
            className={cn(
              "size-3.5 shrink-0",
              isHomepage
                ? isActive
                  ? "text-primary opacity-80"
                  : "opacity-70"
                : isFolder
                  ? "opacity-70 text-muted-foreground"
                  : "opacity-70",
            )}
          />

          {/* Page title */}
          <span
            className={cn(
              "text-xs truncate select-none",
              isActive ? "font-semibold" : "font-medium",
            )}
          >
            {node.title}
          </span>
        </div>

        {/* Right side: check mark + context menu */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Active checkmark */}
          {isActive && !isFolder && (
            <Check className="size-3 text-primary" />
          )}

          {/* Context menu (three dots) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-5 w-5 rounded-sm transition-opacity",
                  "opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100",
                  isActive
                    ? "hover:bg-primary/20"
                    : "hover:bg-muted",
                )}
              >
                <MoreHorizontal className="size-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPageSettings(node)}>
                <Settings className="size-3.5 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {/* TODO: duplicate */}}>
                <Copy className="size-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              {!isHomepage && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDeletePage(node.id)}
                  >
                    <Trash2 className="size-3.5 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Indentation guide line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border"
            style={{ left: `${depth * 12 + 23}px` }}
          />
          {node.children.map((child) => (
            <PageTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              activePageId={activePageId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onPageSelect={onPageSelect}
              onPageSettings={onPageSettings}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PageTree (main component)
// ---------------------------------------------------------------------------

export function PageTree({
  pages,
  activePageId,
  onPageSelect,
  onPageSettings,
  onAddPage,
  onDeletePage,
}: PageTreeProps) {
  const tree = useMemo(() => buildTree(pages), [pages])

  // Compute initial expanded set: expand all folders + ancestors of active page
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()

    // Expand all folder nodes by default
    for (const folderId of collectFolderIds(tree)) {
      ids.add(folderId)
    }

    // Ensure ancestors of the active page are expanded
    const ancestors = collectAncestorIds(tree, activePageId)
    if (ancestors) {
      for (const id of ancestors) {
        ids.add(id)
      }
    }

    return ids
  })

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Add Page button (top, sticky) */}
      <div className="p-4 pb-2 border-b shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-xs h-8 gap-2"
          onClick={onAddPage}
        >
          <Plus className="size-3.5" />
          Add Page
        </Button>
      </div>

      {/* Page tree list */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No pages yet</p>
              <p className="text-xs mt-1">
                Create your first page to get started.
              </p>
            </div>
          ) : (
            tree.map((node) => (
              <PageTreeItem
                key={node.id}
                node={node}
                depth={0}
                activePageId={activePageId}
                expandedIds={expandedIds}
                onToggleExpand={handleToggleExpand}
                onPageSelect={onPageSelect}
                onPageSettings={onPageSettings}
                onDeletePage={onDeletePage}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
