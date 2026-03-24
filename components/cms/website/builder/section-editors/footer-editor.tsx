"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"
import {
  EditorTextarea,
  EditorInput,
  TwoColumnGrid,
  SocialLinksField,
  AddressField,
  ArrayField,
} from "./shared"

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

  // --- Contact info ---
  function updateContactField(field: string, value: unknown) {
    onChange({
      ...content,
      contactInfo: { ...contactInfo, [field]: value },
    })
  }

  return (
    <div className="space-y-6">
      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(val) => onChange({ ...content, description: val })}
        placeholder="A brief description of your church or organization."
        className="min-h-[80px]"
      />

      <Separator />

      {/* Social Links */}
      <SocialLinksField
        value={socialLinks.map((l) => ({ platform: l.platform, href: l.url }))}
        onChange={(links) =>
          onChange({
            ...content,
            socialLinks: links.map((l) => ({
              platform: l.platform,
              url: l.href,
            })),
          })
        }
      />

      <Separator />

      {/* Navigation Columns */}
      <ArrayField
        label="Link Columns"
        items={columns}
        onItemsChange={(updated) => onChange({ ...content, columns: updated })}
        createItem={() => ({ heading: "", links: [] })}
        addLabel="Add Column"
        renderItem={(column, colIdx, updateColumn) => (
          <>
            <EditorInput
              label="Column Heading"
              value={column.heading}
              onChange={(val) => updateColumn({ ...column, heading: val })}
              placeholder="About"
              labelSize="xs"
            />

            <div className="space-y-2 pl-4 border-l-2 border-muted">
              {column.links.map((link, linkIdx) => (
                <div key={linkIdx} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Label
                    </Label>
                    <Input
                      value={link.label}
                      onChange={(e) => {
                        const links = [...column.links]
                        links[linkIdx] = { ...links[linkIdx], label: e.target.value }
                        updateColumn({ ...column, links })
                      }}
                      placeholder="Link text"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      URL
                    </Label>
                    <Input
                      value={link.href}
                      onChange={(e) => {
                        const links = [...column.links]
                        links[linkIdx] = { ...links[linkIdx], href: e.target.value }
                        updateColumn({ ...column, links })
                      }}
                      placeholder="/page"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      updateColumn({
                        ...column,
                        links: column.links.filter((_, i) => i !== linkIdx),
                      })
                    }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateColumn({
                    ...column,
                    links: [...column.links, { label: "", href: "" }],
                  })
                }
                className="text-xs font-medium text-primary hover:underline"
              >
                + Add Link
              </button>
            </div>
          </>
        )}
      />

      <Separator />

      {/* Contact Info */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Contact Information</Label>

        <AddressField
          value={contactInfo.address}
          onChange={(lines) => updateContactField("address", lines)}
        />

        <TwoColumnGrid>
          <EditorInput
            label="Phone"
            value={contactInfo.phone}
            onChange={(val) => updateContactField("phone", val)}
            placeholder="(555) 123-4567"
            labelSize="xs"
          />
          <EditorInput
            label="Email"
            value={contactInfo.email}
            onChange={(val) => updateContactField("email", val)}
            placeholder="info@example.com"
            labelSize="xs"
          />
        </TwoColumnGrid>
      </div>
    </div>
  )
}
