"use client"

import { useCallback, useState } from "react"
import {
  X,
  Trash2,
  ChevronDown,
  FileText,
  LayoutGrid,
  Palette,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { SectionType } from "@/lib/db/types"
import { sectionTypeLabels } from "@/components/cms/website/pages/section-picker-dialog"
import {
  SectionContentEditor,
  SectionLayoutEditor,
  hasStructuredEditor,
  hasLayoutEditor,
} from "../section-editors"
import { JsonEditor } from "../section-editors/json-editor"
import {
  EditorSelect,
  EditorToggle,
  EditorInput,
  EditorButtonGroup,
} from "../section-editors/shared"
import {
  NavItemEditor,
  NavSettingsForm,
  type NavEditorMenuItem,
} from "../navigation-item-editor"
import { FooterMenuEditor } from "../footer-menu-editor"
import type { MenuItemData } from "../navigation/navigation-editor"
import type { PageSummary } from "../types"

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
  editingNavItemId?: string | null
  editingNavSettings?: boolean
  menuItems?: MenuItemData[]
  menuId?: string | null
  pages?: PageSummary[]
  /** @deprecated kept for call-site compat */
  churchId?: string
  initialNavbarSettings?: {
    scrollBehavior?: string
    solidColor?: string
    sticky?: boolean
    ctaLabel?: string
    ctaHref?: string
    ctaVisible?: boolean
  }
  onCloseNavItem?: () => void
  onNavItemUpdated?: () => void
  onNavSettingsClose?: () => void
  onNavSettingsUpdated?: () => void
  editingFooter?: boolean
  footerMenuId?: string | null
  footerMenuItems?: MenuItemData[]
  onFooterClose?: () => void
  onFooterUpdated?: () => void
}

// --- Panel types ---

type PanelId = "content" | "layout" | "style" | "advanced"

interface PanelDef {
  id: PanelId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const ALL_PANELS: PanelDef[] = [
  { id: "content", label: "Content", icon: FileText },
  { id: "layout", label: "Layout", icon: LayoutGrid },
  { id: "style", label: "Style", icon: Palette },
  { id: "advanced", label: "Advanced", icon: Settings },
]

// --- Panel Header ---

function PanelHeader({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-3 text-left border-b shrink-0 transition-colors duration-150",
        "text-xs font-semibold uppercase tracking-wider",
        active
          ? "bg-muted/60 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronDown
        className={cn(
          "size-3.5 shrink-0 transition-transform duration-200",
          active && "rotate-180"
        )}
      />
    </button>
  )
}

// --- Color Scheme Picker ---

function ColorSchemePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const schemes = [
    { value: "LIGHT", label: "Light", previewBg: "#ffffff", previewText: "#262626", borderIdle: "#e5e5e5" },
    { value: "DARK", label: "Dark", previewBg: "#0d0d0d", previewText: "#ffffff", borderIdle: "#404040" },
    { value: "BRAND", label: "Brand", previewBg: "var(--ws-color-primary, #1a1a2e)", previewText: "#ffffff", borderIdle: "#525252" },
  ]
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Color Scheme</Label>
      <div className="grid grid-cols-2 gap-2">
        {schemes.map((scheme) => {
          const selected = value === scheme.value
          return (
            <button
              key={scheme.value}
              type="button"
              onClick={() => onChange(scheme.value)}
              className={cn(
                "flex flex-col rounded-lg overflow-hidden transition-all cursor-pointer border-2",
                selected
                  ? "border-blue-600 ring-1 ring-blue-600/20"
                  : "border-transparent",
              )}
              style={{
                borderColor: selected ? undefined : scheme.borderIdle,
              }}
            >
              <div
                className="p-3 flex flex-col gap-1.5"
                style={{ backgroundColor: scheme.previewBg }}
              >
                <div className="h-1.5 w-3/4 rounded-full opacity-80" style={{ backgroundColor: scheme.previewText }} />
                <div className="h-1.5 w-full rounded-full opacity-50" style={{ backgroundColor: scheme.previewText }} />
                <div className="h-1.5 w-2/3 rounded-full opacity-30" style={{ backgroundColor: scheme.previewText }} />
              </div>
              <div className="px-3 py-1.5 text-xs font-medium text-center border-t">
                {scheme.label}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Accordion-based section editor.
 *
 * - Only one panel open at a time (clicking open panel closes it)
 * - Active panel fills all available vertical space
 * - Only the active panel's content scrolls (no outer scroll)
 * - Panels: Content, Layout (conditional), Style, Advanced
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
  const content = section.content ?? {}
  const [activePanel, setActivePanel] = useState<PanelId | null>("content")
  const [showJson, setShowJson] = useState(false)

  const handleContentChange = useCallback(
    (newContent: Record<string, unknown>) => {
      onChange({ content: newContent })
    },
    [onChange],
  )

  const updateDisplay = useCallback(
    (field: string, value: string | boolean) => {
      onChange({ [field]: value })
    },
    [onChange],
  )

  const isStructured = hasStructuredEditor(section.sectionType)
  const showLayout = hasLayoutEditor(section.sectionType)

  // All panels always shown — Layout has padding/width for every section
  const panels = ALL_PANELS

  const togglePanel = (id: PanelId) => {
    setActivePanel((prev) => (prev === id ? null : id))
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {panels.map(({ id, label, icon }) => {
        const isActive = activePanel === id
        return (
          <div
            key={id}
            className="flex flex-col min-h-0 overflow-hidden shrink-0"
            style={{
              flex: isActive ? "1 1 0%" : "0 0 auto",
              transition: "flex 200ms ease-out",
            }}
          >
            <PanelHeader
              label={label}
              icon={icon}
              active={isActive}
              onClick={() => togglePanel(id)}
            />
            {/* Always rendered — the flex transition slides it open/closed */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {isActive && (
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-6">
                    {/* --- Content --- */}
                    {id === "content" && (
                      <SectionContentEditor
                        sectionType={section.sectionType}
                        content={content}
                        onChange={handleContentChange}
                      />
                    )}

                    {/* --- Layout --- */}
                    {id === "layout" && (
                      <>
                        {/* Section-specific layout fields (variants, alignment, etc.) */}
                        {showLayout && (
                          <>
                            <SectionLayoutEditor
                              sectionType={section.sectionType}
                              content={content}
                              onChange={handleContentChange}
                            />
                            <Separator />
                          </>
                        )}

                        {/* Shared layout fields (all sections) */}
                        <EditorSelect
                          label="Vertical Padding"
                          value={section.paddingY}
                          onValueChange={(v) => updateDisplay("paddingY", v)}
                          options={[
                            { value: "NONE", label: "None" },
                            { value: "COMPACT", label: "Compact" },
                            { value: "DEFAULT", label: "Default" },
                            { value: "SPACIOUS", label: "Spacious" },
                          ]}
                        />
                        <EditorSelect
                          label="Container Width"
                          value={section.containerWidth}
                          onValueChange={(v) => updateDisplay("containerWidth", v)}
                          options={[
                            { value: "NARROW", label: "Narrow" },
                            { value: "STANDARD", label: "Standard" },
                            { value: "FULL", label: "Full" },
                          ]}
                        />
                      </>
                    )}

                    {/* --- Style --- */}
                    {id === "style" && (
                      <>
                        <ColorSchemePicker
                          value={section.colorScheme}
                          onChange={(v) => updateDisplay("colorScheme", v)}
                        />

                        {/* Overlay controls — hero fullwidth only */}
                        {section.sectionType === "HERO_BANNER" && (content.layout as string || "fullwidth") === "fullwidth" && (
                          <>
                            <Separator />
                            <EditorButtonGroup
                              label="Overlay"
                              value={(content.overlayType as string) || "gradient"}
                              onChange={(v) => handleContentChange({ ...content, overlayType: v })}
                              options={[
                                { value: "gradient", label: "Gradient" },
                                { value: "solid", label: "Solid" },
                                { value: "none", label: "None" },
                              ]}
                              size="sm"
                            />
                            {((content.overlayType as string) || "gradient") !== "none" && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs text-muted-foreground">
                                    Overlay Opacity
                                  </Label>
                                  <span className="text-xs tabular-nums text-muted-foreground">
                                    {Math.round(((content.overlayOpacity as number) ?? 0.6) * 100)}%
                                  </span>
                                </div>
                                <Slider
                                  value={[((content.overlayOpacity as number) ?? 0.6) * 100]}
                                  onValueChange={([v]) =>
                                    handleContentChange({ ...content, overlayOpacity: v / 100 })
                                  }
                                  min={0}
                                  max={100}
                                  step={5}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* --- Advanced --- */}
                    {id === "advanced" && (
                      <>
                        <EditorToggle
                          label="Animations"
                          description="Enable scroll and entrance animations"
                          checked={section.enableAnimations}
                          onCheckedChange={(v) => updateDisplay("enableAnimations", v)}
                        />
                        <EditorToggle
                          label="Visible"
                          description="Hidden sections are only visible in the builder"
                          checked={section.visible}
                          onCheckedChange={(v) => updateDisplay("visible", v)}
                        />
                        <Separator />
                        <EditorInput
                          label="Section Label"
                          value={section.label ?? ""}
                          onChange={(val) => onChange({ label: val || null })}
                          placeholder="Optional admin-only label"
                          description="An internal label to help you identify this section. Not shown on the website."
                        />
                        {isStructured && (
                          <>
                            <Separator />
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
                          </>
                        )}
                        <Separator />
                        <div className="pt-2 pb-2">
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
                      </>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// --- Helper functions ---

function findMenuItemById(items: MenuItemData[], id: string): MenuItemData | null {
  for (const item of items) {
    if (item.id === id) return item
    if (item.children) {
      const found = findMenuItemById(item.children, id)
      if (found) return found
    }
  }
  return null
}

function inferNavItemType(item: MenuItemData): import("../navigation-item-editor").NavItemType {
  if (item.parentId === null) {
    const hasChildren = (item.children?.length ?? 0) > 0
    if (item.href && hasChildren) return "top-level-page"
    if (!item.href && hasChildren) return "top-level-folder"
    if (item.href) return "page"
    return "top-level-folder"
  }
  if (item.featuredTitle && item.sortOrder >= 99) return "featured"
  if (item.isExternal) return "external-link"
  return "page"
}

/**
 * Right-side drawer (320px). For section editing, the drawer is:
 * - Fixed header (title + close)
 * - Accordion that fills all remaining space (no outer scroll)
 */
export function BuilderRightDrawer({
  section,
  onClose,
  onChange,
  onDelete,
  editingNavItemId,
  editingNavSettings,
  menuItems,
  menuId,
  pages,
  churchId: _churchId,
  initialNavbarSettings,
  onCloseNavItem,
  onNavItemUpdated,
  onNavSettingsClose,
  onNavSettingsUpdated,
  editingFooter,
  footerMenuId,
  footerMenuItems,
  onFooterClose,
  onFooterUpdated,
}: BuilderRightDrawerProps) {
  const editingNavItem = editingNavItemId && menuItems
    ? findMenuItemById(menuItems, editingNavItemId)
    : null

  const showNavItem = editingNavItem !== null
  const showNavSettings = !!(editingNavSettings && !showNavItem)
  const showFooter = !!(editingFooter && !showNavItem && !showNavSettings)
  const showSection = section !== null && !showNavItem && !showNavSettings && !showFooter
  const isOpen = showSection || showNavItem || showNavSettings || showFooter

  const typeLabel = section
    ? sectionTypeLabels[section.sectionType] ?? section.sectionType
    : ""

  const showSharedHeader = showSection
  const title = `Edit ${typeLabel}`

  return (
    <div
      className={cn(
        "h-full bg-background border-l flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "w-[320px] opacity-100" : "w-0 opacity-0",
      )}
    >
      {isOpen && (
        <>
          {showNavItem && editingNavItem && menuId && pages && (
            <NavItemEditor
              item={editingNavItem as NavEditorMenuItem}
              itemType={inferNavItemType(editingNavItem)}
              pages={pages}
              menuId={menuId}
              onClose={onCloseNavItem ?? (() => {})}
              onItemUpdated={onNavItemUpdated ?? (() => {})}
            />
          )}

          {showNavSettings && (
            <NavSettingsForm
              initialSettings={initialNavbarSettings}
              onClose={onNavSettingsClose ?? (() => {})}
              onSettingsUpdated={onNavSettingsUpdated}
            />
          )}

          {showFooter && footerMenuId && (
            <FooterMenuEditor
              menuId={footerMenuId}
              items={footerMenuItems ?? []}
              onClose={onFooterClose ?? (() => {})}
              onUpdated={onFooterUpdated ?? (() => {})}
            />
          )}

          {showSharedHeader && (
            <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/30 shrink-0">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-foreground truncate pr-2">
                {title}
              </h3>
              <Button
                variant="ghost"
                size="icon-xs"
                className="rounded-full text-muted-foreground shrink-0"
                onClick={onClose}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )}

          {showSection && section && (
            <SectionEditorInline
              key={section.id}
              section={section}
              onChange={onChange}
              onDelete={onDelete}
            />
          )}
        </>
      )}
    </div>
  )
}
