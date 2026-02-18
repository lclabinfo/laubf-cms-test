"use client"

import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Link2, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Message, MessageStatus } from "@/lib/messages-data"

const statuses: { value: MessageStatus; label: string }[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
]

interface ToolbarProps {
  table: TanstackTable<Message>
  globalFilter: string
  setGlobalFilter: (value: string) => void
}

export function Toolbar({ table, globalFilter, setGlobalFilter }: ToolbarProps) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const statusFilter = (table.getColumn("status")?.getFilterValue() as MessageStatus[]) ?? []

  function toggleStatus(status: MessageStatus) {
    const current = statusFilter
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    table.getColumn("status")?.setFilterValue(next.length ? next : undefined)
  }

  function clearFilters() {
    table.getColumn("status")?.setFilterValue(undefined)
  }

  const hasFilters = statusFilter.length > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
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
              Filters
              {hasFilters && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {statusFilter.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {hasFilters && (
                  <Button variant="ghost" size="xs" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
              </div>
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
          </PopoverContent>
        </Popover>

        {/* Active filter badges */}
        {hasFilters && (
          <div className="flex items-center gap-1">
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
          </div>
        )}

        <div className="flex-1" />

        {/* Livestream Link */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Link2 />
              Livestream Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Livestream Link</DialogTitle>
              <DialogDescription>
                Add a livestream URL that will be displayed on your website during services.
              </DialogDescription>
            </DialogHeader>
            <Input placeholder="https://youtube.com/live/..." />
            <DialogFooter>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Message */}
        <Button>
          <Plus />
          New Message
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-1 ml-2">
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
            className="ml-auto"
            onClick={() => table.toggleAllRowsSelected(false)}
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  )
}
