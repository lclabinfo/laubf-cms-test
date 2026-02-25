"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { SectionType } from "@/lib/db/types"

interface MinistryEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

// --- Ministry Intro Editor ---

function MinistryIntroEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const image = (content.image as {
    src: string
    alt: string
    objectPosition?: string
  }) ?? null

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="About This Ministry"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Ministry Name"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="Describe this ministry, its mission, and how people can get involved."
          className="min-h-[120px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Side Image (optional)</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Image URL</Label>
          <Input
            value={image?.src ?? ""}
            onChange={(e) =>
              onChange({
                ...content,
                image: e.target.value
                  ? {
                      src: e.target.value,
                      alt: image?.alt ?? "",
                      objectPosition: image?.objectPosition,
                    }
                  : null,
              })
            }
            placeholder="https://..."
          />
        </div>
        {image && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Alt Text</Label>
              <Input
                value={image.alt}
                onChange={(e) =>
                  onChange({
                    ...content,
                    image: { ...image, alt: e.target.value },
                  })
                }
                placeholder="Ministry image"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Object Position
              </Label>
              <Input
                value={image.objectPosition ?? ""}
                onChange={(e) =>
                  onChange({
                    ...content,
                    image: { ...image, objectPosition: e.target.value },
                  })
                }
                placeholder="center center"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Ministry Schedule Editor ---

function MinistryScheduleEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const scheduleEntries = (content.scheduleEntries as {
    day: string
    time: string
    location: string
  }[]) ?? []
  const buttons = (content.buttons as {
    label: string
    href: string
    variant: string
  }[]) ?? []

  function updateEntry(index: number, field: string, value: string) {
    const updated = [...scheduleEntries]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, scheduleEntries: updated })
  }

  function removeEntry(index: number) {
    onChange({
      ...content,
      scheduleEntries: scheduleEntries.filter((_, i) => i !== index),
    })
  }

  function addEntry() {
    onChange({
      ...content,
      scheduleEntries: [
        ...scheduleEntries,
        { day: "", time: "", location: "" },
      ],
    })
  }

  function updateButton(index: number, field: string, value: string) {
    const updated = [...buttons]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, buttons: updated })
  }

  function removeButton(index: number) {
    onChange({
      ...content,
      buttons: buttons.filter((_, i) => i !== index),
    })
  }

  function addButton() {
    onChange({
      ...content,
      buttons: [
        ...buttons,
        { label: "Button", href: "#", variant: "secondary" },
      ],
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Meeting Times"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="Join us at our regular meeting times."
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Schedule Entries ({scheduleEntries.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addEntry}>
            <Plus className="size-3.5 mr-1.5" />
            Add Entry
          </Button>
        </div>

        {scheduleEntries.map((entry, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="text-xs font-medium">Entry {i + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeEntry(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Day</Label>
                <Input
                  value={entry.day}
                  onChange={(e) => updateEntry(i, "day", e.target.value)}
                  placeholder="Sunday"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <Input
                  value={entry.time}
                  onChange={(e) => updateEntry(i, "time", e.target.value)}
                  placeholder="10:00 AM"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Location
                </Label>
                <Input
                  value={entry.location}
                  onChange={(e) => updateEntry(i, "location", e.target.value)}
                  placeholder="Main Building"
                />
              </div>
            </div>
          </div>
        ))}

        {scheduleEntries.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            No schedule entries yet. Click &quot;Add Entry&quot; to start.
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Buttons ({buttons.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addButton}>
            <Plus className="size-3.5 mr-1.5" />
            Add Button
          </Button>
        </div>

        {buttons.map((btn, i) => (
          <div key={i} className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input
                value={btn.label}
                onChange={(e) => updateButton(i, "label", e.target.value)}
                placeholder="Get Directions"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Link</Label>
              <Input
                value={btn.href}
                onChange={(e) => updateButton(i, "href", e.target.value)}
                placeholder="/contact"
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Variant</Label>
              <div className="flex gap-1">
                {(["primary", "secondary"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => updateButton(i, "variant", v)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
                      btn.variant === v
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {v === "primary" ? "1st" : "2nd"}
                  </button>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeButton(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Campus Card Grid Editor ---

function CampusCardGridEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const campuses = (content.campuses as {
    name: string
    href: string
    image?: string
  }[]) ?? []

  function updateCampus(index: number, field: string, value: string) {
    const updated = [...campuses]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, campuses: updated })
  }

  function removeCampus(index: number) {
    onChange({
      ...content,
      campuses: campuses.filter((_, i) => i !== index),
    })
  }

  function addCampus() {
    onChange({
      ...content,
      campuses: [...campuses, { name: "", href: "#", image: "" }],
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Our Locations"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Find a Campus"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="We have multiple locations to serve you."
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Campuses ({campuses.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addCampus}>
            <Plus className="size-3.5 mr-1.5" />
            Add Campus
          </Button>
        </div>

        {campuses.map((campus, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="text-xs font-medium">Campus {i + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeCampus(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={campus.name}
                  onChange={(e) => updateCampus(i, "name", e.target.value)}
                  placeholder="Main Campus"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Link</Label>
                <Input
                  value={campus.href}
                  onChange={(e) => updateCampus(i, "href", e.target.value)}
                  placeholder="/campuses/main"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Image URL (optional)
              </Label>
              <Input
                value={campus.image ?? ""}
                onChange={(e) => updateCampus(i, "image", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        ))}

        {campuses.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            No campuses added yet. Click &quot;Add Campus&quot; to start.
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Decorative images are configured in the JSON content.
      </p>
    </div>
  )
}

// --- Meet Team Editor ---

function MeetTeamEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const members = (content.members as {
    name: string
    role: string
    bio: string
    image: string | null
  }[]) ?? []

  function updateMember(index: number, field: string, value: unknown) {
    const updated = [...members]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, members: updated })
  }

  function removeMember(index: number) {
    onChange({
      ...content,
      members: members.filter((_, i) => i !== index),
    })
  }

  function addMember() {
    onChange({
      ...content,
      members: [
        ...members,
        { name: "", role: "", bio: "", image: null },
      ],
    })
  }

  function moveMember(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= members.length) return
    const updated = [...members]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onChange({ ...content, members: updated })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Our Team"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Meet the Team"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Team Members ({members.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addMember}>
            <Plus className="size-3.5 mr-1.5" />
            Add Member
          </Button>
        </div>

        {members.map((member, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="text-xs font-medium">Member {i + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => moveMember(i, i - 1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => moveMember(i, i + 1)}
                  disabled={i === members.length - 1}
                  title="Move down"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeMember(i)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={member.name}
                  onChange={(e) => updateMember(i, "name", e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input
                  value={member.role}
                  onChange={(e) => updateMember(i, "role", e.target.value)}
                  placeholder="Pastor"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Bio</Label>
              <Textarea
                value={member.bio}
                onChange={(e) => updateMember(i, "bio", e.target.value)}
                placeholder="A short bio about this team member..."
                className="min-h-[60px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Photo URL (optional)
              </Label>
              <Input
                value={member.image ?? ""}
                onChange={(e) =>
                  updateMember(
                    i,
                    "image",
                    e.target.value || null,
                  )
                }
                placeholder="https://..."
              />
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            No team members yet. Click &quot;Add Member&quot; to start.
          </div>
        )}
      </div>
    </div>
  )
}

// --- Location Detail Editor ---

function LocationDetailEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const timeLabel = (content.timeLabel as string) ?? ""
  const timeValue = (content.timeValue as string) ?? ""
  const locationLabel = (content.locationLabel as string) ?? ""
  const address = (content.address as string[]) ?? []
  const directionsUrl = (content.directionsUrl as string) ?? ""
  const directionsLabel = (content.directionsLabel as string) ?? ""

  function updateAddress(index: number, value: string) {
    const updated = [...address]
    updated[index] = value
    onChange({ ...content, address: updated })
  }

  function addAddressLine() {
    onChange({ ...content, address: [...address, ""] })
  }

  function removeAddressLine(index: number) {
    onChange({
      ...content,
      address: address.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Visit Us"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Service Time</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={timeLabel}
              onChange={(e) =>
                onChange({ ...content, timeLabel: e.target.value })
              }
              placeholder="Service Time"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Value</Label>
            <Input
              value={timeValue}
              onChange={(e) =>
                onChange({ ...content, timeValue: e.target.value })
              }
              placeholder="Sunday 10:00 AM"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Address</Label>
          <button
            type="button"
            onClick={addAddressLine}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add Line
          </button>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Address Label
          </Label>
          <Input
            value={locationLabel}
            onChange={(e) =>
              onChange({ ...content, locationLabel: e.target.value })
            }
            placeholder="Address"
          />
        </div>
        {address.map((line, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={line}
              onChange={(e) => updateAddress(i, e.target.value)}
              placeholder={`Address line ${i + 1}`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-destructive"
              onClick={() => removeAddressLine(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Directions Link</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={directionsLabel}
              onChange={(e) =>
                onChange({ ...content, directionsLabel: e.target.value })
              }
              placeholder="Get Directions"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              value={directionsUrl}
              onChange={(e) =>
                onChange({ ...content, directionsUrl: e.target.value })
              }
              placeholder="https://maps.google.com/..."
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Location images are configured in the JSON content.
      </p>
    </div>
  )
}

// --- Directory List Editor ---

function DirectoryListEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const items = (content.items as {
    label: string
    href: string
    description?: string
  }[]) ?? []
  const image = (content.image as { src: string; alt: string }) ?? {
    src: "",
    alt: "",
  }
  const ctaHeading = (content.ctaHeading as string) ?? ""
  const ctaButton = (content.ctaButton as {
    label: string
    href: string
  }) ?? { label: "", href: "" }

  function updateItem(index: number, field: string, value: string) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, items: updated })
  }

  function removeItem(index: number) {
    onChange({
      ...content,
      items: items.filter((_, i) => i !== index),
    })
  }

  function addItem() {
    onChange({
      ...content,
      items: [...items, { label: "", href: "#", description: "" }],
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Our Directory"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Directory Items ({items.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="size-3.5 mr-1.5" />
            Add Item
          </Button>
        </div>

        {items.map((item, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="text-xs font-medium">Item {i + 1}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Label</Label>
                <Input
                  value={item.label}
                  onChange={(e) => updateItem(i, "label", e.target.value)}
                  placeholder="Item name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Link</Label>
                <Input
                  value={item.href}
                  onChange={(e) => updateItem(i, "href", e.target.value)}
                  placeholder="/page"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Description (optional)
              </Label>
              <Input
                value={item.description ?? ""}
                onChange={(e) =>
                  updateItem(i, "description", e.target.value)
                }
                placeholder="Short description"
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            No items added yet. Click &quot;Add Item&quot; to start.
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Background Image</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image URL</Label>
            <Input
              value={image.src}
              onChange={(e) =>
                onChange({
                  ...content,
                  image: { ...image, src: e.target.value },
                })
              }
              placeholder="https://..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Alt Text</Label>
            <Input
              value={image.alt}
              onChange={(e) =>
                onChange({
                  ...content,
                  image: { ...image, alt: e.target.value },
                })
              }
              placeholder="Directory image"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Bottom CTA</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            CTA Heading
          </Label>
          <Input
            value={ctaHeading}
            onChange={(e) =>
              onChange({ ...content, ctaHeading: e.target.value })
            }
            placeholder="Want to learn more?"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Button Label
            </Label>
            <Input
              value={ctaButton.label}
              onChange={(e) =>
                onChange({
                  ...content,
                  ctaButton: { ...ctaButton, label: e.target.value },
                })
              }
              placeholder="Contact Us"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Button Link
            </Label>
            <Input
              value={ctaButton.href}
              onChange={(e) =>
                onChange({
                  ...content,
                  ctaButton: { ...ctaButton, href: e.target.value },
                })
              }
              placeholder="/contact"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Main export ---

export function MinistryEditor({
  sectionType,
  content,
  onChange,
}: MinistryEditorProps) {
  switch (sectionType) {
    case "MINISTRY_INTRO":
      return <MinistryIntroEditor content={content} onChange={onChange} />
    case "MINISTRY_SCHEDULE":
      return <MinistryScheduleEditor content={content} onChange={onChange} />
    case "CAMPUS_CARD_GRID":
      return <CampusCardGridEditor content={content} onChange={onChange} />
    case "MEET_TEAM":
      return <MeetTeamEditor content={content} onChange={onChange} />
    case "LOCATION_DETAIL":
      return <LocationDetailEditor content={content} onChange={onChange} />
    case "DIRECTORY_LIST":
      return <DirectoryListEditor content={content} onChange={onChange} />
    default:
      return null
  }
}
