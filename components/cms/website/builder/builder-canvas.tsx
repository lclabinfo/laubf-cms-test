"use client"

import { useCallback, useMemo, useState } from "react"
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
import { SortableSection } from "./sortable-section"
import { SectionAddTrigger } from "./section-add-trigger"
import { BuilderSectionRenderer } from "./builder-section-renderer"
import { WebsiteNavbar } from "@/components/website/layout/website-navbar"
import type { NavbarData } from "./builder-shell"
import type { BuilderSection, DeviceMode } from "./types"

/**
 * Custom modifier that centers the drag overlay on the cursor.
 * By default, DragOverlay preserves the offset between the grab point
 * and the overlay's top-left corner. This modifier adjusts the transform
 * so the overlay's center-top region aligns with the cursor position.
 */
const centerOnCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  draggingNodeRect,
  transform,
}) => {
  if (!activatorEvent || !activeNodeRect || !draggingNodeRect) {
    return transform
  }

  const event = activatorEvent as PointerEvent
  if (typeof event.clientX !== "number") {
    return transform
  }

  // Calculate where the cursor was relative to the active node's top-left
  const cursorOffsetX = event.clientX - activeNodeRect.left
  const cursorOffsetY = event.clientY - activeNodeRect.top

  // We want the cursor to appear at center-x, near the top (20% from top) of the overlay
  const overlayWidth = draggingNodeRect.width
  const overlayHeight = draggingNodeRect.height
  const targetX = overlayWidth / 2
  const targetY = Math.min(overlayHeight * 0.2, 40)

  return {
    ...transform,
    x: transform.x + cursorOffsetX - targetX,
    y: transform.y + cursorOffsetY - targetY,
  }
}

interface BuilderCanvasProps {
  sections: BuilderSection[]
  selectedSectionId: string | null
  onSelectSection: (id: string | null) => void
  onDeselectSection: () => void
  onAddSection: (afterIndex: number) => void
  onAddSectionWithRect?: (afterIndex: number, rect: DOMRect) => void
  onDeleteSection: (sectionId: string) => void
  onEditSection: (sectionId: string) => void
  onReorderSections: (sections: BuilderSection[]) => void
  deviceMode: DeviceMode
  churchId: string
  pageSlug: string
  websiteThemeTokens?: Record<string, string>
  websiteCustomCss?: string
  navbarData?: NavbarData
  onNavbarClick?: () => void
  onNavbarLinkClick?: (href: string) => void
  isNavbarEditing?: boolean
}

const deviceWidths: Record<DeviceMode, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
}

export function BuilderCanvas({
  sections,
  selectedSectionId,
  onSelectSection,
  onDeselectSection,
  onAddSection,
  onAddSectionWithRect,
  onDeleteSection,
  onEditSection,
  onReorderSections,
  deviceMode,
  churchId,
  websiteThemeTokens,
  websiteCustomCss,
  navbarData,
  onNavbarClick,
  onNavbarLinkClick,
  isNavbarEditing,
}: BuilderCanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

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
        onReorderSections(reordered)
      }
    },
    [sections, onReorderSections],
  )

  const handleCanvasClick = useCallback(() => {
    onDeselectSection()
  }, [onDeselectSection])

  const activeDragSection = activeId
    ? sections.find((s) => s.id === activeId)
    : null

  // Stable reference for the DragOverlay modifiers array
  const dragOverlayModifiers = useMemo<Modifier[]>(() => [centerOnCursor], [])

  return (
    <div
      className="flex-1 bg-muted/30 overflow-y-auto overflow-x-hidden p-4"
      onClick={handleCanvasClick}
    >
      {/* Device preview container — website theme scoped here only */}
      <div
        data-website=""
        className="mx-auto bg-white transition-all duration-300 ease-in-out overflow-hidden shadow-sm border"
        style={{
          maxWidth: deviceWidths[deviceMode],
          minHeight: "calc(100vh - 120px)",
          ...(websiteThemeTokens as React.CSSProperties),
        }}
      >
        {/* Custom CSS from ThemeCustomization — mirrors ThemeProvider behavior */}
        {websiteCustomCss && (
          <style dangerouslySetInnerHTML={{ __html: websiteCustomCss }} />
        )}

        {/* Website navbar preview — click links to navigate, click background to edit */}
        {navbarData && (
          <div
            className={cn(
              "relative z-[5] cursor-pointer group/navbar",
              isNavbarEditing
                ? "shadow-[inset_0_0_0_2px_rgb(37,99,235),0_0_0_4px_rgba(37,99,235,0.1)]"
                : "shadow-none hover:shadow-[inset_0_0_0_2px_rgba(37,99,235,0.3)]",
              "transition-all duration-200",
            )}
            onClick={(e) => {
              e.stopPropagation()

              // Check if the click target is a link (anchor tag)
              const target = e.target as HTMLElement
              const link = target.closest("a")

              if (link) {
                // Prevent default navigation — links point to website pages, not builder pages
                e.preventDefault()
                const href = link.getAttribute("href")
                if (href && onNavbarLinkClick) {
                  // Ignore external links
                  if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("mailto:")) {
                    onNavbarLinkClick(href)
                    return
                  }
                }
              }

              // Background click (non-link area) — open navbar editor
              onNavbarClick?.()
            }}
          >
            <div className="[&_header]:!relative">
              <WebsiteNavbar
                menu={navbarData.menu as Parameters<typeof WebsiteNavbar>[0]["menu"]}
                logoUrl={navbarData.logoUrl}
                logoAlt={navbarData.logoAlt}
                siteName={navbarData.siteName}
                ctaLabel={navbarData.ctaLabel}
                ctaHref={navbarData.ctaHref}
                ctaVisible={navbarData.ctaVisible}
                memberLoginVisible={navbarData.memberLoginVisible}
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
                      onClick={() => onAddSection(-1)}
                      onClickWithRect={onAddSectionWithRect ? (rect: DOMRect) => onAddSectionWithRect(-1, rect) : undefined}
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
                onSelect={() => onSelectSection(section.id)}
                onDelete={() => onDeleteSection(section.id)}
                onAddBefore={() => onAddSection(index - 1)}
                onAddAfter={() => onAddSection(index)}
                onAddBeforeWithRect={onAddSectionWithRect ? (rect: DOMRect) => onAddSectionWithRect(index - 1, rect) : undefined}
                onAddAfterWithRect={onAddSectionWithRect ? (rect: DOMRect) => onAddSectionWithRect(index, rect) : undefined}
                onEdit={() => onEditSection(section.id)}
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
              <div className="flex justify-center py-8">
                <SectionAddTrigger
                  onClick={() => onAddSection(sections.length - 1)}
                  onClickWithRect={onAddSectionWithRect ? (rect: DOMRect) => onAddSectionWithRect(sections.length - 1, rect) : undefined}
                />
              </div>
            )}
          </SortableContext>

          {/* Drag overlay — scaled-down visual clone of the section, centered on cursor */}
          <DragOverlay dropAnimation={null} modifiers={dragOverlayModifiers}>
            {activeDragSection && (
              <div
                style={{
                  width: "60vw",
                  maxWidth: "600px",
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                  opacity: 0.75,
                  pointerEvents: "none",
                  overflow: "hidden",
                  maxHeight: "300px",
                  borderRadius: "8px",
                  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
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
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
