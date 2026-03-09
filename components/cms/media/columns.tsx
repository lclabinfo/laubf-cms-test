"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Play, Pencil, FolderInput, Trash2, Folder } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

// Discriminated union: folder rows + media rows
export type MediaTableRow =
  | { _kind: "folder"; id: string; name: string; count: number }
  | ({ _kind: "media" } & MediaItem)

export interface MediaTableMeta {
  onEdit: (id: string) => void
  onMoveRequest: (id: string) => void
  onDelete: (id: string) => void
  onFolderClick: (folderId: string) => void
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export const columns: ColumnDef<MediaTableRow>[] = [
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
    cell: ({ row }) => {
      if (row.original._kind === "folder") return null
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      )
    },
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
      if (item._kind === "folder") {
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative size-10 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
              <Folder className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-muted-foreground text-xs">
                {item.count} item{item.count !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        )
      }
      return (
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative size-10 shrink-0 rounded overflow-hidden bg-muted">
            {item.type === "video" ? (
              /* eslint-disable-next-line jsx-a11y/media-has-caption */
              <video
                src={`${item.url}#t=0.5`}
                preload="metadata"
                muted
                playsInline
                className="size-full object-cover"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={item.url}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
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
      if (row.original._kind === "folder") return <span className="text-muted-foreground text-xs">Folder</span>
      const format = row.original.format
      const config = formatDisplay[format]
      return (
        <Badge variant={config.variant} className="text-[10px] h-4 px-1.5">
          {config.label}
        </Badge>
      )
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => {
      if (row.original._kind === "folder") return <span className="text-muted-foreground text-sm">—</span>
      return <span className="text-sm">{row.original.size}</span>
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: "dateAdded",
    header: ({ column }) => (
      <SortableHeader column={column}>Date Added</SortableHeader>
    ),
    cell: ({ row }) => {
      if (row.original._kind === "folder") return null
      return <span className="text-sm">{formatDate(row.original.dateAdded)}</span>
    },
    size: 140,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const item = row.original
      const meta = table.options.meta as MediaTableMeta | undefined
      if (item._kind === "folder") return null
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
