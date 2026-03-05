"use client"

import { useState } from "react"
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2, TriangleAlert, SquarePen, Plus } from "lucide-react"
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
      <div className="min-w-0 relative">
        <div className="font-medium truncate-fade">{row.getValue("title")}</div>
        <div className="text-muted-foreground text-xs truncate-fade min-h-[1lh]">{row.original.passage || "\u00A0"}</div>
      </div>
    ),
    size: 180,
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
    size: 100,
  },
  {
    accessorKey: "seriesId",
    header: () => <span className="whitespace-nowrap">Series</span>,
    cell: ({ row }) => {
      const seriesId = row.original.seriesId
      const matched = seriesId ? series.find((s) => s.id === seriesId) : null
      if (!matched) return null
      return (
        <Badge variant="outline" className="text-xs font-normal max-w-full truncate-fade inline-block text-left">
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
    size: 100,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableHeader column={column}>Message Date</SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">{formatDate(row.getValue("date"))}</span>
    ),
    size: 100,
  },
  {
    id: "video",
    header: () => <span className="whitespace-nowrap">Video</span>,
    cell: ({ row }) => {
      const hasVideo = row.original.hasVideo
      const isLive = row.original.videoPublished
      return (
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <Badge variant="success">Published</Badge>
          ) : hasVideo ? (
            <Badge variant="secondary">Draft</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">&mdash;</span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 hidden xl:inline-flex"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/cms/messages/${row.original.id}?tab=video`} aria-label={hasVideo ? "Edit video" : "Add video"}>
              {hasVideo ? <SquarePen className="size-3.5" /> : <Plus className="size-3.5" />}
            </Link>
          </Button>
        </div>
      )
    },
    enableSorting: false,
    size: 90,
  },
  {
    id: "study",
    header: () => <span className="whitespace-nowrap">Study</span>,
    cell: ({ row }) => {
      const hasStudy = row.original.hasStudy
      const isLive = row.original.studyPublished
      return (
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <Badge variant="success">Published</Badge>
          ) : hasStudy ? (
            <Badge variant="secondary">Draft</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">&mdash;</span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-7 hidden xl:inline-flex"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <Link href={`/cms/messages/${row.original.id}?tab=study`} aria-label={hasStudy ? "Edit study" : "Add study"}>
              {hasStudy ? <SquarePen className="size-3.5" /> : <Plus className="size-3.5" />}
            </Link>
          </Button>
        </div>
      )
    },
    enableSorting: false,
    size: 90,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <MessageActionsCell row={row} onDelete={onDelete} />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  ]
}

// Default export for backward compatibility — empty series list
export const columns = createColumns([])
