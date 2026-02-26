"use client"

import { useCallback, useState } from "react"
import { X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
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
import {
  NavbarEditor,
  type NavbarSettings,
} from "./section-editors/navbar-editor"

// Re-export these types for use in builder-shell
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

interface BuilderRightDrawerProps {
  section: SectionEditorData | null
  onClose: () => void
  onChange: (data: Partial<SectionEditorData>) => void
  onDelete: (sectionId: string) => void
  /** Navbar editor mode */
  navbarSettings: NavbarSettings | null
  onNavbarClose: () => void
  onNavbarChange: (settings: NavbarSettings) => void
}

/**
 * Inline editor form for a section, keyed by section.id so it
 * remounts when a different section is opened.
 */
function SectionEditorInline({
  section,
  onChange,
  onDelete,
}: {
  section: SectionEditorData
  onChange: (data: Partial<SectionEditorData>) => void
  onDelete: (sectionId: string) => void
}) {
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
  const [showJson, setShowJson] = useState(false)

  const handleContentChange = useCallback(
    (newContent: Record<string, unknown>) => {
      setContent(newContent)
      onChange({ content: newContent })
    },
    [onChange],
  )

  const handleDisplayChange = useCallback(
    (newSettings: DisplaySettingsData) => {
      setDisplaySettings(newSettings)
      onChange({
        colorScheme: newSettings.colorScheme,
        paddingY: newSettings.paddingY,
        containerWidth: newSettings.containerWidth,
        enableAnimations: newSettings.enableAnimations,
        visible: newSettings.visible,
        label: newSettings.label || null,
      })
    },
    [onChange],
  )

  const isStructured = hasStructuredEditor(section.sectionType)

  return (
    <div className="space-y-6">
      {/* Section Label */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Section Label
        </Label>
        <Input
          value={displaySettings.label}
          onChange={(e) =>
            handleDisplayChange({ ...displaySettings, label: e.target.value })
          }
          placeholder="Optional admin-only label"
          className="text-sm"
        />
      </div>

      <Separator />

      {/* Content Editor */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content
        </Label>
        <SectionContentEditor
          sectionType={section.sectionType}
          content={content}
          onChange={handleContentChange}
        />
      </div>

      <Separator />

      {/* Display Settings */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Display Settings
        </Label>
        <DisplaySettings
          data={displaySettings}
          onChange={handleDisplayChange}
        />
      </div>

      {/* JSON toggle for structured editors */}
      {isStructured && (
        <>
          <Separator />
          <div className="space-y-3">
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowJson(!showJson)}
            >
              {showJson ? "Hide JSON" : "Show JSON"}
            </button>
            {showJson && (
              <JsonEditor content={content} onChange={handleContentChange} />
            )}
          </div>
        </>
      )}

      <Separator />

      {/* Delete Section */}
      <div className="pt-2 pb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={() => onDelete(section.id)}
        >
          <Trash2 className="size-3.5 mr-2" />
          Delete Section
        </Button>
      </div>
    </div>
  )
}

/**
 * Right-side drawer for inline section editing.
 * Slides in from the right, 320px wide.
 */
export function BuilderRightDrawer({
  section,
  onClose,
  onChange,
  onDelete,
  navbarSettings,
  onNavbarClose,
  onNavbarChange,
}: BuilderRightDrawerProps) {
  const showSection = section !== null && navbarSettings === null
  const showNavbar = navbarSettings !== null
  const isOpen = showSection || showNavbar

  const typeLabel = section
    ? sectionTypeLabels[section.sectionType] ?? section.sectionType
    : ""

  const title = showNavbar ? "Navbar" : `Edit ${typeLabel}`
  const handleClose = showNavbar ? onNavbarClose : onClose

  return (
    <div
      className={cn(
        "h-full bg-background border-l flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "w-[320px] opacity-100" : "w-0 opacity-0",
      )}
    >
      {isOpen && (
        <>
          {/* Header */}
          <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground truncate pr-2">
              {title}
            </h3>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-full text-muted-foreground shrink-0"
              onClick={handleClose}
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4">
              {showNavbar && navbarSettings && (
                <NavbarEditor
                  settings={navbarSettings}
                  onChange={onNavbarChange}
                />
              )}
              {showSection && section && (
                <SectionEditorInline
                  key={section.id}
                  section={section}
                  onChange={onChange}
                  onDelete={onDelete}
                />
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
