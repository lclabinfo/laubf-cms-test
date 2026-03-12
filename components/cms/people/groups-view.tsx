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
import { CreateGroupDialog } from "@/components/cms/people/create-group-dialog"
import { EditGroupDialog, type EditGroupData } from "@/components/cms/people/edit-group-dialog"

interface GroupAssignment {
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

interface GroupDefinition {
  id: string
  name: string
  slug: string
  description: string | null
  isSystem: boolean
  color: string | null
  icon: string | null
  sortOrder: number
  assignments: GroupAssignment[]
}

export function GroupsView() {
  const [groups, setGroups] = useState<GroupDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<EditGroupData | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GroupDefinition | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/roles")
      const json = await res.json()
      if (json.success) {
        setGroups(json.data)
      }
    } catch {
      toast.error("Failed to load groups")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/v1/roles/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Group deleted", {
          description: `"${deleteTarget.name}" has been deleted.`,
        })
        fetchGroups()
      } else {
        toast.error(json.error?.message || "Failed to delete group")
      }
    } catch {
      toast.error("Failed to delete group")
    } finally {
      setDeleteOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleEditClick = (group: GroupDefinition) => {
    setEditGroup({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      color: group.color,
      icon: group.icon,
      isSystem: group.isSystem,
    })
    setEditOpen(true)
  }

  const systemGroups = groups.filter((g) => g.isSystem)
  const customGroups = groups.filter((g) => !g.isSystem)

  if (loading) {
    return (
      <div className="pt-5 flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="pt-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Groups</h1>
          <p className="text-muted-foreground text-sm">
            {groups.length} {groups.length === 1 ? "group" : "groups"} &middot;{" "}
            {systemGroups.length} system, {customGroups.length} custom
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          <span className="hidden sm:inline">Create Group</span>
        </Button>
      </div>

      <div className="rounded-xl border divide-y">
        {groups.map((group) => (
          <GroupRow
            key={group.id}
            group={group}
            expanded={expandedId === group.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === group.id ? null : group.id))
            }
            onEdit={() => handleEditClick(group)}
            onDelete={
              group.isSystem
                ? undefined
                : () => {
                    setDeleteTarget(group)
                    setDeleteOpen(true)
                  }
            }
          />
        ))}
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="size-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-sm font-medium">No groups defined</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              Create your first group to organize members.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus />
              Create Group
            </Button>
          </div>
        )}
      </div>

      <CreateGroupDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchGroups}
      />
      <EditGroupDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        group={editGroup}
        onUpdated={fetchGroups}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently deleting &ldquo;{deleteTarget?.name}&rdquo; will
              remove all member assignments for this group. This cannot be undone.
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

function GroupRow({
  group,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  group: GroupDefinition
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: (() => void) | undefined
}) {
  const memberCount = group.assignments.length

  return (
    <Collapsible open={expanded} onOpenChange={() => onToggle()}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: group.color ?? "#6366f1" }}
        />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 min-w-0 flex-1 text-left group/row"
          >
            {expanded ? (
              <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            )}
            <span className="text-sm font-medium truncate group-hover/row:text-foreground">
              {group.name}
            </span>
            {group.isSystem && (
              <Lock className="size-3 text-muted-foreground/60 shrink-0" />
            )}
            {group.description && !expanded && (
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                &mdash; {group.description}
              </span>
            )}
          </button>
        </CollapsibleTrigger>

        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {memberCount}
        </Badge>

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

      <CollapsibleContent>
        <div className="border-t bg-muted/30 px-4 py-3">
          {group.description && (
            <p className="text-sm text-muted-foreground mb-3">
              {group.description}
            </p>
          )}
          {memberCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No members in this group.
            </p>
          ) : (
            <div className="space-y-1">
              {group.assignments.map((a) => (
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
