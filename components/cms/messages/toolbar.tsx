"use client"

import { useState } from "react"
import Link from "next/link"
import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Settings2, Plus, X, Archive, Trash2, TriangleAlert, ArchiveRestore } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PublishToggles } from "@/components/cms/messages/publish-toggles"
import { EntryListPanel } from "@/components/cms/messages/entry-list-panel"
import type { Message } from "@/lib/messages-data"
import type { ArchiveFilter } from "@/lib/messages-context"

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
  seriesFilter?: string
  onSeriesFilterChange?: (seriesId: string | undefined) => void
  archiveFilter: ArchiveFilter
  onArchiveFilterChange: (filter: ArchiveFilter) => void
  onBulkDelete?: (ids: string[]) => void
  onBulkArchive?: (ids: string[]) => void
  onBulkUnarchive?: (ids: string[]) => void
  onPublishToggle?: (id: string, videoPublished: boolean, studyPublished: boolean) => void
  /** Selected messages across all pages (passed from parent for cross-page selection) */
  selectedMessages?: Message[]
  /** Total selected count (may exceed selectedMessages.length if some data not yet loaded) */
  selectedCount?: number
  onClearSelection?: () => void
}

export function Toolbar({ table, globalFilter, setGlobalFilter, allSeries, dateFrom, dateTo, onDateFromChange, onDateToChange, seriesFilter, onSeriesFilterChange, archiveFilter, onArchiveFilterChange, onBulkDelete, onBulkArchive, onBulkUnarchive, onPublishToggle, selectedMessages: selectedMessagesProp, selectedCount: selectedCountProp, onClearSelection }: ToolbarProps) {
  // Use prop if provided (cross-page selection), otherwise fall back to table model
  const tableSelected = table.getFilteredSelectedRowModel().rows.map((r) => r.original)
  const selectedMessages = selectedMessagesProp ?? tableSelected
  const selectedCount = selectedCountProp ?? selectedMessages.length

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkArchiveOpen, setBulkArchiveOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  // For single-entry publish dialog — use pre-computed content-existence flags
  const singleMessage = selectedCount === 1 ? selectedMessages[0] : null
  const hasVideoContent = singleMessage?.hasVideoContent ?? false
  const hasStudyContent = singleMessage?.hasStudyContent ?? false
  const [videoPub, setVideoPub] = useState(false)
  const [studyPub, setStudyPub] = useState(false)
  const isSingleArchived = singleMessage ? !!singleMessage.archivedAt : false

  // Check if all selected are archived (for showing unarchive)
  const allSelectedArchived = selectedMessages.length > 0 && selectedMessages.every((m) => !!m.archivedAt)

  function openPublishDialog() {
    if (!singleMessage) return
    setVideoPub(singleMessage.videoPublished)
    setStudyPub(singleMessage.studyPublished)
    setPublishOpen(true)
  }

  function toggleSeries(seriesId: string) {
    if (onSeriesFilterChange) {
      onSeriesFilterChange(seriesFilter === seriesId ? undefined : seriesId)
    }
  }

  function clearFilters() {
    onSeriesFilterChange?.(undefined)
    onDateFromChange?.("")
    onDateToChange?.("")
    onArchiveFilterChange("all")
  }

  const hasDateFilter = !!(dateFrom || dateTo)
  const hasSeriesFilter = !!seriesFilter
  const hasArchiveFilter = archiveFilter !== "all"
  const filterCount = (hasSeriesFilter ? 1 : 0) + (hasDateFilter ? 1 : 0) + (hasArchiveFilter ? 1 : 0)
  const hasFilters = filterCount > 0

  return (
    <div data-tutorial="msg-toolbar" className="flex flex-wrap items-center gap-2 min-h-[38px]">
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

              {/* Status (archive filter) */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
                <div className="flex flex-wrap gap-1.5">
                  {(["all", "active", "archived"] as const).map((filter) => (
                    <Badge
                      key={filter}
                      variant={archiveFilter === filter ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => onArchiveFilterChange(filter)}
                    >
                      {filter === "all" ? "All" : filter === "active" ? "Active" : "Archived"}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Series */}
              {allSeries.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Series</span>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {allSeries.map((s) => (
                      <Badge
                        key={s.id}
                        variant={seriesFilter === s.id ? "default" : "outline"}
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
              {/* Publish/Unpublish: only for single entry */}
              {selectedCount === 1 && (
                <Button variant="outline" size="sm" onClick={openPublishDialog}>
                  Publish / Unpublish
                </Button>
              )}
              {/* Archive / Unarchive */}
              {allSelectedArchived ? (
                <Button variant="outline" size="sm" onClick={() => {
                  const ids = selectedMessages.map((m) => m.id)
                  onBulkUnarchive?.(ids)
                  onClearSelection ? onClearSelection() : table.toggleAllRowsSelected(false)
                }}>
                  Unarchive
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setBulkArchiveOpen(true)}>
                  Archive
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                Delete
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto whitespace-nowrap"
              onClick={() => onClearSelection ? onClearSelection() : table.toggleAllRowsSelected(false)}
            >
              Clear selection
            </Button>
          </div>
        ) : (
          <Button asChild data-tutorial="msg-new-btn">
            <Link href="/cms/messages/new">
              <Plus />
              <span className="hidden sm:inline">New Message</span>
            </Link>
          </Button>
        )}

      {/* Bulk Delete dialog — shows scrollable list of entries with their status */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {selectedCount} {selectedCount === 1 ? "entry" : "entries"}?</AlertDialogTitle>
            <AlertDialogDescription>
              The following entries and all their contents will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <EntryListPanel messages={selectedMessages} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                const ids = selectedMessages.map((m) => m.id)
                onBulkDelete?.(ids)
                onClearSelection ? onClearSelection() : table.toggleAllRowsSelected(false)
                setBulkDeleteOpen(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Archive dialog — shows scrollable list of entries with their status */}
      <AlertDialog open={bulkArchiveOpen} onOpenChange={setBulkArchiveOpen}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/10">
              <Archive className="text-warning" />
            </AlertDialogMedia>
            <AlertDialogTitle>Archive {selectedCount} {selectedCount === 1 ? "entry" : "entries"}?</AlertDialogTitle>
            <AlertDialogDescription>
              The following entries will be archived. All published content will be set to draft and hidden from the public site.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <EntryListPanel messages={selectedMessages} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const ids = selectedMessages.map((m) => m.id)
              onBulkArchive?.(ids)
              onClearSelection ? onClearSelection() : table.toggleAllRowsSelected(false)
              setBulkArchiveOpen(false)
            }}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single-entry Publish/Unpublish dialog — uses same component as editor */}
      {singleMessage && (
        <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{isSingleArchived ? "Publish & Unarchive" : "Publish / Unpublish"}</DialogTitle>
              <DialogDescription>
                {isSingleArchived
                  ? "This entry is archived. Publishing content will also unarchive it."
                  : "Review what will be visible on the public site."}
              </DialogDescription>
            </DialogHeader>
            <PublishToggles
              studyPublished={studyPub}
              videoPublished={videoPub}
              studyContentExists={hasStudyContent}
              videoContentExists={hasVideoContent}
              onStudyChange={setStudyPub}
              onVideoChange={setVideoPub}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPublishOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                onPublishToggle?.(singleMessage.id, videoPub, studyPub)
                onClearSelection ? onClearSelection() : table.toggleAllRowsSelected(false)
                setPublishOpen(false)
              }}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
