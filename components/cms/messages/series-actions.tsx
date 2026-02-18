"use client"

import { Pencil, ListChecks, Trash2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SeriesActionsProps {
  onEdit: () => void
  onManageMessages: () => void
  onDelete: () => void
}

export function SeriesActions({ onEdit, onManageMessages, onDelete }: SeriesActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal />
          <span className="sr-only">Series actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil />
          Edit Series
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onManageMessages}>
          <ListChecks />
          Manage Messages
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
