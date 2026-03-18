"use client"

import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { SectionType } from "@/lib/db/types"
import {
  EditorField,
  EditorInput,
  EditorTextarea,
  EditorToggle,
  TwoColumnGrid,
  ImagePickerField,
  ButtonConfig,
} from "./shared"

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

  return (
    <div className="space-y-6">
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Section label"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Section heading"
      />

      <EditorTextarea
        label="Body"
        labelSize="sm"
        value={body}
        onChange={(v) => onChange({ ...content, body: v })}
        placeholder="Section body text..."
        rows={6}
      />

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
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Scripture"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Our Foundation"
      />

      <Separator />

      <div className="space-y-3">
        <EditorField label="Quote / Verse" labelSize="sm">
          <div className="space-y-3">
            <EditorTextarea
              label="Text"
              value={verse.text}
              onChange={(v) =>
                onChange({
                  ...content,
                  verse: { ...verse, text: v },
                })
              }
              placeholder="Enter the quote or verse text..."
              rows={6}
            />
            <EditorInput
              label="Reference"
              value={verse.reference}
              onChange={(v) =>
                onChange({
                  ...content,
                  verse: { ...verse, reference: v },
                })
              }
              placeholder="John 15:5"
            />
          </div>
        </EditorField>
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
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Section label"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Call to action heading"
      />

      <EditorTextarea
        label="Body"
        labelSize="sm"
        value={body}
        onChange={(v) => onChange({ ...content, body: v })}
        placeholder="Description text..."
        rows={5}
      />

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
        <EditorField label="Buttons" labelSize="sm">
          <div className="space-y-3">
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
        </EditorField>
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

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="About Us"
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        placeholder="Tell your story..."
        rows={8}
      />

      <Separator />

      <div className="space-y-3">
        <EditorField label="Video (optional)" labelSize="sm">
          <div className="space-y-3">
            <EditorInput
              label="Embed URL"
              value={videoUrl}
              onChange={(v) => onChange({ ...content, videoUrl: v })}
              placeholder="https://www.youtube.com/embed/..."
            />
            <EditorInput
              label="Video Title"
              value={videoTitle}
              onChange={(v) => onChange({ ...content, videoTitle: v })}
              placeholder="About video"
            />
          </div>
        </EditorField>
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
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Our Mission"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="What We Believe"
      />

      <EditorInput
        label="Lead-In Text"
        labelSize="sm"
        value={leadIn}
        onChange={(v) => onChange({ ...content, leadIn: v })}
        placeholder="Sticky left column text"
      />

      <EditorToggle
        label="Show Cross Icon"
        checked={showIcon}
        onCheckedChange={(v) => onChange({ ...content, showIcon: v })}
      />

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <EditorField label="Paragraphs" labelSize="sm">
            <></>
          </EditorField>
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
      <EditorInput
        label="Section Heading"
        labelSize="sm"
        value={sectionHeading}
        onChange={(v) => onChange({ ...content, sectionHeading: v })}
        placeholder="Latest Message"
      />

      <Separator />

      <div className="space-y-3">
        <EditorField label="Featured Sermon" labelSize="sm">
          <div className="space-y-3">
            <EditorInput
              label="Title"
              value={sermon.title}
              onChange={(v) => updateSermon("title", v)}
              placeholder="Sermon title"
            />

            <TwoColumnGrid>
              <EditorInput
                label="Speaker"
                value={sermon.speaker}
                onChange={(v) => updateSermon("speaker", v)}
                placeholder="Speaker name"
              />
              <EditorInput
                label="Date"
                value={sermon.date}
                onChange={(v) => updateSermon("date", v)}
                placeholder="January 1, 2026"
              />
            </TwoColumnGrid>

            <TwoColumnGrid>
              <EditorInput
                label="Series"
                value={sermon.series ?? ""}
                onChange={(v) => updateSermon("series", v)}
                placeholder="Series name"
              />
              <EditorInput
                label="Slug"
                value={sermon.slug ?? ""}
                onChange={(v) => updateSermon("slug", v)}
                placeholder="sermon-slug"
              />
            </TwoColumnGrid>

            <ImagePickerField
              label="Thumbnail"
              value={sermon.thumbnailUrl ?? ""}
              onChange={(url) => updateSermon("thumbnailUrl", url)}
            />

            <EditorInput
              label="Video URL"
              value={sermon.videoUrl ?? ""}
              onChange={(v) => updateSermon("videoUrl", v)}
              placeholder="https://..."
            />
          </div>
        </EditorField>
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
