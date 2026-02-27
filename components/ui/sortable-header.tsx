"use client"

import type { Column } from "@tanstack/react-table"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SortableHeaderProps<TData> {
  column: Column<TData>
  children: React.ReactNode
  className?: string
}

export function SortableHeader<TData>({
  column,
  children,
  className,
}: SortableHeaderProps<TData>) {
  const sorted = column.getIsSorted()

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-8 group/sort", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
      )}
    </Button>
  )
}
