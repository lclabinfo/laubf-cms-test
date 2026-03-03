"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
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
  Paperclip,
  ChevronDown,
  Link2,
  ExternalLink,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BIBLE_VERSIONS, DEFAULT_BIBLE_VERSION } from "@/lib/bible-versions"
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

const statusOptions: MessageStatus[] = ["draft", "published", "archived"]

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
  const [bibleVersion, setBibleVersion] = useState(message?.bibleVersion ?? DEFAULT_BIBLE_VERSION.code)
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

  // Per-content publish state
  const [videoPublished, setVideoPublished] = useState(message?.videoPublished ?? false)
  const [studyPublished, setStudyPublished] = useState(message?.studyPublished ?? false)

  // Confirmation dialog state
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [dialogVideoPublished, setDialogVideoPublished] = useState(false)
  const [dialogStudyPublished, setDialogStudyPublished] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [validationOpen, setValidationOpen] = useState(false)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])


  // Attachment file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Tab state with URL sync
  const initialTab = searchParams.get("tab") || "details"
  const [activeTab, setActiveTab] = useState(initialTab)

  // Content detection (does content exist, separate from publish state)
  const videoContentExists = !!videoUrl
  const studyContentExists = studySections.length > 0 && studySections.some((s) => !isTiptapContentEmpty(s.content))

  // For backward compat with API — hasVideo/hasStudy mean "content exists"
  const hasVideo = videoContentExists
  const hasStudy = studyContentExists

  // Derive per-content status for display
  const videoState = videoPublished ? "published" as const : videoContentExists ? "draft" as const : "empty" as const
  const studyState = studyPublished ? "published" as const : studyContentExists ? "draft" as const : "empty" as const

  // Auto-unpublish if content was removed
  useEffect(() => {
    if (!videoContentExists && videoPublished) setVideoPublished(false)
    if (!studyContentExists && studyPublished) setStudyPublished(false)
  }, [videoContentExists, studyContentExists, videoPublished, studyPublished])

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
    if (!videoContentExists && !studyContentExists) {
      issues.push({ field: "Content", message: "At least a video or bible study is required" })
    }
    if (status === "scheduled" && !publishedAt) {
      issues.push({ field: "Scheduled Post Date", message: "A post date and time is required for scheduling" })
    }

    return issues
  }

  function buildMessageData(): Omit<Message, "id"> {
    // Derive wrapper status from per-content publish state
    const derivedStatus: MessageStatus = (videoPublished || studyPublished) ? "published" : "draft"

    // Auto-set publishedAt when first publishing
    let finalPublishedAt = publishedAt || undefined
    if (derivedStatus === "published" && !finalPublishedAt) {
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
      status: derivedStatus,
      hasVideo,
      hasStudy,
      videoPublished,
      studyPublished,
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

  function saveMessage(navigate = false) {
    const data = buildMessageData()

    if (mode === "create") {
      addMessage(data)
      router.push("/cms/messages")
    } else if (message) {
      updateMessage(message.id, data)
      if (navigate) router.push("/cms/messages")
    }
  }

  function handleSave() {
    setDialogVideoPublished(videoPublished)
    setDialogStudyPublished(studyPublished)
    setSaveConfirmOpen(true)
  }

  function handleConfirmSave() {
    setSaveConfirmOpen(false)
    // Apply the dialog toggle values to actual state before saving
    setVideoPublished(dialogVideoPublished)
    setStudyPublished(dialogStudyPublished)
    // Use setTimeout to let state settle before building data
    setTimeout(() => saveMessage(), 0)
  }

  function handleSaveAsDraft() {
    setVideoPublished(false)
    setStudyPublished(false)
    setValidationOpen(false)
    // Need to save with next tick after state updates
    setTimeout(() => saveMessage(true), 0)
  }

  function handleUnarchive() {
    setStatus("draft")
    setVideoPublished(false)
    setStudyPublished(false)
    saveMessage()
  }

  function handleCancel() {
    if (isDirty) {
      setCancelConfirmOpen(true)
    } else {
      router.push("/cms/messages")
    }
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

  // Dirty tracking — snapshot must use the exact same defaults as state initializers above
  const snapshotFields = useCallback(() => ({
    title, description, speaker, speakerId: speakerId ?? null, seriesId, passage, bibleVersion,
    date, publishedAt, videoUrl, videoDescription: videoDescription ?? "", duration, audioUrl,
    rawTranscript, liveTranscript,
    transcriptSegments: JSON.stringify(transcriptSegments),
    studySections: JSON.stringify(studySections),
    attachments: JSON.stringify(attachments),
    videoPublished, studyPublished,
  }), [
    title, description, speaker, speakerId, seriesId, passage, bibleVersion,
    date, publishedAt, videoUrl, videoDescription, duration, audioUrl,
    rawTranscript, liveTranscript, transcriptSegments, studySections, attachments,
    videoPublished, studyPublished,
  ])

  // Capture initial state on mount (runs once)
  const initialSnapshot = useRef<string | null>(null)
  if (initialSnapshot.current === null) {
    initialSnapshot.current = JSON.stringify(snapshotFields())
  }

  const isDirty = JSON.stringify(snapshotFields()) !== initialSnapshot.current

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  return (
    <div className="flex flex-col -mx-6">
      {/* Tabs — wraps both the sticky header and tab content */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        {/* Sticky top bar: header row + tab row — negative margin pulls it full-bleed */}
        <div className="sticky top-0 z-20 bg-background">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-5 pb-3">
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <ArrowLeft />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              {mode === "create" ? (
                <h1 className="text-xl font-semibold tracking-tight truncate">New Message</h1>
              ) : (
                <div className="grid w-fit flex-none items-center max-w-[min(60ch,50vw)]">
                  <span
                    className="invisible whitespace-pre text-xl font-semibold tracking-tight col-start-1 row-start-1"
                    aria-hidden="true"
                  >
                    {title || "Untitled"}
                  </span>
                  <input
                    type="text"
                    size={1}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur()
                    }}
                    placeholder="Untitled"
                    className="text-xl font-semibold tracking-tight bg-transparent border-0 border-b border-transparent hover:border-muted-foreground/25 focus:border-ring focus:outline-none focus:ring-0 rounded-none px-0 py-0 transition-colors col-start-1 row-start-1 w-full min-w-0"
                    aria-label="Message title"
                  />
                </div>
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  variant={videoState === "published" ? "success" : videoState === "draft" ? "secondary" : "outline"}
                  className="gap-1"
                >
                  <Video className="size-3" />
                  {videoState === "published" ? "Video Live" : videoState === "draft" ? "Video Draft" : "No Video"}
                </Badge>
                <Badge
                  variant={studyState === "published" ? "success" : studyState === "draft" ? "secondary" : "outline"}
                  className="gap-1"
                >
                  <BookOpen className="size-3" />
                  {studyState === "published" ? "Study Live" : studyState === "draft" ? "Study Draft" : "No Study"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              {status === "archived" && (
                <Button variant="outline" onClick={handleUnarchive}>
                  Unarchive
                </Button>
              )}
              <Button onClick={handleSave} disabled={!canSave || !isDirty}>
                Save Changes
              </Button>
            </div>
          </div>

          {/* Tab row with bottom border */}
          <div className="border-b border-border px-6">
            <TabsList variant="line">
              <TabsTrigger value="details" className="gap-1.5">
                <Settings className="size-3.5" />
                Details
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-1.5">
                Video
                {videoState === "published" && <span className="size-1.5 rounded-full bg-green-500" />}
                {videoState === "draft" && <span className="size-1.5 rounded-full bg-muted-foreground/50" />}
              </TabsTrigger>
              <TabsTrigger value="study" className="gap-1.5">
                Bible Study
                {studyState === "published" && <span className="size-1.5 rounded-full bg-green-500" />}
                {studyState === "draft" && <span className="size-1.5 rounded-full bg-muted-foreground/50" />}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="px-6 pt-4 pb-5">
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
                      {BIBLE_VERSIONS.map((v) => (
                        <SelectItem key={v.code} value={v.code}>
                          {v.abbreviation} - {v.name}
                        </SelectItem>
                      ))}
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
                    <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20 shrink-0">
                      <Video className="size-4 text-blue-600 dark:text-blue-400" />
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
                    <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 dark:bg-purple-500/20 shrink-0">
                      <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />
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
        <TabsContent value="video" className="px-6 pt-4 pb-5">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Inline publish toggle */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={videoState === "published" ? "success" : videoState === "draft" ? "secondary" : "outline"}
                >
                  {videoState === "published" ? "Published" : videoState === "draft" ? "Draft" : "Empty"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {videoState === "published"
                    ? "Video is live on the public site"
                    : videoState === "draft"
                    ? "Video saved but not yet published"
                    : "Add a video URL to enable publishing"}
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch
                        checked={videoPublished}
                        onCheckedChange={setVideoPublished}
                        disabled={!videoContentExists}
                      />
                    </div>
                  </TooltipTrigger>
                  {!videoContentExists && (
                    <TooltipContent>
                      <p>Add a video URL below to publish</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
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
          </div>
        </TabsContent>

        {/* Bible Study Tab */}
        <TabsContent value="study" className="px-6 pt-4 pb-5">
          <div className="max-w-3xl mx-auto space-y-5">
            {/* Inline publish toggle */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant={studyState === "published" ? "success" : studyState === "draft" ? "secondary" : "outline"}
                >
                  {studyState === "published" ? "Published" : studyState === "draft" ? "Draft" : "Empty"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {studyState === "published"
                    ? "Bible study is live on the public site"
                    : studyState === "draft"
                    ? "Study saved but not yet published"
                    : "Add study content to enable publishing"}
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch
                        checked={studyPublished}
                        onCheckedChange={setStudyPublished}
                        disabled={!studyContentExists}
                      />
                    </div>
                  </TooltipTrigger>
                  {!studyContentExists && (
                    <TooltipContent>
                      <p>Add questions & answers below to publish</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
            <StudyTab
              sections={studySections}
              onSectionsChange={setStudySections}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Shared Attachments Panel */}
      <div className="max-w-3xl mx-auto w-full mt-4 px-6 pb-5">
        <Collapsible defaultOpen={attachments.length > 0}>
          <div className="rounded-xl border border-dashed">
            <CollapsibleTrigger className="flex items-center w-full px-4 py-3 gap-3 hover:bg-muted/50 rounded-t-xl transition-colors group">
              <Paperclip className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Attachments</span>
              {attachments.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {attachments.length}
                </Badge>
              )}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="size-3" />
                  Shared across all tabs
                </span>
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  These files will appear on the message page, video player, and bible study materials.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleUploadAttachment}>
                    <Upload className="size-3.5" />
                    Upload Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2"
                      >
                        <FileText className="size-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{att.name}</p>
                          <p className="text-xs text-muted-foreground">{att.size || (att.url ? "External file" : "")}</p>
                        </div>
                        {att.url && (
                          <Button variant="ghost" size="icon-sm" asChild>
                            <a href={att.url} target="_blank" rel="noopener noreferrer" title="Open file">
                              <ExternalLink className="size-3.5" />
                            </a>
                          </Button>
                        )}
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Save confirmation dialog — shows what will be published */}
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Review what will be visible on the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2.5">
                <Video className="size-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium">Video</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge variant={dialogVideoPublished ? "success" : videoContentExists ? "secondary" : "outline"}>
                  {dialogVideoPublished ? "Published" : videoContentExists ? "Draft" : "Empty"}
                </Badge>
                <Switch
                  checked={dialogVideoPublished}
                  onCheckedChange={setDialogVideoPublished}
                  disabled={!videoContentExists}
                  aria-label="Toggle video publish status"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium">Bible Study</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Badge variant={dialogStudyPublished ? "success" : studyContentExists ? "secondary" : "outline"}>
                  {dialogStudyPublished ? "Published" : studyContentExists ? "Draft" : "Empty"}
                </Badge>
                <Switch
                  checked={dialogStudyPublished}
                  onCheckedChange={setDialogStudyPublished}
                  disabled={!studyContentExists}
                  aria-label="Toggle bible study publish status"
                />
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved changes confirmation */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <AlertCircle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => router.push("/cms/messages")}
            >
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
