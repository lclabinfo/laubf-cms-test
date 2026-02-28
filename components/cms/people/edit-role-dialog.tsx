"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f59e0b", "#10b981", "#3b82f6", "#ef4444",
  "#14b8a6", "#f97316", "#64748b", "#84cc16",
]

export interface EditRoleData {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  isSystem: boolean
}

interface EditRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: EditRoleData | null
  onUpdated: () => void
}

export function EditRoleDialog({ open, onOpenChange, role, onUpdated }: EditRoleDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [icon, setIcon] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (role) {
      setName(role.name)
      setDescription(role.description ?? "")
      setColor(role.color ?? "#6366f1")
      setIcon(role.icon ?? "")
    }
  }, [role])

  const handleSubmit = async () => {
    if (!role) return
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Role name is required")
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        description: description.trim() || null,
        color: color || null,
        icon: icon.trim() || null,
      }

      // Only include name for custom roles (DAL blocks name changes on system roles anyway)
      if (!role.isSystem) {
        body.name = trimmedName
      }

      const res = await fetch(`/api/v1/roles/${role.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (json.success) {
        toast.success("Role updated", {
          description: `"${role.isSystem ? role.name : trimmedName}" has been updated.`,
        })
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(json.error?.message || "Failed to update role")
      }
    } catch {
      toast.error("Failed to update role")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
          <DialogDescription>
            {role?.isSystem
              ? "System roles have limited editing. Name and slug cannot be changed."
              : "Update this role's details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-role-name">Name {role?.isSystem ? "(locked)" : "*"}</Label>
            <Input
              id="edit-role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={role?.isSystem}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-description">Description</Label>
            <Textarea
              id="edit-role-description"
              placeholder="What does this role do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="size-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "var(--foreground)" : "transparent",
                  }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role-icon">Icon name</Label>
            <Input
              id="edit-role-icon"
              placeholder="e.g., mic, shield, book-open"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Lucide icon name (optional)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
