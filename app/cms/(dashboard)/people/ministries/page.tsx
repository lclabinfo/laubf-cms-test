"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Ministry {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  isActive: boolean
  sortOrder: number
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

interface MinistryFormData {
  name: string
  slug: string
  description: string
  color: string
  isActive: boolean
  sortOrder: number
}

const emptyForm: MinistryFormData = {
  name: "",
  slug: "",
  description: "",
  color: "",
  isActive: true,
  sortOrder: 0,
}

export default function MinistriesPage() {
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMinistry, setEditingMinistry] = useState<Ministry | null>(null)
  const [form, setForm] = useState<MinistryFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchMinistries = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ministries")
      const json = await res.json()
      if (json.success) setMinistries(json.data)
    } catch (error) {
      console.error("Failed to fetch ministries:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMinistries()
  }, [fetchMinistries])

  function handleOpenCreate() {
    setEditingMinistry(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function handleOpenEdit(ministry: Ministry) {
    setEditingMinistry(ministry)
    setForm({
      name: ministry.name,
      slug: ministry.slug,
      description: ministry.description ?? "",
      color: ministry.color ?? "",
      isActive: ministry.isActive,
      sortOrder: ministry.sortOrder,
    })
    setDialogOpen(true)
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return

    setSaving(true)
    try {
      if (editingMinistry) {
        // Update
        const res = await fetch(`/api/v1/ministries/${editingMinistry.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim() || null,
            color: form.color.trim() || null,
            isActive: form.isActive,
            sortOrder: form.sortOrder,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("Ministry updated")
          fetchMinistries()
          setDialogOpen(false)
        } else {
          toast.error(json.error?.message ?? "Failed to update ministry")
        }
      } else {
        // Create
        const res = await fetch("/api/v1/ministries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description.trim() || null,
            color: form.color.trim() || null,
            isActive: form.isActive,
            sortOrder: form.sortOrder,
          }),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("Ministry created")
          fetchMinistries()
          setDialogOpen(false)
        } else {
          toast.error(json.error?.message ?? "Failed to create ministry")
        }
      }
    } catch (error) {
      console.error("Failed to save ministry:", error)
      toast.error("Failed to save ministry")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/ministries/${deleteTarget.slug}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Ministry deleted")
        fetchMinistries()
      } else {
        toast.error(json.error?.message ?? "Failed to delete ministry")
      }
    } catch (error) {
      console.error("Failed to delete ministry:", error)
      toast.error("Failed to delete ministry")
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="pt-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">Ministries</h1>
            {!loading && (
              <Badge variant="secondary" className="text-xs">
                {ministries.length}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Manage ministry groups used to categorize events.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="size-4" />
          Add Ministry
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : ministries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium">No ministries yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Add your first ministry to organize events by group.
          </p>
          <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-4">
            <Plus className="size-4" />
            Add Ministry
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ministries.map((ministry) => (
                <TableRow key={ministry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ministry.color && (
                        <span
                          className="inline-block size-3 rounded-full shrink-0"
                          style={{ backgroundColor: ministry.color }}
                        />
                      )}
                      <span className="font-medium">{ministry.name}</span>
                    </div>
                    {ministry.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {ministry.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ministry.isActive ? "default" : "secondary"} className="text-xs">
                      {ministry.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{ministry.sortOrder}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleOpenEdit(ministry)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(ministry)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMinistry ? "Edit Ministry" : "Add Ministry"}</DialogTitle>
            <DialogDescription>
              {editingMinistry
                ? "Update the ministry details."
                : "Create a new ministry to organize your events."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ministry-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="ministry-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Young Adult"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ministry-description">Description</Label>
              <Textarea
                id="ministry-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ministry-color">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="ministry-color"
                    value={form.color || "#000000"}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="h-9 w-12 cursor-pointer rounded border p-1"
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ministry-sort-order">Sort Order</Label>
                <Input
                  id="ministry-sort-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="ministry-active">Active</Label>
              <Switch
                id="ministry-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !form.name.trim()}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editingMinistry ? "Save Changes" : "Create Ministry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ministry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot
              be undone. Events linked to this ministry will have their ministry cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
