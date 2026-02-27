"use client"

import { useState, useMemo } from "react"
import {
  ChevronRight,
  ChevronDown,
  Layout,
  FileText,
  Folder,
  ExternalLink,
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
import type { PageSummary, NavTreeMenuItem, NavTreeNode } from "./types"

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
  headerMenuItems?: NavTreeMenuItem[]
}

// ---------------------------------------------------------------------------
// Nav-tree builder
// ---------------------------------------------------------------------------

/** Strip leading "/" and query params from an href for slug matching. */
function normalizeHref(href: string): string {
  let normalized = href
  // Strip /website/ prefix if present
  if (normalized.startsWith("/website/")) {
    normalized = normalized.slice("/website".length)
  } else if (normalized === "/website") {
    normalized = "/"
  }
  // Strip query params
  const [pathPart] = normalized.split("?")
  // Strip leading slash
  return pathPart.replace(/^\//, "")
}

/**
 * Build a nav-driven tree from menu items matched against page data.
 * Pages not matched by any menu item go into an "Other Pages" section.
 */
function buildNavTree(
  pages: PageSummary[],
  menuItems: NavTreeMenuItem[],
): { navNodes: NavTreeNode[]; otherPages: PageSummary[] } {
  // Build slug→page and id→page maps
  const slugMap = new Map<string, PageSummary>()
  for (const p of pages) {
    slugMap.set(p.slug, p)
  }

  const claimedPageIds = new Set<string>()

  function matchPage(href: string | null): PageSummary | null {
    if (!href) return null
    const slug = normalizeHref(href)
    // Homepage: empty slug
    if (slug === "") {
      const homepage = pages.find((p) => p.isHomepage || p.slug === "")
      return homepage ?? null
    }
    return slugMap.get(slug) ?? null
  }

  function buildNode(item: NavTreeMenuItem): NavTreeNode {
    const matchedPage = item.isExternal ? null : matchPage(item.href)

    if (matchedPage) {
      claimedPageIds.add(matchedPage.id)
    }

    // Determine kind
    let kind: NavTreeNode["kind"]
    if (matchedPage) {
      kind = "page"
    } else if (item.isExternal) {
      kind = "link"
    } else if (!item.href && item.children.length > 0) {
      kind = "folder"
    } else if (item.href) {
      // Has an href but no matching page — treat as a link
      kind = "link"
    } else {
      kind = "folder"
    }

    // Build children from menu item children
    const childNodes = item.children.map(buildNode)

    // If this is a page node, also add any DB child pages (via parentId)
    // that weren't already claimed by the menu structure
    if (kind === "page" && matchedPage) {
      const dbChildren = pages.filter(
        (p) => p.parentId === matchedPage.id && !claimedPageIds.has(p.id),
      )
      for (const child of dbChildren) {
        claimedPageIds.add(child.id)
        childNodes.push({
          id: `page-${child.id}`,
          label: child.title,
          kind: "page",
          pageId: child.id,
          pageType: child.pageType,
          isHomepage: child.isHomepage,
          isPublished: child.isPublished,
          href: null,
          isExternal: false,
          groupLabel: null,
          children: [],
        })
      }
    }

    return {
      id: `menu-${item.id}`,
      label: item.label,
      kind,
      pageId: matchedPage?.id ?? null,
      pageType: matchedPage?.pageType ?? null,
      isHomepage: matchedPage?.isHomepage ?? false,
      isPublished: matchedPage?.isPublished ?? true,
      href: kind === "link" ? item.href : null,
      isExternal: item.isExternal,
      groupLabel: item.groupLabel,
      children: childNodes,
    }
  }

  const navNodes = menuItems.map(buildNode)
  const otherPages = pages.filter((p) => !claimedPageIds.has(p.id))

  return { navNodes, otherPages }
}

// ---------------------------------------------------------------------------
// Fallback page-only tree (used when no menu data)
// ---------------------------------------------------------------------------

interface FlatTreeNode extends PageSummary {
  children: FlatTreeNode[]
}

function buildFlatTree(pages: PageSummary[]): FlatTreeNode[] {
  const map = new Map<string, FlatTreeNode>()
  const roots: FlatTreeNode[] = []

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] })
  }

  for (const page of pages) {
    const node = map.get(page.id)!
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortChildren = (nodes: FlatTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    for (const node of nodes) {
      sortChildren(node.children)
    }
  }
  sortChildren(roots)

  return roots
}

function flatTreeToNavNodes(nodes: FlatTreeNode[]): NavTreeNode[] {
  return nodes.map((node) => ({
    id: `page-${node.id}`,
    label: node.title,
    kind: "page" as const,
    pageId: node.id,
    pageType: node.pageType,
    isHomepage: node.isHomepage,
    isPublished: node.isPublished,
    href: null,
    isExternal: false,
    groupLabel: null,
    children: flatTreeToNavNodes(node.children),
  }))
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect IDs of all NavTreeNodes that have children. */
function collectExpandableIds(nodes: NavTreeNode[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(node.id)
      ids.push(...collectExpandableIds(node.children))
    }
  }
  return ids
}

/** Find ancestors of a node whose pageId matches targetPageId. */
function collectNavAncestorIds(
  nodes: NavTreeNode[],
  targetPageId: string,
  path: string[] = [],
): string[] | null {
  for (const node of nodes) {
    if (node.pageId === targetPageId) return path
    if (node.children.length > 0) {
      const result = collectNavAncestorIds(node.children, targetPageId, [
        ...path,
        node.id,
      ])
      if (result) return result
    }
  }
  return null
}

/** Get the icon component for a nav tree node. */
function getNodeIcon(node: NavTreeNode) {
  if (node.kind === "link") return ExternalLink
  if (node.kind === "folder") return Folder
  if (node.isHomepage) return Layout
  return FileText
}

// ---------------------------------------------------------------------------
// NavTreeItem (recursive)
// ---------------------------------------------------------------------------

interface NavTreeItemProps {
  node: NavTreeNode
  depth: number
  activePageId: string
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onPageSelect: (pageId: string) => void
  onPageSettings: (page: PageSummary) => void
  onDeletePage: (pageId: string) => void
  pages: PageSummary[]
}

function NavTreeItem({
  node,
  depth,
  activePageId,
  expandedIds,
  onToggleExpand,
  onPageSelect,
  onPageSettings,
  onDeletePage,
  pages,
}: NavTreeItemProps) {
  const isPage = node.kind === "page" && node.pageId !== null
  const isActive = isPage && node.pageId === activePageId
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isFolder = node.kind === "folder"
  const isLink = node.kind === "link"

  const NodeIcon = getNodeIcon(node)

  const handleClick = () => {
    if (isPage && node.pageId) {
      onPageSelect(node.pageId)
    }
    if (hasChildren && !isPage) {
      onToggleExpand(node.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  // Find the PageSummary for context menu actions
  const pageSummary = isPage
    ? pages.find((p) => p.id === node.pageId)
    : null

  // Group children by groupLabel for rendering
  type ChildGroup = { label: string | null; children: NavTreeNode[] }
  const groupedChildren = useMemo((): ChildGroup[] => {
    if (!hasChildren) return []

    const groups: ChildGroup[] = []
    let currentLabel: string | null | undefined = undefined

    for (const child of node.children) {
      if (child.groupLabel !== currentLabel) {
        currentLabel = child.groupLabel
        groups.push({ label: child.groupLabel, children: [] })
      }
      groups[groups.length - 1].children.push(child)
    }

    return groups
  }, [node.children, hasChildren])

  return (
    <div>
      {/* Node row */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex items-center justify-between rounded-md cursor-pointer transition-all my-0.5",
          "py-2 pr-2",
          isActive
            ? "bg-primary/10 text-primary"
            : isFolder || isLink
              ? "hover:bg-muted/60 text-muted-foreground"
              : "hover:bg-muted/60 text-foreground",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {/* Left side: grip, chevron, icon, title */}
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          {/* Drag handle — only for page nodes */}
          {isPage ? (
            <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground shrink-0 touch-none">
              <GripVertical className="size-3.5" />
            </div>
          ) : (
            <div className="w-3.5 shrink-0" />
          )}

          {/* Expand/collapse chevron */}
          {hasChildren ? (
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
            <div className="w-4 shrink-0" />
          )}

          {/* Node icon */}
          <NodeIcon
            className={cn(
              "size-3.5 shrink-0",
              node.isHomepage
                ? isActive
                  ? "text-primary opacity-80"
                  : "opacity-70"
                : isFolder || isLink
                  ? "opacity-60 text-muted-foreground"
                  : "opacity-70",
            )}
          />

          {/* Label */}
          <span
            className={cn(
              "text-xs truncate select-none",
              isActive
                ? "font-semibold"
                : isFolder || isLink
                  ? "font-medium"
                  : "font-medium",
            )}
          >
            {node.label}
          </span>
        </div>

        {/* Right side: check mark + context menu */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Active checkmark — only for page nodes */}
          {isActive && isPage && (
            <Check className="size-3 text-primary" />
          )}

          {/* Context menu — only for page nodes */}
          {isPage && pageSummary && (
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
                <DropdownMenuItem onClick={() => onPageSettings(pageSummary)}>
                  <Settings className="size-3.5 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {/* TODO: duplicate */}}>
                  <Copy className="size-3.5 mr-2" /> Duplicate
                </DropdownMenuItem>
                {!node.isHomepage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeletePage(node.pageId!)}
                    >
                      <Trash2 className="size-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Children (recursive, with group headers) */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Indentation guide line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border"
            style={{ left: `${depth * 12 + 23}px` }}
          />
          {groupedChildren.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`}>
              {/* Group header (only if groupLabel is set) */}
              {group.label && (
                <div
                  className="px-2 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 select-none"
                  style={{ paddingLeft: `${(depth + 1) * 12 + 8 + 18}px` }}
                >
                  {group.label}
                </div>
              )}
              {group.children.map((child) => (
                <NavTreeItem
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  activePageId={activePageId}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  onPageSelect={onPageSelect}
                  onPageSettings={onPageSettings}
                  onDeletePage={onDeletePage}
                  pages={pages}
                />
              ))}
            </div>
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
  headerMenuItems,
}: PageTreeProps) {
  // Build tree: use menu-driven tree if available, fallback to flat page tree
  const { navNodes, otherPageNodes } = useMemo(() => {
    if (headerMenuItems && headerMenuItems.length > 0) {
      const { navNodes, otherPages } = buildNavTree(pages, headerMenuItems)
      const otherPageNodes = flatTreeToNavNodes(buildFlatTree(otherPages))
      return { navNodes, otherPageNodes }
    }
    // Fallback: all pages as a flat tree
    return {
      navNodes: flatTreeToNavNodes(buildFlatTree(pages)),
      otherPageNodes: [] as NavTreeNode[],
    }
  }, [pages, headerMenuItems])

  // All nodes for expand state computation
  const allNodes = useMemo(
    () => [...navNodes, ...otherPageNodes],
    [navNodes, otherPageNodes],
  )

  // Compute initial expanded set: expand all expandable nodes + ancestors of active page
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>()

    for (const id of collectExpandableIds(allNodes)) {
      ids.add(id)
    }

    const ancestors = collectNavAncestorIds(allNodes, activePageId)
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

  const hasOtherPages = otherPageNodes.length > 0

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
          {navNodes.length === 0 && !hasOtherPages ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No pages yet</p>
              <p className="text-xs mt-1">
                Create your first page to get started.
              </p>
            </div>
          ) : (
            <>
              {navNodes.map((node) => (
                <NavTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  activePageId={activePageId}
                  expandedIds={expandedIds}
                  onToggleExpand={handleToggleExpand}
                  onPageSelect={onPageSelect}
                  onPageSettings={onPageSettings}
                  onDeletePage={onDeletePage}
                  pages={pages}
                />
              ))}

              {/* Other Pages section */}
              {hasOtherPages && (
                <>
                  <div className="flex items-center gap-2 px-2 pt-4 pb-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
                      Other Pages
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  {otherPageNodes.map((node) => (
                    <NavTreeItem
                      key={node.id}
                      node={node}
                      depth={0}
                      activePageId={activePageId}
                      expandedIds={expandedIds}
                      onToggleExpand={handleToggleExpand}
                      onPageSelect={onPageSelect}
                      onPageSettings={onPageSettings}
                      onDeletePage={onDeletePage}
                      pages={pages}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
