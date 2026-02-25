"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical, HelpCircle } from "lucide-react"

interface FAQEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function FAQEditor({ content, onChange }: FAQEditorProps) {
  const heading = (content.heading as string) ?? ""
  const showIcon = (content.showIcon as boolean) ?? false
  const items = (content.items as { question: string; answer: string }[]) ?? []

  function updateItem(index: number, field: "question" | "answer", value: string) {
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
      items: [...items, { question: "", answer: "" }],
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
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Frequently Asked Questions"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Show Question Mark Icon</Label>
          <p className="text-xs text-muted-foreground">
            Display a circular question mark icon above the heading
          </p>
        </div>
        <Switch
          checked={showIcon}
          onCheckedChange={(v) => onChange({ ...content, showIcon: v })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Questions ({items.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="size-3.5 mr-1.5" />
            Add Question
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
                <HelpCircle className="size-3.5" />
                <span className="text-xs font-medium">Q{i + 1}</span>
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

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Question</Label>
              <Input
                value={item.question}
                onChange={(e) => updateItem(i, "question", e.target.value)}
                placeholder="What is your question?"
                className="font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Answer</Label>
              <Textarea
                value={item.answer}
                onChange={(e) => updateItem(i, "answer", e.target.value)}
                placeholder="Provide the answer..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <HelpCircle className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No questions added yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add Question&quot; to create your first FAQ item.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
