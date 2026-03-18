"use client"

import { Separator } from "@/components/ui/separator"
import {
  EditorField,
  EditorInput,
  EditorTextarea,
  EditorButtonGroup,
  TwoColumnGrid,
  ImagePickerField,
  ButtonConfig,
} from "./shared"

// --- Hero Banner Editor ---

export function HeroBannerEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as { line1: string; line2: string }) ?? {
    line1: "",
    line2: "",
  }
  const subheading = (content.subheading as string) ?? ""
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
    objectPosition?: string
  }) ?? { src: "", alt: "" }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-3">
        <EditorField label="Heading" labelSize="sm">
          <div className="space-y-2">
            <EditorInput
              label="Line 1"
              value={heading.line1}
              onChange={(v) =>
                onChange({
                  ...content,
                  heading: { ...heading, line1: v },
                })
              }
              placeholder="Welcome to"
            />
            <EditorInput
              label="Line 2 (accent)"
              value={heading.line2}
              onChange={(v) =>
                onChange({
                  ...content,
                  heading: { ...heading, line2: v },
                })
              }
              placeholder="Our Church"
            />
          </div>
        </EditorField>
      </div>

      {/* Subheading */}
      <EditorTextarea
        label="Subheading"
        labelSize="sm"
        value={subheading}
        onChange={(v) => onChange({ ...content, subheading: v })}
        placeholder="A brief description..."
        rows={4}
      />

      <Separator />

      {/* Background Image */}
      <div className="space-y-3">
        <ImagePickerField
          label="Image"
          value={bgImage.src}
          onChange={(v) =>
            onChange({
              ...content,
              backgroundImage: { ...bgImage, src: v },
            })
          }
        />
        <TwoColumnGrid>
          <EditorInput
            label="Alt Text"
            value={bgImage.alt}
            onChange={(v) =>
              onChange({
                ...content,
                backgroundImage: { ...bgImage, alt: v },
              })
            }
            placeholder="Hero background"
          />
          <EditorInput
            label="Object Position"
            value={bgImage.objectPosition ?? ""}
            onChange={(v) =>
              onChange({
                ...content,
                backgroundImage: {
                  ...bgImage,
                  objectPosition: v,
                },
              })
            }
            placeholder="center center"
          />
        </TwoColumnGrid>
      </div>

      <Separator />

      {/* Buttons */}
      <div className="space-y-3">
        <EditorField label="Buttons" labelSize="sm">
          <div className="space-y-3">
            <ButtonConfig
              id="hero-primary"
              label="Primary Button"
              buttonData={primaryButton}
              onChange={(b) => onChange({ ...content, primaryButton: b })}
            />
            <ButtonConfig
              id="hero-secondary"
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

// --- Page Hero Editor ---

export function PageHeroEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
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

  return (
    <div className="space-y-6">
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Church Name"
      />

      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Welcome"
      />

      <Separator />

      <div className="space-y-3">
        <EditorField label="Buttons" labelSize="sm">
          <div className="space-y-3">
            <ButtonConfig
              id="page-hero-primary"
              label="Primary Button"
              buttonData={primaryButton}
              onChange={(b) => onChange({ ...content, primaryButton: b })}
            />
            <ButtonConfig
              id="page-hero-secondary"
              label="Secondary Button"
              buttonData={secondaryButton}
              onChange={(b) => onChange({ ...content, secondaryButton: b })}
            />
          </div>
        </EditorField>
      </div>

      <p className="text-xs text-muted-foreground">
        Floating images are configured in the JSON content. A visual image
        editor is planned for a future update.
      </p>
    </div>
  )
}

// --- Text Image Hero Editor ---

export function TextImageHeroEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const headingLine1 = (content.headingLine1 as string) ?? ""
  const headingAccent = (content.headingAccent as string) ?? ""
  const description = (content.description as string) ?? ""
  const image = (content.image as {
    src: string
    alt: string
    objectPosition?: string
  }) ?? { src: "", alt: "" }
  const textAlign =
    (content.textAlign as "left" | "center" | "right") ?? "left"

  return (
    <div className="space-y-6">
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="About Us"
      />

      <div className="space-y-3">
        <EditorField label="Heading" labelSize="sm">
          <div className="space-y-2">
            <EditorInput
              label="Line 1"
              value={headingLine1}
              onChange={(v) => onChange({ ...content, headingLine1: v })}
              placeholder="Our Story"
            />
            <EditorInput
              label="Accent Line (optional)"
              value={headingAccent}
              onChange={(v) => onChange({ ...content, headingAccent: v })}
              placeholder="Since 1985"
            />
          </div>
        </EditorField>
      </div>

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        placeholder="Tell visitors about this page..."
        rows={5}
      />

      <Separator />

      {/* Text Alignment */}
      <EditorButtonGroup
        label="Text Alignment"
        value={textAlign}
        onChange={(v) => onChange({ ...content, textAlign: v })}
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
      />

      <Separator />

      {/* Image */}
      <div className="space-y-3">
        <ImagePickerField
          label="Image"
          value={image.src}
          onChange={(v) =>
            onChange({ ...content, image: { ...image, src: v } })
          }
        />
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
            placeholder="Hero image"
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
      </div>
    </div>
  )
}

// --- Events Hero Editor ---

export function EventsHeroEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const subtitle = (content.subtitle as string) ?? ""

  return (
    <div className="space-y-6">
      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Events"
      />
      <EditorTextarea
        label="Subtitle"
        labelSize="sm"
        value={subtitle}
        onChange={(v) => onChange({ ...content, subtitle: v })}
        placeholder="Browse upcoming events..."
        rows={4}
      />
    </div>
  )
}

// --- Ministry Hero Editor ---

export function MinistryHeroEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
  const heading = (content.heading as string) ?? ""
  const headingStyle =
    (content.headingStyle as "display" | "sans") ?? "display"
  const ctaButton = (content.ctaButton as {
    label: string
    href: string
    visible: boolean
  }) ?? { label: "", href: "", visible: false }
  const heroImage = (content.heroImage as {
    src: string
    alt: string
    objectPosition?: string
  }) ?? { src: "", alt: "" }

  return (
    <div className="space-y-6">
      <EditorInput
        label="Overline"
        labelSize="sm"
        value={overline}
        onChange={(v) => onChange({ ...content, overline: v })}
        placeholder="Ministry name"
      />

      <EditorTextarea
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Ministry heading (use newlines for line breaks)"
        rows={4}
      />

      <EditorButtonGroup
        label="Heading Style"
        value={headingStyle}
        onChange={(v) => onChange({ ...content, headingStyle: v })}
        options={[
          { value: "display", label: "Display" },
          { value: "sans", label: "Sans" },
        ]}
      />

      <Separator />

      <ButtonConfig
        id="ministry-hero-cta"
        label="CTA Button"
        buttonData={ctaButton}
        onChange={(b) => onChange({ ...content, ctaButton: b })}
      />

      <Separator />

      <div className="space-y-3">
        <ImagePickerField
          label="Image"
          value={heroImage.src}
          onChange={(v) =>
            onChange({ ...content, heroImage: { ...heroImage, src: v } })
          }
        />
        <TwoColumnGrid>
          <EditorInput
            label="Alt Text"
            value={heroImage.alt}
            onChange={(v) =>
              onChange({
                ...content,
                heroImage: { ...heroImage, alt: v },
              })
            }
            placeholder="Ministry banner"
          />
          <EditorInput
            label="Object Position"
            value={heroImage.objectPosition ?? ""}
            onChange={(v) =>
              onChange({
                ...content,
                heroImage: {
                  ...heroImage,
                  objectPosition: v,
                },
              })
            }
            placeholder="center center"
          />
        </TwoColumnGrid>
      </div>

      <p className="text-xs text-muted-foreground">
        Social links are configured in the JSON content. A dedicated social
        links editor is planned for a future update.
      </p>
    </div>
  )
}

