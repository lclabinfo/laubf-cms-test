"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { SectionType } from "@/lib/db/types"
import {
  EditorInput,
  EditorTextarea,
  EditorField,
  TwoColumnGrid,
  ImagePickerField,
  AddressField,
  ArrayField,
} from "./shared"

interface MinistryEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

// --- Ministry Intro Editor ---

export function MinistryIntroEditor({
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
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="About This Ministry"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Ministry Name"
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        placeholder="Describe this ministry, its mission, and how people can get involved."
        rows={6}
      />

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Side Image (optional)</Label>
        <ImagePickerField
          label="Image"
          value={image?.src ?? ""}
          onChange={(url) =>
            onChange({
              ...content,
              image: url
                ? {
                    src: url,
                    alt: image?.alt ?? "",
                    objectPosition: image?.objectPosition,
                  }
                : null,
            })
          }
        />
        {image && (
          <TwoColumnGrid>
            <EditorInput
              label="Alt Text"
              value={image.alt}
              onChange={(v) =>
                onChange({
                  ...content,
                  image: { ...image, alt: v },
                })
              }
              placeholder="Ministry image"
            />
            <EditorInput
              label="Object Position"
              value={image.objectPosition ?? ""}
              onChange={(v) =>
                onChange({
                  ...content,
                  image: { ...image, objectPosition: v },
                })
              }
              placeholder="center center"
            />
          </TwoColumnGrid>
        )}
      </div>
    </div>
  )
}

// --- Ministry Schedule Editor ---

export function MinistryScheduleEditor({
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
      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Meeting Times"
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        placeholder="Join us at our regular meeting times."
        rows={4}
      />

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
              <EditorInput
                label="Day"
                value={entry.day}
                onChange={(v) => updateEntry(i, "day", v)}
                placeholder="Sunday"
              />
              <EditorInput
                label="Time"
                value={entry.time}
                onChange={(v) => updateEntry(i, "time", v)}
                placeholder="10:00 AM"
              />
              <EditorInput
                label="Location"
                value={entry.location}
                onChange={(v) => updateEntry(i, "location", v)}
                placeholder="Main Building"
              />
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
              <EditorInput
                label="Label"
                value={btn.label}
                onChange={(v) => updateButton(i, "label", v)}
                placeholder="Get Directions"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <EditorInput
                label="Link"
                value={btn.href}
                onChange={(v) => updateButton(i, "href", v)}
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

export function CampusCardGridEditor({
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
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Our Locations"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Find a Campus"
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        placeholder="We have multiple locations to serve you."
        rows={4}
      />

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

            <TwoColumnGrid>
              <EditorInput
                label="Name"
                value={campus.name}
                onChange={(v) => updateCampus(i, "name", v)}
                placeholder="Main Campus"
              />
              <EditorInput
                label="Link"
                value={campus.href}
                onChange={(v) => updateCampus(i, "href", v)}
                placeholder="/campuses/main"
              />
            </TwoColumnGrid>

            <ImagePickerField
              label="Image (optional)"
              value={campus.image ?? ""}
              onChange={(url) => updateCampus(i, "image", url)}
            />
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

export function MeetTeamEditor({
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

  return (
    <div className="space-y-6">
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Our Team"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Meet the Team"
      />

      <Separator />

      <ArrayField
        label="Team Members"
        items={members}
        onItemsChange={(updated) => onChange({ ...content, members: updated })}
        createItem={() => ({ name: "", role: "", bio: "", image: null })}
        addLabel="Add Member"
        emptyMessage="No team members yet."
        emptyDescription={'Click "Add Member" to start.'}
        reorderable
        renderItem={(member, i, updateItem) => (
          <>
            <TwoColumnGrid>
              <EditorInput
                label="Name"
                value={member.name}
                onChange={(v) => updateItem({ ...member, name: v })}
                placeholder="John Doe"
              />
              <EditorInput
                label="Role"
                value={member.role}
                onChange={(v) => updateItem({ ...member, role: v })}
                placeholder="Pastor"
              />
            </TwoColumnGrid>

            <EditorTextarea
              label="Bio"
              value={member.bio}
              onChange={(v) => updateItem({ ...member, bio: v })}
              placeholder="A short bio about this team member..."
              rows={3}
            />

            <EditorInput
              label="Photo URL (optional)"
              value={member.image ?? ""}
              onChange={(v) =>
                updateItem({ ...member, image: v || null })
              }
              placeholder="https://..."
            />
          </>
        )}
      />
    </div>
  )
}

// --- Location Detail Editor ---

export function LocationDetailEditor({
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

  return (
    <div className="space-y-6">
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Visit Us"
      />

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Service Time</Label>
        <TwoColumnGrid>
          <EditorInput
            label="Label"
            value={timeLabel}
            onChange={(v) => onChange({ ...content, timeLabel: v })}
            placeholder="Service Time"
          />
          <EditorInput
            label="Value"
            value={timeValue}
            onChange={(v) => onChange({ ...content, timeValue: v })}
            placeholder="Sunday 10:00 AM"
          />
        </TwoColumnGrid>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Address</Label>
        <EditorInput
          label="Address Label"
          value={locationLabel}
          onChange={(v) => onChange({ ...content, locationLabel: v })}
          placeholder="Address"
        />
        <AddressField
          label="Address Lines"
          value={address}
          onChange={(lines) => onChange({ ...content, address: lines })}
          placeholder="Address line"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Directions Link</Label>
        <TwoColumnGrid>
          <EditorInput
            label="Label"
            value={directionsLabel}
            onChange={(v) => onChange({ ...content, directionsLabel: v })}
            placeholder="Get Directions"
          />
          <EditorInput
            label="URL"
            value={directionsUrl}
            onChange={(v) => onChange({ ...content, directionsUrl: v })}
            placeholder="https://maps.google.com/..."
          />
        </TwoColumnGrid>
      </div>

      <p className="text-xs text-muted-foreground">
        Location images are configured in the JSON content.
      </p>
    </div>
  )
}

// --- Directory List Editor ---

export function DirectoryListEditor({
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
      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Our Directory"
      />

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

            <TwoColumnGrid>
              <EditorInput
                label="Label"
                value={item.label}
                onChange={(v) => updateItem(i, "label", v)}
                placeholder="Item name"
              />
              <EditorInput
                label="Link"
                value={item.href}
                onChange={(v) => updateItem(i, "href", v)}
                placeholder="/page"
              />
            </TwoColumnGrid>

            <EditorInput
              label="Description (optional)"
              value={item.description ?? ""}
              onChange={(v) => updateItem(i, "description", v)}
              placeholder="Short description"
            />
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
        <ImagePickerField
          label="Image"
          value={image.src}
          onChange={(url) =>
            onChange({
              ...content,
              image: { ...image, src: url },
            })
          }
        />
        <EditorInput
          label="Alt Text"
          value={image.alt}
          onChange={(v) =>
            onChange({
              ...content,
              image: { ...image, alt: v },
            })
          }
          placeholder="Directory image"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Bottom CTA</Label>
        <EditorInput
          label="CTA Heading"
          value={ctaHeading}
          onChange={(v) => onChange({ ...content, ctaHeading: v })}
          placeholder="Want to learn more?"
        />
        <TwoColumnGrid>
          <EditorInput
            label="Button Label"
            value={ctaButton.label}
            onChange={(v) =>
              onChange({
                ...content,
                ctaButton: { ...ctaButton, label: v },
              })
            }
            placeholder="Contact Us"
          />
          <EditorInput
            label="Button Link"
            value={ctaButton.href}
            onChange={(v) =>
              onChange({
                ...content,
                ctaButton: { ...ctaButton, href: v },
              })
            }
            placeholder="/contact"
          />
        </TwoColumnGrid>
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
