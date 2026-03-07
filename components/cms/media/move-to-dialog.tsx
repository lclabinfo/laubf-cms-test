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
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => handleSelect(null)}
            disabled={currentFolderId === null}
          >
            <FolderX className="size-4 text-muted-foreground" />
            Remove from folder
          </Button>

          {folders.map((folder) => {
            const isCurrent = folder.id === currentFolderId
            return (
              <Button
                key={folder.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleSelect(folder.id)}
                disabled={isCurrent}
              >
                <Folder className="size-4 text-muted-foreground" />
                <span className="truncate">{folder.name}</span>
                {isCurrent && (
                  <span className="ml-auto text-xs text-muted-foreground">Current</span>
                )}
              </Button>
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
