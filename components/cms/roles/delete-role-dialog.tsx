"use client"

import { useState } from "react"
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RoleInfo {
  id: string
  name: string
  _count: { members: number }
}

interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: RoleInfo
  availableRoles: RoleInfo[]
  onDelete: (roleId: string, fallbackRoleId: string) => Promise<void>
}

export function DeleteRoleDialog({
  open,
  onOpenChange,
  role,
  availableRoles,
  onDelete,
}: DeleteRoleDialogProps) {
  const [fallbackRoleId, setFallbackRoleId] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const memberCount = role._count.members
  const otherRoles = availableRoles.filter((r) => r.id !== role.id)

  async function handleDelete() {
    if (memberCount > 0 && !fallbackRoleId) return
    setIsDeleting(true)
    try {
      // Even if no members, API requires fallbackRoleId, so pick the first other role
      const fbId = fallbackRoleId || otherRoles[0]?.id
      if (!fbId) return
      await onDelete(role.id, fbId)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setFallbackRoleId("")
        }
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Delete Role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the{" "}
            <strong>{role.name}</strong> role? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {memberCount > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>{memberCount}</strong>{" "}
              {memberCount === 1 ? "member has" : "members have"} this role.
              Choose a role to reassign them to:
            </p>
            <div className="space-y-2">
              <Label htmlFor="fallback-role">Reassign to</Label>
              <Select value={fallbackRoleId} onValueChange={setFallbackRoleId}>
                <SelectTrigger id="fallback-role">
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {otherRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {memberCount === 0 && (
          <p className="text-sm text-muted-foreground">
            No members currently have this role.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || (memberCount > 0 && !fallbackRoleId)}
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
