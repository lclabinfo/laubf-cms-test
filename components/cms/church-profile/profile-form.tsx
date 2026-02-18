"use client"

import { useState } from "react"
import {
  Building2,
  MapPin,
  Mail,
  Clock,
  Globe,
  Trash2,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type ChurchProfile, dayOptions } from "@/lib/church-profile-data"

// Platform icon colors for visual distinction
const platformMeta: Record<string, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "text-blue-600" },
  instagram: { label: "Instagram", color: "text-pink-500" },
  youtube: { label: "YouTube", color: "text-red-600" },
  x: { label: "X (Twitter)", color: "text-foreground" },
}

interface ProfileFormProps {
  initialData: ChurchProfile
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [profile, setProfile] = useState<ChurchProfile>(initialData)
  const [saveLabel, setSaveLabel] = useState("Save Changes")

  // --- helpers ---

  function update<K extends keyof ChurchProfile>(key: K, value: ChurchProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }))
  }

  function updateAddress<K extends keyof ChurchProfile["address"]>(
    key: K,
    value: string
  ) {
    setProfile((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }))
  }

  function updateSocial<K extends keyof Omit<ChurchProfile["socials"], "custom">>(
    key: K,
    value: string
  ) {
    setProfile((prev) => ({
      ...prev,
      socials: { ...prev.socials, [key]: value },
    }))
  }

  // --- list helpers ---

  function addEmail() {
    update("emails", [...profile.emails, { label: "", value: "" }])
  }
  function removeEmail(i: number) {
    update("emails", profile.emails.filter((_, idx) => idx !== i))
  }
  function setEmail(i: number, field: "label" | "value", v: string) {
    const next = [...profile.emails]
    next[i] = { ...next[i], [field]: v }
    update("emails", next)
  }

  function addPhone() {
    update("phones", [...profile.phones, { label: "", value: "" }])
  }
  function removePhone(i: number) {
    update("phones", profile.phones.filter((_, idx) => idx !== i))
  }
  function setPhone(i: number, field: "label" | "value", v: string) {
    const next = [...profile.phones]
    next[i] = { ...next[i], [field]: v }
    update("phones", next)
  }

  function addSchedule() {
    update("schedule", [
      ...profile.schedule,
      { day: "Sunday", startTime: "09:00", endTime: "10:00", description: "" },
    ])
  }
  function removeSchedule(i: number) {
    update("schedule", profile.schedule.filter((_, idx) => idx !== i))
  }
  function setSchedule(
    i: number,
    field: keyof ChurchProfile["schedule"][number],
    v: string
  ) {
    const next = [...profile.schedule]
    next[i] = { ...next[i], [field]: v }
    update("schedule", next)
  }

  function addCustomLink() {
    setProfile((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        custom: [...prev.socials.custom, { platform: "", url: "" }],
      },
    }))
  }
  function removeCustomLink(i: number) {
    setProfile((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        custom: prev.socials.custom.filter((_, idx) => idx !== i),
      },
    }))
  }
  function setCustomLink(i: number, field: "platform" | "url", v: string) {
    setProfile((prev) => {
      const next = [...prev.socials.custom]
      next[i] = { ...next[i], [field]: v }
      return { ...prev, socials: { ...prev.socials, custom: next } }
    })
  }

  // --- save ---

  function handleSave() {
    setSaveLabel("Saved!")
    setTimeout(() => setSaveLabel("Save Changes"), 2000)
  }

  return (
    <div className="flex flex-col gap-6 flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Church Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your church identity, location, contacts, and social links.
          </p>
        </div>
        <Button onClick={handleSave}>{saveLabel}</Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-0.5 -m-0.5">
        <div className="max-w-3xl mx-auto space-y-6 pb-8">
          {/* ── 1. Identity & Description ── */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Identity & Description</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="church-name">
                  Church Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="church-name"
                  value={profile.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your church name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="church-desc">Description</Label>
                <Textarea
                  id="church-desc"
                  value={profile.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Mission statement or brief bio"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Used for SEO and website footers.
                </p>
              </div>
            </div>
          </section>

          {/* ── 2. Location ── */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Location</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={profile.address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.address.city}
                    onChange={(e) => updateAddress("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.address.state}
                    onChange={(e) => updateAddress("state", e.target.value)}
                  />
                </div>
              </div>
              <div className="w-1/2 space-y-2">
                <Label htmlFor="zip">Zip Code</Label>
                <Input
                  id="zip"
                  value={profile.address.zip}
                  onChange={(e) => updateAddress("zip", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr-notes">Additional Notes</Label>
                <Textarea
                  id="addr-notes"
                  value={profile.address.notes}
                  onChange={(e) => updateAddress("notes", e.target.value)}
                  placeholder="Parking instructions, entrance details..."
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* ── 3. Contact Information ── */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Contact Information</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Emails */}
              <h3 className="text-sm font-medium">Email Addresses</h3>
              <div className="space-y-3">
                {profile.emails.map((email, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Input
                      value={email.label}
                      onChange={(e) => setEmail(i, "label", e.target.value)}
                      placeholder="Label (e.g. General)"
                      className="w-40 shrink-0"
                    />
                    <Input
                      type="email"
                      value={email.value}
                      onChange={(e) => setEmail(i, "value", e.target.value)}
                      placeholder="email@church.org"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEmail(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addEmail}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Email
              </Button>

              <Separator />

              {/* Phones */}
              <h3 className="text-sm font-medium">Phone Numbers</h3>
              <div className="space-y-3">
                {profile.phones.map((phone, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Input
                      value={phone.label}
                      onChange={(e) => setPhone(i, "label", e.target.value)}
                      placeholder="Label (e.g. Office)"
                      className="w-40 shrink-0"
                    />
                    <Input
                      type="tel"
                      value={phone.value}
                      onChange={(e) => setPhone(i, "value", e.target.value)}
                      placeholder="(555) 123-4567"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePhone(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addPhone}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Phone
              </Button>
            </div>
          </section>

          {/* ── 4. Service Times ── */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                Service Times & Office Hours
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                {profile.schedule.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Select
                      value={item.day}
                      onValueChange={(v) => setSchedule(i, "day", v)}
                    >
                      <SelectTrigger className="w-32 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={item.startTime}
                      onChange={(e) =>
                        setSchedule(i, "startTime", e.target.value)
                      }
                      className="w-28 shrink-0"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <Input
                      type="time"
                      value={item.endTime}
                      onChange={(e) =>
                        setSchedule(i, "endTime", e.target.value)
                      }
                      className="w-28 shrink-0"
                    />
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        setSchedule(i, "description", e.target.value)
                      }
                      placeholder="e.g. Sunday Service"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSchedule(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addSchedule}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Schedule
              </Button>
            </div>
          </section>

          {/* ── 5. Social Media ── */}
          <section className="rounded-xl border bg-card">
            <div className="px-5 py-3 border-b flex items-center gap-2">
              <Globe className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Social Media</h2>
            </div>
            <div className="p-5 space-y-4">
              {/* Standard platforms */}
              {(
                Object.keys(platformMeta) as Array<
                  keyof typeof platformMeta
                >
              ).map((key) => {
                const meta = platformMeta[key]
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium w-28 shrink-0 ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                    <Input
                      value={
                        profile.socials[
                          key as keyof Omit<
                            ChurchProfile["socials"],
                            "custom"
                          >
                        ]
                      }
                      onChange={(e) =>
                        updateSocial(
                          key as keyof Omit<
                            ChurchProfile["socials"],
                            "custom"
                          >,
                          e.target.value
                        )
                      }
                      placeholder={`https://${key}.com/...`}
                      className="flex-1"
                    />
                  </div>
                )
              })}

              <Separator />

              {/* Custom links */}
              <h3 className="text-sm font-medium">Custom Links</h3>
              <div className="space-y-3">
                {profile.socials.custom.map((link, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Input
                      value={link.platform}
                      onChange={(e) =>
                        setCustomLink(i, "platform", e.target.value)
                      }
                      placeholder="Platform name"
                      className="w-40 shrink-0"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) =>
                        setCustomLink(i, "url", e.target.value)
                      }
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCustomLink(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomLink}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Add Custom Link
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
