"use client"

import { Folder, FolderX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MediaFolder } from "@/lib/media-data"

interface MoveToDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: MediaFolder[]
  currentFolderId: string | null
  onSubmit: (folderId: string | null) => void
}

export function MoveToDialog({
  open,
  onOpenChange,
  folders,
  currentFolderId,
  onSubmit,
}: MoveToDialogProps) {
  function handleSelect(folderId: string | null) {
    onSubmit(folderId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Move to Folder</DialogTitle>
          <DialogDescription>
            Select a folder to move the selected items into.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {/* Remove from folder option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            disabled={currentFolderId === null}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FolderX className="size-4 text-muted-foreground" />
            <span>Remove from folder</span>
          </button>

          {folders.map((folder) => {
            const isCurrent = folder.id === currentFolderId
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleSelect(folder.id)}
                disabled={isCurrent}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Folder className="size-4 text-muted-foreground" />
                <span>{folder.name}</span>
                {isCurrent && (
                  <span className="ml-auto text-xs text-muted-foreground">Current</span>
                )}
              </button>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
