"use client"

import { useState } from "react"
import Link from "next/link"
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, UserPlus, Trash2, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SortableHeader } from "@/components/ui/sortable-header"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { MemberPerson } from "@/lib/members-context"

export const membershipStatusDisplay: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" }> = {
  VISITOR: { label: "Visitor", variant: "secondary" },
  REGULAR_ATTENDEE: { label: "Regular", variant: "outline" },
  MEMBER: { label: "Member", variant: "default" },
  INACTIVE: { label: "Inactive", variant: "destructive" },
  ARCHIVED: { label: "Archived", variant: "outline" },
}

function formatDate(isoStr: string) {
  const date = new Date(isoStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function MemberActionsCell({
  row,
  onDelete,
}: {
  row: { original: MemberPerson }
  onDelete?: (id: string) => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/cms/people/members/${row.original.id}`}>
              <Pencil />
              View Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <UserPlus />
            Add to Group
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            <Trash2 />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Archive member?</AlertDialogTitle>
            <AlertDialogDescription>
              {row.original.firstName} {row.original.lastName} will be archived. You can restore them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete?.(row.original.id)}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface CreateColumnsOptions {
  onDelete?: (id: string) => void
}

export function createColumns(options?: CreateColumnsOptions): ColumnDef<MemberPerson>[] {
  const onDelete = options?.onDelete

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: "lastName",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const person = row.original
        const displayName = person.preferredName
          ? `${person.preferredName} ${person.lastName}`
          : `${person.firstName} ${person.lastName}`
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar size="sm">
              {person.photoUrl && <AvatarImage src={person.photoUrl} alt={displayName} />}
              <AvatarFallback>{getInitials(person.firstName, person.lastName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium truncate">{displayName}</div>
              {person.preferredName && (
                <div className="text-muted-foreground text-xs truncate">
                  {person.firstName} {person.lastName}
                </div>
              )}
            </div>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const a = `${rowA.original.lastName} ${rowA.original.firstName}`.toLowerCase()
        const b = `${rowB.original.lastName} ${rowB.original.firstName}`.toLowerCase()
        return a.localeCompare(b)
      },
      size: 220,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortableHeader column={column}>Email</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm truncate block max-w-[200px]">
          {row.original.email ?? <span className="text-muted-foreground">--</span>}
        </span>
      ),
      size: 200,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.phone ?? <span className="text-muted-foreground">--</span>}
        </span>
      ),
      enableSorting: false,
      size: 130,
    },
    {
      accessorKey: "membershipStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.membershipStatus
        const config = membershipStatusDisplay[status] ?? { label: status, variant: "outline" as const }
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        )
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id))
      },
      size: 110,
    },
    {
      id: "households",
      header: "Household",
      cell: ({ row }) => {
        const households = row.original.households
        if (households.length === 0) return <span className="text-muted-foreground text-sm">--</span>
        return (
          <span className="text-sm truncate block max-w-[140px]">
            {households[0].name}
          </span>
        )
      },
      enableSorting: false,
      size: 140,
    },
    {
      id: "groups",
      header: "Groups",
      cell: ({ row }) => {
        const groups = row.original.groups
        if (groups.length === 0) return <span className="text-muted-foreground text-sm">--</span>
        return (
          <Badge variant="secondary" className="text-xs">
            {groups.length} {groups.length === 1 ? "group" : "groups"}
          </Badge>
        )
      },
      filterFn: (row, _id, value: string[]) => {
        return row.original.groups.some((g) => value.includes(g.id))
      },
      enableSorting: false,
      size: 100,
    },
    {
      id: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const roles = row.original.roles
        if (roles.length === 0) return <span className="text-muted-foreground text-sm">--</span>
        return (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 2).map((r) => (
              <Badge key={r.id} variant="outline" className="text-[10px] h-4">
                {r.name}
              </Badge>
            ))}
            {roles.length > 2 && (
              <Badge variant="outline" className="text-[10px] h-4">
                +{roles.length - 2}
              </Badge>
            )}
          </div>
        )
      },
      enableSorting: false,
      size: 140,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Date Added</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm">{formatDate(row.original.createdAt)}</span>
      ),
      size: 130,
    },
    {
      id: "actions",
      cell: ({ row }) => <MemberActionsCell row={row} onDelete={onDelete} />,
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ]
}
