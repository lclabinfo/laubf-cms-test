"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical, Clock } from "lucide-react"

interface TimelineEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function TimelineEditor({ content, onChange }: TimelineEditorProps) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const items = (content.items as {
    time: string
    title: string
    description: string
  }[]) ?? []

  function updateItem(
    index: number,
    field: "time" | "title" | "description",
    value: string,
  ) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, items: updated })
  }

  function removeItem(index: number) {
    onChange({ ...content, items: items.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({
      ...content,
      items: [...items, { time: "", title: "", description: "" }],
    })
  }

  function moveItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= items.length) return
    const updated = [...items]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onChange({ ...content, items: updated })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Sunday Service"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="What to Expect"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="Here is how our typical Sunday unfolds."
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Timeline Items ({items.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="size-3.5 mr-1.5" />
            Add Item
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
                <Clock className="size-3.5" />
                <span className="text-xs font-medium">Step {i + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => moveItem(i, i - 1)}
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
                  onClick={() => moveItem(i, i + 1)}
                  disabled={i === items.length - 1}
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
                  onClick={() => removeItem(i)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <Input
                  value={item.time}
                  onChange={(e) => updateItem(i, "time", e.target.value)}
                  placeholder="10:00 AM"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(i, "title", e.target.value)}
                  placeholder="Welcome & Worship"
                  className="font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={item.description}
                onChange={(e) =>
                  updateItem(i, "description", e.target.value)
                }
                placeholder="Describe what happens during this step..."
                className="min-h-[60px]"
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <Clock className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No timeline items added yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add Item&quot; to create your first timeline step.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
