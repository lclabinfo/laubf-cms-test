"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, MapPin, Globe, Pin, Pencil, Copy, Trash2 } from "lucide-react"
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
import type { ChurchEvent } from "@/lib/events-data"
import { eventTypeDisplay, recurrenceDisplay, ministryDisplay } from "@/lib/events-data"
import { statusDisplay } from "@/lib/status"

function formatDate(dateStr: string) {
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

export const columns: ColumnDef<ChurchEvent>[] = [
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
        Event
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 min-w-0">
        {row.original.isPinned && (
          <Pin className="size-3.5 shrink-0 text-amber-500 fill-amber-500" />
        )}
        <div className="min-w-0">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-muted-foreground text-xs truncate">
            {eventTypeDisplay[row.original.type]}
          </div>
        </div>
      </div>
    ),
    size: 280,
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
        Date & Time
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const past = isPast(row.original.date)
      return (
        <div className={past ? "opacity-60" : ""}>
          <div className="text-sm">{formatDate(row.original.date)}</div>
          <div className="text-muted-foreground text-xs">
            {formatTime(row.original.startTime)} – {formatTime(row.original.endTime)}
          </div>
        </div>
      )
    },
    size: 180,
  },
  {
    accessorKey: "recurrence",
    header: "Recurrence",
    cell: ({ row }) => (
      <span className="text-sm">
        {recurrenceDisplay[row.original.recurrence]}
      </span>
    ),
    enableSorting: false,
    size: 100,
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5 min-w-0">
        {row.original.locationType === "online" ? (
          <Globe className="size-3.5 shrink-0 text-blue-500" />
        ) : (
          <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-sm">{row.original.location}</span>
      </div>
    ),
    enableSorting: false,
    size: 160,
  },
  {
    accessorKey: "ministry",
    header: "Ministry",
    cell: ({ row }) => {
      const ministry = row.original.ministry
      const label = ministryDisplay[ministry] ?? ministry
      return <span className="text-sm">{label}</span>
    },
    enableSorting: false,
    size: 120,
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
    size: 110,
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
