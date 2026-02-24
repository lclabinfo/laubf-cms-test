"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Save,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  MoreHorizontal,
  Settings,
  ChevronUp,
  ChevronDown,
  Layout,
} from "lucide-react"

interface PageData {
  id: string
  title: string
  slug: string
  pageType: string
  layout: string
  isHomepage: boolean
  isPublished: boolean
  metaTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  noIndex: boolean
  sections: SectionData[]
}

interface SectionData {
  id: string
  sectionType: string
  label: string | null
  sortOrder: number
  visible: boolean
  colorScheme: string
  paddingY: string
  containerWidth: string
  content: Record<string, unknown>
}

const SECTION_TYPE_LABELS: Record<string, string> = {
  HERO_BANNER: "Hero Banner",
  PAGE_HERO: "Page Hero",
  TEXT_IMAGE_HERO: "Text + Image Hero",
  EVENTS_HERO: "Events Hero",
  MINISTRY_HERO: "Ministry Hero",
  MEDIA_TEXT: "Media + Text",
  MEDIA_GRID: "Media Grid",
  SPOTLIGHT_MEDIA: "Spotlight Media",
  PHOTO_GALLERY: "Photo Gallery",
  QUOTE_BANNER: "Quote Banner",
  CTA_BANNER: "Call to Action",
  ABOUT_DESCRIPTION: "About Description",
  STATEMENT: "Statement",
  ACTION_CARD_GRID: "Action Cards",
  HIGHLIGHT_CARDS: "Highlight Cards",
  FEATURE_BREAKDOWN: "Feature Breakdown",
  PATHWAY_CARD: "Pathway Cards",
  PILLARS: "Pillars",
  NEWCOMER: "Newcomer",
  ALL_MESSAGES: "All Messages",
  ALL_EVENTS: "All Events",
  ALL_BIBLE_STUDIES: "All Bible Studies",
  ALL_VIDEOS: "All Videos",
  UPCOMING_EVENTS: "Upcoming Events",
  EVENT_CALENDAR: "Event Calendar",
  RECURRING_MEETINGS: "Recurring Meetings",
  RECURRING_SCHEDULE: "Recurring Schedule",
  MINISTRY_INTRO: "Ministry Intro",
  MINISTRY_SCHEDULE: "Ministry Schedule",
  CAMPUS_CARD_GRID: "Campus Cards",
  DIRECTORY_LIST: "Directory List",
  MEET_TEAM: "Meet the Team",
  LOCATION_DETAIL: "Location Detail",
  FORM_SECTION: "Form",
  FAQ_SECTION: "FAQ",
  TIMELINE_SECTION: "Timeline",
  NAVBAR: "Navbar",
  FOOTER: "Footer",
  QUICK_LINKS: "Quick Links",
  DAILY_BREAD_FEATURE: "Daily Bread",
  CUSTOM_HTML: "Custom HTML",
  CUSTOM_EMBED: "Custom Embed",
}

const SECTION_CATEGORIES: { label: string; types: string[] }[] = [
  {
    label: "Hero Sections",
    types: ["HERO_BANNER", "PAGE_HERO", "TEXT_IMAGE_HERO", "EVENTS_HERO", "MINISTRY_HERO"],
  },
  {
    label: "Content",
    types: ["MEDIA_TEXT", "ABOUT_DESCRIPTION", "STATEMENT", "QUOTE_BANNER", "CTA_BANNER"],
  },
  {
    label: "Media",
    types: ["MEDIA_GRID", "SPOTLIGHT_MEDIA", "PHOTO_GALLERY"],
  },
  {
    label: "Cards & Grids",
    types: ["ACTION_CARD_GRID", "HIGHLIGHT_CARDS", "FEATURE_BREAKDOWN", "PATHWAY_CARD", "PILLARS", "NEWCOMER"],
  },
  {
    label: "Dynamic Content",
    types: ["ALL_MESSAGES", "ALL_EVENTS", "ALL_BIBLE_STUDIES", "ALL_VIDEOS", "UPCOMING_EVENTS", "EVENT_CALENDAR"],
  },
  {
    label: "Ministry & Campus",
    types: ["MINISTRY_INTRO", "MINISTRY_SCHEDULE", "CAMPUS_CARD_GRID", "DIRECTORY_LIST", "MEET_TEAM", "LOCATION_DETAIL"],
  },
  {
    label: "Interactive",
    types: ["FORM_SECTION", "FAQ_SECTION", "TIMELINE_SECTION"],
  },
  {
    label: "Custom",
    types: ["CUSTOM_HTML", "CUSTOM_EMBED"],
  },
]

export default function PageBuilderPage({
  params,
}: {
  params: Promise<{ pageId: string }>
}) {
  const { pageId } = use(params)
  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSectionPicker, setShowSectionPicker] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const [editingSection, setEditingSection] = useState<SectionData | null>(null)
  const [showPageSettings, setShowPageSettings] = useState(false)

  // Page settings form state
  const [pageForm, setPageForm] = useState({
    title: "",
    slug: "",
    pageType: "STANDARD",
    layout: "DEFAULT",
    isPublished: false,
    metaTitle: "",
    metaDescription: "",
    noIndex: false,
  })

  const fetchPage = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/pages/${pageId}`)
      if (res.ok) {
        const data = await res.json()
        setPage(data)
        setPageForm({
          title: data.title,
          slug: data.slug,
          pageType: data.pageType,
          layout: data.layout,
          isPublished: data.isPublished,
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          noIndex: data.noIndex,
        })
      }
    } catch (error) {
      console.error("Failed to fetch page:", error)
    } finally {
      setLoading(false)
    }
  }, [pageId])

  useEffect(() => {
    fetchPage()
  }, [fetchPage])

  const handleSavePageSettings = async () => {
    setSaving(true)
    try {
      await fetch(`/api/v1/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageForm),
      })
      setShowPageSettings(false)
      fetchPage()
    } catch (error) {
      console.error("Failed to save page settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSection = async (sectionType: string) => {
    try {
      const sortOrder = insertIndex ?? (page?.sections.length ?? 0)
      await fetch(`/api/v1/pages/${pageId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionType,
          sortOrder,
          content: {},
        }),
      })
      setShowSectionPicker(false)
      setInsertIndex(null)
      fetchPage()
    } catch (error) {
      console.error("Failed to add section:", error)
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section?")) return
    try {
      await fetch(`/api/v1/pages/${pageId}/sections/${sectionId}`, {
        method: "DELETE",
      })
      fetchPage()
    } catch (error) {
      console.error("Failed to delete section:", error)
    }
  }

  const handleToggleSectionVisibility = async (section: SectionData) => {
    try {
      await fetch(`/api/v1/pages/${pageId}/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !section.visible }),
      })
      fetchPage()
    } catch (error) {
      console.error("Failed to toggle visibility:", error)
    }
  }

  const handleMoveSection = async (sectionId: string, direction: "up" | "down") => {
    if (!page) return
    const sections = [...page.sections]
    const idx = sections.findIndex((s) => s.id === sectionId)
    if (idx < 0) return
    const newIdx = direction === "up" ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= sections.length) return

    const temp = sections[idx]
    sections[idx] = sections[newIdx]
    sections[newIdx] = temp

    const reordered = sections.map((s, i) => ({ id: s.id, sortOrder: i }))

    try {
      await fetch(`/api/v1/pages/${pageId}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: reordered }),
      })
      fetchPage()
    } catch (error) {
      console.error("Failed to reorder sections:", error)
    }
  }

  const handleSaveSectionSettings = async () => {
    if (!editingSection) return
    setSaving(true)
    try {
      await fetch(`/api/v1/pages/${pageId}/sections/${editingSection.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editingSection.label,
          colorScheme: editingSection.colorScheme,
          paddingY: editingSection.paddingY,
          containerWidth: editingSection.containerWidth,
          visible: editingSection.visible,
          content: editingSection.content,
        }),
      })
      setEditingSection(null)
      fetchPage()
    } catch (error) {
      console.error("Failed to save section:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-500">
        Loading page...
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-neutral-500">Page not found.</p>
        <Button variant="outline" asChild>
          <Link href="/cms/website/pages">Back to Pages</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cms/website/pages">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Pages
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">{page.title}</h1>
            <p className="text-xs text-neutral-500">/{page.slug}</p>
          </div>
          <Badge variant={page.isPublished ? "default" : "secondary"}>
            {page.isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPageSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Page Settings
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setInsertIndex(page.sections.length)
              setShowSectionPicker(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-3">
        {page.sections.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Layout className="h-10 w-10 text-neutral-300 mb-4" />
              <p className="text-sm text-neutral-500 mb-4">
                This page has no sections yet. Add your first section to start building.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setInsertIndex(0)
                  setShowSectionPicker(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </CardContent>
          </Card>
        ) : (
          page.sections.map((section, idx) => (
            <div key={section.id}>
              {/* Insert point before this section */}
              <div className="flex justify-center py-1">
                <button
                  onClick={() => {
                    setInsertIndex(idx)
                    setShowSectionPicker(true)
                  }}
                  className="text-neutral-300 hover:text-neutral-500 transition-colors"
                  title="Insert section here"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Card
                className={`transition-all ${
                  !section.visible ? "opacity-50" : ""
                }`}
              >
                <CardContent className="flex items-center gap-4 py-3 px-4">
                  <GripVertical className="h-4 w-4 text-neutral-300 cursor-grab shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {section.label ||
                          SECTION_TYPE_LABELS[section.sectionType] ||
                          section.sectionType}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {SECTION_TYPE_LABELS[section.sectionType] || section.sectionType}
                      </Badge>
                      {!section.visible && (
                        <Badge variant="secondary" className="text-[10px]">
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                      <span>Color: {section.colorScheme}</span>
                      <span>Padding: {section.paddingY}</span>
                      <span>Width: {section.containerWidth}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveSection(section.id, "up")}
                      disabled={idx === 0}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleMoveSection(section.id, "down")}
                      disabled={idx === page.sections.length - 1}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSection(section)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleSectionVisibility(section)}>
                          {section.visible ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" /> Hide
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" /> Show
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}

        {page.sections.length > 0 && (
          <div className="flex justify-center py-1">
            <button
              onClick={() => {
                setInsertIndex(page.sections.length)
                setShowSectionPicker(true)
              }}
              className="text-neutral-300 hover:text-neutral-500 transition-colors"
              title="Add section at end"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Section Picker Dialog */}
      <Dialog open={showSectionPicker} onOpenChange={setShowSectionPicker}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Section</DialogTitle>
            <DialogDescription>
              Choose a section type to add to your page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {SECTION_CATEGORIES.map((category) => (
              <div key={category.label}>
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                  {category.label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {category.types.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleAddSection(type)}
                      className="flex items-center gap-3 p-3 rounded-md border text-left hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
                    >
                      <Layout className="h-4 w-4 text-neutral-400 shrink-0" />
                      <span className="text-sm font-medium">
                        {SECTION_TYPE_LABELS[type] || type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Section Settings Sheet */}
      <Sheet open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Section Settings</SheetTitle>
            <SheetDescription>
              Configure display settings for this section.
            </SheetDescription>
          </SheetHeader>
          {editingSection && (
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  value={editingSection.label || ""}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, label: e.target.value })
                  }
                  placeholder="Custom label for this section"
                />
              </div>

              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <Select
                  value={editingSection.colorScheme}
                  onValueChange={(v) =>
                    setEditingSection({ ...editingSection, colorScheme: v })
                  }
                >
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
                <Label>Vertical Padding</Label>
                <Select
                  value={editingSection.paddingY}
                  onValueChange={(v) =>
                    setEditingSection({ ...editingSection, paddingY: v })
                  }
                >
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

              <div className="space-y-2">
                <Label>Container Width</Label>
                <Select
                  value={editingSection.containerWidth}
                  onValueChange={(v) =>
                    setEditingSection({ ...editingSection, containerWidth: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NARROW">Narrow</SelectItem>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="FULL">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Visible</Label>
                <Switch
                  checked={editingSection.visible}
                  onCheckedChange={(checked) =>
                    setEditingSection({ ...editingSection, visible: checked })
                  }
                />
              </div>

              <Separator />

              <Button onClick={handleSaveSectionSettings} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Page Settings Sheet */}
      <Sheet open={showPageSettings} onOpenChange={setShowPageSettings}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Page Settings</SheetTitle>
            <SheetDescription>
              Configure page properties, SEO, and publishing options.
            </SheetDescription>
          </SheetHeader>
          <Tabs defaultValue="general" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
              <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={pageForm.title}
                  onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                  value={pageForm.slug}
                  onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Page Type</Label>
                <Select
                  value={pageForm.pageType}
                  onValueChange={(v) => setPageForm({ ...pageForm, pageType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Standard</SelectItem>
                    <SelectItem value="LANDING">Landing Page</SelectItem>
                    <SelectItem value="MINISTRY">Ministry</SelectItem>
                    <SelectItem value="CAMPUS">Campus</SelectItem>
                    <SelectItem value="SYSTEM">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Layout</Label>
                <Select
                  value={pageForm.layout}
                  onValueChange={(v) => setPageForm({ ...pageForm, layout: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEFAULT">Default</SelectItem>
                    <SelectItem value="FULL_WIDTH">Full Width</SelectItem>
                    <SelectItem value="NARROW">Narrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Published</Label>
                <Switch
                  checked={pageForm.isPublished}
                  onCheckedChange={(checked) =>
                    setPageForm({ ...pageForm, isPublished: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={pageForm.metaTitle}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, metaTitle: e.target.value })
                  }
                  placeholder="Override page title for search engines"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={pageForm.metaDescription}
                  onChange={(e) =>
                    setPageForm({ ...pageForm, metaDescription: e.target.value })
                  }
                  placeholder="Brief description for search results"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>No Index</Label>
                  <p className="text-xs text-neutral-500">Hide from search engines</p>
                </div>
                <Switch
                  checked={pageForm.noIndex}
                  onCheckedChange={(checked) =>
                    setPageForm({ ...pageForm, noIndex: checked })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button
              onClick={handleSavePageSettings}
              disabled={saving}
              className="w-full"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
