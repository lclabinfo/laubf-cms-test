"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Row,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { columns, type MediaTableMeta, type MediaTableRow } from "@/components/cms/media/columns"
import { Toolbar, type SortOption } from "@/components/cms/media/toolbar"
import { MediaGrid } from "@/components/cms/media/media-grid"
import { MediaSidebar, type ActiveFilterId } from "@/components/cms/media/media-sidebar"
import { GoogleAlbumsTable } from "@/components/cms/media/google-albums-table"
import { CreateFolderDialog } from "@/components/cms/media/create-folder-dialog"
import { RenameFolderDialog } from "@/components/cms/media/rename-folder-dialog"
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
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false)
  const [addVideoOpen, setAddVideoOpen] = useState(false)
  const [connectAlbumOpen, setConnectAlbumOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [movingIds, setMovingIds] = useState<string[]>([])
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; mode: "single" | "bulk"; usages?: Array<{ type: string; title: string }> } | null>(null)
  const [renameFolderDialogOpen, setRenameFolderDialogOpen] = useState(false)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  // Ref to read folders without adding them as a useCallback dependency (avoids infinite loop)
  const foldersRef = useRef(folders)
  foldersRef.current = folders

  const fetchMedia = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      const currentFolders = foldersRef.current

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
        const folder = currentFolders.find((f) => f.id === activeFolderId)
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
        const nameToId: Record<string, string> = {}
        for (const f of currentFolders) nameToId[f.name] = f.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: MediaItem[] = json.data.items.map((a: any) => mediaAssetToItem(a, nameToId))
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
  }, [fetchMedia]) // activeFolderId is already a dep of fetchMedia

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

  // Build unified table data: folders first (only in "all" view), then media items
  const tableData = useMemo<MediaTableRow[]>(() => {
    const rows: MediaTableRow[] = []
    if (activeFolderId === "all") {
      for (const folder of folders) {
        rows.push({
          _kind: "folder",
          id: folder.id,
          name: folder.name,
          count: folderCounts.get(folder.id) ?? 0,
        })
      }
    }
    for (const item of filteredItems) {
      rows.push({ _kind: "media", ...item })
    }
    return rows
  }, [activeFolderId, folders, folderCounts, filteredItems])

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

  // Row selection for TanStack Table (only media rows are selectable)
  const rowSelection = useMemo(() => {
    const sel: Record<string, boolean> = {}
    tableData.forEach((row, idx) => {
      if (row._kind === "media" && selectedIds.has(row.id)) sel[String(idx)] = true
    })
    return sel
  }, [selectedIds, tableData])

  const handleRowSelectionChange = useCallback(
    (updater: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)) => {
      const newSel = typeof updater === "function" ? updater(rowSelection) : updater
      const newIds = new Set<string>()
      for (const [idx, selected] of Object.entries(newSel)) {
        const row = tableData[Number(idx)]
        if (selected && row && row._kind === "media") {
          newIds.add(row.id)
        }
      }
      setSelectedIds(newIds)
    },
    [rowSelection, tableData]
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

  async function requestDeleteItem(id: string) {
    // Fetch usage before showing delete confirmation
    try {
      const res = await fetch(`/api/v1/media/${id}/usage`)
      const json = await res.json()
      const usages = json.success && Array.isArray(json.data) ? json.data : []
      setDeleteConfirm({ ids: [id], mode: "single", usages })
    } catch {
      setDeleteConfirm({ ids: [id], mode: "single", usages: [] })
    }
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
    onFolderClick: (folderId: string) => {
      handleSelectFolder(folderId)
    },
  }), [mediaItems])

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting: tableSorting,
      rowSelection,
      pagination: { pageIndex: 0, pageSize: 20 },
    },
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection: (row) => row.original._kind === "media",
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

  // Bulk folder actions from toolbar
  function handleBulkRenameFolder() {
    const id = Array.from(selectedFolderIds)[0]
    if (!id) return
    setRenamingFolderId(id)
    setRenameFolderDialogOpen(true)
  }

  async function handleBulkDeleteFolders() {
    const ids = Array.from(selectedFolderIds)
    for (const id of ids) {
      await handleDeleteFolder(id)
    }
    setSelectedFolderIds(new Set())
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
  // Video / Album handlers
  // ---------------------------------------------------------------------------
  async function handleAddVideo({ url, name }: { url: string; name: string }) {
    const isYouTube = /youtube\.com|youtu\.be/i.test(url)
    const currentFolders = foldersRef.current
    const folderId = isRealFolder(activeFolderId) ? activeFolderId : null
    const folderName = folderId ? currentFolders.find((f) => f.id === folderId)?.name ?? "/" : "/"

    // Optimistic local item
    const tempId = crypto.randomUUID()
    const newItem: MediaItem = {
      id: tempId,
      name,
      type: "video",
      format: isYouTube ? "YouTube" : "Vimeo",
      url,
      videoUrl: url,
      size: "-",
      folderId,
      dateAdded: new Date().toISOString().slice(0, 10),
    }
    setMediaItems((prev) => [newItem, ...prev])

    // Persist to DB
    try {
      const res = await fetch("/api/v1/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: name,
          url,
          mimeType: isYouTube ? "video/youtube" : "video/vimeo",
          fileSize: 0,
          folder: folderName,
        }),
      })
      const json = await res.json()
      if (json.success && json.data) {
        // Replace temp item with real DB record
        const nameToId: Record<string, string> = {}
        for (const f of currentFolders) nameToId[f.name] = f.id
        const realItem = mediaAssetToItem(json.data, nameToId)
        setMediaItems((prev) => prev.map((i) => (i.id === tempId ? realItem : i)))
      }
    } catch (err) {
      console.error("Failed to save video:", err)
      toast.error("Failed to save video to library")
      // Remove optimistic item on failure
      setMediaItems((prev) => prev.filter((i) => i.id !== tempId))
    }

    // Refresh folder counts
    fetchFolders()
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
  async function handleMoveItems(folderId: string | null) {
    // Find folder name for the target
    const folder = folderId ? folders.find((f) => f.id === folderId) : null
    const folderName = folder ? folder.name : "/"
    const idSet = new Set(movingIds)

    // Optimistic: remove from current view
    setMediaItems((prev) => prev.filter((i) => !idSet.has(i.id)))
    setMovingIds([])
    setSelectedIds(new Set())

    // PATCH each item server-side, then refresh
    await Promise.all(
      Array.from(idSet).map((id) =>
        fetch(`/api/v1/media/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: folderName }),
        }).catch(() => {
          toast.error("Failed to move item")
        })
      )
    )

    fetchFolders()
    fetchMedia()
  }

  function handleBulkMove() {
    setMovingIds(Array.from(selectedIds))
    setMoveDialogOpen(true)
  }

  async function handleDropOnFolder(itemIds: string[], folderId: string) {
    const folder = folders.find((f) => f.id === folderId)
    if (!folder) return
    const folderName = folder.name
    const idSet = new Set(itemIds)

    // Optimistic: remove from current view (they're moving to a different folder)
    setMediaItems((prev) => prev.filter((i) => !idSet.has(i.id)))
    setSelectedIds(new Set())

    toast.success(`Moved ${itemIds.length} item${itemIds.length > 1 ? "s" : ""} to ${folderName}`)

    // PATCH each item server-side, then refresh
    await Promise.all(
      itemIds.map((id) =>
        fetch(`/api/v1/media/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: folderName }),
        }).catch(() => {
          toast.error("Failed to move item")
        })
      )
    )

    fetchFolders()
    fetchMedia()
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleToggleFolderSelect(id: string) {
    setSelectedFolderIds((prev) => {
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
    setSelectedFolderIds(new Set())
  }

  function clearAllSelections() {
    setSelectedIds(new Set())
    setSelectedFolderIds(new Set())
  }

  function handleViewModeChange(mode: "grid" | "list") {
    setViewMode(mode)
    setSelectedIds(new Set())
    setSelectedFolderIds(new Set())
  }

  function handleSelectFolder(id: ActiveFilterId) {
    setActiveFolderId(id)
    setSelectedIds(new Set())
    setSelectedFolderIds(new Set())
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
        selectedFolderCount={selectedFolderIds.size}
        onClearSelection={clearAllSelections}
        onUploadPhotos={() => setUploadPhotoOpen(true)}
        onAddVideo={() => setAddVideoOpen(true)}
        onConnectAlbum={() => setConnectAlbumOpen(true)}
        onBulkMove={handleBulkMove}
        onBulkDelete={requestBulkDelete}
        onBulkRenameFolder={handleBulkRenameFolder}
        onBulkDeleteFolders={handleBulkDeleteFolders}
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
          onDropOnFolder={handleDropOnFolder}
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
              selectedFolderIds={selectedFolderIds}
              onToggleSelect={handleToggleSelect}
              onToggleFolderSelect={handleToggleFolderSelect}
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
              onDropOnFolder={handleDropOnFolder}
            />
          ) : (
            <DataTable
              columns={columns}
              table={table}
              onRowClick={(row) => {
                if (row._kind === "folder") {
                  handleSelectFolder(row.id)
                } else {
                  setPreviewItem(row)
                }
              }}
              getRowProps={(row: Row<MediaTableRow>) => {
                const item = row.original
                if (item._kind === "media") {
                  return {
                    draggable: true,
                    onDragStart: (e: React.DragEvent) => {
                      const ids = selectedIds.has(item.id) && selectedIds.size > 1
                        ? Array.from(selectedIds)
                        : [item.id]
                      e.dataTransfer.setData("application/x-media-ids", JSON.stringify(ids))
                      e.dataTransfer.effectAllowed = "move"
                    },
                  }
                }
                // Folder rows are drop targets
                return {
                  onDragOver: (e: React.DragEvent) => {
                    if (e.dataTransfer.types.includes("application/x-media-ids")) {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                      ;(e.currentTarget as HTMLElement).dataset.dragOver = "true"
                    }
                  },
                  onDragLeave: (e: React.DragEvent) => {
                    delete (e.currentTarget as HTMLElement).dataset.dragOver
                  },
                  onDrop: (e: React.DragEvent) => {
                    e.preventDefault()
                    delete (e.currentTarget as HTMLElement).dataset.dragOver
                    const raw = e.dataTransfer.getData("application/x-media-ids")
                    if (!raw) return
                    try {
                      const ids = JSON.parse(raw) as string[]
                      if (ids.length > 0) handleDropOnFolder(ids, item.id)
                    } catch { /* ignore */ }
                  },
                }
              }}
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
      <RenameFolderDialog
        open={renameFolderDialogOpen}
        onOpenChange={setRenameFolderDialogOpen}
        currentName={renamingFolderId ? (folders.find((f) => f.id === renamingFolderId)?.name ?? "") : ""}
        onSubmit={(newName) => {
          if (renamingFolderId) {
            handleRenameFolder(renamingFolderId, newName)
            setSelectedFolderIds(new Set())
          }
        }}
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
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {deleteConfirm?.mode === "bulk"
                    ? `This will move ${deleteConfirm.ids.length} items to trash. You can recover them later.`
                    : "This will move the item to trash. You can recover it later."}
                </p>
                {deleteConfirm?.usages && deleteConfirm.usages.length > 0 && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                    <p className="font-medium text-destructive mb-1.5">
                      This image is currently used in:
                    </p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {deleteConfirm.usages.map((u, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="size-1 rounded-full bg-destructive/50 shrink-0" />
                          {u.title}
                          <span className="text-xs">({u.type === "page-section" ? "Website" : "Event"})</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2">
                      Deleting it will leave broken images in these locations.
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteConfirm?.usages && deleteConfirm.usages.length > 0 ? "Delete Anyway" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
