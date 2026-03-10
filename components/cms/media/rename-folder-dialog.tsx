"use client"

import { useState } from "react"
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

interface RenameFolderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onSubmit: (newName: string) => void
}

export function RenameFolderDialog({ open, onOpenChange, currentName, onSubmit }: RenameFolderDialogProps) {
  if (!open) return null
  return (
    <RenameFolderDialogInner
      onOpenChange={onOpenChange}
      currentName={currentName}
      onSubmit={onSubmit}
    />
  )
}

function RenameFolderDialogInner({
  onOpenChange,
  currentName,
  onSubmit,
}: Omit<RenameFolderDialogProps, "open">) {
  const [name, setName] = useState(currentName)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || name.trim() === currentName) return
    onSubmit(name.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
          <DialogDescription>
            Enter a new name for this folder.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="rename-folder">Folder Name</Label>
            <Input
              id="rename-folder"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || name.trim() === currentName}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
