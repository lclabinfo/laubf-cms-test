"use client"

import { Separator } from "@/components/ui/separator"
import { HelpCircle } from "lucide-react"
import {
  EditorInput,
  EditorTextarea,
  EditorToggle,
  ArrayField,
} from "./shared"

interface FAQEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function FAQEditor({ content, onChange }: FAQEditorProps) {
  const heading = (content.heading as string) ?? ""
  const showIcon = (content.showIcon as boolean) ?? false
  const items = (content.items as { question: string; answer: string }[]) ?? []

  return (
    <div className="space-y-6">
      <EditorInput
        label="Section Heading"
        labelSize="sm"
        value={heading}
        onChange={(val) => onChange({ ...content, heading: val })}
        placeholder="Frequently Asked Questions"
      />

      <EditorToggle
        label="Show Question Mark Icon"
        description="Display a circular question mark icon above the heading"
        checked={showIcon}
        onCheckedChange={(v) => onChange({ ...content, showIcon: v })}
      />

      <Separator />

      <ArrayField
        label="Questions"
        items={items}
        onItemsChange={(updated) => onChange({ ...content, items: updated })}
        createItem={() => ({ question: "", answer: "" })}
        addLabel="Add Question"
        emptyIcon={HelpCircle}
        emptyMessage="No questions added yet."
        emptyDescription='Click "Add Question" to create your first FAQ item.'
        reorderable
        renderItem={(item, _i, updateItem) => (
          <>
            <EditorInput
              label="Question"
              value={item.question}
              onChange={(val) => updateItem({ ...item, question: val })}
              placeholder="What is your question?"
              labelSize="xs"
              className="font-medium"
            />

            <EditorTextarea
              label="Answer"
              value={item.answer}
              onChange={(val) => updateItem({ ...item, answer: val })}
              placeholder="Provide the answer..."
              labelSize="xs"
              className="min-h-[80px]"
            />
          </>
        )}
      />
    </div>
  )
}
