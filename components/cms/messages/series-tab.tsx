"use client"

import { useState, useMemo } from "react"
import { SeriesToolbar, type ViewMode } from "./series-toolbar"
import { SeriesCardGrid } from "./series-card-grid"
import { SeriesListView } from "./series-list-view"
import { SeriesFormDialog } from "./series-form-dialog"
import { useMessages } from "@/lib/messages-context"

export function SeriesTab() {
  const { series, messages, addSeries } = useMessages()

  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [createOpen, setCreateOpen] = useState(false)

  const filteredSeries = useMemo(() => {
    const q = search.toLowerCase()
    return series
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((s) => ({
        ...s,
        count: messages.filter((m) => m.seriesIds.includes(s.id)).length,
      }))
  }, [series, messages, search])

  return (
    <div className="space-y-4">
      <SeriesToolbar
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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
