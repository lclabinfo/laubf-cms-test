"use client"

import { use, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Plus, X } from "lucide-react"
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
import { SeriesImageUpload } from "@/components/cms/messages/series/image-upload"
import { ManageMessagesDialog } from "@/components/cms/messages/series/manage-messages-dialog"
import { useMessages } from "@/lib/messages-context"

export default function SeriesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { series, messages, updateSeries, deleteSeries, setSeriesMessages } = useMessages()

  const currentSeries = series.find((s) => s.id === id)

  const [name, setName] = useState(currentSeries?.name ?? "")
  const [imageUrl, setImageUrl] = useState(currentSeries?.imageUrl)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)

  const seriesMessages = useMemo(
    () => messages.filter((m) => m.seriesIds.includes(id)),
    [messages, id]
  )

  const hasChanges = useMemo(() => {
    if (!currentSeries) return false
    return name !== currentSeries.name || imageUrl !== currentSeries.imageUrl
  }, [currentSeries, name, imageUrl])

  const handleSave = useCallback(() => {
    if (!name.trim()) return
    updateSeries(id, { name: name.trim(), imageUrl })
  }, [id, name, imageUrl, updateSeries])

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

  if (!currentSeries) {
    return (
      <div className="space-y-4">
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
    <div className="space-y-6">
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
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <SeriesImageUpload value={imageUrl} onChange={setImageUrl} />
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
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {m.passage} &middot; {m.speaker} &middot; {m.date}
                  </p>
                </div>
                <Badge
                  variant={
                    m.status === "published"
                      ? "default"
                      : m.status === "draft"
                        ? "secondary"
                        : m.status === "scheduled"
                          ? "outline"
                          : "secondary"
                  }
                  className="text-xs shrink-0"
                >
                  {m.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveMessage(m.id)}
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
    </div>
  )
}
