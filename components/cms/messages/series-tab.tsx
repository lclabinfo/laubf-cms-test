"use client"

import { useState, useMemo, useCallback } from "react"
import { SeriesToolbar, type ViewMode } from "./series-toolbar"
import { SeriesCardGrid } from "./series-card-grid"
import { SeriesListView } from "./series-list-view"
import { SeriesFormDialog } from "./series-form-dialog"
import { SeriesDeleteDialog } from "./series-delete-dialog"
import { ManageMessagesDialog } from "./manage-messages-dialog"
import {
  series as initialSeries,
  messages as initialMessages,
  type Series,
  type Message,
} from "@/lib/messages-data"

export function SeriesTab() {
  // Data state — mutable copies of mock data
  const [seriesList, setSeriesList] = useState<Series[]>(initialSeries)
  const [messagesList, setMessagesList] = useState<Message[]>(initialMessages)

  // UI state
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("card")

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [deletingSeries, setDeletingSeries] = useState<Series | null>(null)
  const [managingSeries, setManagingSeries] = useState<Series | null>(null)

  // Derived: filtered series with message counts
  const filteredSeries = useMemo(() => {
    const q = search.toLowerCase()
    return seriesList
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .map((s) => ({
        ...s,
        count: messagesList.filter((m) => m.seriesIds.includes(s.id)).length,
      }))
  }, [seriesList, messagesList, search])

  // Handlers
  const handleCreate = useCallback(
    (data: { name: string; imageUrl?: string }) => {
      const id = `s${Date.now()}`
      setSeriesList((prev) => [...prev, { id, name: data.name, imageUrl: data.imageUrl }])
    },
    []
  )

  const handleUpdate = useCallback(
    (data: { name: string; imageUrl?: string }) => {
      if (!editingSeries) return
      setSeriesList((prev) =>
        prev.map((s) =>
          s.id === editingSeries.id
            ? { ...s, name: data.name, imageUrl: data.imageUrl }
            : s
        )
      )
    },
    [editingSeries]
  )

  const handleDelete = useCallback(() => {
    if (!deletingSeries) return
    const id = deletingSeries.id
    setSeriesList((prev) => prev.filter((s) => s.id !== id))
    setMessagesList((prev) =>
      prev.map((m) =>
        m.seriesIds.includes(id)
          ? { ...m, seriesIds: m.seriesIds.filter((sid) => sid !== id) }
          : m
      )
    )
    setDeletingSeries(null)
  }, [deletingSeries])

  const handleManageMessages = useCallback(
    (selectedIds: string[]) => {
      if (!managingSeries) return
      const sid = managingSeries.id
      setMessagesList((prev) =>
        prev.map((m) => {
          const inSelection = selectedIds.includes(m.id)
          const inSeries = m.seriesIds.includes(sid)
          if (inSelection && !inSeries) {
            return { ...m, seriesIds: [...m.seriesIds, sid] }
          }
          if (!inSelection && inSeries) {
            return { ...m, seriesIds: m.seriesIds.filter((s) => s !== sid) }
          }
          return m
        })
      )
    },
    [managingSeries]
  )

  // Shared action callbacks for both views
  const onEdit = useCallback((s: Series) => setEditingSeries(s), [])
  const onManage = useCallback((s: Series) => setManagingSeries(s), [])
  const onDelete = useCallback((s: Series) => setDeletingSeries(s), [])

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
        <SeriesCardGrid
          series={filteredSeries}
          onEdit={onEdit}
          onManageMessages={onManage}
          onDelete={onDelete}
        />
      ) : (
        <SeriesListView
          series={filteredSeries}
          onEdit={onEdit}
          onManageMessages={onManage}
          onDelete={onDelete}
        />
      )}

      {/* Create dialog */}
      <SeriesFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={handleCreate}
      />

      {/* Edit dialog */}
      <SeriesFormDialog
        open={!!editingSeries}
        onOpenChange={(open) => {
          if (!open) setEditingSeries(null)
        }}
        mode="edit"
        series={editingSeries}
        onSubmit={handleUpdate}
      />

      {/* Delete confirmation */}
      <SeriesDeleteDialog
        open={!!deletingSeries}
        onOpenChange={(open) => {
          if (!open) setDeletingSeries(null)
        }}
        series={deletingSeries}
        onConfirm={handleDelete}
      />

      {/* Manage messages */}
      <ManageMessagesDialog
        open={!!managingSeries}
        onOpenChange={(open) => {
          if (!open) setManagingSeries(null)
        }}
        series={managingSeries}
        messages={messagesList}
        onSave={handleManageMessages}
      />
    </div>
  )
}
