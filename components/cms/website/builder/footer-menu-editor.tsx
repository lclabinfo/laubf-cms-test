"use client"

import { useState, useCallback, useMemo } from "react"
import {
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { MenuItemData } from "./navigation/navigation-editor"

interface FooterMenuEditorProps {
  menuId: string
  items: MenuItemData[]
  onClose: () => void
  onUpdated: () => void
}

/**
 * A visual link group, matching the footer's rendered columns.
 * Built from either parent→children hierarchy or flat groupLabel grouping.
 */
interface LinkGroup {
  /** Unique key for this group (parentId or groupLabel slug) */
  key: string
  /** Display title (parent label or groupLabel value) */
  title: string
  /** Links in this group */
  links: MenuItemData[]
  /** For hierarchy strategy: the parent MenuItem */
  parent?: MenuItemData
  /** Which data strategy produced this group */
  strategy: "hierarchy" | "groupLabel"
}

/**
 * Build link groups matching the exact same logic as
 * `buildFooterColumns()` in website-footer.tsx.
 * Both strategies produce the same visual output.
 */
function buildLinkGroups(items: MenuItemData[]): LinkGroup[] {
  const topLevel = items
    .filter((i) => i.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // Strategy 1: parent→children hierarchy
  const withChildren = topLevel.filter(
    (i) => i.children && i.children.length > 0,
  )
  if (withChildren.length > 0) {
    return withChildren.map((parent) => ({
      key: parent.id,
      title: parent.label,
      links: (parent.children ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
      parent,
      strategy: "hierarchy" as const,
    }))
  }

  // Strategy 2: flat items grouped by groupLabel
  const grouped = new Map<string, MenuItemData[]>()
  for (const item of topLevel) {
    const group = item.groupLabel || "Links"
    if (!grouped.has(group)) grouped.set(group, [])
    grouped.get(group)!.push(item)
  }

  return Array.from(grouped.entries()).map(([label, groupItems]) => ({
    key: `gl-${label}`,
    title: label,
    links: groupItems.sort((a, b) => a.sortOrder - b.sortOrder),
    strategy: "groupLabel" as const,
  }))
}

export function FooterMenuEditor({
  menuId,
  items,
  onClose,
  onUpdated,
}: FooterMenuEditorProps) {
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "group" | "link"
    group?: LinkGroup
    linkId?: string
    label: string
  } | null>(null)
  const groups = useMemo(() => buildLinkGroups(items), [items])

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.key)),
  )

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── API helpers ──

  const saveItem = useCallback(
    async (itemId: string, data: Record<string, unknown>) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Failed to save")
        onUpdated()
      } catch {
        toast.error("Failed to save")
      } finally {
        setSaving(false)
      }
    },
    [menuId, onUpdated],
  )

  const deleteItem = useCallback(
    async (itemId: string, label: string) => {
      setSaving(true)
      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete")
        onUpdated()
        toast.success(`"${label}" removed`)
      } catch {
        toast.error("Failed to delete")
      } finally {
        setSaving(false)
      }
    },
    [menuId, onUpdated],
  )

  /**
   * Add a link. For hierarchy strategy, set parentId.
   * For groupLabel strategy, set groupLabel.
   */
  const addLink = useCallback(
    async (group: LinkGroup) => {
      setSaving(true)
      try {
        const body: Record<string, unknown> = {
          label: "New Link",
          href: "/",
          sortOrder: group.links.length,
          isVisible: true,
        }
        if (group.strategy === "hierarchy" && group.parent) {
          body.parentId = group.parent.id
        } else {
          body.groupLabel = group.title
        }

        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error("Failed to add link")
        onUpdated()
        toast.success("Link added")
      } catch {
        toast.error("Failed to add link")
      } finally {
        setSaving(false)
      }
    },
    [menuId, onUpdated],
  )

  /**
   * Add a new link group.
   * For hierarchy: creates a new parent MenuItem.
   * For groupLabel: creates a placeholder link with a new groupLabel.
   */
  const addGroup = useCallback(async () => {
    setSaving(true)
    try {
      const topLevel = items.filter((i) => i.parentId === null)
      const hasHierarchy = topLevel.some(
        (i) => i.children && i.children.length > 0,
      )

      if (hasHierarchy) {
        // Hierarchy: create a parent item
        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: "New Group",
            href: null,
            parentId: null,
            sortOrder: topLevel.length,
            isVisible: true,
          }),
        })
        if (!res.ok) throw new Error("Failed to add group")
        const { data } = await res.json()
        setExpandedGroups((prev) => new Set(prev).add(data.id))
      } else {
        // GroupLabel: create a link with a new groupLabel
        const groupLabel = "NEW GROUP"
        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: "New Link",
            href: "/",
            groupLabel,
            sortOrder: topLevel.length,
            isVisible: true,
          }),
        })
        if (!res.ok) throw new Error("Failed to add group")
        setExpandedGroups((prev) => new Set(prev).add(`gl-${groupLabel}`))
      }

      onUpdated()
      toast.success("Link group added")
    } catch {
      toast.error("Failed to add group")
    } finally {
      setSaving(false)
    }
  }, [menuId, items, onUpdated])

  /**
   * Rename a group.
   * For hierarchy: rename the parent MenuItem.
   * For groupLabel: update groupLabel on ALL items in the group.
   */
  const renameGroup = useCallback(
    async (group: LinkGroup, newTitle: string) => {
      if (newTitle === group.title) return
      setSaving(true)
      try {
        if (group.strategy === "hierarchy" && group.parent) {
          await fetch(`/api/v1/menus/${menuId}/items/${group.parent.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ label: newTitle }),
          })
        } else {
          // Update groupLabel on every item in this group
          await Promise.all(
            group.links.map((link) =>
              fetch(`/api/v1/menus/${menuId}/items/${link.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupLabel: newTitle }),
              }),
            ),
          )
        }
        onUpdated()
      } catch {
        toast.error("Failed to rename group")
      } finally {
        setSaving(false)
      }
    },
    [menuId, onUpdated],
  )

  /** Prompt confirmation before deleting a group. */
  const requestDeleteGroup = useCallback((group: LinkGroup) => {
    setConfirmDelete({
      type: "group",
      group,
      label: group.title,
    })
  }, [])

  /** Actually delete after confirmation. */
  const executeDelete = useCallback(async () => {
    if (!confirmDelete) return
    const { type, group, linkId, label } = confirmDelete
    setConfirmDelete(null)
    setSaving(true)
    try {
      if (type === "group" && group) {
        if (group.strategy === "hierarchy" && group.parent) {
          const res = await fetch(
            `/api/v1/menus/${menuId}/items/${group.parent.id}`,
            { method: "DELETE" },
          )
          if (!res.ok) throw new Error("Failed to delete")
        } else {
          await Promise.all(
            group.links.map((link) =>
              fetch(`/api/v1/menus/${menuId}/items/${link.id}`, {
                method: "DELETE",
              }),
            ),
          )
        }
        toast.success(`"${label}" group removed`)
      } else if (type === "link" && linkId) {
        const res = await fetch(
          `/api/v1/menus/${menuId}/items/${linkId}`,
          { method: "DELETE" },
        )
        if (!res.ok) throw new Error("Failed to delete")
        toast.success(`"${label}" removed`)
      }
      onUpdated()
    } catch {
      toast.error("Failed to delete")
    } finally {
      setSaving(false)
    }
  }, [confirmDelete, menuId, onUpdated])

  return (
    <>
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground">
          Edit Footer
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          className="rounded-full text-muted-foreground shrink-0"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Section label */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Link Groups
            </Label>
            <p className="text-xs text-muted-foreground">
              Each group appears as a titled column in your footer.
            </p>
          </div>

          {/* ── Link Groups ── */}
          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.key)

            return (
              <div
                key={group.key}
                className="rounded-lg border overflow-hidden"
              >
                {/* Group header — collapsible */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() => toggleGroup(group.key)}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm font-medium flex-1 truncate">
                    {group.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.links.length} link
                    {group.links.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 py-3 space-y-3 border-t">
                    {/* Group title */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Group Title
                      </Label>
                      <p className="text-[11px] text-muted-foreground/70">
                        Shown as the column heading in the footer.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          defaultValue={group.title}
                          onBlur={(e) =>
                            renameGroup(group, e.target.value.trim())
                          }
                          className="text-sm h-8 flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => requestDeleteGroup(group)}
                          disabled={saving}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Visibility (hierarchy only — parent controls visibility) */}
                    {group.strategy === "hierarchy" && group.parent && (
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Visible
                        </Label>
                        <Switch
                          checked={group.parent.isVisible}
                          onCheckedChange={(checked) =>
                            saveItem(group.parent!.id, {
                              isVisible: checked,
                            })
                          }
                        />
                      </div>
                    )}

                    <Separator />

                    {/* Links within this group */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Links
                      </Label>

                      {group.links.map((link) => (
                        <LinkItemCard
                          key={link.id}
                          link={link}
                          saving={saving}
                          onSave={saveItem}
                          onDelete={deleteItem}
                        />
                      ))}

                      {group.links.length === 0 && (
                        <p className="text-xs text-muted-foreground/60 text-center py-3 border-2 border-dashed rounded-md">
                          No links in this group yet.
                        </p>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7"
                        onClick={() => addLink(group)}
                        disabled={saving}
                      >
                        <Plus className="size-3 mr-1" />
                        Add Link
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {groups.length === 0 && (
            <p className="text-xs text-muted-foreground/60 text-center py-6 border-2 border-dashed rounded-md">
              No footer link groups yet.
            </p>
          )}

          {/* Add new link group */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addGroup}
            disabled={saving}
          >
            <Plus className="size-3.5 mr-1.5" />
            Add Link Group
          </Button>

          <Separator />

          {/* ── CMS-Driven Sections ── */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Other Footer Content
            </Label>
            <p className="text-xs text-muted-foreground">
              These are managed through your CMS settings.
            </p>
          </div>

          <CmsDrivenCard
            title="Social Media Links"
            description="Instagram, Facebook, YouTube, Twitter, TikTok — managed in Church Profile settings."
            editPath="/cms/settings"
          />

          <CmsDrivenCard
            title="Contact Information"
            description="Address, phone, and email — managed in Church Profile settings."
            editPath="/cms/settings"
          />

          <CmsDrivenCard
            title="Logo & Tagline"
            description="Site logo and tagline — managed in Site Settings."
            editPath="/cms/website/settings"
          />
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDelete?.type === "group"
                ? `Delete "${confirmDelete.label}" group?`
                : `Delete "${confirmDelete?.label}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.type === "group"
                ? `This will permanently remove the "${confirmDelete.label}" column and all ${confirmDelete.group?.links.length ?? 0} link(s) inside it. This action cannot be undone.`
                : "This link will be permanently removed. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={executeDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/* ── Link Item Card ── */

function LinkItemCard({
  link,
  saving,
  onSave,
  onDelete,
}: {
  link: MenuItemData
  saving: boolean
  onSave: (id: string, data: Record<string, unknown>) => void
  onDelete: (id: string, label: string) => void
}) {
  return (
    <div className="rounded-md border p-2.5 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-2">
          <Input
            defaultValue={link.label}
            placeholder="Link label"
            onBlur={(e) => {
              if (e.target.value !== link.label) {
                onSave(link.id, { label: e.target.value })
              }
            }}
            className="text-sm h-8"
          />
          <Input
            defaultValue={link.href ?? ""}
            placeholder="/about or https://..."
            onBlur={(e) => {
              if (e.target.value !== (link.href ?? "")) {
                onSave(link.id, { href: e.target.value })
              }
            }}
            className="text-sm h-8 text-muted-foreground"
          />
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mt-1"
          onClick={() => onDelete(link.id, link.label)}
          disabled={saving}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
      {/* External link toggle */}
      <div className="flex items-center gap-2 pl-1">
        <Switch
          checked={link.openInNewTab || link.isExternal}
          onCheckedChange={(checked) =>
            onSave(link.id, {
              openInNewTab: checked,
              isExternal: checked,
            })
          }
          className="scale-75 origin-left"
        />
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ExternalLink className="size-3" />
          Open in new tab
        </span>
      </div>
    </div>
  )
}

/* ── CMS-Driven Card ── */

function CmsDrivenCard({
  title,
  description,
  editPath,
}: {
  title: string
  description: string
  editPath: string
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3 space-y-2">
      <div className="flex items-start gap-2.5">
        <Database className="mt-0.5 size-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
            {title}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs h-7 bg-white dark:bg-transparent"
        onClick={() => window.open(editPath, "_blank")}
      >
        <ExternalLink className="size-3 mr-1.5" />
        Edit in CMS
      </Button>
    </div>
  )
}
