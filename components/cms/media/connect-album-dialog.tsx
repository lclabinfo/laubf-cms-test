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

interface ConnectAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { url: string }) => void
}

export function ConnectAlbumDialog({ open, onOpenChange, onSubmit }: ConnectAlbumDialogProps) {
  if (!open) return null
  return <ConnectAlbumDialogInner onOpenChange={onOpenChange} onSubmit={onSubmit} />
}

function ConnectAlbumDialogInner({
  onOpenChange,
  onSubmit,
}: Omit<ConnectAlbumDialogProps, "open">) {
  const [url, setUrl] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    onSubmit({ url: url.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect Google Album</DialogTitle>
          <DialogDescription>
            Paste a Google Photos album link to connect it to your media library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="album-url">Album URL</Label>
            <Input
              id="album-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://photos.app.goo.gl/..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
