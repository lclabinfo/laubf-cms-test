"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import {
  Loader2,
  Plus,
  Lock,
  Pencil,
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  TriangleAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CreateRoleDialog } from "@/components/cms/people/create-role-dialog"
import { EditRoleDialog, type EditRoleData } from "@/components/cms/people/edit-role-dialog"

interface RoleAssignment {
  id: string
  person: {
    id: string
    firstName: string
    lastName: string
    preferredName: string | null
    photoUrl: string | null
    email: string | null
  }
  title: string | null
}

interface RoleDefinition {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  color: string | null
  icon: string | null
  sortOrder: number
  assignments: RoleAssignment[]
}

export function RolesView() {
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editRole, setEditRole] = useState<EditRoleData | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RoleDefinition | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/roles")
      const json = await res.json()
      if (json.success) {
        setRoles(json.data)
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/v1/roles/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Role deleted", {
          description: `"${deleteTarget.name}" has been deleted.`,
        })
        fetchRoles()
      } else {
        toast.error(json.error?.message || "Failed to delete role")
      }
    } catch {
      toast.error("Failed to delete role")
    } finally {
      setDeleteOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleEditClick = (role: RoleDefinition) => {
    setEditRole({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      color: role.color,
      icon: role.icon,
      isSystem: role.isSystem,
    })
    setEditOpen(true)
  }

  const systemRoles = roles.filter((r) => r.isSystem)
  const customRoles = roles.filter((r) => !r.isSystem)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Roles</h1>
          <p className="text-muted-foreground text-sm">
            {roles.length} {roles.length === 1 ? "role" : "roles"} &middot;{" "}
            {systemRoles.length} system, {customRoles.length} custom
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          <span className="hidden sm:inline">Create Role</span>
        </Button>
      </div>

      {/* All roles as a flat list — clean rows, no section headers */}
      <div className="rounded-xl border divide-y">
        {roles.map((role) => (
          <RoleRow
            key={role.id}
            role={role}
            expanded={expandedId === role.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === role.id ? null : role.id))
            }
            onEdit={() => handleEditClick(role)}
            onDelete={
              role.isSystem
                ? undefined
                : () => {
                    setDeleteTarget(role)
                    setDeleteOpen(true)
                  }
            }
          />
        ))}
        {roles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="size-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-sm font-medium">No roles defined</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              Create your first role to organize members.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus />
              Create Role
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchRoles}
      />
      <EditRoleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        role={editRole}
        onUpdated={fetchRoles}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently deleting &ldquo;{deleteTarget?.name}&rdquo; will
              remove all member assignments for this role. This cannot be undone.
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
    </div>
  )
}

function RoleRow({
  role,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  role: RoleDefinition
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: (() => void) | undefined
}) {
  const memberCount = role.assignments.length

  return (
    <Collapsible open={expanded} onOpenChange={() => onToggle()}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Color dot */}
        <span
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: role.color ?? "#6366f1" }}
        />

        {/* Toggle + Name */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 min-w-0 flex-1 text-left group"
          >
            {expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium truncate group-hover:text-foreground">
              {role.name}
            </span>
            {role.isSystem && (
              <Lock className="size-3 text-muted-foreground/60 shrink-0" />
            )}
            {role.description && !expanded && (
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                &mdash; {role.description}
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        {/* Member count badge */}
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {memberCount}
        </Badge>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="size-3.5" />
            <span className="sr-only">Edit</span>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expanded: member list */}
      <CollapsibleContent>
        <div className="border-t bg-muted/30 px-4 py-3">
          {role.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {role.description}
            </p>
          )}
          {memberCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members assigned to this role.
            </p>
          ) : (
            <div className="space-y-1">
              {role.assignments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2.5 py-1 text-sm"
                >
                  <Avatar size="sm">
                    <AvatarFallback>
                      {a.person.firstName.charAt(0)}
                      {a.person.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {a.person.preferredName
                      ? `${a.person.preferredName} ${a.person.lastName}`
                      : `${a.person.firstName} ${a.person.lastName}`}
                  </span>
                  {a.title && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {a.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
