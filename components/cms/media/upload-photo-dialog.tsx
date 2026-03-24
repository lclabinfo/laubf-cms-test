"use client"

import { useState, useRef } from "react"
import { Upload, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { MAX_UPLOAD_SIZE, ACCEPTED_ALL_MEDIA_TYPES_STRING, formatFileSize } from "@/lib/upload-constants"
import { useUploadQueue } from "@/components/cms/upload-queue-provider"

interface UploadPhotoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentFolder?: string | null
}

interface TrackedFile {
  file: File
  valid: boolean
  error?: string
}

export function UploadPhotoDialog({
  open,
  onOpenChange,
  currentFolder,
}: UploadPhotoDialogProps) {
  if (!open) return null
  return (
    <UploadPhotoDialogInner
      onOpenChange={onOpenChange}
      currentFolder={currentFolder}
    />
  )
}

function UploadPhotoDialogInner({
  onOpenChange,
  currentFolder,
}: Omit<UploadPhotoDialogProps, "open">) {
  const [trackedFiles, setTrackedFiles] = useState<TrackedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { enqueue } = useUploadQueue()

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).map((file) => {
      if (file.size > MAX_UPLOAD_SIZE) {
        return { file, valid: false, error: `File exceeds ${formatFileSize(MAX_UPLOAD_SIZE)} limit` }
      }
      return { file, valid: true }
    })
    setTrackedFiles(files)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(e.target.files)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validFiles = trackedFiles.filter((tf) => tf.valid).map((tf) => tf.file)
    if (validFiles.length === 0) return

    const folder = currentFolder ?? "/"
    enqueue(validFiles, folder)
    onOpenChange(false)
    toast.info(
      `${validFiles.length} file${validFiles.length > 1 ? "s" : ""} queued for upload`,
    )
  }

  const validCount = trackedFiles.filter((tf) => tf.valid).length
  const hasFiles = trackedFiles.length > 0

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Select files to upload to your media library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_ALL_MEDIA_TYPES_STRING}
            onChange={handleFileChange}
            className="hidden"
          />

          {!hasFiles ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.length) {
                  addFiles(e.dataTransfer.files)
                }
              }}
              className={`flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "hover:border-foreground/30"
              }`}
            >
              <Upload className="size-8 text-muted-foreground/50 mb-2" />
              <span className="text-sm font-medium">
                {isDragging ? "Drop files here" : "Drag and drop or click to select files"}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                Images and videos supported. Max file size: {formatFileSize(MAX_UPLOAD_SIZE)}
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                {trackedFiles.map((tf, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm gap-2"
                  >
                    <span className="truncate font-medium flex items-center gap-2 min-w-0">
                      {!tf.valid && (
                        <AlertCircle className="size-3.5 shrink-0 text-destructive" />
                      )}
                      <span className="truncate">{tf.file.name}</span>
                    </span>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {tf.error ? (
                        <span className="text-destructive">{tf.error}</span>
                      ) : (
                        formatFileSize(tf.file.size)
                      )}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTrackedFiles([])
                  if (inputRef.current) inputRef.current.value = ""
                }}
              >
                Clear selection
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={validCount === 0}
            >
              Upload {validCount > 0 && `(${validCount})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
