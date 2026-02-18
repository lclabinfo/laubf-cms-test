"use client"

import { useState } from "react"
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
import type { MediaFolder } from "@/lib/media-data"

export type ActiveFilterId = "all" | "photos" | "videos" | "google-albums" | string

interface MediaSidebarProps {
  folders: MediaFolder[]
  activeFolderId: ActiveFilterId
  onSelectFolder: (id: ActiveFilterId) => void
  onCreateFolder: () => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  mediaCounts: { all: number; photos: number; videos: number }
  folderCounts: Map<string, number>
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
  mediaCounts,
  folderCounts,
}: MediaSidebarProps) {
  const [renamingFolder, setRenamingFolder] = useState<{ id: string; name: string } | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)

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
      <div className="w-64 shrink-0 flex flex-col border rounded-xl overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Smart filters */}
          <nav className="space-y-0.5">
            {smartFilters.map((filter) => {
              const isActive = activeFolderId === filter.id
              const Icon = filter.icon
              const count = filter.countKey ? mediaCounts[filter.countKey] : undefined
              return (
                <button
                  key={filter.id}
                  onClick={() => onSelectFolder(filter.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {filter.label}
                  {count !== undefined && (
                    <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                  )}
                </button>
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
                className="size-6"
              >
                <FolderPlus className="size-3.5" />
                <span className="sr-only">Create folder</span>
              </Button>
            </div>
            <nav className="space-y-0.5">
              {folders.map((folder) => {
                const isActive = activeFolderId === folder.id
                const count = folderCounts.get(folder.id) ?? 0
                return (
                  <div key={folder.id} className="group relative flex items-center">
                    <button
                      onClick={() => onSelectFolder(folder.id)}
                      className={`flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors min-w-0 ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      }`}
                    >
                      <Folder className="size-4 shrink-0" />
                      <span className="truncate">{folder.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">{count}</span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="absolute right-0 size-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <div className="p-3 border-t">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Storage</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1.5">
            <div className="h-full rounded-full bg-primary" style={{ width: "42%" }} />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">4.2 GB</span> of 10 GB used
          </p>
        </div>
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
