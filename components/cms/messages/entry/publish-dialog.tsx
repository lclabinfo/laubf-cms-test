"use client"

import { useState, useEffect } from "react"
import { Video, BookOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  hasVideo: boolean
  hasStudy: boolean
  videoSummary: string
  studySummary: string
  onPublish: (options: { publishVideo: boolean; publishStudy: boolean }) => void
}

export function PublishDialog({
  open,
  onOpenChange,
  title,
  hasVideo,
  hasStudy,
  videoSummary,
  studySummary,
  onPublish,
}: PublishDialogProps) {
  const [publishVideo, setPublishVideo] = useState(hasVideo)
  const [publishStudy, setPublishStudy] = useState(hasStudy)

  // Reset toggle state when dialog opens
  useEffect(() => {
    if (open) {
      setPublishVideo(hasVideo)
      setPublishStudy(hasStudy)
    }
  }, [open, hasVideo, hasStudy])

  const noneSelected = !publishVideo && !publishStudy

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish Message</DialogTitle>
          <DialogDescription>
            Choose which content to make live on the public site.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          {/* Video toggle row */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-3.5 transition-colors",
              publishVideo
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                : "border-border bg-muted/40"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Video className="size-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">Video</div>
                <div className="text-xs text-muted-foreground">
                  {videoSummary}
                </div>
              </div>
            </div>
            <Switch
              checked={publishVideo}
              onCheckedChange={setPublishVideo}
              disabled={!hasVideo}
            />
          </div>

          {/* Bible Study toggle row */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-3.5 transition-colors",
              publishStudy
                ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
                : "border-border bg-muted/40"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10">
                <BookOpen className="size-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-semibold">Bible Study</div>
                <div className="text-xs text-muted-foreground">
                  {studySummary}
                </div>
              </div>
            </div>
            <Switch
              checked={publishStudy}
              onCheckedChange={setPublishStudy}
              disabled={!hasStudy}
            />
          </div>

          {/* Summary block */}
          <div className="rounded-lg border bg-muted/50 px-3.5 py-3 text-sm leading-relaxed">
            <div
              className={cn(
                publishVideo ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
              )}
            >
              {publishVideo ? "\u2713 Video will be published" : "\u2014 Video not included"}
            </div>
            <div
              className={cn(
                publishStudy ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
              )}
            >
              {publishStudy
                ? "\u2713 Bible Study will be published"
                : "\u2014 Bible Study not included"}
            </div>
            {noneSelected && (
              <div className="mt-1 text-amber-600 dark:text-amber-400">
                Select at least one content type
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={noneSelected}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onPublish({ publishVideo, publishStudy })}
          >
            Publish Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
