"use client"

import { useState } from "react"
import Link from "next/link"
import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Settings2, Plus, X, List, LayoutGrid, Archive, ArchiveRestore, Trash2, TriangleAlert, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import type { ChurchEvent, EventType, Recurrence, MinistryTag } from "@/lib/events-data"
import type { ContentStatus } from "@/lib/status"
import { statusDisplay } from "@/lib/status"

type RecurrenceFilter = "recurring" | "one-time"

const statuses: { value: ContentStatus; label: string }[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
]

const eventTypes: { value: EventType; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "meeting", label: "Meeting" },
  { value: "program", label: "Program" },
]

const recurrenceOptions: { value: RecurrenceFilter; label: string }[] = [
  { value: "recurring", label: "Recurring" },
  { value: "one-time", label: "One-time" },
]

const ministries: { value: MinistryTag; label: string }[] = [
  { value: "young-adult", label: "Young Adult" },
  { value: "adult", label: "Adult" },
  { value: "children", label: "Children" },
  { value: "high-school", label: "Middle & High School" },
  { value: "church-wide", label: "Church-wide" },
]

const columnLabels: Record<string, string> = {
  title: "Event",
  type: "Type",
  date: "Date & Time",
  recurrence: "Recurrence",
  location: "Location",
  ministry: "Ministry",
  status: "Status",
}

interface ToolbarProps {
  table: TanstackTable<ChurchEvent>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  view: "list" | "card"
  onViewChange: (view: "list" | "card") => void
  dateFrom?: string
  dateTo?: string
  onDateFromChange?: (value: string) => void
  onDateToChange?: (value: string) => void
  onBulkDelete?: (ids: string[]) => void
  onBulkArchive?: (ids: string[]) => void
  onBulkUnarchive?: (ids: string[]) => void
  onBulkPublish?: (ids: string[]) => void
  onBulkUnpublish?: (ids: string[]) => void
}

export function Toolbar({ table, globalFilter, setGlobalFilter, view, onViewChange, dateFrom, dateTo, onDateFromChange, onDateToChange, onBulkDelete, onBulkArchive, onBulkUnarchive, onBulkPublish, onBulkUnpublish }: ToolbarProps) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const statusFilter = (table.getColumn("status")?.getFilterValue() as ContentStatus[]) ?? []
  const typeFilter = (table.getColumn("type")?.getFilterValue() as EventType[]) ?? []
  const recurrenceFilter = (table.getColumn("recurrence")?.getFilterValue() as Recurrence[]) ?? []
  const ministryFilter = (table.getColumn("ministry")?.getFilterValue() as MinistryTag[]) ?? []

  // Derived simplified recurrence filter state
  const recurringSelected = recurrenceFilter.some((r) => r !== "none")
  const oneTimeSelected = recurrenceFilter.includes("none")
  const activeRecurrenceOptions: RecurrenceFilter[] = [
    ...(recurringSelected ? (["recurring"] as RecurrenceFilter[]) : []),
    ...(oneTimeSelected ? (["one-time"] as RecurrenceFilter[]) : []),
  ]

  function toggleStatus(status: ContentStatus) {
    const current = statusFilter
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    table.getColumn("status")?.setFilterValue(next.length ? next : undefined)
  }

  function toggleType(type: EventType) {
    const current = typeFilter
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    table.getColumn("type")?.setFilterValue(next.length ? next : undefined)
  }

  const allRecurringValues: Recurrence[] = ["daily", "weekly", "monthly", "yearly", "weekday", "custom"]

  function toggleRecurrenceOption(option: RecurrenceFilter) {
    let next: Recurrence[]
    if (option === "recurring") {
      const hasRecurring = recurrenceFilter.some((r) => r !== "none")
      if (hasRecurring) {
        next = recurrenceFilter.filter((r) => r === "none")
      } else {
        next = [...recurrenceFilter.filter((r) => r === "none"), ...allRecurringValues]
      }
    } else {
      // one-time
      if (recurrenceFilter.includes("none")) {
        next = recurrenceFilter.filter((r) => r !== "none")
      } else {
        next = [...recurrenceFilter, "none"]
      }
    }
    table.getColumn("recurrence")?.setFilterValue(next.length ? next : undefined)
  }

  function toggleMinistry(ministry: MinistryTag) {
    const current = ministryFilter
    const next = current.includes(ministry)
      ? current.filter((m) => m !== ministry)
      : [...current, ministry]
    table.getColumn("ministry")?.setFilterValue(next.length ? next : undefined)
  }

  function clearFilters() {
    table.getColumn("status")?.setFilterValue(undefined)
    table.getColumn("type")?.setFilterValue(undefined)
    table.getColumn("recurrence")?.setFilterValue(undefined)
    table.getColumn("ministry")?.setFilterValue(undefined)
    onDateFromChange?.("")
    onDateToChange?.("")
  }

  const hasDateFilter = !!(dateFrom || dateTo)
  const filterCount = statusFilter.length + typeFilter.length + activeRecurrenceOptions.length + ministryFilter.length + (hasDateFilter ? 1 : 0)
  const hasFilters = filterCount > 0

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[38px]" data-tutorial="evt-toolbar">
      {/* Search */}
      <div className="relative w-full sm:w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Filters */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={hasFilters ? "default" : "outline"} size="default">
            <SlidersHorizontal />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && (
              <Badge variant={hasFilters ? "outline" : "secondary"} className="ml-1 h-4 px-1 text-[10px] bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                {filterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 max-h-[min(480px,70vh)] overflow-y-auto overflow-x-hidden" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filters</span>
              {hasFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <X className="size-3" />
                  Clear all
                </Button>
              )}
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Status</span>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((s) => (
                  <Badge
                    key={s.value}
                    variant={statusFilter.includes(s.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleStatus(s.value)}
                  >
                    {s.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <div className="flex flex-wrap gap-1.5">
                {eventTypes.map((t) => (
                  <Badge
                    key={t.value}
                    variant={typeFilter.includes(t.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleType(t.value)}
                  >
                    {t.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recurrence filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Recurrence</span>
              <div className="flex flex-wrap gap-1.5">
                {recurrenceOptions.map((r) => (
                  <Badge
                    key={r.value}
                    variant={activeRecurrenceOptions.includes(r.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRecurrenceOption(r.value)}
                  >
                    {r.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ministry filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Ministry</span>
              <div className="flex flex-wrap gap-1.5">
                {ministries.map((m) => (
                  <Badge
                    key={m.value}
                    variant={ministryFilter.includes(m.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMinistry(m.value)}
                  >
                    {m.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Date Range</span>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <DatePicker
                  value={dateFrom || undefined}
                  onChange={(v) => onDateFromChange?.(v)}
                  placeholder="From"
                  className="h-8 text-xs min-w-0"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <DatePicker
                  value={dateTo || undefined}
                  onChange={(v) => onDateToChange?.(v)}
                  placeholder="To"
                  min={dateFrom || undefined}
                  className="h-8 text-xs min-w-0"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Column visibility */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="default">
            <Settings2 />
            <span className="hidden sm:inline">Columns</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {table
            .getAllColumns()
            .filter((col) => col.getCanHide())
            .map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
              >
                {columnLabels[col.id] ?? col.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View toggle */}
      <div className="flex items-center rounded-md border">
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-r-none"
          onClick={() => onViewChange("list")}
          aria-label="List view"
        >
          <List className="size-4" />
        </Button>
        <Button
          variant={view === "card" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-l-none"
          onClick={() => onViewChange("card")}
          aria-label="Card view"
        >
          <LayoutGrid className="size-4" />
        </Button>
      </div>

      <div className="flex-1" />

      {/* Right side: bulk actions replace primary action when rows are selected */}
      {selectedCount > 0 ? (
        <BulkActionsBar
          table={table}
          onBulkDelete={onBulkDelete}
          onBulkArchive={onBulkArchive}
          onBulkUnarchive={onBulkUnarchive}
          onBulkPublish={onBulkPublish}
          onBulkUnpublish={onBulkUnpublish}
        />
      ) : (
        <Button asChild data-tutorial="evt-new-btn">
          <Link href="/cms/events/new">
            <Plus />
            <span className="hidden sm:inline">New Event</span>
          </Link>
        </Button>
      )}
    </div>
  )
}

/* ── Bulk event list for confirmation dialogs ── */

function BulkEventList({ events }: { events: ChurchEvent[] }) {
  return (
    <div className="h-[280px] overflow-y-auto rounded-lg border border-border">
      {events.map((event) => {
        const config = statusDisplay[event.status]
        return (
          <div key={event.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-b-0">
            <span className="text-sm truncate mr-2">{event.title}</span>
            <Badge variant={config.variant} className="shrink-0 text-xs">
              {config.label}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}

/* ── Bulk actions bar ── */

function BulkActionsBar({
  table,
  onBulkDelete,
  onBulkArchive,
  onBulkUnarchive,
  onBulkPublish,
  onBulkUnpublish,
}: {
  table: TanstackTable<ChurchEvent>
  onBulkDelete?: (ids: string[]) => void
  onBulkArchive?: (ids: string[]) => void
  onBulkUnarchive?: (ids: string[]) => void
  onBulkPublish?: (ids: string[]) => void
  onBulkUnpublish?: (ids: string[]) => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [unpublishOpen, setUnpublishOpen] = useState(false)

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length
  const selectedEvents = selectedRows.map((r) => r.original)
  const selectedIds = selectedEvents.map((e) => e.id)

  // Determine which status-change buttons to show
  const allStatuses = new Set(selectedEvents.map((e) => e.status))
  const allSameStatus = allStatuses.size === 1
  const singleStatus = allSameStatus ? [...allStatuses][0] : null

  const showPublish = singleStatus === "draft" || singleStatus === "scheduled"
  const showUnpublish = singleStatus === "published"
  const allArchived = singleStatus === "archived"

  function handleConfirmAndClear(action: ((ids: string[]) => void) | undefined, setter: (v: boolean) => void) {
    action?.(selectedIds)
    setter(false)
    table.toggleAllRowsSelected(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/50 px-3 py-1">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-1">
          {showPublish && (
            <Button variant="outline" size="sm" onClick={() => setPublishOpen(true)}>
              <Eye className="size-3.5" />
              Publish
            </Button>
          )}
          {showUnpublish && (
            <Button variant="outline" size="sm" onClick={() => setUnpublishOpen(true)}>
              <EyeOff className="size-3.5" />
              Unpublish
            </Button>
          )}
          {allArchived ? (
            <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
              <ArchiveRestore className="size-3.5" />
              Unarchive
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
              <Archive className="size-3.5" />
              Archive
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto whitespace-nowrap"
          onClick={() => table.toggleAllRowsSelected(false)}
        >
          Clear selection
        </Button>
      </div>

      {/* Bulk delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Delete {selectedCount} {selectedCount === 1 ? "event" : "events"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The following {selectedCount === 1 ? "event" : "events"} will be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <BulkEventList events={selectedEvents} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => handleConfirmAndClear(onBulkDelete, setDeleteOpen)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk archive/unarchive dialog */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              {allArchived ? <ArchiveRestore className="text-warning" /> : <Archive className="text-warning" />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {allArchived ? "Unarchive" : "Archive"} {selectedCount} {selectedCount === 1 ? "event" : "events"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {allArchived
                ? `The following ${selectedCount === 1 ? "event" : "events"} will be restored as drafts.`
                : `The following ${selectedCount === 1 ? "event" : "events"} will be archived and hidden from the website.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <BulkEventList events={selectedEvents} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmAndClear(allArchived ? onBulkUnarchive : onBulkArchive, setArchiveOpen)}
            >
              {allArchived ? "Unarchive" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk publish dialog */}
      <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-primary/10">
              <Eye className="text-primary" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Publish {selectedCount} {selectedCount === 1 ? "event" : "events"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount} {selectedCount === 1 ? "event" : "events"} will be published and visible on the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmAndClear(onBulkPublish, setPublishOpen)}>
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk unpublish dialog */}
      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <EyeOff className="text-warning" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Unpublish {selectedCount} {selectedCount === 1 ? "event" : "events"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount} {selectedCount === 1 ? "event" : "events"} will be unpublished and hidden from the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleConfirmAndClear(onBulkUnpublish, setUnpublishOpen)}>
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
