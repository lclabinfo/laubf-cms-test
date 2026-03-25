"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ExternalLink,
  EyeOff,
  Eye,
  Loader2,
  Link as LinkIcon,
  X,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"
import { IconPicker, ICON_BY_NAME } from "./icon-picker"

/* ── Types ── */

interface QuickLinkItem {
  id: string
  label: string
  description: string | null
  href: string | null
  iconName: string | null
  isVisible: boolean
  isExternal: boolean
  openInNewTab: boolean
  sortOrder: number
  groupLabel: string | null
  parentId: string | null
}

interface QuickLinksEditorProps {
  menuId: string
  parentId: string
  initialItems: QuickLinkItem[]
}

interface FormData {
  label: string
  description: string
  href: string
  iconName: string
  openInNewTab: boolean
  isVisible: boolean
}

const emptyForm: FormData = {
  label: "",
  description: "",
  href: "",
  iconName: "book-open",
  openInNewTab: true,
  isVisible: true,
}

/* ── Sortable Item (edit mode) ── */

function SortableQuickLink({
  item,
  onEdit,
  onDelete,
}: {
  item: QuickLinkItem
  onEdit: (item: QuickLinkItem) => void
  onDelete: (item: QuickLinkItem) => void
}) {
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
  }

  const Icon = ICON_BY_NAME.get(item.iconName ?? "") ?? LinkIcon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border px-3 py-2.5 flex items-center gap-3 bg-card",
        isDragging && "opacity-50 shadow-lg z-50 relative",
        !item.isVisible && "opacity-60"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"
      >
        <GripVertical className="size-4" />
      </button>

      {/* Icon */}
      <div className="flex items-center justify-center size-8 rounded-md bg-muted shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{item.label}</p>
          {!item.isVisible && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              Hidden
            </Badge>
          )}
        </div>
        {item.href && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <ExternalLink className="size-3 shrink-0" />
            {item.href}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => onEdit(item)}
        >
          <Pencil className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </div>
  )
}

/* ── Read-only item ── */

function ReadOnlyQuickLink({ item }: { item: QuickLinkItem }) {
  const Icon = ICON_BY_NAME.get(item.iconName ?? "") ?? LinkIcon

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        !item.isVisible && "opacity-60"
      )}
    >
      <div className="flex items-center justify-center size-8 rounded-md bg-muted shrink-0">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{item.label}</p>
          {!item.isVisible && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              Hidden
            </Badge>
          )}
        </div>
        {item.href && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
            <ExternalLink className="size-3 shrink-0" />
            {item.href}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Component ── */

export function QuickLinksEditor({
  menuId,
  parentId,
  initialItems,
}: QuickLinksEditorProps) {
  const [items, setItems] = useState<QuickLinkItem[]>(initialItems)
  const [editing, setEditing] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<QuickLinkItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // ── Open dialog for add/edit ──

  const openAdd = useCallback(() => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }, [])

  const openEdit = useCallback((item: QuickLinkItem) => {
    setEditingId(item.id)
    setForm({
      label: item.label,
      description: item.description ?? "",
      href: item.href ?? "",
      iconName: item.iconName ?? "book-open",
      openInNewTab: item.openInNewTab,
      isVisible: item.isVisible,
    })
    setDialogOpen(true)
  }, [])

  // ── Save (create or update) ──

  const handleSave = useCallback(async () => {
    if (!form.label.trim()) {
      toast.error("Label is required")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        // Update existing
        const res = await fetch(`/api/v1/menus/${menuId}/items/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            description: form.description.trim() || null,
            href: form.href.trim() || null,
            iconName: form.iconName,
            openInNewTab: form.openInNewTab,
            isVisible: form.isVisible,
            isExternal: true,
          }),
        })
        if (!res.ok) {
          const errJson = await res.json().catch(() => null)
          if (res.status === 403) throw new Error(errJson?.error?.message ?? "Insufficient permissions")
          throw new Error(errJson?.error?.message ?? "Failed to update quick link")
        }
        const json = await res.json()
        if (!json.success) throw new Error(json.error?.message ?? "Update failed")

        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? { ...item, ...json.data } : item))
        )
        toast.success("Quick link updated")
      } else {
        // Create new
        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            description: form.description.trim() || null,
            href: form.href.trim() || null,
            iconName: form.iconName,
            openInNewTab: form.openInNewTab,
            isVisible: form.isVisible,
            isExternal: true,
            groupLabel: "Quick Links",
            parentId,
          }),
        })
        if (!res.ok) {
          const errJson = await res.json().catch(() => null)
          if (res.status === 403) throw new Error(errJson?.error?.message ?? "Insufficient permissions")
          throw new Error(errJson?.error?.message ?? "Failed to create quick link")
        }
        const json = await res.json()
        if (!json.success) throw new Error(json.error?.message ?? "Create failed")

        setItems((prev) => [...prev, json.data])
        toast.success("Quick link added")
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("Save quick link error:", err)
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("permissions") || msg.includes("FORBIDDEN")) {
        toast.error("Permission denied", {
          description: "You don't have permission to edit quick links. Please contact the site owner.",
        })
      } else {
        toast.error(editingId ? "Failed to update quick link" : "Failed to add quick link", {
          description: msg || undefined,
        })
      }
    } finally {
      setSaving(false)
    }
  }, [editingId, form, menuId, parentId])

  // ── Delete ──

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/v1/menus/${menuId}/items/${deleteTarget.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const errJson = await res.json().catch(() => null)
        if (res.status === 403) throw new Error(errJson?.error?.message ?? "Insufficient permissions")
        throw new Error(errJson?.error?.message ?? "Failed to delete quick link")
      }
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? "Delete failed")

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      toast.success("Quick link deleted")
    } catch (err) {
      console.error("Delete quick link error:", err)
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("permissions") || msg.includes("FORBIDDEN")) {
        toast.error("Permission denied", {
          description: "You don't have permission to delete quick links. Please contact the site owner.",
        })
      } else {
        toast.error("Failed to delete quick link", {
          description: msg || undefined,
        })
      }
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, menuId])

  // ── Drag end — reorder and persist ──

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = items.findIndex((i) => i.id === active.id)
      const newIndex = items.findIndex((i) => i.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(items, oldIndex, newIndex)
      setItems(reordered)

      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIds: reordered.map((i) => i.id) }),
        })
        if (!res.ok) {
          const errJson = await res.json().catch(() => null)
          if (res.status === 403) throw new Error(errJson?.error?.message ?? "Insufficient permissions")
          throw new Error(errJson?.error?.message ?? "Failed to reorder")
        }
      } catch (err) {
        console.error("Reorder error:", err)
        const msg = err instanceof Error ? err.message : ""
        if (msg.includes("permissions") || msg.includes("FORBIDDEN")) {
          toast.error("Permission denied", {
            description: "You don't have permission to reorder quick links. Please contact the site owner.",
          })
        } else {
          toast.error("Failed to reorder quick links", {
            description: msg || undefined,
          })
        }
        setItems(items)
      }
    },
    [items, menuId]
  )

  return (
    <>
      <section className="rounded-xl border bg-card">
        {/* Section header — matches SectionHeader pattern */}
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <LinkIcon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold flex-1">Quick Links</h2>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                className="h-7 gap-1 text-muted-foreground"
              >
                <X className="size-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => setEditing(false)}
                className="h-7 gap-1"
              >
                <Check className="size-3.5" />
                Done
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="h-7 gap-1 text-muted-foreground"
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
        </div>

        <div className="p-5">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <LinkIcon className="size-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No quick links yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add links to meetings, livestreams, or other resources.
              </p>
              <Button size="sm" variant="outline" onClick={() => { setEditing(true); openAdd() }} className="mt-3 gap-1.5">
                <Plus className="size-3.5" />
                Add Quick Link
              </Button>
            </div>
          ) : editing ? (
            <>
              <p className="text-xs text-muted-foreground mb-4">
                Drag to reorder. These appear as a floating action button on your public website.
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <SortableQuickLink
                        key={item.id}
                        item={item}
                        onEdit={openEdit}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button
                variant="outline"
                size="sm"
                onClick={openAdd}
                className="mt-4 gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Quick Link
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <ReadOnlyQuickLink key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Quick Link" : "Add Quick Link"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this quick link's details."
                : "Add a new quick link to the floating action button on your website."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Icon */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker
                value={form.iconName}
                onChange={(name) => setForm((f) => ({ ...f, iconName: name }))}
              />
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="ql-label">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ql-label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Daily Bread & Prayer"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="ql-desc">Description</Label>
              <Input
                id="ql-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Mon-Fri @ 6 AM"
              />
              <p className="text-xs text-muted-foreground">
                Shown as secondary text below the label.
              </p>
            </div>

            {/* Link URL */}
            <div className="space-y-2">
              <Label htmlFor="ql-href">Link URL</Label>
              <Input
                id="ql-href"
                value={form.href}
                onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            {/* Switches */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ql-newtab">Open in new tab</Label>
                <p className="text-xs text-muted-foreground">External links typically open in a new tab.</p>
              </div>
              <Switch
                id="ql-newtab"
                checked={form.openInNewTab}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, openInNewTab: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ql-visible" className="flex items-center gap-1.5">
                  {form.isVisible ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                  Visible
                </Label>
                <p className="text-xs text-muted-foreground">Hidden links won't appear on the website.</p>
              </div>
              <Switch
                id="ql-visible"
                checked={form.isVisible}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isVisible: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {editingId ? "Save Changes" : "Add Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete quick link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{deleteTarget?.label}&rdquo; from the quick links
              on your website. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
