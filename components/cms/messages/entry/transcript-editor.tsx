"use client"

import { useState } from "react"
import {
  Upload,
  Download,
  Sparkles,
  Youtube,
  Plus,
  Trash2,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import type { TranscriptSegment } from "@/lib/messages-data"

interface TranscriptEditorProps {
  rawTranscript: string
  onRawTranscriptChange: (value: string) => void
  segments: TranscriptSegment[]
  onSegmentsChange: (segments: TranscriptSegment[]) => void
  videoUrl?: string
}

type TranscriptMode = "synced" | "raw"
type ProcessingState = "idle" | "processing" | "done"

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]+)/)
  return match?.[1] ?? null
}

export function TranscriptEditor({
  rawTranscript,
  onRawTranscriptChange,
  segments,
  onSegmentsChange,
  videoUrl,
}: TranscriptEditorProps) {
  const hasVideoUrl = Boolean(videoUrl)
  const [mode, setMode] = useState<TranscriptMode>(segments.length > 0 ? "synced" : "raw")
  const [processing, setProcessing] = useState<ProcessingState>("idle")

  async function handleAiAlignment() {
    if (!rawTranscript.trim()) return
    setProcessing("processing")

    try {
      const response = await fetch("/api/v1/ai/align-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawTranscript, duration: "00:45:00" }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(response.status === 503 ? "AI service not configured" : "Failed to align transcript", {
          description: data.message,
        })
        setProcessing("idle")
        return
      }

      onSegmentsChange(data.data)
      setMode("synced")
      setProcessing("done")
      setTimeout(() => setProcessing("idle"), 2000)
    } catch {
      toast.error("Failed to align transcript", {
        description: "Could not connect to the server. Please try again.",
      })
      setProcessing("idle")
    }
  }

  async function handleYouTubeImport() {
    if (!videoUrl) return

    const ytId = extractYouTubeId(videoUrl)
    if (!ytId) {
      toast.error("Invalid YouTube URL", { description: "Could not extract video ID from the URL." })
      return
    }

    setProcessing("processing")

    try {
      const response = await fetch(`/api/v1/youtube/captions?videoId=${encodeURIComponent(ytId)}`)
      const data = await response.json()

      if (!response.ok) {
        toast.error(response.status === 503 ? "YouTube API not configured" : "Failed to import captions", {
          description: data.message,
        })
        setProcessing("idle")
        return
      }

      const captionSegments: TranscriptSegment[] = data.data
      onSegmentsChange(captionSegments)
      onRawTranscriptChange(captionSegments.map((s) => s.text).join(" "))
      setMode("synced")
      setProcessing("done")
      setTimeout(() => setProcessing("idle"), 2000)
    } catch {
      toast.error("Failed to import captions", {
        description: "Could not connect to the server. Please try again.",
      })
      setProcessing("idle")
    }
  }

  async function handleYouTubeAiCleanup() {
    if (!videoUrl) return

    const ytId = extractYouTubeId(videoUrl)
    if (!ytId) {
      toast.error("Invalid YouTube URL", { description: "Could not extract video ID from the URL." })
      return
    }

    setProcessing("processing")

    try {
      // Step 1: Fetch YouTube captions
      const captionRes = await fetch(`/api/v1/youtube/captions?videoId=${encodeURIComponent(ytId)}`)
      const captionData = await captionRes.json()

      if (!captionRes.ok) {
        toast.error(captionRes.status === 503 ? "YouTube API not configured" : "Failed to import captions", {
          description: captionData.message,
        })
        setProcessing("idle")
        return
      }

      // Step 2: Send to AI for cleanup
      const cleanupRes = await fetch("/api/v1/ai/cleanup-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segments: captionData.data }),
      })

      const cleanupData = await cleanupRes.json()

      if (!cleanupRes.ok) {
        // If AI cleanup fails, fall back to raw YouTube captions
        if (cleanupRes.status === 503) {
          toast.warning("AI cleanup not configured — imported raw YouTube captions", {
            description: "Configure Azure OpenAI to enable AI-powered cleanup.",
          })
          const rawSegments: TranscriptSegment[] = captionData.data
          onSegmentsChange(rawSegments)
          onRawTranscriptChange(rawSegments.map((s) => s.text).join(" "))
        } else {
          toast.error("AI cleanup failed", { description: cleanupData.message })
        }
        setProcessing("idle")
        return
      }

      const cleanedSegments: TranscriptSegment[] = cleanupData.data
      onSegmentsChange(cleanedSegments)
      onRawTranscriptChange(cleanedSegments.map((s) => s.text).join(" "))
      setMode("synced")
      setProcessing("done")
      setTimeout(() => setProcessing("idle"), 2000)
    } catch {
      toast.error("Failed to import and clean captions", {
        description: "Could not connect to the server. Please try again.",
      })
      setProcessing("idle")
    }
  }

  function handleUploadCaption() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".srt,.vtt"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = reader.result as string
        // Simple SRT parser (mock — handles basic format)
        const parsed = parseSrt(text)
        if (parsed.length > 0) {
          onSegmentsChange(parsed)
          onRawTranscriptChange(parsed.map((s) => s.text).join(" "))
          setMode("synced")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  function handleUploadRawText() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".txt,.doc,.docx,.pdf,.rtf,.md"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        onRawTranscriptChange(reader.result as string)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  function handleSegmentChange(id: string, field: keyof TranscriptSegment, value: string) {
    onSegmentsChange(
      segments.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  function handleAddSegment() {
    const lastSegment = segments[segments.length - 1]
    const startSeconds = lastSegment ? parseTimestamp(lastSegment.startTime) + 15 : 0
    const newSegment: TranscriptSegment = {
      id: `ts-${Date.now()}`,
      startTime: formatTimestamp(startSeconds),
      endTime: formatTimestamp(startSeconds + 14),
      text: "",
    }
    onSegmentsChange([...segments, newSegment])
  }

  function handleDeleteSegment(id: string) {
    onSegmentsChange(segments.filter((s) => s.id !== id))
  }

  function handleDownload(format: "txt" | "srt") {
    let content: string
    let filename: string

    if (format === "txt") {
      content = segments.length > 0
        ? segments.map((s) => s.text).join("\n\n")
        : rawTranscript
      filename = "transcript.txt"
    } else {
      content = segments
        .map((s, i) => `${i + 1}\n${s.startTime},000 --> ${s.endTime},000\n${s.text}\n`)
        .join("\n")
      filename = "transcript.srt"
    }

    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /** Format start time as compact MM:SS for display */
  function formatCompactTime(ts: string): string {
    const total = parseTimestamp(ts)
    const m = Math.floor(total / 60)
    const s = total % 60
    return `${m}:${String(s).padStart(2, "0")}`
  }

  const hasContent = rawTranscript.trim() || segments.length > 0

  return (
    <Tabs value={mode} onValueChange={(v) => setMode(v as TranscriptMode)} className="space-y-4">
      {/* Tab toggle + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <TabsList variant="line">
          <TabsTrigger value="synced">Timestamped Segments</TabsTrigger>
          <TabsTrigger value="raw">Full Transcript</TabsTrigger>
        </TabsList>

        <div className="flex-1" />

        {/* Import actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={processing === "processing"}>
              {processing === "processing" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {processing === "processing" ? "Processing..." : "Import / Generate"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Manual Import</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleUploadRawText}>
                <Upload />
                <div className="flex flex-col">
                  <span>Upload Text File</span>
                  <span className="text-muted-foreground text-[11px] font-normal">.txt, .doc, .md — imported as full text</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUploadCaption}>
                <FileText />
                <div className="flex flex-col">
                  <span>Upload Caption File (.SRT/.VTT)</span>
                  <span className="text-muted-foreground text-[11px] font-normal">Timestamped captions parsed into segments</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuLabel>AI-Powered</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleAiAlignment}
                disabled={!rawTranscript.trim()}
              >
                <Sparkles />
                <div className="flex flex-col">
                  <span>AI Auto-Align to Timestamps</span>
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {!rawTranscript.trim()
                      ? "Requires full text — paste text in Full Text tab first"
                      : "Distributes your text into timestamped segments"}
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleYouTubeImport} disabled={!hasVideoUrl}>
                <Youtube />
                <div className="flex flex-col">
                  <span>Import YouTube Captions</span>
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {!hasVideoUrl
                      ? "Requires a YouTube video URL — set it in the Video URL field above"
                      : "Fetches auto-generated or manual captions"}
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleYouTubeAiCleanup} disabled={!hasVideoUrl}>
                <Youtube />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span>Import YouTube + AI Cleanup</span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">Best</Badge>
                  </div>
                  <span className="text-muted-foreground text-[11px] font-normal">
                    {!hasVideoUrl
                      ? "Requires a YouTube video URL — set it in the Video URL field above"
                      : "YouTube captions cleaned by AI for readability"}
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Download */}
        {hasContent && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="size-3.5" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload("txt")}>
                Download as .TXT
              </DropdownMenuItem>
              {segments.length > 0 && (
                <DropdownMenuItem onClick={() => handleDownload("srt")}>
                  Download as .SRT
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Processing indicator */}
      {processing === "processing" && (
        <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info/5 px-3 py-2 text-sm text-info dark:border-info/30 dark:bg-info/10">
          <Loader2 className="size-4 animate-spin" />
          Processing transcript... This may take a moment. You can continue editing and save — processing will complete in the background.
        </div>
      )}

      {processing === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-sm text-success dark:border-success/30 dark:bg-success/10">
          <Sparkles className="size-4" />
          Transcript processed successfully. Review and edit the segments below.
        </div>
      )}

      {/* Synced / Live Captions tab (primary) */}
      <TabsContent value="synced" className="mt-0">
        <div className="space-y-1.5">
          {segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center">
              <FileText className="size-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">No transcript segments</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Import captions from YouTube, upload an SRT file, generate with AI, or add segments manually.
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleAddSegment}>
                <Plus className="size-3.5" />
                Add Segment
              </Button>
            </div>
          ) : (
            <>
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="group flex items-center gap-2 rounded-md border bg-card px-2 py-2.5 mb-1 hover:bg-accent/30 transition-colors"
                >
                  {/* Compact timestamp input */}
                  <Input
                    value={formatCompactTime(segment.startTime)}
                    onChange={(e) => {
                      // Convert compact MM:SS back to HH:MM:SS for storage
                      const val = e.target.value
                      const parts = val.split(":").map(Number)
                      let totalSec = 0
                      if (parts.length === 2) totalSec = (parts[0] || 0) * 60 + (parts[1] || 0)
                      else if (parts.length === 1) totalSec = parts[0] || 0
                      handleSegmentChange(segment.id, "startTime", formatTimestamp(totalSec))
                    }}
                    className="shrink-0 font-mono text-xs text-center w-16 h-7 rounded-md bg-muted border-transparent focus:border-input focus:bg-background"
                  />

                  {/* Full-width text input */}
                  <Input
                    value={segment.text}
                    onChange={(e) => handleSegmentChange(segment.id, "text", e.target.value)}
                    className="flex-1 h-7 text-sm border-input/30 bg-transparent hover:bg-background focus:bg-background focus:border-input transition-colors"
                    placeholder="Segment text..."
                  />

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteSegment(segment.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}

              {/* Full-width add segment button */}
              <button
                type="button"
                onClick={handleAddSegment}
                className="w-full flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/40 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="size-3.5" />
                Add Timestamp Segment
              </button>
            </>
          )}
        </div>
      </TabsContent>

      {/* Raw / Full Text tab (secondary) */}
      <TabsContent value="raw" className="mt-0">
        <div className="space-y-2">
          <RichTextEditor
            content={rawTranscript}
            onContentChange={onRawTranscriptChange}
            placeholder="Paste or type the full transcript text here..."
            minHeight="200px"
          />
          {rawTranscript.trim() && segments.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-sm text-warning-foreground dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>
                Full text entered. Use <strong>AI Auto-Align</strong> from the Import / Generate menu to create timestamp segments.
              </span>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Helpers

function formatTimestamp(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function parseTimestamp(ts: string): number {
  const parts = ts.split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

function parseSrt(text: string): TranscriptSegment[] {
  const blocks = text.trim().split(/\n\s*\n/)
  const segments: TranscriptSegment[] = []

  for (const block of blocks) {
    const lines = block.trim().split("\n")
    if (lines.length < 3) continue

    const timeLine = lines[1]
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2})[,.]?\d*\s*-->\s*(\d{2}:\d{2}:\d{2})/)
    if (!timeMatch) continue

    segments.push({
      id: `srt-${Date.now()}-${segments.length}`,
      startTime: timeMatch[1],
      endTime: timeMatch[2],
      text: lines.slice(2).join(" ").trim(),
    })
  }

  return segments
}
