"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import type { GroupType, GroupStatus } from "@/lib/generated/prisma/client"

interface GroupSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: GroupData
}

type FormState = {
  name: string
  description: string
  groupType: GroupType
  status: GroupStatus
  meetingSchedule: string
  meetingLocation: string
  isOpen: boolean
  capacity: string
}

export function GroupSettingsDialog({ open, onOpenChange, group }: GroupSettingsDialogProps) {
  const router = useRouter()
  const { updateGroup, archiveGroup, deleteGroup } = useGroups()
  const [submitting, setSubmitting] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [form, setForm] = useState<FormState>({
    name: group.name,
    description: group.description ?? "",
    groupType: group.groupType,
    status: group.status,
    meetingSchedule: group.meetingSchedule ?? "",
    meetingLocation: group.meetingLocation ?? "",
    isOpen: group.isOpen,
    capacity: group.capacity?.toString() ?? "",
  })

  // Reset form when group changes
  useEffect(() => {
    if (open) {
      setForm({
        name: group.name,
        description: group.description ?? "",
        groupType: group.groupType,
        status: group.status,
        meetingSchedule: group.meetingSchedule ?? "",
        meetingLocation: group.meetingLocation ?? "",
        isOpen: group.isOpen,
        capacity: group.capacity?.toString() ?? "",
      })
    }
  }, [open, group])

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Group name is required")
      return
    }

    setSubmitting(true)
    try {
      const updated = await updateGroup(group.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        groupType: form.groupType,
        status: form.status,
        meetingSchedule: form.meetingSchedule.trim() || undefined,
        meetingLocation: form.meetingLocation.trim() || undefined,
        isOpen: form.isOpen,
        capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      })
      if (updated) {
        toast.success("Group settings updated")
        onOpenChange(false)
      } else {
        toast.error("Failed to update group")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleArchive = async () => {
    const ok = await archiveGroup(group.id)
    if (ok) {
      toast.success("Group archived", {
        description: `"${group.name}" has been archived.`,
      })
      onOpenChange(false)
      router.push("/cms/people/groups")
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
      onOpenChange(false)
      router.push("/cms/people/groups")
    } else {
      toast.error("Failed to delete group")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>Edit group details and configuration.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Name *</Label>
              <Input
                id="settings-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settings-desc">Description</Label>
              <Textarea
                id="settings-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.groupType}
                  onValueChange={(v) => setForm((f) => ({ ...f, groupType: v as GroupType }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="SMALL_GROUP">Small Group</SelectItem>
                    <SelectItem value="SERVING_TEAM">Serving Team</SelectItem>
                    <SelectItem value="MINISTRY">Ministry</SelectItem>
                    <SelectItem value="CLASS">Class</SelectItem>
                    <SelectItem value="ADMINISTRATIVE">Administrative</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as GroupStatus }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="settings-schedule">Meeting Schedule</Label>
                <Input
                  id="settings-schedule"
                  value={form.meetingSchedule}
                  onChange={(e) => setForm((f) => ({ ...f, meetingSchedule: e.target.value }))}
                  placeholder="e.g., Sundays 9am"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-location">Location</Label>
                <Input
                  id="settings-location"
                  value={form.meetingLocation}
                  onChange={(e) => setForm((f) => ({ ...f, meetingLocation: e.target.value }))}
                  placeholder="e.g., Room 201"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <Label htmlFor="settings-open" className="text-sm">
                  Open enrollment
                </Label>
                <Switch
                  id="settings-open"
                  checked={form.isOpen}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isOpen: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settings-capacity">Capacity</Label>
                <Input
                  id="settings-capacity"
                  type="number"
                  placeholder="No limit"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </div>
            </div>

            <Separator />

            {/* Danger zone */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
              <div className="flex flex-col gap-2">
                {group.status !== "ARCHIVED" && (
                  <div className="flex items-center justify-between rounded-lg border border-warning/30 p-3">
                    <div>
                      <div className="text-sm font-medium">Archive Group</div>
                      <div className="text-xs text-muted-foreground">
                        Hide from active lists. Members preserved.
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
                      Archive
                    </Button>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-3">
                  <div>
                    <div className="text-sm font-medium">Delete Group</div>
                    <div className="text-xs text-muted-foreground">
                      Permanently remove with all associations.
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting || !form.name.trim()}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive confirmation */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-warning/15">
              <TriangleAlert className="text-warning" />
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

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete group permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently deleting &ldquo;{group.name}&rdquo; will remove all {group.members.length} member associations. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
