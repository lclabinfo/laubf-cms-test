"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import { Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SortableSection } from "./sortable-section"
import { SectionAddTrigger } from "../sections/section-add-trigger"
import { BuilderSectionRenderer } from "./builder-section-renderer"
import { WebsiteNavbar } from "@/components/website/layout/website-navbar"
import { WebsiteFooter } from "@/components/website/layout/website-footer"
import { useParentMessages, postToParent } from "./iframe-protocol"
import type { BuilderSection, NavbarData } from "../types"

// ---------------------------------------------------------------------------
// Drag overlay scale factor — how much to shrink the section thumbnail
// ---------------------------------------------------------------------------

const DRAG_OVERLAY_SCALE = 0.25

// ---------------------------------------------------------------------------
// centerOnCursor modifier — centers the drag overlay on the cursor.
// Because we use transform:scale on an inner element the DragOverlay wrapper
// is 0×0 in layout. We offset by half the *visual* overlay size so the
// cursor lands at the center of the thumbnail.
// ---------------------------------------------------------------------------

const centerOnCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  transform,
}) => {
  if (!activatorEvent || !activeNodeRect) {
    return transform
  }

  const event = activatorEvent as PointerEvent
  if (typeof event.clientX !== "number") {
    return transform
  }

  // Where the cursor was relative to the section's top-left
  const cursorOffsetX = event.clientX - activeNodeRect.left
  const cursorOffsetY = event.clientY - activeNodeRect.top

  // Visual size of the overlay thumbnail
  const overlayVisualWidth = activeNodeRect.width * DRAG_OVERLAY_SCALE
  const overlayVisualHeight = Math.min(
    activeNodeRect.height * DRAG_OVERLAY_SCALE,
    200, // matches maxHeight on the outer clip container
  )

  return {
    ...transform,
    x: transform.x + cursorOffsetX - overlayVisualWidth / 2,
    y: transform.y + cursorOffsetY - overlayVisualHeight / 2,
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BuilderPreviewClientProps {
  initialSections: BuilderSection[]
  initialSelectedSectionId: string | null
  churchId: string
  pageSlug: string
  navbarData: NavbarData | null
  footerMenu: Parameters<typeof WebsiteFooter>[0]["menu"] | null
  footerSiteSettings: Parameters<typeof WebsiteFooter>[0]["siteSettings"] | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BuilderPreviewClient({
  initialSections,
  initialSelectedSectionId,
  churchId,
  pageSlug,
  navbarData,
  footerMenu,
  footerSiteSettings,
}: BuilderPreviewClientProps) {
  // ── State ──
  const [sections, setSections] = useState<BuilderSection[]>(initialSections)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    initialSelectedSectionId,
  )
  const [isNavbarEditing, setIsNavbarEditing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)

  // ── Listen for messages from the parent frame ──

  useParentMessages({
    INIT_DATA: (msg) => {
      // Merge incoming sections with existing resolvedData (server-resolved
      // dynamic data for events, messages, etc.) since the parent's sections
      // may not carry resolvedData.
      setSections((prev) => {
        const resolvedMap = new Map(prev.map((s) => [s.id, s.resolvedData]))
        return msg.sections.map((s) => ({
          ...s,
          resolvedData: s.resolvedData ?? resolvedMap.get(s.id),
        }))
      })
      setSelectedSectionId(msg.selectedSectionId)
      setIsNavbarEditing(msg.isNavbarEditing)
    },
    UPDATE_SECTIONS: (msg) =>
      setSections((prev) => {
        const resolvedMap = new Map(prev.map((s) => [s.id, s.resolvedData]))
        return msg.sections.map((s) => ({
          ...s,
          resolvedData: s.resolvedData ?? resolvedMap.get(s.id),
        }))
      }),
    SELECT_SECTION: (msg) => setSelectedSectionId(msg.sectionId),
    UPDATE_NAVBAR: (msg) => setIsNavbarEditing(msg.isNavbarEditing),
    RELOAD_PAGE: () => window.location.reload(),
  })

  // ── Signal READY on mount ──

  useEffect(() => {
    postToParent({ type: "READY" })
  }, [])

  // ── Forward keyboard shortcuts to parent ──
  // The parent's keydown listener can't hear events inside the iframe,
  // so we intercept builder shortcuts here and forward via postMessage.

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        postToParent({ type: "KEYBOARD_SHORTCUT", shortcut: "save" })
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault()
        postToParent({
          type: "KEYBOARD_SHORTCUT",
          shortcut: e.shiftKey ? "redo" : "undo",
        })
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // ── Report content height via ResizeObserver (RAF-throttled) ──

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    let rafId = 0
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        for (const entry of entries) {
          postToParent({
            type: "CONTENT_HEIGHT",
            height: entry.contentRect.height,
          })
        }
      })
    })

    observer.observe(el)
    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  // ── DnD setup ──

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (over && active.id !== over.id) {
        const oldIndex = sections.findIndex((s) => s.id === active.id)
        const newIndex = sections.findIndex((s) => s.id === over.id)
        const reordered = arrayMove(sections, oldIndex, newIndex).map(
          (s, i) => ({ ...s, sortOrder: i }),
        )
        setSections(reordered)
        postToParent({ type: "SECTIONS_REORDERED", sections: reordered })
      }
    },
    [sections],
  )

  // ── Click handlers ──

  const handleCanvasClick = useCallback(() => {
    postToParent({ type: "DESELECT" })
  }, [])

  const handleSelectSection = useCallback((sectionId: string) => {
    setSelectedSectionId(sectionId)
    postToParent({ type: "SECTION_CLICKED", sectionId })
  }, [])

  const handleDeleteSection = useCallback((sectionId: string) => {
    postToParent({ type: "SECTION_DELETE", sectionId })
  }, [])

  const handleEditSection = useCallback((sectionId: string) => {
    postToParent({ type: "SECTION_EDIT", sectionId })
  }, [])

  const handleAddSection = useCallback((afterIndex: number) => {
    postToParent({ type: "SECTION_ADD", afterIndex })
  }, [])

  // ── Navbar click handlers ──

  const handleNavbarClick = useCallback((e: React.MouseEvent) => {
    // Stop this click from reaching the canvas "deselect" handler
    e.stopPropagation()

    const target = e.target as HTMLElement

    // Let <button> clicks through so dropdown toggles work in the navbar
    const button = target.closest("button")
    if (button) {
      // The button click will toggle the dropdown internally — don't intercept
      return
    }

    const link = target.closest("a")
    if (link) {
      e.preventDefault()
      const href = link.getAttribute("href")
      if (href) {
        if (
          !href.startsWith("http://") &&
          !href.startsWith("https://") &&
          !href.startsWith("mailto:")
        ) {
          postToParent({ type: "NAVBAR_LINK_CLICKED", href })
          return
        }
      }
    }

    // Background click (non-link area) — open navbar editor
    postToParent({ type: "NAVBAR_CLICKED" })
  }, [])

  // ── Derived values ──

  const activeDragSection = activeId
    ? sections.find((s) => s.id === activeId)
    : null

  const dragOverlayModifiers = useMemo<Modifier[]>(() => [centerOnCursor], [])

  return (
    <div ref={rootRef} onClick={handleCanvasClick}>
      {/* Website navbar preview */}
      {navbarData && (
        <div
          className={cn(
            "relative z-[100] cursor-pointer group/navbar",
            isNavbarEditing
              ? "shadow-[inset_0_0_0_2px_rgb(37,99,235),0_0_0_4px_rgba(37,99,235,0.1)]"
              : "shadow-none hover:shadow-[inset_0_0_0_2px_rgba(37,99,235,0.3)]",
            "transition-all duration-200",
          )}
          onClick={handleNavbarClick}
        >
          <div className="[&_header]:!relative">
            <WebsiteNavbar
              menu={navbarData.menu as Parameters<typeof WebsiteNavbar>[0]["menu"]}
              logoUrl={navbarData.logoUrl}
              logoDarkUrl={navbarData.logoDarkUrl}
              logoAlt={navbarData.logoAlt}
              siteName={navbarData.siteName}
              ctaLabel={navbarData.ctaLabel}
              ctaHref={navbarData.ctaHref}
              ctaVisible={navbarData.ctaVisible}
              memberLoginLabel={navbarData.memberLoginLabel}
              memberLoginHref={navbarData.memberLoginHref}
              memberLoginVisible={navbarData.memberLoginVisible}
              scrollBehavior={navbarData.scrollBehavior}
              solidColor={navbarData.solidColor}
              sticky={navbarData.sticky}
            />
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Empty state */}
          {sections.length === 0 && (
            <div className="flex items-center justify-center py-32">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-sm">
                  No sections yet. Add your first section to get started.
                </p>
                <div className="flex justify-center">
                  <SectionAddTrigger
                    onClick={() => handleAddSection(-1)}
                  />
                </div>
              </div>
            </div>
          )}

          {sections.map((section, index) => (
            <SortableSection
              key={section.id}
              id={section.id}
              isSelected={selectedSectionId === section.id}
              onSelect={() => handleSelectSection(section.id)}
              onDelete={() => handleDeleteSection(section.id)}
              onAddBefore={() => handleAddSection(index - 1)}
              onAddAfter={() => handleAddSection(index)}
              onEdit={() => handleEditSection(section.id)}
              isFirst={index === 0}
            >
              <div className={cn(!section.visible && "opacity-40 relative")}>
                <BuilderSectionRenderer
                  type={section.sectionType}
                  content={section.content}
                  colorScheme={section.colorScheme}
                  paddingY={section.paddingY}
                  containerWidth={section.containerWidth}
                  enableAnimations={false}
                  churchId={churchId}
                  resolvedData={section.resolvedData}
                />
                {!section.visible && (
                  <div className="absolute top-2 left-2 z-40 bg-muted/80 text-muted-foreground text-xs font-medium px-2 py-1 rounded">
                    Hidden
                  </div>
                )}
              </div>
            </SortableSection>
          ))}

          {/* Bottom add trigger */}
          {sections.length > 0 && (
            <div className="flex justify-center py-4">
              <SectionAddTrigger
                onClick={() => handleAddSection(sections.length - 1)}
              />
            </div>
          )}
        </SortableContext>

        {/* Drag overlay — scaled-down static snapshot of the full section.
            We render at the iframe's full viewport width, then scale it down
            so it looks proportionate to the current device view. */}
        <DragOverlay dropAnimation={null} modifiers={dragOverlayModifiers}>
          {activeDragSection && (
            <div
              style={{
                // Outer clip container — sized to the visual (scaled) dimensions
                width: window.innerWidth * DRAG_OVERLAY_SCALE,
                maxHeight: 200,
                overflow: "hidden",
                borderRadius: 8,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                opacity: 0.85,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: window.innerWidth,
                  transform: `scale(${DRAG_OVERLAY_SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                <BuilderSectionRenderer
                  type={activeDragSection.sectionType}
                  content={activeDragSection.content}
                  colorScheme={activeDragSection.colorScheme}
                  paddingY={activeDragSection.paddingY}
                  containerWidth={activeDragSection.containerWidth}
                  enableAnimations={false}
                  churchId={churchId}
                  resolvedData={activeDragSection.resolvedData}
                />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Website footer preview — view-only, links disabled */}
      {footerMenu && footerSiteSettings && (
        <div className="[&_a]:pointer-events-none">
          <WebsiteFooter menu={footerMenu} siteSettings={footerSiteSettings} />
        </div>
      )}
    </div>
  )
}
