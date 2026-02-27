"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon, Link } from "lucide-react"
import type { MediaItem } from "@/lib/media-data"

interface MediaSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (items: MediaItem[]) => void
  mode?: "single" | "multiple"
}

export function MediaSelectorDialog({
  open,
  onOpenChange,
  onSelect,
}: MediaSelectorDialogProps) {
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setUrl("")
      setError("")
    }
  }, [open])

  function handleSubmit() {
    const trimmed = url.trim()
    if (!trimmed) {
      setError("Please enter an image URL.")
      return
    }

    // Basic URL validation
    try {
      new URL(trimmed)
    } catch {
      setError("Please enter a valid URL (e.g. https://example.com/image.jpg).")
      return
    }

    // Create a synthetic MediaItem with the URL
    const item: MediaItem = {
      id: `url-${Date.now()}`,
      name: extractFilename(trimmed),
      type: "image",
      format: "JPG",
      url: trimmed,
      size: "-",
      folderId: null,
      dateAdded: new Date().toISOString().slice(0, 10),
    }

    onSelect([item])
    onOpenChange(false)
  }

  const hasPreview = (() => {
    try {
      new URL(url.trim())
      return url.trim().length > 0
    } catch {
      return false
    }
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Image from URL</DialogTitle>
          <DialogDescription>
            Paste an image URL to use as cover art. A full media library is
            coming soon.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* URL preview */}
          <div className="rounded-lg border bg-muted overflow-hidden">
            {hasPreview ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={url.trim()}
                alt="Preview"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "none"
                  ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
                }}
                onLoad={(e) => {
                  ;(e.target as HTMLImageElement).style.display = "block"
                  ;(e.target as HTMLImageElement).nextElementSibling?.classList.add("hidden")
                }}
              />
            ) : null}
            <div
              className={`flex flex-col items-center justify-center h-48 text-muted-foreground ${hasPreview ? "hidden" : ""}`}
            >
              <ImageIcon className="size-10 mb-2" />
              <p className="text-xs">Image preview will appear here</p>
            </div>
          </div>

          {/* URL input */}
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value)
                    setError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!url.trim()}>
            Use Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Extract a readable filename from a URL */
function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const segments = pathname.split("/").filter(Boolean)
    const last = segments[segments.length - 1]
    if (last) {
      return decodeURIComponent(last).slice(0, 80)
    }
  } catch {
    // ignore
  }
  return "image"
}
