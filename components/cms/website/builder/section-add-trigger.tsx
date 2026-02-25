"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface SectionAddTriggerProps {
  onClick: () => void
  className?: string
}

export function SectionAddTrigger({ onClick, className }: SectionAddTriggerProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick()
  }

  return (
    <button
      type="button"
      className={cn(
        "group relative flex items-center justify-center",
        "h-7 min-w-7 rounded-full",
        "bg-blue-600 text-white shadow-md",
        "hover:shadow-lg hover:bg-blue-500",
        "transition-all duration-200 ease-out",
        "hover:pl-3 hover:pr-3.5",
        "cursor-pointer",
        className,
      )}
      onClick={handleClick}
    >
      <Plus className="size-4 shrink-0" strokeWidth={3} />
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-wide whitespace-nowrap overflow-hidden",
          "max-w-0 opacity-0 ml-0",
          "group-hover:max-w-32 group-hover:opacity-100 group-hover:ml-1.5",
          "transition-all duration-200 ease-out",
        )}
      >
        Add Section
      </span>
    </button>
  )
}
