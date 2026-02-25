"use client"

import { useState } from "react"
import {
  ChevronRight,
  ChevronDown,
  Home,
  Settings,
  Trash2,
  Plus,
  File,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  return (
    <div>
      {/* Page item row */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onPageSelect(node.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onPageSelect(node.id)
          }
        }}
        className={cn(
          "group relative flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "hover:bg-muted/60 text-foreground"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {/* Expand/collapse chevron */}
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(node.id)
            }}
            className="shrink-0 flex items-center justify-center size-5 rounded hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="shrink-0 flex items-center justify-center size-5">
            <File className="size-3.5 text-muted-foreground/60" />
          </span>
        )}

        {/* Homepage icon */}
        {node.isHomepage && (
          <Home className="size-3.5 text-primary shrink-0" />
        )}

        {/* Page title */}
        <span className="truncate flex-1 min-w-0 font-medium">
          {node.title}
        </span>

        {/* Status badge */}
        <Badge
          variant={node.isPublished ? "info" : "secondary"}
          className="shrink-0 text-[10px] px-1.5 py-0 h-4 leading-none"
        >
          {node.isPublished ? "Published" : "Draft"}
        </Badge>

        {/* Hover actions */}
        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPageSettings(node)
            }}
            className="size-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Page settings"
          >
            <Settings className="size-3.5" />
          </button>
          {!node.isHomepage && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDeletePage(node.id)
              }}
              className="size-6 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              title="Delete page"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Children (recursive) */}
      {hasChildren && isExpanded && (
        <div>
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
  const tree = buildTree(pages)

  // Auto-expand parent nodes of the active page
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()
    // Expand all parents of the active page
    const findAndExpand = (nodes: TreeNode[], path: string[]): boolean => {
      for (const node of nodes) {
        if (node.id === activePageId) {
          for (const id of path) ids.add(id)
          return true
        }
        if (node.children.length > 0) {
          if (findAndExpand(node.children, [...path, node.id])) return true
        }
      }
      return false
    }
    findAndExpand(tree, [])

    // Also expand any node that has children by default
    const expandParents = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          ids.add(node.id)
          expandParents(node.children)
        }
      }
    }
    expandParents(tree)

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
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <File className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No pages yet</p>
              <p className="text-xs mt-1">Create your first page to get started.</p>
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

      {/* Add page button */}
      <div className="border-t p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-1.5"
          onClick={onAddPage}
        >
          <Plus className="size-4" />
          Add Page
        </Button>
      </div>
    </div>
  )
}
