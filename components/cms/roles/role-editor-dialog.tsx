"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Loader2Icon,
  ShieldCheckIcon,
  EyeIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
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
  currentUserPermissions: string[]
  isOwner: boolean
}

export function RoleEditorDialog({
  open,
  onOpenChange,
  role,
  onSave,
  currentUserPermissions,
  isOwner,
}: RoleEditorDialogProps) {
  const isEditing = !!role
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [color, setColor] = useState("gray")
  const [isSaving, setIsSaving] = useState(false)

  const currentUserPermSet = useMemo(
    () => new Set(currentUserPermissions),
    [currentUserPermissions],
  )

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name)
        setDescription(role.description ?? "")
        setPermissions(new Set(role.permissions))
        setColor(role.color ?? "gray")
      } else {
        setName("")
        setDescription("")
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

  function togglePermission(perm: string) {
    setPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
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

  function selectAllPermissions() {
    const assignable = ALL_PERMISSIONS.filter(
      (p) => isOwner || currentUserPermSet.has(p),
    )
    setPermissions(new Set(assignable))
  }

  function clearAllPermissions() {
    setPermissions(new Set())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      await onSave({
        name,
        slug,
        description,
        permissions: Array.from(permissions),
        color,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const totalPermissions = ALL_PERMISSIONS.length
  const selectedCount = permissions.size
  const isSystemRole = role?.isSystem ?? false
  const isOwnerRole = role?.slug === "owner"
  const isViewerRole = role?.slug === "viewer"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[90vw] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Configure access and permissions for the ${role?.name} role.`
              : "Create a new role and configure what areas of the CMS it can access."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-5">
          {/* Role details */}
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_160px] gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Name</Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Content Manager"
                  maxLength={100}
                  required
                  disabled={isSystemRole}
                />
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

            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this role can do"
                rows={2}
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-semibold">Permissions</Label>
                <Badge variant="secondary" className="text-xs">
                  {selectedCount} / {totalPermissions}
                </Badge>
              </div>
              {!isSystemRole && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={selectAllPermissions}
                  >
                    Select all
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={clearAllPermissions}
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {/* System role badges */}
            {isOwnerRole && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 mb-3">
                <ShieldCheckIcon className="size-4 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  The <strong>Owner</strong> role has full access to everything and cannot be modified.
                </p>
              </div>
            )}
            {isViewerRole && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 mb-3">
                <EyeIcon className="size-4 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  The <strong>Viewer</strong> role has read-only access and cannot be modified.
                </p>
              </div>
            )}

            {/* Permission groups */}
            {!isSystemRole && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                  const assignable = group.permissions.filter(
                    (p) => isOwner || currentUserPermSet.has(p),
                  )
                  const checkedCount = group.permissions.filter((p) =>
                    permissions.has(p),
                  ).length
                  const allAssignableChecked =
                    assignable.length > 0 &&
                    assignable.every((p) => permissions.has(p))

                  return (
                    <div
                      key={groupKey}
                      className="rounded-lg border"
                    >
                      {/* Group header with toggle-all */}
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={allAssignableChecked}
                            onCheckedChange={() =>
                              toggleGroup(group.permissions, allAssignableChecked)
                            }
                          />
                          <div>
                            <p className="text-sm font-medium">{group.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {group.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {checkedCount} / {group.permissions.length}
                        </Badge>
                      </div>

                      {/* Individual permissions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0">
                        {group.permissions.map((perm, idx) => {
                          const canAssign = isOwner || currentUserPermSet.has(perm)
                          const isChecked = permissions.has(perm)
                          return (
                            <label
                              key={perm}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors ${
                                idx % 2 === 0 ? "sm:border-r" : ""
                              } ${idx >= 2 ? "border-t sm:border-t" : ""}`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => togglePermission(perm)}
                                disabled={!canAssign}
                              />
                              <span
                                className={`text-sm ${
                                  canAssign
                                    ? isChecked
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                    : "text-muted-foreground/50"
                                }`}
                              >
                                {PERMISSIONS[perm]}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0">
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
