"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Folder } from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { mediaAssetToItem } from "@/lib/media-data"
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

type ApiFolderItem = { id: string; name: string; count: number }

export default function MediaPage() {
  // Data state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [folderCounts, setFolderCounts] = useState<Map<string, number>>(new Map())
  const [albums, setAlbums] = useState<GoogleAlbum[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Storage usage
  const [storageUsed, setStorageUsed] = useState<string | null>(null)
  const [storageQuota, setStorageQuota] = useState<string | null>(null)
  const [storagePercent, setStoragePercent] = useState(0)

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; mode: "single" | "bulk" } | null>(null)

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
      } else if (activeFolderId === "all") {
        // Root view: only show items not in any folder
        params.set("folder", "/")
      } else if (isRealFolder(activeFolderId)) {
        // Find the folder name from our folders list
        const folder = folders.find((f) => f.id === activeFolderId)
        if (folder) params.set("folder", folder.name)
      }

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
  }, [activeFolderId, search, sort, folders])

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/media/folders")
      const json = await res.json()
      if (json.success) {
        const { folders: folderList, mediaCounts: counts } = json.data as {
          folders: ApiFolderItem[]
          mediaCounts: { all: number; photos: number; videos: number }
        }
        setFolders(folderList.map((f) => ({ id: f.id, name: f.name })))
        const fCounts = new Map<string, number>()
        for (const f of folderList) fCounts.set(f.id, f.count)
        setFolderCounts(fCounts)
        setMediaCounts(counts)
      }
    } catch {
      // Folders are non-critical; silently ignore
    }
  }, [])

  const fetchStorageUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/storage")
      const json = await res.json()
      if (json.success) {
        setStorageUsed(json.data.currentUsageFormatted)
        setStorageQuota(json.data.quotaFormatted)
        setStoragePercent(json.data.percentUsed)
      }
    } catch {
      // Non-critical
    }
  }, [])

  // Fetch media whenever filter/search/sort changes
  useEffect(() => {
    if (activeFolderId !== "google-albums") {
      fetchMedia()
    }
  }, [fetchMedia, activeFolderId])

  // Fetch folders and storage on mount
  useEffect(() => {
    fetchFolders()
    fetchStorageUsage()
  }, [fetchFolders, fetchStorageUsage])

  // Server-side media counts (all/photos/videos)
  const [mediaCounts, setMediaCounts] = useState({ all: 0, photos: 0, videos: 0 })

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
      if (updates.folderId !== undefined) {
        // Map folderId (which is the folder DB id) to the folder name
        const folder = folders.find((f) => f.id === updates.folderId)
        body.folder = folder ? folder.name : "/"
      }

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

  function requestDeleteItem(id: string) {
    setDeleteConfirm({ ids: [id], mode: "single" })
  }

  function requestBulkDelete() {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return
    setDeleteConfirm({ ids, mode: "bulk" })
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.mode === "single") {
      await handleDeleteItem(deleteConfirm.ids[0])
    } else {
      await handleBulkDelete(deleteConfirm.ids)
    }
    setDeleteConfirm(null)
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
        fetchStorageUsage()
      } else {
        toast.error(json.error ?? "Failed to delete media")
      }
    } catch {
      toast.error("Failed to delete media")
    }
  }

  async function handleBulkDelete(ids: string[]) {
    try {
      const res = await fetch("/api/v1/media/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error?.message || "Failed to delete items")
        return
      }
      const deletedCount = json.data?.deletedCount ?? ids.length
      const idSet = new Set(ids)
      setMediaItems((prev) => prev.filter((i) => !idSet.has(i.id)))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        for (const id of ids) next.delete(id)
        return next
      })
      toast.success(`Deleted ${deletedCount} item${deletedCount > 1 ? "s" : ""}`)
      fetchStorageUsage()
    } catch {
      toast.error("Failed to delete items")
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
      requestDeleteItem(id)
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
  // Folder handlers — wired to API
  // ---------------------------------------------------------------------------
  async function handleCreateFolder({ name }: { name: string }) {
    try {
      const res = await fetch("/api/v1/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (json.success) {
        const f = json.data as ApiFolderItem
        setFolders((prev) => [...prev, { id: f.id, name: f.name }])
        setFolderCounts((prev) => {
          const next = new Map(prev)
          next.set(f.id, 0)
          return next
        })
        setActiveFolderId(f.id)
      } else {
        toast.error(json.error?.message ?? "Failed to create folder")
      }
    } catch {
      toast.error("Failed to create folder")
    }
  }

  async function handleRenameFolder(id: string, name: string) {
    try {
      const res = await fetch(`/api/v1/media/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()
      if (json.success) {
        setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)))
        toast.success("Folder renamed")
      } else {
        toast.error(json.error?.message ?? "Failed to rename folder")
      }
    } catch {
      toast.error("Failed to rename folder")
    }
  }

  async function handleDeleteFolder(id: string) {
    try {
      const res = await fetch(`/api/v1/media/folders/${id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        setFolders((prev) => prev.filter((f) => f.id !== id))
        setFolderCounts((prev) => {
          const next = new Map(prev)
          next.delete(id)
          return next
        })
        if (activeFolderId === id) setActiveFolderId("all")
        // Refresh media since items were moved to root
        fetchMedia()
      } else {
        toast.error(json.error?.message ?? "Failed to delete folder")
      }
    } catch {
      toast.error("Failed to delete folder")
    }
  }

  // ---------------------------------------------------------------------------
  // Upload handler — receives already-created MediaItems from the dialog
  // ---------------------------------------------------------------------------
  function handleUploadPhotos(items: MediaItem[]) {
    setMediaItems((prev) => [...items, ...prev])
    // Refetch to get accurate server state
    fetchMedia()
    fetchFolders()
    fetchStorageUsage()
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
    // Find folder name for the target
    const folder = folderId ? folders.find((f) => f.id === folderId) : null
    const folderName = folder ? folder.name : "/"

    setMediaItems((prev) =>
      prev.map((i) => (movingIds.includes(i.id) ? { ...i, folderId } : i))
    )
    // PATCH each item server-side
    for (const id of movingIds) {
      fetch(`/api/v1/media/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: folderName }),
      }).catch(() => {
        toast.error("Failed to move item")
      })
    }
    setMovingIds([])
    setSelectedIds(new Set())
    // Refresh to get accurate counts
    fetchFolders()
    fetchMedia()
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

  // Determine the current real folder name for upload context
  const currentUploadFolder = isRealFolder(activeFolderId)
    ? (folders.find((f) => f.id === activeFolderId)?.name ?? null)
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
        onBulkDelete={requestBulkDelete}
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
          storageUsed={storageUsed}
          storageQuota={storageQuota}
          storagePercent={storagePercent}
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
              onDelete={(id) => requestDeleteItem(id)}
            />
          ) : (
            <div className="space-y-2">
              {activeFolderId === "all" && folders.length > 0 && (
                <div className="rounded-lg border divide-y">
                  {folders.map((folder) => {
                    const count = folderCounts.get(folder.id) ?? 0
                    return (
                      <button
                        key={folder.id}
                        onClick={() => handleSelectFolder(folder.id)}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-accent/50 transition-colors"
                      >
                        <Folder className="size-5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{folder.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                          {count} item{count !== 1 ? "s" : ""}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
              <DataTable
                columns={columns}
                table={table}
                onRowClick={(row) => setPreviewItem(row)}
              />
            </div>
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
        onDelete={(id) => {
          setPreviewItem(null)
          requestDeleteItem(id)
        }}
      />
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirm?.mode === "bulk"
                ? `Delete ${deleteConfirm.ids.length} items?`
                : "Delete this item?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.mode === "bulk"
                ? `This will move ${deleteConfirm.ids.length} items to trash. You can recover them later.`
                : "This will move the item to trash. You can recover it later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
