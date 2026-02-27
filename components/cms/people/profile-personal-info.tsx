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
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function calculateAge(dob: Date | string | null) {
  if (!dob) return null
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}

const genderLabel: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
}

const maritalLabel: Record<string, string> = {
  SINGLE: "Single",
  MARRIED: "Married",
  DIVORCED: "Divorced",
  WIDOWED: "Widowed",
  SEPARATED: "Separated",
  OTHER: "Other",
}

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfilePersonalInfo({ person, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    firstName: person.firstName,
    lastName: person.lastName,
    preferredName: person.preferredName ?? "",
    gender: person.gender ?? "",
    dateOfBirth: person.dateOfBirth
      ? new Date(person.dateOfBirth).toISOString().split("T")[0]
      : "",
    maritalStatus: person.maritalStatus ?? "",
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/people/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          preferredName: form.preferredName || null,
          gender: form.gender || null,
          dateOfBirth: form.dateOfBirth || null,
          maritalStatus: form.maritalStatus || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Profile updated successfully")
      setEditing(false)
      onUpdate()
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      firstName: person.firstName,
      lastName: person.lastName,
      preferredName: person.preferredName ?? "",
      gender: person.gender ?? "",
      dateOfBirth: person.dateOfBirth
        ? new Date(person.dateOfBirth).toISOString().split("T")[0]
        : "",
      maritalStatus: person.maritalStatus ?? "",
    })
    setEditing(false)
  }

  const age = calculateAge(person.dateOfBirth)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Personal Information</CardTitle>
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
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredName">Preferred Name</Label>
              <Input
                id="preferredName"
                value={form.preferredName}
                onChange={(e) => setForm({ ...form, preferredName: e.target.value })}
                placeholder="Nickname or preferred name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                  <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select value={form.maritalStatus} onValueChange={(v) => setForm({ ...form, maritalStatus: v })}>
                <SelectTrigger id="maritalStatus">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE">Single</SelectItem>
                  <SelectItem value="MARRIED">Married</SelectItem>
                  <SelectItem value="DIVORCED">Divorced</SelectItem>
                  <SelectItem value="WIDOWED">Widowed</SelectItem>
                  <SelectItem value="SEPARATED">Separated</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">First Name</dt>
              <dd className="text-sm font-medium">{person.firstName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Last Name</dt>
              <dd className="text-sm font-medium">{person.lastName}</dd>
            </div>
            {person.preferredName && (
              <div>
                <dt className="text-muted-foreground text-sm">Preferred Name</dt>
                <dd className="text-sm font-medium">{person.preferredName}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground text-sm">Gender</dt>
              <dd className="text-sm font-medium">
                {person.gender ? genderLabel[person.gender] ?? person.gender : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Date of Birth</dt>
              <dd className="text-sm font-medium">
                {person.dateOfBirth
                  ? `${formatDate(person.dateOfBirth)}${age !== null ? ` (${age})` : ""}`
                  : "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Marital Status</dt>
              <dd className="text-sm font-medium">
                {person.maritalStatus ? maritalLabel[person.maritalStatus] ?? person.maritalStatus : "Not set"}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
