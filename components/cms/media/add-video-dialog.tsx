"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
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

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? match[1] : null
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
  const [fetching, setFetching] = useState(false)
  const [autoFetched, setAutoFetched] = useState(false)

  const platform = detectPlatform(url)
  const isValid = url.trim() && name.trim() && platform !== null

  // Auto-fetch video title when a valid YouTube/Vimeo URL is pasted
  useEffect(() => {
    if (!url.trim() || autoFetched) return

    const p = detectPlatform(url)
    if (!p) return

    // Only auto-fetch if user hasn't manually typed a name
    if (name.trim()) return

    let cancelled = false
    setFetching(true)

    if (p === "YouTube") {
      const videoId = extractYouTubeId(url)
      if (videoId) {
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
          .then((r) => r.json())
          .then((data) => {
            if (!cancelled && data.title) {
              setName(data.title)
              setAutoFetched(true)
            }
          })
          .catch(() => {})
          .finally(() => { if (!cancelled) setFetching(false) })
      } else {
        setFetching(false)
      }
    } else if (p === "Vimeo") {
      fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`)
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && data.title) {
            setName(data.title)
            setAutoFetched(true)
          }
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setFetching(false) })
    } else {
      setFetching(false)
    }

    return () => { cancelled = true }
  }, [url, name, autoFetched])

  // Reset auto-fetch state when URL changes
  function handleUrlChange(newUrl: string) {
    setUrl(newUrl)
    setAutoFetched(false)
    // Clear name if it was auto-fetched (user is entering a new URL)
    if (autoFetched) {
      setName("")
    }
  }

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
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste YouTube or Vimeo link"
                className={platform ? "pr-20" : ""}
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
            <div className="relative">
              <Input
                id="video-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fetching ? "Fetching title..." : "Video title"}
                disabled={fetching}
              />
              {fetching && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || fetching}>
              Add Video
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
