"use client"

import Link from "next/link"
import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Settings2, Plus, X } from "lucide-react"
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
import type { Message } from "@/lib/messages-data"

const columnLabels: Record<string, string> = {
  title: "Title",
  speaker: "Speaker",
  seriesId: "Series",
  date: "Message Date",
}

interface ToolbarProps {
  table: TanstackTable<Message>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  speakers: string[]
  allSeries: { id: string; name: string }[]
  dateFrom?: string
  dateTo?: string
  onDateFromChange?: (value: string) => void
  onDateToChange?: (value: string) => void
}

export function Toolbar({ table, globalFilter, setGlobalFilter, allSeries, dateFrom, dateTo, onDateFromChange, onDateToChange }: ToolbarProps) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const seriesFilter = (table.getColumn("seriesId")?.getFilterValue() as string[]) ?? []

  function toggleSeries(seriesId: string) {
    const current = seriesFilter
    const next = current.includes(seriesId)
      ? current.filter((s) => s !== seriesId)
      : [...current, seriesId]
    table.getColumn("seriesId")?.setFilterValue(next.length ? next : undefined)
  }

  function clearFilters() {
    table.getColumn("seriesId")?.setFilterValue(undefined)
    onDateFromChange?.("")
    onDateToChange?.("")
  }

  const hasDateFilter = !!(dateFrom || dateTo)
  const filterCount = seriesFilter.length + (hasDateFilter ? 1 : 0)
  const hasFilters = filterCount > 0

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
        {/* Search */}
        <div className="relative w-full sm:w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
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
                <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px] bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
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

              {/* Series */}
              {allSeries.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Series</span>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {allSeries.map((s) => (
                      <Badge
                        key={s.id}
                        variant={seriesFilter.includes(s.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSeries(s.id)}
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Date range */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Range</span>
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
          <Button asChild>
            <Link href="/cms/messages/new">
              <Plus />
              <span className="hidden sm:inline">New Message</span>
            </Link>
          </Button>
        )}
    </div>
  )
}
