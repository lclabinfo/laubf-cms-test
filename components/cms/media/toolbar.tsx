"use client"

import { Table as TanstackTable } from "@tanstack/react-table"
import { Search, SlidersHorizontal, Upload, X, LayoutGrid, List, Archive, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { MediaItem, MediaType } from "@/lib/media-data"
import { mediaTags } from "@/lib/media-data"

const mediaTypes: { value: MediaType; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
]

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc"

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
]

interface ToolbarProps {
  table: TanstackTable<MediaItem>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
}

export function Toolbar({ table, globalFilter, setGlobalFilter, viewMode, setViewMode }: ToolbarProps) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const typeFilter = (table.getColumn("type")?.getFilterValue() as MediaType[]) ?? []
  const tagsFilter = (table.getColumn("tags")?.getFilterValue() as string[]) ?? []

  function toggleType(type: MediaType) {
    const current = typeFilter
    const next = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    table.getColumn("type")?.setFilterValue(next.length ? next : undefined)
  }

  function toggleTag(tag: string) {
    const current = tagsFilter
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]
    table.getColumn("tags")?.setFilterValue(next.length ? next : undefined)
  }

  function clearFilters() {
    table.getColumn("type")?.setFilterValue(undefined)
    table.getColumn("tags")?.setFilterValue(undefined)
  }

  function getCurrentSort(): SortOption {
    const sorting = table.getState().sorting
    if (sorting.length === 0) return "newest"
    const { id, desc } = sorting[0]
    if (id === "dateAdded") return desc ? "newest" : "oldest"
    if (id === "name") return desc ? "name-desc" : "name-asc"
    return "newest"
  }

  function handleSortChange(value: SortOption) {
    switch (value) {
      case "newest":
        table.setSorting([{ id: "dateAdded", desc: true }])
        break
      case "oldest":
        table.setSorting([{ id: "dateAdded", desc: false }])
        break
      case "name-asc":
        table.setSorting([{ id: "name", desc: false }])
        break
      case "name-desc":
        table.setSorting([{ id: "name", desc: true }])
        break
    }
  }

  const filterCount = typeFilter.length + tagsFilter.length
  const hasFilters = filterCount > 0

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
      {/* Search */}
      <div className="relative w-full sm:w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search media..."
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
        <PopoverContent className="w-56" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filters</span>
              {hasFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Type filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Type</span>
              <div className="flex flex-wrap gap-1.5">
                {mediaTypes.map((t) => (
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

            {/* Tags filter */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {mediaTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={tagsFilter.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex items-center gap-1 flex-wrap">
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
          {tagsFilter.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-0.5 rounded-full hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Sort */}
      <Select value={getCurrentSort()} onValueChange={(v) => handleSortChange(v as SortOption)}>
        <SelectTrigger size="sm" className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* View toggle */}
      <div className="flex items-center rounded-md border">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-r-none"
          onClick={() => setViewMode("grid")}
          aria-label="Grid view"
        >
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-l-none"
          onClick={() => setViewMode("list")}
          aria-label="List view"
        >
          <List className="size-4" />
        </Button>
      </div>

      {/* Bulk actions / Upload */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/50 px-3 py-1">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm">
              <Archive className="size-3.5" />
              Archive
            </Button>
            <Button variant="destructive" size="sm">
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
      ) : (
        <Button>
          <Upload />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      )}
    </div>
  )
}
