"use client"

import { Separator } from "@/components/ui/separator"
import { Clock } from "lucide-react"
import {
  EditorInput,
  EditorTextarea,
  ArrayField,
} from "./shared"

interface TimelineEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function TimelineEditor({ content, onChange }: TimelineEditorProps) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const items = (content.items as {
    time: string
    title: string
    description: string
  }[]) ?? []

  return (
    <div className="space-y-6">
      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="What to Expect"
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(val) => onChange({ ...content, description: val })}
        placeholder="Here is how our typical Sunday unfolds."
        className="min-h-[80px]"
      />

      <Separator />

      <ArrayField
        label="Timeline Items"
        items={items}
        onItemsChange={(updated) => onChange({ ...content, items: updated })}
        createItem={() => ({ time: "", title: "", description: "" })}
        addLabel="Add Item"
        emptyIcon={Clock}
        emptyMessage="No timeline items added yet."
        emptyDescription='Click "Add Item" to create your first timeline step.'
        reorderable
        renderItem={(item, _i, updateItem) => (
          <>
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <EditorInput
                label="Time"
                value={item.time}
                onChange={(val) => updateItem({ ...item, time: val })}
                placeholder="10:00 AM"
                labelSize="xs"
              />
              <EditorInput
                label="Title"
                value={item.title}
                onChange={(val) => updateItem({ ...item, title: val })}
                placeholder="Welcome & Worship"
                labelSize="xs"
                className="font-medium"
              />
            </div>

            <EditorTextarea
              label="Description"
              value={item.description}
              onChange={(val) => updateItem({ ...item, description: val })}
              placeholder="Describe what happens during this step..."
              labelSize="xs"
              className="min-h-[60px]"
            />
          </>
        )}
      />
    </div>
  )
}
