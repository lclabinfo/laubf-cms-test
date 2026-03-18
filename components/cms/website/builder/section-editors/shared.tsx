"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ImageIcon, X, Plus, GripVertical, Trash2 } from "lucide-react"
import { MediaPickerDialog } from "@/components/cms/media/media-picker-dialog"

// --- Image Picker Field (reusable) ---

export function ImagePickerField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {value ? (
        <div className="relative group rounded-md border overflow-hidden h-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setPickerOpen(true)}>
              Replace
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => onChange("")}>
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

// --- Button Config (reusable) ---

export function ButtonConfig({
  id,
  label,
  buttonData,
  onChange,
}: {
  id: string
  label: string
  buttonData: { label: string; href: string; visible: boolean }
  onChange: (data: { label: string; href: string; visible: boolean }) => void
}) {
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
            <Label className="text-xs text-muted-foreground">Button Text</Label>
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

// --- Generic Card Interface ---

export interface GenericCard {
  id?: string
  title: string
  description: string
  imageUrl?: string
  href?: string
  [key: string]: unknown
}

// --- Card Item Editor ---

export function CardItemEditor({
  index,
  card,
  onChange,
  onRemove,
  showImage,
  showLink,
  extraFields,
}: {
  index: number
  card: GenericCard
  onChange: (card: GenericCard) => void
  onRemove: () => void
  showImage?: boolean
  showLink?: boolean
  extraFields?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3 relative group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical className="size-4" />
          <span className="text-xs font-medium">Card {index + 1}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Title</Label>
        <Input
          value={card.title}
          onChange={(e) => onChange({ ...card, title: e.target.value })}
          placeholder="Card title"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea
          value={card.description}
          onChange={(e) =>
            onChange({ ...card, description: e.target.value })
          }
          placeholder="Card description"
          className="min-h-[60px]"
        />
      </div>

      {showImage && (
        <ImagePickerField
          label="Image"
          value={card.imageUrl ?? ""}
          onChange={(url) => onChange({ ...card, imageUrl: url })}
        />
      )}

      {showLink && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Link URL</Label>
          <Input
            value={card.href ?? ""}
            onChange={(e) => onChange({ ...card, href: e.target.value })}
            placeholder="/page"
          />
        </div>
      )}

      {extraFields}
    </div>
  )
}

// --- Add Card Button ---

export function AddCardButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      className="w-full border-dashed"
      onClick={onClick}
    >
      <Plus className="size-4 mr-2" />
      {label}
    </Button>
  )
}
