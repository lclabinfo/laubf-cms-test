"use client"

import { useState } from "react"
import { toast } from "sonner"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { PersonDetail } from "./types"

type Props = {
  person: PersonDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onArchived: () => void
}

export function ArchiveMemberDialog({ person, open, onOpenChange, onArchived }: Props) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const name = `${person.firstName} ${person.lastName}`

  const handleArchive = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/people/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipStatus: "ARCHIVED",
          notes: reason
            ? `${person.notes ? person.notes + "\n" : ""}[Archived] ${reason}`
            : person.notes,
        }),
      })
      if (!res.ok) throw new Error("Failed to archive")
      toast.success(`${name} archived`, {
        action: {
          label: "Undo",
          onClick: async () => {
            await fetch(`/api/v1/people/${person.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ membershipStatus: person.membershipStatus }),
            })
            onArchived()
            toast.success(`${name} restored`)
          },
        },
      })
      onOpenChange(false)
      setReason("")
      onArchived()
    } catch {
      toast.error("Failed to archive member")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {name} from active member lists. They will remain in
            group histories and records.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="archive-reason">Reason (optional)</Label>
          <Textarea
            id="archive-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this member being archived?"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isSubmitting ? "Archiving..." : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
