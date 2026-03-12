"use client"

import { useState } from "react"
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899",
  "#f59e0b", "#10b981", "#3b82f6", "#ef4444",
  "#14b8a6", "#f97316", "#64748b", "#84cc16",
]

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [icon, setIcon] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const resetForm = () => {
    setName("")
    setDescription("")
    setColor("#6366f1")
    setIcon("")
  }

  const handleSubmit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Group name is required")
      return
    }

    setSubmitting(true)
    try {
      const slug = slugify(trimmedName)
      const res = await fetch("/api/v1/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          slug,
          description: description.trim() || undefined,
          color: color || undefined,
          icon: icon.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (json.success) {
        toast.success("Group created", {
          description: `"${trimmedName}" has been created.`,
        })
        onOpenChange(false)
        resetForm()
        onCreated()
      } else {
        toast.error(json.error?.message || "Failed to create group")
      }
    } catch {
      toast.error("Failed to create group")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Define a new group for your church members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Name *</Label>
            <Input
              id="group-name"
              placeholder="e.g., Sunday School Teacher"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {name.trim() && (
              <p className="text-xs text-muted-foreground">
                Slug: {slugify(name.trim())}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
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
            <Label htmlFor="group-icon">Icon name</Label>
            <Input
              id="group-icon"
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
            {submitting ? "Creating..." : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
