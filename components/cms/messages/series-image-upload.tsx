"use client"

import { useRef } from "react"
import { ImageIcon, Upload, LibraryBig } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SeriesImageUploadProps {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}

export function SeriesImageUpload({ value, onChange }: SeriesImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
    }
    reader.readAsDataURL(file)
    // Reset so the same file can be re-selected
    e.target.value = ""
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-video w-full rounded-lg border-2 border-dashed bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
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
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          Upload from Computer
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
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(undefined)}
          className="text-muted-foreground"
        >
          Remove image
        </Button>
      )}
    </div>
  )
}
