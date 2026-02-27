"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Loader2,
  Search,
  List,
  LayoutGrid,
  Plus,
  Users,
  MapPin,
  Calendar,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import { SortableHeader } from "@/components/ui/sortable-header"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { DataTable } from "@/components/ui/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useGroups, type GroupData } from "@/lib/groups-context"
import { groupTypeDisplay, groupTypeBadgeVariant, groupStatusDisplay } from "@/lib/groups-data"
import { CreateGroupDialog } from "@/components/cms/people/create-group-dialog"
import type { GroupType, GroupStatus } from "@/lib/generated/prisma/client"

const coreRowModel = getCoreRowModel()
const filteredRowModel = getFilteredRowModel()
const paginationRowModel = getPaginationRowModel()
const sortedRowModel = getSortedRowModel()

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

function getLeaders(group: GroupData) {
  return group.members.filter((m) => m.role === "LEADER" || m.role === "CO_LEADER")
}

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// --- Row Actions Cell ---
function GroupActionsCell({ group }: { group: GroupData }) {
  const { archiveGroup, deleteGroup } = useGroups()
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const handleArchive = async () => {
    const ok = await archiveGroup(group.id)
    if (ok) {
      toast.success("Group archived", {
        description: `"${group.name}" has been archived.`,
        action: { label: "Undo", onClick: () => {} },
      })
    } else {
      toast.error("Failed to archive group")
    }
  }

  const handleDelete = async () => {
    const ok = await deleteGroup(group.id)
    if (ok) {
      toast.success("Group deleted permanently", {
        description: `"${group.name}" has been deleted.`,
      })
    } else {
      toast.error("Failed to delete group")
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
            <Link href={`/cms/people/groups/${group.id}`}>
              <Pencil />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {group.status !== "ARCHIVED" && (
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                setArchiveOpen(true)
              }}
            >
              <Archive />
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onSelect={(e) => {
              e.preventDefault()
              setDeleteOpen(true)
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/15">
              <Archive className="text-warning" />
            </AlertDialogMedia>
            <AlertDialogTitle>Archive group?</AlertDialogTitle>
            <AlertDialogDescription>
              Archiving will hide &ldquo;{group.name}&rdquo; from active lists. Members will be preserved. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently deleting &ldquo;{group.name}&rdquo; will remove all member associations. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// --- Table Columns ---
function createColumns(): ColumnDef<GroupData>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const group = row.original
        return (
          <div className="min-w-0">
            <div className="font-medium truncate">{group.name}</div>
            {group.description && (
              <div className="text-muted-foreground text-xs truncate max-w-[250px]">
                {group.description}
              </div>
            )}
          </div>
        )
      },
      size: 260,
    },
    {
      accessorKey: "groupType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={groupTypeBadgeVariant[row.original.groupType]}>
          {groupTypeDisplay[row.original.groupType]}
        </Badge>
      ),
      filterFn: (row, _id, value: string) => {
        if (!value || value === "ALL") return true
        return row.original.groupType === value
      },
      enableSorting: false,
      size: 130,
    },
    {
      id: "members",
      header: "Members",
      cell: ({ row }) => {
        const count = row.original.members.length
        return (
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-sm">{count}</span>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => rowA.original.members.length - rowB.original.members.length,
      size: 90,
    },
    {
      id: "leaders",
      header: "Leaders",
      cell: ({ row }) => {
        const leaders = getLeaders(row.original)
        if (leaders.length === 0) return <span className="text-muted-foreground text-sm">--</span>
        return (
          <span className="text-sm truncate block max-w-[150px]">
            {leaders.map((l) => `${l.person.firstName} ${l.person.lastName}`).join(", ")}
          </span>
        )
      },
      enableSorting: false,
      size: 160,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const config = groupStatusDisplay[row.original.status]
        return <Badge variant={config.variant}>{config.label}</Badge>
      },
      filterFn: (row, _id, value: string) => {
        if (!value || value === "ALL") return true
        return row.original.status === value
      },
      size: 100,
    },
    {
      accessorKey: "meetingSchedule",
      header: "Schedule",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.meetingSchedule ?? <span className="text-muted-foreground">--</span>}
        </span>
      ),
      enableSorting: false,
      size: 130,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Created</SortableHeader>
      ),
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAt)}</span>,
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => <GroupActionsCell group={row.original} />,
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ]
}

// --- Grid Card ---
function GroupCard({ group }: { group: GroupData }) {
  const leaders = getLeaders(group)
  const statusConfig = groupStatusDisplay[group.status]

  return (
    <Link href={`/cms/people/groups/${group.id}`} className="block group/card">
      <Card className="h-full hover:ring-foreground/20 transition-all">
        <CardContent className="space-y-3">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-snug line-clamp-1">{group.name}</h3>
              <Badge variant={groupTypeBadgeVariant[group.groupType]} className="mt-1">
                {groupTypeDisplay[group.groupType]}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className={`size-2 rounded-full ${
                  group.status === "ACTIVE"
                    ? "bg-success"
                    : group.status === "INACTIVE"
                      ? "bg-muted-foreground"
                      : "bg-destructive"
                }`}
                aria-label={statusConfig.label}
              />
              <span className="text-xs text-muted-foreground">{statusConfig.label}</span>
            </div>
          </div>

          {/* Description */}
          {group.description && (
            <p className="text-muted-foreground text-xs line-clamp-2">{group.description}</p>
          )}

          {/* Member count + Avatar stack */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {group.members.length > 0 ? (
                <AvatarGroup>
                  {group.members.slice(0, 4).map((m) => (
                    <Avatar key={m.id} size="sm">
                      {m.person.photoUrl && <AvatarImage src={m.person.photoUrl} alt={`${m.person.firstName} ${m.person.lastName}`} />}
                      <AvatarFallback>{getInitials(m.person.firstName, m.person.lastName)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {group.members.length > 4 && (
                    <AvatarGroupCount>+{group.members.length - 4}</AvatarGroupCount>
                  )}
                </AvatarGroup>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {group.members.length} {group.members.length === 1 ? "member" : "members"}
              </span>
            </div>
          </div>

          {/* Leaders */}
          {leaders.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {leaders.length === 1 ? "Leader" : "Leaders"}:
              </span>{" "}
              {leaders.map((l) => `${l.person.firstName} ${l.person.lastName}`).join(", ")}
            </div>
          )}

          {/* Meeting schedule */}
          {group.meetingSchedule && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3 shrink-0" />
              <span className="truncate">{group.meetingSchedule}</span>
            </div>
          )}
          {group.meetingLocation && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{group.meetingLocation}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// --- Empty State ---
function EmptyState({ hasSearch, onCreateClick }: { hasSearch: boolean; onCreateClick: () => void }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Search className="size-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-medium">No groups match your search</h3>
        <p className="text-muted-foreground text-xs mt-1 max-w-xs">
          Try a different search term or adjust your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users className="size-10 text-muted-foreground/50 mb-3" />
      <h3 className="text-sm font-medium">Create your first group</h3>
      <p className="text-muted-foreground text-xs mt-1 max-w-xs">
        Organize your congregation into groups for better ministry management.
      </p>
      <Button className="mt-4" onClick={onCreateClick}>
        <Plus />
        Create Group
      </Button>
    </div>
  )
}

// --- Main Component ---
export function GroupsView() {
  const router = useRouter()
  const { groups, loading } = useGroups()
  const [view, setView] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<GroupType | "ALL">("ALL")
  const [statusFilter, setStatusFilter] = useState<GroupStatus | "ALL">("ACTIVE")
  const [sortBy, setSortBy] = useState<"name" | "newest" | "members">("name")
  const [createOpen, setCreateOpen] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })

  const columns = useMemo(() => createColumns(), [])

  // Filter and sort
  const filteredGroups = useMemo(() => {
    let result = groups

    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(s) ||
          (g.description?.toLowerCase().includes(s) ?? false)
      )
    }
    if (typeFilter !== "ALL") {
      result = result.filter((g) => g.groupType === typeFilter)
    }
    if (statusFilter !== "ALL") {
      result = result.filter((g) => g.status === statusFilter)
    }

    // Sort
    switch (sortBy) {
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        break
      case "newest":
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case "members":
        result = [...result].sort((a, b) => b.members.length - a.members.length)
        break
    }

    return result
  }, [groups, search, typeFilter, statusFilter, sortBy])

  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: filteredGroups,
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

  const totalMembers = useMemo(() => {
    const seen = new Set<string>()
    for (const g of groups) {
      for (const m of g.members) {
        seen.add(m.personId)
      }
    }
    return seen.size
  }, [groups])

  const hasFilters = search !== "" || typeFilter !== "ALL" || statusFilter !== "ACTIVE"

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Groups</h1>
          <p className="text-muted-foreground text-sm">
            {groups.length} {groups.length === 1 ? "group" : "groups"} &middot; {totalMembers} total {totalMembers === 1 ? "member" : "members"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          <span className="hidden sm:inline">Create Group</span>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 min-h-[38px]">
        {/* Search */}
        <div className="relative w-full sm:w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
            className="pl-8"
          />
        </div>

        {/* Type filter */}
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v as GroupType | "ALL")
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="SMALL_GROUP">Small Group</SelectItem>
            <SelectItem value="SERVING_TEAM">Serving Team</SelectItem>
            <SelectItem value="MINISTRY">Ministry</SelectItem>
            <SelectItem value="CLASS">Class</SelectItem>
            <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as GroupStatus | "ALL")
            setPagination((prev) => ({ ...prev, pageIndex: 0 }))
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger>
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="members">Most Members</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center rounded-md border">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-r-none"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-sm"
            className="rounded-l-none"
            onClick={() => setView("list")}
            aria-label="List view"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <EmptyState hasSearch={hasFilters} onCreateClick={() => setCreateOpen(true)} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          table={table}
          onRowClick={(row) => router.push(`/cms/people/groups/${row.id}`)}
        />
      )}

      {/* Create Dialog */}
      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
