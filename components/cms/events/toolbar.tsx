"use client"

import Link from "next/link"
import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Plus, X, Columns3, List, LayoutGrid } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ChurchEvent, EventType, Recurrence, MinistryTag } from "@/lib/events-data"
import type { ContentStatus } from "@/lib/status"

const statuses: { value: ContentStatus; label: string }[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
]

const eventTypes: { value: EventType; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "meeting", label: "Meeting" },
  { value: "program", label: "Program" },
]

const recurrences: { value: Recurrence; label: string }[] = [
  { value: "none", label: "None" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "weekday", label: "Weekday" },
  { value: "custom", label: "Custom" },
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
}

export function Toolbar({ table, globalFilter, setGlobalFilter, view, onViewChange }: ToolbarProps) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const statusFilter = (table.getColumn("status")?.getFilterValue() as ContentStatus[]) ?? []
  const typeFilter = (table.getColumn("type")?.getFilterValue() as EventType[]) ?? []
  const recurrenceFilter = (table.getColumn("recurrence")?.getFilterValue() as Recurrence[]) ?? []
  const ministryFilter = (table.getColumn("ministry")?.getFilterValue() as MinistryTag[]) ?? []

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

  function toggleRecurrence(recurrence: Recurrence) {
    const current = recurrenceFilter
    const next = current.includes(recurrence)
      ? current.filter((r) => r !== recurrence)
      : [...current, recurrence]
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
  }

  const filterCount = statusFilter.length + typeFilter.length + recurrenceFilter.length + ministryFilter.length
  const hasFilters = filterCount > 0

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
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
          <Button variant="outline" size="default">
            <SlidersHorizontal />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {filterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filters</span>
              {hasFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters}>
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
                {recurrences.map((r) => (
                  <Badge
                    key={r.value}
                    variant={recurrenceFilter.includes(r.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRecurrence(r.value)}
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
          </div>
        </PopoverContent>
      </Popover>

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

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex items-center gap-1 flex-wrap">
          {statusFilter.map((s) => (
            <Badge key={s} variant="secondary" className="gap-1">
              {s}
              <button
                onClick={() => toggleStatus(s)}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {typeFilter.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {t}
              <button
                onClick={() => toggleType(t)}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {recurrenceFilter.map((r) => (
            <Badge key={r} variant="secondary" className="gap-1">
              {r}
              <button
                onClick={() => toggleRecurrence(r)}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          {ministryFilter.map((m) => (
            <Badge key={m} variant="secondary" className="gap-1">
              {m}
              <button
                onClick={() => toggleMinistry(m)}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Right side: bulk actions replace primary action when rows are selected */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/50 px-3 py-1">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm">
              Publish
            </Button>
            <Button variant="outline" size="sm">
              Draft
            </Button>
            <Button variant="outline" size="sm">
              Archive
            </Button>
            <Button variant="destructive" size="sm">
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
      ) : (
        <div className="flex items-center gap-2">
          {/* Column visibility toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Columns3 className="size-4" />
                <span className="sr-only">Toggle columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {columnLabels[column.id] ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild>
            <Link href="/cms/events/new">
              <Plus />
              <span className="hidden sm:inline">New Event</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
