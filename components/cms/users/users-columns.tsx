"use client"

import { type ColumnDef } from "@tanstack/react-table"
import {
  MoreHorizontalIcon,
  TrashIcon,
  LinkIcon,
  UnlinkIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  Loader2Icon,
  X,
} from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"
import { SortableHeader } from "@/components/ui/sortable-header"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

export interface UserRow {
  id: string // ChurchMember ID
  userId: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"
  status: "ACTIVE" | "INACTIVE" | "PENDING"
  emailVerified: boolean
  joinedAt: string
  invitedAt: string | null
  linkedPersonId: string | null
  linkedPersonName: string | null
}

const ROLE_LEVEL: Record<string, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

const ROLE_DESCRIPTIONS: Record<string, { label: string; description: string }> = {
  OWNER: { label: "Owner", description: "Full access" },
  ADMIN: { label: "Admin", description: "Full content + site management" },
  EDITOR: { label: "Editor", description: "Create and edit content" },
  VIEWER: { label: "Viewer", description: "Read-only access" },
}

export interface CurrentUser {
  id: string // User ID (not ChurchMember ID)
  role: string
}

export interface RoleOption {
  id: string
  name: string
  slug: string
  description: string | null
  priority: number
  isSystem: boolean
}

interface ColumnOptions {
  currentUser: CurrentUser
  roles?: RoleOption[]
  users?: UserRow[]
  onRoleChange: (memberId: string, newRole: string) => void
  onRemove: (memberId: string) => void
  onDeactivate: (memberId: string) => void
  onReactivate: (memberId: string) => void
  onLinkPerson: (memberId: string, personId: string) => void
  onUnlinkPerson: (memberId: string) => void
}

function canModifyUser(currentUser: CurrentUser, targetUser: UserRow): boolean {
  // Can't modify yourself
  if (currentUser.id === targetUser.userId) return false
  // OWNER can modify anyone
  if (currentUser.role === "OWNER") return true
  // Otherwise, can only modify users with lower role level
  const actorLevel = ROLE_LEVEL[currentUser.role] ?? 0
  const targetLevel = ROLE_LEVEL[targetUser.role] ?? 0
  return actorLevel > targetLevel
}

function canAssignRole(currentUser: CurrentUser, newRole: string): boolean {
  if (currentUser.role === "OWNER") return true
  const actorLevel = ROLE_LEVEL[currentUser.role] ?? 0
  const newRoleLevel = ROLE_LEVEL[newRole] ?? 0
  return actorLevel > newRoleLevel
}

export function createUsersColumns(options: ColumnOptions): ColumnDef<UserRow>[] {
  const { currentUser } = options

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
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm">{name}</p>
                {currentUser.id === u.userId && (
                  <Badge variant="outline" className="h-4 text-[10px] px-1.5 py-0 font-normal text-muted-foreground">you</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
          </div>
        )
      },
      size: 280,
    },
    {
      accessorKey: "role",
      header: ({ column }) => <SortableHeader column={column}>Role</SortableHeader>,
      cell: ({ row }) => {
        const u = row.original
        const isSelf = currentUser.id === u.userId
        const canModify = canModifyUser(currentUser, u)
        const disabled = isSelf || !canModify

        // Use dynamic roles if provided, fall back to hardcoded list
        const roleItems = options.roles && options.roles.length > 0
          ? options.roles
              .sort((a, b) => b.priority - a.priority)
              .map((r) => ({
                value: r.slug.toUpperCase(),
                label: r.name,
                description: r.description ?? "",
                canAssign: canAssignRole(currentUser, r.slug.toUpperCase()),
              }))
          : (["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const).map((role) => {
              const info = ROLE_DESCRIPTIONS[role]
              return {
                value: role,
                label: info.label,
                description: info.description,
                canAssign: canAssignRole(currentUser, role),
              }
            })

        return (
          <Select
            value={u.role}
            onValueChange={(value) => options.onRoleChange(u.id, value)}
            disabled={disabled}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <span className="truncate">
                {roleItems.find(r => r.value === u.role)?.label ?? u.role}
              </span>
            </SelectTrigger>
            <SelectContent>
              {roleItems.map((item) => (
                <SelectItem
                  key={item.value}
                  value={item.value}
                  disabled={!item.canAssign}
                  textValue={item.label}
                  className="py-2"
                >
                  <div>
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
      size: 140,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const u = row.original
        switch (u.status) {
          case "ACTIVE":
            return <Badge variant="success" className="text-xs">Active</Badge>
          case "INACTIVE":
            return <Badge variant="secondary" className="text-xs">Inactive</Badge>
          case "PENDING":
            return <Badge variant="warning" className="text-xs">Pending</Badge>
          default:
            return <Badge variant="outline" className="text-xs">{u.status}</Badge>
        }
      },
      size: 110,
    },
    {
      accessorKey: "linkedPersonName",
      header: "Linked Member",
      cell: ({ row }) => {
        const name = row.original.linkedPersonName
        return name ? (
          <span className="text-sm">{name}</span>
        ) : (
          <span className="text-xs text-muted-foreground">&mdash;</span>
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
      cell: ({ row }) => (
        <ActionsCell
          user={row.original}
          currentUser={currentUser}
          allUsers={options.users}
          onRemove={options.onRemove}
          onDeactivate={options.onDeactivate}
          onReactivate={options.onReactivate}
          onLinkPerson={options.onLinkPerson}
          onUnlinkPerson={options.onUnlinkPerson}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
  ]
}

interface ActionsCellProps {
  user: UserRow
  currentUser: CurrentUser
  allUsers?: UserRow[]
  onRemove: (id: string) => void
  onDeactivate: (id: string) => void
  onReactivate: (id: string) => void
  onLinkPerson: (memberId: string, personId: string) => void
  onUnlinkPerson: (memberId: string) => void
}

interface PersonRecord {
  id: string
  firstName: string
  lastName: string
  preferredName?: string | null
  email?: string | null
}

function personDisplayName(p: PersonRecord): string {
  return p.preferredName
    ? `${p.preferredName} ${p.lastName}`
    : `${p.firstName} ${p.lastName}`
}

function personInitials(p: PersonRecord): string {
  const first = (p.preferredName || p.firstName || "").charAt(0)
  const last = (p.lastName || "").charAt(0)
  return `${first}${last}`.toUpperCase()
}

function ActionsCell({
  user,
  currentUser,
  allUsers,
  onRemove,
  onDeactivate,
  onReactivate,
  onLinkPerson,
  onUnlinkPerson,
}: ActionsCellProps) {
  const [removeOpen, setRemoveOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  // Link dialog state
  const [people, setPeople] = useState<PersonRecord[]>([])
  const [peopleLoaded, setPeopleLoaded] = useState(false)
  const [linkSearch, setLinkSearch] = useState("")
  const [selectedPerson, setSelectedPerson] = useState<PersonRecord | null>(null)

  const isSelf = currentUser.id === user.userId
  const canModify = canModifyUser(currentUser, user)
  const isOwner = currentUser.role === "OWNER"
  const isAdmin = currentUser.role === "ADMIN" || isOwner

  // Determine which actions to show
  const showDeactivate = !isSelf && canModify && user.status === "ACTIVE"
  const showReactivate = !isSelf && canModify && user.status === "INACTIVE"
  const showLinkPerson = isAdmin && !user.linkedPersonId
  const showUnlinkPerson = isAdmin && !!user.linkedPersonId
  const showRemove = isOwner && !isSelf

  const hasAnyAction = showDeactivate || showReactivate || showLinkPerson || showUnlinkPerson || showRemove

  if (!hasAnyAction) return null

  // Fetch people when link dialog opens
  useEffect(() => {
    if (!linkOpen) {
      setPeopleLoaded(false)
      setSelectedPerson(null)
      setLinkSearch("")
      return
    }
    let cancelled = false
    fetch("/api/v1/people?pageSize=200")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        if (data.success && data.data) setPeople(data.data)
        setPeopleLoaded(true)
      })
      .catch(() => { if (!cancelled) setPeopleLoaded(true) })
    return () => { cancelled = true }
  }, [linkOpen])

  // Set of person IDs already linked to any user
  const linkedPersonIds = useMemo(() => {
    const ids = new Set<string>()
    if (allUsers) {
      for (const u of allUsers) {
        if (u.linkedPersonId) ids.add(u.linkedPersonId)
      }
    }
    return ids
  }, [allUsers])

  // Filtered people for the command list
  const filteredPeople = useMemo(() => {
    return people.filter((p) => {
      if (!linkSearch.trim()) return true
      const q = linkSearch.toLowerCase()
      const name = personDisplayName(p).toLowerCase()
      return (
        name.includes(q) ||
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
      )
    })
  }, [people, linkSearch])

  const handleLink = async () => {
    if (!selectedPerson) return
    setIsLinking(true)
    try {
      onLinkPerson(user.id, selectedPerson.id)
      setLinkOpen(false)
    } finally {
      setIsLinking(false)
    }
  }

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

          {showLinkPerson && (
            <DropdownMenuItem onSelect={() => setLinkOpen(true)}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Link to Member
            </DropdownMenuItem>
          )}

          {showUnlinkPerson && (
            <DropdownMenuItem onSelect={() => setUnlinkOpen(true)}>
              <UnlinkIcon className="mr-2 h-4 w-4" />
              Unlink Member
            </DropdownMenuItem>
          )}

          {(showLinkPerson || showUnlinkPerson) && (showDeactivate || showReactivate || showRemove) && (
            <DropdownMenuSeparator />
          )}

          {showDeactivate && (
            <DropdownMenuItem onSelect={() => setDeactivateOpen(true)}>
              <PauseCircleIcon className="mr-2 h-4 w-4" />
              Deactivate
            </DropdownMenuItem>
          )}

          {showReactivate && (
            <DropdownMenuItem onSelect={() => onReactivate(user.id)}>
              <PlayCircleIcon className="mr-2 h-4 w-4" />
              Reactivate
            </DropdownMenuItem>
          )}

          {showRemove && (
            <>
              {(showDeactivate || showReactivate) && <DropdownMenuSeparator />}
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setRemoveOpen(true)}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Revoke access
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Revoke access confirmation */}
      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke CMS Access</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{user.firstName} {user.lastName}</strong> ({user.email}) will lose access
              to the CMS. Their member profile in the people directory will not be affected.
              You can re-invite them later to restore access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onRemove(user.id)}
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate confirmation */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate <strong>{user.firstName} {user.lastName}</strong> ({user.email}).
              They will not be able to access the CMS until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDeactivate(user.id)}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unlink confirmation */}
      <AlertDialog open={unlinkOpen} onOpenChange={setUnlinkOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will unlink <strong>{user.linkedPersonName}</strong> from the user
              account <strong>{user.email}</strong>. The member record will remain in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => onUnlinkPerson(user.id)}>
              Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link to Member dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Link to Member</DialogTitle>
            <DialogDescription>
              Link <strong>{user.firstName} {user.lastName}</strong> ({user.email}) to an
              existing member record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select a member</Label>
            {selectedPerson ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {personInitials(selectedPerson)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {personDisplayName(selectedPerson)}
                  </p>
                  {selectedPerson.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedPerson.email}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setSelectedPerson(null)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Command shouldFilter={false} className="h-auto rounded-lg border">
                <CommandInput
                  placeholder="Search by name or email..."
                  value={linkSearch}
                  onValueChange={setLinkSearch}
                />
                <CommandList className="h-[200px]">
                  {!peopleLoaded ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No members found.</CommandEmpty>
                      {filteredPeople.length > 0 && (
                        <CommandGroup>
                          {filteredPeople.map((p) => {
                            const isLinked = linkedPersonIds.has(p.id)
                            return (
                              <CommandItem
                                key={p.id}
                                value={personDisplayName(p)}
                                onSelect={() => {
                                  if (!isLinked) {
                                    setSelectedPerson(p)
                                    setLinkSearch("")
                                  }
                                }}
                                disabled={isLinked}
                                className={isLinked ? "opacity-50" : ""}
                              >
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                  {personInitials(p)}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="truncate text-sm">
                                    {personDisplayName(p)}
                                  </span>
                                  {p.email && (
                                    <span className="text-xs text-muted-foreground truncate">
                                      {p.email}
                                    </span>
                                  )}
                                </div>
                                {isLinked && (
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    Already linked
                                  </span>
                                )}
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={isLinking || !selectedPerson}>
              {isLinking ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                "Link Member"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
