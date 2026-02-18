"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Series } from "@/lib/messages-data"

interface SeriesFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  series?: Series | null
  onSubmit: (data: { name: string; imageUrl?: string }) => void
}

export function SeriesFormDialog({
  open,
  onOpenChange,
  mode,
  series,
  onSubmit,
}: SeriesFormDialogProps) {
  const [name, setName] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  useEffect(() => {
    if (open) {
      if (mode === "edit" && series) {
        setName(series.name)
        setImageUrl(series.imageUrl ?? "")
      } else {
        setName("")
        setImageUrl("")
      }
    }
  }, [open, mode, series])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name: name.trim(), imageUrl: imageUrl.trim() || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Series" : "Edit Series"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new message series."
              : "Update the series details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="series-name">Series Name</Label>
            <Input
              id="series-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gospel of John"
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="series-image">Cover Image URL</Label>
            <Input
              id="series-image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-muted-foreground text-xs">
              Optional. Provide a URL for the series cover image.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
