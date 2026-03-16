"use client"

import { BookOpen, Video, Paperclip } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Message } from "@/lib/messages-data"

/**
 * Compact single-line row showing an entry's title + study/video/attachment status.
 * Used in delete, archive, and publish confirmation dialogs.
 */
function EntryRow({ msg }: { msg: Message }) {
  const studyLive = msg.studyPublished
  const studyExists = msg.hasStudyContent
  const videoLive = msg.videoPublished
  const videoExists = msg.hasVideoContent
  const attachCount = msg.attachments?.length ?? 0

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 min-w-0">
      <span className="text-xs font-medium truncate min-w-0 flex-1">{msg.title}</span>
      <div className="flex items-center gap-1 shrink-0">
        {studyExists && (
          <Badge variant={studyLive ? "success" : "secondary"} className="text-[10px] h-4 px-1 gap-0.5">
            <BookOpen className="size-2.5" />
            {studyLive ? "Live" : "Draft"}
          </Badge>
        )}
        {videoExists && (
          <Badge variant={videoLive ? "success" : "secondary"} className="text-[10px] h-4 px-1 gap-0.5">
            <Video className="size-2.5" />
            {videoLive ? "Live" : "Draft"}
          </Badge>
        )}
        {attachCount > 0 && (
          <Badge variant="outline" className="text-[10px] h-4 px-1 gap-0.5 text-muted-foreground">
            <Paperclip className="size-2.5" />
            {attachCount}
          </Badge>
        )}
      </div>
    </div>
  )
}

interface EntryListPanelProps {
  messages: Message[]
}

/**
 * Fixed-height scrollable panel listing entries with their status.
 * Designed to sit inside AlertDialog / Dialog content.
 * Single entry: auto height. Multiple: fixed 280px with scroll.
 */
export function EntryListPanel({ messages }: EntryListPanelProps) {
  if (messages.length === 0) return null

  const isSingle = messages.length === 1

  return (
    <div className={`${isSingle ? "" : "h-[280px]"} overflow-y-auto rounded-lg border border-border p-1.5 space-y-1`}>
      {messages.map((msg) => (
        <EntryRow key={msg.id} msg={msg} />
      ))}
    </div>
  )
}
