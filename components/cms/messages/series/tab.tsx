"use client"

import { useState, useMemo } from "react"
import { SeriesToolbar, type ViewMode, type SortOption } from "./toolbar"
import { SeriesCardGrid } from "./card-grid"
import { SeriesListView } from "./list-view"
import { SeriesFormDialog } from "./form-dialog"
import { useMessages } from "@/lib/messages-context"

export function SeriesTab() {
  const { series, messages, addSeries } = useMessages()

  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [sort, setSort] = useState<SortOption>("name-asc")
  const [createOpen, setCreateOpen] = useState(false)

  const filteredSeries = useMemo(() => {
    const q = search.toLowerCase()

    const withCount = series
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((s) => ({
        ...s,
        count: messages.filter((m) => m.seriesIds.includes(s.id)).length,
      }))

    switch (sort) {
      case "name-asc":
        withCount.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        withCount.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "most-messages":
        withCount.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        break
      case "fewest-messages":
        withCount.sort((a, b) => a.count - b.count || a.name.localeCompare(b.name))
        break
    }

    return withCount
  }, [series, messages, search, sort])

  return (
    <div className="space-y-4">
      <SeriesToolbar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sort={sort}
        onSortChange={setSort}
        onNewSeries={() => setCreateOpen(true)}
      />

      {viewMode === "card" ? (
        <SeriesCardGrid series={filteredSeries} />
      ) : (
        <SeriesListView series={filteredSeries} />
      )}

      <SeriesFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={(data) => addSeries(data)}
      />
    </div>
  )
}
