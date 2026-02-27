"use client"

import { useState } from "react"
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Video, BookOpen, Pencil, Trash2, Clock, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SortableHeader } from "@/components/ui/sortable-header"
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

function MessageActionsCell({ row, onDelete }: { row: { original: Message }; onDelete?: (id: string) => void }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
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
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{row.original.title}&rdquo; will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete?.(row.original.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface CreateColumnsOptions {
  series: Series[]
  onDelete?: (id: string) => void
}

export function createColumns(seriesOrOptions: Series[] | CreateColumnsOptions): ColumnDef<Message>[] {
  const options = Array.isArray(seriesOrOptions)
    ? { series: seriesOrOptions }
    : seriesOrOptions
  const { series, onDelete } = options

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
      <SortableHeader column={column}>Title</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{row.getValue("title")}</div>
        <div className="text-muted-foreground text-xs truncate">{row.original.passage}</div>
      </div>
    ),
    size: 220,
  },
  {
    accessorKey: "speaker",
    header: ({ column }) => (
      <SortableHeader column={column}>Speaker</SortableHeader>
    ),
    cell: ({ row }) => <span>{row.getValue("speaker")}</span>,
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    size: 110,
  },
  {
    accessorKey: "seriesId",
    header: "Series",
    cell: ({ row }) => {
      const seriesId = row.original.seriesId
      const matched = seriesId ? series.find((s) => s.id === seriesId) : null
      if (!matched) return null
      return (
        <Badge variant="outline" className="text-xs font-normal">
          {matched.name}
        </Badge>
      )
    },
    filterFn: (row, id, value: string[]) => {
      const seriesId = row.getValue(id) as string | null
      if (!seriesId) return false
      return value.includes(seriesId)
    },
    enableSorting: false,
    size: 120,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableHeader column={column}>Message Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm">{formatDate(row.getValue("date"))}</span>
    ),
    size: 110,
  },
  {
    accessorKey: "publishedAt",
    header: ({ column }) => (
      <SortableHeader column={column}>Posted</SortableHeader>
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
            <Clock className="size-3 text-warning" />
            {formatDateTime(publishedAt)}
          </span>
        )
      }
      return <span className="text-sm">{formatDateTime(publishedAt)}</span>
    },
    size: 140,
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
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Video
              className={`size-4 ${row.original.hasVideo ? "text-info" : "text-muted-foreground/25"}`}
            />
          </TooltipTrigger>
          <TooltipContent>{row.original.hasVideo ? "Has video" : "No video"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <BookOpen
              className={`size-4 ${row.original.hasStudy ? "text-violet-500" : "text-muted-foreground/25"}`}
            />
          </TooltipTrigger>
          <TooltipContent>{row.original.hasStudy ? "Has study guide" : "No study guide"}</TooltipContent>
        </Tooltip>
      </div>
    ),
    enableSorting: false,
    size: 100,
  },
  {
    id: "actions",
    cell: ({ row }) => <MessageActionsCell row={row} onDelete={onDelete} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  ]
}

// Default export for backward compatibility — empty series list
export const columns = createColumns([])
