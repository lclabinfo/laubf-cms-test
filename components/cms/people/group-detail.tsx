"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Users,
  Plus,
  MapPin,
  Calendar,
  Settings,
  Loader2,
  MoreHorizontal,
  ArrowUpDown,
  Search,
  UserMinus,
  Shield,
  TriangleAlert,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable } from "@/components/ui/data-table"
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
import { useGroups, type GroupMember } from "@/lib/groups-context"
import {
  groupTypeDisplay,
  groupTypeBadgeVariant,
  groupStatusDisplay,
  groupMemberRoleDisplay,
  groupMemberRoleBadgeVariant,
} from "@/lib/groups-data"
import { AddGroupMembersDialog } from "@/components/cms/people/add-group-members-dialog"
import { GroupSettingsDialog } from "@/components/cms/people/group-settings-dialog"
import type { GroupMemberRole } from "@/lib/generated/prisma/client"

const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// --- Member Actions Cell ---
function MemberActionsCell({
  member,
  groupId,
  groupName,
}: {
  member: GroupMember
  groupId: string
  groupName: string
}) {
  const { removeMember, refresh } = useGroups()
  const [removeOpen, setRemoveOpen] = useState(false)

  const handleRemove = async () => {
    const ok = await removeMember(groupId, member.personId)
    if (ok) {
      toast.success(`${member.person.firstName} ${member.person.lastName} removed from ${groupName}`)
    } else {
      toast.error("Failed to remove member")
    }
  }

  const handleRoleChange = async (newRole: GroupMemberRole) => {
    try {
      // We need to update via the members API. Use a direct fetch since the context
      // doesn't have a per-member role update function.
      const res = await fetch(`/api/v1/person-groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: member.personId }),
      })
      if (!res.ok) throw new Error("Failed to update role")

      // Re-add with new role
      const addRes = await fetch(`/api/v1/person-groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: member.personId, role: newRole }),
      })
      if (!addRes.ok) throw new Error("Failed to update role")

      refresh()
      toast.success(`Role updated to ${groupMemberRoleDisplay[newRole]} for ${member.person.firstName} ${member.person.lastName}`)
    } catch {
      toast.error("Failed to update role")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" data-no-row-click>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/cms/people/members/${member.personId}`}>
              <Users />
              View Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {member.role !== "LEADER" && (
            <DropdownMenuItem onSelect={() => handleRoleChange("LEADER")}>
              <Shield />
              Make Leader
            </DropdownMenuItem>
          )}
          {member.role !== "CO_LEADER" && (
            <DropdownMenuItem onSelect={() => handleRoleChange("CO_LEADER")}>
              <Shield />
              Make Co-Leader
            </DropdownMenuItem>
          )}
          {member.role !== "MEMBER" && (
            <DropdownMenuItem onSelect={() => handleRoleChange("MEMBER")}>
              <Users />
              Make Member
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setRemoveOpen(true)
            }}
          >
            <UserMinus />
            Remove from Group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {member.person.firstName} {member.person.lastName} will be removed from &ldquo;{groupName}&rdquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemove}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- Member Table Columns ---
function createMemberColumns(groupId: string, groupName: string): ColumnDef<GroupMember>[] {
  return [
    {
      id: "name",
      accessorFn: (row) => `${row.person.lastName} ${row.person.firstName}`,
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => {
        const m = row.original
        const name = m.person.preferredName
          ? `${m.person.preferredName} ${m.person.lastName}`
          : `${m.person.firstName} ${m.person.lastName}`
        return (
          <div className="flex items-center gap-3 min-w-0">
            <Avatar size="sm">
              {m.person.photoUrl && <AvatarImage src={m.person.photoUrl} alt={name} />}
              <AvatarFallback>{getInitials(m.person.firstName, m.person.lastName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{name}</div>
              {m.person.preferredName && (
                <div className="text-muted-foreground text-xs truncate">
                  {m.person.firstName} {m.person.lastName}
                </div>
              )}
            </div>
          </div>
        )
      },
      size: 200,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={groupMemberRoleBadgeVariant[row.original.role]}>
          {groupMemberRoleDisplay[row.original.role]}
        </Badge>
      ),
      enableSorting: false,
      size: 100,
    },
    {
      id: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-sm truncate block max-w-[180px]">
          {row.original.person.email ?? <span className="text-muted-foreground">--</span>}
        </span>
      ),
      enableSorting: false,
      size: 180,
    },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.person.phone ?? <span className="text-muted-foreground">--</span>}
        </span>
      ),
      enableSorting: false,
      size: 120,
    },
    {
      accessorKey: "joinedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Joined
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.joinedAt)}</span>,
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <MemberActionsCell member={row.original} groupId={groupId} groupName={groupName} />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ]
}

// --- Main Component ---
interface GroupDetailProps {
  groupId: string
}

export function GroupDetail({ groupId }: GroupDetailProps) {
  const router = useRouter()
  const { groups, loading } = useGroups()
  const [addMembersOpen, setAddMembersOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  const group = useMemo(() => groups.find((g) => g.id === groupId) ?? null, [groups, groupId])

  const columns = useMemo(
    () => (group ? createMemberColumns(group.id, group.name) : []),
    [group]
  )

  const filteredMembers = useMemo(() => {
    if (!group) return []
    if (!memberSearch) return group.members
    const s = memberSearch.toLowerCase()
    return group.members.filter(
      (m) =>
        m.person.firstName.toLowerCase().includes(s) ||
        m.person.lastName.toLowerCase().includes(s) ||
        (m.person.preferredName?.toLowerCase().includes(s) ?? false) ||
        (m.person.email?.toLowerCase().includes(s) ?? false)
    )
  }, [group, memberSearch])

  const table = useReactTable({
    data: filteredMembers,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    getCoreRowModel: coreRowModel,
    getFilteredRowModel: filteredRowModel,
    getPaginationRowModel: paginationRowModel,
    getSortedRowModel: sortedRowModel,
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-sm font-medium">Group not found</h3>
        <p className="text-muted-foreground text-xs mt-1">
          This group may have been deleted or does not exist.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/cms/people/groups">
            <ArrowLeft />
            Back to Groups
          </Link>
        </Button>
      </div>
    )
  }

  const statusConfig = groupStatusDisplay[group.status]
  const leaders = group.members.filter((m) => m.role === "LEADER" || m.role === "CO_LEADER")

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/cms/people/groups">
            <ArrowLeft />
            Back to Groups
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight">{group.name}</h1>
            <Badge variant={groupTypeBadgeVariant[group.groupType]}>
              {groupTypeDisplay[group.groupType]}
            </Badge>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          {group.description && (
            <p className="text-muted-foreground text-sm max-w-xl">{group.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings />
            Settings
          </Button>
          <Button onClick={() => setAddMembersOpen(true)}>
            <Plus />
            Add Members
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-semibold">{group.members.length}</div>
            <div className="text-xs text-muted-foreground">
              {group.capacity ? `of ${group.capacity}` : ""} Members
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-semibold">{leaders.length}</div>
            <div className="text-xs text-muted-foreground">Leaders</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {group.meetingSchedule ?? "No schedule"}
              </div>
              <div className="text-xs text-muted-foreground">Meeting</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <MapPin className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {group.meetingLocation ?? "No location"}
              </div>
              <div className="text-xs text-muted-foreground">Location</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members section */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-medium">Members</h2>
          <Badge variant="secondary">{group.members.length}</Badge>
          <div className="flex-1" />
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value)
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }}
              className="pl-8"
            />
          </div>
          <Button size="sm" onClick={() => setAddMembersOpen(true)}>
            <Plus />
            Add
          </Button>
        </div>

        {group.members.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="size-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-sm font-medium">No members yet</h3>
              <p className="text-muted-foreground text-xs mt-1 max-w-xs">
                This group has no members. Add people to get started.
              </p>
              <Button className="mt-4" onClick={() => setAddMembersOpen(true)}>
                <Plus />
                Add Members
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            columns={columns}
            table={table}
            onRowClick={(row) => router.push(`/cms/people/members/${row.personId}`)}
          />
        )}
      </div>

      {/* Subgroups section */}
      {group.children.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium">Subgroups</h2>
            <Badge variant="secondary">{group.children.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.children.map((child) => (
              <Link key={child.id} href={`/cms/people/groups/${child.id}`} className="block">
                <Card className="hover:ring-foreground/20 transition-all">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Users className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{child.name}</div>
                      <Badge
                        variant={groupTypeBadgeVariant[child.groupType]}
                        className="text-[10px] mt-1"
                      >
                        {groupTypeDisplay[child.groupType]}
                      </Badge>
                    </div>
                    <Badge variant={groupStatusDisplay[child.status].variant} className="shrink-0">
                      {groupStatusDisplay[child.status].label}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddGroupMembersDialog
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        group={group}
      />
      <GroupSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        group={group}
      />
    </div>
  )
}
