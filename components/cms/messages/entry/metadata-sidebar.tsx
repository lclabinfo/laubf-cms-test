"use client"

import { useRef } from "react"
import { Upload, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SeriesSelect } from "./series-select"
import type { Series, MessageStatus, Attachment } from "@/lib/messages-data"
import { statusDisplay } from "@/lib/status"

interface MetadataSidebarProps {
  status: MessageStatus
  onStatusChange: (status: MessageStatus) => void
  date: string
  onDateChange: (date: string) => void
  speaker: string
  onSpeakerChange: (speaker: string) => void
  seriesIds: string[]
  onSeriesIdsChange: (ids: string[]) => void
  passage: string
  onPassageChange: (passage: string) => void
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  allSeries: Series[]
}

const statusOptions: MessageStatus[] = ["draft", "published", "scheduled", "archived"]

export function MetadataSidebar({
  status,
  onStatusChange,
  date,
  onDateChange,
  speaker,
  onSpeakerChange,
  seriesIds,
  onSeriesIdsChange,
  passage,
  onPassageChange,
  attachments,
  onAttachmentsChange,
  allSeries,
}: MetadataSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleUploadAttachment() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
    }))
    onAttachmentsChange([...attachments, ...newAttachments])
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleRemoveAttachment(id: string) {
    onAttachmentsChange(attachments.filter((a) => a.id !== id))
  }

  return (
    <div className="w-72 shrink-0 space-y-6">
      {/* Section label */}
      <div className="rounded-xl border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Message Metadata</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Applies to both video and study content.
          </p>
        </div>

        <div className="p-4 space-y-5">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => onStatusChange(v as MessageStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => {
                  const config = statusDisplay[s]
                  return (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>

          {/* Speaker */}
          <div className="space-y-2">
            <Label htmlFor="speaker">Speaker</Label>
            <Input
              id="speaker"
              value={speaker}
              onChange={(e) => onSpeakerChange(e.target.value)}
              placeholder="e.g. Pastor David"
            />
          </div>

          {/* Series */}
          <div className="space-y-2">
            <Label>Series</Label>
            <SeriesSelect
              series={allSeries}
              selectedIds={seriesIds}
              onChange={onSeriesIdsChange}
            />
          </div>

          {/* Passage */}
          <div className="space-y-2">
            <Label htmlFor="passage">Passage</Label>
            <Input
              id="passage"
              value={passage}
              onChange={(e) => onPassageChange(e.target.value)}
              placeholder="e.g. John 3:16"
            />
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div className="rounded-xl border bg-card">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold">Attachments</h3>
          <Button variant="ghost" size="sm" onClick={handleUploadAttachment}>
            <Upload className="size-3.5" />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="p-4">
          {attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              No attachments yet.
            </p>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-2"
                >
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{att.name}</p>
                    <p className="text-xs text-muted-foreground">{att.size}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveAttachment(att.id)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
