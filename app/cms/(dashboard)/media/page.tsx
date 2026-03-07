"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table"
import { toast } from "sonner"
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
  mediaAssetToItem,
} from "@/lib/media-data"
import type { MediaItem, MediaFolder, GoogleAlbum } from "@/lib/media-data"

// Hoist row model factories so they are stable references
const coreRowModel = getCoreRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

// Helpers for determining the active folder value to send to the API
const VIRTUAL_FILTERS = new Set<string>(["all", "photos", "videos", "google-albums"])

function isRealFolder(id: ActiveFilterId): id is string {
  return typeof id === "string" && !VIRTUAL_FILTERS.has(id)
}

export default function MediaPage() {
  // Data state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [albums, setAlbums] = useState<GoogleAlbum[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchMedia = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()

      // Map sidebar filter to API query params
      if (activeFolderId === "photos") {
        params.set("type", "image")
      } else if (activeFolderId === "videos") {
        params.set("type", "video")
      } else if (isRealFolder(activeFolderId)) {
        params.set("folder", activeFolderId)
      }
      // "all" sends no folder filter — API returns root items by default

      if (search) params.set("search", search)

      // Map sort to API sort param
      const sortMap: Record<SortOption, string> = {
        newest: "newest",
        oldest: "oldest",
        "name-asc": "name-asc",
        "name-desc": "name-desc",
      }
      params.set("sort", sortMap[sort])

      const res = await fetch(`/api/v1/media?${params.toString()}`)
      const json = await res.json()

      if (json.success) {
        const items: MediaItem[] = json.data.items.map(mediaAssetToItem)
        setMediaItems(items)
      } else {
        toast.error("Failed to load media")
      }
    } catch {
      toast.error("Failed to load media")
    } finally {
      setIsLoading(false)
    }
  }, [activeFolderId, search, sort])

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/media/folders")
      const json = await res.json()
      if (json.success) {
        const folderList: MediaFolder[] = (json.data as string[]).map(
          (name) => ({ id: name, name })
        )
        setFolders(folderList)
      }
    } catch {
      // Folders are non-critical; silently ignore
    }
  }, [])

  // Fetch media whenever filter/search/sort changes
  useEffect(() => {
    if (activeFolderId !== "google-albums") {
      fetchMedia()
    }
  }, [fetchMedia, activeFolderId])

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  // ---------------------------------------------------------------------------
  // Computed values
  // ---------------------------------------------------------------------------
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

  // For list view, items are already fetched & filtered server-side,
  // but we still apply client-side sort for the table.
  const filteredItems = useMemo(() => {
    const items = [...mediaItems]

    // Apply sort client-side (API may also sort, but keep consistent)
    items.sort((a, b) => {
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
  }, [mediaItems, sort])

  // TanStack Table sorting state
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

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  async function handleUpdateItem(
    id: string,
    updates: Partial<Pick<MediaItem, "name" | "altText" | "folderId">>
  ) {
    try {
      const body: Record<string, unknown> = {}
      if (updates.name !== undefined) body.filename = updates.name
      if (updates.altText !== undefined) body.alt = updates.altText
      if (updates.folderId !== undefined)
        body.folder = updates.folderId ?? "/"

      const res = await fetch(`/api/v1/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (json.success) {
        // Update local state optimistically
        setMediaItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
        )
        toast.success("Media updated")
      } else {
        toast.error(json.error ?? "Failed to update media")
      }
    } catch {
      toast.error("Failed to update media")
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      const res = await fetch(`/api/v1/media/${id}`, { method: "DELETE" })
      const json = await res.json()

      if (json.success) {
        setMediaItems((prev) => prev.filter((i) => i.id !== id))
        setSelectedIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      } else {
        toast.error(json.error ?? "Failed to delete media")
      }
    } catch {
      toast.error("Failed to delete media")
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/v1/media/${id}`, { method: "DELETE" }).then((r) =>
          r.json()
        )
      )
    )

    const successIds = new Set<string>()
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value.success) {
        successIds.add(ids[idx])
      }
    })

    if (successIds.size > 0) {
      setMediaItems((prev) => prev.filter((i) => !successIds.has(i.id)))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const id of successIds) next.delete(id)
        return next
      })
      toast.success(`Deleted ${successIds.size} item${successIds.size > 1 ? "s" : ""}`)
    }

    const failCount = ids.length - successIds.size
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} item${failCount > 1 ? "s" : ""}`)
    }
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
      handleDeleteItem(id)
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

  // ---------------------------------------------------------------------------
  // Folder handlers (still local — folder CRUD API is future work)
  // ---------------------------------------------------------------------------
  function handleCreateFolder({ name }: { name: string }) {
    setFolders((prev) => [...prev, { id: name, name }])
    setActiveFolderId(name)
  }

  function handleRenameFolder(id: string, name: string) {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
  }

  function handleDeleteFolder(id: string) {
    setFolders((prev) => prev.filter((f) => f.id !== id))
    setMediaItems((prev) =>
      prev.map((i) => (i.folderId === id ? { ...i, folderId: null } : i))
    )
    if (activeFolderId === id) setActiveFolderId("all")
  }

  // ---------------------------------------------------------------------------
  // Upload handler — receives already-created MediaItems from the dialog
  // ---------------------------------------------------------------------------
  function handleUploadPhotos(items: MediaItem[]) {
    setMediaItems((prev) => [...items, ...prev])
    // Refetch to get accurate server state
    fetchMedia()
    fetchFolders()
  }

  // ---------------------------------------------------------------------------
  // Video / Album handlers (local-only for now — future features)
  // ---------------------------------------------------------------------------
  function handleAddVideo({ url, name }: { url: string; name: string }) {
    const isYouTube = /youtube\.com|youtu\.be/i.test(url)
    const folderId = isRealFolder(activeFolderId) ? activeFolderId : null
    const newItem: MediaItem = {
      id: crypto.randomUUID(),
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

  // ---------------------------------------------------------------------------
  // Move / selection handlers
  // ---------------------------------------------------------------------------
  function handleMoveItems(folderId: string | null) {
    setMediaItems((prev) =>
      prev.map((i) => (movingIds.includes(i.id) ? { ...i, folderId } : i))
    )
    // Also PATCH each item server-side
    for (const id of movingIds) {
      handleUpdateItem(id, { folderId })
    }
    setMovingIds([])
    setSelectedIds(new Set())
  }

  function handleBulkMove() {
    setMovingIds(Array.from(selectedIds))
    setMoveDialogOpen(true)
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

  // Determine the current real folder for upload context
  const currentUploadFolder = isRealFolder(activeFolderId)
    ? activeFolderId
    : null

  // Determine current folder ID for move dialog context
  const currentFolderIdForMove = movingIds.length === 1
    ? (mediaItems.find((i) => i.id === movingIds[0])?.folderId ?? null)
    : null

  const isGoogleAlbums = activeFolderId === "google-albums"

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 pt-5">
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
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-muted-foreground text-sm">Loading media...</div>
            </div>
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
              onDelete={(id) => handleDeleteItem(id)}
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
        currentFolder={currentUploadFolder}
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
