"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontalIcon, TrashIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { SortableHeader } from "@/components/ui/sortable-header"
import { useState } from "react"

export interface UserRow {
  id: string // ChurchMember ID
  userId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"
  emailVerified: boolean
  joinedAt: string
  invitedAt: string | null
  linkedPersonId: string | null
  linkedPersonName: string | null
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "default",
  EDITOR: "secondary",
  VIEWER: "outline",
}

const roleLabel: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Editor",
  VIEWER: "Viewer",
}

interface ColumnOptions {
  onRoleChange: (memberId: string, newRole: string) => void
  onRemove: (memberId: string) => void
}

export function createUsersColumns(options: ColumnOptions): ColumnDef<UserRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column}>Name</SortableHeader>,
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      cell: ({ row }) => {
        const u = row.original
        const name = `${u.firstName} ${u.lastName}`.trim() || u.email
        const initials = name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={name} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{name}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
          </div>
        )
      },
      size: 260,
    },
    {
      accessorKey: "role",
      header: ({ column }) => <SortableHeader column={column}>Role</SortableHeader>,
      cell: ({ row }) => {
        const u = row.original
        return (
          <Select
            value={u.role}
            onValueChange={(value) => options.onRoleChange(u.id, value)}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
        )
      },
      size: 130,
    },
    {
      accessorKey: "emailVerified",
      header: "Status",
      cell: ({ row }) => {
        const u = row.original
        if (!u.firstName && !u.lastName) {
          return <Badge variant="outline" className="text-xs">Pending Invite</Badge>
        }
        if (!u.emailVerified) {
          return <Badge variant="secondary" className="text-xs">Unverified</Badge>
        }
        return <Badge variant="default" className="bg-green-600 text-xs">Active</Badge>
      },
      size: 120,
    },
    {
      accessorKey: "linkedPersonName",
      header: "Linked Member",
      cell: ({ row }) => {
        const name = row.original.linkedPersonName
        return name ? (
          <span className="text-sm">{name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      },
      size: 160,
    },
    {
      accessorKey: "joinedAt",
      header: ({ column }) => <SortableHeader column={column}>Joined</SortableHeader>,
      cell: ({ row }) => {
        const date = new Date(row.original.joinedAt)
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        )
      },
      size: 100,
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionsCell user={row.original} onRemove={options.onRemove} />,
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ]
}

function ActionsCell({ user, onRemove }: { user: UserRow; onRemove: (id: string) => void }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Remove from church
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{user.firstName} {user.lastName}</strong> ({user.email})
              from this church. They will lose all CMS access. This action can be undone by
              re-inviting them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onRemove(user.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
