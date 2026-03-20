"use client"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ImageIcon, X, Plus, ChevronUp, ChevronDown, Video, Trash2 } from "lucide-react"
import { MediaPickerDialog } from "@/components/cms/media/media-picker-dialog"

// --- ImagePickerField ---

export interface ImagePickerFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
}

export function ImagePickerField({
  label,
  value,
  onChange,
}: ImagePickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {value ? (
        <div className="relative group rounded-md border overflow-hidden h-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={() => setPickerOpen(true)}
            >
              Replace
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={() => onChange("")}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground font-normal"
          onClick={() => setPickerOpen(true)}
        >
          <ImageIcon className="size-3.5" />
          Choose image...
        </Button>
      )}
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="Website"
        onSelect={(url) => onChange(url)}
      />
    </div>
  )
}

// --- ImageListField ---

export interface ImageListFieldProps {
  label: string
  images: Array<{ src: string; alt: string }>
  onChange: (images: Array<{ src: string; alt: string }>) => void
  maxImages?: number
}

export function ImageListField({
  label,
  images,
  onChange,
  maxImages = 10,
}: ImageListFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleAdd = useCallback(
    (url: string, alt?: string) => {
      if (images.length >= maxImages) return
      onChange([...images, { src: url, alt: alt ?? "" }])
    },
    [images, maxImages, onChange],
  )

  const handleRemove = useCallback(
    (index: number) => {
      onChange(images.filter((_, i) => i !== index))
    },
    [images, onChange],
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      const next = [...images]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      onChange(next)
    },
    [images, onChange],
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= images.length - 1) return
      const next = [...images]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      onChange(next)
    },
    [images, onChange],
  )

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>

      {images.length === 0 ? (
        /* Empty state */
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 py-6 text-sm text-muted-foreground hover:border-muted-foreground/40 transition-colors"
        >
          <Plus className="size-4" />
          Add Image
        </button>
      ) : (
        <div className="space-y-2">
          {images.map((img, index) => (
            <div
              key={`${img.src}-${index}`}
              className="relative group flex items-center gap-2 rounded-md border overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="h-16 w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                {/\.(mp4|webm|mov|ogg)(\?|$)/i.test(img.src) ? (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <Video className="size-5" />
                  </div>
                ) : img.src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-5" />
                  </div>
                )}
              </div>

              {/* Alt text (truncated) */}
              <span className="flex-1 truncate text-xs text-muted-foreground px-1">
                {img.alt || "No alt text"}
              </span>

              {/* Reorder + Remove controls */}
              <div className="flex flex-col items-center gap-0.5 pr-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  disabled={index === images.length - 1}
                  onClick={() => handleMoveDown(index)}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
              </div>

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 mr-1 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(index)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}

          {/* Add more button */}
          {images.length < maxImages && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="size-3" />
              Add Image
            </Button>
          )}
        </div>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="Website"
        onSelect={(url, alt) => handleAdd(url, alt)}
      />
    </div>
  )
}

// --- VideoPickerField ---

export interface VideoPickerFieldProps {
  label: string
  value: string
  onChange: (url: string) => void
  posterImage?: string
  onPosterChange?: (url: string) => void
}

export function VideoPickerField({
  label,
  value,
  onChange,
  posterImage,
  onPosterChange,
}: VideoPickerFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [posterPickerOpen, setPosterPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>

      {value ? (
        <div className="space-y-2">
          {/* Video preview */}
          <div className="relative rounded-md border overflow-hidden">
            <video
              src={value}
              poster={posterImage || undefined}
              muted
              controls
              preload="metadata"
              className="h-32 w-full rounded-md object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute top-1.5 right-1.5 h-6 w-6"
              onClick={() => onChange("")}
            >
              <X className="size-3" />
            </Button>
          </div>

          {/* URL input */}
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="text-xs"
          />

          {/* Poster image picker */}
          {onPosterChange && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Poster / Fallback Image
              </Label>
              {posterImage ? (
                <div className="relative group rounded-md border overflow-hidden h-16">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterImage}
                    alt=""
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-xs"
                      onClick={() => setPosterPickerOpen(true)}
                    >
                      Replace
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 text-xs"
                      onClick={() => onPosterChange("")}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground font-normal text-xs"
                  onClick={() => setPosterPickerOpen(true)}
                >
                  <ImageIcon className="size-3" />
                  Choose poster image...
                </Button>
              )}
              <MediaPickerDialog
                open={posterPickerOpen}
                onOpenChange={setPosterPickerOpen}
                folder="Website"
                onSelect={(url) => onPosterChange(url)}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Empty state */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-muted-foreground/25 py-6 text-sm text-muted-foreground hover:border-muted-foreground/40 transition-colors"
          >
            <Video className="size-4" />
            Add Video
          </button>

          {/* URL input for pasting */}
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or paste a video URL..."
            className="text-xs"
          />
        </div>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="Website"
        onSelect={(url) => onChange(url)}
      />
    </div>
  )
}

// --- ButtonConfig ---

export interface ButtonConfigProps {
  id: string
  label: string
  buttonData: { label: string; href: string; visible: boolean }
  onChange: (data: { label: string; href: string; visible: boolean }) => void
}

export function ButtonConfig({
  id,
  label,
  buttonData,
  onChange,
}: ButtonConfigProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch
          id={`${id}-visible`}
          checked={buttonData.visible}
          onCheckedChange={(v) => onChange({ ...buttonData, visible: v })}
        />
      </div>
      {buttonData.visible && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Button Text
            </Label>
            <Input
              value={buttonData.label}
              onChange={(e) =>
                onChange({ ...buttonData, label: e.target.value })
              }
              placeholder="Learn More"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Link URL</Label>
            <Input
              value={buttonData.href}
              onChange={(e) =>
                onChange({ ...buttonData, href: e.target.value })
              }
              placeholder="/about"
            />
          </div>
        </div>
      )}
    </div>
  )
}
