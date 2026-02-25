"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical, ImageIcon } from "lucide-react"

interface PhotoGalleryEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function PhotoGalleryEditor({
  content,
  onChange,
}: PhotoGalleryEditorProps) {
  const heading = (content.heading as string) ?? ""
  const images = (content.images as {
    src: string
    alt: string
    objectPosition?: string
  }[]) ?? []

  function updateImage(index: number, field: string, value: string) {
    const updated = [...images]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, images: updated })
  }

  function removeImage(index: number) {
    onChange({
      ...content,
      images: images.filter((_, i) => i !== index),
    })
  }

  function addImage() {
    onChange({
      ...content,
      images: [...images, { src: "", alt: "" }],
    })
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= images.length) return
    const updated = [...images]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onChange({ ...content, images: updated })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Gallery"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Images ({images.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addImage}>
            <Plus className="size-3.5 mr-1.5" />
            Add Image
          </Button>
        </div>

        {images.map((image, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <ImageIcon className="size-3.5" />
                <span className="text-xs font-medium">Image {i + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => moveImage(i, i - 1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => moveImage(i, i + 1)}
                  disabled={i === images.length - 1}
                  title="Move down"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeImage(i)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Image URL
              </Label>
              <Input
                value={image.src}
                onChange={(e) => updateImage(i, "src", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Alt Text
                </Label>
                <Input
                  value={image.alt}
                  onChange={(e) => updateImage(i, "alt", e.target.value)}
                  placeholder="Photo description"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Object Position
                </Label>
                <Input
                  value={image.objectPosition ?? ""}
                  onChange={(e) =>
                    updateImage(i, "objectPosition", e.target.value)
                  }
                  placeholder="center center"
                />
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No images added yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add Image&quot; to build your photo gallery.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
