"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, AlertCircle, Video, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { VideoTab } from "./video-tab"
import { StudyTab } from "./study-tab"
import { MetadataSidebar } from "./metadata-sidebar"
import { useMessages } from "@/lib/messages-context"
import { statusDisplay } from "@/lib/status"
import { isTiptapContentEmpty } from "@/lib/tiptap"
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

interface ValidationIssue {
  field: string
  message: string
}

export function EntryForm({ mode, message }: EntryFormProps) {
  const router = useRouter()
  const { series, addMessage, updateMessage } = useMessages()

  // Shared metadata
  const [title, setTitle] = useState(message?.title ?? "")
  const [status, setStatus] = useState<MessageStatus>(message?.status ?? "draft")
  const [date, setDate] = useState(message?.date ?? new Date().toISOString().slice(0, 10))
  const [speaker, setSpeaker] = useState(message?.speaker ?? "")
  const [speakerId, setSpeakerId] = useState<string | undefined>(message?.speakerId)
  const [seriesId, setSeriesId] = useState<string | null>(message?.seriesId ?? null)
  const [passage, setPassage] = useState(message?.passage ?? "")
  const [attachments, setAttachments] = useState<Attachment[]>(message?.attachments ?? [])
  const [publishedAt, setPublishedAt] = useState(message?.publishedAt ?? "")

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

  // Validation dialog state
  const [validationOpen, setValidationOpen] = useState(false)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])

  const statusConfig = statusDisplay[status]

  // Content detection
  const hasVideo = !!videoUrl
  const hasStudy = studySections.length > 0 && studySections.some((s) => !isTiptapContentEmpty(s.content))
  const hasContent = hasVideo || hasStudy

  // Determine which tab to show by default
  const defaultTab = useMemo(() => {
    if (mode === "edit" && message) {
      if (message.hasStudy && !message.hasVideo) return "study"
    }
    return "video"
  }, [mode, message])

  function getPublishValidationIssues(): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    if (!title.trim() || title.trim().length < 2) {
      issues.push({ field: "Title", message: "Title is required (at least 2 characters)" })
    }
    if (!speaker.trim() || speaker.trim().length < 2) {
      issues.push({ field: "Speaker", message: "Speaker name is required" })
    }
    if (!date) {
      issues.push({ field: "Date", message: "A date is required" })
    }
    if (!hasContent) {
      issues.push({ field: "Content", message: "At least a video or bible study is required" })
    }
    if (status === "scheduled" && !publishedAt) {
      issues.push({ field: "Scheduled Post Date", message: "A post date and time is required for scheduling" })
    }

    return issues
  }

  function buildMessageData(): Omit<Message, "id"> {
    // Auto-set publishedAt for publishing if not already set
    let finalPublishedAt = publishedAt || undefined
    if (status === "published" && !finalPublishedAt) {
      finalPublishedAt = new Date().toISOString()
    }

    return {
      title: title.trim(),
      slug: title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
      passage: passage.trim(),
      speaker: speaker.trim(),
      speakerId,
      seriesId,
      date,
      publishedAt: finalPublishedAt,
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
  }

  function saveMessage(overrideStatus?: MessageStatus) {
    const data = buildMessageData()
    if (overrideStatus) data.status = overrideStatus

    if (mode === "create") {
      addMessage(data)
    } else if (message) {
      updateMessage(message.id, data)
    }

    router.push("/cms/messages")
  }

  function handleSave() {
    // Draft/archived: minimal validation — just need a title
    if (status === "draft" || status === "archived") {
      if (!title.trim()) return
      saveMessage()
      return
    }

    // Published/scheduled: full validation
    const issues = getPublishValidationIssues()
    if (issues.length > 0) {
      setValidationIssues(issues)
      setValidationOpen(true)
      return
    }

    saveMessage()
  }

  function handleSaveAsDraft() {
    setStatus("draft")
    setValidationOpen(false)
    saveMessage("draft")
  }

  function handleCancel() {
    router.push("/cms/messages")
  }

  // Minimal validation for the button disabled state: need a title for any save
  const canSave = title.trim().length >= 2

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
          <Button onClick={handleSave} disabled={!canSave}>
            {status === "published" || status === "scheduled"
              ? status === "published" ? "Publish" : "Schedule"
              : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Message title *"
          className="text-lg font-medium h-12"
          aria-label="Message title"
        />
        {title.trim().length > 0 && title.trim().length < 2 && (
          <p className="text-xs text-destructive mt-1">Title must be at least 2 characters</p>
        )}
      </div>

      {/* Content publishing summary */}
      {hasContent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Will be published with:</span>
          {hasVideo && (
            <Badge variant="secondary" className="gap-1">
              <Video className="size-3" />
              Video
            </Badge>
          )}
          {hasStudy && (
            <Badge variant="secondary" className="gap-1">
              <BookOpen className="size-3" />
              Bible Study
            </Badge>
          )}
        </div>
      )}

      {/* Two-column layout: content + sidebar */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Main content area */}
        <div className="flex-1 min-w-0 overflow-y-auto p-0.5 -m-0.5">
          <Tabs defaultValue={defaultTab} key={defaultTab}>
            <TabsList variant="line">
              <TabsTrigger value="video" className="gap-1.5">
                Video
                {hasVideo && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger value="study" className="gap-1.5">
                Bible Study
                {hasStudy && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
              </TabsTrigger>
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
          speakerId={speakerId}
          onSpeakerChange={(name, id) => {
            setSpeaker(name)
            setSpeakerId(id)
          }}
          seriesId={seriesId}
          onSeriesIdChange={setSeriesId}
          passage={passage}
          onPassageChange={setPassage}
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          allSeries={series}
          publishedAt={publishedAt}
          onPublishedAtChange={setPublishedAt}
        />
      </div>

      {/* Validation dialog */}
      <AlertDialog open={validationOpen} onOpenChange={setValidationOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertCircle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Required fields missing
            </AlertDialogTitle>
            <AlertDialogDescription>
              The following fields are required to {status === "scheduled" ? "schedule" : "publish"} this message:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="space-y-1.5 text-sm">
            {validationIssues.map((issue) => (
              <li key={issue.field} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-full bg-destructive shrink-0" />
                <span>
                  <span className="font-medium">{issue.field}</span>
                  <span className="text-muted-foreground"> — {issue.message}</span>
                </span>
              </li>
            ))}
          </ul>

          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSaveAsDraft} variant="outline">
              Save as Draft
            </AlertDialogAction>
            <AlertDialogCancel variant="default">
              Keep Editing
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
