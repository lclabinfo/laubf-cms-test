"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Paintbrush, FileText, Code } from "lucide-react"
import type { SectionType } from "@/lib/db/types"
import { sectionTypeLabels } from "@/components/cms/website/pages/section-picker-dialog"
import {
  SectionContentEditor,
  hasStructuredEditor,
} from "./section-editors"
import {
  DisplaySettings,
  type DisplaySettingsData,
} from "./section-editors/display-settings"
import { JsonEditor } from "./section-editors/json-editor"

// --- Types ---

export interface SectionEditorData {
  id: string
  sectionType: SectionType
  content: Record<string, unknown>
  colorScheme: string
  paddingY: string
  containerWidth: string
  enableAnimations: boolean
  visible: boolean
  label?: string | null
}

export interface SectionEditorSaveData {
  content: Record<string, unknown>
  colorScheme: string
  paddingY: string
  containerWidth: string
  enableAnimations: boolean
  visible: boolean
  label?: string | null
}

export interface SectionEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: SectionEditorData | null
  onSave: (data: SectionEditorSaveData) => void
}

// --- Inner form component (keyed by section.id to reset state on new section) ---

interface SectionEditorFormProps {
  section: SectionEditorData
  onSave: (data: SectionEditorSaveData) => void
  onCancel: () => void
}

function SectionEditorForm({ section, onSave, onCancel }: SectionEditorFormProps) {
  // State is initialized from props during mount (no useEffect needed).
  // The parent uses `key={section.id}` to remount this component when the section changes.
  const [content, setContent] = useState<Record<string, unknown>>(
    () => section.content ?? {},
  )
  const [displaySettings, setDisplaySettings] = useState<DisplaySettingsData>(
    () => ({
      colorScheme: section.colorScheme,
      paddingY: section.paddingY,
      containerWidth: section.containerWidth,
      enableAnimations: section.enableAnimations,
      visible: section.visible,
      label: section.label ?? "",
    }),
  )
  const [activeTab, setActiveTab] = useState<string>("content")

  const handleContentChange = useCallback(
    (newContent: Record<string, unknown>) => {
      setContent(newContent)
    },
    [],
  )

  const handleDisplayChange = useCallback(
    (newSettings: DisplaySettingsData) => {
      setDisplaySettings(newSettings)
    },
    [],
  )

  function handleSave() {
    onSave({
      content,
      colorScheme: displaySettings.colorScheme,
      paddingY: displaySettings.paddingY,
      containerWidth: displaySettings.containerWidth,
      enableAnimations: displaySettings.enableAnimations,
      visible: displaySettings.visible,
      label: displaySettings.label || null,
    })
  }

  const typeLabel =
    sectionTypeLabels[section.sectionType] ?? section.sectionType
  const isStructured = hasStructuredEditor(section.sectionType)

  return (
    <>
      {/* Header */}
      <DialogHeader className="px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <DialogTitle className="text-lg">Edit Section</DialogTitle>
          <Badge variant="secondary" className="font-normal">
            {typeLabel}
          </Badge>
        </div>
      </DialogHeader>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0"
      >
        <div className="px-6 pt-3 shrink-0">
          <TabsList className="w-full justify-start">
            <TabsTrigger
              value="content"
              className="flex items-center gap-1.5"
            >
              <FileText className="size-3.5" />
              Content
            </TabsTrigger>
            <TabsTrigger
              value="display"
              className="flex items-center gap-1.5"
            >
              <Paintbrush className="size-3.5" />
              Display
            </TabsTrigger>
            {isStructured && (
              <TabsTrigger
                value="json"
                className="flex items-center gap-1.5"
              >
                <Code className="size-3.5" />
                JSON
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Content tab */}
        <TabsContent value="content" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full max-h-[calc(90vh-200px)]">
            <div className="px-6 py-4">
              <SectionContentEditor
                sectionType={section.sectionType}
                content={content}
                onChange={handleContentChange}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Display tab */}
        <TabsContent value="display" className="flex-1 min-h-0 mt-0">
          <ScrollArea className="h-full max-h-[calc(90vh-200px)]">
            <div className="px-6 py-4">
              <DisplaySettings
                data={displaySettings}
                onChange={handleDisplayChange}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Raw JSON tab (only for sections with structured editors) */}
        {isStructured && (
          <TabsContent value="json" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full max-h-[calc(90vh-200px)]">
              <div className="px-6 py-4">
                <JsonEditor
                  content={content}
                  onChange={handleContentChange}
                />
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>

      {/* Footer */}
      <DialogFooter className="px-6 py-4 border-t shrink-0">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>Save Changes</Button>
      </DialogFooter>
    </>
  )
}

// --- Main modal wrapper ---

export function SectionEditorModal({
  open,
  onOpenChange,
  section,
  onSave,
}: SectionEditorModalProps) {
  if (!section) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
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
