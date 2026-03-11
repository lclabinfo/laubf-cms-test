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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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

type Submission = {
  id: string
  name: string
  email: string
  phone: string | null
  formType: string
  fields: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  notes: string | null
  assignedTo: string | null
  createdAt: string
}

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

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—"
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

const fieldLabels: Record<string, { label: string; icon: typeof User }> = {
  interests: { label: "Interested In", icon: BookOpen },
  otherInterest: { label: "Other Interest", icon: BookOpen },
  campus: { label: "Campus", icon: MapPin },
  otherCampus: { label: "Other Campus", icon: MapPin },
  comments: { label: "Comments", icon: MessageSquare },
  bibleTeacher: { label: "Wants Bible Teacher", icon: BookOpen },
}

export default function FormSubmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState("")
  const [savingNotes, setSavingNotes] = useState(false)

  const fetchSubmission = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/form-submissions/${id}`)
      const json = await res.json()
      if (json.success) {
        setSubmission(json.data)
        setNotes(json.data.notes || "")
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

  const handleSaveNotes = useCallback(async () => {
    if (!submission || notes === (submission.notes || '')) return
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/v1/form-submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      const json = await res.json()
      if (json.success) {
        setSubmission(json.data)
        toast.success("Notes saved")
      }
    } catch {
      toast.error("Failed to save notes")
    } finally {
      setSavingNotes(false)
    }
  }, [id, notes, submission])

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

  return (
    <div className="pt-5 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/cms/form-submissions")}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {submission.name}
            </h1>
            <Badge variant={submission.isRead ? "secondary" : "default"}>
              {submission.isRead ? "Read" : "Unread"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {submission.formType} form submission
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleRead}
        >
          {submission.isRead ? (
            <>
              <Mail className="size-4 mr-1.5" />
              Mark as Unread
            </>
          ) : (
            <>
              <MailOpen className="size-4 mr-1.5" />
              Mark as Read
            </>
          )}
        </Button>
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
          <CardContent className="space-y-3">
            {Object.entries(fieldLabels).map(([key, { label, icon: Icon }]) => {
              if (!(key in fields)) return null
              const value = fields[key]
              // Skip empty values
              if (value === null || value === undefined || value === "") return null
              if (Array.isArray(value) && value.length === 0) return null

              return (
                <div key={key} className="flex items-start gap-3">
                  <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {label}
                    </p>
                    <p className="text-sm mt-0.5">{formatFieldValue(value)}</p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Internal Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Add internal notes about this submission..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            rows={4}
          />
          {savingNotes && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" />
              Saving...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
