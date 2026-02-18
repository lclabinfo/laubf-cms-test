"use client"

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
import type { Series } from "@/lib/messages-data"

interface SeriesDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  series: Series | null
  onConfirm: () => void
}

export function SeriesDeleteDialog({
  open,
  onOpenChange,
  series,
  onConfirm,
}: SeriesDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{series?.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Messages within this series will not be
            deleted, but they will no longer be associated with it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
