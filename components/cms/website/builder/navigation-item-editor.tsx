"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import {
  FileText,
  ExternalLink,
  Star,
  Folder,
  Settings,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  EditorInput,
  EditorTextarea,
  EditorToggle,
  EditorSelect,
  EditorButtonGroup,
} from "./section-editors/shared/field-primitives"
import { ImagePickerField } from "./section-editors/shared/media-fields"
import type { PageSummary } from "./types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The MenuItem shape expected by the editor (matches API response). */
export interface NavEditorMenuItem {
  id: string
  menuId: string
  label: string
  href: string | null
  description: string | null
  iconName: string | null
  openInNewTab: boolean
  isExternal: boolean
  parentId: string | null
  groupLabel: string | null
  featuredImage: string | null
  featuredTitle: string | null
  featuredDescription: string | null
  featuredHref: string | null
  scheduleMeta: string | null
  sortOrder: number
  isVisible: boolean
  children?: NavEditorMenuItem[]
}

/** Inferred item type from field combinations */
export type NavItemType =
  | "page"
  | "external-link"
  | "featured"
  | "top-level-folder"
  | "top-level-page"

/** Props for the main NavItemEditor router */
export interface NavItemEditorProps {
  item: NavEditorMenuItem
  itemType: NavItemType
  pages: PageSummary[]
  menuId: string
  onClose: () => void
  onItemUpdated: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getItemTypeLabel(type: NavItemType): string {
  switch (type) {
    case "page":
      return "Page Link"
    case "external-link":
      return "External Link"
    case "featured":
      return "Featured Item"
    case "top-level-folder":
      return "Dropdown Folder"
    case "top-level-page":
      return "Page + Dropdown"
  }
}

function getItemTypeIcon(type: NavItemType) {
  switch (type) {
    case "page":
      return FileText
    case "external-link":
      return ExternalLink
    case "featured":
      return Star
    case "top-level-folder":
      return Folder
    case "top-level-page":
      return FileText
  }
}

function getItemTypeBadge(type: NavItemType): string | null {
  switch (type) {
    case "external-link":
      return "external"
    case "featured":
      return "featured"
    case "top-level-folder":
      return "dropdown"
    case "top-level-page":
      return "page + dropdown"
    default:
      return null
  }
}

/** Build page options for EditorSelect */
function buildPageOptions(pages: PageSummary[]) {
  return pages
    .filter((p) => p.isPublished)
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => ({
      value: p.slug.startsWith("/") ? p.slug : `/${p.slug}`,
      label: p.title,
    }))
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function patchMenuItem(
  menuId: string,
  itemId: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/menus/${menuId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message ||
          "Failed to save",
      )
    }
    return true
  } catch (error) {
    console.error("patchMenuItem error:", error)
    toast.error(
      error instanceof Error ? error.message : "Failed to save changes",
    )
    return false
  }
}

async function patchNavbarSettings(
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    const res = await fetch("/api/v1/site-settings/navbar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(
        (err as { error?: { message?: string } })?.error?.message ||
          "Failed to save",
      )
    }
    return true
  } catch (error) {
    console.error("patchNavbarSettings error:", error)
    toast.error(
      error instanceof Error ? error.message : "Failed to save settings",
    )
    return false
  }
}

// ---------------------------------------------------------------------------
// Editor Header (shared across all forms)
// ---------------------------------------------------------------------------

function EditorHeader({
  title,
  type,
  onClose,
}: {
  title: string
  type: NavItemType | "settings"
  onClose: () => void
}) {
  const badge = type !== "settings" ? getItemTypeBadge(type) : null
  const Icon = type !== "settings" ? getItemTypeIcon(type) : Settings

  return (
    <div className="h-14 border-b flex items-center gap-2 px-4 bg-muted/30 shrink-0">
      <Button
        variant="ghost"
        size="icon-xs"
        className="rounded-full text-muted-foreground shrink-0"
        onClick={onClose}
      >
        <ArrowLeft className="size-3.5" />
      </Button>
      <Icon className="size-3.5 text-muted-foreground shrink-0" />
      <span className="font-semibold text-xs uppercase tracking-wider text-foreground truncate">
        {title}
      </span>
      {badge && (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 shrink-0"
        >
          {badge}
        </Badge>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Save Button (shared)
// ---------------------------------------------------------------------------

function SaveButton({
  saving,
  onClick,
}: {
  saving: boolean
  onClick: () => void
}) {
  return (
    <div className="pt-2 pb-4">
      <Button
        className="w-full"
        size="sm"
        onClick={onClick}
        disabled={saving}
      >
        {saving && <Loader2 className="size-3.5 mr-2 animate-spin" />}
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1. NavPageItemForm
// ---------------------------------------------------------------------------

function NavPageItemForm({
  item,
  pages,
  menuId,
  onItemUpdated,
}: {
  item: NavEditorMenuItem
  pages: PageSummary[]
  menuId: string
  onItemUpdated: () => void
}) {
  const [label, setLabel] = useState(item.label)
  const [href, setHref] = useState(item.href ?? "")
  const [description, setDescription] = useState(item.description ?? "")
  const [isVisible, setIsVisible] = useState(item.isVisible)
  const [saving, setSaving] = useState(false)

  const pageOptions = buildPageOptions(pages)

  const handleSave = useCallback(async () => {
    setSaving(true)
    const ok = await patchMenuItem(menuId, item.id, {
      label,
      href: href || null,
      description: description || null,
      isVisible,
    })
    setSaving(false)
    if (ok) {
      toast.success("Item saved")
      onItemUpdated()
    }
  }, [menuId, item.id, label, href, description, isVisible, onItemUpdated])

  return (
    <div className="space-y-4">
      <EditorInput
        label="Label"
        value={label}
        onChange={setLabel}
        placeholder="e.g. Events"
      />

      <EditorSelect
        label="Page"
        value={href}
        onValueChange={setHref}
        options={pageOptions}
        placeholder="Select a page..."
      />

      <EditorInput
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Short subtitle for dropdown"
      />

      <Separator />

      <EditorToggle
        label="Visible"
        description="Show this item in the navigation"
        checked={isVisible}
        onCheckedChange={setIsVisible}
      />

      <Separator />

      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. NavExternalLinkForm
// ---------------------------------------------------------------------------

function NavExternalLinkForm({
  item,
  menuId,
  onItemUpdated,
}: {
  item: NavEditorMenuItem
  menuId: string
  onItemUpdated: () => void
}) {
  const [label, setLabel] = useState(item.label)
  const [href, setHref] = useState(item.href ?? "")
  const [scheduleMeta, setScheduleMeta] = useState(item.scheduleMeta ?? "")
  const [description, setDescription] = useState(item.description ?? "")
  const [openInNewTab, setOpenInNewTab] = useState(item.openInNewTab)
  const [isVisible, setIsVisible] = useState(item.isVisible)
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    const ok = await patchMenuItem(menuId, item.id, {
      label,
      href: href || null,
      description: description || null,
      scheduleMeta: scheduleMeta || null,
      openInNewTab,
      isVisible,
    })
    setSaving(false)
    if (ok) {
      toast.success("Item saved")
      onItemUpdated()
    }
  }, [
    menuId,
    item.id,
    label,
    href,
    description,
    scheduleMeta,
    openInNewTab,
    isVisible,
    onItemUpdated,
  ])

  return (
    <div className="space-y-4">
      <EditorInput
        label="Label"
        value={label}
        onChange={setLabel}
        placeholder="e.g. Sunday Livestream"
      />

      <EditorInput
        label="URL"
        value={href}
        onChange={setHref}
        type="url"
        placeholder="https://..."
      />

      <EditorInput
        label="Schedule"
        value={scheduleMeta}
        onChange={setScheduleMeta}
        placeholder="e.g. Mon-Fri @ 6 AM"
        description="Displayed alongside the link in the mega menu"
      />

      <EditorInput
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Short subtitle"
      />

      <Separator />

      <EditorToggle
        label="Open in new tab"
        checked={openInNewTab}
        onCheckedChange={setOpenInNewTab}
      />

      <EditorToggle
        label="Visible"
        description="Show this item in the navigation"
        checked={isVisible}
        onCheckedChange={setIsVisible}
      />

      <Separator />

      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. NavFeaturedItemForm
// ---------------------------------------------------------------------------

function NavFeaturedItemForm({
  item,
  menuId,
  onItemUpdated,
}: {
  item: NavEditorMenuItem
  menuId: string
  onItemUpdated: () => void
}) {
  const [featuredTitle, setFeaturedTitle] = useState(item.featuredTitle ?? "")
  const [featuredDescription, setFeaturedDescription] = useState(
    item.featuredDescription ?? "",
  )
  const [featuredHref, setFeaturedHref] = useState(item.featuredHref ?? "")
  const [featuredImage, setFeaturedImage] = useState(item.featuredImage ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    const ok = await patchMenuItem(menuId, item.id, {
      featuredTitle: featuredTitle || null,
      featuredDescription: featuredDescription || null,
      featuredHref: featuredHref || null,
      featuredImage: featuredImage || null,
    })
    setSaving(false)
    if (ok) {
      toast.success("Featured item saved")
      onItemUpdated()
    }
  }, [
    menuId,
    item.id,
    featuredTitle,
    featuredDescription,
    featuredHref,
    featuredImage,
    onItemUpdated,
  ])

  return (
    <div className="space-y-4">
      <ImagePickerField
        label="Image"
        value={featuredImage}
        onChange={setFeaturedImage}
      />

      <EditorInput
        label="Title"
        value={featuredTitle}
        onChange={setFeaturedTitle}
        placeholder="e.g. Ministry Overview"
      />

      <EditorTextarea
        label="Description"
        value={featuredDescription}
        onChange={setFeaturedDescription}
        placeholder="Brief description for the featured card"
        rows={3}
      />

      <EditorInput
        label="Link"
        value={featuredHref}
        onChange={setFeaturedHref}
        placeholder="/ministries"
      />

      <Separator />

      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 4. NavTopLevelForm
// ---------------------------------------------------------------------------

function NavTopLevelForm({
  item,
  pages,
  menuId,
  onItemUpdated,
}: {
  item: NavEditorMenuItem
  pages: PageSummary[]
  menuId: string
  onItemUpdated: () => void
}) {
  // Determine if this is a "folder only" (no href) or "page + dropdown" (has href)
  const initialType = item.href ? "page-dropdown" : "folder-dropdown"

  const [label, setLabel] = useState(item.label)
  const [topLevelType, setTopLevelType] = useState(initialType)
  const [href, setHref] = useState(item.href ?? "")
  const [isVisible, setIsVisible] = useState(item.isVisible)
  const [saving, setSaving] = useState(false)

  const pageOptions = buildPageOptions(pages)

  const handleSave = useCallback(async () => {
    setSaving(true)
    const data: Record<string, unknown> = {
      label,
      isVisible,
    }

    if (topLevelType === "page-dropdown") {
      data.href = href || null
    } else {
      // Folder only — clear href
      data.href = null
    }

    const ok = await patchMenuItem(menuId, item.id, data)
    setSaving(false)
    if (ok) {
      toast.success("Item saved")
      onItemUpdated()
    }
  }, [menuId, item.id, label, topLevelType, href, isVisible, onItemUpdated])

  return (
    <div className="space-y-4">
      <EditorInput
        label="Label"
        value={label}
        onChange={setLabel}
        placeholder="e.g. Our Church"
      />

      <EditorButtonGroup
        label="Type"
        value={topLevelType}
        onChange={setTopLevelType}
        options={[
          { value: "folder-dropdown", label: "Folder only" },
          { value: "page-dropdown", label: "Page + Dropdown" },
        ]}
        size="sm"
      />

      {topLevelType === "page-dropdown" && (
        <EditorSelect
          label="Landing page"
          value={href}
          onValueChange={setHref}
          options={pageOptions}
          placeholder="Select a page..."
        />
      )}

      <Separator />

      <EditorToggle
        label="Visible"
        description="Show this item in the navigation bar"
        checked={isVisible}
        onCheckedChange={setIsVisible}
      />

      <Separator />

      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// 5. NavSettingsForm
// ---------------------------------------------------------------------------

export interface NavSettingsFormProps {
  initialSettings?: {
    scrollBehavior?: string
    solidColor?: string
    sticky?: boolean
    ctaVisible?: boolean
    ctaLabel?: string
    ctaHref?: string
  }
  onClose: () => void
  onSettingsUpdated?: () => void
}

export function NavSettingsForm({
  initialSettings,
  onClose,
  onSettingsUpdated,
}: NavSettingsFormProps) {
  const [scrollBehavior, setScrollBehavior] = useState(
    initialSettings?.scrollBehavior ?? "transparent-to-solid",
  )
  const [solidColor, setSolidColor] = useState(
    initialSettings?.solidColor ?? "white",
  )
  const [sticky, setSticky] = useState(initialSettings?.sticky ?? true)
  const [ctaVisible, setCtaVisible] = useState(
    initialSettings?.ctaVisible ?? true,
  )
  const [ctaLabel, setCtaLabel] = useState(initialSettings?.ctaLabel ?? "")
  const [ctaHref, setCtaHref] = useState(initialSettings?.ctaHref ?? "")
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    const ok = await patchNavbarSettings({
      scrollBehavior,
      solidColor,
      sticky,
      ctaVisible,
      ctaLabel,
      ctaHref,
    })
    setSaving(false)
    if (ok) {
      toast.success("Navbar settings saved")
      onSettingsUpdated?.()
    }
  }, [
    scrollBehavior,
    solidColor,
    sticky,
    ctaVisible,
    ctaLabel,
    ctaHref,
    onSettingsUpdated,
  ])

  return (
    <div className="flex flex-col h-full">
      <EditorHeader title="Navbar Settings" type="settings" onClose={onClose} />

      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4 space-y-4">
          <EditorSelect
            label="Scroll behavior"
            value={scrollBehavior}
            onValueChange={setScrollBehavior}
            options={[
              {
                value: "transparent-to-solid",
                label: "Transparent over hero",
              },
              { value: "always-solid", label: "Always solid" },
              { value: "always-transparent", label: "Always transparent" },
            ]}
          />

          <EditorSelect
            label="Background color (solid state)"
            value={solidColor}
            onValueChange={setSolidColor}
            options={[
              { value: "white", label: "White" },
              { value: "dark", label: "Dark" },
              { value: "primary", label: "Primary" },
            ]}
          />

          <Separator />

          <EditorToggle
            label="Sticky navbar"
            description="Navbar stays fixed at the top on scroll"
            checked={sticky}
            onCheckedChange={setSticky}
          />

          <Separator />

          <EditorToggle
            label="CTA button visible"
            description="Show a call-to-action button in the navbar"
            checked={ctaVisible}
            onCheckedChange={setCtaVisible}
          />

          {ctaVisible && (
            <div className="space-y-4 pl-0">
              <EditorInput
                label="CTA label"
                value={ctaLabel}
                onChange={setCtaLabel}
                placeholder="e.g. I'm New"
              />

              <EditorInput
                label="CTA link"
                value={ctaHref}
                onChange={setCtaHref}
                placeholder="/im-new"
              />
            </div>
          )}

          <Separator />

          <SaveButton saving={saving} onClick={handleSave} />
        </div>
      </ScrollArea>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main NavItemEditor (router)
// ---------------------------------------------------------------------------

export function NavItemEditor({
  item,
  itemType,
  pages,
  menuId,
  onClose,
  onItemUpdated,
}: NavItemEditorProps) {
  const title = item.label || getItemTypeLabel(itemType)

  return (
    <div className="flex flex-col h-full">
      <EditorHeader title={title} type={itemType} onClose={onClose} />

      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="p-4">
          {itemType === "page" && (
            <NavPageItemForm
              item={item}
              pages={pages}
              menuId={menuId}
              onItemUpdated={onItemUpdated}
            />
          )}

          {itemType === "external-link" && (
            <NavExternalLinkForm
              item={item}
              menuId={menuId}
              onItemUpdated={onItemUpdated}
            />
          )}

          {itemType === "featured" && (
            <NavFeaturedItemForm
              item={item}
              menuId={menuId}
              onItemUpdated={onItemUpdated}
            />
          )}

          {(itemType === "top-level-folder" ||
            itemType === "top-level-page") && (
            <NavTopLevelForm
              item={item}
              pages={pages}
              menuId={menuId}
              onItemUpdated={onItemUpdated}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
