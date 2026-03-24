"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { ImagePickerField } from "./media-fields"

// --- GenericCard interface ---

export interface GenericCard {
  id?: string
  title: string
  description: string
  imageUrl?: string
  href?: string
  [key: string]: unknown
}

// --- CardItemEditor ---

export interface CardItemEditorProps {
  index: number
  card: GenericCard
  onChange: (card: GenericCard) => void
  onRemove: () => void
  showImage?: boolean
  showLink?: boolean
  extraFields?: React.ReactNode
}

export function CardItemEditor({
  index,
  card,
  onChange,
  onRemove,
  showImage,
  showLink,
  extraFields,
}: CardItemEditorProps) {
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

// --- AddCardButton ---

export interface AddCardButtonProps {
  label: string
  onClick: () => void
}

export function AddCardButton({ label, onClick }: AddCardButtonProps) {
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
