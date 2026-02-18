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

interface SeriesFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create"
  onSubmit: (data: { name: string }) => void
}

export function SeriesFormDialog({
  open,
  onOpenChange,
  mode,
  onSubmit,
}: SeriesFormDialogProps) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (open) setName("")
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ name: name.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Series</DialogTitle>
          <DialogDescription>
            Create a new message series. You can add a cover image and messages
            after creating it.
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
