"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import type { SectionType } from "@/lib/db/types"

interface ContentEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

// --- Helper subcomponents ---

function ButtonConfig({
  id,
  label,
  buttonData,
  onChange,
}: {
  id: string
  label: string
  buttonData: { label: string; href: string; visible: boolean }
  onChange: (data: { label: string; href: string; visible: boolean }) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Switch
          id={`${id}-visible`}
          checked={buttonData.visible}
          onCheckedChange={(v) => onChange({ ...buttonData, visible: v })}
        />
      </div>
      {buttonData.visible && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Button Text</Label>
            <Input
              value={buttonData.label}
              onChange={(e) =>
                onChange({ ...buttonData, label: e.target.value })
              }
              placeholder="Learn More"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Link URL</Label>
            <Input
              value={buttonData.href}
              onChange={(e) =>
                onChange({ ...buttonData, href: e.target.value })
              }
              placeholder="/about"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// --- Media Text Editor ---

function MediaTextEditor({
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

      <p className="text-xs text-muted-foreground">
        Rotating images are configured in the JSON content. An image gallery
        editor is planned for a future update.
      </p>
    </div>
  )
}

// --- Quote Banner Editor ---

function QuoteBannerEditor({
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

function CTABannerEditor({
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

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Background Image URL (optional)
        </Label>
        <Input
          value={bgImage?.src ?? ""}
          onChange={(e) =>
            onChange({
              ...content,
              backgroundImage: e.target.value
                ? { src: e.target.value, alt: bgImage?.alt ?? "" }
                : undefined,
            })
          }
          placeholder="https://..."
        />
      </div>

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

function AboutDescriptionEditor({
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Logo Image URL</Label>
        <Input
          value={logoSrc}
          onChange={(e) =>
            onChange({ ...content, logoSrc: e.target.value })
          }
          placeholder="https://..."
        />
      </div>

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

function StatementEditor({
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

function SpotlightMediaEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const sectionHeading = (content.sectionHeading as string) ?? ""
  const sermon = (content.sermon as {
    slug?: string
    title: string
    speaker: string
    date: string
    series?: string
    thumbnailUrl?: string | null
    videoUrl?: string
  }) ?? {
    title: "",
    speaker: "",
    date: "",
  }

  function updateSermon(field: string, value: string) {
    onChange({
      ...content,
      sermon: { ...sermon, [field]: value },
    })
  }

  return (
    <div className="space-y-6">
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

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Featured Sermon</Label>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <Input
            value={sermon.title}
            onChange={(e) => updateSermon("title", e.target.value)}
            placeholder="Sermon title"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Speaker</Label>
            <Input
              value={sermon.speaker}
              onChange={(e) => updateSermon("speaker", e.target.value)}
              placeholder="Speaker name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Input
              value={sermon.date}
              onChange={(e) => updateSermon("date", e.target.value)}
              placeholder="January 1, 2026"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Series</Label>
            <Input
              value={sermon.series ?? ""}
              onChange={(e) => updateSermon("series", e.target.value)}
              placeholder="Series name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Slug</Label>
            <Input
              value={sermon.slug ?? ""}
              onChange={(e) => updateSermon("slug", e.target.value)}
              placeholder="sermon-slug"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Thumbnail URL
          </Label>
          <Input
            value={sermon.thumbnailUrl ?? ""}
            onChange={(e) => updateSermon("thumbnailUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Video URL
          </Label>
          <Input
            value={sermon.videoUrl ?? ""}
            onChange={(e) => updateSermon("videoUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>
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
