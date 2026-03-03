"use client"

import { useState, useEffect } from "react"
import { Video, BookOpen, Info } from "lucide-react"
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

interface UnpublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hasVideo: boolean
  hasStudy: boolean
  videoSummary: string
  studySummary: string
  onUnpublish: (options: {
    unpublishVideo: boolean
    unpublishStudy: boolean
    revertToDraft: boolean
  }) => void
}

export function UnpublishDialog({
  open,
  onOpenChange,
  hasVideo,
  hasStudy,
  videoSummary,
  studySummary,
  onUnpublish,
}: UnpublishDialogProps) {
  // Toggles represent "keep live" — ON = stays on public site, OFF = take offline
  const [keepVideoLive, setKeepVideoLive] = useState(true)
  const [keepStudyLive, setKeepStudyLive] = useState(true)

  useEffect(() => {
    if (open) {
      setKeepVideoLive(hasVideo)
      setKeepStudyLive(hasStudy)
    }
  }, [open, hasVideo, hasStudy])

  // Nothing changed — both still live
  const nothingChanged =
    (keepVideoLive === hasVideo) && (keepStudyLive === hasStudy)

  // Everything will be taken offline
  const willRevertToDraft =
    (!keepVideoLive || !hasVideo) && (!keepStudyLive || !hasStudy)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Published Content</DialogTitle>
          <DialogDescription>
            Toggle off content you want to remove from the public site.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2.5">
          {/* Video toggle row */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-3.5 transition-colors",
              keepVideoLive
                ? "border-green-200 bg-green-50 dark:border-green-700/50 dark:bg-green-900/30"
                : "border-border bg-muted/40"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20">
                <Video className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-semibold">Video</div>
                <div className="text-xs text-muted-foreground">
                  {videoSummary}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-medium",
                keepVideoLive ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
              )}>
                {keepVideoLive ? "Live" : "Offline"}
              </span>
              <Switch
                checked={keepVideoLive}
                onCheckedChange={setKeepVideoLive}
                disabled={!hasVideo}
              />
            </div>
          </div>

          {/* Bible Study toggle row */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border p-3.5 transition-colors",
              keepStudyLive
                ? "border-green-200 bg-green-50 dark:border-green-700/50 dark:bg-green-900/30"
                : "border-border bg-muted/40"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 dark:bg-purple-500/20">
                <BookOpen className="size-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-semibold">Bible Study</div>
                <div className="text-xs text-muted-foreground">
                  {studySummary}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-medium",
                keepStudyLive ? "text-green-700 dark:text-green-400" : "text-muted-foreground"
              )}>
                {keepStudyLive ? "Live" : "Offline"}
              </span>
              <Switch
                checked={keepStudyLive}
                onCheckedChange={setKeepStudyLive}
                disabled={!hasStudy}
              />
            </div>
          </div>

          {/* Result summary */}
          <div className="rounded-lg border bg-muted/50 px-3.5 py-3 text-sm leading-relaxed">
            {hasVideo && (
              <div className={cn(
                keepVideoLive ? "text-green-700 dark:text-green-400" : "text-foreground"
              )}>
                {keepVideoLive ? "\u2713 Video stays live" : "\u2717 Video will go offline"}
              </div>
            )}
            {hasStudy && (
              <div className={cn(
                keepStudyLive ? "text-green-700 dark:text-green-400" : "text-foreground"
              )}>
                {keepStudyLive ? "\u2713 Bible Study stays live" : "\u2717 Bible Study will go offline"}
              </div>
            )}
            {willRevertToDraft && (
              <div className="mt-2 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <Info className="size-3.5" />
                Message will revert to Draft
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={nothingChanged}
            onClick={() =>
              onUnpublish({
                unpublishVideo: hasVideo && !keepVideoLive,
                unpublishStudy: hasStudy && !keepStudyLive,
                revertToDraft: willRevertToDraft,
              })
            }
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
