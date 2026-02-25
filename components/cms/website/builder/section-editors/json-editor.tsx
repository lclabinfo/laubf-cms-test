"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"

interface JsonEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function JsonEditor({ content, onChange }: JsonEditorProps) {
  // Serialize the prop once per render for comparison
  const serializedProp = JSON.stringify(content, null, 2)

  // Track the last prop-derived value in state so we can detect external changes.
  // React's "derived state" pattern: store previous prop and current local text together.
  const [state, setState] = useState(() => ({
    lastProp: serializedProp,
    json: serializedProp,
    error: null as string | null,
  }))

  // If the parent-provided content changed since our last known value,
  // reset the textarea to match.
  let { json, error } = state
  if (serializedProp !== state.lastProp) {
    json = serializedProp
    error = null
    setState({ lastProp: serializedProp, json, error })
  }

  function handleChange(value: string) {
    let nextError: string | null = null
    try {
      const parsed = JSON.parse(value)
      // Update the "lastProp" to the newly parsed value so we don't
      // accidentally reset when the parent reflects our change back.
      const nextSerialized = JSON.stringify(parsed, null, 2)
      setState({ lastProp: nextSerialized, json: value, error: null })
      onChange(parsed)
      return
    } catch (e) {
      nextError = e instanceof Error ? e.message : "Invalid JSON"
    }
    setState((prev) => ({ ...prev, json: value, error: nextError }))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Content (JSON)</Label>
        {error && (
          <div className="flex items-center gap-1.5 text-destructive">
            <AlertCircle className="size-3.5" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        )}
      </div>

      <Textarea
        value={json}
        onChange={(e) => handleChange(e.target.value)}
        className="font-mono text-xs min-h-[300px] resize-y"
        placeholder="{}"
        spellCheck={false}
      />

      <p className="text-xs text-muted-foreground">
        This section type does not yet have a dedicated editor. You can edit the
        raw JSON content directly. A structured editor will be available in a
        future update.
      </p>
    </div>
  )
}
