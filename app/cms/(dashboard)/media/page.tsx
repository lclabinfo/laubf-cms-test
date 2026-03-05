"use client"

import { useState, useMemo, useCallback } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { columns, type MediaTableMeta } from "@/components/cms/media/columns"
import { Toolbar, type SortOption } from "@/components/cms/media/toolbar"
import { MediaGrid } from "@/components/cms/media/media-grid"
import { MediaSidebar, type ActiveFilterId } from "@/components/cms/media/media-sidebar"
import { GoogleAlbumsTable } from "@/components/cms/media/google-albums-table"
import { CreateFolderDialog } from "@/components/cms/media/create-folder-dialog"
import { UploadPhotoDialog } from "@/components/cms/media/upload-photo-dialog"
import { AddVideoDialog } from "@/components/cms/media/add-video-dialog"
import { ConnectAlbumDialog } from "@/components/cms/media/connect-album-dialog"
import { MoveToDialog } from "@/components/cms/media/move-to-dialog"
import { MediaPreviewDialog } from "@/components/cms/media/media-preview-dialog"
import {
  imageFormats,
  videoFormats,
} from "@/lib/media-data"
import type { MediaItem, MediaFolder, GoogleAlbum } from "@/lib/media-data"

// Hoist row model factories so they are stable references
const coreRowModel = getCoreRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

export default function MediaPage() {
  // Data state (starts empty — media API integration is pending)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [albums, setAlbums] = useState<GoogleAlbum[]>([])

  // Navigation
  const [activeFolderId, setActiveFolderId] = useState<ActiveFilterId>("all")

  // UI state
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOption>("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false)
  const [addVideoOpen, setAddVideoOpen] = useState(false)
  const [connectAlbumOpen, setConnectAlbumOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [movingIds, setMovingIds] = useState<string[]>([])
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)

  // Computed: counts for sidebar
  const mediaCounts = useMemo(() => ({
    all: mediaItems.length,
    photos: mediaItems.filter((i) => imageFormats.includes(i.format)).length,
    videos: mediaItems.filter((i) => videoFormats.includes(i.format)).length,
  }), [mediaItems])

  const folderCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of mediaItems) {
      if (item.folderId) {
        map.set(item.folderId, (map.get(item.folderId) ?? 0) + 1)
      }
    }
    return map
  }, [mediaItems])

  // Computed: filtered + sorted items
  const filteredItems = useMemo(() => {
    let items: MediaItem[]

    switch (activeFolderId) {
      case "all":
        items = mediaItems.filter((i) => i.folderId === null)
        break
      case "photos":
        items = mediaItems.filter((i) => imageFormats.includes(i.format))
        break
      case "videos":
        items = mediaItems.filter((i) => videoFormats.includes(i.format))
        break
      case "google-albums":
        items = []
        break
      default:
        items = mediaItems.filter((i) => i.folderId === activeFolderId)
    }

    // Apply search
    if (search) {
      const q = search.toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q))
    }

    // Apply sort
    items = [...items].sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.dateAdded.localeCompare(a.dateAdded)
        case "oldest":
          return a.dateAdded.localeCompare(b.dateAdded)
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    return items
  }, [mediaItems, activeFolderId, search, sort])

  // TanStack Table sorting state (synced from our sort state)
  const tableSorting = useMemo<SortingState>(() => {
    switch (sort) {
      case "newest": return [{ id: "dateAdded", desc: true }]
      case "oldest": return [{ id: "dateAdded", desc: false }]
      case "name-asc": return [{ id: "name", desc: false }]
      case "name-desc": return [{ id: "name", desc: true }]
      default: return [{ id: "dateAdded", desc: true }]
    }
  }, [sort])

  // Row selection for TanStack Table
  const rowSelection = useMemo(() => {
    const sel: Record<string, boolean> = {}
    filteredItems.forEach((item, idx) => {
      if (selectedIds.has(item.id)) sel[String(idx)] = true
    })
    return sel
  }, [selectedIds, filteredItems])

  const handleRowSelectionChange = useCallback(
    (updater: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)) => {
      const newSel = typeof updater === "function" ? updater(rowSelection) : updater
      const newIds = new Set<string>()
      for (const [idx, selected] of Object.entries(newSel)) {
        if (selected && filteredItems[Number(idx)]) {
          newIds.add(filteredItems[Number(idx)].id)
        }
      }
      setSelectedIds(newIds)
    },
    [rowSelection, filteredItems]
  )

  function handleUpdateItem(id: string, updates: Partial<Pick<MediaItem, "name" | "altText" | "folderId">>) {
    setMediaItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    )
  }

  const tableMeta: MediaTableMeta = useMemo(() => ({
    onEdit: (id: string) => {
      const item = mediaItems.find((i) => i.id === id)
      if (item) setPreviewItem(item)
    },
    onMoveRequest: (id: string) => {
      setMovingIds([id])
      setMoveDialogOpen(true)
    },
    onDelete: (id: string) => {
      setMediaItems((prev) => prev.filter((i) => i.id !== id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    },
  }), [mediaItems])

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: {
      sorting: tableSorting,
      rowSelection,
      pagination: { pageIndex: 0, pageSize: 20 },
    },
    onRowSelectionChange: handleRowSelectionChange,
    enableSortingRemoval: false,
    getCoreRowModel: coreRowModel,
    getPaginationRowModel: paginationRowModel,
    getSortedRowModel: sortedRowModel,
    meta: tableMeta,
  })

  // Handlers
  function handleCreateFolder({ name }: { name: string }) {
    const id = `f${Date.now()}`
    setFolders((prev) => [...prev, { id, name }])
    setActiveFolderId(id)
  }

  function handleRenameFolder(id: string, name: string) {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
  }

  function handleDeleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    // Move orphaned items to ungrouped
    setMediaItems((prev) =>
      prev.map((i) => (i.folderId === id ? { ...i, folderId: null } : i))
    )
    if (activeFolderId === id) setActiveFolderId("all")
  }

  function handleUploadPhotos(files: File[]) {
    const folderId = typeof activeFolderId === "string" && !["all", "photos", "videos", "google-albums"].includes(activeFolderId)
      ? activeFolderId
      : null
    const newItems: MediaItem[] = files.map((file, i) => {
      const ext = file.name.split(".").pop()?.toUpperCase() ?? "JPG"
      const format = (["JPG", "PNG", "WEBP"].includes(ext) ? ext : "JPG") as MediaItem["format"]
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      return {
        id: `m${Date.now()}-${i}`,
        name: file.name,
        type: "image" as const,
        format,
        url: "", // No real URL for mock uploads
        size: `${sizeMB} MB`,
        folderId,
        dateAdded: new Date().toISOString().slice(0, 10),
      }
    })
    setMediaItems((prev) => [...newItems, ...prev])
  }

  function handleAddVideo({ url, name }: { url: string; name: string }) {
    const isYouTube = /youtube\.com|youtu\.be/i.test(url)
    const folderId = typeof activeFolderId === "string" && !["all", "photos", "videos", "google-albums"].includes(activeFolderId)
      ? activeFolderId
      : null
    const newItem: MediaItem = {
      id: `m${Date.now()}`,
      name,
      type: "video",
      format: isYouTube ? "YouTube" : "Vimeo",
      url: "",
      videoUrl: url,
      size: "-",
      folderId,
      dateAdded: new Date().toISOString().slice(0, 10),
    }
    setMediaItems((prev) => [newItem, ...prev])
  }

  function handleConnectAlbum({ url }: { url: string }) {
    const newAlbum: GoogleAlbum = {
      id: `ga${Date.now()}`,
      name: `Google Album ${albums.length + 1}`,
      photoCount: 0,
      coverUrl: "",
      externalUrl: url,
      status: "Connected",
      dateAdded: new Date().toISOString().slice(0, 10),
    }
    setAlbums((prev) => [...prev, newAlbum])
    setActiveFolderId("google-albums")
  }

  function handleDeleteAlbum(id: string) {
    setAlbums((prev) => prev.filter((a) => a.id !== id))
  }

  function handleMoveItems(folderId: string | null) {
    setMediaItems((prev) =>
      prev.map((i) => (movingIds.includes(i.id) ? { ...i, folderId } : i))
    )
    setMovingIds([])
    setSelectedIds(new Set())
  }

  function handleBulkMove() {
    setMovingIds(Array.from(selectedIds))
    setMoveDialogOpen(true)
  }

  function handleBulkDelete() {
    setMediaItems((prev) => prev.filter((i) => !selectedIds.has(i.id)))
    setSelectedIds(new Set())
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll(selected: boolean) {
    if (selected) {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function handleViewModeChange(mode: "grid" | "list") {
    setViewMode(mode)
    setSelectedIds(new Set())
  }

  function handleSelectFolder(id: ActiveFilterId) {
    setActiveFolderId(id)
    setSelectedIds(new Set())
    setSearch("")
  }

  // Determine current folder ID for move dialog context
  const currentFolderIdForMove = movingIds.length === 1
    ? (mediaItems.find((i) => i.id === movingIds[0])?.folderId ?? null)
    : null

  const isGoogleAlbums = activeFolderId === "google-albums"

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Media</h1>
        <p className="text-muted-foreground text-sm">
          Upload and manage photos, videos, and documents.
        </p>
      </div>

      <Toolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        activeFolderId={activeFolderId}
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onUploadPhotos={() => setUploadPhotoOpen(true)}
        onAddVideo={() => setAddVideoOpen(true)}
        onConnectAlbum={() => setConnectAlbumOpen(true)}
        onBulkMove={handleBulkMove}
        onBulkDelete={handleBulkDelete}
      />

      {/* Two-column layout */}
      <div className="flex flex-1 gap-6 min-h-0">
        <MediaSidebar
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={handleSelectFolder}
          onCreateFolder={() => setCreateFolderOpen(true)}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          mediaCounts={mediaCounts}
          folderCounts={folderCounts}
        />
        <div className="flex-1 min-w-0 overflow-y-auto p-0.5 -m-0.5">
          {isGoogleAlbums ? (
            <GoogleAlbumsTable albums={albums} onDelete={handleDeleteAlbum} />
          ) : viewMode === "grid" ? (
            <MediaGrid
              items={filteredItems}
              folders={activeFolderId === "all" ? folders : undefined}
              folderCounts={activeFolderId === "all" ? folderCounts : undefined}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onFolderClick={handleSelectFolder}
              onEdit={(id) => {
                const item = mediaItems.find((i) => i.id === id)
                if (item) setPreviewItem(item)
              }}
              onMove={(id) => {
                setMovingIds([id])
                setMoveDialogOpen(true)
              }}
              onDelete={(id) => {
                setMediaItems((prev) => prev.filter((i) => i.id !== id))
                setSelectedIds((prev) => {
                  const next = new Set(prev)
                  next.delete(id)
                  return next
                })
              }}
            />
          ) : (
            <DataTable
              columns={columns}
              table={table}
              onRowClick={(row) => setPreviewItem(row)}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSubmit={handleCreateFolder}
      />
      <UploadPhotoDialog
        open={uploadPhotoOpen}
        onOpenChange={setUploadPhotoOpen}
        onSubmit={handleUploadPhotos}
      />
      <AddVideoDialog
        open={addVideoOpen}
        onOpenChange={setAddVideoOpen}
        onSubmit={handleAddVideo}
      />
      <ConnectAlbumDialog
        open={connectAlbumOpen}
        onOpenChange={setConnectAlbumOpen}
        onSubmit={handleConnectAlbum}
      />
      <MoveToDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        folders={folders}
        currentFolderId={currentFolderIdForMove}
        onSubmit={handleMoveItems}
      />
      <MediaPreviewDialog
        open={!!previewItem}
        onOpenChange={(open) => {
          if (!open) setPreviewItem(null)
        }}
        item={previewItem}
        folders={folders}
        onUpdate={handleUpdateItem}
      />
    </div>
  )
}
