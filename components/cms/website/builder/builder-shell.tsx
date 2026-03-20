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
import { useBackgroundSync } from "./use-background-sync"
import { usePresenceHeartbeat } from "./use-presence-heartbeat"
import { AlertTriangle, Check, FileText, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  footerMenuId?: string | null
  footerMenuItemsFull?: MenuItemData[]
}

export function BuilderShell({ page, allPages, churchId, websiteThemeTokens, websiteCustomCss, navbarData, headerMenuId: initialHeaderMenuId, headerMenuItemsFull: initialHeaderMenuItemsFull, navbarSettings: initialNavbarSettings, footerMenuId: initialFooterMenuId, footerMenuItemsFull: initialFooterMenuItemsFull }: BuilderShellProps) {
  const router = useRouter()

  // Persist activeTool in sessionStorage so it survives page navigations
  const [activeTool, setActiveToolState] = useState<BuilderTool>(() => {
    if (typeof window === "undefined") return null
    const stored = sessionStorage.getItem("builder-active-tool")
    if (stored === "navigation" || stored === "design" || stored === "media") {
      return stored as BuilderTool
    }
    return null
  })

  const setActiveTool = useCallback((tool: BuilderTool) => {
    setActiveToolState(tool)
    if (tool) {
      sessionStorage.setItem("builder-active-tool", tool)
    } else {
      sessionStorage.removeItem("builder-active-tool")
    }
  }, [])
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
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0)

  // Footer editor state
  const [editingFooter, setEditingFooter] = useState(false)
  const [footerMenuId] = useState<string | null>(initialFooterMenuId ?? null)
  const [footerMenuItems, setFooterMenuItems] = useState<MenuItemData[]>(initialFooterMenuItemsFull ?? [])

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
    // Tell the iframe to reload so the navbar picks up the new menu data
    setPreviewRefreshKey((k) => k + 1)
  }, [headerMenuId])

  // Refresh footer menu data from the API after footer edits
  const refreshFooterMenu = useCallback(async () => {
    if (!footerMenuId) return
    try {
      const res = await fetch(`/api/v1/menus/${footerMenuId}/items`)
      if (res.ok) {
        const { data } = await res.json()
        setFooterMenuItems(data.items ?? [])
      }
    } catch {
      // Silently fail — the footer editor has its own error handling
    }
    // Tell the iframe to reload so the footer picks up the new menu data
    setPreviewRefreshKey((k) => k + 1)
  }, [footerMenuId])

  // Page modals
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false)
  const [pageSettingsTarget, setPageSettingsTarget] = useState<PageSettingsData | null>(null)
  const [addPageOpen, setAddPageOpen] = useState(false)

  // -------------------------------------------------------------------------
  // Undo / Redo history
  // -------------------------------------------------------------------------

  const history = useBuilderHistory<BuilderSnapshot>()

  // Pristine snapshot — the state as loaded from the DB (or after save).
  // Used to detect when undo/redo returns to the initial state.
  const pristineRef = useRef<string>(
    JSON.stringify({ sections: page.sections, pageTitle: page.title })
  )

  /** Push the current state as a snapshot before mutating. */
  const pushSnapshot = useCallback(() => {
    history.push({ sections, pageTitle: pageData.title })
  }, [history, sections, pageData.title])

  const handleUndo = useCallback(() => {
    const snapshot = history.undo({ sections, pageTitle: pageData.title })
    if (snapshot) {
      setSections(snapshot.sections)
      setPageData((prev) => ({ ...prev, title: snapshot.pageTitle }))

      // Check if undo restored us to the pristine (DB-loaded) state
      const snapshotStr = JSON.stringify({ sections: snapshot.sections, pageTitle: snapshot.pageTitle })
      if (snapshotStr === pristineRef.current) {
        setIsDirty(false)
        setDirtySectionIds(new Set())
        setReorderDirty(false)
        setPageDirty(false)
      } else {
        setIsDirty(true)
        // After undo, any section could differ from the DB — mark all dirty
        setDirtySectionIds(new Set(snapshot.sections.map((s) => s.id)))
        setReorderDirty(true)
        setPageDirty(true)
      }
      // Reset debounce so the next edit after undo gets its own snapshot
      lastSnapshotTimeRef.current = 0
    }
  }, [history, sections, pageData.title])

  const handleRedo = useCallback(() => {
    const snapshot = history.redo({ sections, pageTitle: pageData.title })
    if (snapshot) {
      setSections(snapshot.sections)
      setPageData((prev) => ({ ...prev, title: snapshot.pageTitle }))

      // Check if redo restored us to the pristine (DB-loaded) state
      const snapshotStr = JSON.stringify({ sections: snapshot.sections, pageTitle: snapshot.pageTitle })
      if (snapshotStr === pristineRef.current) {
        setIsDirty(false)
        setDirtySectionIds(new Set())
        setReorderDirty(false)
        setPageDirty(false)
      } else {
        setIsDirty(true)
        // After redo, any section could differ from the DB — mark all dirty
        setDirtySectionIds(new Set(snapshot.sections.map((s) => s.id)))
        setReorderDirty(true)
        setPageDirty(true)
      }
      // Reset debounce so the next edit after redo gets its own snapshot
      lastSnapshotTimeRef.current = 0
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
    setEditingFooter(false)
    setIsDirty(false)
    setDirtySectionIds(new Set())
    setReorderDirty(false)
    setPageDirty(false)
    setSaveState("idle")
    pristineRef.current = JSON.stringify({ sections: page.sections, pageTitle: page.title })
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
      setActiveTool(activeTool === tool ? null : tool)
    },
    [sections.length, activeTool, setActiveTool],
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
        const deletedNames: string[] = []
        results.forEach((res, i) => {
          if (!res.ok) {
            const s = dirtySections[i]
            const name = s.label || s.sectionType
            if (res.status === 404) {
              deletedNames.push(name)
            } else {
              failedNames.push(name)
            }
          }
        })

        // Remove sections that were deleted by another user from local state
        if (deletedNames.length > 0) {
          const deletedIds = new Set(
            dirtySections
              .filter((_, i) => results[i].status === 404)
              .map((s) => s.id),
          )
          setSections((prev) => prev.filter((s) => !deletedIds.has(s.id)))
          setDirtySectionIds((prev) => {
            const next = new Set(prev)
            for (const id of deletedIds) next.delete(id)
            return next
          })
          if (editingSectionId && deletedIds.has(editingSectionId)) {
            setEditingSectionId(null)
          }
          if (selectedSectionId && deletedIds.has(selectedSectionId)) {
            setSelectedSectionId(null)
          }
          toast.warning(
            `${deletedNames.length} section(s) were deleted by another user: ${deletedNames.join(", ")}`,
          )
        }

        if (failedNames.length > 0) {
          setSaveState("idle")
          toast.error(
            `Failed to save ${failedNames.length} section(s): ${failedNames.join(", ")}`,
          )
          return
        }
      }

      // Capture dirty state before clearing (needed for merge logic below)
      const savedSectionIds = new Set(dirtySectionIds)
      const wasPageDirty = pageDirty

      setDirtySectionIds(new Set())
      setReorderDirty(false)
      setPageDirty(false)
      setIsDirty(false)
      setSaveState("saved")
      toast.success("Page saved")

      // Silent background refetch to pick up other users' changes
      try {
        const freshRes = await fetch(`/api/v1/pages/${pagePathId(pageData)}`)
        if (freshRes.ok) {
          const { data: freshPage } = await freshRes.json()
          const freshSections: BuilderSection[] = (freshPage.sections ?? []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            sectionType: s.sectionType as BuilderSection["sectionType"],
            label: (s.label as string | null) ?? null,
            sortOrder: s.sortOrder as number,
            visible: s.visible as boolean,
            colorScheme: s.colorScheme as BuilderSection["colorScheme"],
            paddingY: s.paddingY as BuilderSection["paddingY"],
            containerWidth: s.containerWidth as BuilderSection["containerWidth"],
            enableAnimations: s.enableAnimations as boolean,
            content: s.content as Record<string, unknown>,
            resolvedData: s.resolvedData as Record<string, unknown> | undefined,
          }))

          // Merge: use server version for all sections, but keep local version
          // for sections we just saved (they're authoritative).
          // Also preserve any local-only sections added during the refetch window.
          const freshIds = new Set(freshSections.map(s => s.id))
          setSections(prev => {
            const localMap = new Map(prev.map(s => [s.id, s]))

            const merged = freshSections.map(fs => {
              if (savedSectionIds.has(fs.id) && localMap.has(fs.id)) {
                return localMap.get(fs.id)!
              }
              return fs
            })

            // Append any local-only sections (added during save) that the
            // server doesn't know about yet
            for (const local of prev) {
              if (!freshIds.has(local.id)) {
                merged.push(local)
              }
            }

            return merged
          })

          // Clear selection/editing if the section was removed by another user
          setSelectedSectionId(prev => (prev && !freshIds.has(prev) ? null : prev))
          setEditingSectionId(prev => (prev && !freshIds.has(prev) ? null : prev))

          // Update page title if we didn't just save it
          if (!wasPageDirty) {
            setPageData(prev => ({ ...prev, title: freshPage.title }))
          }

          // Update pristine ref to match the new server state
          pristineRef.current = JSON.stringify({
            sections: freshSections,
            pageTitle: freshPage.title,
          })
        }
      } catch {
        // Silent failure — user still has their saved state
      }

      // Reset undo history since the base state has changed
      history.reset()

      router.refresh()

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData, sections, router, pageDirty, reorderDirty, dirtySectionIds, history.reset])

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

  // -------------------------------------------------------------------------
  // Background sync — poll for other users' changes every 15s when idle
  // -------------------------------------------------------------------------

  const handleBackgroundSync = useCallback((freshPage: Record<string, unknown>) => {
    const freshSections: BuilderSection[] = ((freshPage.sections as unknown[]) ?? []).map((s: unknown) => {
      const sec = s as Record<string, unknown>
      return {
        id: sec.id as string,
        sectionType: sec.sectionType as BuilderSection["sectionType"],
        label: (sec.label as string | null) ?? null,
        sortOrder: sec.sortOrder as number,
        visible: sec.visible as boolean,
        colorScheme: sec.colorScheme as BuilderSection["colorScheme"],
        paddingY: sec.paddingY as BuilderSection["paddingY"],
        containerWidth: sec.containerWidth as BuilderSection["containerWidth"],
        enableAnimations: sec.enableAnimations as boolean,
        content: sec.content as Record<string, unknown>,
        resolvedData: sec.resolvedData as Record<string, unknown> | undefined,
      }
    })

    const freshIds = new Set(freshSections.map(s => s.id))

    setSections(freshSections)
    setPageData(prev => ({ ...prev, title: freshPage.title as string }))
    pristineRef.current = JSON.stringify({
      sections: freshSections,
      pageTitle: freshPage.title,
    })
    history.reset()

    // Clear selection/editing if the section was removed by another user
    setSelectedSectionId(prev => (prev && !freshIds.has(prev) ? null : prev))
    setEditingSectionId(prev => (prev && !freshIds.has(prev) ? null : prev))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.reset])

  useBackgroundSync({
    pageSlug: pageData.slug,
    pageId: pageData.id,
    isDirty,
    isSaving,
    onSync: handleBackgroundSync,
  })

  const { otherEditors } = usePresenceHeartbeat({ pageId: pageData.id })

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
        } else if (editingFooter) {
          setEditingFooter(false)
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
        // Only defer to native undo for text-like inputs where it makes sense
        const active = document.activeElement
        if (active instanceof HTMLTextAreaElement) {
          return
        }
        if (active instanceof HTMLInputElement) {
          const textTypes = new Set([
            "text", "email", "url", "search", "tel", "password", "number",
          ])
          if (textTypes.has(active.type || "text")) {
            return
          }
        }
        if (active instanceof HTMLElement && active.isContentEditable) {
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
  }, [selectedSectionId, activeTool, editingSectionId, editingNavbar, editingNavItemId, editingNavSettings, editingFooter])

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
        // Clamp insert index to current sections length (sync may have changed sections)
        const clampedIndex = Math.min(pickerInsertIndex, sections.length - 1)
        const sortOrder = clampedIndex + 1
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
          const safeIndex = Math.min(clampedIndex + 1, updated.length)
          updated.splice(safeIndex, 0, newSection)
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
    [pageData.slug, pageData.id, pickerInsertIndex, sections.length, pushSnapshot],
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
      setEditingFooter(false)
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

  // Track when we last pushed a snapshot so rapid-fire changes (e.g. typing)
  // are batched (~500ms), while discrete changes (padding, toggles) each get
  // their own undo entry.
  const lastSnapshotTimeRef = useRef(0)

  // Handle inline changes from the right drawer (updates local state immediately)
  const handleSectionEditorChange = useCallback(
    (data: Partial<SectionEditorData>) => {
      if (!editingSectionId) return

      // Push a snapshot before applying the change, debounced by 500ms so
      // rapid keystrokes are batched but discrete property changes (padding,
      // color scheme, visibility) each get their own undo entry.
      const now = Date.now()
      if (now - lastSnapshotTimeRef.current >= 500) {
        pushSnapshot()
        lastSnapshotTimeRef.current = now
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
    // Close any section/footer editor and open navbar settings
    setEditingSectionId(null)
    setEditingNavItemId(null)
    setEditingNavSettings(true)
    setEditingNavbar(true)
    setEditingFooter(false)
  }, [])

  const handleNavbarClose = useCallback(() => {
    setEditingNavbar(false)
    setEditingNavSettings(false)
  }, [])

  const handleFooterClick = useCallback(() => {
    // Close any section/navbar editor and open footer editor
    setEditingSectionId(null)
    setEditingNavbar(false)
    setEditingNavItemId(null)
    setEditingNavSettings(false)
    setEditingFooter(true)
  }, [])

  const handleFooterClose = useCallback(() => {
    setEditingFooter(false)
  }, [])

  const handleFooterUpdated = useCallback(() => {
    refreshFooterMenu()
  }, [refreshFooterMenu])

  /** Open the NavSettingsForm in the right drawer (triggered by CTA "Edit" button) */
  const handleEditCTA = useCallback(() => {
    setEditingSectionId(null)
    setEditingNavItemId(null)
    setEditingNavSettings(true)
    setEditingNavbar(true)
    setEditingFooter(false)
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
    // Reload the iframe so the navbar picks up updated settings (CTA, scroll behavior, etc.)
    setPreviewRefreshKey((k) => k + 1)
  }, [])

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
    async (newPage: PageSummary) => {
      setPages((prev) => [...prev, newPage])

      // Auto-create a MenuItem for the new page in the header menu
      if (headerMenuId) {
        try {
          await fetch(`/api/v1/menus/${headerMenuId}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: newPage.title,
              href: `/${newPage.slug}`,
            }),
          })
          await refreshMenu()
        } catch {
          // MenuItem creation failed — page still exists, just not in nav
          console.error("Failed to auto-create menu item for new page")
        }
      }

      navigateAway(`/cms/website/builder/${newPage.id}`)
      toast.success("Page created")
    },
    [navigateAway, headerMenuId, refreshMenu],
  )

  // -------------------------------------------------------------------------
  // Drawer title
  // -------------------------------------------------------------------------

  const drawerTitle =
    activeTool === "navigation"
      ? "Pages & Navigation"
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
            onEditCTA={handleEditCTA}
            activePageId={pageData.id}
            onPageSelect={handlePageSelect}
            onPageSettings={handlePageSettings}
            onAddPage={() => setAddPageOpen(true)}
            onDeletePage={handleDeletePage}
            onDuplicatePage={handleDuplicatePage}
          />
        ) : (
          // No-menu fallback: show a flat list of all pages with click-to-navigate
          <div className="flex flex-col h-full">
            <div className="flex flex-col gap-2 p-4 pb-2 border-b shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Pages</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs h-8 gap-2"
                onClick={() => setAddPageOpen(true)}
              >
                <Plus className="size-3.5" />
                Add Page
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3">
                {pages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="size-10 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No pages yet</p>
                    <p className="text-xs mt-1">Create your first page to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {pages.map((p) => {
                      const isActive = p.id === pageData.id
                      return (
                        <div
                          key={p.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handlePageSelect(p.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              handlePageSelect(p.id)
                            }
                          }}
                          className={cn(
                            "group flex items-center gap-2 px-2 py-2 rounded-md transition-colors cursor-pointer",
                            isActive
                              ? "bg-sidebar-accent border-l-2 border-primary text-primary"
                              : "hover:bg-muted/50 text-foreground",
                          )}
                        >
                          <FileText className="size-3.5 shrink-0 opacity-70" />
                          <span className={cn(
                            "text-xs truncate flex-1",
                            isActive ? "font-semibold" : "font-medium",
                          )}>
                            {p.title}
                          </span>
                          {isActive && <Check className="size-3 text-primary shrink-0" />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>
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

      {/* Presence warning banner */}
      {otherEditors.length > 0 && (
        <div role="status" className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 shrink-0">
          <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          <p className="text-amber-800 dark:text-amber-200 text-sm">
            {otherEditors.length === 1 ? (
              <>
                <strong>{otherEditors[0].userName}</strong> is also editing this
                page &mdash; your changes may overwrite theirs if you save now.
              </>
            ) : otherEditors.length === 2 ? (
              <>
                <strong>{otherEditors[0].userName}</strong> and{" "}
                <strong>{otherEditors[1].userName}</strong> are also editing this
                page &mdash; your changes may overwrite theirs if you save now.
              </>
            ) : (
              <>
                <strong>{otherEditors[0].userName}</strong>,{" "}
                <strong>{otherEditors[1].userName}</strong>, and{" "}
                {otherEditors.length - 2} other
                {otherEditors.length - 2 > 1 ? "s" : ""} are also editing this
                page &mdash; your changes may overwrite theirs if you save now.
              </>
            )}
          </p>
        </div>
      )}

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
            setEditingFooter(false)
          }}
          onDeselectSection={() => {
            setSelectedSectionId(null)
            setEditingSectionId(null)
            setEditingNavbar(false)
            setEditingFooter(false)
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
          onFooterClick={handleFooterClick}
          isFooterEditing={editingFooter}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          previewRefreshKey={previewRefreshKey}
        />

        {/* Right Drawer (320px, animated) — inline section / navbar / nav item editor */}
        <BuilderRightDrawer
          section={editingNavItemId || editingNavSettings || editingFooter ? null : editingSection}
          onClose={handleCloseEditor}
          onChange={handleSectionEditorChange}
          onDelete={handleDeleteSection}
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
          editingFooter={editingFooter}
          footerMenuId={footerMenuId}
          footerMenuItems={footerMenuItems}
          onFooterClose={handleFooterClose}
          onFooterUpdated={handleFooterUpdated}
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
