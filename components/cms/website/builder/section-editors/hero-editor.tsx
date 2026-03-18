"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import type { SectionType } from "@/lib/db/types"
import { ImagePickerField, ButtonConfig } from "./shared"

interface HeroEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

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
  const bgVideo = (content.backgroundVideo as {
    src: string
    mobileSrc?: string
  }) ?? { src: "", mobileSrc: "" }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Heading</Label>
        <div className="space-y-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Line 1</Label>
            <Input
              value={heading.line1}
              onChange={(e) =>
                onChange({
                  ...content,
                  heading: { ...heading, line1: e.target.value },
                })
              }
              placeholder="Welcome to"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Line 2 (accent)
            </Label>
            <Input
              value={heading.line2}
              onChange={(e) =>
                onChange({
                  ...content,
                  heading: { ...heading, line2: e.target.value },
                })
              }
              placeholder="Our Church"
            />
          </div>
        </div>
      </div>

      {/* Subheading */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subheading</Label>
        <Textarea
          value={subheading}
          onChange={(e) =>
            onChange({ ...content, subheading: e.target.value })
          }
          placeholder="A brief description..."
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      {/* Background Image */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Background Image</Label>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Alt Text</Label>
            <Input
              value={bgImage.alt}
              onChange={(e) =>
                onChange({
                  ...content,
                  backgroundImage: { ...bgImage, alt: e.target.value },
                })
              }
              placeholder="Hero background"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Object Position
            </Label>
            <Input
              value={bgImage.objectPosition ?? ""}
              onChange={(e) =>
                onChange({
                  ...content,
                  backgroundImage: {
                    ...bgImage,
                    objectPosition: e.target.value,
                  },
                })
              }
              placeholder="center center"
            />
          </div>
        </div>
      </div>

      {/* Background Video */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Background Video</Label>
        <p className="text-xs text-muted-foreground">
          When a video URL is set, it plays as the background instead of the image.
        </p>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Video URL (desktop)
          </Label>
          <Input
            value={bgVideo.src}
            onChange={(e) =>
              onChange({
                ...content,
                backgroundVideo: { ...bgVideo, src: e.target.value },
              })
            }
            placeholder="https://example.com/hero-video.mp4"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Mobile Video URL (optional)
          </Label>
          <Input
            value={bgVideo.mobileSrc ?? ""}
            onChange={(e) =>
              onChange({
                ...content,
                backgroundVideo: { ...bgVideo, mobileSrc: e.target.value },
              })
            }
            placeholder="https://example.com/hero-video-mobile.mp4"
          />
        </div>
      </div>

      <Separator />

      {/* Buttons */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Buttons</Label>
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) =>
            onChange({ ...content, overline: e.target.value })
          }
          placeholder="Church Name"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) =>
            onChange({ ...content, heading: e.target.value })
          }
          placeholder="Welcome"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Buttons</Label>
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) =>
            onChange({ ...content, overline: e.target.value })
          }
          placeholder="About Us"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-medium">Heading</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Line 1</Label>
          <Input
            value={headingLine1}
            onChange={(e) =>
              onChange({ ...content, headingLine1: e.target.value })
            }
            placeholder="Our Story"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Accent Line (optional)
          </Label>
          <Input
            value={headingAccent}
            onChange={(e) =>
              onChange({ ...content, headingAccent: e.target.value })
            }
            placeholder="Since 1985"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          placeholder="Tell visitors about this page..."
          className="min-h-[100px]"
        />
      </div>

      <Separator />

      {/* Text Alignment */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Text Alignment</Label>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => onChange({ ...content, textAlign: align })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                textAlign === align
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Image */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Hero Image</Label>
        <ImagePickerField
          label="Image"
          value={image.src}
          onChange={(v) =>
            onChange({ ...content, image: { ...image, src: v } })
          }
        />
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
              placeholder="Hero image"
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) =>
            onChange({ ...content, heading: e.target.value })
          }
          placeholder="Events"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subtitle</Label>
        <Textarea
          value={subtitle}
          onChange={(e) =>
            onChange({ ...content, subtitle: e.target.value })
          }
          placeholder="Browse upcoming events..."
          className="min-h-[80px]"
        />
      </div>
    </div>
  )
}

// --- Ministry Hero Editor ---

const SOCIAL_PLATFORM_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "website", label: "Website" },
  { value: "twitter", label: "Twitter" },
] as const

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
  const socialLinks = (content.socialLinks as { platform: string; href: string }[]) ?? []
  const heroImage = (content.heroImage as {
    src: string
    alt: string
    objectPosition?: string
  }) ?? { src: "", alt: "" }

  const addSocialLink = () => {
    onChange({
      ...content,
      socialLinks: [...socialLinks, { platform: "website", href: "" }],
    })
  }

  const removeSocialLink = (index: number) => {
    onChange({
      ...content,
      socialLinks: socialLinks.filter((_, i) => i !== index),
    })
  }

  const updateSocialLink = (index: number, field: "platform" | "href", value: string) => {
    const updated = socialLinks.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    )
    onChange({ ...content, socialLinks: updated })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) =>
            onChange({ ...content, overline: e.target.value })
          }
          placeholder="Ministry name"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Textarea
          value={heading}
          onChange={(e) =>
            onChange({ ...content, heading: e.target.value })
          }
          placeholder="Ministry heading (use newlines for line breaks)"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading Style</Label>
        <div className="flex gap-2">
          {(["display", "sans"] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => onChange({ ...content, headingStyle: style })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                headingStyle === style
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <ButtonConfig
        id="ministry-hero-cta"
        label="CTA Button"
        buttonData={ctaButton}
        onChange={(b) => onChange({ ...content, ctaButton: b })}
      />

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Hero Image</Label>
        <ImagePickerField
          label="Image"
          value={heroImage.src}
          onChange={(v) =>
            onChange({ ...content, heroImage: { ...heroImage, src: v } })
          }
        />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Alt Text</Label>
            <Input
              value={heroImage.alt}
              onChange={(e) =>
                onChange({
                  ...content,
                  heroImage: { ...heroImage, alt: e.target.value },
                })
              }
              placeholder="Ministry banner"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Object Position
            </Label>
            <Input
              value={heroImage.objectPosition ?? ""}
              onChange={(e) =>
                onChange({
                  ...content,
                  heroImage: {
                    ...heroImage,
                    objectPosition: e.target.value,
                  },
                })
              }
              placeholder="center center"
            />
          </div>
        </div>
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
          <div
            key={i}
            className="rounded-lg border p-4 space-y-3 relative group"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Link {i + 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeSocialLink(i)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Platform</Label>
              <Select
                value={link.platform}
                onValueChange={(v) => updateSocialLink(i, "platform", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                value={link.href}
                onChange={(e) => updateSocialLink(i, "href", e.target.value)}
                placeholder={
                  link.platform === "email"
                    ? "mailto:info@example.com"
                    : "https://..."
                }
              />
            </div>
          </div>
        ))}

        {socialLinks.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">
              No social links added yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click &quot;Add Link&quot; to add a social media link.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main export ---

export function HeroEditor({ sectionType, content, onChange }: HeroEditorProps) {
  switch (sectionType) {
    case "HERO_BANNER":
      return <HeroBannerEditor content={content} onChange={onChange} />
    case "PAGE_HERO":
      return <PageHeroEditor content={content} onChange={onChange} />
    case "TEXT_IMAGE_HERO":
      return <TextImageHeroEditor content={content} onChange={onChange} />
    case "EVENTS_HERO":
      return <EventsHeroEditor content={content} onChange={onChange} />
    case "MINISTRY_HERO":
      return <MinistryHeroEditor content={content} onChange={onChange} />
    default:
      return null
  }
}
