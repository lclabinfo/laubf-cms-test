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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  CheckIcon,
  XIcon,
  Loader2Icon,
  InboxIcon,
  ArchiveIcon,
  RotateCcwIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AccessRequest {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  message: string | null
  status: "PENDING" | "APPROVED" | "DENIED" | "IGNORED"
  createdAt: string
}

interface AccessRequestsPanelProps {
  onApproved: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRequestName(req: AccessRequest) {
  return `${req.firstName} ${req.lastName}`.trim() || req.email
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ── Request Row ──────────────────────────────────────────────────────────────

function PendingRequestRow({
  req,
  processing,
  onApprove,
  onDeny,
  onIgnore,
}: {
  req: AccessRequest
  processing: string | null
  onApprove: (id: string) => void
  onDeny: (id: string) => void
  onIgnore: (id: string) => void
}) {
  const name = getRequestName(req)
  const initials = getInitials(name)
  const isProcessing = processing === req.id

  return (
    <div className="flex items-start gap-3 px-4 py-3">
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
          onClick={() => onApprove(req.id)}
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
          onClick={() => onDeny(req.id)}
          disabled={isProcessing}
        >
          <XIcon className="h-3 w-3 mr-1" />
          Deny
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onIgnore(req.id)}
          disabled={isProcessing}
        >
          <ArchiveIcon className="h-3 w-3 mr-1" />
          Ignore
        </Button>
      </div>
    </div>
  )
}

function IgnoredRequestRow({
  req,
  processing,
  onRestore,
  onApprove,
  onDeny,
}: {
  req: AccessRequest
  processing: string | null
  onRestore: (id: string) => void
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}) {
  const name = getRequestName(req)
  const initials = getInitials(name)
  const isProcessing = processing === req.id

  return (
    <div className="flex items-start gap-3 px-4 py-3 opacity-70">
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
          className="h-7 px-2 text-xs"
          onClick={() => onRestore(req.id)}
          disabled={isProcessing}
        >
          <RotateCcwIcon className="h-3 w-3 mr-1" />
          Restore
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/30"
          onClick={() => onApprove(req.id)}
          disabled={isProcessing}
        >
          <CheckIcon className="h-3 w-3 mr-1" />
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          onClick={() => onDeny(req.id)}
          disabled={isProcessing}
        >
          <XIcon className="h-3 w-3 mr-1" />
          Deny
        </Button>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AccessRequestsPanel({ onApproved }: AccessRequestsPanelProps) {
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([])
  const [ignoredRequests, setIgnoredRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [viewAllOpen, setViewAllOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [denyNote, setDenyNote] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    try {
      const [pendingRes, ignoredRes] = await Promise.all([
        fetch("/api/v1/access-requests?status=PENDING"),
        fetch("/api/v1/access-requests?status=IGNORED"),
      ])
      const [pendingData, ignoredData] = await Promise.all([
        pendingRes.json(),
        ignoredRes.json(),
      ])
      if (pendingData.success) setPendingRequests(pendingData.data)
      if (ignoredData.success) setIgnoredRequests(ignoredData.data)
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
      setPendingRequests((prev) => prev.filter((r) => r.id !== id))
      setIgnoredRequests((prev) => prev.filter((r) => r.id !== id))
      onApproved()
    } catch {
      toast.error("Failed to approve request")
    } finally {
      setProcessing(null)
    }
  }

  const handleIgnore = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/v1/access-requests/${id}/ignore`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to ignore request")
        return
      }
      toast.success("Request ignored")
      const req = pendingRequests.find((r) => r.id === id)
      setPendingRequests((prev) => prev.filter((r) => r.id !== id))
      if (req) setIgnoredRequests((prev) => [{ ...req, status: "IGNORED" }, ...prev])
    } catch {
      toast.error("Failed to ignore request")
    } finally {
      setProcessing(null)
    }
  }

  const handleRestore = async (id: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/v1/access-requests/${id}/restore`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error?.message || "Failed to restore request")
        return
      }
      toast.success("Request restored to pending")
      const req = ignoredRequests.find((r) => r.id === id)
      setIgnoredRequests((prev) => prev.filter((r) => r.id !== id))
      if (req) setPendingRequests((prev) => [{ ...req, status: "PENDING" }, ...prev])
    } catch {
      toast.error("Failed to restore request")
    } finally {
      setProcessing(null)
    }
  }

  const openDenyDialog = (id: string) => {
    setSelectedId(id)
    setDenyDialogOpen(true)
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
      setPendingRequests((prev) => prev.filter((r) => r.id !== selectedId))
      setIgnoredRequests((prev) => prev.filter((r) => r.id !== selectedId))
    } catch {
      toast.error("Failed to deny request")
    } finally {
      setProcessing(null)
      setDenyDialogOpen(false)
      setSelectedId(null)
      setDenyNote("")
    }
  }

  if (loading) return null

  const totalCount = pendingRequests.length
  const ignoredCount = ignoredRequests.length

  // Show up to 2 preview names for the stacked card
  const previewRequests = pendingRequests.slice(0, 2)
  const remainingCount = pendingRequests.length - previewRequests.length

  // Natural language summary: "David, Anna, and 15 others are waiting for approval"
  const namePlateSummary = (() => {
    if (pendingRequests.length === 0) return ""
    const firstNames = previewRequests.map((r) => r.firstName || r.email.split("@")[0])
    if (pendingRequests.length === 1) return `${firstNames[0]} is waiting for approval`
    if (pendingRequests.length === 2) return `${firstNames[0]} and ${firstNames[1]} are waiting for approval`
    return `${firstNames[0]}, ${firstNames[1]}, and ${remainingCount} ${remainingCount === 1 ? "other" : "others"} are waiting for approval`
  })()

  return (
    <>
      {/* Stacked card preview — always visible */}
      <div className="relative">
        {/* Background stacked layers for depth effect (only when active pending) */}
        {totalCount > 1 && (
          <>
            <div className="absolute inset-x-1 top-1.5 h-full rounded-lg border bg-amber-50/30 dark:bg-amber-950/5 border-amber-200/60 dark:border-amber-900/60" />
            {totalCount > 2 && (
              <div className="absolute inset-x-2 top-3 h-full rounded-lg border bg-amber-50/20 dark:bg-amber-950/3 border-amber-200/40 dark:border-amber-900/40" />
            )}
          </>
        )}

        {/* Main card — amber when pending requests, default/muted when empty */}
        <div className={cn(
          "relative rounded-lg border",
          totalCount > 0
            ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900"
            : "bg-card border-border"
        )}>
          <div className="flex items-center gap-2 px-4 py-3">
            <InboxIcon className={cn("h-4 w-4 shrink-0", totalCount > 0 ? "text-amber-600" : "text-muted-foreground")} />
            <h3 className="text-sm font-medium">
              Access Requests
            </h3>
            {totalCount > 0 && (
              <Badge variant="warning" className="text-xs">
                {totalCount}
              </Badge>
            )}
            {ignoredCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {ignoredCount} ignored
              </Badge>
            )}
          </div>

          {totalCount > 0 ? (
            <div className="border-t border-amber-200 dark:border-amber-900 px-4 py-2.5">
              <div className="flex items-center gap-2">
                {/* Overlapping avatars */}
                <div className="flex -space-x-2">
                  {previewRequests.map((req) => {
                    const name = getRequestName(req)
                    return (
                      <Avatar key={req.id} className="h-7 w-7 border-2 border-amber-50 dark:border-amber-950/50">
                        {req.avatarUrl && <AvatarImage src={req.avatarUrl} alt={name} />}
                        <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground flex-1 min-w-0 truncate">
                  {namePlateSummary}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  onClick={() => setViewAllOpen(true)}
                >
                  Review All
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border px-4 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  No pending requests
                </p>
                {ignoredCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 text-xs text-muted-foreground"
                    onClick={() => setViewAllOpen(true)}
                  >
                    View Ignored
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View All Dialog */}
      <Dialog open={viewAllOpen} onOpenChange={setViewAllOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2">
              <InboxIcon className="h-4 w-4 text-amber-600" />
              Access Requests
            </DialogTitle>
            <DialogDescription>
              Review and manage access requests for this church&apos;s CMS.
            </DialogDescription>
          </DialogHeader>

          {ignoredCount > 0 ? (
            <Tabs defaultValue="pending" className="w-full">
              <div className="px-6">
                <TabsList className="w-full">
                  <TabsTrigger value="pending" className="flex-1">
                    Pending
                    {totalCount > 0 && (
                      <Badge variant="warning" className="text-xs ml-1.5">
                        {totalCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="ignored" className="flex-1">
                    Ignored
                    <Badge variant="secondary" className="text-xs ml-1.5">
                      {ignoredCount}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="pending" className="mt-0">
                <ScrollArea className="max-h-[50vh]">
                  {pendingRequests.length > 0 ? (
                    <div className="divide-y">
                      {pendingRequests.map((req) => (
                        <PendingRequestRow
                          key={req.id}
                          req={req}
                          processing={processing}
                          onApprove={handleApprove}
                          onDeny={openDenyDialog}
                          onIgnore={handleIgnore}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      No pending requests
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="ignored" className="mt-0">
                <ScrollArea className="max-h-[50vh]">
                  <div className="divide-y">
                    {ignoredRequests.map((req) => (
                      <IgnoredRequestRow
                        key={req.id}
                        req={req}
                        processing={processing}
                        onRestore={handleRestore}
                        onApprove={handleApprove}
                        onDeny={openDenyDialog}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <ScrollArea className="max-h-[50vh]">
              {pendingRequests.length > 0 ? (
                <div className="divide-y">
                  {pendingRequests.map((req) => (
                    <PendingRequestRow
                      key={req.id}
                      req={req}
                      processing={processing}
                      onApprove={handleApprove}
                      onDeny={openDenyDialog}
                      onIgnore={handleIgnore}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  No pending requests
                </div>
              )}
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Deny Confirmation Dialog */}
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
