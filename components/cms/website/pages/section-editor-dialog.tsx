"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { sectionTypeLabels } from "./section-picker-dialog"

interface PageSectionData {
  id: string
  sectionType: string
  label: string | null
  sortOrder: number
  visible: boolean
  colorScheme: string
  paddingY: string
  containerWidth: string
  enableAnimations: boolean
  content: unknown
}

interface SectionEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: PageSectionData | null
  onSave: (id: string, data: Record<string, unknown>) => void
}

export function SectionEditorDialog({
  open,
  onOpenChange,
  section,
  onSave,
}: SectionEditorDialogProps) {
  if (!section) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Key forces remount when a different section is opened */}
        <SectionEditorForm
          key={section.id}
          section={section}
          onSave={onSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

interface SectionEditorFormProps {
  section: PageSectionData
  onSave: (id: string, data: Record<string, unknown>) => void
  onCancel: () => void
}

function SectionEditorForm({ section, onSave, onCancel }: SectionEditorFormProps) {
  const [colorScheme, setColorScheme] = useState(section.colorScheme)
  const [paddingY, setPaddingY] = useState(section.paddingY)
  const [containerWidth, setContainerWidth] = useState(section.containerWidth)
  const [enableAnimations, setEnableAnimations] = useState(section.enableAnimations)
  const [visible, setVisible] = useState(section.visible)
  const [contentJson, setContentJson] = useState(
    JSON.stringify(section.content, null, 2)
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  function handleContentChange(value: string) {
    setContentJson(value)
    try {
      JSON.parse(value)
      setJsonError(null)
    } catch {
      setJsonError("Invalid JSON")
    }
  }

  function handleSave() {
    if (jsonError) return

    let parsedContent: unknown
    try {
      parsedContent = JSON.parse(contentJson)
    } catch {
      setJsonError("Invalid JSON")
      return
    }

    onSave(section.id, {
      colorScheme,
      paddingY,
      containerWidth,
      enableAnimations,
      visible,
      content: parsedContent,
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Section</DialogTitle>
        <Badge variant="secondary" className="w-fit">
          {sectionTypeLabels[section.sectionType] ?? section.sectionType}
        </Badge>
      </DialogHeader>

      <div className="space-y-5 pt-2">
        {/* Display settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Display Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LIGHT">Light</SelectItem>
                  <SelectItem value="DARK">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Padding</Label>
              <Select value={paddingY} onValueChange={setPaddingY}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="COMPACT">Compact</SelectItem>
                  <SelectItem value="DEFAULT">Default</SelectItem>
                  <SelectItem value="SPACIOUS">Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Container Width</Label>
            <Select value={containerWidth} onValueChange={setContainerWidth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NARROW">Narrow</SelectItem>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="FULL">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="enable-animations">Enable Animations</Label>
            <Switch
              id="enable-animations"
              checked={enableAnimations}
              onCheckedChange={setEnableAnimations}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="section-visible">Visible</Label>
            <Switch
              id="section-visible"
              checked={visible}
              onCheckedChange={setVisible}
            />
          </div>
        </div>

        {/* Content JSON editor */}
        <div className="space-y-2">
          <Label>Content (JSON)</Label>
          <Textarea
            value={contentJson}
            onChange={(e) => handleContentChange(e.target.value)}
            className="font-mono text-xs min-h-48"
            placeholder="{}"
          />
          {jsonError && (
            <p className="text-xs text-destructive">{jsonError}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Edit the raw JSON content for this section. In a future version,
            this will be replaced with a rich form editor.
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!!jsonError}>
          Save Changes
        </Button>
      </DialogFooter>
    </>
  )
}
