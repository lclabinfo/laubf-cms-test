"use client"

import { Separator } from "@/components/ui/separator"
import { AlertTriangle } from "lucide-react"
import {
  EditorInput,
  EditorTextarea,
  EditorButtonGroup,
} from "./shared"

// --- Custom HTML Editor ---

export function CustomHtmlEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const html = (content.html as string) ?? ""

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Custom HTML
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Be careful with custom HTML. Incorrect markup can break the page
            layout. This content is rendered without sanitization.
          </p>
        </div>
      </div>

      <EditorTextarea
        label="HTML Content"
        value={html}
        onChange={(val) => onChange({ ...content, html: val })}
        placeholder="<div>Your custom HTML here</div>"
        className="font-mono text-xs min-h-[300px] resize-y"
        spellCheck={false}
      />
    </div>
  )
}

// --- Custom Embed Editor ---

export function CustomEmbedEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const embedUrl = (content.embedUrl as string) ?? ""
  const title = (content.title as string) ?? ""
  const aspectRatio = (content.aspectRatio as string) ?? "16/9"

  return (
    <div className="space-y-6">
      <EditorInput
        label="Embed URL"
        value={embedUrl}
        onChange={(val) => onChange({ ...content, embedUrl: val })}
        placeholder="https://www.youtube.com/embed/..."
        description="The URL will be loaded inside an iframe. Use embed-friendly URLs (e.g., YouTube embed URLs, Google Maps embed)."
      />

      <EditorInput
        label="Title"
        value={title}
        onChange={(val) => onChange({ ...content, title: val })}
        placeholder="Embedded content"
        description="Accessibility title for the iframe element."
      />

      <Separator />

      <EditorButtonGroup
        label="Aspect Ratio"
        value={aspectRatio}
        onChange={(val) => onChange({ ...content, aspectRatio: val })}
        options={[
          { value: "16/9", label: "16/9" },
          { value: "4/3", label: "4/3" },
          { value: "1/1", label: "1/1" },
          { value: "9/16", label: "9/16" },
        ]}
      />
      <EditorInput
        label="Custom Ratio"
        value={aspectRatio}
        onChange={(val) => onChange({ ...content, aspectRatio: val })}
        placeholder="16/9"
        labelSize="xs"
      />
    </div>
  )
}

