"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Loader2, MapPin } from "lucide-react"
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

interface Campus {
  id: string
  name: string
  slug: string
  shortName: string | null
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
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

interface CampusFormData {
  name: string
  slug: string
  shortName: string
  description: string
  address: string
  city: string
  state: string
  zipCode: string
  isActive: boolean
  sortOrder: number
}

const emptyForm: CampusFormData = {
  name: "",
  slug: "",
  shortName: "",
  description: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  isActive: true,
  sortOrder: 0,
}

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null)
  const [form, setForm] = useState<CampusFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Campus | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCampuses = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/campuses")
      const json = await res.json()
      if (json.success) setCampuses(json.data)
    } catch (error) {
      console.error("Failed to fetch campuses:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampuses()
  }, [fetchCampuses])

  function handleOpenCreate() {
    setEditingCampus(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function handleOpenEdit(campus: Campus) {
    setEditingCampus(campus)
    setForm({
      name: campus.name,
      slug: campus.slug,
      shortName: campus.shortName ?? "",
      description: campus.description ?? "",
      address: campus.address ?? "",
      city: campus.city ?? "",
      state: campus.state ?? "",
      zipCode: campus.zipCode ?? "",
      isActive: campus.isActive,
      sortOrder: campus.sortOrder,
    })
    setDialogOpen(true)
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingCampus ? prev.slug : slugify(name),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return

    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        shortName: form.shortName.trim() || null,
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zipCode: form.zipCode.trim() || null,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      }

      if (editingCampus) {
        const res = await fetch(`/api/v1/campuses/${editingCampus.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("Campus updated")
          fetchCampuses()
          setDialogOpen(false)
        } else {
          toast.error(json.error?.message ?? "Failed to update campus")
        }
      } else {
        const res = await fetch("/api/v1/campuses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (json.success) {
          toast.success("Campus created")
          fetchCampuses()
          setDialogOpen(false)
        } else {
          toast.error(json.error?.message ?? "Failed to create campus")
        }
      }
    } catch (error) {
      console.error("Failed to save campus:", error)
      toast.error("Failed to save campus")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/v1/campuses/${deleteTarget.slug}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Campus deleted")
        fetchCampuses()
      } else {
        toast.error(json.error?.message ?? "Failed to delete campus")
      }
    } catch (error) {
      console.error("Failed to delete campus:", error)
      toast.error("Failed to delete campus")
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
            <h1 className="text-xl font-semibold tracking-tight">Campuses</h1>
            {!loading && (
              <Badge variant="secondary" className="text-xs">
                {campuses.length}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Manage campus locations used to categorize events.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="size-4" />
          Add Campus
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : campuses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className="size-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-medium">No campuses yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Add your first campus location to organize events.
          </p>
          <Button onClick={handleOpenCreate} variant="outline" size="sm" className="mt-4">
            <Plus className="size-4" />
            Add Campus
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{campus.name}</span>
                      {campus.shortName && (
                        <span className="ml-2 text-xs text-muted-foreground">({campus.shortName})</span>
                      )}
                    </div>
                    {campus.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {campus.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs text-muted-foreground">{campus.slug}</code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {[campus.city, campus.state].filter(Boolean).join(", ") || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={campus.isActive ? "default" : "secondary"} className="text-xs">
                      {campus.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{campus.sortOrder}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleOpenEdit(campus)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(campus)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampus ? "Edit Campus" : "Add Campus"}</DialogTitle>
            <DialogDescription>
              {editingCampus
                ? "Update the campus details."
                : "Create a new campus location."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campus-name">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="campus-name"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. CSULB"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campus-short-name">Short Name</Label>
                <Input
                  id="campus-short-name"
                  value={form.shortName}
                  onChange={(e) => setForm((prev) => ({ ...prev, shortName: e.target.value }))}
                  placeholder="e.g. CSULB"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus-slug">Slug <span className="text-destructive">*</span></Label>
              <Input
                id="campus-slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g. csulb"
              />
              <p className="text-xs text-muted-foreground">
                Used as a unique identifier. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus-description">Description</Label>
              <Textarea
                id="campus-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus-address">Address</Label>
              <Input
                id="campus-address"
                value={form.address}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campus-city">City</Label>
                <Input
                  id="campus-city"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campus-state">State</Label>
                <Input
                  id="campus-state"
                  value={form.state}
                  onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="CA"
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campus-zip">ZIP Code</Label>
                <Input
                  id="campus-zip"
                  value={form.zipCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="90840"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="campus-sort-order">Sort Order</Label>
                <Input
                  id="campus-sort-order"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label htmlFor="campus-active">Active</Label>
                <Switch
                  id="campus-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || !form.name.trim() || !form.slug.trim()}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {editingCampus ? "Save Changes" : "Create Campus"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campus</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}&rdquo;? This action cannot
              be undone. Events linked to this campus will have their campus cleared.
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
