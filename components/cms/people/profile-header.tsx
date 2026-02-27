"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Mail,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArchiveMemberDialog } from "./archive-member-dialog"
import type { PersonDetail } from "./types"

const statusVariant: Record<string, "info" | "warning" | "success" | "secondary" | "destructive"> = {
  VISITOR: "info",
  REGULAR_ATTENDEE: "warning",
  MEMBER: "success",
  INACTIVE: "secondary",
  ARCHIVED: "destructive",
}

const statusLabel: Record<string, string> = {
  VISITOR: "Visitor",
  REGULAR_ATTENDEE: "Regular Attendee",
  MEMBER: "Member",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileHeader({ person, onUpdate }: Props) {
  const router = useRouter()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fullName = person.preferredName
    ? `${person.firstName} (${person.preferredName}) ${person.lastName}`
    : `${person.firstName} ${person.lastName}`

  const handleDelete = async () => {
    if (!confirm(`Permanently delete ${person.firstName} ${person.lastName}? This cannot be undone.`)) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/v1/people/${person.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success(`${person.firstName} ${person.lastName} deleted`)
      router.push("/cms/people/members")
    } catch {
      toast.error("Failed to delete member")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-card border rounded-lg p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {person.photoUrl && (
                <AvatarImage src={person.photoUrl} alt={fullName} />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(person.firstName, person.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold">{fullName}</h2>
                <Badge
                  variant={statusVariant[person.membershipStatus] ?? "secondary"}
                  aria-label={`Membership status: ${statusLabel[person.membershipStatus]}`}
                >
                  {statusLabel[person.membershipStatus] ?? person.membershipStatus}
                </Badge>
              </div>
              {person.title && (
                <p className="text-muted-foreground text-sm mt-0.5">{person.title}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {person.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${person.email}`}>
                  <Mail className="mr-1.5 size-4" />
                  Email
                </a>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setArchiveOpen(true)}>
                  <Archive className="mr-2 size-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete permanently
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ArchiveMemberDialog
        person={person}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        onArchived={onUpdate}
      />
    </>
  )
}
