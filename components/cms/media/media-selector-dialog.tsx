"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  FolderInput,
  ArrowLeft,
  X,
  Check,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  mediaItems,
  mediaFolders,
  formatDisplay,
  type MediaItem,
} from "@/lib/media-data"

interface MediaSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (items: MediaItem[]) => void
  mode?: "single" | "multiple"
}

export function MediaSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  mode = "single",
}: MediaSelectorDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeFolderId, setActiveFolderId] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set())
      setSearch("")
      setActiveFolderId("all")
    }
  }, [open])

  // Folder counts
  const folderCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of mediaItems) {
      if (item.folderId) {
        map.set(item.folderId, (map.get(item.folderId) ?? 0) + 1)
      }
    }
    return map
  }, [])

  // Filtered items
  const filteredItems = useMemo(() => {
    let items: MediaItem[]

    if (search) {
      // Search overrides folder filter
      const q = search.toLowerCase()
      items = mediaItems.filter((i) => i.name.toLowerCase().includes(q))
    } else if (activeFolderId === "all") {
      items = mediaItems.filter((i) => i.folderId === null)
    } else {
      items = mediaItems.filter((i) => i.folderId === activeFolderId)
    }

    // Sort newest first
    return [...items].sort(
      (a, b) => b.dateAdded.localeCompare(a.dateAdded)
    )
  }, [activeFolderId, search])

  // Folders to display as cards (only in "all" view with no search)
  const displayFolders = useMemo(() => {
    if (activeFolderId !== "all" || search) return []
    return mediaFolders
  }, [activeFolderId, search])

  const activeFolderName =
    activeFolderId === "all"
      ? "All Media"
      : mediaFolders.find((f) => f.id === activeFolderId)?.name ?? "All Media"

  const totalItemCount = search
    ? filteredItems.length
    : activeFolderId === "all"
      ? mediaItems.length
      : filteredItems.length

  function handleItemClick(id: string) {
    if (mode === "single") {
      setSelectedIds(new Set([id]))
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }
  }

  function handleFolderClick(folderId: string) {
    setActiveFolderId(folderId)
  }

  function handleConfirm() {
    const selected = mediaItems.filter((i) => selectedIds.has(i.id))
    if (selected.length > 0) {
      onSelect(selected)
      onOpenChange(false)
    }
  }

  const selectionText =
    selectedIds.size === 0
      ? "No item selected"
      : selectedIds.size === 1
        ? "1 item selected"
        : `${selectedIds.size} items selected`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-5xl w-full h-[80vh] flex flex-col !p-0 !gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b shrink-0 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <DialogTitle>Select Media</DialogTitle>
            <DialogDescription className="sr-only">
              Browse and select media files from your library.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="border rounded-md flex items-center p-0.5 bg-muted/20">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="size-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r bg-muted/10 overflow-y-auto p-3">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
              Folders
            </h3>
            <div className="space-y-0.5">
              <Button
                variant={activeFolderId === "all" && !search ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-sm font-normal h-8",
                  activeFolderId === "all" && !search && "font-medium"
                )}
                onClick={() => {
                  setActiveFolderId("all")
                  setSearch("")
                }}
              >
                <FolderInput className="mr-2 size-4 text-muted-foreground" />
                <span className="truncate flex-1 text-left">All Media</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {mediaItems.length}
                </span>
              </Button>
              {mediaFolders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={activeFolderId === folder.id && !search ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start text-sm font-normal h-8",
                    activeFolderId === folder.id && !search && "font-medium"
                  )}
                  onClick={() => {
                    setActiveFolderId(folder.id)
                    setSearch("")
                  }}
                >
                  <FolderInput className="mr-2 size-4 text-muted-foreground" />
                  <span className="truncate flex-1 text-left">
                    {folder.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {folderCounts.get(folder.id) ?? 0}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Sub-header */}
            <div className="px-4 py-2.5 border-b flex items-center gap-2">
              {activeFolderId !== "all" && !search && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setActiveFolderId("all")}
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <span className="font-medium">
                {search ? "Search results" : activeFolderName}
              </span>
              <span className="text-sm text-muted-foreground">
                ({totalItemCount} items)
              </span>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto p-4">
              {viewMode === "grid" ? (
                <SelectorGrid
                  items={filteredItems}
                  folders={displayFolders}
                  folderCounts={folderCounts}
                  selectedIds={selectedIds}
                  onItemClick={handleItemClick}
                  onFolderClick={handleFolderClick}
                />
              ) : (
                <SelectorList
                  items={filteredItems}
                  selectedIds={selectedIds}
                  onItemClick={handleItemClick}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t shrink-0 bg-muted/10 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectionText}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
              Select
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Grid view
// ---------------------------------------------------------------------------

function SelectorGrid({
  items,
  folders,
  folderCounts,
  selectedIds,
  onItemClick,
  onFolderClick,
}: {
  items: MediaItem[]
  folders: { id: string; name: string }[]
  folderCounts: Map<string, number>
  selectedIds: Set<string>
  onItemClick: (id: string) => void
  onFolderClick: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Folder cards */}
      {folders.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Folders
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onFolderClick(folder.id)}
                className="group flex items-center gap-3 rounded-lg border bg-card p-3 text-left hover:bg-accent transition-colors"
              >
                <FolderInput className="size-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {folder.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {folderCounts.get(folder.id) ?? 0} items
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Media items */}
      {items.length > 0 && (
        <div>
          {folders.length > 0 && (
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Ungrouped
            </h4>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id)
              const isVideo = item.type === "video"
              return (
                <button
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={cn(
                    "group relative rounded-lg border overflow-hidden text-left transition-all",
                    isSelected
                      ? "ring-2 ring-primary border-primary"
                      : "hover:border-foreground/20"
                  )}
                >
                  <div className="aspect-video bg-muted relative">
                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground">
                        <LayoutGrid className="size-6" />
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-black/60 p-1.5">
                          <Play className="size-4 text-white fill-white" />
                        </div>
                      </div>
                    )}
                    {/* Selection indicator */}
                    <div
                      className={cn(
                        "absolute top-2 right-2 size-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-white/70 bg-black/20 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">
                      {item.name}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {items.length === 0 && folders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Search className="size-8 mb-2" />
          <p className="text-sm">No media found</p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// List view
// ---------------------------------------------------------------------------

function SelectorList({
  items,
  selectedIds,
  onItemClick,
}: {
  items: MediaItem[]
  selectedIds: Set<string>
  onItemClick: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Search className="size-8 mb-2" />
        <p className="text-sm">No media found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="py-2 px-3 font-medium w-12"></th>
            <th className="py-2 px-3 font-medium">Name</th>
            <th className="py-2 px-3 font-medium w-20">Format</th>
            <th className="py-2 px-3 font-medium w-24">Size</th>
            <th className="py-2 px-3 font-medium w-28">Date</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id)
            const fmt = formatDisplay[item.format]
            return (
              <tr
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  "border-b last:border-b-0 cursor-pointer transition-colors",
                  isSelected ? "bg-accent" : "hover:bg-muted/50"
                )}
              >
                <td className="py-2 px-3">
                  <div className="size-10 rounded border bg-muted overflow-hidden shrink-0">
                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-muted-foreground">
                        <LayoutGrid className="size-4" />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{item.name}</span>
                    {isSelected && (
                      <Check className="size-4 text-primary shrink-0" />
                    )}
                  </div>
                </td>
                <td className="py-2 px-3">
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px] px-1.5 py-0", fmt.color)}
                  >
                    {fmt.label}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-muted-foreground">
                  {item.size}
                </td>
                <td className="py-2 px-3 text-muted-foreground">
                  {item.dateAdded}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
