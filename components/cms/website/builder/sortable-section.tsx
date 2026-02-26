"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Edit3, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionAddTrigger } from "./section-add-trigger"

interface SortableSectionProps {
  id: string
  children: React.ReactNode
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onAddBefore: () => void
  onAddAfter: () => void
  onAddBeforeWithRect?: (rect: DOMRect) => void
  onAddAfterWithRect?: (rect: DOMRect) => void
  onEdit?: () => void
  isFirst?: boolean
}

export function SortableSection({
  id,
  children,
  isSelected,
  onSelect,
  onDelete,
  onAddBefore,
  onAddAfter,
  onAddBeforeWithRect,
  onAddAfterWithRect,
  onEdit,
  isFirst = false,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : isSelected ? 70 : 1,
    position: "relative" as const,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group/section",
        isDragging && "opacity-50",
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {/* Selection / hover border — uses inset box-shadow so it paints inside the element and is never clipped by overflow-hidden parents */}
      <div
        className={cn(
          "absolute inset-0 z-[60] pointer-events-none transition-all duration-200",
          isSelected
            ? "shadow-[inset_0_0_0_2px_rgb(37,99,235),0_0_0_4px_rgba(37,99,235,0.1)]"
            : !isDragging && "shadow-none group-hover/section:shadow-[inset_0_0_0_2px_rgba(37,99,235,0.3)]",
        )}
      />

      {/* Floating Toolbar - Visible when selected */}
      {isSelected && !isDragging && (
        <div
          className={cn(
            "absolute z-[80] flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200",
            isFirst ? "bottom-4 right-4" : "top-4 right-4",
          )}
        >
          <div className="bg-[#1e1e1e] text-white rounded-lg shadow-xl p-1 flex items-center gap-1 border border-white/10">
            {/* Drag Handle */}
            <div
              {...attributes}
              {...listeners}
              className="p-1.5 hover:bg-white/10 rounded-md cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition-colors"
            >
              <GripVertical className="size-4" />
            </div>

            <div className="w-px h-4 bg-white/10 mx-0.5" />

            {/* Edit */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/10 hover:text-white rounded-md"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
            >
              <Edit3 className="size-3.5" />
            </Button>

            <div className="w-px h-4 bg-white/10 mx-0.5" />

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-md"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Section Triggers - Visible when selected */}
      {isSelected && !isDragging && (
        <>
          {/* Top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] pointer-events-auto">
            <SectionAddTrigger onClick={onAddBefore} onClickWithRect={onAddBeforeWithRect} />
          </div>

          {/* Bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-[80] pointer-events-auto">
            <SectionAddTrigger onClick={onAddAfter} onClickWithRect={onAddAfterWithRect} />
          </div>
        </>
      )}

      {children}
    </div>
  )
}
