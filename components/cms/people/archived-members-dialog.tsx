"use client"

import { useState, useMemo } from "react"
import { Archive, Loader2, RotateCcw, Search, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMembers } from "@/lib/members-context"
import type { MemberPerson } from "@/lib/members-context"

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0) || ""}`.toUpperCase()
}

function ArchivedMemberRow({
  member,
  onRestore,
  onPermanentDelete,
}: {
  member: MemberPerson
  onRestore: (id: string) => void
  onPermanentDelete: (id: string) => void
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 group">
        <Avatar size="sm">
          {member.photoUrl && <AvatarImage src={member.photoUrl} alt={`${member.firstName} ${member.lastName}`} />}
          <AvatarFallback>{getInitials(member.firstName, member.lastName)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {member.firstName} {member.lastName}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {member.email ?? "No email"}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onRestore(member.id)}
          >
            <RotateCcw className="size-3 mr-1" />
            Restore
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash2 className="size-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Permanently delete member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{member.firstName} {member.lastName}</strong> will be permanently removed from the database.
              This includes all notes, role assignments, and custom fields. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onPermanentDelete(member.id)}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface ArchivedMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArchivedMembersDialog({ open, onOpenChange }: ArchivedMembersDialogProps) {
  const { archivedMembers, loadingArchived, restoreMember, permanentDeleteMember, refreshArchived } = useMembers()
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return archivedMembers
    const q = search.toLowerCase()
    return archivedMembers.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        (m.email?.toLowerCase().includes(q) ?? false)
    )
  }, [archivedMembers, search])

  const handleRestore = async (id: string) => {
    const member = archivedMembers.find((m) => m.id === id)
    await restoreMember(id)
    toast.success("Member restored", {
      description: member ? `${member.firstName} ${member.lastName} is now active.` : undefined,
    })
  }

  const handlePermanentDelete = async (id: string) => {
    const member = archivedMembers.find((m) => m.id === id)
    await permanentDeleteMember(id)
    toast.success("Member permanently deleted", {
      description: member ? `${member.firstName} ${member.lastName} has been removed.` : undefined,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) refreshArchived()
        setSearch("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Archived Members</DialogTitle>
            {!loadingArchived && (
              <Badge variant="secondary" className="text-xs">
                {archivedMembers.length}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Archived members are hidden from the member list. Restore to make them active again, or permanently delete to remove all data.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search archived members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
          {loadingArchived ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Archive className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? "No archived members match your search." : "No archived members."}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((m) => (
                <ArchivedMemberRow
                  key={m.id}
                  member={m}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
