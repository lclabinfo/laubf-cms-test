"use client"

import { use, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Plus, X, Video, BookOpen, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ManageMessagesDialog } from "@/components/cms/messages/series/manage-messages-dialog"
import { useMessages } from "@/lib/messages-context"
import type { Message } from "@/lib/messages-data"

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { series, messages, updateSeries, deleteSeries, setSeriesMessages } = useMessages()

  const currentSeries = series.find((s) => s.id === id)

  const [name, setName] = useState(currentSeries?.name ?? "")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [detailMessage, setDetailMessage] = useState<Message | null>(null)

  const seriesMessages = useMemo(
    () => messages.filter((m) => m.seriesId === id),
    [messages, id]
  )

  const hasChanges = useMemo(() => {
    if (!currentSeries) return false
    return name !== currentSeries.name
  }, [currentSeries, name])

  const handleSave = useCallback(() => {
    if (!name.trim()) return
    updateSeries(id, { name: name.trim() })
  }, [id, name, updateSeries])

  const handleDelete = useCallback(() => {
    deleteSeries(id)
    router.push("/cms/messages?tab=series")
  }, [id, deleteSeries, router])

  const handleRemoveMessage = useCallback(
    (messageId: string) => {
      const remaining = seriesMessages
        .filter((m) => m.id !== messageId)
        .map((m) => m.id)
      setSeriesMessages(id, remaining)
    },
    [id, seriesMessages, setSeriesMessages]
  )

  const handleManageSave = useCallback(
    (selectedIds: string[]) => {
      setSeriesMessages(id, selectedIds)
    },
    [id, setSeriesMessages]
  )

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  function formatDateTime(isoStr: string) {
    const date = new Date(isoStr)
    return date.toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    })
  }

  if (!currentSeries) {
    return (
      <div className="pt-5 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cms/messages?tab=series">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Series Not Found</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          This series doesn&apos;t exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="pt-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cms/messages?tab=series">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Edit Series</h1>
        <div className="flex-1" />
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 />
          <span className="hidden sm:inline">Delete Series</span>
        </Button>
      </div>

      {/* Series info */}
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="series-name">Series Name</Label>
          <Input
            id="series-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gospel of John"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={!name.trim() || !hasChanges}>
            Save Changes
          </Button>
          {hasChanges && (
            <span className="text-muted-foreground text-xs">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Messages section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium">
            Messages
            <Badge variant="secondary" className="ml-2">
              {seriesMessages.length}
            </Badge>
          </h2>
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
            <Plus />
            Add Messages
          </Button>
        </div>

        {seriesMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No messages in this series yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setManageOpen(true)}
            >
              <Plus />
              Add Messages
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {seriesMessages.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => setDetailMessage(m)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.passage} &middot; {m.speaker} &middot; {formatDate(m.date)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center gap-1" title="Video">
                    <Video className="size-3.5 text-blue-600 dark:text-blue-400" />
                    {m.videoPublished ? (
                      <Badge variant="success" className="text-xs">Live</Badge>
                    ) : m.hasVideo ? (
                      <Badge variant="secondary" className="text-xs">Draft</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">&mdash;</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1" title="Bible Study">
                    <BookOpen className="size-3.5 text-purple-600 dark:text-purple-400" />
                    {m.studyPublished ? (
                      <Badge variant="success" className="text-xs">Live</Badge>
                    ) : m.hasStudy ? (
                      <Badge variant="secondary" className="text-xs">Draft</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">&mdash;</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveMessage(m.id)
                  }}
                  title="Remove from series"
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{currentSeries.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Messages within this series will not be
              deleted, but they will no longer be associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage messages dialog */}
      <ManageMessagesDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        series={currentSeries}
        messages={messages}
        onSave={handleManageSave}
      />

      {/* Message detail dialog */}
      <Dialog open={!!detailMessage} onOpenChange={(open) => { if (!open) setDetailMessage(null) }}>
        <DialogContent className="sm:max-w-md">
          {detailMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="leading-snug">{detailMessage.title}</DialogTitle>
                <DialogDescription>
                  {detailMessage.passage} &middot; {detailMessage.speaker}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {/* Date & Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Message Date</span>
                  <span>{formatDate(detailMessage.date)}</span>
                </div>
                {detailMessage.publishedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Posted</span>
                    <span>{formatDateTime(detailMessage.publishedAt)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Video</span>
                  <Badge variant={detailMessage.videoPublished ? "success" : "secondary"}>
                    {detailMessage.videoPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Study</span>
                  <Badge variant={detailMessage.studyPublished ? "success" : "secondary"}>
                    {detailMessage.studyPublished ? "Published" : "Draft"}
                  </Badge>
                </div>

                {/* Content publish states */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Content</p>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5">
                    <div className="flex items-center gap-2">
                      <Video className="size-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium">Video</span>
                    </div>
                    {detailMessage.videoPublished ? (
                      <Badge variant="success">Published</Badge>
                    ) : detailMessage.hasVideo ? (
                      <Badge variant="secondary">Draft</Badge>
                    ) : (
                      <Badge variant="outline">Empty</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium">Bible Study</span>
                    </div>
                    {detailMessage.studyPublished ? (
                      <Badge variant="success">Published</Badge>
                    ) : detailMessage.hasStudy ? (
                      <Badge variant="secondary">Draft</Badge>
                    ) : (
                      <Badge variant="outline">Empty</Badge>
                    )}
                  </div>
                </div>

              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailMessage(null)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/cms/messages/${detailMessage.id}`}>
                    <Pencil />
                    Edit Message
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
