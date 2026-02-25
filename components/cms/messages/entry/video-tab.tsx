"use client"

import { useState } from "react"
import { ExternalLink, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { TranscriptEditor } from "./transcript-editor"
import type { TranscriptSegment } from "@/lib/messages-data"

interface VideoTabProps {
  videoUrl: string
  onVideoUrlChange: (value: string) => void
  description: string
  onDescriptionChange: (value: string) => void
  rawTranscript: string
  onRawTranscriptChange: (value: string) => void
  segments: TranscriptSegment[]
  onSegmentsChange: (segments: TranscriptSegment[]) => void
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/
  )
  return match?.[1] ?? null
}

function detectPlatform(url: string): "YouTube" | "Vimeo" | null {
  if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube"
  if (/vimeo\.com/i.test(url)) return "Vimeo"
  return null
}

export function VideoTab({
  videoUrl,
  onVideoUrlChange,
  description,
  onDescriptionChange,
  rawTranscript,
  onRawTranscriptChange,
  segments,
  onSegmentsChange,
}: VideoTabProps) {
  const [urlInput, setUrlInput] = useState(videoUrl)
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState(!!videoUrl)

  const platform = detectPlatform(urlInput)
  const youtubeId = platform === "YouTube" ? extractYouTubeId(urlInput) : null
  const hasValidPreview = checked && (youtubeId || platform === "Vimeo")

  function handleCheckUrl() {
    if (!urlInput.trim()) return
    setChecking(true)
    // Simulate URL validation
    setTimeout(() => {
      onVideoUrlChange(urlInput.trim())
      setChecking(false)
      setChecked(true)
    }, 800)
  }

  function handleImportMetadata() {
    // Mock: simulate fetching metadata from YouTube
    if (!youtubeId) return
    // In a real implementation, this would call the YouTube Data API
    // to fetch the video title, description, and captions
  }

  return (
    <div className="space-y-6">
      {/* Video URL */}
      <div className="space-y-3">
        <Label>Video URL</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value)
                setChecked(false)
              }}
              placeholder="Paste YouTube or Vimeo link"
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
          <Button
            variant="outline"
            onClick={handleCheckUrl}
            disabled={!urlInput.trim() || checking}
          >
            {checking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : checked ? (
              <Check className="size-4" />
            ) : null}
            {checking ? "Checking..." : checked ? "Verified" : "Check URL"}
          </Button>
        </div>
      </div>

      {/* Video Preview */}
      {hasValidPreview && youtubeId && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Video Preview</Label>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleImportMetadata}>
                Import Metadata
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                  Open
                </a>
              </Button>
            </div>
          </div>
          <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="Video preview"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="size-full"
            />
          </div>
        </div>
      )}

      {hasValidPreview && platform === "Vimeo" && (
        <div className="rounded-lg border bg-muted/50 p-4 text-center">
          <Badge variant="outline" className="mb-2">Vimeo</Badge>
          <p className="text-sm text-muted-foreground">
            Vimeo video linked successfully.{" "}
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="underline">
              Open in new tab
            </a>
          </p>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="video-description">Description</Label>
        <Textarea
          id="video-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Video description..."
          className="min-h-[100px]"
        />
      </div>

      {/* Transcript */}
      <div className="space-y-2">
        <Label>Transcript</Label>
        <TranscriptEditor
          rawTranscript={rawTranscript}
          onRawTranscriptChange={onRawTranscriptChange}
          segments={segments}
          onSegmentsChange={onSegmentsChange}
          hasVideoUrl={!!videoUrl}
        />
      </div>
    </div>
  )
}
