"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Plus,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Save,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { SectionPickerDialog, sectionTypeLabels } from "@/components/cms/website/pages/section-picker-dialog"
import { SectionEditorDialog } from "@/components/cms/website/pages/section-editor-dialog"
import { cn } from "@/lib/utils"

interface PageSection {
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

interface PageData {
  id: string
  slug: string
  title: string
  pageType: string
  layout: string
  isHomepage: boolean
  isPublished: boolean
  publishedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  canonicalUrl: string | null
  noIndex: boolean
  sortOrder: number
  sections: PageSection[]
  updatedAt: string
  createdAt: string
}

const pageTypeLabels: Record<string, string> = {
  STANDARD: "Standard",
  LANDING: "Landing",
  MINISTRY: "Ministry",
  CAMPUS: "Campus",
  SYSTEM: "System",
}

export default function PageEditorPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Page metadata form state
  const [title, setTitle] = useState("")
  const [pageSlug, setPageSlug] = useState("")
  const [layout, setLayout] = useState("DEFAULT")
  const [isHomepage, setIsHomepage] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [ogImageUrl, setOgImageUrl] = useState("")
  const [canonicalUrl, setCanonicalUrl] = useState("")
  const [noIndex, setNoIndex] = useState(false)

  // Section state
  const [sections, setSections] = useState<PageSection[]>([])
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<PageSection | null>(null)
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<PageSection | null>(null)
  const [seoOpen, setSeoOpen] = useState(false)

  const fetchPage = useCallback(() => {
    setLoading(true)
    fetch(`/api/v1/pages/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          const p = json.data as PageData
          setPage(p)
          setTitle(p.title)
          setPageSlug(p.slug)
          setLayout(p.layout)
          setIsHomepage(p.isHomepage)
          setIsPublished(p.isPublished)
          setMetaTitle(p.metaTitle ?? "")
          setMetaDescription(p.metaDescription ?? "")
          setOgImageUrl(p.ogImageUrl ?? "")
          setCanonicalUrl(p.canonicalUrl ?? "")
          setNoIndex(p.noIndex)
          setSections(p.sections ?? [])
        }
      })
      .catch((err) => console.error("Failed to fetch page:", err))
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  // Save page metadata
  async function handleSave() {
    if (!page) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/pages/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: pageSlug,
          layout,
          isHomepage,
          isPublished,
          metaTitle: metaTitle || null,
          metaDescription: metaDescription || null,
          ogImageUrl: ogImageUrl || null,
          canonicalUrl: canonicalUrl || null,
          noIndex,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setPage(json.data)
        setSections(json.data.sections ?? [])
        // If slug changed, navigate to new URL
        if (json.data.slug !== slug) {
          router.replace(`/cms/website/pages/${json.data.slug}`)
        }
      } else {
        console.error("Failed to save page:", json.error)
      }
    } catch (err) {
      console.error("Failed to save page:", err)
    } finally {
      setSaving(false)
    }
  }

  // Toggle publish
  async function handleTogglePublish() {
    if (!page) return
    const newStatus = !isPublished
    setIsPublished(newStatus)
    try {
      const res = await fetch(`/api/v1/pages/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublished: newStatus,
          publishedAt: newStatus ? new Date().toISOString() : null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setPage(json.data)
        setSections(json.data.sections ?? [])
      } else {
        setIsPublished(!newStatus)
        console.error("Failed to toggle publish:", json.error)
      }
    } catch (err) {
      setIsPublished(!newStatus)
      console.error("Failed to toggle publish:", err)
    }
  }

  // Add section
  async function handleAddSection(sectionType: string) {
    if (!page) return
    try {
      const res = await fetch(`/api/v1/pages/${slug}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType,
          sortOrder: sections.length,
          content: {},
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSections((prev) => [...prev, json.data])
      } else {
        console.error("Failed to add section:", json.error)
      }
    } catch (err) {
      console.error("Failed to add section:", err)
    }
  }

  // Update section
  async function handleUpdateSection(id: string, data: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/v1/pages/${slug}/sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        setSections((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...json.data } : s))
        )
      } else {
        console.error("Failed to update section:", json.error)
      }
    } catch (err) {
      console.error("Failed to update section:", err)
    }
  }

  // Delete section
  async function handleDeleteSection() {
    if (!deleteSectionTarget) return
    const id = deleteSectionTarget.id
    try {
      const res = await fetch(`/api/v1/pages/${slug}/sections/${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        setSections((prev) => prev.filter((s) => s.id !== id))
      } else {
        console.error("Failed to delete section:", json.error)
      }
    } catch (err) {
      console.error("Failed to delete section:", err)
    } finally {
      setDeleteSectionTarget(null)
    }
  }

  // Toggle section visibility
  async function handleToggleVisibility(section: PageSection) {
    const newVisible = !section.visible
    // Optimistic update
    setSections((prev) =>
      prev.map((s) => (s.id === section.id ? { ...s, visible: newVisible } : s))
    )
    try {
      const res = await fetch(`/api/v1/pages/${slug}/sections/${section.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: newVisible }),
      })
      const json = await res.json()
      if (!json.success) {
        // Revert on failure
        setSections((prev) =>
          prev.map((s) => (s.id === section.id ? { ...s, visible: !newVisible } : s))
        )
        console.error("Failed to toggle visibility:", json.error)
      }
    } catch (err) {
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, visible: !newVisible } : s))
      )
      console.error("Failed to toggle visibility:", err)
    }
  }

  // Move section up/down
  async function handleMoveSection(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sections.length) return

    const reordered = [...sections]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)
    // Update sort orders
    const withOrder = reordered.map((s, i) => ({ ...s, sortOrder: i }))
    setSections(withOrder)

    try {
      const res = await fetch(`/api/v1/pages/${slug}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: withOrder.map((s) => s.id) }),
      })
      const json = await res.json()
      if (!json.success) {
        console.error("Failed to reorder sections:", json.error)
        fetchPage() // Revert by re-fetching
      }
    } catch (err) {
      console.error("Failed to reorder sections:", err)
      fetchPage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!page) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cms/website/pages">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Page Not Found</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          This page doesn&apos;t exist or has been deleted.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cms/website/pages">
            <ArrowLeft />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              {page.title}
            </h1>
            <Badge variant={isPublished ? "default" : "secondary"}>
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleTogglePublish}>
            {isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 gap-6 min-h-0">
        {/* Left column — Sections */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-4 p-0.5 -m-0.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Sections</h2>
            <Badge variant="outline" className="text-xs">
              {sections.length} section{sections.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center">
              <p className="text-muted-foreground text-sm mb-3">
                No sections yet. Add your first section to start building this page.
              </p>
              <Button onClick={() => setSectionPickerOpen(true)}>
                <Plus className="size-4" />
                Add Section
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={cn(
                    "rounded-xl border bg-card p-4",
                    !section.visible && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Section type label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {sectionTypeLabels[section.sectionType] ??
                            section.sectionType}
                        </span>
                        {section.label && (
                          <span className="text-xs text-muted-foreground truncate">
                            {section.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {section.colorScheme}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4">
                          {section.paddingY}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleVisibility(section)}
                        aria-label={section.visible ? "Hide section" : "Show section"}
                      >
                        {section.visible ? (
                          <Eye className="size-4" />
                        ) : (
                          <EyeOff className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleMoveSection(index, "up")}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleMoveSection(index, "down")}
                        disabled={index === sections.length - 1}
                        aria-label="Move down"
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingSection(section)}
                        aria-label="Edit section"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteSectionTarget(section)}
                        aria-label="Delete section"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sections.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSectionPickerOpen(true)}
            >
              <Plus className="size-4" />
              Add Section
            </Button>
          )}
        </div>

        {/* Right column — Page metadata sidebar */}
        <div className="w-72 shrink-0 space-y-6">
          {/* Page Settings */}
          <div className="rounded-xl border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Page Settings</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="page-title">Title</Label>
                <Input
                  id="page-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="page-slug">Slug</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground shrink-0">/</span>
                  <Input
                    id="page-slug"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="page-slug"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Page Type (read-only) */}
              <div className="space-y-2">
                <Label>Page Type</Label>
                <Badge variant="secondary">
                  {pageTypeLabels[page.pageType] ?? page.pageType}
                </Badge>
              </div>

              {/* Layout */}
              <div className="space-y-2">
                <Label htmlFor="page-layout">Layout</Label>
                <Select value={layout} onValueChange={setLayout}>
                  <SelectTrigger id="page-layout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">Default</SelectItem>
                    <SelectItem value="FULL_WIDTH">Full Width</SelectItem>
                    <SelectItem value="NARROW">Narrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Homepage */}
              <div className="flex items-center justify-between">
                <Label htmlFor="page-homepage">Homepage</Label>
                <Switch
                  id="page-homepage"
                  checked={isHomepage}
                  onCheckedChange={setIsHomepage}
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
            <div className="rounded-xl border bg-card">
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 border-b hover:bg-muted/50 transition-colors rounded-t-xl">
                <h3 className="text-sm font-semibold">SEO</h3>
                <ChevronRight
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    seoOpen && "rotate-90"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 space-y-4">
                  {/* Meta Title */}
                  <div className="space-y-2">
                    <Label htmlFor="meta-title">Meta Title</Label>
                    <Input
                      id="meta-title"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Page title for search engines"
                    />
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-2">
                    <Label htmlFor="meta-description">Meta Description</Label>
                    <Textarea
                      id="meta-description"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Brief description for search engines..."
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      {metaDescription.length}/160 characters
                    </p>
                  </div>

                  {/* OG Image URL */}
                  <div className="space-y-2">
                    <Label htmlFor="og-image-url">OG Image URL</Label>
                    <Input
                      id="og-image-url"
                      value={ogImageUrl}
                      onChange={(e) => setOgImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Canonical URL */}
                  <div className="space-y-2">
                    <Label htmlFor="canonical-url">Canonical URL</Label>
                    <Input
                      id="canonical-url"
                      value={canonicalUrl}
                      onChange={(e) => setCanonicalUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>

                  {/* No-index */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="no-index"
                      checked={noIndex}
                      onCheckedChange={(checked) =>
                        setNoIndex(checked === true)
                      }
                    />
                    <Label htmlFor="no-index" className="font-normal text-sm">
                      No-index (hide from search engines)
                    </Label>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Publish status card */}
          <div className="rounded-xl border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Publishing</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="publish-toggle">Published</Label>
                <Switch
                  id="publish-toggle"
                  checked={isPublished}
                  onCheckedChange={(checked) => {
                    setIsPublished(checked)
                  }}
                />
              </div>
              {page.publishedAt && (
                <p className="text-xs text-muted-foreground">
                  Last published:{" "}
                  {new Date(page.publishedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Picker Dialog */}
      <SectionPickerDialog
        open={sectionPickerOpen}
        onOpenChange={setSectionPickerOpen}
        onSelect={handleAddSection}
      />

      {/* Section Editor Dialog */}
      <SectionEditorDialog
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
        section={editingSection}
        onSave={handleUpdateSection}
      />

      {/* Delete Section confirmation */}
      <AlertDialog
        open={!!deleteSectionTarget}
        onOpenChange={(open) => !open && setDeleteSectionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this{" "}
              {deleteSectionTarget
                ? sectionTypeLabels[deleteSectionTarget.sectionType] ??
                  deleteSectionTarget.sectionType
                : ""}{" "}
              section? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteSection}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
