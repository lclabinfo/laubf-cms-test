"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Loader2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  type Permission,
} from "@/lib/permissions"

const ROLE_COLORS = [
  { value: "gray", label: "Gray" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "pink", label: "Pink" },
  { value: "teal", label: "Teal" },
] as const

export interface RoleFormData {
  name: string
  slug: string
  description: string
  priority: number
  permissions: string[]
  color: string
}

export interface RoleData {
  id: string
  name: string
  slug: string
  description: string | null
  priority: number
  permissions: string[]
  color: string | null
  isSystem: boolean
}

interface RoleEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleData
  onSave: (data: RoleFormData) => Promise<void>
  currentUserPriority: number
  currentUserPermissions: string[]
}

export function RoleEditorDialog({
  open,
  onOpenChange,
  role,
  onSave,
  currentUserPriority,
  currentUserPermissions,
}: RoleEditorDialogProps) {
  const isEditing = !!role
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState(0)
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [color, setColor] = useState("gray")
  const [isSaving, setIsSaving] = useState(false)

  const currentUserPermSet = useMemo(
    () => new Set(currentUserPermissions),
    [currentUserPermissions],
  )

  // The owner (priority 1000) can assign any permission
  const isOwner = currentUserPriority >= 1000

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name)
        setDescription(role.description ?? "")
        setPriority(role.priority)
        setPermissions(new Set(role.permissions))
        setColor(role.color ?? "gray")
      } else {
        setName("")
        setDescription("")
        setPriority(0)
        setPermissions(new Set())
        setColor("gray")
      }
    }
  }, [open, role])

  const slug = useMemo(
    () =>
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    [name],
  )

  const maxPriority = currentUserPriority - 1

  function togglePermission(perm: string) {
    setPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(perm)) {
        next.delete(perm)
      } else {
        next.add(perm)
      }
      return next
    })
  }

  function toggleGroup(groupPerms: Permission[], allChecked: boolean) {
    setPermissions((prev) => {
      const next = new Set(prev)
      const assignable = groupPerms.filter(
        (p) => isOwner || currentUserPermSet.has(p),
      )
      if (allChecked) {
        assignable.forEach((p) => next.delete(p))
      } else {
        assignable.forEach((p) => next.add(p))
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        name,
        slug,
        description,
        priority,
        permissions: Array.from(permissions),
        color,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the settings and permissions for the ${role?.name} role.`
              : "Define a new role with specific permissions for your team."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Content Manager"
              maxLength={100}
              required
              disabled={role?.isSystem}
            />
            {name && (
              <p className="text-xs text-muted-foreground">
                Slug: <code className="bg-muted px-1 rounded">{slug}</code>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this role do?"
              rows={2}
            />
          </div>

          {/* Priority + Color row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role-priority">Priority</Label>
              <Input
                id="role-priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                min={0}
                max={maxPriority}
                required
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <p className="text-xs text-muted-foreground">
                0&ndash;{maxPriority}. Higher = more authority. Your priority:{" "}
                {currentUserPriority}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-color">Badge Color</Label>
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger id="role-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: c.value === "gray" ? "#6b7280" : c.value }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissions */}
          {!role?.isSystem && (
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="space-y-1 rounded-lg border p-3">
                {Object.entries(PERMISSION_GROUPS).map(
                  ([groupName, groupPerms]) => {
                    const assignablePerms = groupPerms.filter(
                      (p) => isOwner || currentUserPermSet.has(p),
                    )
                    const checkedCount = groupPerms.filter((p) =>
                      permissions.has(p),
                    ).length
                    const allAssignableChecked =
                      assignablePerms.length > 0 &&
                      assignablePerms.every((p) => permissions.has(p))
                    const someChecked = checkedCount > 0

                    return (
                      <PermissionGroup
                        key={groupName}
                        name={groupName}
                        permissions={groupPerms}
                        selectedPermissions={permissions}
                        assignablePermissions={
                          isOwner ? new Set(groupPerms) : currentUserPermSet
                        }
                        allChecked={allAssignableChecked}
                        someChecked={someChecked}
                        checkedCount={checkedCount}
                        totalCount={groupPerms.length}
                        onToggleGroup={() =>
                          toggleGroup(groupPerms, allAssignableChecked)
                        }
                        onTogglePermission={togglePermission}
                      />
                    )
                  },
                )}
              </div>
            </div>
          )}

          {role?.isSystem && (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Permissions for system roles cannot be modified. The{" "}
              <strong>{role.name}</strong> role has{" "}
              {role.permissions.length === Object.keys(PERMISSIONS).length
                ? "all"
                : role.permissions.length}{" "}
              permissions.
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !name.trim()}>
              {isSaving ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface PermissionGroupProps {
  name: string
  permissions: Permission[]
  selectedPermissions: Set<string>
  assignablePermissions: Set<string>
  allChecked: boolean
  someChecked: boolean
  checkedCount: number
  totalCount: number
  onToggleGroup: () => void
  onTogglePermission: (perm: string) => void
}

function PermissionGroup({
  name,
  permissions,
  selectedPermissions,
  assignablePermissions,
  allChecked,
  someChecked,
  checkedCount,
  totalCount,
  onToggleGroup,
  onTogglePermission,
}: PermissionGroupProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
        <Checkbox
          checked={allChecked}
          onCheckedChange={() => onToggleGroup()}
          aria-label={`Select all ${name} permissions`}
          {...(someChecked && !allChecked ? { "data-state": "indeterminate" } : {})}
        />
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex flex-1 items-center gap-1.5 text-sm font-medium"
          >
            {isOpen ? (
              <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {name}
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {checkedCount}/{totalCount}
            </span>
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="ml-8 space-y-1 pb-1">
          {permissions.map((perm) => {
            const canAssign = assignablePermissions.has(perm)
            const isChecked = selectedPermissions.has(perm)
            return (
              <label
                key={perm}
                className="flex items-start gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted/30 cursor-pointer"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onTogglePermission(perm)}
                  disabled={!canAssign}
                  className="mt-0.5"
                />
                <div className="space-y-0">
                  <span className={canAssign ? "" : "text-muted-foreground"}>
                    {PERMISSIONS[perm]}
                  </span>
                  <p className="text-xs text-muted-foreground">{perm}</p>
                </div>
              </label>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
