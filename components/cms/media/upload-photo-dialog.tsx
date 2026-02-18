"use client"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface UploadPhotoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (files: File[]) => void
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadPhotoDialog({ open, onOpenChange, onSubmit }: UploadPhotoDialogProps) {
  if (!open) return null
  return <UploadPhotoDialogInner onOpenChange={onOpenChange} onSubmit={onSubmit} />
}

function UploadPhotoDialogInner({
  onOpenChange,
  onSubmit,
}: Omit<UploadPhotoDialogProps, "open">) {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (files.length === 0) return
    onSubmit(files)
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Photos</DialogTitle>
          <DialogDescription>
            Select one or more images to upload to your media library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {files.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center hover:border-foreground/30 transition-colors"
            >
              <Upload className="size-8 text-muted-foreground/50 mb-2" />
              <span className="text-sm font-medium">Click to select files</span>
              <span className="text-xs text-muted-foreground mt-1">
                JPG, PNG, WEBP supported
              </span>
            </button>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="truncate font-medium">{file.name}</span>
                    <span className="text-muted-foreground text-xs shrink-0 ml-2">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiles([])
                  if (inputRef.current) inputRef.current.value = ""
                }}
              >
                Clear selection
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={files.length === 0}>
              Upload {files.length > 0 && `(${files.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
