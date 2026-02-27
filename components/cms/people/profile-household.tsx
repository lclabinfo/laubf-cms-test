"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, Plus, X, Users } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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

const roleLabel: Record<string, string> = {
  HEAD: "Head",
  SPOUSE: "Spouse",
  CHILD: "Child",
  OTHER_ADULT: "Other Adult",
  DEPENDENT: "Dependent",
}

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileHousehold({ person, onUpdate }: Props) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState("")
  const [memberRole, setMemberRole] = useState("HEAD")
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const memberships = person.householdMemberships
  const household = memberships[0]?.household ?? null
  const householdMembers = household
    ? (household as unknown as { members: Array<{ personId: string; role: string; person: { id: string; firstName: string; lastName: string; photoUrl: string | null } }> }).members ?? []
    : []

  const handleCreateAndJoin = async () => {
    if (!newHouseholdName.trim()) return
    setSaving(true)
    try {
      const createRes = await fetch("/api/v1/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHouseholdName.trim() }),
      })
      if (!createRes.ok) throw new Error("Failed to create household")
      const { data: newHousehold } = await createRes.json()

      const addRes = await fetch(`/api/v1/households/${newHousehold.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id, role: memberRole }),
      })
      if (!addRes.ok) throw new Error("Failed to add to household")

      toast.success(`Added to ${newHouseholdName}`)
      setAddDialogOpen(false)
      setNewHouseholdName("")
      onUpdate()
    } catch {
      toast.error("Failed to create household")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (householdId: string) => {
    if (!confirm("Remove from this household?")) return
    setRemoving(householdId)
    try {
      const res = await fetch(`/api/v1/households/${householdId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      })
      if (!res.ok) throw new Error("Failed to remove")
      toast.success("Removed from household")
      onUpdate()
    } catch {
      toast.error("Failed to remove from household")
    } finally {
      setRemoving(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Home className="size-4" />
            Family / Household
          </CardTitle>
          {!household && (
            <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="mr-1 size-3.5" />
              Create
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {household ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{household.name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive h-7 text-xs"
                  onClick={() => handleRemove(household.id)}
                  disabled={removing === household.id}
                >
                  <X className="mr-1 size-3" />
                  Remove
                </Button>
              </div>
              <div className="space-y-2">
                {householdMembers.map((member) => (
                  <Link
                    key={member.personId}
                    href={`/cms/people/members/${member.personId}`}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-muted transition-colors"
                  >
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">
                        {member.person.firstName.charAt(0)}
                        {member.person.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.person.firstName} {member.person.lastName}
                        {member.personId === person.id && (
                          <span className="text-muted-foreground"> (you)</span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {roleLabel[member.role] ?? member.role}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="mx-auto size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No household assigned</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setAddDialogOpen(true)}
              >
                Create Household
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Household</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="householdName">Household Name</Label>
              <Input
                id="householdName"
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder="e.g., Smith Family"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memberRole">Role</Label>
              <Select value={memberRole} onValueChange={setMemberRole}>
                <SelectTrigger id="memberRole">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEAD">Head</SelectItem>
                  <SelectItem value="SPOUSE">Spouse</SelectItem>
                  <SelectItem value="CHILD">Child</SelectItem>
                  <SelectItem value="OTHER_ADULT">Other Adult</SelectItem>
                  <SelectItem value="DEPENDENT">Dependent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAndJoin} disabled={saving || !newHouseholdName.trim()}>
              {saving ? "Creating..." : "Create & Join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
