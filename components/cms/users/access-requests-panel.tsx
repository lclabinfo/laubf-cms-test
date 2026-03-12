"use client"

import { useCallback, useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  CheckIcon,
  XIcon,
  Loader2Icon,
  InboxIcon,
} from "lucide-react"
import { toast } from "sonner"

interface AccessRequest {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  message: string | null
  status: "PENDING" | "APPROVED" | "DENIED"
  createdAt: string
}

interface AccessRequestsPanelProps {
  onApproved: () => void
}

export function AccessRequestsPanel({ onApproved }: AccessRequestsPanelProps) {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [denyNote, setDenyNote] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/access-requests?status=PENDING")
      const data = await res.json()
      if (data.success) {
        setRequests(data.data)
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/v1/access-requests/${id}/approve`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to approve request")
        return
      }
      toast.success("Access request approved")
      setRequests((prev) => prev.filter((r) => r.id !== id))
      onApproved()
    } catch {
      toast.error("Failed to approve request")
    } finally {
      setProcessing(null)
    }
  }

  const handleDeny = async () => {
    if (!selectedId) return
    setProcessing(selectedId)
    try {
      const res = await fetch(`/api/v1/access-requests/${selectedId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: denyNote.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to deny request")
        return
      }
      toast.success("Access request denied")
      setRequests((prev) => prev.filter((r) => r.id !== selectedId))
    } catch {
      toast.error("Failed to deny request")
    } finally {
      setProcessing(null)
      setDenyDialogOpen(false)
      setSelectedId(null)
      setDenyNote("")
    }
  }

  if (loading || requests.length === 0) return null

  return (
    <>
      <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 dark:border-amber-900">
          <InboxIcon className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-medium">
            Pending Access Requests
          </h3>
          <Badge variant="warning" className="text-xs ml-auto">
            {requests.length}
          </Badge>
        </div>
        <div className="divide-y divide-amber-200 dark:divide-amber-900">
          {requests.map((req) => {
            const name = `${req.firstName} ${req.lastName}`.trim() || req.email
            const initials = name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
            const isProcessing = processing === req.id

            return (
              <div key={req.id} className="flex items-start gap-3 px-4 py-3">
                <Avatar className="h-8 w-8 mt-0.5">
                  {req.avatarUrl && <AvatarImage src={req.avatarUrl} alt={name} />}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">{req.email}</p>
                  {req.message && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
                    onClick={() => handleApprove(req.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2Icon className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <CheckIcon className="h-3 w-3 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => {
                      setSelectedId(req.id)
                      setDenyDialogOpen(true)
                    }}
                    disabled={isProcessing}
                  >
                    <XIcon className="h-3 w-3 mr-1" />
                    Deny
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AlertDialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deny Access Request</AlertDialogTitle>
            <AlertDialogDescription>
              This will deny the access request. You can optionally include a note explaining why.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="deny-note" className="text-xs">
              Note <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="deny-note"
              value={denyNote}
              onChange={(e) => setDenyNote(e.target.value)}
              placeholder="Reason for denial..."
              className="resize-none text-sm"
              rows={2}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeny}
            >
              Deny Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
