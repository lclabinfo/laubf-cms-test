"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  X,
  ImageIcon,
  Video,
  FileIcon,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Eye,
  FolderOpen,
} from "lucide-react"
import { useUploadQueue } from "@/components/cms/upload-queue-provider"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/lib/upload-constants"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

function getMimeIcon(mimeType: string) {
  if (mimeType.startsWith("video/")) return Video
  if (mimeType.startsWith("image/")) return ImageIcon
  return FileIcon
}

function statusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "Queued"
    case "getting-url":
      return "Preparing..."
    case "creating-record":
      return "Finishing..."
    case "done":
      return "Complete"
    case "error":
      return "Failed"
    case "cancelled":
      return "Cancelled"
    default:
      return ""
  }
}

export function UploadProgressPanel() {
  const { jobs, cancel, dismiss, dismissAll, retry } = useUploadQueue()
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  // Don't render if no jobs
  if (jobs.length === 0) return null

  const activeCount = jobs.filter(
    (j) =>
      j.status === "queued" ||
      j.status === "getting-url" ||
      j.status === "uploading" ||
      j.status === "creating-record",
  ).length
  const doneCount = jobs.filter((j) => j.status === "done").length
  const errorCount = jobs.filter(
    (j) => j.status === "error" || j.status === "cancelled",
  ).length
  const allFinished = activeCount === 0

  const headerText =
    activeCount > 0
      ? `Uploading ${activeCount} file${activeCount > 1 ? "s" : ""}...`
      : doneCount > 0 && errorCount === 0
        ? `${doneCount} upload${doneCount > 1 ? "s" : ""} complete`
        : errorCount > 0 && doneCount === 0
          ? `${errorCount} upload${errorCount > 1 ? "s" : ""} failed`
          : `${doneCount} complete, ${errorCount} failed`

  return (
    <div
      className={cn(
        "fixed bottom-20 right-5 z-40 w-80 rounded-lg border bg-popover text-popover-foreground shadow-xl",
        "animate-in slide-in-from-bottom-5 fade-in duration-300",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <span className="text-sm font-medium truncate">{headerText}</span>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </Button>
          {allFinished && (
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={dismissAll}
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* File list */}
      {!collapsed && (
        <div className="max-h-64 overflow-y-auto divide-y">
          {jobs.map((job) => {
            const Icon = getMimeIcon(job.file.type)
            const isActive =
              job.status === "queued" ||
              job.status === "getting-url" ||
              job.status === "uploading" ||
              job.status === "creating-record"
            const isUploading = job.status === "uploading"
            const isDone = job.status === "done"
            const isError =
              job.status === "error" || job.status === "cancelled"

            return (
              <div
                key={job.id}
                className="flex items-center gap-2 px-3 py-2 text-sm"
              >
                {/* Icon */}
                <div className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="size-4 text-green-500" />
                  ) : isError ? (
                    <AlertCircle className="size-4 text-destructive" />
                  ) : (
                    <Icon className="size-4 text-muted-foreground" />
                  )}
                </div>

                {/* Filename + progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">
                      {job.file.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {isUploading
                        ? `${job.progress}%`
                        : isDone
                          ? formatFileSize(job.file.size)
                          : isError
                            ? job.error || "Failed"
                            : statusLabel(job.status)}
                    </span>
                  </div>
                  {isUploading && (
                    <Progress
                      value={job.progress}
                      className="h-1 mt-1"
                    />
                  )}
                  {(job.status === "getting-url" ||
                    job.status === "creating-record") && (
                    <Progress value={100} className="h-1 mt-1 animate-pulse" />
                  )}
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {isActive && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive"
                      onClick={() => cancel(job.id)}
                    >
                      <X className="size-3" />
                    </Button>
                  )}
                  {isDone && (
                    <div className="flex items-center gap-0.5">
                      {job.result?.url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground"
                          onClick={() => {
                            window.open(job.result!.url, "_blank")
                          }}
                          title="Preview"
                        >
                          <Eye className="size-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground"
                        onClick={() => {
                          router.push("/cms/media")
                          dismiss(job.id)
                        }}
                        title="Go to media library"
                      >
                        <FolderOpen className="size-3" />
                      </Button>
                    </div>
                  )}
                  {isError && (
                    <div className="flex items-center gap-0.5">
                      {job.status === "error" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-muted-foreground"
                          onClick={() => retry(job.id)}
                          title="Retry"
                        >
                          <RotateCcw className="size-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-muted-foreground"
                        onClick={() => dismiss(job.id)}
                        title="Dismiss"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
