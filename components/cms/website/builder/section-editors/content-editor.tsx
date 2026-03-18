"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical, ImageIcon, Database } from "lucide-react"
import type { SectionType } from "@/lib/db/types"
import { ImagePickerField, ButtonConfig } from "./shared"

interface ContentEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

// --- Media Text Editor ---

export function MediaTextEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const body = (content.body as string) ?? ""
  const button = (content.button as {
    label: string
    href: string
    visible: boolean
  }) ?? { label: "", href: "", visible: false }
  const images = (content.images as {
    src: string
    alt: string
    objectPosition?: string
  }[]) ?? []

  function updateImage(index: number, field: string, value: string) {
    const updated = [...images]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, images: updated })
  }

  function removeImage(index: number) {
    onChange({
      ...content,
      images: images.filter((_, i) => i !== index),
    })
  }

  function addImage() {
    onChange({
      ...content,
      images: [...images, { src: "", alt: "" }],
    })
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= images.length) return
    const updated = [...images]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    onChange({ ...content, images: updated })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Section label"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Section heading"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Body</Label>
        <Textarea
          value={body}
          onChange={(e) => onChange({ ...content, body: e.target.value })}
          placeholder="Section body text..."
          className="min-h-[120px]"
        />
      </div>

      <Separator />

      <ButtonConfig
        id="media-text-btn"
        label="CTA Button"
        buttonData={button}
        onChange={(b) => onChange({ ...content, button: b })}
      />

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Images ({images.length})
          </Label>
          <Button variant="outline" size="sm" onClick={addImage}>
            <Plus className="size-3.5 mr-1.5" />
            Add Image
          </Button>
        </div>

        {images.map((image, i) => (
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <GripVertical className="size-4" />
                <ImageIcon className="size-3.5" />
                <span className="text-xs font-medium">Image {i + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  onClick={() => moveImage(i, i - 1)}
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
                  onClick={() => moveImage(i, i + 1)}
                  disabled={i === images.length - 1}
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
                  onClick={() => removeImage(i)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <ImagePickerField
              label="Image"
              value={image.src}
              onChange={(url) => updateImage(i, "src", url)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Alt Text
                </Label>
                <Input
                  value={image.alt}
                  onChange={(e) => updateImage(i, "alt", e.target.value)}
                  placeholder="Photo description"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Object Position
                </Label>
                <Input
                  value={image.objectPosition ?? ""}
                  onChange={(e) =>
                    updateImage(i, "objectPosition", e.target.value)
                  }
                  placeholder="center center"
                />
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No images added yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add Image&quot; to build the rotating carousel.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Quote Banner Editor ---

export function QuoteBannerEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const verse = (content.verse as { text: string; reference: string }) ?? {
    text: "",
    reference: "",
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Scripture"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Our Foundation"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Quote / Verse</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Text</Label>
          <Textarea
            value={verse.text}
            onChange={(e) =>
              onChange({
                ...content,
                verse: { ...verse, text: e.target.value },
              })
            }
            placeholder="Enter the quote or verse text..."
            className="min-h-[120px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Reference</Label>
          <Input
            value={verse.reference}
            onChange={(e) =>
              onChange({
                ...content,
                verse: { ...verse, reference: e.target.value },
              })
            }
            placeholder="John 15:5"
          />
        </div>
      </div>
    </div>
  )
}

// --- CTA Banner Editor ---

export function CTABannerEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const body = (content.body as string) ?? ""
  const primaryButton = (content.primaryButton as {
    label: string
    href: string
    visible: boolean
  }) ?? { label: "", href: "", visible: false }
  const secondaryButton = (content.secondaryButton as {
    label: string
    href: string
    visible: boolean
  }) ?? { label: "", href: "", visible: false }
  const bgImage = (content.backgroundImage as {
    src: string
    alt: string
  }) ?? null

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Section label"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="Call to action heading"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Body</Label>
        <Textarea
          value={body}
          onChange={(e) => onChange({ ...content, body: e.target.value })}
          placeholder="Description text..."
          className="min-h-[100px]"
        />
      </div>

      <Separator />

      <ImagePickerField
        label="Background Image (optional)"
        value={bgImage?.src ?? ""}
        onChange={(url) =>
          onChange({
            ...content,
            backgroundImage: url
              ? { src: url, alt: bgImage?.alt ?? "" }
              : undefined,
          })
        }
      />

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Buttons</Label>
        <ButtonConfig
          id="cta-primary"
          label="Primary Button"
          buttonData={primaryButton}
          onChange={(b) => onChange({ ...content, primaryButton: b })}
        />
        <ButtonConfig
          id="cta-secondary"
          label="Secondary Button"
          buttonData={secondaryButton}
          onChange={(b) => onChange({ ...content, secondaryButton: b })}
        />
      </div>
    </div>
  )
}

// --- About Description Editor ---

export function AboutDescriptionEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const logoSrc = (content.logoSrc as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const videoUrl = (content.videoUrl as string) ?? ""
  const videoTitle = (content.videoTitle as string) ?? ""

  return (
    <div className="space-y-6">
      <ImagePickerField
        label="Logo Image"
        value={logoSrc}
        onChange={(url) => onChange({ ...content, logoSrc: url })}
      />

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) =>
            onChange({ ...content, heading: e.target.value })
          }
          placeholder="About Us"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="Tell your story..."
          className="min-h-[160px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Video (optional)</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Embed URL</Label>
          <Input
            value={videoUrl}
            onChange={(e) =>
              onChange({ ...content, videoUrl: e.target.value })
            }
            placeholder="https://www.youtube.com/embed/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Video Title</Label>
          <Input
            value={videoTitle}
            onChange={(e) =>
              onChange({ ...content, videoTitle: e.target.value })
            }
            placeholder="About video"
          />
        </div>
      </div>
    </div>
  )
}

// --- Statement Editor ---

export function StatementEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const leadIn = (content.leadIn as string) ?? ""
  const showIcon = (content.showIcon as boolean) ?? false
  const paragraphs = (content.paragraphs as { text: string; isBold?: boolean }[]) ?? []

  function updateParagraph(index: number, text: string) {
    const updated = [...paragraphs]
    updated[index] = { ...updated[index], text }
    onChange({ ...content, paragraphs: updated })
  }

  function addParagraph() {
    onChange({
      ...content,
      paragraphs: [...paragraphs, { text: "" }],
    })
  }

  function removeParagraph(index: number) {
    onChange({
      ...content,
      paragraphs: paragraphs.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
          placeholder="Our Mission"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="What We Believe"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Lead-In Text</Label>
        <Input
          value={leadIn}
          onChange={(e) => onChange({ ...content, leadIn: e.target.value })}
          placeholder="Sticky left column text"
        />
      </div>

      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Show Cross Icon</Label>
        <Switch
          checked={showIcon}
          onCheckedChange={(v) => onChange({ ...content, showIcon: v })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Paragraphs</Label>
          <button
            type="button"
            onClick={addParagraph}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add Paragraph
          </button>
        </div>
        {paragraphs.map((para, i) => (
          <div key={i} className="flex gap-2">
            <Textarea
              value={para.text}
              onChange={(e) => updateParagraph(i, e.target.value)}
              placeholder={`Paragraph ${i + 1}`}
              className="min-h-[80px] flex-1"
            />
            <button
              type="button"
              onClick={() => removeParagraph(i)}
              className="self-start rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Remove paragraph"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
        {paragraphs.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
            No paragraphs yet. Click &quot;+ Add Paragraph&quot; to start.
          </div>
        )}
      </div>
    </div>
  )
}

// --- Spotlight Media Editor ---

export function SpotlightMediaEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const sectionHeading = (content.sectionHeading as string) ?? ""

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
        <Database className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
            Data-Driven Section
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Content is auto-populated from the latest published message in your
            CMS. The sermon title, speaker, date, series, thumbnail, and video
            are all pulled automatically.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Section Heading</Label>
        <Input
          value={sectionHeading}
          onChange={(e) =>
            onChange({ ...content, sectionHeading: e.target.value })
          }
          placeholder="Latest Message"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        To change the featured message content, edit it in the CMS Messages
        module. The most recently published message will appear here
        automatically.
      </p>
    </div>
  )
}

// --- Main export ---

export function ContentEditor({
  sectionType,
  content,
  onChange,
}: ContentEditorProps) {
  switch (sectionType) {
    case "MEDIA_TEXT":
      return <MediaTextEditor content={content} onChange={onChange} />
    case "QUOTE_BANNER":
      return <QuoteBannerEditor content={content} onChange={onChange} />
    case "CTA_BANNER":
      return <CTABannerEditor content={content} onChange={onChange} />
    case "ABOUT_DESCRIPTION":
      return <AboutDescriptionEditor content={content} onChange={onChange} />
    case "STATEMENT":
      return <StatementEditor content={content} onChange={onChange} />
    case "SPOTLIGHT_MEDIA":
      return <SpotlightMediaEditor content={content} onChange={onChange} />
    default:
      return null
  }
}
