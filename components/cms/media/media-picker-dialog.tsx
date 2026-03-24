"use client"

import { useState, useRef, useCallback, useEffect, useMemo } from "react"
import {
  Upload,
  ImageIcon,
  Search,
  Loader2,
  Check,
  LayoutGrid,
  List,
  Folder,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  MAX_UPLOAD_SIZE,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  ACCEPTED_ALL_MEDIA_TYPES,
  formatFileSize,
} from "@/lib/upload-constants"

const IMAGE_TYPES: string[] = [...ACCEPTED_IMAGE_TYPES]
const VIDEO_TYPES: string[] = [...ACCEPTED_VIDEO_TYPES]
const ALL_TYPES: string[] = [...ACCEPTED_ALL_MEDIA_TYPES]

const FETCH_LIMIT = 200 // Fetch up to 200 items per folder view

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string, alt?: string) => void
  /** Auto-create and filter to this folder (e.g. "Events") */
  folder?: string
  /** Filter media library and upload types. Default: "image" */
  mediaType?: "image" | "video" | "all"
}

type ViewMode = "grid" | "list"

interface FolderInfo {
  id: string
  name: string
  count: number
}

interface MediaItem {
  id: string
  url: string
  filename: string
  alt?: string | null
  mimeType?: string
  fileSize?: number
  createdAt?: string
  folder?: string
}

function getMediaDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.preload = "metadata"
      const objectUrl = URL.createObjectURL(file)
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight })
        URL.revokeObjectURL(objectUrl)
      }
      video.onerror = () => {
        resolve({ width: 0, height: 0 })
        URL.revokeObjectURL(objectUrl)
      }
      video.src = objectUrl
    })
  }
  return new Promise((resolve) => {
    const img = new globalThis.Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  })
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  folder,
  mediaType: mediaTypeProp = "image",
}: MediaPickerDialogProps) {
  const acceptedTypes = mediaTypeProp === "video" ? VIDEO_TYPES : mediaTypeProp === "all" ? ALL_TYPES : IMAGE_TYPES
  const acceptedTypesString = acceptedTypes.join(",")
  const mediaLabel = mediaTypeProp === "video" ? "video" : mediaTypeProp === "all" ? "media" : "image"
  // View
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")

  // Folders
  const [folders, setFolders] = useState<FolderInfo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [activeFolder, setActiveFolder] = useState<string | null>(
    folder ?? null
  )
  const [foldersLoading, setFoldersLoading] = useState(false)

  // Media items
  const [items, setItems] = useState<MediaItem[]>([])
  const [itemsLoading, setItemsLoading] = useState(false)

  // Selection
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)

  // Upload
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Abort controller ref for cancelling stale fetches
  const abortRef = useRef<AbortController | null>(null)

  // ---------------------------------------------------------------------------
  // Reset on open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setSelectedItem(null)
      setActiveFolder(folder ?? null)
      setViewMode("grid")
    }
  }, [open, folder])

  // ---------------------------------------------------------------------------
  // Fetch folders on open
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function load() {
      setFoldersLoading(true)
      try {
        const res = await fetch("/api/v1/media/folders")
        const json = await res.json()
        if (!cancelled && json.success) {
          const flds: FolderInfo[] = json.data.folders ?? []
          setFolders(flds)
          const counts = json.data.mediaCounts ?? {}
          setTotalCount(counts.all ?? 0)
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setFoldersLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open])

  // ---------------------------------------------------------------------------
  // Fetch media items when folder changes
  // ---------------------------------------------------------------------------
  const fetchItems = useCallback(
    async (folderValue: string | null) => {
      // Cancel any in-flight fetch
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setItemsLoading(true)
      try {
        const params = new URLSearchParams({
          limit: String(FETCH_LIMIT),
        })
        if (mediaTypeProp !== "all") {
          params.set("type", mediaTypeProp === "video" ? "video" : "image")
        }
        if (folderValue) {
          params.set("folder", folderValue)
        }
        const res = await fetch(`/api/v1/media?${params.toString()}`, {
          signal: controller.signal,
        })
        const json = await res.json()
        if (json.success && json.data?.items) {
          setItems(
            json.data.items.map((item: Record<string, unknown>) => ({
              id: item.id as string,
              url: item.url as string,
              filename: item.filename as string,
              alt: (item.alt as string | null) ?? null,
              mimeType: (item.mimeType as string) ?? undefined,
              fileSize: (item.fileSize as number) ?? undefined,
              createdAt: (item.createdAt as string) ?? undefined,
              folder: (item.folder as string) ?? undefined,
            }))
          )
        }
      } catch (err) {
        // Ignore abort errors, silence others
        if (err instanceof DOMException && err.name === "AbortError") return
      } finally {
        // Only clear loading if this controller wasn't aborted
        if (!controller.signal.aborted) {
          setItemsLoading(false)
        }
      }
    },
    [mediaTypeProp]
  )

  // Fetch items when dialog opens or active folder changes
  useEffect(() => {
    if (!open) return
    fetchItems(activeFolder)
    return () => {
      abortRef.current?.abort()
    }
  }, [open, activeFolder, fetchItems])

  // ---------------------------------------------------------------------------
  // Ensure folder exists (for upload)
  // ---------------------------------------------------------------------------
  const ensureFolder = useCallback(async (folderName: string) => {
    try {
      await fetch("/api/v1/media/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: folderName }),
      })
    } catch {
      // Fire-and-forget, 409 is fine
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------
  async function uploadFile(file: File) {
    if (!acceptedTypes.includes(file.type)) {
      return
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(`File exceeds ${formatFileSize(MAX_UPLOAD_SIZE)} limit`, {
        action: {
          label: "Try different file",
          onClick: () => fileInputRef.current?.click(),
        },
      })
      return
    }

    setIsUploading(true)

    // Determine target folder for upload
    const targetFolder = activeFolder ?? folder ?? "/"

    // Ensure folder exists if not root
    if (targetFolder !== "/") {
      await ensureFolder(targetFolder)
    }

    try {
      // 1. Get presigned URL
      const urlRes = await fetch("/api/v1/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
          context: "media",
        }),
      })

      const urlJson = await urlRes.json()
      if (!urlJson.success) {
        setIsUploading(false)
        return
      }

      const { uploadUrl, publicUrl } = urlJson.data

      // 2. PUT to R2
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!putRes.ok) {
        setIsUploading(false)
        return
      }

      // 3. Get media dimensions (images and videos)
      const dims = await getMediaDimensions(file)

      // 4. Create media record
      const createRes = await fetch("/api/v1/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          url: publicUrl,
          mimeType: file.type,
          fileSize: file.size,
          width: dims.width || undefined,
          height: dims.height || undefined,
          folder: targetFolder,
        }),
      })

      const createJson = await createRes.json()
      if (createJson.success && createJson.data) {
        const newItem: MediaItem = {
          id: createJson.data.id,
          url: createJson.data.url ?? publicUrl,
          filename: file.name,
          alt: null,
          mimeType: file.type,
          fileSize: file.size,
          createdAt: new Date().toISOString(),
          folder: targetFolder,
        }

        // Add to items and auto-select
        setItems((prev) => [newItem, ...prev])
        setSelectedItem(newItem)

        // Refresh folder counts
        try {
          const fRes = await fetch("/api/v1/media/folders")
          const fJson = await fRes.json()
          if (fJson.success) {
            setFolders(fJson.data.folders ?? [])
            setTotalCount(fJson.data.mediaCounts?.all ?? 0)
          }
        } catch {
          // silent
        }
      }
    } catch {
      // silent
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------
  function handleItemClick(item: MediaItem) {
    if (selectedItem?.id === item.id) {
      setSelectedItem(null)
    } else {
      setSelectedItem(item)
    }
  }

  function handleSelect() {
    if (selectedItem) {
      onSelect(selectedItem.url, selectedItem.alt ?? selectedItem.filename)
      onOpenChange(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------------
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter((item) =>
      item.filename.toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  // Separate folders that have items (for "All Media" view showing folder cards first)
  const foldersWithItems = useMemo(() => {
    if (activeFolder !== null) return []
    return folders.filter((f) => f.count > 0)
  }, [activeFolder, folders])

  // Current folder display info
  const currentFolderName = activeFolder ?? "All Media"
  const currentItemCount = filteredItems.length

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-5xl h-[80vh] !p-0 !gap-0 flex flex-col"
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between border-b px-5 py-3 shrink-0">
          <DialogTitle className="text-base font-semibold">
            Select Media
          </DialogTitle>
          <DialogDescription className="sr-only">
            Browse and select {mediaLabel === "image" ? "an" : "a"} {mediaLabel} from your media library or upload a new one.
          </DialogDescription>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 h-8 text-sm"
              />
            </div>

            {/* Grid / List toggle */}
            <div className="flex items-center rounded-md border">
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                className="rounded-r-none border-0"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="size-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                className="rounded-l-none border-0"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypesString}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>

        {/* ---- Body ---- */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-56 shrink-0 border-r overflow-y-auto p-3">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
              Folders
            </div>

            {/* All Media */}
            <button
              type="button"
              className={cn(
                "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                activeFolder === null
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-muted text-foreground"
              )}
              onClick={() => setActiveFolder(null)}
            >
              <span>All Media</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {totalCount}
              </span>
            </button>

            {/* Folder list */}
            {foldersLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors",
                    activeFolder === f.name
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                  onClick={() => setActiveFolder(f.name)}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Folder className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums ml-2">
                    {f.count}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Content area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Breadcrumb bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b text-sm shrink-0">
              {activeFolder !== null && (
                <button
                  type="button"
                  onClick={() => setActiveFolder(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-4" />
                </button>
              )}
              <span className="font-medium">{currentFolderName}</span>
              <span className="text-muted-foreground">
                ({currentItemCount} {currentItemCount === 1 ? "item" : "items"})
              </span>
            </div>

            {/* Grid / List content */}
            <div className="flex-1 overflow-y-auto p-4">
              {itemsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItems.length === 0 && foldersWithItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ImageIcon className="size-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery ? `No ${mediaLabel}s match your search` : `No ${mediaLabel}s found`}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {searchQuery
                      ? "Try a different search term"
                      : `Upload ${mediaLabel === "image" ? "an" : "a"} ${mediaLabel} to get started`}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* Folder cards in "All Media" view */}
                  {foldersWithItems.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="flex flex-col items-center justify-center aspect-square rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                      onClick={() => setActiveFolder(f.name)}
                    >
                      <Folder className="size-8 text-muted-foreground mb-1.5" />
                      <span className="text-xs font-medium truncate max-w-full px-2">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {f.count} {f.count === 1 ? "item" : "items"}
                      </span>
                    </button>
                  ))}

                  {/* Image cards */}
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={cn(
                        "group relative flex flex-col rounded-lg border overflow-hidden transition-all",
                        selectedItem?.id === item.id
                          ? "ring-2 ring-primary ring-offset-1"
                          : "hover:shadow-md"
                      )}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-muted relative">
                        {item.mimeType?.startsWith("video/") ? (
                          /* eslint-disable-next-line jsx-a11y/media-has-caption */
                          <video
                            src={`${item.url}#t=0.5`}
                            preload="metadata"
                            muted
                            playsInline
                            className="size-full object-cover"
                          />
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.url}
                            alt={item.alt ?? item.filename}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                      {selectedItem?.id === item.id && (
                        <div className="absolute top-1.5 right-1.5 flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" />
                        </div>
                      )}
                      <div className="px-1.5 py-1">
                        <span className="text-xs text-muted-foreground truncate block">
                          {item.filename}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* List view */
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left py-2 px-3 font-medium w-12" />
                        <th className="text-left py-2 px-3 font-medium">Name</th>
                        <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">
                          Date
                        </th>
                        <th className="text-left py-2 px-3 font-medium hidden sm:table-cell">
                          Size
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Folder rows in "All Media" view */}
                      {foldersWithItems.map((f) => (
                        <tr
                          key={f.id}
                          className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => setActiveFolder(f.name)}
                        >
                          <td className="py-2 px-3">
                            <div className="size-8 flex items-center justify-center rounded bg-muted">
                              <Folder className="size-4 text-muted-foreground" />
                            </div>
                          </td>
                          <td className="py-2 px-3 font-medium">{f.name}</td>
                          <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">
                            --
                          </td>
                          <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">
                            {f.count} {f.count === 1 ? "item" : "items"}
                          </td>
                        </tr>
                      ))}

                      {/* Media rows */}
                      {filteredItems.map((item) => (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-b cursor-pointer transition-colors",
                            selectedItem?.id === item.id
                              ? "bg-primary/5 ring-1 ring-inset ring-primary"
                              : "hover:bg-muted/30"
                          )}
                          onClick={() => handleItemClick(item)}
                        >
                          <td className="py-2 px-3">
                            <div className="size-8 rounded overflow-hidden bg-muted shrink-0">
                              {item.mimeType?.startsWith("video/") ? (
                                /* eslint-disable-next-line jsx-a11y/media-has-caption */
                                <video
                                  src={`${item.url}#t=0.5`}
                                  preload="metadata"
                                  muted
                                  playsInline
                                  className="size-full object-cover"
                                />
                              ) : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={item.url}
                                  alt={item.alt ?? item.filename}
                                  loading="lazy"
                                  decoding="async"
                                  className="size-full object-cover"
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="truncate block max-w-xs">
                              {item.filename}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">
                            {item.createdAt ? formatDate(item.createdAt) : "--"}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground hidden sm:table-cell">
                            {item.fileSize ? formatFileSize(item.fileSize) : "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredItems.length === 0 && foldersWithItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ImageIcon className="size-10 text-muted-foreground/30 mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {searchQuery
                          ? `No ${mediaLabel}s match your search`
                          : `No ${mediaLabel}s found`}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---- Footer ---- */}
        <div className="flex items-center justify-between border-t px-5 py-3 shrink-0">
          <span className="text-sm text-muted-foreground">
            {selectedItem ? "1 item selected" : "No item selected"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!selectedItem}
              onClick={handleSelect}
            >
              Select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
