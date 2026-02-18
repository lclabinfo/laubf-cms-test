"use client"

import { Search, LayoutGrid, List, Plus, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type ViewMode = "card" | "list"
export type SortOption = "name-asc" | "name-desc" | "most-messages" | "fewest-messages"

interface SeriesToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  onNewSeries: () => void
}

export function SeriesToolbar({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
  onNewSeries,
}: SeriesToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
      {/* Search */}
      <div className="relative w-full sm:w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search series..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Sort */}
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-auto gap-1.5">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name A–Z</SelectItem>
          <SelectItem value="name-desc">Name Z–A</SelectItem>
          <SelectItem value="most-messages">Most messages</SelectItem>
          <SelectItem value="fewest-messages">Fewest messages</SelectItem>
        </SelectContent>
      </Select>

      {/* View toggle */}
      <div className="flex">
        <Button
          variant={viewMode === "card" ? "secondary" : "outline"}
          size="icon"
          className="rounded-r-none"
          onClick={() => onViewModeChange("card")}
          aria-label="Card view"
        >
          <LayoutGrid />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "outline"}
          size="icon"
          className="rounded-l-none -ml-px"
          onClick={() => onViewModeChange("list")}
          aria-label="List view"
        >
          <List />
        </Button>
      </div>

      <div className="flex-1" />

      <Button onClick={onNewSeries}>
        <Plus />
        <span className="hidden sm:inline">New Series</span>
      </Button>
    </div>
  )
}
