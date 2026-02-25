"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle } from "lucide-react"
import type { SectionType } from "@/lib/db/types"

interface CustomEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

// --- Custom HTML Editor ---

function CustomHtmlEditor({
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

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">HTML Content</Label>
        <Textarea
          value={html}
          onChange={(e) => onChange({ ...content, html: e.target.value })}
          placeholder="<div>Your custom HTML here</div>"
          className="font-mono text-xs min-h-[300px] resize-y"
          spellCheck={false}
        />
      </div>
    </div>
  )
}

// --- Custom Embed Editor ---

function CustomEmbedEditor({
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Embed URL</Label>
        <Input
          value={embedUrl}
          onChange={(e) =>
            onChange({ ...content, embedUrl: e.target.value })
          }
          placeholder="https://www.youtube.com/embed/..."
        />
        <p className="text-xs text-muted-foreground">
          The URL will be loaded inside an iframe. Use embed-friendly URLs
          (e.g., YouTube embed URLs, Google Maps embed).
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Title</Label>
        <Input
          value={title}
          onChange={(e) =>
            onChange({ ...content, title: e.target.value })
          }
          placeholder="Embedded content"
        />
        <p className="text-xs text-muted-foreground">
          Accessibility title for the iframe element.
        </p>
      </div>

      <Separator />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Aspect Ratio</Label>
        <div className="flex gap-2">
          {["16/9", "4/3", "1/1", "9/16"].map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => onChange({ ...content, aspectRatio: ratio })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                aspectRatio === ratio
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
        <Input
          value={aspectRatio}
          onChange={(e) =>
            onChange({ ...content, aspectRatio: e.target.value })
          }
          placeholder="16/9"
          className="mt-2"
        />
      </div>
    </div>
  )
}

// --- Main export ---

export function CustomEditor({
  sectionType,
  content,
  onChange,
}: CustomEditorProps) {
  switch (sectionType) {
    case "CUSTOM_HTML":
      return <CustomHtmlEditor content={content} onChange={onChange} />
    case "CUSTOM_EMBED":
      return <CustomEmbedEditor content={content} onChange={onChange} />
    default:
      return null
  }
}
