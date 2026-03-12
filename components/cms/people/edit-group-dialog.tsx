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

export interface EditGroupData {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  icon: string | null
  isSystem: boolean
}

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: EditGroupData | null
  onUpdated: () => void
}

export function EditGroupDialog({ open, onOpenChange, group, onUpdated }: EditGroupDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [icon, setIcon] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (group) {
      setName(group.name)
      setDescription(group.description ?? "")
      setColor(group.color ?? "#6366f1")
      setIcon(group.icon ?? "")
    }
  }, [group])

  const handleSubmit = async () => {
    if (!group) return
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Group name is required")
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        description: description.trim() || null,
        color: color || null,
        icon: icon.trim() || null,
      }

      if (!group.isSystem) {
        body.name = trimmedName
      }

      const res = await fetch(`/api/v1/roles/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (json.success) {
        toast.success("Group updated", {
          description: `"${group.isSystem ? group.name : trimmedName}" has been updated.`,
        })
        onOpenChange(false)
        onUpdated()
      } else {
        toast.error(json.error?.message || "Failed to update group")
      }
    } catch {
      toast.error("Failed to update group")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            {group?.isSystem
              ? "System groups have limited editing. Name and slug cannot be changed."
              : "Update this group's details."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-group-name">Name {group?.isSystem ? "(locked)" : "*"}</Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={group?.isSystem}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-group-description">Description</Label>
            <Textarea
              id="edit-group-description"
              placeholder="What is this group for?"
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
            <Label htmlFor="edit-group-icon">Icon name</Label>
            <Input
              id="edit-group-icon"
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
