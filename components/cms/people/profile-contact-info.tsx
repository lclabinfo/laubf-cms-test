"use client"

import { useState } from "react"
import { Pencil, X, Check, Mail, Phone } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { PersonDetail } from "./types"

type AddressJson = {
  street?: string
  street2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

function parseAddress(person: PersonDetail): AddressJson {
  const addr = person.address as AddressJson | null
  return {
    street: addr?.street ?? "",
    street2: addr?.street2 ?? "",
    city: person.city ?? addr?.city ?? "",
    state: person.state ?? addr?.state ?? "",
    zip: person.zipCode ?? addr?.zip ?? "",
    country: person.country ?? addr?.country ?? "",
  }
}

function formatAddress(person: PersonDetail): string | null {
  const addr = parseAddress(person)
  const parts = [
    addr.street,
    addr.street2,
    [addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
    addr.country,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join("\n") : null
}

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileContactInfo({ person, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const addr = parseAddress(person)
  const [form, setForm] = useState({
    email: person.email ?? "",
    phone: person.phone ?? "",
    mobilePhone: person.mobilePhone ?? "",
    homePhone: person.homePhone ?? "",
    street: addr.street ?? "",
    street2: addr.street2 ?? "",
    city: addr.city ?? "",
    state: addr.state ?? "",
    zip: addr.zip ?? "",
    country: addr.country ?? "",
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/v1/people/${person.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email || null,
          phone: form.phone || null,
          mobilePhone: form.mobilePhone || null,
          homePhone: form.homePhone || null,
          address: {
            street: form.street || undefined,
            street2: form.street2 || undefined,
            city: form.city || undefined,
            state: form.state || undefined,
            zip: form.zip || undefined,
            country: form.country || undefined,
          },
          city: form.city || null,
          state: form.state || null,
          zipCode: form.zip || null,
          country: form.country || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Profile updated successfully")
      setEditing(false)
      onUpdate()
    } catch {
      toast.error("Failed to update contact info")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    const a = parseAddress(person)
    setForm({
      email: person.email ?? "",
      phone: person.phone ?? "",
      mobilePhone: person.mobilePhone ?? "",
      homePhone: person.homePhone ?? "",
      street: a.street ?? "",
      street2: a.street2 ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      zip: a.zip ?? "",
      country: a.country ?? "",
    })
    setEditing(false)
  }

  const formattedAddress = formatAddress(person)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Contact Information</CardTitle>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobilePhone">Mobile Phone</Label>
              <Input
                id="mobilePhone"
                type="tel"
                value={form.mobilePhone}
                onChange={(e) => setForm({ ...form, mobilePhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homePhone">Home Phone</Label>
              <Input
                id="homePhone"
                type="tel"
                value={form.homePhone}
                onChange={(e) => setForm({ ...form, homePhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Other Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street2">Street Address 2</Label>
              <Input
                id="street2"
                value={form.street2}
                onChange={(e) => setForm({ ...form, street2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Email</dt>
              <dd className="text-sm font-medium">
                {person.email ? (
                  <a
                    href={`mailto:${person.email}`}
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Mail className="size-3.5" />
                    {person.email}
                  </a>
                ) : (
                  "Not set"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Mobile Phone</dt>
              <dd className="text-sm font-medium">
                {person.mobilePhone ? (
                  <a
                    href={`tel:${person.mobilePhone}`}
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Phone className="size-3.5" />
                    {person.mobilePhone}
                  </a>
                ) : (
                  "Not set"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Home Phone</dt>
              <dd className="text-sm font-medium">
                {person.homePhone ? (
                  <a href={`tel:${person.homePhone}`} className="text-primary hover:underline">
                    {person.homePhone}
                  </a>
                ) : (
                  "Not set"
                )}
              </dd>
            </div>
            {person.phone && (
              <div>
                <dt className="text-muted-foreground text-sm">Other Phone</dt>
                <dd className="text-sm font-medium">
                  <a href={`tel:${person.phone}`} className="text-primary hover:underline">
                    {person.phone}
                  </a>
                </dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-sm">Address</dt>
              <dd className="text-sm font-medium whitespace-pre-line">
                {formattedAddress || "Not set"}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
