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
import { cn } from "@/lib/utils"
import { SortableSection } from "./sortable-section"
import { SectionAddTrigger } from "./section-add-trigger"
import { SectionPreview } from "./section-preview"
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
      className="flex-1 bg-muted/30 overflow-y-auto overflow-x-hidden"
      onClick={handleCanvasClick}
    >
      {/* Device preview container */}
      <div
        className={cn(
          "mx-auto bg-background transition-all duration-300 ease-in-out",
          deviceMode !== "desktop" &&
            "shadow-xl my-6 rounded-lg overflow-hidden border",
        )}
        style={{
          maxWidth: deviceWidths[deviceMode],
          minHeight: deviceMode === "desktop" ? "100%" : "auto",
        }}
      >
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
                  <SectionPreview
                    type={section.sectionType}
                    content={section.content}
                    colorScheme={section.colorScheme}
                    label={section.label}
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

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragSection && (
              <div className="opacity-80 shadow-2xl rounded-lg overflow-hidden">
                <SectionPreview
                  type={activeDragSection.sectionType}
                  content={activeDragSection.content}
                  colorScheme={activeDragSection.colorScheme}
                  label={activeDragSection.label}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
