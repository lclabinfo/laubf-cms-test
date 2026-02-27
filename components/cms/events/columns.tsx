"use client"

import { useState } from "react"
import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, MapPin, Globe, Star, Pencil, Copy, Trash2, Clock, TriangleAlert } from "lucide-react"
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
import type { ChurchEvent } from "@/lib/events-data"
import { eventTypeDisplay, recurrenceDisplay, ministryDisplay, computeRecurrenceSchedule } from "@/lib/events-data"
import { statusDisplay } from "@/lib/status"
import { cn } from "@/lib/utils"

function formatDateShort(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatDateFull(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`
}

function isPast(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + "T00:00:00")
  return date < today
}

function sameYear(a: string, b: string) {
  return new Date(a + "T00:00:00").getFullYear() === new Date(b + "T00:00:00").getFullYear()
}

function EventActionsCell({ row, onDelete }: { row: { original: ChurchEvent }; onDelete?: (id: string) => void }) {
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
            <Link href={`/cms/events/${row.original.id}`}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy />
            Duplicate
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
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
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

export function createColumns(options?: { onDelete?: (id: string) => void }): ColumnDef<ChurchEvent>[] {
  const onDelete = options?.onDelete

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
      <SortableHeader column={column}>Event</SortableHeader>
    ),
    cell: ({ row }) => {
      const past = isPast(row.original.date)
      return (
        <div className={cn("flex items-center gap-2 min-w-0", past && "opacity-60")}>
          {row.original.isFeatured && (
            <Star className="size-3.5 shrink-0 text-warning fill-warning" />
          )}
          <div className="min-w-0">
            <div className="font-medium truncate">{row.getValue("title")}</div>
          </div>
          {past && (
            <Badge variant="outline" className="shrink-0 text-[10px] h-4 text-muted-foreground">
              <Clock className="size-2.5 mr-0.5" />
              Past
            </Badge>
          )}
        </div>
      )
    },
    size: 260,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {eventTypeDisplay[row.original.type]}
      </Badge>
    ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableHeader column={column}>Date &amp; Time</SortableHeader>
    ),
    cell: ({ row }) => {
      const event = row.original
      const past = isPast(event.date)
      const schedule = computeRecurrenceSchedule(event)

      // Recurring events: show schedule instead of single date
      if (schedule) {
        return (
          <div className={past ? "opacity-60" : ""}>
            <div className="text-sm">{schedule}</div>
            <div className="text-muted-foreground text-xs">
              {formatTime(event.startTime)} &ndash; {formatTime(event.endTime)}
            </div>
          </div>
        )
      }

      // Multi-day events: show date range
      const isMultiDay = event.endDate && event.endDate !== event.date
      if (isMultiDay) {
        const startLabel = formatDateShort(event.date)
        const endLabel = sameYear(event.date, event.endDate)
          ? formatDateFull(event.endDate)
          : `${formatDateShort(event.endDate)}, ${new Date(event.endDate + "T00:00:00").getFullYear()}`
        return (
          <div className={past ? "opacity-60" : ""}>
            <div className="text-sm">
              {startLabel} &ndash; {endLabel}
            </div>
            <div className="text-muted-foreground text-xs">
              {formatTime(event.startTime)} &ndash; {formatTime(event.endTime)}
            </div>
          </div>
        )
      }

      // Single-day events
      return (
        <div className={past ? "opacity-60" : ""}>
          <div className="text-sm">{formatDateFull(event.date)}</div>
          <div className="text-muted-foreground text-xs">
            {formatTime(event.startTime)} &ndash; {formatTime(event.endTime)}
          </div>
        </div>
      )
    },
    size: 160,
  },
  {
    accessorKey: "recurrence",
    header: "Recurrence",
    cell: ({ row }) => (
      <span className="text-sm">
        {recurrenceDisplay[row.original.recurrence]}
      </span>
    ),
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    size: 80,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 min-w-0">
        {row.original.locationType === "online" ? (
          <Globe className="size-3.5 shrink-0 text-info" />
        ) : (
          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm">{row.original.location}</span>
      </div>
    ),
    enableSorting: false,
    size: 130,
  },
  {
    accessorKey: "ministry",
    header: "Ministry",
    cell: ({ row }) => {
      const ministry = row.original.ministry
      const label = ministryDisplay[ministry] ?? ministry
      return <span className="text-sm">{label}</span>
    },
    filterFn: (row, id, value: string[]) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    size: 90,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ChurchEvent["status"]
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
    size: 90,
  },
  {
    id: "actions",
    cell: ({ row }) => <EventActionsCell row={row} onDelete={onDelete} />,
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  ]
}

// Default export for backward compatibility
export const columns = createColumns()
