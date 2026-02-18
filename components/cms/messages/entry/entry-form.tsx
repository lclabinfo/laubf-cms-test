"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VideoTab } from "./video-tab"
import { StudyTab } from "./study-tab"
import { MetadataSidebar } from "./metadata-sidebar"
import { useMessages } from "@/lib/messages-context"
import { statusDisplay } from "@/lib/status"
import type {
  Message,
  MessageStatus,
  TranscriptSegment,
  StudySection,
  Attachment,
} from "@/lib/messages-data"

interface EntryFormProps {
  mode: "create" | "edit"
  message?: Message
}

export function EntryForm({ mode, message }: EntryFormProps) {
  const router = useRouter()
  const { series, addMessage, updateMessage } = useMessages()

  // Shared metadata
  const [title, setTitle] = useState(message?.title ?? "")
  const [status, setStatus] = useState<MessageStatus>(message?.status ?? "draft")
  const [date, setDate] = useState(message?.date ?? new Date().toISOString().slice(0, 10))
  const [speaker, setSpeaker] = useState(message?.speaker ?? "")
  const [seriesIds, setSeriesIds] = useState<string[]>(message?.seriesIds ?? [])
  const [passage, setPassage] = useState(message?.passage ?? "")
  const [attachments, setAttachments] = useState<Attachment[]>(message?.attachments ?? [])

  // Video tab state
  const [videoUrl, setVideoUrl] = useState(message?.videoUrl ?? "")
  const [videoDescription, setVideoDescription] = useState(message?.videoDescription ?? "")
  const [rawTranscript, setRawTranscript] = useState(message?.rawTranscript ?? "")
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>(
    message?.transcriptSegments ?? []
  )

  // Study tab state
  const [studySections, setStudySections] = useState<StudySection[]>(
    message?.studySections ?? []
  )

  const isValid = title.trim().length >= 2 && speaker.trim().length >= 2 && date

  const statusConfig = statusDisplay[status]

  // Determine which tab to show by default
  const defaultTab = useMemo(() => {
    if (mode === "edit" && message) {
      // If has study but no video, start on study tab
      if (message.hasStudy && !message.hasVideo) return "study"
    }
    return "video"
  }, [mode, message])

  function handleSave() {
    if (!isValid) return

    const hasVideo = !!videoUrl
    const hasStudy = studySections.length > 0 && studySections.some((s) => s.content.trim())

    const messageData: Omit<Message, "id"> = {
      title: title.trim(),
      passage: passage.trim(),
      speaker: speaker.trim(),
      seriesIds,
      date,
      status,
      hasVideo,
      hasStudy,
      videoUrl: videoUrl || undefined,
      videoDescription: videoDescription || undefined,
      rawTranscript: rawTranscript || undefined,
      transcriptSegments: transcriptSegments.length > 0 ? transcriptSegments : undefined,
      studySections: studySections.length > 0 ? studySections : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    }

    if (mode === "create") {
      addMessage(messageData)
    } else if (message) {
      updateMessage(message.id, messageData)
    }

    router.push("/cms/messages")
  }

  function handleCancel() {
    router.push("/cms/messages")
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cms/messages">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "create" ? "New Message" : "Edit Message"}
            </h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Message title"
          className="text-lg font-medium h-12"
          aria-label="Message title"
        />
        {title.trim().length > 0 && title.trim().length < 2 && (
          <p className="text-xs text-destructive mt-1">Title must be at least 2 characters</p>
        )}
      </div>

      {/* Two-column layout: content + sidebar */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Main content area */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <Tabs defaultValue={defaultTab} key={defaultTab}>
            <TabsList variant="line">
              <TabsTrigger value="video">Video</TabsTrigger>
              <TabsTrigger value="study">Bible Study</TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="pt-4">
              <VideoTab
                videoUrl={videoUrl}
                onVideoUrlChange={setVideoUrl}
                description={videoDescription}
                onDescriptionChange={setVideoDescription}
                rawTranscript={rawTranscript}
                onRawTranscriptChange={setRawTranscript}
                segments={transcriptSegments}
                onSegmentsChange={setTranscriptSegments}
              />
            </TabsContent>

            <TabsContent value="study" className="pt-4">
              <StudyTab
                sections={studySections}
                onSectionsChange={setStudySections}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Metadata sidebar */}
        <MetadataSidebar
          status={status}
          onStatusChange={setStatus}
          date={date}
          onDateChange={setDate}
          speaker={speaker}
          onSpeakerChange={setSpeaker}
          seriesIds={seriesIds}
          onSeriesIdsChange={setSeriesIds}
          passage={passage}
          onPassageChange={setPassage}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          allSeries={series}
        />
      </div>
    </div>
  )
}
