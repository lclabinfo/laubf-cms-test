/*
 * CMS SETTINGS:
 * - label: string -- pill text
 * - active: boolean -- selected state
 */
"use client"

import { cn } from "@/lib/utils"

interface FilterPillProps {
  label: string
  active: boolean
  onClick: () => void
  className?: string
}

export default function FilterPill({
  label,
  active,
  onClick,
  className,
}: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-2 text-pill transition-colors duration-200",
        active ? "bg-black-1 text-white-1" : "bg-white-2 text-black-3",
        className
      )}
    >
      {label}
    </button>
  )
}
