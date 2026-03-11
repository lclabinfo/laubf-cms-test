"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Loader2,
  Mail,
  MailOpen,
  Phone,
  Clock,
  Trash2,
  User,
  MapPin,
  BookOpen,
  MessageSquare,
  Send,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityLogEntry = {
  userId: string
  userName: string
  action: string
  content?: string
  createdAt: string
}

type Submission = {
  id: string
  name: string
  email: string
  phone: string | null
  formType: string
  subject: string | null
  message: string | null
  fields: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  status: string
  notes: string | null
  activityLog: ActivityLogEntry[] | null
  assignedTo: string | null
  createdAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "success" | "outline"> = {
  new: "default",
  reviewed: "secondary",
  contacted: "success",
  archived: "outline",
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "contacted", label: "Contacted" },
  { value: "archived", label: "Archived" },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

const fieldIcons: Record<string, typeof User> = {
  interests: BookOpen,
  otherInterest: BookOpen,
  campus: MapPin,
  otherCampus: MapPin,
  comments: MessageSquare,
  bibleTeacher: BookOpen,
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FormSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState("")
  const [addingNote, setAddingNote] = useState(false)

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/form-submissions/${id}`)
      const json = await res.json()
      if (json.success) {
        setSubmission(json.data)
      } else {
        toast.error("Submission not found")
        router.push("/cms/form-submissions")
      }
    } catch {
      toast.error("Failed to load submission")
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => {
    fetchSubmission()
  }, [fetchSubmission])

  // Auto-mark as read on open
  useEffect(() => {
    if (submission && !submission.isRead) {
      fetch(`/api/v1/form-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      }).then((res) => res.json()).then((json) => {
        if (json.success) {
          setSubmission((prev) => prev ? { ...prev, isRead: true, readAt: new Date().toISOString() } : prev)
        }
      }).catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.id])

  const handleToggleRead = useCallback(async () => {
    if (!submission) return
    const newIsRead = !submission.isRead
    try {
      const res = await fetch(`/api/v1/form-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: newIsRead }),
      })
      const json = await res.json()
      if (json.success) {
        setSubmission(json.data)
        toast.success(newIsRead ? "Marked as read" : "Marked as unread")
      }
    } catch {
      toast.error("Failed to update")
    }
  }, [submission, id])

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!submission) return
    try {
      const res = await fetch(`/api/v1/form-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setSubmission(json.data)
        toast.success(`Status updated to ${capitalize(newStatus)}`)
      }
    } catch {
      toast.error("Failed to update status")
    }
  }, [submission, id])

  const handleAddNote = useCallback(async () => {
    if (!submission || !noteText.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch(`/api/v1/form-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSubmission(json.data)
        setNoteText("")
        toast.success("Note added")
      }
    } catch {
      toast.error("Failed to add note")
    } finally {
      setAddingNote(false)
    }
  }, [id, noteText, submission])

  const handleDelete = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/form-submissions/${id}`, { method: "DELETE" })
      const json = await res.json()
      if (json.success) {
        toast.success("Submission deleted")
        router.push("/cms/form-submissions")
      }
    } catch {
      toast.error("Failed to delete")
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!submission) return null

  const fields = submission.fields || {}
  const activityLog = (submission.activityLog ?? []) as ActivityLogEntry[]

  return (
    <div className="pt-5 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5"
          onClick={() => router.push("/cms/form-submissions")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {submission.name}
            </h1>
            <Badge variant={STATUS_BADGE_VARIANT[submission.status] ?? "default"}>
              {capitalize(submission.status || "new")}
            </Badge>
            {!submission.isRead && (
              <Badge variant="info" className="text-[10px]">Unread</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {submission.formType} form · {formatDate(submission.createdAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={handleToggleRead}>
          {submission.isRead ? (
            <><Mail className="size-4 mr-1.5" />Mark as Unread</>
          ) : (
            <><MailOpen className="size-4 mr-1.5" />Mark as Read</>
          )}
        </Button>
        <Select value={submission.status || "new"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE_VARIANT[opt.value]} className="text-[10px] h-4 px-1.5">
                    {opt.label}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="size-4 mr-1.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete submission?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this form submission from {submission.name}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: submission details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm">{submission.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <a href={`mailto:${submission.email}`} className="text-sm text-primary hover:underline">
                  {submission.email}
                </a>
              </div>
              {submission.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${submission.phone}`} className="text-sm text-primary hover:underline">
                    {submission.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">{formatDate(submission.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Form Fields Card */}
          {Object.keys(fields).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Form Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {Object.entries(fields).map(([key, value]) => {
                    if (value === null || value === undefined || value === "") return null
                    if (Array.isArray(value) && value.length === 0) return null
                    const Icon = fieldIcons[key] || MessageSquare

                    return (
                      <div key={key} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {formatFieldLabel(key)}
                          </p>
                          <p className="text-sm mt-0.5">{formatFieldValue(value)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: activity & notes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Activity timeline */}
              {activityLog.length > 0 ? (
                <div className="space-y-3">
                  {activityLog.map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="mt-1 shrink-0">
                        <div className={cn(
                          "size-6 rounded-full flex items-center justify-center",
                          entry.action === "note_added" ? "bg-primary/10" : "bg-muted",
                        )}>
                          {entry.action === "note_added" ? (
                            <MessageSquare className="size-3 text-primary" />
                          ) : (
                            <Circle className="size-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-medium">{entry.userName}</span>
                          <span className="text-muted-foreground">{formatRelativeDate(entry.createdAt)}</span>
                        </div>
                        {entry.content && (
                          <p className="text-sm mt-0.5 text-foreground whitespace-pre-wrap">
                            {entry.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}

              {/* Add note input */}
              <div className="flex gap-2 pt-2 border-t">
                <Textarea
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[60px] flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleAddNote()
                    }
                  }}
                />
                <Button
                  size="icon"
                  variant="outline"
                  className="shrink-0 self-end"
                  disabled={!noteText.trim() || addingNote}
                  onClick={handleAddNote}
                >
                  {addingNote ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Press Cmd+Enter to send
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
