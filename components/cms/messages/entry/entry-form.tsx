"use client"

import { useState, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  AlertCircle,
  Video,
  BookOpen,
  Settings,
  Upload,
  X,
  FileText,
  Clock,
  Info,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
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
import { SpeakerSelect } from "./speaker-select"
import { SeriesSelect } from "./series-select"
import { BiblePassageInput } from "./bible-passage-input"
import { PublishDialog } from "./publish-dialog"
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

const statusOptions: MessageStatus[] = ["draft", "published", "scheduled", "archived"]

export function EntryForm({ mode, message }: EntryFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { series, addMessage, updateMessage } = useMessages()

  // Shared metadata
  const [title, setTitle] = useState(message?.title ?? "")
  const [status, setStatus] = useState<MessageStatus>(message?.status ?? "draft")
  const [date, setDate] = useState(message?.date ?? new Date().toISOString().slice(0, 10))
  const [speaker, setSpeaker] = useState(message?.speaker ?? "")
  const [speakerId, setSpeakerId] = useState<string | undefined>(message?.speakerId)
  const [seriesId, setSeriesId] = useState<string | null>(message?.seriesId ?? null)
  const [passage, setPassage] = useState(message?.passage ?? "")
  const [bibleVersion, setBibleVersion] = useState(message?.bibleVersion ?? "ESV")
  const [attachments, setAttachments] = useState<Attachment[]>(message?.attachments ?? [])
  const [publishedAt, setPublishedAt] = useState(message?.publishedAt ?? "")

  // Description
  const [description, setDescription] = useState(message?.description ?? "")

  // Video tab state
  const [videoUrl, setVideoUrl] = useState(message?.videoUrl ?? "")
  const [videoDescription, setVideoDescription] = useState(message?.videoDescription ?? "")
  const [duration, setDuration] = useState(message?.duration ?? "")
  const [audioUrl, setAudioUrl] = useState(message?.audioUrl ?? "")
  const [rawTranscript, setRawTranscript] = useState(message?.rawTranscript ?? "")
  const [liveTranscript, setLiveTranscript] = useState(message?.liveTranscript ?? "")
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

  // Publish dialog state
  const [publishOpen, setPublishOpen] = useState(false)

  // Attachment file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tab state with URL sync
  const initialTab = searchParams.get("tab") || "details"
  const [activeTab, setActiveTab] = useState(initialTab)

  const statusConfig = statusDisplay[status]

  // Content detection
  const hasVideo = !!videoUrl
  const hasStudy = studySections.length > 0 && studySections.some((s) => !isTiptapContentEmpty(s.content))
  const hasContent = hasVideo || hasStudy

  // Parse publishedAt into date and time parts
  const publishDate = publishedAt ? publishedAt.split("T")[0] : ""
  const publishTime = publishedAt && publishedAt.includes("T")
    ? publishedAt.split("T")[1].slice(0, 5)
    : "09:00"

  function handlePublishDateChange(newDate: string) {
    setPublishedAt(`${newDate}T${publishTime}:00`)
  }

  function handlePublishTimeChange(newTime: string) {
    const d = publishDate || new Date().toISOString().slice(0, 10)
    setPublishedAt(`${d}T${newTime}:00`)
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "details") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false })
  }

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
      bibleVersion,
      description: description.trim() || undefined,
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
      duration: duration || undefined,
      audioUrl: audioUrl || undefined,
      rawTranscript: rawTranscript || undefined,
      liveTranscript: liveTranscript || undefined,
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

  function handlePublishClick() {
    const issues = getPublishValidationIssues()
    if (issues.length > 0) {
      setValidationIssues(issues)
      setValidationOpen(true)
      return
    }
    setPublishOpen(true)
  }

  function handleSaveAsDraft() {
    setStatus("draft")
    setValidationOpen(false)
    saveMessage("draft")
  }

  function handleCancel() {
    router.push("/cms/messages")
  }

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
    setAttachments([...attachments, ...newAttachments])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleRemoveAttachment(id: string) {
    setAttachments(attachments.filter((a) => a.id !== id))
  }

  // Minimal validation for the button disabled state: need a title for any save
  const canSave = title.trim().length >= 2

  return (
    <div className="flex flex-col gap-0 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cms/messages">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {mode === "create" ? "New Message" : (title || "Untitled")}
            </h1>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveAsDraft}>
            Save Draft
          </Button>
          <Button
            onClick={handlePublishClick}
            disabled={!canSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Publish...
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 min-h-0 flex flex-col">
        <TabsList variant="line">
          <TabsTrigger value="details" className="gap-1.5">
            <Settings className="size-3.5" />
            Details
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-1.5">
            Video
            {hasVideo && <span className="size-1.5 rounded-full bg-primary" />}
          </TabsTrigger>
          <TabsTrigger value="study" className="gap-1.5">
            Bible Study
            {hasStudy && <span className="size-1.5 rounded-full bg-primary" />}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="flex-1 overflow-y-auto pt-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Info banner for create mode */}
            {mode === "create" && (
              <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                <Info className="size-4 mt-0.5 shrink-0" />
                <p>
                  Creating a new message. Fill in the details below, then switch to the Video or Bible Study tab to add content.
                </p>
              </div>
            )}

            {/* Main fields card */}
            <div className="rounded-xl border p-6 space-y-5">
              {/* Title */}
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Message title *"
                  className="text-lg font-medium h-12"
                  aria-label="Message title"
                  autoFocus={mode === "create"}
                />
                {title.trim().length > 0 && title.trim().length < 2 && (
                  <p className="text-xs text-destructive mt-1">Title must be at least 2 characters</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="message-description" className="text-sm text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="message-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief summary of this message (shown on the detail page and in search results)..."
                  className="min-h-[72px] resize-none"
                />
              </div>

              {/* Speaker + Message Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Speaker <span className="text-destructive">*</span></Label>
                  <SpeakerSelect
                    value={speaker}
                    onChange={(name, id) => {
                      setSpeaker(name)
                      setSpeakerId(id)
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message Date <span className="text-destructive">*</span></Label>
                  <DatePicker
                    value={date}
                    onChange={setDate}
                    placeholder="When was this message delivered?"
                  />
                </div>
              </div>

              {/* Status + Bible Version */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as MessageStatus)}>
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
                <div className="space-y-2">
                  <Label htmlFor="bible-version">Bible Version</Label>
                  <Select value={bibleVersion} onValueChange={setBibleVersion}>
                    <SelectTrigger id="bible-version">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESV">ESV</SelectItem>
                      <SelectItem value="NIV">NIV</SelectItem>
                      <SelectItem value="KJV">KJV</SelectItem>
                      <SelectItem value="NASB">NASB</SelectItem>
                      <SelectItem value="WEB">WEB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Scheduled Post Date + Time (conditional) */}
              {status === "scheduled" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Scheduled Post Date
                      <span className="text-destructive"> *</span>
                    </Label>
                    <DatePicker
                      value={publishDate}
                      onChange={handlePublishDateChange}
                      placeholder="When should this be posted?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scheduled Post Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <Input
                        type="time"
                        value={publishTime}
                        onChange={(e) => handlePublishTimeChange(e.target.value)}
                        className="w-32 h-9"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Series + Scripture Passage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Series</Label>
                  <SeriesSelect
                    series={series}
                    selectedId={seriesId}
                    onChange={setSeriesId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Scripture Passage</Label>
                  <BiblePassageInput
                    value={passage}
                    onChange={(passageStr) => setPassage(passageStr)}
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Attachments</Label>
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
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
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

            {/* Content Overview */}
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Content Overview
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Video card */}
                <button
                  type="button"
                  onClick={() => handleTabChange("video")}
                  className="rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                      <Video className="size-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Video</span>
                        <Badge variant={hasVideo ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {hasVideo ? "Added" : "Empty"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        Go to Video tab
                        <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Bible Study card */}
                <button
                  type="button"
                  onClick={() => handleTabChange("study")}
                  className="rounded-xl border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 shrink-0">
                      <BookOpen className="size-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Bible Study</span>
                        <Badge variant={hasStudy ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {hasStudy ? "Added" : "Empty"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        Go to Bible Study tab
                        <ArrowRight className="size-3" />
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="flex-1 overflow-y-auto pt-4">
          <div className="max-w-3xl mx-auto">
            <VideoTab
              videoUrl={videoUrl}
              onVideoUrlChange={setVideoUrl}
              description={videoDescription}
              onDescriptionChange={setVideoDescription}
              duration={duration}
              onDurationChange={setDuration}
              audioUrl={audioUrl}
              onAudioUrlChange={setAudioUrl}
              rawTranscript={rawTranscript}
              onRawTranscriptChange={setRawTranscript}
              liveTranscript={liveTranscript}
              onLiveTranscriptChange={setLiveTranscript}
              segments={transcriptSegments}
              onSegmentsChange={setTranscriptSegments}
            />
          </div>
        </TabsContent>

        {/* Bible Study Tab */}
        <TabsContent value="study" className="flex-1 overflow-y-auto pt-4">
          <div className="max-w-3xl mx-auto">
            <StudyTab
              sections={studySections}
              onSectionsChange={setStudySections}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Publish Dialog */}
      <PublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title={title}
        hasVideo={hasVideo}
        hasStudy={hasStudy}
        videoSummary={videoUrl ? `YouTube · ${duration || "\u2014"}` : "No video content"}
        studySummary={studySections.length > 0 ? `${studySections.length} section${studySections.length !== 1 ? "s" : ""}` : "No study material"}
        onPublish={() => {
          saveMessage("published")
        }}
      />

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

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
