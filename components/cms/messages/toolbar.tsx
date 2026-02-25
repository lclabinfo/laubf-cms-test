"use client"

import Link from "next/link"
import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Settings2, Plus, X } from "lucide-react"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Message, MessageStatus } from "@/lib/messages-data"

const statuses: { value: MessageStatus; label: string }[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
]

const columnLabels: Record<string, string> = {
  title: "Title",
  speaker: "Speaker",
  seriesId: "Series",
  date: "Message Date",
  publishedAt: "Posted",
  status: "Status",
  resources: "Resources",
}

interface ToolbarProps {
  table: TanstackTable<Message>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  speakers: string[]
  allSeries: { id: string; name: string }[]
}

export function Toolbar({ table, globalFilter, setGlobalFilter, speakers, allSeries }: ToolbarProps) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const statusFilter = (table.getColumn("status")?.getFilterValue() as MessageStatus[]) ?? []
  const speakerFilter = (table.getColumn("speaker")?.getFilterValue() as string[]) ?? []
  const seriesFilter = (table.getColumn("seriesId")?.getFilterValue() as string[]) ?? []

  function toggleStatus(status: MessageStatus) {
    const current = statusFilter
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    table.getColumn("status")?.setFilterValue(next.length ? next : undefined)
  }

  function toggleSpeaker(speaker: string) {
    const current = speakerFilter
    const next = current.includes(speaker)
      ? current.filter((s) => s !== speaker)
      : [...current, speaker]
    table.getColumn("speaker")?.setFilterValue(next.length ? next : undefined)
  }

  function toggleSeries(seriesId: string) {
    const current = seriesFilter
    const next = current.includes(seriesId)
      ? current.filter((s) => s !== seriesId)
      : [...current, seriesId]
    table.getColumn("seriesId")?.setFilterValue(next.length ? next : undefined)
  }

  function clearFilters() {
    table.getColumn("status")?.setFilterValue(undefined)
    table.getColumn("speaker")?.setFilterValue(undefined)
    table.getColumn("seriesId")?.setFilterValue(undefined)
  }

  const filterCount = statusFilter.length + speakerFilter.length + seriesFilter.length
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

              {/* Status */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
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

              {/* Speaker */}
              {speakers.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Speaker</span>
                  <div className="flex flex-wrap gap-1.5">
                    {speakers.map((name) => (
                      <Badge
                        key={name}
                        variant={speakerFilter.includes(name) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSpeaker(name)}
                      >
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Series */}
              {allSeries.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Series</span>
                  <div className="flex flex-wrap gap-1.5">
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

        {/* Active filter badges */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-1">
            {statusFilter.map((s) => (
              <Badge key={`status-${s}`} variant="secondary" className="gap-1">
                {s}
                <button
                  onClick={() => toggleStatus(s)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {speakerFilter.map((s) => (
              <Badge key={`speaker-${s}`} variant="secondary" className="gap-1">
                {s}
                <button
                  onClick={() => toggleSpeaker(s)}
                  className="ml-0.5 rounded-full hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {seriesFilter.map((id) => {
              const name = allSeries.find((s) => s.id === id)?.name ?? id
              return (
                <Badge key={`series-${id}`} variant="secondary" className="gap-1">
                  {name}
                  <button
                    onClick={() => toggleSeries(id)}
                    className="ml-0.5 rounded-full hover:bg-foreground/10"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )
            })}
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
