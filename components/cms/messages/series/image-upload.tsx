"use client"

import { useRef, useState } from "react"
import { ImageIcon, Upload, LibraryBig, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadImageToR2, deleteImageFromR2 } from "@/lib/upload-media"

interface SeriesImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
}

export function SeriesImageUpload({ value, onChange }: SeriesImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-selected
    e.target.value = ""

    setUploading(true)
    setError(null)

    try {
      // Delete old image from R2 if replacing
      if (value) {
        await deleteImageFromR2(value).catch(() => {
          // Non-fatal: old image may already be gone or not in R2
        })
      }

      const result = await uploadImageToR2(file, "Series")
      onChange(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    if (!value) return

    setError(null)

    // Delete from R2 in background (non-blocking for UI)
    deleteImageFromR2(value).catch(() => {
      // Non-fatal: image may not be in R2
    })

    onChange(undefined)
  }

  return (
    <div className="space-y-3">
      <div
        className={`relative aspect-video w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center overflow-hidden transition-colors ${
          uploading ? "opacity-60 pointer-events-none" : "cursor-pointer hover:bg-muted/70"
        }`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <span className="text-sm">Uploading...</span>
          </div>
        ) : value ? (
          <img src={value} alt="Series cover" className="size-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="size-10" />
            <span className="text-sm">Click to upload cover image</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          {uploading ? "Uploading..." : "Upload from Computer"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          title="Media Library will be available soon"
        >
          <LibraryBig />
          Media Library
        </Button>
      </div>
      {value && !uploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-muted-foreground"
        >
          Remove image
        </Button>
      )}
    </div>
  )
}
