"use client"

import { useCallback, useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ShieldAlertIcon,
  LogOut,
  SendIcon,
  Loader2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react"
import { toast } from "sonner"

type RequestStatus = "PENDING" | "APPROVED" | "DENIED" | "IGNORED" | "REVOKED" | null

export default function NoAccessPage() {
  const [status, setStatus] = useState<RequestStatus>(null)
  const [reviewNote, setReviewNote] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkExisting = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/access-requests/mine")
      const data = await res.json()
      if (data.success && data.data) {
        setStatus(data.data.status)
        setReviewNote(data.data.reviewNote)
      }
    } catch {
      // Ignore — user just hasn't requested yet
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkExisting()
  }, [checkExisting])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/v1/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to submit request")
        return
      }
      setStatus("PENDING")
      toast.success("Access request submitted")
    } catch {
      toast.error("Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <ShieldAlertIcon className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>No Church Access</CardTitle>
          <CardDescription>
            {status === null
              ? "Your account is not yet associated with any church. You can request access below, or contact your church administrator."
              : status === "PENDING"
                ? "Your access request has been submitted and is awaiting review by an administrator."
                : status === "DENIED"
                  ? "Your access request was denied. You can submit a new request if you'd like to try again."
                  : status === "REVOKED"
                    ? "Your access to the CMS has been revoked by an administrator. You can request access again below."
                    : status === "IGNORED"
                      ? "Your access request is still under review. Please check back later."
                      : "Your access request was approved. Try refreshing the page or signing out and back in."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status display for existing requests */}
          {status === "PENDING" && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <ClockIcon className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Request Pending</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                  An administrator will review your request.
                </p>
              </div>
            </div>
          )}

          {status === "DENIED" && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <XCircleIcon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-200">Request Denied</p>
                {reviewNote && (
                  <p className="text-red-700 dark:text-red-300 text-xs mt-0.5">
                    &ldquo;{reviewNote}&rdquo;
                  </p>
                )}
              </div>
            </div>
          )}

          {status === "APPROVED" && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/30">
              <CheckCircle2Icon className="h-4 w-4 text-green-600 shrink-0" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Approved! Sign out and back in to access the CMS.
              </p>
            </div>
          )}

          {status === "REVOKED" && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <ShieldAlertIcon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-200">Access Revoked</p>
                <p className="text-red-700 dark:text-red-300 text-xs mt-0.5">
                  An administrator has revoked your access to the CMS.
                </p>
              </div>
            </div>
          )}

          {status === "IGNORED" && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
              <ClockIcon className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">Under Review</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs mt-0.5">
                  Your request is still being reviewed by an administrator.
                </p>
              </div>
            </div>
          )}

          {/* Request form — show when no request, denied, or revoked */}
          {(status === null || status === "DENIED" || status === "REVOKED") && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs">
                  Message to administrator <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Briefly explain why you need access..."
                  className="resize-none text-sm"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="mr-2 h-4 w-4" />
                )}
                {status === "DENIED" || status === "REVOKED" ? "Request Again" : "Request Access"}
              </Button>
            </div>
          )}

          <div className="pt-1 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut({ callbackUrl: "/cms/login" })}
            >
              <LogOut className="size-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
