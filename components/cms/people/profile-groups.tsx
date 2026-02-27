"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Users, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PersonDetail } from "./types"

const groupTypeLabel: Record<string, string> = {
  SMALL_GROUP: "Small Group",
  SERVING_TEAM: "Serving Team",
  MINISTRY: "Ministry",
  CLASS: "Class",
  ADMINISTRATIVE: "Administrative",
  CUSTOM: "Custom",
}

const roleLabel: Record<string, string> = {
  LEADER: "Leader",
  CO_LEADER: "Co-Leader",
  MEMBER: "Member",
}

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileGroups({ person, onUpdate }: Props) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [groups, setGroups] = useState<Array<{ id: string; name: string; groupType: string }>>([])
  const [selectedGroupId, setSelectedGroupId] = useState("")
  const [role, setRole] = useState("MEMBER")
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const memberships = person.groupMemberships

  const searchGroups = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setGroups([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/v1/person-groups?search=${encodeURIComponent(query)}&pageSize=10`)
      if (!res.ok) throw new Error("Failed to search")
      const { data } = await res.json()
      setGroups(data)
    } catch {
      setGroups([])
    } finally {
      setSearching(false)
    }
  }

  const handleAddToGroup = async () => {
    if (!selectedGroupId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/person-groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id, role }),
      })
      if (!res.ok) throw new Error("Failed to add")
      const selectedGroup = groups.find((g) => g.id === selectedGroupId)
      toast.success(`Added to ${selectedGroup?.name ?? "group"}`)
      setAddDialogOpen(false)
      setSearchQuery("")
      setSelectedGroupId("")
      setGroups([])
      onUpdate()
    } catch {
      toast.error("Failed to add to group")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (groupId: string) => {
    if (!confirm("Remove from this group?")) return
    setRemoving(groupId)
    try {
      const res = await fetch(`/api/v1/person-groups/${groupId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      })
      if (!res.ok) throw new Error("Failed to remove")
      toast.success("Removed from group")
      onUpdate()
    } catch {
      toast.error("Failed to remove from group")
    } finally {
      setRemoving(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            Groups
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-1 size-3.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {memberships.length > 0 ? (
            <div className="space-y-2">
              {memberships.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between gap-2 rounded-md p-2 hover:bg-muted transition-colors group"
                >
                  <Link
                    href={`/cms/people/groups`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-medium truncate">{membership.group.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {groupTypeLabel[membership.group.groupType] ?? membership.group.groupType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {roleLabel[membership.role] ?? membership.role}
                      </Badge>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                    onClick={() => handleRemove(membership.groupId)}
                    disabled={removing === membership.groupId}
                  >
                    <X className="size-3.5" />
                    <span className="sr-only">Remove from group</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="mx-auto size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Not in any groups</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setAddDialogOpen(true)}
              >
                Browse Groups
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupSearch">Search Groups</Label>
              <Input
                id="groupSearch"
                value={searchQuery}
                onChange={(e) => searchGroups(e.target.value)}
                placeholder="Type to search groups..."
              />
              {searching && <p className="text-xs text-muted-foreground">Searching...</p>}
              {groups.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-md">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        selectedGroupId === group.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <span className="font-medium">{group.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {groupTypeLabel[group.groupType] ?? group.groupType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupRole">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="groupRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEADER">Leader</SelectItem>
                  <SelectItem value="CO_LEADER">Co-Leader</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddToGroup} disabled={saving || !selectedGroupId}>
              {saving ? "Adding..." : "Add to Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
