"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
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
  Info,
  ArrowRight,
  Paperclip,
  ExternalLink,
  Loader2,
  Download,
  Eye,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { DEFAULT_BIBLE_VERSION } from "@/lib/bible-versions"
import { useBibleVersionConfig } from "@/components/cms/church-profile/bible-version-settings"
import { toast } from "sonner"
import { generateSlug } from "@/lib/utils"
import { useMessages } from "@/lib/messages-context"
import { isTiptapContentEmpty } from "@/lib/tiptap"
import type {
  Message,
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
  tab: "details" | "video" | "study"
  elementId: string
}

export function EntryForm({ mode, message }: EntryFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { series, messages: allMessages, addSeries, addMessage, updateMessage } = useMessages()

  // Church-wide Bible version config
  const bibleVersionConfig = useBibleVersionConfig()

  // Shared metadata
  const [title, setTitle] = useState(message?.title ?? "")
  const [date, setDate] = useState(message?.date ?? new Date().toISOString().slice(0, 10))
  const [speaker, setSpeaker] = useState(message?.speaker ?? "")
  const [speakerId, setSpeakerId] = useState<string | undefined>(message?.speakerId)
  const [seriesId, setSeriesId] = useState<string | null>(message?.seriesId ?? null)
  const [passage, setPassage] = useState(message?.passage ?? "")
  const [bibleVersion, setBibleVersion] = useState(message?.bibleVersion ?? DEFAULT_BIBLE_VERSION.code)
  const [attachments, setAttachments] = useState<Attachment[]>(message?.attachments ?? [])
  const [publishedAt, setPublishedAt] = useState(message?.publishedAt ?? "")

  // Video tab state
  const [videoTitle, setVideoTitle] = useState(message?.videoTitle ?? "")
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
  const [uploading, setUploading] = useState(false)
  const [deleteAttachmentId, setDeleteAttachmentId] = useState<string | null>(null)
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null)

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

  // Track which tabs have validation issues (for red dot indicators)
  const tabsWithIssues = useMemo(() => {
    const tabs = new Set<string>()
    validationIssues.forEach(issue => tabs.add(issue.tab))
    return tabs
  }, [validationIssues])

  // Auto-unpublish if content was removed
  useEffect(() => {
    if (!videoContentExists && videoPublished) setVideoPublished(false)
    if (!studyContentExists && studyPublished) setStudyPublished(false)
  }, [videoContentExists, studyContentExists, videoPublished, studyPublished])

  // Duplicate title detection
  const duplicateTitle = useMemo(() => {
    const trimmed = title.trim().toLowerCase()
    if (trimmed.length < 2) return false
    return allMessages.some(
      (m) => m.title.trim().toLowerCase() === trimmed && m.id !== message?.id
    )
  }, [title, allMessages, message?.id])

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

  function getPublishValidationIssues(vPub: boolean, sPub: boolean): ValidationIssue[] {
    const issues: ValidationIssue[] = []

    // Always required for any publish
    if (!title.trim() || title.trim().length < 2) {
      issues.push({ field: "Title", message: "Title is required (at least 2 characters)", tab: "details", elementId: "field-title" })
    }
    if (!date) {
      issues.push({ field: "Date", message: "A message date is required", tab: "details", elementId: "field-date" })
    }
    if (!videoContentExists && !studyContentExists) {
      issues.push({ field: "Content", message: "At least a video or bible study is required", tab: "details", elementId: "field-content" })
    }

    // Video publish requires speaker + video URL
    if (vPub) {
      if (!speaker.trim() || speaker.trim().length < 2) {
        issues.push({ field: "Speaker", message: "Speaker is required to publish the video", tab: "video", elementId: "field-speaker" })
      }
      if (!videoUrl) {
        issues.push({ field: "Video URL", message: "A video URL is required to publish the video", tab: "video", elementId: "field-video-url" })
      }
    }

    // Study publish requires passage + at least one section with content
    if (sPub) {
      if (!passage.trim()) {
        issues.push({ field: "Scripture Passage", message: "A scripture passage is required to publish the bible study", tab: "details", elementId: "field-passage" })
      }
      if (!studyContentExists) {
        issues.push({ field: "Study Content", message: "At least one study section with content is required", tab: "study", elementId: "field-study-content" })
      }
    }

    return issues
  }

  function buildMessageData(overrides?: { videoPublished?: boolean; studyPublished?: boolean }): Omit<Message, "id"> {
    const vPub = overrides?.videoPublished ?? videoPublished
    const sPub = overrides?.studyPublished ?? studyPublished

    // Auto-set publishedAt when first publishing
    const isPublished = vPub || sPub
    let finalPublishedAt = publishedAt || undefined
    if (isPublished && !finalPublishedAt) {
      finalPublishedAt = new Date().toISOString()
    }

    return {
      title: title.trim(),
      videoTitle: videoTitle.trim() || undefined,
      slug: generateSlug(title.trim()),
      passage: passage.trim(),
      bibleVersion,
      speaker: speaker.trim(),
      speakerId,
      seriesId,
      date,
      publishedAt: finalPublishedAt,
      hasVideo: vPub,
      hasStudy: sPub,
      videoPublished: vPub,
      studyPublished: sPub,
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

  function saveMessage(options?: { navigate?: boolean; videoPublished?: boolean; studyPublished?: boolean }) {
    const { navigate = false, videoPublished: vPub, studyPublished: sPub } = options ?? {}
    const data = buildMessageData({ videoPublished: vPub, studyPublished: sPub })

    if (mode === "create") {
      addMessage(data)
      toast.success("Message created")
      router.push("/cms/messages")
    } else if (message) {
      updateMessage(message.id, data)
      toast.success("Changes saved")

      // Sync publish state to match what was saved
      if (vPub !== undefined) setVideoPublished(vPub)
      if (sPub !== undefined) setStudyPublished(sPub)

      // Reset dirty tracking — build snapshot matching the saved state
      setSavedSnapshot(JSON.stringify({
        ...snapshotFields(),
        ...(vPub !== undefined && { videoPublished: vPub }),
        ...(sPub !== undefined && { studyPublished: sPub }),
      }))

      if (navigate) router.push("/cms/messages")
    }
  }

  function handleSave() {
    setDialogVideoPublished(videoPublished)
    setDialogStudyPublished(studyPublished)

    // If anything is being published, validate required fields
    if (videoPublished || studyPublished) {
      const issues = getPublishValidationIssues(videoPublished, studyPublished)
      if (issues.length > 0) {
        setValidationIssues(issues)
        setValidationOpen(true)
        return
      }
    }

    setValidationIssues([])
    setSaveConfirmOpen(true)
  }

  function handleConfirmSave() {
    // Validate again with the dialog toggle values (user may have toggled publish in dialog)
    if (dialogVideoPublished || dialogStudyPublished) {
      const issues = getPublishValidationIssues(dialogVideoPublished, dialogStudyPublished)
      if (issues.length > 0) {
        setSaveConfirmOpen(false)
        setValidationIssues(issues)
        setValidationOpen(true)
        return
      }
    }

    setSaveConfirmOpen(false)
    saveMessage({ videoPublished: dialogVideoPublished, studyPublished: dialogStudyPublished })
  }

  function handleSaveAsDraft() {
    setValidationOpen(false)
    setValidationIssues([])
    saveMessage({ videoPublished: false, studyPublished: false, navigate: true })
  }

  function handleGoToField(issue: ValidationIssue) {
    setValidationOpen(false)
    handleTabChange(issue.tab)
    setTimeout(() => {
      const el = document.getElementById(issue.elementId)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.setAttribute("data-field-highlight", "")
        setTimeout(() => el.removeAttribute("data-field-highlight"), 2000)
      }
    }, 150)
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const newAttachments: Attachment[] = []
    for (const file of Array.from(files)) {
      try {
        const res = await fetch("/api/v1/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
            context: "bible-study",
          }),
        })
        if (!res.ok) throw new Error(`Failed to get upload URL: ${res.status}`)
        const { data } = await res.json()
        const { uploadUrl, key, publicUrl } = data

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        })
        if (!putRes.ok) throw new Error(`R2 upload failed: ${putRes.status}`)

        newAttachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          url: publicUrl,
          r2Key: key,
          fileSize: file.size,
        })
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err)
      }
    }
    if (newAttachments.length > 0) {
      setAttachments([...attachments, ...newAttachments])
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleRemoveAttachment(id: string) {
    setAttachments(attachments.filter((a) => a.id !== id))
  }

  // Minimal validation for the button disabled state: need a title for any save
  const canSave = title.trim().length >= 2

  // Dirty tracking — snapshot must use the exact same defaults as state initializers above
  const snapshotFields = useCallback(() => ({
    title, videoTitle, speaker, speakerId: speakerId ?? null, seriesId, passage, bibleVersion,
    date, publishedAt, videoUrl, videoDescription: videoDescription ?? "", duration, audioUrl,
    rawTranscript, liveTranscript,
    transcriptSegments: JSON.stringify(transcriptSegments),
    studySections: JSON.stringify(studySections),
    attachments: JSON.stringify(attachments),
    videoPublished, studyPublished,
  }), [
    title, videoTitle, speaker, speakerId, seriesId, passage, bibleVersion,
    date, publishedAt, videoUrl, videoDescription, duration, audioUrl,
    rawTranscript, liveTranscript, transcriptSegments, studySections, attachments,
    videoPublished, studyPublished,
  ])

  // Capture initial state on mount — lazy initializer runs once
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(snapshotFields()))

  const isDirty = JSON.stringify(snapshotFields()) !== savedSnapshot

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
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight truncate">
                {mode === "create" ? "New Message" : title || "Untitled"}
              </h1>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  variant={studyState === "published" ? "success" : studyState === "draft" ? "secondary" : "outline"}
                  className="gap-1"
                >
                  <BookOpen className="size-3" />
                  {studyState === "published" ? "Study Live" : studyState === "draft" ? "Study Draft" : "No Study"}
                </Badge>
                <Badge
                  variant={videoState === "published" ? "success" : videoState === "draft" ? "secondary" : "outline"}
                  className="gap-1"
                >
                  <Video className="size-3" />
                  {videoState === "published" ? "Video Live" : videoState === "draft" ? "Video Draft" : "No Video"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
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
                {tabsWithIssues.has("details") && <span className="size-1.5 rounded-full bg-destructive animate-pulse" />}
              </TabsTrigger>
              <TabsTrigger value="study" className="gap-1.5">
                Bible Study
                {tabsWithIssues.has("study") ? (
                  <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
                ) : (
                  <>
                    {studyState === "published" && <span className="size-1.5 rounded-full bg-green-500" />}
                    {studyState === "draft" && <span className="size-1.5 rounded-full bg-muted-foreground/50" />}
                  </>
                )}
              </TabsTrigger>
              <TabsTrigger value="video" className="gap-1.5">
                Video
                {tabsWithIssues.has("video") ? (
                  <span className="size-1.5 rounded-full bg-destructive animate-pulse" />
                ) : (
                  <>
                    {videoState === "published" && <span className="size-1.5 rounded-full bg-green-500" />}
                    {videoState === "draft" && <span className="size-1.5 rounded-full bg-muted-foreground/50" />}
                  </>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Details Tab */}
        <TabsContent value="details" className="px-6 pt-4">
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
              <div id="field-title" className="space-y-2">
                <Label htmlFor="message-title" className="text-sm text-muted-foreground">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="message-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Message title"
                  maxLength={100}
                  className="text-lg font-medium h-12"
                  autoFocus={mode === "create"}
                />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    {title.trim().length > 0 && title.trim().length < 2 && (
                      <p className="text-xs text-destructive">Title must be at least 2 characters</p>
                    )}
                    {duplicateTitle && (
                      <p className="text-xs text-warning">Another entry with this title already exists</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {title.length}/100
                  </p>
                </div>
              </div>

              {/* Message Date */}
              <div id="field-date" className="space-y-2">
                <Label className="text-sm text-muted-foreground">Message Date <span className="text-destructive">*</span></Label>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="When was this message delivered?"
                />
              </div>

              {/* Series + Scripture Passage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Series</Label>
                  <SeriesSelect
                    series={series}
                    selectedId={seriesId}
                    onChange={setSeriesId}
                    onCreateSeries={(name) => addSeries({ name })}
                  />
                </div>
                <div id="field-passage" className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Scripture Passage</Label>
                  <BiblePassageInput
                    value={passage}
                    onChange={(passageStr) => setPassage(passageStr)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {bibleVersionConfig?.defaultVersion
                      ? `${bibleVersionConfig.defaultVersion} displays first on the website.`
                      : "Default version shown on the website."}{" "}
                    <a
                      href="/cms/church-profile#bible-versions"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Adjust in church settings
                    </a>
                  </p>
                </div>
              </div>

            </div>

            {/* Content Overview */}
            <div id="field-content">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Content Overview
              </p>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>

          </div>
        </TabsContent>

        {/* Bible Study Tab */}
        <TabsContent value="study" className="px-6 pt-4">
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
              onAttachmentAdd={(att) => setAttachments(prev => [...prev, att])}
            />
          </div>
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="px-6 pt-4">
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

            {/* Video Title (alternate) */}
            <div className="space-y-2">
              <Label htmlFor="video-title" className="text-sm text-muted-foreground">
                Video Title
              </Label>
              <Input
                id="video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder={title || "Same as message title"}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Optional. If different from the message title, this will be shown on the video player.
              </p>
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
              speakerSlot={
                <div id="field-speaker" className="space-y-2 max-w-xs">
                  <Label>Speaker <span className="text-destructive">*</span></Label>
                  <SpeakerSelect
                    value={speaker}
                    onChange={(name, id) => {
                      setSpeaker(name)
                      setSpeakerId(id)
                    }}
                  />
                </div>
              }
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Attachments — visible on all tabs */}
      <div className="px-6 pt-5 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Attachments
          </p>
          {attachments.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {attachments.length}
            </Badge>
          )}
        </div>
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            These files will appear on the message page, video player, and bible study materials.
          </p>
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center py-4 text-center">
              <Paperclip className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No attachments yet.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={handleUploadAttachment} disabled={uploading}>
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                {uploading ? "Uploading…" : "Upload Files"}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
                  >
                    <FileText className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{att.size || att.type || ""}</p>
                    </div>
                    {att.url && (
                      <Button variant="ghost" size="icon-sm" onClick={() => setPreviewAttachment(att)} title="Preview">
                        <Eye className="size-3.5" />
                      </Button>
                    )}
                    {att.url && (
                      <Button variant="ghost" size="icon-sm" asChild>
                        <a href={att.url} download={att.name} title="Download">
                          <Download className="size-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteAttachmentId(att.id)}
                      title="Remove"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleUploadAttachment} disabled={uploading}>
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                {uploading ? "Uploading…" : "Upload Files"}
              </Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
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
              The following fields are required to publish this message:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="space-y-1.5 text-sm">
            {validationIssues.map((issue) => (
              <li key={issue.field} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-destructive shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="font-medium">{issue.field}</span>
                  <span className="text-muted-foreground"> — {issue.message}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 px-2 text-xs gap-1"
                  onClick={() => handleGoToField(issue)}
                >
                  Go to field
                  <ArrowRight className="size-3" />
                </Button>
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

      {/* Delete attachment confirmation */}
      <AlertDialog open={!!deleteAttachmentId} onOpenChange={(open) => !open && setDeleteAttachmentId(null)}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove attachment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium">{attachments.find(a => a.id === deleteAttachmentId)?.name}</span> from this message. The file will be deleted when you save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteAttachmentId) handleRemoveAttachment(deleteAttachmentId)
                setDeleteAttachmentId(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attachment preview modal */}
      <Dialog open={!!previewAttachment} onOpenChange={(open) => !open && setPreviewAttachment(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="truncate">{previewAttachment?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            {previewAttachment?.url && previewAttachment.name.toLowerCase().endsWith(".pdf") ? (
              <iframe
                src={previewAttachment.url}
                className="w-full h-[70vh] rounded-md border"
                title={previewAttachment.name}
              />
            ) : previewAttachment?.url && /\.(jpe?g|png|gif|webp)$/i.test(previewAttachment.name) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewAttachment.url}
                alt={previewAttachment.name}
                className="max-w-full max-h-[70vh] mx-auto rounded-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="size-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Preview not available for this file type.
                </p>
                {previewAttachment?.url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={previewAttachment.url} download={previewAttachment.name}>
                      <Download className="size-3.5" />
                      Download to view
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
