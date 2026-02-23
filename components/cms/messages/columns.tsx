"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Video, Pencil, Trash2, Clock } from "lucide-react"
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
import type { Message, Series } from "@/lib/messages-data"
import { statusDisplay } from "@/lib/status"

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(isoStr: string) {
  const date = new Date(isoStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function createColumns(series: Series[]): ColumnDef<Message>[] {
  return [
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
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-0">
        {row.original.hasVideo && (
          <Video className="size-4 shrink-0 text-blue-500" />
        )}
        <div className="min-w-0">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-muted-foreground text-xs truncate">{row.original.passage}</div>
        </div>
      </div>
    ),
    size: 280,
  },
  {
    accessorKey: "speaker",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Speaker
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <span>{row.getValue("speaker")}</span>,
    size: 140,
  },
  {
    accessorKey: "seriesIds",
    header: "Series",
    cell: ({ row }) => {
      const ids = row.original.seriesIds
      const matched = series.filter((s) => ids.includes(s.id))
      return (
        <div className="flex flex-wrap gap-1">
          {matched.map((s) => (
            <Badge key={s.id} variant="outline" className="text-xs font-normal">
              {s.name}
            </Badge>
          ))}
        </div>
      )
    },
    enableSorting: false,
    size: 160,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Message Date
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.getValue("date"))}</span>
    ),
    size: 140,
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Posted
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const publishedAt = row.original.publishedAt
      const status = row.original.status
      if (!publishedAt) {
        return <span className="text-xs text-muted-foreground">—</span>
      }
      if (status === "scheduled") {
        return (
          <span className="flex items-center gap-1.5 text-sm">
            <Clock className="size-3 text-amber-500" />
            {formatDateTime(publishedAt)}
          </span>
        )
      }
      return <span className="text-sm">{formatDateTime(publishedAt)}</span>
    },
    size: 180,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as Message["status"]
      const config = statusDisplay[status]
      return (
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    size: 110,
  },
  {
    id: "resources",
    header: "Resources",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span
          className={`flex items-center gap-1 text-xs ${row.original.hasVideo ? "text-blue-500" : "text-muted-foreground/40"}`}
          title={row.original.hasVideo ? "Has video" : "No video"}
        >
          <span className={`size-2 rounded-full ${row.original.hasVideo ? "bg-blue-500" : "bg-muted-foreground/25"}`} />
          Video
        </span>
        <span
          className={`flex items-center gap-1 text-xs ${row.original.hasStudy ? "text-purple-500" : "text-muted-foreground/40"}`}
          title={row.original.hasStudy ? "Has study guide" : "No study guide"}
        >
          <span className={`size-2 rounded-full ${row.original.hasStudy ? "bg-purple-500" : "bg-muted-foreground/25"}`} />
          Study
        </span>
      </div>
    ),
    enableSorting: false,
    size: 150,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/cms/messages/${row.original.id}`}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  ]
}

// Default export for backward compatibility — empty series list
export const columns = createColumns([])
