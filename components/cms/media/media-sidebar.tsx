"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutGrid,
  ImageIcon,
  Video,
  Cloud,
  FolderPlus,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  HardDrive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { MediaFolder } from "@/lib/media-data"

// System folders created automatically by the app — cannot be renamed or deleted
const SYSTEM_FOLDER_NAMES = new Set(["Events", "Website"])

export type ActiveFilterId = "all" | "photos" | "videos" | "google-albums" | string

interface MediaSidebarProps {
  folders: MediaFolder[]
  activeFolderId: ActiveFilterId
  onSelectFolder: (id: ActiveFilterId) => void
  onCreateFolder: () => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onDropOnFolder?: (itemIds: string[], folderId: string) => void
  mediaCounts: { all: number; photos: number; videos: number }
  folderCounts: Map<string, number>
  storageUsed: string | null
  storageQuota: string | null
  storagePercent: number
}

const smartFilters: {
  id: ActiveFilterId
  label: string
  icon: React.ComponentType<{ className?: string }>
  countKey?: "all" | "photos" | "videos"
}[] = [
  { id: "all", label: "All Media", icon: LayoutGrid, countKey: "all" },
  { id: "photos", label: "Photos", icon: ImageIcon, countKey: "photos" },
  { id: "videos", label: "Videos", icon: Video, countKey: "videos" },
  { id: "google-albums", label: "Google Albums", icon: Cloud },
]

export function MediaSidebar({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDropOnFolder,
  mediaCounts,
  folderCounts,
  storageUsed,
  storageQuota,
  storagePercent,
}: MediaSidebarProps) {
  const [renamingFolder, setRenamingFolder] = useState<{ id: string; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)

  function handleRenameOpen(folder: MediaFolder) {
    setRenamingFolder(folder)
    setRenameValue(folder.name)
  }

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (renamingFolder && renameValue.trim()) {
      onRenameFolder(renamingFolder.id, renameValue.trim())
    }
    setRenamingFolder(null)
  }

  function handleDeleteConfirm() {
    if (deletingFolderId) {
      onDeleteFolder(deletingFolderId)
    }
    setDeletingFolderId(null)
  }

  return (
    <>
      <div className="w-64 shrink-0 flex flex-col border rounded-xl overflow-hidden h-full">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Smart filters */}
          <nav className="space-y-0.5">
            {smartFilters.map((filter) => {
              const isActive = activeFolderId === filter.id
              const Icon = filter.icon
              const count = filter.countKey ? mediaCounts[filter.countKey] : undefined
              return (
                <Button
                  key={filter.id}
                  variant="ghost"
                  onClick={() => onSelectFolder(filter.id)}
                  className={`w-full justify-start gap-2 h-8 px-2 font-medium ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {filter.label}
                  {count !== undefined && (
                    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{count}</span>
                  )}
                </Button>
              )
            })}
          </nav>

          {/* Folders */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Folders
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onCreateFolder}
              >
                <FolderPlus className="size-3.5" />
                <span className="sr-only">Create folder</span>
              </Button>
            </div>
            <nav className="space-y-0.5">
              {folders.map((folder) => {
                const isActive = activeFolderId === folder.id
                const count = folderCounts.get(folder.id) ?? 0
                const isSystem = SYSTEM_FOLDER_NAMES.has(folder.name)
                const isDragOver = dragOverFolderId === folder.id
                return (
                  <div
                    key={folder.id}
                    className="group relative flex items-center"
                    onDragOver={(e) => {
                      if (e.dataTransfer.types.includes("application/x-media-ids")) {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = "move"
                        setDragOverFolderId(folder.id)
                      }
                    }}
                    onDragLeave={() => setDragOverFolderId(null)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOverFolderId(null)
                      const raw = e.dataTransfer.getData("application/x-media-ids")
                      if (!raw || !onDropOnFolder) return
                      try {
                        const ids = JSON.parse(raw) as string[]
                        if (ids.length > 0) onDropOnFolder(ids, folder.id)
                      } catch { /* ignore */ }
                    }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => onSelectFolder(folder.id)}
                      className={`flex-1 justify-start gap-2 h-8 px-2 pr-8 font-medium min-w-0 ${
                        isDragOver
                          ? "bg-primary/20 text-primary"
                          : isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      <Folder className="size-4 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                      {isSystem && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 py-0 font-normal text-muted-foreground border-muted-foreground/30 ml-0.5">
                          auto
                        </Badge>
                      )}
                    </Button>
                    {/* Count / actions — share the same absolute position */}
                    <span className={`absolute right-2 text-xs text-muted-foreground tabular-nums ${isSystem ? "" : "group-hover:invisible"} pointer-events-none`}>{count}</span>
                    {!isSystem && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="size-3.5" />
                            <span className="sr-only">Folder actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRenameOpen(folder)}>
                            <Pencil />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingFolderId(folder.id)}
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )
              })}
              {folders.length === 0 && (
                <p className="px-2 text-xs text-muted-foreground">No folders yet</p>
              )}
            </nav>
          </div>
        </div>

        {/* Storage indicator */}
        <Link href="/cms/storage" className="block p-3 border-t hover:bg-accent/50 transition-colors rounded-b-lg">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Storage</span>
            <span className="ml-auto text-xs text-muted-foreground">Details</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
            <div
              className={`h-full rounded-full transition-all ${
                storagePercent >= 90 ? "bg-destructive" : storagePercent >= 75 ? "bg-orange-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(storagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{storageUsed ?? "..."}</span>{" "}
            of {storageQuota ?? "10.0 GB"} used
          </p>
          {storagePercent >= 90 && (
            <p className="text-xs text-destructive mt-1 font-medium">Storage almost full</p>
          )}
        </Link>
      </div>

      {/* Rename dialog */}
      <Dialog open={!!renamingFolder} onOpenChange={(open) => !open && setRenamingFolder(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="grid gap-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenamingFolder(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim()}>
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deletingFolderId} onOpenChange={(open) => !open && setDeletingFolderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder will be deleted but its media items will be kept and moved to ungrouped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
