"use client"

import { useCallback, useEffect, useState } from "react"
import {
  CopyIcon,
  CrownIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
  UsersIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useCmsSession } from "@/components/cms/cms-shell"
import { RoleGuard } from "@/components/cms/role-guard"
import {
  RoleEditorDialog,
  type RoleData,
  type RoleFormData,
} from "@/components/cms/roles/role-editor-dialog"
import { DeleteRoleDialog } from "@/components/cms/roles/delete-role-dialog"

interface RoleRow {
  id: string
  name: string
  slug: string
  description: string | null
  priority: number
  isSystem: boolean
  permissions: string[]
  color: string | null
  _count: { members: number }
}

const COLOR_MAP: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300",
}

function RolesPageContent() {
  const session = useCmsSession()
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog state
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleData | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingRole, setDeletingRole] = useState<RoleRow | null>(null)

  const canManage = session.permissions.includes("roles.manage")

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/member-roles")
      const data = await res.json()
      if (data.success) {
        setRoles(data.data)
      }
    } catch {
      toast.error("Failed to load roles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  function handleCreate() {
    setEditingRole(undefined)
    setEditorOpen(true)
  }

  function handleEdit(role: RoleRow) {
    setEditingRole({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      priority: role.priority,
      permissions: role.permissions,
      color: role.color,
      isSystem: role.isSystem,
    })
    setEditorOpen(true)
  }

  function handleDuplicate(role: RoleRow) {
    setEditingRole({
      id: "", // empty = create mode
      name: `Copy of ${role.name}`,
      slug: "",
      description: role.description,
      priority: Math.min(role.priority, session.rolePriority - 1),
      permissions: role.permissions,
      color: role.color,
      isSystem: false,
    })
    setEditorOpen(true)
  }

  function handleDeleteClick(role: RoleRow) {
    setDeletingRole(role)
    setDeleteOpen(true)
  }

  async function handleSave(data: RoleFormData) {
    const isEdit = editingRole?.id
    const url = isEdit
      ? `/api/v1/member-roles/${editingRole.id}`
      : "/api/v1/member-roles"
    const method = isEdit ? "PATCH" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(
          result.error?.message ||
            `Failed to ${isEdit ? "update" : "create"} role`,
        )
        return
      }
      toast.success(isEdit ? "Role updated" : "Role created")
      setEditorOpen(false)
      fetchRoles()
    } catch {
      toast.error(`Failed to ${isEdit ? "update" : "create"} role`)
    }
  }

  async function handleDelete(roleId: string, fallbackRoleId: string) {
    try {
      const res = await fetch(`/api/v1/member-roles/${roleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fallbackRoleId }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error?.message || "Failed to delete role")
        return
      }
      toast.success("Role deleted")
      setDeleteOpen(false)
      setDeletingRole(null)
      fetchRoles()
    } catch {
      toast.error("Failed to delete role")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold tracking-tight">
              Roles &amp; Permissions
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the roles and permission levels for your team.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreate} className="shrink-0">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        )}
      </div>

      {/* Role Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const isOwnerRole = role.slug === "owner"
          const colorClasses =
            COLOR_MAP[role.color ?? "gray"] ?? COLOR_MAP.gray

          return (
            <Card
              key={role.id}
              className={isOwnerRole ? "ring-2 ring-primary/30" : ""}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  {isOwnerRole ? (
                    <CrownIcon className="h-4 w-4 text-primary" />
                  ) : (
                    <ShieldIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="flex-1">{role.name}</CardTitle>
                  <div className="flex items-center gap-1.5">
                    {role.isSystem && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 h-5"
                      >
                        System
                      </Badge>
                    )}
                    <Badge
                      className={`text-[10px] px-1.5 h-5 border-0 ${colorClasses}`}
                    >
                      {role.priority}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {role.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UsersIcon className="h-3.5 w-3.5" />
                    <span>
                      {role._count.members}{" "}
                      {role._count.members === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {role.permissions.length} permissions
                  </div>
                </div>
              </CardContent>
              {canManage && (
                <div className="px-4 pb-3 flex justify-end">
                  <RoleActions
                    role={role}
                    currentUserPriority={session.rolePriority}
                    onEdit={() => handleEdit(role)}
                    onDuplicate={() => handleDuplicate(role)}
                    onDelete={() => handleDeleteClick(role)}
                  />
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Editor Dialog */}
      <RoleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        role={editingRole}
        onSave={handleSave}
        currentUserPriority={session.rolePriority}
        currentUserPermissions={session.permissions}
      />

      {/* Delete Dialog */}
      {deletingRole && (
        <DeleteRoleDialog
          open={deleteOpen}
          onOpenChange={(v) => {
            setDeleteOpen(v)
            if (!v) setDeletingRole(null)
          }}
          role={deletingRole}
          availableRoles={roles}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

interface RoleActionsProps {
  role: RoleRow
  currentUserPriority: number
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}

function RoleActions({
  role,
  currentUserPriority,
  onEdit,
  onDuplicate,
  onDelete,
}: RoleActionsProps) {
  const isOwner = currentUserPriority >= 1000
  const canEditThis = isOwner || role.priority < currentUserPriority
  const canDelete = !role.isSystem && canEditThis

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEditThis && (
          <DropdownMenuItem onSelect={onEdit}>
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={onDuplicate}>
          <CopyIcon className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={onDelete}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function RolesPage() {
  return (
    <RoleGuard requiredPermission="roles.view">
      <div className="pt-5">
        <RolesPageContent />
      </div>
    </RoleGuard>
  )
}
