"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Play, Pencil, FolderInput, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SortableHeader } from "@/components/ui/sortable-header"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { MediaItem } from "@/lib/media-data"
import { mediaTypeDisplay, formatDisplay } from "@/lib/media-data"

export interface MediaTableMeta {
  onEdit: (id: string) => void
  onMoveRequest: (id: string) => void
  onDelete: (id: string) => void
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export const columns: ColumnDef<MediaItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column}>Name</SortableHeader>
    ),
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative size-10 shrink-0 rounded overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.name}
              className="size-full object-cover"
            />
            {item.type === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center justify-center size-5 rounded-full bg-black/40">
                  <Play className="size-3 text-white fill-white" />
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">{item.name}</div>
            <div className="text-muted-foreground text-xs truncate">
              {mediaTypeDisplay[item.type]}
            </div>
          </div>
        </div>
      )
    },
    size: 280,
  },
  {
    accessorKey: "format",
    header: "Format",
    cell: ({ row }) => {
      const format = row.original.format
      const config = formatDisplay[format]
      return (
        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      )
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => <span className="text-sm">{row.original.size}</span>,
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: "dateAdded",
    header: ({ column }) => (
      <SortableHeader column={column}>Date Added</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.original.dateAdded)}</span>
    ),
    size: 140,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const item = row.original
      const meta = table.options.meta as MediaTableMeta | undefined
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => meta?.onEdit(item.id)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => meta?.onMoveRequest(item.id)}>
              <FolderInput />
              Move to...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => meta?.onDelete(item.id)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
]
