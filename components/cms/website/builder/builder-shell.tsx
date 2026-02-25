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
  BuilderRightDrawer,
  type SectionEditorData,
} from "./builder-right-drawer"
import {
  type NavbarSettings,
  defaultNavbarSettings,
} from "./section-editors/navbar-editor"
import { PageTree } from "./page-tree"
import { PageSettingsModal, type PageSettingsData } from "./page-settings-modal"
import { AddPageModal } from "./add-page-modal"
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
import { useBuilderHistory } from "./use-builder-history"
import type {
  BuilderTool,
  DeviceMode,
  BuilderPage,
  BuilderSection,
  PageSummary,
} from "./types"
import type { SectionType } from "@/lib/db/types"

/** Snapshot stored in the undo/redo history. */
interface BuilderSnapshot {
  sections: BuilderSection[]
  pageTitle: string
}

const AUTO_SAVE_DELAY_MS = 30_000

export interface NavbarData {
  menu: unknown
  logoUrl: string | null
  logoAlt: string | null
  siteName: string
  ctaLabel: string
  ctaHref: string
  ctaVisible: boolean
  memberLoginVisible: boolean
}

interface BuilderShellProps {
  page: BuilderPage
  allPages: PageSummary[]
  churchId: string
  websiteThemeTokens?: Record<string, string>
  navbarData?: NavbarData
}

export function BuilderShell({ page, allPages, churchId, websiteThemeTokens, navbarData }: BuilderShellProps) {
  const router = useRouter()
  const [activeTool, setActiveTool] = useState<BuilderTool>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop")
  const [sections, setSections] = useState<BuilderSection[]>(page.sections)
  const [pageData, setPageData] = useState<BuilderPage>(page)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pages, setPages] = useState<PageSummary[]>(allPages)

  // Save button visual state: idle -> saving -> saved -> idle
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  // Unsaved changes dialog for page navigation
  const [pendingNavigationId, setPendingNavigationId] = useState<string | null>(null)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  // Section picker modal
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerInsertIndex, setPickerInsertIndex] = useState(-1)

  // Right drawer editing: track which section is being edited
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)

  // Navbar editor
  const [editingNavbar, setEditingNavbar] = useState(false)
  const [navbarSettings, setNavbarSettings] = useState<NavbarSettings>(
    defaultNavbarSettings,
  )

  // Page modals
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false)
  const [pageSettingsTarget, setPageSettingsTarget] = useState<PageSettingsData | null>(null)
  const [addPageOpen, setAddPageOpen] = useState(false)

  // -------------------------------------------------------------------------
  // Undo / Redo history
  // -------------------------------------------------------------------------

  const history = useBuilderHistory<BuilderSnapshot>()

  /** Push the current state as a snapshot before mutating. */
  const pushSnapshot = useCallback(() => {
    history.push({ sections, pageTitle: pageData.title })
  }, [history, sections, pageData.title])

  const handleUndo = useCallback(() => {
    const snapshot = history.undo({ sections, pageTitle: pageData.title })
    if (snapshot) {
      setSections(snapshot.sections)
      setPageData((prev) => ({ ...prev, title: snapshot.pageTitle }))
      setIsDirty(true)
    }
  }, [history, sections, pageData.title])

  const handleRedo = useCallback(() => {
    const snapshot = history.redo({ sections, pageTitle: pageData.title })
    if (snapshot) {
      setSections(snapshot.sections)
      setPageData((prev) => ({ ...prev, title: snapshot.pageTitle }))
      setIsDirty(true)
    }
  }, [history, sections, pageData.title])

  // Keep latest undo/redo in refs so the keydown handler never goes stale
  const handleUndoRef = useRef(handleUndo)
  handleUndoRef.current = handleUndo
  const handleRedoRef = useRef(handleRedo)
  handleRedoRef.current = handleRedo

  // Reset state when page prop changes (navigating to different page)
  // Note: history.reset is a stable useCallback ref, so we don't include
  // `history` in deps (its object identity changes on every render).
  useEffect(() => {
    setSections(page.sections)
    setPageData(page)
    setSelectedSectionId(null)
    setEditingSectionId(null)
    setIsDirty(false)
    setSaveState("idle")
    history.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Sync allPages prop
  useEffect(() => {
    setPages(allPages)
  }, [allPages])

  const openSectionPicker = useCallback((afterIndex: number) => {
    setPickerInsertIndex(afterIndex)
    setPickerOpen(true)
  }, [])

  const handleToolClick = useCallback(
    (tool: BuilderTool) => {
      // "add" opens the section picker modal directly instead of a drawer
      if (tool === "add") {
        openSectionPicker(sections.length - 1)
        return
      }
      setActiveTool((prev) => (prev === tool ? null : tool))
    },
    [openSectionPicker, sections.length],
  )

  // -------------------------------------------------------------------------
  // Beforeunload — warn when closing tab with unsaved changes
  // -------------------------------------------------------------------------

  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirtyRef.current) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveState("saving")
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

      // Save each section's content and display settings
      const sectionSaves = sections.map((s) =>
        fetch(`/api/v1/pages/${pageData.slug}/sections/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: s.content,
            colorScheme: s.colorScheme,
            paddingY: s.paddingY,
            containerWidth: s.containerWidth,
            enableAnimations: s.enableAnimations,
            visible: s.visible,
            label: s.label,
          }),
        }),
      )
      const results = await Promise.all(sectionSaves)
      const failedSections = results.filter((r) => !r.ok)
      if (failedSections.length > 0) {
        throw new Error(`Failed to save ${failedSections.length} section(s)`)
      }

      setIsDirty(false)
      setSaveState("saved")
      router.refresh()
      toast.success("Page saved")

      // Revert to idle after brief "Saved" display
      setTimeout(() => setSaveState("idle"), 2000)
    } catch (err) {
      console.error("Save error:", err)
      setSaveState("idle")
      toast.error("Failed to save page")
    } finally {
      setIsSaving(false)
    }
  }, [pageData, sections, router])

  // Use a ref to always have the latest handleSave without re-subscribing the effect
  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  // -------------------------------------------------------------------------
  // Auto-save draft (debounced, 30s after last change)
  // -------------------------------------------------------------------------

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = null
    }

    if (isDirty && !isSaving) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveRef.current()
      }, AUTO_SAVE_DELAY_MS)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [isDirty, isSaving, sections, pageData.title])

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingNavbar) {
          setEditingNavbar(false)
        } else if (editingSectionId) {
          setEditingSectionId(null)
        } else if (selectedSectionId) {
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
      // Cmd/Ctrl+Z to undo, Cmd/Ctrl+Shift+Z to redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        // Don't intercept when focus is inside an input/textarea/contenteditable
        const active = document.activeElement
        if (
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement ||
          (active instanceof HTMLElement && active.isContentEditable)
        ) {
          return
        }
        e.preventDefault()
        if (e.shiftKey) {
          handleRedoRef.current()
        } else {
          handleUndoRef.current()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedSectionId, activeTool, editingSectionId, editingNavbar])

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
      router.refresh()
      toast.success(newPublished ? "Page published" : "Page unpublished")
    } catch (err) {
      console.error("Publish toggle error:", err)
      toast.error("Failed to update publish status")
    }
  }, [pageData, router])

  // -------------------------------------------------------------------------
  // Section CRUD
  // -------------------------------------------------------------------------


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

        pushSnapshot()
        setSections((prev) => {
          const updated = [...prev]
          updated.splice(pickerInsertIndex + 1, 0, newSection)
          return updated.map((s, i) => ({ ...s, sortOrder: i }))
        })
        setSelectedSectionId(newSection.id)
        setEditingSectionId(newSection.id)
        setIsDirty(true)
        toast.success("Section added")
      } catch (err) {
        console.error("Add section error:", err)
        toast.error("Failed to add section")
      }
    },
    [pageData.slug, pickerInsertIndex, pushSnapshot],
  )

  const handleDeleteSection = useCallback(
    async (sectionId: string) => {
      try {
        const res = await fetch(
          `/api/v1/pages/${pageData.slug}/sections/${sectionId}`,
          { method: "DELETE" },
        )
        if (!res.ok) throw new Error("Failed to delete section")

        pushSnapshot()
        setSections((prev) => prev.filter((s) => s.id !== sectionId))
        if (selectedSectionId === sectionId) {
          setSelectedSectionId(null)
        }
        if (editingSectionId === sectionId) {
          setEditingSectionId(null)
        }
        setIsDirty(true)
        toast.success("Section deleted")
      } catch (err) {
        console.error("Delete section error:", err)
        toast.error("Failed to delete section")
      }
    },
    [pageData.slug, selectedSectionId, editingSectionId, pushSnapshot],
  )

  const handleReorderSections = useCallback((reordered: BuilderSection[]) => {
    pushSnapshot()
    setSections(reordered)
    setIsDirty(true)
  }, [pushSnapshot])

  // -------------------------------------------------------------------------
  // Section editing (inline right drawer)
  // -------------------------------------------------------------------------

  const handleEditSection = useCallback(
    (sectionId: string) => {
      setEditingNavbar(false)
      setEditingSectionId(sectionId)
      setSelectedSectionId(sectionId)
    },
    [],
  )

  const handleCloseEditor = useCallback(() => {
    setEditingSectionId(null)
  }, [])

  // Derive the editing section data from sections array + editingSectionId
  const editingSection: SectionEditorData | null = (() => {
    if (!editingSectionId) return null
    const section = sections.find((s) => s.id === editingSectionId)
    if (!section) return null
    return {
      id: section.id,
      sectionType: section.sectionType,
      content: section.content,
      colorScheme: section.colorScheme,
      paddingY: section.paddingY,
      containerWidth: section.containerWidth,
      enableAnimations: section.enableAnimations,
      visible: section.visible,
      label: section.label,
    }
  })()

  // Track whether we've pushed a snapshot for the current editing "gesture"
  const editingSnapshotPushedRef = useRef(false)

  // Reset the flag when the editing section changes
  useEffect(() => {
    editingSnapshotPushedRef.current = false
  }, [editingSectionId])

  // Handle inline changes from the right drawer (updates local state immediately)
  const handleSectionEditorChange = useCallback(
    (data: Partial<SectionEditorData>) => {
      if (!editingSectionId) return

      // Push a snapshot once per editing "session" (when editor opens and user starts changing)
      if (!editingSnapshotPushedRef.current) {
        pushSnapshot()
        editingSnapshotPushedRef.current = true
      }

      setSections((prev) =>
        prev.map((s) =>
          s.id === editingSectionId
            ? {
                ...s,
                ...(data.content !== undefined && { content: data.content }),
                ...(data.colorScheme !== undefined && {
                  colorScheme: data.colorScheme as BuilderSection["colorScheme"],
                }),
                ...(data.paddingY !== undefined && {
                  paddingY: data.paddingY as BuilderSection["paddingY"],
                }),
                ...(data.containerWidth !== undefined && {
                  containerWidth: data.containerWidth as BuilderSection["containerWidth"],
                }),
                ...(data.enableAnimations !== undefined && {
                  enableAnimations: data.enableAnimations,
                }),
                ...(data.visible !== undefined && { visible: data.visible }),
                ...(data.label !== undefined && { label: data.label ?? null }),
              }
            : s,
        ),
      )
      setIsDirty(true)
    },
    [editingSectionId, pushSnapshot],
  )

  // -------------------------------------------------------------------------
  // Navbar editing
  // -------------------------------------------------------------------------

  const handleNavbarClick = useCallback(() => {
    // Close any section editor and open navbar editor
    setEditingSectionId(null)
    setEditingNavbar(true)
  }, [])

  const handleNavbarClose = useCallback(() => {
    setEditingNavbar(false)
  }, [])

  const handleNavbarSettingsChange = useCallback(
    (settings: NavbarSettings) => {
      setNavbarSettings(settings)
      // TODO: persist navbar settings via API when site-settings supports it
    },
    [],
  )

  // -------------------------------------------------------------------------
  // Page title
  // -------------------------------------------------------------------------

  const handleTitleChange = useCallback((title: string) => {
    pushSnapshot()
    setPageData((prev) => ({ ...prev, title }))
    setIsDirty(true)
  }, [pushSnapshot])

  // -------------------------------------------------------------------------
  // Page tree actions (Pages drawer)
  // -------------------------------------------------------------------------

  const handlePageSelect = useCallback(
    (pageId: string) => {
      if (pageId === pageData.id) return

      if (isDirty) {
        setPendingNavigationId(pageId)
        setDiscardDialogOpen(true)
      } else {
        router.push(`/cms/website/builder/${pageId}`)
      }
    },
    [router, pageData.id, isDirty],
  )

  const handleDiscardAndNavigate = useCallback(() => {
    setDiscardDialogOpen(false)
    if (pendingNavigationId) {
      setIsDirty(false)
      router.push(`/cms/website/builder/${pendingNavigationId}`)
      setPendingNavigationId(null)
    }
  }, [pendingNavigationId, router])

  const handleCancelNavigation = useCallback(() => {
    setDiscardDialogOpen(false)
    setPendingNavigationId(null)
  }, [])

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
    activeTool === "pages"
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        isDirty={isDirty}
        isSaving={isSaving}
        saveState={saveState}
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
          onSelectSection={(id) => {
            setSelectedSectionId(id)
            setEditingNavbar(false)
          }}
          onDeselectSection={() => {
            setSelectedSectionId(null)
            setEditingSectionId(null)
            setEditingNavbar(false)
          }}
          onAddSection={openSectionPicker}
          onDeleteSection={handleDeleteSection}
          onEditSection={handleEditSection}
          onReorderSections={handleReorderSections}
          deviceMode={deviceMode}
          churchId={churchId}
          pageSlug={pageData.slug}
          websiteThemeTokens={websiteThemeTokens}
          navbarData={navbarData}
          onNavbarClick={handleNavbarClick}
          isNavbarEditing={editingNavbar}
        />

        {/* Right Drawer (320px, animated) — inline section / navbar editor */}
        <BuilderRightDrawer
          section={editingSection}
          onClose={handleCloseEditor}
          onChange={handleSectionEditorChange}
          onDelete={handleDeleteSection}
          navbarSettings={editingNavbar ? navbarSettings : null}
          onNavbarClose={handleNavbarClose}
          onNavbarChange={handleNavbarSettingsChange}
        />
      </div>

      {/* Section Picker Modal */}
      <SectionPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePickerSelect}
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

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={discardDialogOpen} onOpenChange={setDiscardDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes on this page. If you navigate away, your
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDiscardAndNavigate}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
