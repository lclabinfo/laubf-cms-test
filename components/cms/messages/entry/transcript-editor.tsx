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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { TranscriptSegment } from "@/lib/messages-data"

interface TranscriptEditorProps {
  rawTranscript: string
  onRawTranscriptChange: (value: string) => void
  segments: TranscriptSegment[]
  onSegmentsChange: (segments: TranscriptSegment[]) => void
  hasVideoUrl: boolean
}

type TranscriptMode = "raw" | "synced"
type ProcessingState = "idle" | "processing" | "done"

export function TranscriptEditor({
  rawTranscript,
  onRawTranscriptChange,
  segments,
  onSegmentsChange,
  hasVideoUrl,
}: TranscriptEditorProps) {
  const [mode, setMode] = useState<TranscriptMode>(segments.length > 0 ? "synced" : "raw")
  const [processing, setProcessing] = useState<ProcessingState>("idle")

  // Mock: simulate AI alignment from raw text → synced segments
  function handleAiAlignment() {
    if (!rawTranscript.trim()) return
    setProcessing("processing")

    // Simulate async processing
    setTimeout(() => {
      const sentences = rawTranscript
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.trim().length > 0)

      const newSegments: TranscriptSegment[] = sentences.map((text, i) => {
        const startSeconds = i * 15
        const endSeconds = startSeconds + 14
        return {
          id: `ts-${Date.now()}-${i}`,
          startTime: formatTimestamp(startSeconds),
          endTime: formatTimestamp(endSeconds),
          text: text.trim(),
        }
      })

      onSegmentsChange(newSegments)
      setMode("synced")
      setProcessing("done")

      // Reset processing state after a moment
      setTimeout(() => setProcessing("idle"), 2000)
    }, 2000)
  }

  // Mock: simulate YouTube caption import
  function handleYouTubeImport() {
    if (!hasVideoUrl) return
    setProcessing("processing")

    setTimeout(() => {
      // Simulate imported captions
      const mockCaptions: TranscriptSegment[] = [
        { id: `yt-${Date.now()}-0`, startTime: "00:00:00", endTime: "00:00:10", text: "[Imported caption segment 1 — replace with actual YouTube API data]" },
        { id: `yt-${Date.now()}-1`, startTime: "00:00:10", endTime: "00:00:22", text: "[Imported caption segment 2 — replace with actual YouTube API data]" },
        { id: `yt-${Date.now()}-2`, startTime: "00:00:22", endTime: "00:00:35", text: "[Imported caption segment 3 — replace with actual YouTube API data]" },
      ]

      onSegmentsChange(mockCaptions)
      // Also populate raw transcript from imported text
      onRawTranscriptChange(mockCaptions.map((s) => s.text).join(" "))
      setMode("synced")
      setProcessing("done")
      setTimeout(() => setProcessing("idle"), 2000)
    }, 2500)
  }

  // Mock: simulate AI transcript generation from audio
  function handleAiGenerate() {
    if (!hasVideoUrl) return
    setProcessing("processing")

    setTimeout(() => {
      const mockGenerated: TranscriptSegment[] = [
        { id: `ai-${Date.now()}-0`, startTime: "00:00:03", endTime: "00:00:18", text: "[AI-generated segment 1 — requires speech-to-text API integration]" },
        { id: `ai-${Date.now()}-1`, startTime: "00:00:18", endTime: "00:00:33", text: "[AI-generated segment 2 — requires speech-to-text API integration]" },
        { id: `ai-${Date.now()}-2`, startTime: "00:00:33", endTime: "00:00:48", text: "[AI-generated segment 3 — requires speech-to-text API integration]" },
      ]

      onSegmentsChange(mockGenerated)
      onRawTranscriptChange(mockGenerated.map((s) => s.text).join(" "))
      setMode("synced")
      setProcessing("done")
      setTimeout(() => setProcessing("idle"), 2000)
    }, 3000)
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
    input.accept = ".txt,.docx"
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
    const startSeconds = lastSegment ? parseTimestamp(lastSegment.endTime) + 1 : 0
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

  const hasContent = rawTranscript.trim() || segments.length > 0

  return (
    <div className="space-y-4">
      {/* Mode toggle + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={mode} onValueChange={(v) => setMode(v as TranscriptMode)}>
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="raw">Raw Transcript</SelectItem>
            <SelectItem value="synced">Synced Transcript</SelectItem>
          </SelectContent>
        </Select>

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
          <DropdownMenuContent align="end">
            {mode === "raw" ? (
              <>
                <DropdownMenuItem onClick={handleUploadRawText}>
                  <Upload />
                  Upload Text File (.TXT)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleAiAlignment}
                  disabled={!rawTranscript.trim()}
                >
                  <Sparkles />
                  AI Auto-Align to Timestamps
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={handleUploadCaption}>
                  <FileText />
                  Upload Caption File (.SRT/.VTT)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleYouTubeImport} disabled={!hasVideoUrl}>
                  <Youtube />
                  Import from YouTube
                  {!hasVideoUrl && (
                    <span className="text-muted-foreground text-[10px] ml-1">(add URL first)</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAiGenerate} disabled={!hasVideoUrl}>
                  <Sparkles />
                  Generate AI Transcript
                  {!hasVideoUrl && (
                    <span className="text-muted-foreground text-[10px] ml-1">(add URL first)</span>
                  )}
                </DropdownMenuItem>
              </>
            )}
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
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-500/30 dark:bg-blue-950/50 dark:text-blue-300">
          <Loader2 className="size-4 animate-spin" />
          Processing transcript... This may take a moment. You can continue editing and save — processing will complete in the background.
        </div>
      )}

      {processing === "done" && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-300">
          <Sparkles className="size-4" />
          Transcript processed successfully. Review and edit the segments below.
        </div>
      )}

      {/* Content */}
      {mode === "raw" ? (
        <div className="space-y-2">
          <Textarea
            value={rawTranscript}
            onChange={(e) => onRawTranscriptChange(e.target.value)}
            placeholder="Paste or type the full transcript text here..."
            className="min-h-[200px] font-mono text-sm"
          />
          {rawTranscript.trim() && segments.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/50 dark:text-amber-300">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>
                Raw transcript entered. Use <strong>AI Auto-Align</strong> to generate timestamp segments, or switch to <strong>Synced Transcript</strong> to manually add segments.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
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
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className="group flex items-start gap-2 rounded-lg border bg-card p-3"
                  >
                    <Badge variant="outline" className="mt-0.5 text-[10px] font-mono shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <Input
                          value={segment.startTime}
                          onChange={(e) => handleSegmentChange(segment.id, "startTime", e.target.value)}
                          className="w-[100px] font-mono text-xs h-7"
                          placeholder="00:00:00"
                        />
                        <span className="text-muted-foreground text-xs">to</span>
                        <Input
                          value={segment.endTime}
                          onChange={(e) => handleSegmentChange(segment.id, "endTime", e.target.value)}
                          className="w-[100px] font-mono text-xs h-7"
                          placeholder="00:00:00"
                        />
                      </div>
                      <Textarea
                        value={segment.text}
                        onChange={(e) => handleSegmentChange(segment.id, "text", e.target.value)}
                        className="min-h-[60px] text-sm"
                        placeholder="Segment text..."
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      onClick={() => handleDeleteSegment(segment.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleAddSegment}>
                <Plus className="size-3.5" />
                Add Segment
              </Button>
            </>
          )}
        </div>
      )}
    </div>
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
