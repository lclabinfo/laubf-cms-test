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

const COLOR_DOT: Record<string, string> = {
  gray: "bg-gray-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  teal: "bg-teal-500",
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
  const isOwner = session.rolePriority >= 1000

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
      priority: 100,
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
            Control what each team member can access and modify in the CMS.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleCreate} className="shrink-0">
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        )}
      </div>

      {/* Roles List */}
      <div className="rounded-xl border divide-y">
        {roles.map((role) => {
          const isOwnerRole = role.slug === "owner"
          const dotColor = COLOR_DOT[role.color ?? "gray"] ?? COLOR_DOT.gray
          const canEditThis = isOwner || role.priority < session.rolePriority
          const canDelete = !role.isSystem && canEditThis

          return (
            <div
              key={role.id}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => {
                if (canManage && (isOwner || role.priority < session.rolePriority)) {
                  handleEdit(role)
                }
              }}
            >
              {/* Color dot + icon */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`size-2.5 rounded-full ${dotColor}`} />
                {isOwnerRole ? (
                  <CrownIcon className="size-4 text-primary" />
                ) : (
                  <ShieldIcon className="size-4 text-muted-foreground" />
                )}
              </div>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{role.name}</span>
                  {role.isSystem && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 h-4 font-normal"
                    >
                      System
                    </Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {role.description}
                  </p>
                )}
              </div>

              {/* Members count */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 w-24">
                <UsersIcon className="size-3.5" />
                <span>
                  {role._count.members}{" "}
                  {role._count.members === 1 ? "member" : "members"}
                </span>
              </div>

              {/* Permissions count */}
              <div className="hidden md:flex items-center text-xs text-muted-foreground shrink-0 w-28">
                {role.permissions.length === Object.keys(PERMISSIONS).length
                  ? "Full access"
                  : `${role.permissions.length} permissions`}
              </div>

              {/* Actions */}
              {canManage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canEditThis && (
                      <DropdownMenuItem onSelect={() => handleEdit(role)}>
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onSelect={() => handleDuplicate(role)}>
                      <CopyIcon className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => handleDeleteClick(role)}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="w-8 shrink-0" />
              )}
            </div>
          )
        })}
        {roles.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No roles found.
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <RoleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        role={editingRole}
        onSave={handleSave}
        currentUserPermissions={session.permissions}
        isOwner={isOwner}
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

// Need to import PERMISSIONS for the "Full access" check
import { PERMISSIONS } from "@/lib/permissions"

export default function RolesPage() {
  return (
    <RoleGuard requiredPermission="roles.view">
      <div className="pt-5">
        <RolesPageContent />
      </div>
    </RoleGuard>
  )
}
