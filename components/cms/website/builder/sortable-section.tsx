"use client"

import { useEffect, useRef, useState } from "react"
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

/**
 * Determine where to place the floating toolbar so it's always visible:
 * - "top"    → section top is in the viewport, toolbar sits at top-right
 * - "bottom" → section top is scrolled above viewport, toolbar sits at bottom-right
 * - "sticky" → both top and bottom are off-screen (very tall section), toolbar
 *              is position:sticky within the viewport
 */
function useToolbarPlacement(
  sectionRef: React.RefObject<HTMLDivElement | null>,
  isActive: boolean,
) {
  const [placement, setPlacement] = useState<"top" | "bottom" | "sticky">("top")

  useEffect(() => {
    const el = sectionRef.current
    if (!el || !isActive) return

    // Find the scrollable ancestor (the builder canvas)
    const scrollParent = el.closest("[class*='overflow-y']") as HTMLElement | null
    if (!scrollParent) return

    function compute() {
      if (!el) return
      const sectionRect = el.getBoundingClientRect()
      const containerRect = scrollParent!.getBoundingClientRect()

      const topVisible = sectionRect.top >= containerRect.top - 20
      const bottomVisible = sectionRect.bottom <= containerRect.bottom + 20

      if (topVisible) {
        setPlacement("top")
      } else if (bottomVisible) {
        setPlacement("bottom")
      } else {
        // Section is taller than viewport and we're in the middle
        setPlacement("sticky")
      }
    }

    compute()
    scrollParent.addEventListener("scroll", compute, { passive: true })
    window.addEventListener("resize", compute, { passive: true })

    return () => {
      scrollParent.removeEventListener("scroll", compute)
      window.removeEventListener("resize", compute)
    }
  }, [sectionRef, isActive])

  return placement
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
  const sectionRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const placement = useToolbarPlacement(sectionRef, isSelected && !isDragging)

  // Merge refs: dnd-kit's setNodeRef + our sectionRef
  const mergedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node)
    sectionRef.current = node
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : isSelected ? 70 : 1,
    position: "relative" as const,
  }

  return (
    <div
      ref={mergedRef}
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
      {/* Selection / hover border */}
      <div
        className={cn(
          "absolute inset-0 z-[60] pointer-events-none transition-all duration-200",
          isSelected
            ? "shadow-[inset_0_0_0_2px_rgb(37,99,235),0_0_0_4px_rgba(37,99,235,0.1)]"
            : !isDragging && "shadow-none group-hover/section:shadow-[inset_0_0_0_2px_rgba(37,99,235,0.3)]",
        )}
      />

      {/* Floating Toolbar - repositions based on scroll */}
      {isSelected && !isDragging && (
        <div
          className={cn(
            "z-[80] flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200",
            placement === "sticky"
              ? "sticky top-4 float-right mr-4 mt-4"
              : "absolute right-4",
            placement === "top" && "top-4",
            placement === "bottom" && "bottom-4",
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
