"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useUnsavedChanges } from "@/lib/hooks/use-unsaved-changes"
import { toast } from "sonner"
import { BuilderTopbar } from "./layout/builder-topbar"
import { BuilderSidebar } from "./layout/builder-sidebar"
import { BuilderDrawer } from "./layout/builder-drawer"
import { BuilderCanvas } from "./canvas/builder-canvas"
import { SectionPickerModal, type PickerMode } from "./sections/section-picker-modal"
import {
  BuilderRightDrawer,
  type SectionEditorData,
} from "./layout/builder-right-drawer"
import { NavigationEditor, type MenuItemData } from "./navigation/navigation-editor"
import { PageTree } from "./pages/page-tree"
import { PageSettingsModal, type PageSettingsData } from "./pages/page-settings-modal"
import { AddPageModal } from "./pages/add-page-modal"
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
  NavTreeMenuItem,
} from "./types"
import type { SectionType } from "@/lib/db/types"

/** Snapshot stored in the undo/redo history. */
interface BuilderSnapshot {
  sections: BuilderSection[]
  pageTitle: string
}

const AUTO_SAVE_DELAY_MS = 30_000

/**
 * Returns the URL path identifier for a page.
 * Uses the slug if non-empty, otherwise falls back to the page ID.
 * This handles homepage (slug = '') where the slug-based URL would be broken.
 */
function pagePathId(page: { slug: string; id: string }): string {
  return page.slug || page.id
}

// NavbarData is defined in types.ts — re-exported for backward compat
import type { NavbarData } from "./types"
export type { NavbarData } from "./types"

interface BuilderShellProps {
  page: BuilderPage
  allPages: PageSummary[]
  churchId: string
  websiteThemeTokens?: Record<string, string>
  websiteCustomCss?: string
  navbarData?: NavbarData
  headerMenuItems?: NavTreeMenuItem[]
  headerMenuId?: string | null
  headerMenuItemsFull?: MenuItemData[]
  navbarSettings?: {
    scrollBehavior?: string
    solidColor?: string
    sticky?: boolean
    ctaLabel?: string
    ctaHref?: string
    ctaVisible?: boolean
  }
}

export function BuilderShell({ page, allPages, churchId, websiteThemeTokens, websiteCustomCss, navbarData, headerMenuItems, headerMenuId: initialHeaderMenuId, headerMenuItemsFull: initialHeaderMenuItemsFull, navbarSettings: initialNavbarSettings }: BuilderShellProps) {
  const router = useRouter()
  const [activeTool, setActiveTool] = useState<BuilderTool>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop")
  const [sections, setSections] = useState<BuilderSection[]>(page.sections)
  const [pageData, setPageData] = useState<BuilderPage>(page)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pages, setPages] = useState<PageSummary[]>(allPages)

  // Granular dirty tracking — controls which parts of the save are actually sent
  const [dirtySectionIds, setDirtySectionIds] = useState<Set<string>>(new Set())
  const [reorderDirty, setReorderDirty] = useState(false)
  const [pageDirty, setPageDirty] = useState(false)

  // Save button visual state: idle -> saving -> saved -> idle
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")

  // Unsaved changes dialog for page navigation
  const [pendingNavigationId, setPendingNavigationId] = useState<string | null>(null)
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false)

  // Section delete confirmation dialog
  const [pendingDeleteSectionId, setPendingDeleteSectionId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Page delete confirmation dialog
  const [pendingDeletePageId, setPendingDeletePageId] = useState<string | null>(null)
  const [deletePageDialogOpen, setDeletePageDialogOpen] = useState(false)

  // Section picker modal
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerInsertIndex, setPickerInsertIndex] = useState(-1)
  const [pickerMode, setPickerMode] = useState<PickerMode>("sidebar")
  const [pickerTriggerRect, setPickerTriggerRect] = useState<DOMRect | null>(null)

  // Right drawer editing: track which section is being edited
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)

  // Navigation editor state
  const [editingNavbar, setEditingNavbar] = useState(false)
  const [editingNavItemId, setEditingNavItemId] = useState<string | null>(null)
  const [editingNavSettings, setEditingNavSettings] = useState(false)
  const [headerMenuId] = useState<string | null>(initialHeaderMenuId ?? null)
  const [menuItems, setMenuItems] = useState<MenuItemData[]>(initialHeaderMenuItemsFull ?? [])

  // Refresh menu data from the API after nav changes
  const refreshMenu = useCallback(async () => {
    if (!headerMenuId) return
    try {
      const res = await fetch(`/api/v1/menus/${headerMenuId}/items`)
      if (res.ok) {
        const { data } = await res.json()
        setMenuItems(data.items ?? [])
      }
    } catch {
      // Silently fail — the navigation editor has its own error handling
    }
    // Also refresh the iframe preview to reflect updated navbar
    router.refresh()
  }, [headerMenuId, router])

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
      // After undo, any section could differ from the DB — mark all dirty
      setDirtySectionIds(new Set(snapshot.sections.map((s) => s.id)))
      setReorderDirty(true)
      setPageDirty(true)
      // Reset so the next edit after undo pushes a new snapshot
      editingSnapshotPushedRef.current = false
    }
  }, [history, sections, pageData.title])

  const handleRedo = useCallback(() => {
    const snapshot = history.redo({ sections, pageTitle: pageData.title })
    if (snapshot) {
      setSections(snapshot.sections)
      setPageData((prev) => ({ ...prev, title: snapshot.pageTitle }))
      setIsDirty(true)
      // After redo, any section could differ from the DB — mark all dirty
      setDirtySectionIds(new Set(snapshot.sections.map((s) => s.id)))
      setReorderDirty(true)
      setPageDirty(true)
      // Reset so the next edit after redo pushes a new snapshot
      editingSnapshotPushedRef.current = false
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
    setEditingNavbar(false)
    setEditingNavItemId(null)
    setEditingNavSettings(false)
    setIsDirty(false)
    setDirtySectionIds(new Set())
    setReorderDirty(false)
    setPageDirty(false)
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
    setPickerMode("sidebar")
    setPickerTriggerRect(null)
    setPickerOpen(true)
  }, [])

  const handleToolClick = useCallback(
    (tool: BuilderTool) => {
      // "add" opens the section picker in sidebar mode (next to the sidebar)
      if (tool === "add") {
        setPickerInsertIndex(sections.length - 1)
        setPickerMode("sidebar")
        setPickerTriggerRect(null)
        setPickerOpen(true)
        return
      }
      setActiveTool((prev) => (prev === tool ? null : tool))
    },
    [sections.length],
  )

  // -------------------------------------------------------------------------
  // Beforeunload — warn when closing tab with unsaved changes
  // -------------------------------------------------------------------------

  // Warn on unsaved changes (reload, sidebar nav, back/forward)
  const { navigateAway } = useUnsavedChanges(isDirty)

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    // If nothing is dirty, skip the save entirely
    if (!pageDirty && !reorderDirty && dirtySectionIds.size === 0) {
      setIsDirty(false)
      return
    }

    if (isSaving) return

    setIsSaving(true)
    setSaveState("saving")
    try {
      // 1. Save page metadata — only if page-level fields changed
      if (pageDirty) {
        const pageRes = await fetch(`/api/v1/pages/${pagePathId(pageData)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: pageData.title,
          }),
        })
        if (!pageRes.ok) throw new Error("Failed to save page metadata")
      }

      // 2. Reorder sections — only if order changed
      if (reorderDirty) {
        const sectionIds = sections.map((s) => s.id)
        const reorderRes = await fetch(`/api/v1/pages/${pagePathId(pageData)}/sections`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionIds }),
        })
        if (!reorderRes.ok) throw new Error("Failed to reorder sections")
      }

      // 3. Save only dirty sections' content and display settings
      const dirtySections = sections.filter((s) => dirtySectionIds.has(s.id))
      if (dirtySections.length > 0) {
        const sectionSaves = dirtySections.map((s) =>
          fetch(`/api/v1/pages/${pagePathId(pageData)}/sections/${s.id}`, {
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

        // Check each section result individually
        const failedNames: string[] = []
        results.forEach((res, i) => {
          if (!res.ok) {
            const s = dirtySections[i]
            failedNames.push(s.label || s.sectionType)
          }
        })

        if (failedNames.length > 0) {
          setSaveState("idle")
          toast.error(
            `Failed to save ${failedNames.length} section(s): ${failedNames.join(", ")}`,
          )
          return
        }
      }

      setDirtySectionIds(new Set())
      setReorderDirty(false)
      setPageDirty(false)
      setIsDirty(false)
      setSaveState("saved")
      router.refresh()
      toast.success("Page saved")

      // Revert to idle after brief "Saved" display
      setTimeout(() => setSaveState("idle"), 2000)
    } catch (err) {
      console.error("Save error:", err)
      setSaveState("idle")
      toast.error(
        err instanceof Error ? err.message : "Failed to save page",
      )
    } finally {
      setIsSaving(false)
    }
  }, [pageData, sections, router, pageDirty, reorderDirty, dirtySectionIds])

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
        if (editingNavItemId) {
          setEditingNavItemId(null)
        } else if (editingNavSettings) {
          setEditingNavSettings(false)
        } else if (editingNavbar) {
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
  }, [selectedSectionId, activeTool, editingSectionId, editingNavbar, editingNavItemId, editingNavSettings])

  // -------------------------------------------------------------------------
  // Publish toggle
  // -------------------------------------------------------------------------

  const handlePublishToggle = useCallback(async () => {
    const newPublished = !pageData.isPublished
    try {
      const res = await fetch(`/api/v1/pages/${pagePathId(pageData)}`, {
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
        const res = await fetch(`/api/v1/pages/${pagePathId(pageData)}/sections`, {
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
        setReorderDirty(true)
        setIsDirty(true)
        toast.success("Section added")
      } catch (err) {
        console.error("Add section error:", err)
        toast.error("Failed to add section")
      }
    },
    [pageData.slug, pageData.id, pickerInsertIndex, pushSnapshot],
  )

  /** Opens the confirmation dialog before deleting a section. */
  const handleDeleteSection = useCallback(
    (sectionId: string) => {
      setPendingDeleteSectionId(sectionId)
      setDeleteDialogOpen(true)
    },
    [],
  )

  /** Actually performs the section delete after user confirms. */
  const confirmDeleteSection = useCallback(
    async () => {
      const sectionId = pendingDeleteSectionId
      setDeleteDialogOpen(false)
      setPendingDeleteSectionId(null)
      if (!sectionId) return

      try {
        const res = await fetch(
          `/api/v1/pages/${pagePathId(pageData)}/sections/${sectionId}`,
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
        // Remove deleted section from dirty set (it's already deleted via API)
        setDirtySectionIds((prev) => {
          const next = new Set(prev)
          next.delete(sectionId)
          return next
        })
        setReorderDirty(true)
        setIsDirty(true)
        toast.success("Section deleted")
      } catch (err) {
        console.error("Delete section error:", err)
        toast.error("Failed to delete section")
      }
    },
    [pageData.slug, pageData.id, selectedSectionId, editingSectionId, pushSnapshot, pendingDeleteSectionId],
  )

  const cancelDeleteSection = useCallback(() => {
    setDeleteDialogOpen(false)
    setPendingDeleteSectionId(null)
  }, [])

  const handleReorderSections = useCallback((reordered: BuilderSection[]) => {
    pushSnapshot()
    setSections(reordered)
    setReorderDirty(true)
    setIsDirty(true)
  }, [pushSnapshot])

  // -------------------------------------------------------------------------
  // Section editing (inline right drawer)
  // -------------------------------------------------------------------------

  const handleEditSection = useCallback(
    (sectionId: string) => {
      setEditingNavbar(false)
      setEditingNavItemId(null)
      setEditingNavSettings(false)
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
      setDirtySectionIds((prev) => new Set(prev).add(editingSectionId))
      setIsDirty(true)
    },
    [editingSectionId, pushSnapshot],
  )

  // -------------------------------------------------------------------------
  // Navbar / Navigation editing
  // -------------------------------------------------------------------------

  const handleNavbarClick = useCallback(() => {
    // Close any section editor and open navbar settings
    setEditingSectionId(null)
    setEditingNavItemId(null)
    setEditingNavSettings(true)
    setEditingNavbar(true)
  }, [])

  const handleNavbarClose = useCallback(() => {
    setEditingNavbar(false)
    setEditingNavSettings(false)
  }, [])

  const handleEditNavItem = useCallback((itemId: string) => {
    setEditingSectionId(null)
    setEditingNavSettings(false)
    setEditingNavItemId(itemId)
  }, [])

  const handleCloseNavItemEditor = useCallback(() => {
    setEditingNavItemId(null)
  }, [])

  const handleNavItemUpdated = useCallback(() => {
    setEditingNavItemId(null)
    refreshMenu()
  }, [refreshMenu])

  const handleNavSettingsUpdated = useCallback(() => {
    setEditingNavSettings(false)
    setEditingNavbar(false)
    router.refresh()
  }, [router])

  // -------------------------------------------------------------------------
  // Page title
  // -------------------------------------------------------------------------

  const handleTitleChange = useCallback((title: string) => {
    pushSnapshot()
    setPageData((prev) => ({ ...prev, title }))
    setPageDirty(true)
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
        navigateAway(`/cms/website/builder/${pageId}`)
      }
    },
    [navigateAway, pageData.id, isDirty],
  )

  /**
   * Handle clicks on navbar links: resolve the website href (e.g. "/about")
   * to a builder page and navigate to it. If no matching page is found, fall
   * back to opening the navbar editor.
   */
  const handleNavbarLinkClick = useCallback(
    (href: string) => {
      // Normalize: strip /website/ prefix (resolveHref prepends it for the public site),
      // then strip leading slash, treat "/" or "" as homepage
      let normalized = href
      if (normalized.startsWith("/website/")) {
        normalized = normalized.slice("/website".length) // "/website/about" → "/about"
      } else if (normalized === "/website") {
        normalized = "/"
      }
      // Also strip query params for matching (e.g., "/events?tab=event" → "/events")
      const [pathPart] = normalized.split("?")
      const slug = pathPart.replace(/^\//, "") || ""
      const matchingPage = pages.find((p) => {
        // Homepage: href is "/" → slug is "" → match on isHomepage or empty slug
        if (slug === "" && p.isHomepage) return true
        if (slug === "" && p.slug === "") return true
        // Direct slug match
        if (p.slug === slug) return true
        // Match with leading slash (e.g. "/about" === page slug "about")
        if (`/${p.slug}` === pathPart) return true
        return false
      })

      if (matchingPage) {
        handlePageSelect(matchingPage.id)
      } else {
        // No matching page found — open navbar editor as fallback
        handleNavbarClick()
      }
    },
    [pages, handlePageSelect, handleNavbarClick],
  )

  const handleDiscardAndNavigate = useCallback(() => {
    setDiscardDialogOpen(false)
    if (pendingNavigationId) {
      setIsDirty(false)
      navigateAway(`/cms/website/builder/${pendingNavigationId}`)
      setPendingNavigationId(null)
    }
  }, [pendingNavigationId, navigateAway])

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

        const res = await fetch(`/api/v1/pages/${target.slug || target.id}`, {
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

  /** Opens the confirmation dialog before deleting a page. */
  const handleDeletePage = useCallback(
    (pageId: string) => {
      setPendingDeletePageId(pageId)
      setDeletePageDialogOpen(true)
    },
    [],
  )

  /** Actually performs the page delete after user confirms. */
  const confirmDeletePage = useCallback(
    async () => {
      const pageId = pendingDeletePageId
      if (!pageId) return
      setDeletePageDialogOpen(false)
      setPendingDeletePageId(null)

      const target = pages.find((p) => p.id === pageId)
      if (!target) return

      try {
        const res = await fetch(`/api/v1/pages/${target.slug || target.id}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete page")

        setPages((prev) => prev.filter((p) => p.id !== pageId))

        // If we deleted the currently active page, navigate to a different one
        if (pageId === pageData.id) {
          const remaining = pages.filter((p) => p.id !== pageId)
          const next = remaining.find((p) => p.isHomepage) ?? remaining[0]
          if (next) {
            navigateAway(`/cms/website/builder/${next.id}`)
          } else {
            navigateAway("/cms/website/pages")
          }
        }

        toast.success("Page deleted")
      } catch (err) {
        console.error("Delete page error:", err)
        toast.error("Failed to delete page")
      }
    },
    [pendingDeletePageId, pages, pageData.id, navigateAway],
  )

  const cancelDeletePage = useCallback(() => {
    setDeletePageDialogOpen(false)
    setPendingDeletePageId(null)
  }, [])

  const handleDuplicatePage = useCallback(
    async (pageId: string) => {
      const source = pages.find((p) => p.id === pageId)
      if (!source) return

      try {
        // 1. Fetch the source page with sections
        const pageRes = await fetch(`/api/v1/pages/${source.slug || source.id}`)
        if (!pageRes.ok) throw new Error("Failed to fetch source page")
        const { data: fullPage } = await pageRes.json()

        // 2. Create new page with "(Copy)" title and "-copy" slug
        const newTitle = `${fullPage.title} (Copy)`
        const newSlug = fullPage.slug ? `${fullPage.slug}-copy` : `page-copy-${Date.now()}`

        const createRes = await fetch("/api/v1/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle,
            slug: newSlug,
            pageType: fullPage.pageType,
            layout: fullPage.layout,
            isPublished: false,
            isHomepage: false,
            sortOrder: fullPage.sortOrder + 1,
            parentId: fullPage.parentId,
            metaTitle: fullPage.metaTitle,
            metaDescription: fullPage.metaDescription,
          }),
        })
        if (!createRes.ok) throw new Error("Failed to create duplicate page")
        const { data: newPage } = await createRes.json()

        // 3. Copy all sections from source to new page
        const sourceSections = fullPage.sections ?? []
        for (let i = 0; i < sourceSections.length; i++) {
          const s = sourceSections[i]
          await fetch(`/api/v1/pages/${newSlug}/sections`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sectionType: s.sectionType,
              sortOrder: s.sortOrder ?? i,
              content: s.content,
              visible: s.visible,
              colorScheme: s.colorScheme,
              paddingY: s.paddingY,
              containerWidth: s.containerWidth,
              enableAnimations: s.enableAnimations,
              label: s.label,
              dataSource: s.dataSource,
            }),
          })
        }

        // 4. Update pages list and navigate to the new page
        const newPageSummary: PageSummary = {
          id: newPage.id,
          slug: newPage.slug,
          title: newPage.title,
          pageType: newPage.pageType,
          isHomepage: newPage.isHomepage,
          isPublished: newPage.isPublished,
          sortOrder: newPage.sortOrder,
          parentId: newPage.parentId,
        }
        setPages((prev) => [...prev, newPageSummary])
        navigateAway(`/cms/website/builder/${newPage.id}`)
        toast.success("Page duplicated")
      } catch (err) {
        console.error("Duplicate page error:", err)
        toast.error("Failed to duplicate page")
      }
    },
    [pages, navigateAway],
  )

  const handlePageCreated = useCallback(
    (newPage: PageSummary) => {
      setPages((prev) => [...prev, newPage])
      navigateAway(`/cms/website/builder/${newPage.id}`)
      toast.success("Page created")
    },
    [navigateAway],
  )

  // -------------------------------------------------------------------------
  // Drawer title
  // -------------------------------------------------------------------------

  const drawerTitle =
    activeTool === "pages"
      ? "Site Pages"
      : activeTool === "navigation"
        ? "Navigation"
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
            onDuplicatePage={handleDuplicatePage}
            headerMenuItems={headerMenuItems}
          />
        )
      case "navigation":
        return headerMenuId ? (
          <NavigationEditor
            churchId={churchId}
            menuId={headerMenuId}
            menuItems={menuItems}
            pages={pages}
            ctaLabel={initialNavbarSettings?.ctaLabel ?? null}
            ctaHref={initialNavbarSettings?.ctaHref ?? null}
            ctaVisible={initialNavbarSettings?.ctaVisible ?? false}
            onEditItem={handleEditNavItem}
            onMenuChange={refreshMenu}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            <p>No header menu found. Create one in the Navigation settings.</p>
          </div>
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
          hideHeader={activeTool === "navigation"}
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
            setEditingNavItemId(null)
            setEditingNavSettings(false)
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
          pageId={pageData.id}
          onNavbarClick={handleNavbarClick}
          onNavbarLinkClick={handleNavbarLinkClick}
          isNavbarEditing={editingNavbar}
        />

        {/* Right Drawer (320px, animated) — inline section / navbar / nav item editor */}
        <BuilderRightDrawer
          section={editingNavItemId || editingNavSettings ? null : editingSection}
          onClose={handleCloseEditor}
          onChange={handleSectionEditorChange}
          onDelete={handleDeleteSection}
          navbarSettings={null}
          onNavbarClose={handleNavbarClose}
          onNavbarChange={() => {}}
          editingNavItemId={editingNavItemId}
          editingNavSettings={editingNavSettings}
          menuItems={menuItems}
          menuId={headerMenuId}
          pages={pages}
          churchId={churchId}
          initialNavbarSettings={initialNavbarSettings}
          onCloseNavItem={handleCloseNavItemEditor}
          onNavItemUpdated={handleNavItemUpdated}
          onNavSettingsClose={handleNavbarClose}
          onNavSettingsUpdated={handleNavSettingsUpdated}
        />
      </div>

      {/* Section Picker Modal */}
      <SectionPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePickerSelect}
        mode={pickerMode}
        triggerRect={pickerTriggerRect}
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

      {/* Section Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The section and its content will be
              permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteSection}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeleteSection}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Delete Confirmation Dialog */}
      <AlertDialog open={deletePageDialogOpen} onOpenChange={setDeletePageDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{pages.find((p) => p.id === pendingDeletePageId)?.title}&quot; and all its
              sections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeletePage}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeletePage}
            >
              Delete Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
