"use client"

import { Search, LayoutGrid, List, Trash2, FolderInput, Upload, Video, Cloud, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ActiveFilterId } from "@/components/cms/media/media-sidebar"

export type SortOption = "newest" | "oldest" | "name-asc" | "name-desc"

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
]

interface ToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  activeFolderId: ActiveFilterId
  selectedCount: number
  onClearSelection: () => void
  onUploadPhotos: () => void
  onAddVideo: () => void
  onConnectAlbum: () => void
  onBulkMove: () => void
  onBulkDelete: () => void
}

export function Toolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  activeFolderId,
  selectedCount,
  onClearSelection,
  onUploadPhotos,
  onAddVideo,
  onConnectAlbum,
  onBulkMove,
  onBulkDelete,
}: ToolbarProps) {
  const showViewToggle = activeFolderId !== "google-albums"

  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
      {/* Search */}
      <div className="relative w-full sm:w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search media..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex-1" />

      {/* Sort */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
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
      {showViewToggle && (
        <div className="flex items-center rounded-md border">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-r-none"
            onClick={() => onViewModeChange("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-l-none"
            onClick={() => onViewModeChange("list")}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      )}

      {/* Bulk actions or Add New */}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border bg-muted/50 px-3 py-1">
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={onBulkMove}>
              <FolderInput className="size-3.5" />
              Move to...
            </Button>
            <Button variant="destructive" size="sm" onClick={onBulkDelete}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto whitespace-nowrap"
            onClick={onClearSelection}
          >
            Clear selection
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add New</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onUploadPhotos}>
              <Upload />
              Upload Photos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onAddVideo}>
              <Video />
              Add Video Link
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onConnectAlbum}>
              <Cloud />
              Connect Google Album
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
