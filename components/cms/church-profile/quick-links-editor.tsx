"use client"

import { useState, useCallback } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Link as LinkIcon,
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

/* ── Component ── */

export function QuickLinksEditor({
  menuId,
  parentId,
  initialItems,
}: QuickLinksEditorProps) {
  const [items, setItems] = useState<QuickLinkItem[]>(initialItems)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<QuickLinkItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reordering, setReordering] = useState(false)

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
        if (!res.ok) throw new Error("Failed to update quick link")
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
        if (!res.ok) throw new Error("Failed to create quick link")
        const json = await res.json()
        if (!json.success) throw new Error(json.error?.message ?? "Create failed")

        setItems((prev) => [...prev, json.data])
        toast.success("Quick link added")
      }
      setDialogOpen(false)
    } catch (err) {
      console.error("Save quick link error:", err)
      toast.error(editingId ? "Failed to update quick link" : "Failed to add quick link")
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
      if (!res.ok) throw new Error("Failed to delete quick link")
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? "Delete failed")

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      toast.success("Quick link deleted")
    } catch (err) {
      console.error("Delete quick link error:", err)
      toast.error("Failed to delete quick link")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }, [deleteTarget, menuId])

  // ── Reorder ──

  const moveItem = useCallback(
    async (index: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= items.length) return

      const reordered = [...items]
      const [moved] = reordered.splice(index, 1)
      reordered.splice(newIndex, 0, moved)
      setItems(reordered)

      setReordering(true)
      try {
        const res = await fetch(`/api/v1/menus/${menuId}/items`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemIds: reordered.map((i) => i.id) }),
        })
        if (!res.ok) throw new Error("Failed to reorder")
      } catch (err) {
        console.error("Reorder error:", err)
        toast.error("Failed to reorder quick links")
        // Revert on failure
        setItems(items)
      } finally {
        setReordering(false)
      }
    },
    [items, menuId]
  )

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Quick Links</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              These appear as a floating action button on your public website.
            </p>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="size-3.5" />
            Add Quick Link
          </Button>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <LinkIcon className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium">No quick links yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add links to meetings, livestreams, or other resources your members access often.
            </p>
            <Button size="sm" variant="outline" onClick={openAdd} className="mt-4 gap-1.5">
              <Plus className="size-3.5" />
              Add Quick Link
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const Icon = ICON_BY_NAME.get(item.iconName ?? "") ?? LinkIcon
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 flex items-center gap-4 transition-opacity",
                    !item.isVisible && "opacity-60"
                  )}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {!item.isVisible && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                    {item.href && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1">
                        <ExternalLink className="size-3 shrink-0" />
                        {item.href}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === 0 || reordering}
                      onClick={() => moveItem(index, "up")}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === items.length - 1 || reordering}
                      onClick={() => moveItem(index, "down")}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-5 mx-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
