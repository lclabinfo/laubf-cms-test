"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BuilderTopbar } from "./builder-topbar"
import { BuilderSidebar } from "./builder-sidebar"
import { BuilderDrawer } from "./builder-drawer"
import { BuilderCanvas } from "./builder-canvas"
import { SectionPickerModal } from "./section-picker-modal"
import {
  SectionEditorModal,
  type SectionEditorData,
  type SectionEditorSaveData,
} from "./section-editor-modal"
import { PageTree } from "./page-tree"
import { PageSettingsModal, type PageSettingsData } from "./page-settings-modal"
import { AddPageModal } from "./add-page-modal"
import type {
  BuilderTool,
  DeviceMode,
  BuilderPage,
  BuilderSection,
  PageSummary,
} from "./types"
import type { SectionType } from "@/lib/db/types"

interface BuilderShellProps {
  page: BuilderPage
  allPages: PageSummary[]
  churchId: string
}

export function BuilderShell({ page, allPages, churchId }: BuilderShellProps) {
  const router = useRouter()
  const [activeTool, setActiveTool] = useState<BuilderTool>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop")
  const [sections, setSections] = useState<BuilderSection[]>(page.sections)
  const [pageData, setPageData] = useState<BuilderPage>(page)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pages, setPages] = useState<PageSummary[]>(allPages)

  // Section picker modal
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerInsertIndex, setPickerInsertIndex] = useState(-1)

  // Section editor modal
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<SectionEditorData | null>(null)

  // Page modals
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false)
  const [pageSettingsTarget, setPageSettingsTarget] = useState<PageSettingsData | null>(null)
  const [addPageOpen, setAddPageOpen] = useState(false)

  // Reset state when page prop changes (navigating to different page)
  useEffect(() => {
    setSections(page.sections)
    setPageData(page)
    setSelectedSectionId(null)
    setIsDirty(false)
  }, [page])

  // Sync allPages prop
  useEffect(() => {
    setPages(allPages)
  }, [allPages])

  const handleToolClick = useCallback(
    (tool: BuilderTool) => {
      setActiveTool((prev) => (prev === tool ? null : tool))
    },
    [],
  )

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Save page metadata
      const pageRes = await fetch(`/api/v1/pages/${pageData.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pageData.title,
          isPublished: pageData.isPublished,
        }),
      })
      if (!pageRes.ok) throw new Error("Failed to save page")

      // Reorder sections
      const sectionIds = sections.map((s) => s.id)
      const reorderRes = await fetch(`/api/v1/pages/${pageData.slug}/sections`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds }),
      })
      if (!reorderRes.ok) throw new Error("Failed to reorder sections")

      setIsDirty(false)
      toast.success("Page saved")
    } catch (err) {
      console.error("Save error:", err)
      toast.error("Failed to save page")
    } finally {
      setIsSaving(false)
    }
  }, [pageData, sections])

  // Use a ref to always have the latest handleSave without re-subscribing the effect
  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedSectionId) {
          setSelectedSectionId(null)
        } else if (activeTool) {
          setActiveTool(null)
        }
      }
      // Cmd/Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSaveRef.current()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedSectionId, activeTool])

  // -------------------------------------------------------------------------
  // Publish toggle
  // -------------------------------------------------------------------------

  const handlePublishToggle = useCallback(async () => {
    const newPublished = !pageData.isPublished
    try {
      const res = await fetch(`/api/v1/pages/${pageData.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublished: newPublished,
          publishedAt: newPublished ? new Date().toISOString() : null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update publish status")

      setPageData((prev) => ({
        ...prev,
        isPublished: newPublished,
        publishedAt: newPublished ? new Date().toISOString() : null,
      }))
      toast.success(newPublished ? "Page published" : "Page unpublished")
    } catch (err) {
      console.error("Publish toggle error:", err)
      toast.error("Failed to update publish status")
    }
  }, [pageData])

  // -------------------------------------------------------------------------
  // Section CRUD
  // -------------------------------------------------------------------------

  const openSectionPicker = useCallback((afterIndex: number) => {
    setPickerInsertIndex(afterIndex)
    setPickerOpen(true)
  }, [])

  const handlePickerSelect = useCallback(
    async (sectionType: SectionType, defaultContent: Record<string, unknown>) => {
      try {
        const sortOrder = pickerInsertIndex + 1
        const res = await fetch(`/api/v1/pages/${pageData.slug}/sections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sectionType,
            sortOrder,
            content: defaultContent,
            visible: true,
            colorScheme: "LIGHT",
            paddingY: "DEFAULT",
            containerWidth: "STANDARD",
            enableAnimations: true,
          }),
        })
        if (!res.ok) throw new Error("Failed to add section")

        const { data } = await res.json()
        const newSection: BuilderSection = {
          id: data.id,
          sectionType: data.sectionType,
          label: data.label,
          sortOrder: data.sortOrder,
          visible: data.visible,
          colorScheme: data.colorScheme,
          paddingY: data.paddingY,
          containerWidth: data.containerWidth,
          enableAnimations: data.enableAnimations,
          content: data.content as Record<string, unknown>,
        }

        setSections((prev) => {
          const updated = [...prev]
          updated.splice(pickerInsertIndex + 1, 0, newSection)
          return updated.map((s, i) => ({ ...s, sortOrder: i }))
        })
        setSelectedSectionId(newSection.id)
        setIsDirty(true)
        toast.success("Section added")
      } catch (err) {
        console.error("Add section error:", err)
        toast.error("Failed to add section")
      }
    },
    [pageData.slug, pickerInsertIndex],
  )

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      try {
        const res = await fetch(
          `/api/v1/pages/${pageData.slug}/sections/${sectionId}`,
          { method: "DELETE" },
        )
        if (!res.ok) throw new Error("Failed to delete section")

        setSections((prev) => prev.filter((s) => s.id !== sectionId))
        if (selectedSectionId === sectionId) {
          setSelectedSectionId(null)
        }
        setIsDirty(true)
        toast.success("Section deleted")
      } catch (err) {
        console.error("Delete section error:", err)
        toast.error("Failed to delete section")
      }
    },
    [pageData.slug, selectedSectionId],
  )

  const handleReorderSections = useCallback((reordered: BuilderSection[]) => {
    setSections(reordered)
    setIsDirty(true)
  }, [])

  // -------------------------------------------------------------------------
  // Section editing
  // -------------------------------------------------------------------------

  const handleEditSection = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId)
      if (!section) return

      setEditingSection({
        id: section.id,
        sectionType: section.sectionType,
        content: section.content,
        colorScheme: section.colorScheme,
        paddingY: section.paddingY,
        containerWidth: section.containerWidth,
        enableAnimations: section.enableAnimations,
        visible: section.visible,
        label: section.label,
      })
      setEditorOpen(true)
    },
    [sections],
  )

  const handleSectionEditorSave = useCallback(
    async (data: SectionEditorSaveData) => {
      if (!editingSection) return

      try {
        const res = await fetch(
          `/api/v1/pages/${pageData.slug}/sections/${editingSection.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        )
        if (!res.ok) throw new Error("Failed to save section")

        // Update local state
        setSections((prev) =>
          prev.map((s) =>
            s.id === editingSection.id
              ? {
                  ...s,
                  content: data.content,
                  colorScheme: data.colorScheme as BuilderSection["colorScheme"],
                  paddingY: data.paddingY as BuilderSection["paddingY"],
                  containerWidth: data.containerWidth as BuilderSection["containerWidth"],
                  enableAnimations: data.enableAnimations,
                  visible: data.visible,
                  label: data.label ?? null,
                }
              : s,
          ),
        )
        setEditorOpen(false)
        setEditingSection(null)
        toast.success("Section updated")
      } catch (err) {
        console.error("Section save error:", err)
        toast.error("Failed to save section")
      }
    },
    [editingSection, pageData.slug],
  )

  // -------------------------------------------------------------------------
  // Page title
  // -------------------------------------------------------------------------

  const handleTitleChange = useCallback((title: string) => {
    setPageData((prev) => ({ ...prev, title }))
    setIsDirty(true)
  }, [])

  // -------------------------------------------------------------------------
  // Page tree actions (Pages drawer)
  // -------------------------------------------------------------------------

  const handlePageSelect = useCallback(
    (pageId: string) => {
      if (pageId !== pageData.id) {
        router.push(`/cms/website/builder/${pageId}`)
      }
    },
    [router, pageData.id],
  )

  const handlePageSettings = useCallback((pageSummary: PageSummary) => {
    setPageSettingsTarget({
      id: pageSummary.id,
      slug: pageSummary.slug,
      title: pageSummary.title,
      pageType: pageSummary.pageType,
      layout: "DEFAULT",
      isHomepage: pageSummary.isHomepage,
      isPublished: pageSummary.isPublished,
      metaTitle: null,
      metaDescription: null,
    })
    setPageSettingsOpen(true)
  }, [])

  const handlePageSettingsSave = useCallback(
    async (data: Partial<PageSettingsData>) => {
      if (!data.id) return

      try {
        const target = pages.find((p) => p.id === data.id)
        if (!target) return

        const res = await fetch(`/api/v1/pages/${target.slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            slug: data.slug,
            pageType: data.pageType,
            layout: data.layout,
            isHomepage: data.isHomepage,
            isPublished: data.isPublished,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
          }),
        })
        if (!res.ok) throw new Error("Failed to update page settings")

        // Update pages list
        setPages((prev) =>
          prev.map((p) =>
            p.id === data.id
              ? {
                  ...p,
                  title: data.title ?? p.title,
                  slug: data.slug ?? p.slug,
                  pageType: data.pageType ?? p.pageType,
                  isHomepage: data.isHomepage ?? p.isHomepage,
                  isPublished: data.isPublished ?? p.isPublished,
                }
              : p,
          ),
        )

        // If we updated the currently active page, also sync pageData
        if (data.id === pageData.id) {
          setPageData((prev) => ({
            ...prev,
            title: data.title ?? prev.title,
            slug: data.slug ?? prev.slug,
            pageType: data.pageType ?? prev.pageType,
            isHomepage: data.isHomepage ?? prev.isHomepage,
            isPublished: data.isPublished ?? prev.isPublished,
          }))
        }

        toast.success("Page settings saved")
      } catch (err) {
        console.error("Page settings save error:", err)
        toast.error("Failed to save page settings")
      }
    },
    [pages, pageData.id],
  )

  const handleDeletePage = useCallback(
    async (pageId: string) => {
      const target = pages.find((p) => p.id === pageId)
      if (!target) return

      try {
        const res = await fetch(`/api/v1/pages/${target.slug}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete page")

        setPages((prev) => prev.filter((p) => p.id !== pageId))

        // If we deleted the currently active page, navigate to a different one
        if (pageId === pageData.id) {
          const remaining = pages.filter((p) => p.id !== pageId)
          const next = remaining.find((p) => p.isHomepage) ?? remaining[0]
          if (next) {
            router.push(`/cms/website/builder/${next.id}`)
          } else {
            router.push("/cms/website/pages")
          }
        }

        toast.success("Page deleted")
      } catch (err) {
        console.error("Delete page error:", err)
        toast.error("Failed to delete page")
      }
    },
    [pages, pageData.id, router],
  )

  const handlePageCreated = useCallback(
    (newPage: PageSummary) => {
      setPages((prev) => [...prev, newPage])
      router.push(`/cms/website/builder/${newPage.id}`)
      toast.success("Page created")
    },
    [router],
  )

  // -------------------------------------------------------------------------
  // Drawer title
  // -------------------------------------------------------------------------

  const drawerTitle =
    activeTool === "add"
      ? "Add Section"
      : activeTool === "pages"
        ? "Pages & Menu"
        : activeTool === "design"
          ? "Design"
          : activeTool === "media"
            ? "Media"
            : ""

  // -------------------------------------------------------------------------
  // Render drawer content based on active tool
  // -------------------------------------------------------------------------

  const renderDrawerContent = () => {
    switch (activeTool) {
      case "add":
        return (
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Click the + buttons on the canvas to add sections, or select a section type below.
            </p>
            <button
              onClick={() => openSectionPicker(sections.length - 1)}
              className="w-full rounded-lg border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
            >
              Browse all sections
            </button>
          </div>
        )
      case "pages":
        return (
          <PageTree
            pages={pages}
            activePageId={pageData.id}
            onPageSelect={handlePageSelect}
            onPageSettings={handlePageSettings}
            onAddPage={() => setAddPageOpen(true)}
            onDeletePage={handleDeletePage}
          />
        )
      case "design":
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <p>Design panel coming soon</p>
          </div>
        )
      case "media":
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <p>Media panel coming soon</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <BuilderTopbar
        page={pageData}
        allPages={pages}
        deviceMode={deviceMode}
        onDeviceChange={setDeviceMode}
        onSave={handleSave}
        onPublishToggle={handlePublishToggle}
        onTitleChange={handleTitleChange}
        isDirty={isDirty}
        isSaving={isSaving}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar (60px) */}
        <BuilderSidebar
          activeTool={activeTool}
          onToolClick={handleToolClick}
          pageType={pageData.pageType}
        />

        {/* Drawer (320px, animated) */}
        <BuilderDrawer
          activeTool={activeTool}
          title={drawerTitle}
          onClose={() => setActiveTool(null)}
        >
          {renderDrawerContent()}
        </BuilderDrawer>

        {/* Canvas (flex-1) */}
        <BuilderCanvas
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
          onDeselectSection={() => setSelectedSectionId(null)}
          onAddSection={openSectionPicker}
          onDeleteSection={handleDeleteSection}
          onEditSection={handleEditSection}
          onReorderSections={handleReorderSections}
          deviceMode={deviceMode}
          churchId={churchId}
          pageSlug={pageData.slug}
        />
      </div>

      {/* Section Picker Modal */}
      <SectionPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePickerSelect}
      />

      {/* Section Editor Modal */}
      <SectionEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        section={editingSection}
        onSave={handleSectionEditorSave}
      />

      {/* Page Settings Modal */}
      <PageSettingsModal
        open={pageSettingsOpen}
        onOpenChange={setPageSettingsOpen}
        page={pageSettingsTarget}
        onSave={handlePageSettingsSave}
        onDelete={handleDeletePage}
      />

      {/* Add Page Modal */}
      <AddPageModal
        open={addPageOpen}
        onOpenChange={setAddPageOpen}
        onPageCreated={handlePageCreated}
      />
    </div>
  )
}
