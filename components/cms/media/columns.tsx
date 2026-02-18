"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Play, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className={`flex items-center gap-3 min-w-0 ${item.isArchived ? "opacity-60" : ""}`}>
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
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.original.tags
      if (tags.length === 0) return <span className="text-muted-foreground text-sm">-</span>
      const visible = tags.slice(0, 2)
      const remaining = tags.length - 2
      return (
        <div className="flex items-center gap-1 flex-wrap">
          {visible.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {remaining > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remaining}
            </Badge>
          )}
        </div>
      )
    },
    filterFn: (row, _id, value: string[]) => {
      const tags = row.original.tags
      return value.some((v) => tags.includes(v))
    },
    enableSorting: false,
    size: 180,
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
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date Added
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.original.dateAdded)}</span>
    ),
    size: 140,
  },
  {
    accessorKey: "usedIn",
    header: "Used In",
    cell: ({ row }) => {
      const count = row.original.usedIn
      if (count === 0) return <span className="text-muted-foreground text-sm">Unused</span>
      return <span className="text-sm">{count} item{count !== 1 ? "s" : ""}</span>
    },
    enableSorting: false,
    size: 100,
  },
  {
    accessorKey: "type",
    header: () => null,
    cell: () => null,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    size: 0,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const item = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              {item.isArchived ? <ArchiveRestore /> : <Archive />}
              {item.isArchived ? "Unarchive" : "Archive"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
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
