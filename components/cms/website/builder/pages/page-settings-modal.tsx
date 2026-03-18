"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Search, Trash2 } from "lucide-react"
import type { PageType, PageLayout } from "@/lib/db/types"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageSettingsData {
  id: string
  slug: string
  title: string
  pageType: PageType
  layout: PageLayout
  isHomepage: boolean
  isPublished: boolean
  metaTitle: string | null
  metaDescription: string | null
  ogImageUrl?: string | null
  canonicalUrl?: string | null
  noIndex?: boolean
}

export interface PageSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: PageSettingsData | null
  onSave: (data: Partial<PageSettingsData>) => void
  onDelete: (pageId: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_TYPE_OPTIONS: { value: PageType; label: string }[] = [
  { value: "STANDARD", label: "Standard" },
  { value: "LANDING", label: "Landing" },
  { value: "MINISTRY", label: "Ministry" },
  { value: "CAMPUS", label: "Campus" },
  { value: "SYSTEM", label: "System" },
]

const PAGE_LAYOUT_OPTIONS: { value: PageLayout; label: string }[] = [
  { value: "DEFAULT", label: "Default" },
  { value: "FULL_WIDTH", label: "Full Width" },
  { value: "NARROW", label: "Narrow" },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ---------------------------------------------------------------------------
// Inner form (receives `page` as initial values, resets via `key`)
// ---------------------------------------------------------------------------

interface PageSettingsFormProps {
  page: PageSettingsData
  onSave: (data: Partial<PageSettingsData>) => void
  onDelete: (pageId: string) => void
  onOpenChange: (open: boolean) => void
}

function PageSettingsForm({
  page,
  onSave,
  onDelete,
  onOpenChange,
}: PageSettingsFormProps) {
  // Form state initialized from page prop -- the parent uses key={page.id}
  // to re-mount this form when the page changes, avoiding useEffect.
  const [title, setTitle] = useState(page.title)
  const [slug, setSlug] = useState(page.slug)
  const [pageType, setPageType] = useState<PageType>(page.pageType)
  const [layout, setLayout] = useState<PageLayout>(page.layout)
  const [isHomepage, setIsHomepage] = useState(page.isHomepage)
  const [metaTitle, setMetaTitle] = useState(page.metaTitle ?? "")
  const [metaDescription, setMetaDescription] = useState(
    page.metaDescription ?? ""
  )
  const [ogImageUrl, setOgImageUrl] = useState(page.ogImageUrl ?? "")
  const [canonicalUrl, setCanonicalUrl] = useState(page.canonicalUrl ?? "")
  const [noIndex, setNoIndex] = useState(page.noIndex ?? false)

  // UI state
  const [seoOpen, setSeoOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Auto-generate slug from title (unless manually edited)
  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      if (!slugManuallyEdited) {
        setSlug(slugify(value))
      }
    },
    [slugManuallyEdited]
  )

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    setSlug(slugify(value))
  }

  const handleSave = () => {
    onSave({
      id: page.id,
      title,
      slug,
      pageType,
      layout,
      isHomepage,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      ogImageUrl: ogImageUrl || null,
      canonicalUrl: canonicalUrl || null,
      noIndex,
    })
    onOpenChange(false)
  }

  const handleDelete = () => {
    onDelete(page.id)
    setShowDeleteConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Page Settings</DialogTitle>
        <DialogDescription>
          Configure settings for this page.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 py-1">
        {/* Page Title */}
        <div className="space-y-1.5">
          <Label htmlFor="page-title">Page Title</Label>
          <Input
            id="page-title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. About Us"
          />
        </div>

        {/* URL Slug */}
        <div className="space-y-1.5">
          <Label htmlFor="page-slug">URL Slug</Label>
          <div className="flex rounded-md shadow-sm">
            <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
              /
            </span>
            <Input
              id="page-slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="rounded-l-none"
              placeholder="about-us"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The URL path for this page on your website.
          </p>
        </div>

        {/* Page Type */}
        <div className="space-y-1.5">
          <Label htmlFor="page-type">Page Type</Label>
          <Select
            value={pageType}
            onValueChange={(v) => setPageType(v as PageType)}
          >
            <SelectTrigger id="page-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Layout */}
        <div className="space-y-1.5">
          <Label htmlFor="page-layout">Layout</Label>
          <Select
            value={layout}
            onValueChange={(v) => setLayout(v as PageLayout)}
          >
            <SelectTrigger id="page-layout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_LAYOUT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Homepage toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is-homepage" className="cursor-pointer">
              Set as Homepage
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              This page will load at the root URL.
            </p>
          </div>
          <Switch
            id="is-homepage"
            checked={isHomepage}
            onCheckedChange={setIsHomepage}
          />
        </div>

        <Separator />

        {/* SEO Section (collapsible) */}
        <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-sm font-medium hover:text-foreground transition-colors py-1">
            {seoOpen ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
            <Search className="size-4 text-muted-foreground" />
            SEO Settings
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-4 pt-3">
            {/* Meta Title */}
            <div className="space-y-1.5">
              <Label htmlFor="meta-title">Meta Title</Label>
              <Input
                id="meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Override page title for search engines"
              />
              <p className="text-xs text-muted-foreground">
                {metaTitle.length}/60 characters recommended
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5">
              <Label htmlFor="meta-description">Meta Description</Label>
              <Textarea
                id="meta-description"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Brief description for search engine results"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {metaDescription.length}/160 characters recommended
              </p>
            </div>

            {/* OG Image URL */}
            <div className="space-y-1.5">
              <Label htmlFor="og-image">OG Image URL</Label>
              <Input
                id="og-image"
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">
                Image shown when sharing on social media.
              </p>
            </div>

            {/* Canonical URL */}
            <div className="space-y-1.5">
              <Label htmlFor="canonical-url">Canonical URL</Label>
              <Input
                id="canonical-url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://example.com/original-page"
              />
              <p className="text-xs text-muted-foreground">
                Set if this page is a duplicate of another URL.
              </p>
            </div>

            {/* No-index toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="no-index" className="cursor-pointer">
                  Hide from search engines
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Adds a noindex tag to prevent indexing.
                </p>
              </div>
              <Switch
                id="no-index"
                checked={noIndex}
                onCheckedChange={setNoIndex}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <DialogFooter className="flex justify-between sm:justify-between w-full">
        {!page.isHomepage ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="size-4 mr-1.5" />
            Delete
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            Save Changes
          </Button>
        </div>
      </DialogFooter>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{page.title}&quot; and all its
              sections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main component (wrapper with Dialog)
// ---------------------------------------------------------------------------

export function PageSettingsModal({
  open,
  onOpenChange,
  page,
  onSave,
  onDelete,
}: PageSettingsModalProps) {
  if (!page) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <PageSettingsForm
          key={page.id}
          page={page}
          onSave={onSave}
          onDelete={onDelete}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  )
}
