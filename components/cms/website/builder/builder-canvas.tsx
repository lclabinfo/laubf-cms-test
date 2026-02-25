"use client"

import { useCallback, useState } from "react"
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
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { SortableSection } from "./sortable-section"
import { SectionAddTrigger } from "./section-add-trigger"
import { BuilderSectionRenderer } from "./builder-section-renderer"
import { WebsiteNavbar } from "@/components/website/layout/website-navbar"
import { sectionTypeLabels } from "@/components/cms/website/pages/section-picker-dialog"
import type { NavbarData } from "./builder-shell"
import type { BuilderSection, DeviceMode } from "./types"

interface BuilderCanvasProps {
  sections: BuilderSection[]
  selectedSectionId: string | null
  onSelectSection: (id: string | null) => void
  onDeselectSection: () => void
  onAddSection: (afterIndex: number) => void
  onDeleteSection: (sectionId: string) => void
  onEditSection: (sectionId: string) => void
  onReorderSections: (sections: BuilderSection[]) => void
  deviceMode: DeviceMode
  churchId: string
  pageSlug: string
  websiteThemeTokens?: Record<string, string>
  navbarData?: NavbarData
  onNavbarClick?: () => void
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
  onDeleteSection,
  onEditSection,
  onReorderSections,
  deviceMode,
  churchId,
  websiteThemeTokens,
  navbarData,
  onNavbarClick,
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
        {/* Website navbar preview — click to edit, links disabled in builder */}
        {navbarData && (
          <div
            className={cn(
              "relative z-[60] cursor-pointer group/navbar",
              isNavbarEditing
                ? "outline outline-2 outline-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
                : "outline outline-2 outline-transparent hover:outline-blue-600/30",
              "transition-all duration-200",
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onNavbarClick?.()
            }}
          >
            {/* pointer-events-none prevents links inside from navigating away */}
            <div className="pointer-events-none">
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
                    <SectionAddTrigger onClick={() => onAddSection(-1)} />
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
                />
              </div>
            )}
          </SortableContext>

          {/* Drag overlay — compact label card, positioned at cursor */}
          <DragOverlay dropAnimation={null}>
            {activeDragSection && (
              <div className="bg-background/95 backdrop-blur-sm shadow-2xl rounded-lg border px-4 py-3 flex items-center gap-3 w-[280px]">
                <GripVertical className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {activeDragSection.label ||
                      sectionTypeLabels[activeDragSection.sectionType] ||
                      activeDragSection.sectionType}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {sectionTypeLabels[activeDragSection.sectionType] || activeDragSection.sectionType}
                  </div>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
