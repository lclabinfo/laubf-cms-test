"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Building2,
  MapPin,
  Mail,
  Clock,
  Globe,
  Trash2,
  Plus,
  Pencil,
  X,
  Check,
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
import {
  type ChurchProfile,
  dayOptions,
  socialPlatformOptions,
} from "@/lib/church-profile-data"

// ─── Section names ───────────────────────────────────────────────
type SectionKey = "identity" | "location" | "contact" | "worship" | "social"

// ─── Helpers ─────────────────────────────────────────────────────

function formatTime(time: string) {
  const [h, m] = time.split(":")
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

function getPlatformEmoji(platformValue: string): string {
  const found = socialPlatformOptions.find((p) => p.value === platformValue)
  return found?.emoji ?? "\uD83D\uDD17"
}

function getPlatformLabel(platformValue: string): string {
  const found = socialPlatformOptions.find((p) => p.value === platformValue)
  return found?.label ?? platformValue
}

// Deep-equal check for dirty state
function profilesEqual(a: ChurchProfile, b: ChurchProfile): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

// ─── Section Header ──────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  editing,
  onEdit,
  onSave,
  onCancel,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  editing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="px-5 py-3 border-b flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <h2 className="text-sm font-semibold flex-1">{title}</h2>
      {editing ? (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 gap-1 text-muted-foreground"
          >
            <X className="size-3.5" />
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} className="h-7 gap-1">
            <Check className="size-3.5" />
            Save
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 gap-1 text-muted-foreground"
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
      )}
    </div>
  )
}

// ─── Read-only display helpers ───────────────────────────────────

function ReadOnlyField({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-sm ${muted || !value ? "text-muted-foreground italic" : ""}`}>
        {value || "Not set"}
      </p>
    </div>
  )
}

// ─── ProfileForm ─────────────────────────────────────────────────

interface ProfileFormProps {
  initialData: ChurchProfile
  onSave?: (data: ChurchProfile) => Promise<void>
}

export function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  // Saved state = last "committed" state; profile = working copy
  const [saved, setSaved] = useState<ChurchProfile>(initialData)
  const [profile, setProfile] = useState<ChurchProfile>(initialData)
  const [editingSections, setEditingSections] = useState<Set<SectionKey>>(
    new Set()
  )
  const [saveLabel, setSaveLabel] = useState("Save Changes")

  const isDirty = useMemo(
    () => !profilesEqual(profile, saved),
    [profile, saved]
  )

  // ── Section edit controls ──

  const startEditing = useCallback((section: SectionKey) => {
    setEditingSections((prev) => new Set(prev).add(section))
  }, [])

  const cancelEditing = useCallback(
    (section: SectionKey) => {
      // Revert this section's data back to saved state
      setProfile((prev) => {
        const reverted = { ...prev }
        switch (section) {
          case "identity":
            reverted.name = saved.name
            reverted.description = saved.description
            break
          case "location":
            reverted.address = { ...saved.address }
            break
          case "contact":
            reverted.emails = saved.emails.map((e) => ({ ...e }))
            reverted.phones = saved.phones.map((p) => ({ ...p }))
            break
          case "worship":
            reverted.worshipServices = saved.worshipServices.map((s) => ({
              ...s,
            }))
            break
          case "social":
            reverted.socialLinks = saved.socialLinks.map((l) => ({ ...l }))
            break
        }
        return reverted
      })
      setEditingSections((prev) => {
        const next = new Set(prev)
        next.delete(section)
        return next
      })
    },
    [saved]
  )

  const saveSection = useCallback(
    (section: SectionKey) => {
      // Commit current profile's section data to saved
      setSaved((prev) => {
        const updated = { ...prev }
        switch (section) {
          case "identity":
            updated.name = profile.name
            updated.description = profile.description
            break
          case "location":
            updated.address = { ...profile.address }
            break
          case "contact":
            updated.emails = profile.emails.map((e) => ({ ...e }))
            updated.phones = profile.phones.map((p) => ({ ...p }))
            break
          case "worship":
            updated.worshipServices = profile.worshipServices.map((s) => ({
              ...s,
            }))
            break
          case "social":
            updated.socialLinks = profile.socialLinks.map((l) => ({ ...l }))
            break
        }
        return updated
      })
      setEditingSections((prev) => {
        const next = new Set(prev)
        next.delete(section)
        return next
      })
    },
    [profile]
  )

  const isEditing = useCallback(
    (section: SectionKey) => editingSections.has(section),
    [editingSections]
  )

  // ── Field update helpers ──

  function update<K extends keyof ChurchProfile>(
    key: K,
    value: ChurchProfile[K]
  ) {
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

  // ── List helpers ──

  function addEmail() {
    update("emails", [...profile.emails, { label: "", value: "" }])
  }
  function removeEmail(i: number) {
    update(
      "emails",
      profile.emails.filter((_, idx) => idx !== i)
    )
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
    update(
      "phones",
      profile.phones.filter((_, idx) => idx !== i)
    )
  }
  function setPhone(i: number, field: "label" | "value", v: string) {
    const next = [...profile.phones]
    next[i] = { ...next[i], [field]: v }
    update("phones", next)
  }

  function addService() {
    update("worshipServices", [
      ...profile.worshipServices,
      { day: "Sunday", startTime: "10:00", endTime: "11:00", description: "" },
    ])
  }
  function removeService(i: number) {
    update(
      "worshipServices",
      profile.worshipServices.filter((_, idx) => idx !== i)
    )
  }
  function setService(
    i: number,
    field: keyof ChurchProfile["worshipServices"][number],
    v: string
  ) {
    const next = [...profile.worshipServices]
    next[i] = { ...next[i], [field]: v }
    update("worshipServices", next)
  }

  function addSocialLink() {
    update("socialLinks", [
      ...profile.socialLinks,
      { platform: "website", url: "" },
    ])
  }
  function removeSocialLink(i: number) {
    update(
      "socialLinks",
      profile.socialLinks.filter((_, idx) => idx !== i)
    )
  }
  function setSocialLink(
    i: number,
    field: "platform" | "url",
    v: string
  ) {
    const next = [...profile.socialLinks]
    next[i] = { ...next[i], [field]: v }
    update("socialLinks", next)
  }

  // ── Global save / discard ──

  async function handleSave() {
    if (onSave) {
      setSaveLabel("Saving...")
      try {
        await onSave(profile)
        setSaved({ ...profile })
        setEditingSections(new Set())
        setSaveLabel("Saved!")
        setTimeout(() => setSaveLabel("Save Changes"), 2000)
      } catch (err) {
        console.error("Save failed:", err)
        setSaveLabel("Save Failed")
        setTimeout(() => setSaveLabel("Save Changes"), 2000)
      }
    } else {
      setSaved({ ...profile })
      setEditingSections(new Set())
      setSaveLabel("Saved!")
      setTimeout(() => setSaveLabel("Save Changes"), 2000)
    }
  }

  function handleDiscard() {
    setProfile({ ...saved })
    setEditingSections(new Set())
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
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-0.5 -m-0.5">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          {/* ── 1. Identity & Description ── */}
          <section className="rounded-xl border bg-card">
            <SectionHeader
              icon={Building2}
              title="Identity & Description"
              editing={isEditing("identity")}
              onEdit={() => startEditing("identity")}
              onSave={() => saveSection("identity")}
              onCancel={() => cancelEditing("identity")}
            />
            <div className="p-5 space-y-4">
              {isEditing("identity") ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="church-name">
                      Church Name{" "}
                      <span className="text-destructive">*</span>
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
                </>
              ) : (
                <>
                  <ReadOnlyField label="Church Name" value={profile.name} />
                  <ReadOnlyField
                    label="Description"
                    value={profile.description}
                  />
                </>
              )}
            </div>
          </section>

          {/* ── 2. Location ── */}
          <section className="rounded-xl border bg-card">
            <SectionHeader
              icon={MapPin}
              title="Location"
              editing={isEditing("location")}
              onEdit={() => startEditing("location")}
              onSave={() => saveSection("location")}
              onCancel={() => cancelEditing("location")}
            />
            <div className="p-5 space-y-4">
              {isEditing("location") ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={profile.address.street}
                      onChange={(e) =>
                        updateAddress("street", e.target.value)
                      }
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.address.city}
                        onChange={(e) =>
                          updateAddress("city", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={profile.address.state}
                        onChange={(e) =>
                          updateAddress("state", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="w-1/2 space-y-2">
                    <Label htmlFor="zip">Zip Code</Label>
                    <Input
                      id="zip"
                      value={profile.address.zip}
                      onChange={(e) =>
                        updateAddress("zip", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-notes">Additional Notes</Label>
                    <Textarea
                      id="addr-notes"
                      value={profile.address.notes}
                      onChange={(e) =>
                        updateAddress("notes", e.target.value)
                      }
                      placeholder="Parking instructions, entrance details..."
                      rows={2}
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField
                    label="Street Address"
                    value={profile.address.street}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <ReadOnlyField label="City" value={profile.address.city} />
                    <ReadOnlyField
                      label="State"
                      value={profile.address.state}
                    />
                    <ReadOnlyField
                      label="Zip Code"
                      value={profile.address.zip}
                    />
                  </div>
                  {profile.address.notes && (
                    <ReadOnlyField
                      label="Additional Notes"
                      value={profile.address.notes}
                    />
                  )}
                </>
              )}
            </div>
          </section>

          {/* ── 3. Contact Information ── */}
          <section className="rounded-xl border bg-card">
            <SectionHeader
              icon={Mail}
              title="Contact Information"
              editing={isEditing("contact")}
              onEdit={() => startEditing("contact")}
              onSave={() => saveSection("contact")}
              onCancel={() => cancelEditing("contact")}
            />
            <div className="p-5 space-y-4">
              {/* Emails */}
              <h3 className="text-sm font-medium">Email Addresses</h3>
              {isEditing("contact") ? (
                <>
                  {profile.emails.length > 0 && (
                    <div className="space-y-3">
                      {/* Column headers */}
                      <div className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-xs font-medium text-muted-foreground">
                          Label
                        </span>
                        <span className="flex-1 text-xs font-medium text-muted-foreground">
                          Email
                        </span>
                        <span className="w-9 shrink-0" />
                      </div>
                      {profile.emails.map((email, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Input
                            value={email.label}
                            onChange={(e) =>
                              setEmail(i, "label", e.target.value)
                            }
                            placeholder="Label (e.g. General)"
                            className="w-40 shrink-0"
                          />
                          <Input
                            type="email"
                            value={email.value}
                            onChange={(e) =>
                              setEmail(i, "value", e.target.value)
                            }
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
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Email
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  {profile.emails.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No email addresses added
                    </p>
                  ) : (
                    profile.emails.map((email, i) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <span className="text-sm font-medium min-w-[8rem]">
                          {email.label || "Untitled"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {email.value}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              <Separator />

              {/* Phones */}
              <h3 className="text-sm font-medium">Phone Numbers</h3>
              {isEditing("contact") ? (
                <>
                  {profile.phones.length > 0 && (
                    <div className="space-y-3">
                      {/* Column headers */}
                      <div className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-xs font-medium text-muted-foreground">
                          Label
                        </span>
                        <span className="flex-1 text-xs font-medium text-muted-foreground">
                          Phone
                        </span>
                        <span className="w-9 shrink-0" />
                      </div>
                      {profile.phones.map((phone, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Input
                            value={phone.label}
                            onChange={(e) =>
                              setPhone(i, "label", e.target.value)
                            }
                            placeholder="Label (e.g. Office)"
                            className="w-40 shrink-0"
                          />
                          <Input
                            type="tel"
                            value={phone.value}
                            onChange={(e) =>
                              setPhone(i, "value", e.target.value)
                            }
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
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPhone}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Phone
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  {profile.phones.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No phone numbers added
                    </p>
                  ) : (
                    profile.phones.map((phone, i) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <span className="text-sm font-medium min-w-[8rem]">
                          {phone.label || "Untitled"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {phone.value}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── 4. Worship Services ── */}
          <section className="rounded-xl border bg-card">
            <SectionHeader
              icon={Clock}
              title="Worship Services"
              editing={isEditing("worship")}
              onEdit={() => startEditing("worship")}
              onSave={() => saveSection("worship")}
              onCancel={() => cancelEditing("worship")}
            />
            <div className="p-5 space-y-4">
              {isEditing("worship") ? (
                <>
                  <div className="space-y-3">
                    {profile.worshipServices.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-lg border p-3 space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 space-y-2">
                            <Label>Service Name</Label>
                            <Input
                              value={item.description}
                              onChange={(e) =>
                                setService(i, "description", e.target.value)
                              }
                              placeholder="e.g. Sunday Worship Service"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeService(i)}
                            className="shrink-0 mt-6 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="space-y-2">
                            <Label>Day</Label>
                            <Select
                              value={item.day}
                              onValueChange={(v) =>
                                setService(i, "day", v)
                              }
                            >
                              <SelectTrigger className="w-32">
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
                          </div>
                          <div className="space-y-2">
                            <Label>Start</Label>
                            <Input
                              type="time"
                              value={item.startTime}
                              onChange={(e) =>
                                setService(i, "startTime", e.target.value)
                              }
                              className="w-28"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End</Label>
                            <Input
                              type="time"
                              value={item.endTime}
                              onChange={(e) =>
                                setService(i, "endTime", e.target.value)
                              }
                              className="w-28"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addService}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Service
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  {profile.worshipServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No worship services added
                    </p>
                  ) : (
                    profile.worshipServices.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {item.description || "Untitled Service"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.day} &middot; {formatTime(item.startTime)}{" "}
                            &ndash; {formatTime(item.endTime)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── 5. Social Media ── */}
          <section className="rounded-xl border bg-card">
            <SectionHeader
              icon={Globe}
              title="Social Media"
              editing={isEditing("social")}
              onEdit={() => startEditing("social")}
              onSave={() => saveSection("social")}
              onCancel={() => cancelEditing("social")}
            />
            <div className="p-5 space-y-4">
              {isEditing("social") ? (
                <>
                  <div className="space-y-3">
                    {/* Column headers */}
                    {profile.socialLinks.length > 0 && (
                      <div className="flex items-center gap-3">
                        <span className="w-44 shrink-0 text-xs font-medium text-muted-foreground">
                          Platform
                        </span>
                        <span className="flex-1 text-xs font-medium text-muted-foreground">
                          URL
                        </span>
                        <span className="w-9 shrink-0" />
                      </div>
                    )}
                    {profile.socialLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Select
                          value={link.platform}
                          onValueChange={(v) =>
                            setSocialLink(i, "platform", v)
                          }
                        >
                          <SelectTrigger className="w-44 shrink-0">
                            <SelectValue>
                              <span className="flex items-center gap-2">
                                <span>{getPlatformEmoji(link.platform)}</span>
                                <span>{getPlatformLabel(link.platform)}</span>
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {socialPlatformOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className="flex items-center gap-2">
                                  <span>{opt.emoji}</span>
                                  <span>{opt.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={link.url}
                          onChange={(e) =>
                            setSocialLink(i, "url", e.target.value)
                          }
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSocialLink(i)}
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
                    onClick={addSocialLink}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Add Social Link
                  </Button>
                </>
              ) : (
                <div className="space-y-2.5">
                  {profile.socialLinks.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      No social links added
                    </p>
                  ) : (
                    profile.socialLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <span className="text-base leading-none">
                          {getPlatformEmoji(link.platform)}
                        </span>
                        <span className="text-sm font-medium min-w-[6rem]">
                          {getPlatformLabel(link.platform)}
                        </span>
                        {link.url ? (
                          <span className="text-sm text-muted-foreground truncate">
                            {link.url}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No URL set
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* ── Sticky save/discard bar ── */}
      {isDirty && (
        <div className="sticky bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-sm px-6 py-3 -mx-6 -mb-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDiscard}>
                Discard Changes
              </Button>
              <Button onClick={handleSave}>{saveLabel}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
