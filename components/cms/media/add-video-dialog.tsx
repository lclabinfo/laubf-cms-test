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

interface AddVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { url: string; name: string }) => void
}

function detectPlatform(url: string): "YouTube" | "Vimeo" | null {
  if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube"
  if (/vimeo\.com/i.test(url)) return "Vimeo"
  return null
}

export function AddVideoDialog({ open, onOpenChange, onSubmit }: AddVideoDialogProps) {
  if (!open) return null
  return <AddVideoDialogInner onOpenChange={onOpenChange} onSubmit={onSubmit} />
}

function AddVideoDialogInner({
  onOpenChange,
  onSubmit,
}: Omit<AddVideoDialogProps, "open">) {
  const [url, setUrl] = useState("")
  const [name, setName] = useState("")

  const platform = detectPlatform(url)
  const isValid = url.trim() && name.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    onSubmit({ url: url.trim(), name: name.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Video Link</DialogTitle>
          <DialogDescription>
            Paste a YouTube or Vimeo link to add a video to your library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="video-url">Video URL</Label>
            <div className="relative">
              <Input
                id="video-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube or Vimeo link"
                autoFocus
              />
              {platform && (
                <span className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  platform === "YouTube"
                    ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
                    : "bg-info/10 text-info dark:bg-info/20"
                }`}>
                  {platform}
                </span>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="video-name">Video Title</Label>
            <Input
              id="video-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Video title"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Add Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
