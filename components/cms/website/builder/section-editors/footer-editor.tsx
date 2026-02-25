"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical } from "lucide-react"

interface FooterEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

export function FooterEditor({ content, onChange }: FooterEditorProps) {
  const description = (content.description as string) ?? ""
  const socialLinks = (content.socialLinks as {
    platform: string
    url: string
  }[]) ?? []
  const columns = (content.columns as {
    heading: string
    links: { label: string; href: string }[]
  }[]) ?? []
  const contactInfo = (content.contactInfo as {
    address: string[]
    phone: string
    email: string
  }) ?? { address: [], phone: "", email: "" }

  // --- Social links ---
  function updateSocialLink(index: number, field: string, value: string) {
    const updated = [...socialLinks]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, socialLinks: updated })
  }

  function removeSocialLink(index: number) {
    onChange({
      ...content,
      socialLinks: socialLinks.filter((_, i) => i !== index),
    })
  }

  function addSocialLink() {
    onChange({
      ...content,
      socialLinks: [...socialLinks, { platform: "", url: "" }],
    })
  }

  // --- Columns ---
  function updateColumnHeading(index: number, heading: string) {
    const updated = [...columns]
    updated[index] = { ...updated[index], heading }
    onChange({ ...content, columns: updated })
  }

  function removeColumn(index: number) {
    onChange({
      ...content,
      columns: columns.filter((_, i) => i !== index),
    })
  }

  function addColumn() {
    onChange({
      ...content,
      columns: [...columns, { heading: "", links: [] }],
    })
  }

  function updateColumnLink(
    colIndex: number,
    linkIndex: number,
    field: "label" | "href",
    value: string,
  ) {
    const updated = [...columns]
    const links = [...updated[colIndex].links]
    links[linkIndex] = { ...links[linkIndex], [field]: value }
    updated[colIndex] = { ...updated[colIndex], links }
    onChange({ ...content, columns: updated })
  }

  function removeColumnLink(colIndex: number, linkIndex: number) {
    const updated = [...columns]
    updated[colIndex] = {
      ...updated[colIndex],
      links: updated[colIndex].links.filter((_, i) => i !== linkIndex),
    }
    onChange({ ...content, columns: updated })
  }

  function addColumnLink(colIndex: number) {
    const updated = [...columns]
    updated[colIndex] = {
      ...updated[colIndex],
      links: [...updated[colIndex].links, { label: "", href: "" }],
    }
    onChange({ ...content, columns: updated })
  }

  // --- Contact info ---
  function updateContactField(field: string, value: unknown) {
    onChange({
      ...content,
      contactInfo: { ...contactInfo, [field]: value },
    })
  }

  function updateAddressLine(index: number, value: string) {
    const updated = [...contactInfo.address]
    updated[index] = value
    updateContactField("address", updated)
  }

  function addAddressLine() {
    updateContactField("address", [...contactInfo.address, ""])
  }

  function removeAddressLine(index: number) {
    updateContactField(
      "address",
      contactInfo.address.filter((_, i) => i !== index),
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="A brief description of your church or organization."
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      {/* Social Links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Social Links ({socialLinks.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addSocialLink}>
            <Plus className="size-3.5 mr-1.5" />
            Add Link
          </Button>
        </div>

        {socialLinks.map((link, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-32 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Platform</Label>
              <Input
                value={link.platform}
                onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                placeholder="instagram"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                value={link.url}
                onChange={(e) => updateSocialLink(i, "url", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => removeSocialLink(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      {/* Navigation Columns */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Link Columns ({columns.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="size-3.5 mr-1.5" />
            Add Column
          </Button>
        </div>

        {columns.map((column, colIdx) => (
          <div
            key={colIdx}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="text-xs font-medium">
                  Column {colIdx + 1}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeColumn(colIdx)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Column Heading
              </Label>
              <Input
                value={column.heading}
                onChange={(e) =>
                  updateColumnHeading(colIdx, e.target.value)
                }
                placeholder="About"
              />
            </div>

            <div className="space-y-2 pl-4 border-l-2 border-muted">
              {column.links.map((link, linkIdx) => (
                <div key={linkIdx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Label
                    </Label>
                    <Input
                      value={link.label}
                      onChange={(e) =>
                        updateColumnLink(
                          colIdx,
                          linkIdx,
                          "label",
                          e.target.value,
                        )
                      }
                      placeholder="Link text"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      URL
                    </Label>
                    <Input
                      value={link.href}
                      onChange={(e) =>
                        updateColumnLink(
                          colIdx,
                          linkIdx,
                          "href",
                          e.target.value,
                        )
                      }
                      placeholder="/page"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeColumnLink(colIdx, linkIdx)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addColumnLink(colIdx)}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Add Link
              </button>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Contact Info */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Contact Information</Label>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              Address Lines
            </Label>
            <button
              type="button"
              onClick={addAddressLine}
              className="text-xs font-medium text-primary hover:underline"
            >
              + Add Line
            </button>
          </div>
          {contactInfo.address.map((line, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={line}
                onChange={(e) => updateAddressLine(i, e.target.value)}
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              value={contactInfo.phone}
              onChange={(e) => updateContactField("phone", e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              value={contactInfo.email}
              onChange={(e) => updateContactField("email", e.target.value)}
              placeholder="info@example.com"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
