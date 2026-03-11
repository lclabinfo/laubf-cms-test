"use client"

import { useState, useEffect } from "react"
import { MapPin, Star, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import type { SavedAddress } from "@/lib/church-profile-data"

export function SavedAddressSettings() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Draft state for add/edit
  const [draft, setDraft] = useState<Omit<SavedAddress, "id" | "isPrimary">>({
    label: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  })

  useEffect(() => {
    fetch("/api/v1/church")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.settings?.savedAddresses) {
          setAddresses(json.data.settings.savedAddresses)
        } else if (json.success && json.data) {
          // Migrate: if no savedAddresses yet, seed from top-level church address
          const d = json.data
          if (d.address || d.city) {
            const migrated: SavedAddress = {
              id: crypto.randomUUID(),
              label: "Main Campus",
              address: d.address ?? "",
              city: d.city ?? "",
              state: d.state ?? "",
              zip: d.zipCode ?? "",
              isPrimary: true,
            }
            setAddresses([migrated])
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load saved addresses:", err)
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveAddresses(newAddresses: SavedAddress[]) {
    setSaving(true)
    try {
      const getRes = await fetch("/api/v1/church")
      const getJson = await getRes.json()
      const existingSettings =
        getJson.success && getJson.data?.settings
          ? getJson.data.settings
          : {}

      const res = await fetch("/api/v1/church", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...existingSettings,
            savedAddresses: newAddresses,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? "Save failed")
      toast.success("Saved addresses updated")
    } catch (err) {
      console.error("Failed to save addresses:", err)
      toast.error("Failed to save addresses")
      setAddresses(addresses) // revert
    } finally {
      setSaving(false)
    }
  }

  function handleSetPrimary(id: string) {
    const updated = addresses.map((a) => ({
      ...a,
      isPrimary: a.id === id,
    }))
    setAddresses(updated)
    saveAddresses(updated)
  }

  function handleDeleteClick(id: string) {
    setDeleteConfirmId(id)
  }

  function handleDeleteConfirm() {
    if (!deleteConfirmId) return
    const addr = addresses.find((a) => a.id === deleteConfirmId)
    if (addr?.isPrimary && addresses.length > 1) {
      toast.error("Set another address as primary first")
      setDeleteConfirmId(null)
      return
    }
    const updated = addresses.filter((a) => a.id !== deleteConfirmId)
    // If we deleted the primary and there's still one left, make the first one primary
    if (updated.length > 0 && !updated.some((a) => a.isPrimary)) {
      updated[0].isPrimary = true
    }
    setAddresses(updated)
    saveAddresses(updated)
    setDeleteConfirmId(null)
  }

  function handleStartAdd() {
    setDraft({ label: "", address: "", city: "", state: "", zip: "" })
    setAddingNew(true)
    setEditingId(null)
  }

  function handleStartEdit(addr: SavedAddress) {
    setDraft({
      label: addr.label,
      address: addr.address,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
    })
    setEditingId(addr.id)
    setAddingNew(false)
  }

  function handleCancelEdit() {
    setEditingId(null)
    setAddingNew(false)
  }

  function handleSaveNew() {
    if (!draft.label.trim() || !draft.address.trim()) {
      toast.error("Label and address are required")
      return
    }
    const newAddr: SavedAddress = {
      id: crypto.randomUUID(),
      label: draft.label.trim(),
      address: draft.address.trim(),
      city: draft.city.trim(),
      state: draft.state.trim(),
      zip: draft.zip.trim(),
      isPrimary: addresses.length === 0, // first one is auto-primary
    }
    const updated = [...addresses, newAddr]
    setAddresses(updated)
    saveAddresses(updated)
    setAddingNew(false)
  }

  function handleSaveEdit() {
    if (!draft.label.trim() || !draft.address.trim()) {
      toast.error("Label and address are required")
      return
    }
    const updated = addresses.map((a) =>
      a.id === editingId
        ? {
            ...a,
            label: draft.label.trim(),
            address: draft.address.trim(),
            city: draft.city.trim(),
            state: draft.state.trim(),
            zip: draft.zip.trim(),
          }
        : a
    )
    setAddresses(updated)
    saveAddresses(updated)
    setEditingId(null)
  }

  function formatAddressLine(addr: SavedAddress): string {
    const parts = [addr.address]
    if (addr.city) parts.push(addr.city)
    if (addr.state && addr.zip) {
      parts.push(`${addr.state} ${addr.zip}`)
    } else if (addr.state) {
      parts.push(addr.state)
    }
    return parts.join(", ")
  }

  if (loading) {
    return (
      <section id="saved-addresses" className="rounded-xl border bg-card">
        <div className="px-5 py-3 border-b flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold flex-1">Saved Addresses</h2>
        </div>
        <div className="p-5">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </section>
    )
  }

  return (
    <section id="saved-addresses" className="rounded-xl border bg-card">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <MapPin className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold flex-1">Saved Addresses</h2>
        {saving && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground">
          Save frequently used addresses. The primary address appears as the
          default when creating events. Click the star to set an address as
          primary.
        </p>

        {/* Address list */}
        <div className="space-y-1">
          {addresses.map((addr) => {
            const isEditing = editingId === addr.id

            if (isEditing) {
              return (
                <div key={addr.id} className="rounded-lg border p-3 space-y-3">
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={draft.label}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, label: e.target.value }))
                      }
                      placeholder="e.g. Main Campus"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={draft.address}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, address: e.target.value }))
                      }
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={draft.city}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, city: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={draft.state}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, state: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Zip</Label>
                      <Input
                        value={draft.zip}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, zip: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-7"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="h-7"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={addr.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/30"
              >
                {/* Primary star */}
                <button
                  type="button"
                  onClick={() => handleSetPrimary(addr.id)}
                  disabled={saving}
                  className={cn(
                    "shrink-0 transition-colors",
                    addr.isPrimary
                      ? "text-amber-500"
                      : "text-muted-foreground/30 hover:text-amber-400",
                    saving && "pointer-events-none"
                  )}
                  title={
                    addr.isPrimary
                      ? "Primary address"
                      : "Set as primary address"
                  }
                >
                  <Star
                    className="size-4"
                    fill={addr.isPrimary ? "currentColor" : "none"}
                  />
                </button>

                {/* Address info */}
                <button
                  type="button"
                  className="flex-1 min-w-0 text-left"
                  onClick={() => handleStartEdit(addr)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{addr.label}</span>
                    {addr.isPrimary && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatAddressLine(addr)}
                  </p>
                </button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(addr.id)}
                  disabled={saving}
                  className="shrink-0 size-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Add new form */}
        {addingNew && (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={draft.label}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, label: e.target.value }))
                }
                placeholder="e.g. Main Campus, Pastor's Home"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Street Address</Label>
              <Input
                value={draft.address}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, address: e.target.value }))
                }
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={draft.city}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  value={draft.state}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, state: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Zip</Label>
                <Input
                  value={draft.zip}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, zip: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                className="h-7"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveNew}
                disabled={saving}
                className="h-7"
              >
                Add Address
              </Button>
            </div>
          </div>
        )}

        {!addingNew && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartAdd}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Add Address
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Click an address to edit it. These addresses appear as quick-select
          options in event forms.
        </p>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">
                {addresses.find((a) => a.id === deleteConfirmId)?.label}
              </span>
              ? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

/**
 * Hook to fetch the church's saved addresses.
 * Used by other components (e.g., event form) to show the address picker.
 */
export function useSavedAddresses() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/church")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.settings?.savedAddresses) {
          setAddresses(json.data.settings.savedAddresses)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { addresses, loading }
}
