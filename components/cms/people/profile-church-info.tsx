"use client"

import { useState } from "react"
import { Pencil, X, Check } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PersonDetail } from "./types"

function formatDate(date: Date | string | null) {
  if (!date) return null
  return new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

const statusLabel: Record<string, string> = {
  VISITOR: "Visitor",
  REGULAR_ATTENDEE: "Regular Attendee",
  MEMBER: "Member",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
}

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileChurchInfo({ person, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    membershipStatus: person.membershipStatus,
    membershipDate: person.membershipDate
      ? new Date(person.membershipDate).toISOString().split("T")[0]
      : "",
    baptismDate: person.baptismDate
      ? new Date(person.baptismDate).toISOString().split("T")[0]
      : "",
    salvationDate: person.salvationDate
      ? new Date(person.salvationDate).toISOString().split("T")[0]
      : "",
    source: person.source ?? "",
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/people/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipStatus: form.membershipStatus,
          membershipDate: form.membershipDate || null,
          baptismDate: form.baptismDate || null,
          salvationDate: form.salvationDate || null,
          source: form.source || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Profile updated successfully")
      setEditing(false)
      onUpdate()
    } catch {
      toast.error("Failed to update church info")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      membershipStatus: person.membershipStatus,
      membershipDate: person.membershipDate
        ? new Date(person.membershipDate).toISOString().split("T")[0]
        : "",
      baptismDate: person.baptismDate
        ? new Date(person.baptismDate).toISOString().split("T")[0]
        : "",
      salvationDate: person.salvationDate
        ? new Date(person.salvationDate).toISOString().split("T")[0]
        : "",
      source: person.source ?? "",
    })
    setEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Church Information</CardTitle>
        {!editing ? (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="mr-1.5 size-3.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="mr-1 size-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="mr-1 size-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="membershipStatus">Membership Status</Label>
              <Select
                value={form.membershipStatus}
                onValueChange={(v) => setForm({ ...form, membershipStatus: v as typeof form.membershipStatus })}
              >
                <SelectTrigger id="membershipStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VISITOR">Visitor</SelectItem>
                  <SelectItem value="REGULAR_ATTENDEE">Regular Attendee</SelectItem>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="membershipDate">Membership Date</Label>
              <Input
                id="membershipDate"
                type="date"
                value={form.membershipDate}
                onChange={(e) => setForm({ ...form, membershipDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baptismDate">Baptism Date</Label>
              <Input
                id="baptismDate"
                type="date"
                value={form.baptismDate}
                onChange={(e) => setForm({ ...form, baptismDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salvationDate">Salvation Date</Label>
              <Input
                id="salvationDate"
                type="date"
                value={form.salvationDate}
                onChange={(e) => setForm({ ...form, salvationDate: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="How did they find the church?"
              />
            </div>
          </div>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Membership Status</dt>
              <dd className="text-sm font-medium">
                {statusLabel[person.membershipStatus] ?? person.membershipStatus}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Membership Date</dt>
              <dd className="text-sm font-medium">
                {formatDate(person.membershipDate) ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Baptism Date</dt>
              <dd className="text-sm font-medium">
                {formatDate(person.baptismDate) ?? "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Salvation Date</dt>
              <dd className="text-sm font-medium">
                {formatDate(person.salvationDate) ?? "Not set"}
              </dd>
            </div>
            {person.source && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-sm">Source</dt>
                <dd className="text-sm font-medium">{person.source}</dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
