"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react"

// --- ArrayField ---

export interface ArrayFieldProps<T> {
  label: string
  items: T[]
  onItemsChange: (items: T[]) => void
  renderItem: (
    item: T,
    index: number,
    updateItem: (updated: T) => void
  ) => React.ReactNode
  createItem: () => T
  addLabel?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  emptyMessage?: string
  emptyDescription?: string
  reorderable?: boolean
  maxItems?: number
}

export function ArrayField<T>({
  label,
  items,
  onItemsChange,
  renderItem,
  createItem,
  addLabel = "Add Item",
  emptyIcon: EmptyIcon,
  emptyMessage = "No items added yet.",
  emptyDescription,
  reorderable = false,
  maxItems,
}: ArrayFieldProps<T>) {
  function updateItem(index: number, updated: T) {
    const next = [...items]
    next[index] = updated
    onItemsChange(next)
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((_, i) => i !== index))
  }

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length) return
    const next = [...items]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    onItemsChange(next)
  }

  function addItem() {
    onItemsChange([...items, createItem()])
  }

  const canAdd = maxItems === undefined || items.length < maxItems

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label} ({items.length})
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={!canAdd}
        >
          <Plus className="size-3.5 mr-1.5" />
          {addLabel}
        </Button>
      </div>

      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border p-4 space-y-3 relative group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GripVertical className="size-4" />
              <span className="text-xs font-medium">
                {label.replace(/s$/, "")} {i + 1}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {reorderable && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => moveItem(i, i - 1)}
                    disabled={i === 0}
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    onClick={() => moveItem(i, i + 1)}
                    disabled={i === items.length - 1}
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {renderItem(item, i, (updated) => updateItem(i, updated))}
        </div>
      ))}

      {items.length === 0 && (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          {EmptyIcon && (
            <EmptyIcon className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          )}
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          {emptyDescription && (
            <p className="text-xs text-muted-foreground mt-1">
              {emptyDescription}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// --- SocialLinksField ---

const DEFAULT_PLATFORMS = [
  "instagram",
  "facebook",
  "youtube",
  "twitter",
  "email",
  "website",
]

export interface SocialLinksFieldProps {
  value: Array<{ platform: string; href: string }>
  onChange: (links: Array<{ platform: string; href: string }>) => void
  platforms?: string[]
}

export function SocialLinksField({
  value,
  onChange,
  platforms: _platforms = DEFAULT_PLATFORMS,
}: SocialLinksFieldProps) {
  function updateLink(index: number, field: string, val: string) {
    const updated = [...value]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  function removeLink(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addLink() {
    onChange([...value, { platform: "", href: "" }])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Social Links ({value.length})
        </Label>
        <Button variant="outline" size="sm" onClick={addLink}>
          <Plus className="size-3.5 mr-1.5" />
          Add Link
        </Button>
      </div>

      {value.map((link, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="w-32 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Platform</Label>
            <Input
              value={link.platform}
              onChange={(e) => updateLink(i, "platform", e.target.value)}
              placeholder="instagram"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              value={link.href}
              onChange={(e) => updateLink(i, "href", e.target.value)}
              placeholder="https://instagram.com/..."
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeLink(i)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}

// --- AddressField ---

export interface AddressFieldProps {
  label?: string
  value: string[]
  onChange: (lines: string[]) => void
  maxLines?: number
  placeholder?: string
}

export function AddressField({
  label = "Address Lines",
  value,
  onChange,
  maxLines,
  placeholder = "Address line",
}: AddressFieldProps) {
  function updateLine(index: number, val: string) {
    const updated = [...value]
    updated[index] = val
    onChange(updated)
  }

  function removeLine(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addLine() {
    onChange([...value, ""])
  }

  const canAdd = maxLines === undefined || value.length < maxLines

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {canAdd && (
          <button
            type="button"
            onClick={addLine}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add Line
          </button>
        )}
      </div>
      {value.map((line, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={line}
            onChange={(e) => updateLine(i, e.target.value)}
            placeholder={`${placeholder} ${i + 1}`}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-destructive"
            onClick={() => removeLine(i)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  )
}
