"use client"

import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"
import {
  EditorField,
  EditorInput,
  EditorTextarea,
  EditorButtonGroup,
  CarouselSpeedField,
  ImagePickerField,
  ImageListField,
  VideoPickerField,
  ButtonConfig,
} from "./shared"

// --- Layout Arrangement Picker (for split layout) ---

const splitArrangements = [
  {
    value: "text-left",
    label: "Text Left / Image Right",
    renderThumb: () => (
      <div className="flex h-full gap-1 p-1.5">
        <div className="flex flex-1 flex-col justify-center gap-1 px-1">
          <div className="h-1 w-3/4 rounded-full bg-current opacity-60" />
          <div className="h-1 w-full rounded-full bg-current opacity-40" />
          <div className="h-1 w-2/3 rounded-full bg-current opacity-40" />
        </div>
        <div className="flex flex-1 items-center justify-center rounded bg-current opacity-15">
          <ImageIcon className="size-3.5 opacity-40" />
        </div>
      </div>
    ),
  },
  {
    value: "image-left",
    label: "Image Left / Text Right",
    renderThumb: () => (
      <div className="flex h-full gap-1 p-1.5">
        <div className="flex flex-1 items-center justify-center rounded bg-current opacity-15">
          <ImageIcon className="size-3.5 opacity-40" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-1 px-1">
          <div className="h-1 w-3/4 rounded-full bg-current opacity-60" />
          <div className="h-1 w-full rounded-full bg-current opacity-40" />
          <div className="h-1 w-2/3 rounded-full bg-current opacity-40" />
        </div>
      </div>
    ),
  },
  {
    value: "text-top",
    label: "Text Top / Image Bottom",
    renderThumb: () => (
      <div className="flex h-full flex-col gap-1 p-1.5">
        <div className="flex flex-1 flex-col justify-center gap-0.5 px-1">
          <div className="h-1 w-3/4 rounded-full bg-current opacity-60" />
          <div className="h-1 w-full rounded-full bg-current opacity-40" />
        </div>
        <div className="flex flex-1 items-center justify-center rounded bg-current opacity-15">
          <ImageIcon className="size-3 opacity-40" />
        </div>
      </div>
    ),
  },
  {
    value: "image-top",
    label: "Image Top / Text Bottom",
    renderThumb: () => (
      <div className="flex h-full flex-col gap-1 p-1.5">
        <div className="flex flex-1 items-center justify-center rounded bg-current opacity-15">
          <ImageIcon className="size-3 opacity-40" />
        </div>
        <div className="flex flex-1 flex-col justify-center gap-0.5 px-1">
          <div className="h-1 w-3/4 rounded-full bg-current opacity-60" />
          <div className="h-1 w-full rounded-full bg-current opacity-40" />
        </div>
      </div>
    ),
  },
] as const

function LayoutArrangementPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Arrangement</Label>
      <div className="grid grid-cols-2 gap-2">
        {splitArrangements.map((arr) => (
          <button
            key={arr.value}
            type="button"
            onClick={() => onChange(arr.value)}
            className={cn(
              "h-14 w-full rounded-md border-2 transition-colors text-foreground",
              value === arr.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/40 text-muted-foreground"
            )}
            title={arr.label}
          >
            {arr.renderThumb()}
          </button>
        ))}
      </div>
    </div>
  )
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
  const legacyMobileVideo = (content.mobileVideo as { src?: string })?.src || ""
  const posterImage = (content.posterImage as {
    src: string
    alt: string
  }) ?? { src: "", alt: "" }

  // Helper to detect video file URLs
  const isVideoSrc = (src: string) => /\.(mp4|webm|mov|ogg)(\?|$)/i.test(src)

  // Multi-image support: read images array, fall back to single backgroundImage
  // Filter out video files — those belong in the video section
  const rawImages = (content.images as Array<{ src: string; alt: string }>) ??
    (bgImage.src && !isVideoSrc(bgImage.src) ? [{ src: bgImage.src, alt: bgImage.alt }] : [])
  const images = rawImages.filter((img) => !isVideoSrc(img.src))

  // Layout variant (needed to determine which image fields to show)
  const layout = (content.layout as string) || "fullwidth"

  // Trust saved mediaType once set; only infer from content when not saved
  const mediaType = (content.mediaType as string) || (bgVideo.src ? "video" : "image")

  return (
    <div className="space-y-6">
      {/* === Content (always visible) === */}

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

      {/* Media Type selector */}
      <EditorButtonGroup
        label="Media Type"
        value={mediaType}
        onChange={(v) => onChange({ ...content, mediaType: v })}
        options={[
          { value: "image", label: "Image" },
          { value: "video", label: "Video" },
        ]}
        size="sm"
      />

      {/* Image fields */}
      {mediaType === "image" && layout === "contained" && (
        <div className="space-y-3">
          <ImagePickerField
            label="Featured Image"
            value={bgImage.src}
            onChange={(v) =>
              onChange({
                ...content,
                backgroundImage: { ...bgImage, src: v },
                images: v ? [{ src: v, alt: bgImage.alt || "" }] : [],
              })
            }
          />
        </div>
      )}
      {mediaType === "image" && layout !== "contained" && (
        <div className="space-y-3">
          <ImageListField
            label={layout === "split" ? "Images" : "Background Images"}
            images={images}
            onChange={(imgs) => {
              // Write images array + backward-compat backgroundImage
              const backgroundImage = imgs.length > 0
                ? { ...bgImage, src: imgs[0].src, alt: imgs[0].alt }
                : { src: "", alt: "" }
              onChange({
                ...content,
                images: imgs,
                backgroundImage,
              })
            }}
            maxImages={10}
          />
        </div>
      )}

      {/* Video fields */}
      {mediaType === "video" && (
        <div className="space-y-4">
          <VideoPickerField
            label="Desktop Video"
            description="1920×1080+  ·  Screens ≥ 1024px"
            value={bgVideo.src || (isVideoSrc(bgImage.src) ? bgImage.src : "")}
            onChange={(v) =>
              onChange({
                ...content,
                backgroundVideo: { ...bgVideo, src: v },
                // Clear the video from backgroundImage if it was stored there (legacy)
                ...(isVideoSrc(bgImage.src) ? { backgroundImage: { ...bgImage, src: "" } } : {}),
              })
            }
          />
          <VideoPickerField
            label="Mobile Video (optional)"
            description="720×1280 portrait  ·  Screens < 1024px  ·  Uses desktop video if empty"
            value={bgVideo.mobileSrc || legacyMobileVideo}
            onChange={(v) =>
              onChange({
                ...content,
                backgroundVideo: { ...bgVideo, mobileSrc: v },
                mobileVideo: undefined, // clear legacy field
              })
            }
          />
          <ImagePickerField
            label="Poster / Fallback Image"
            value={posterImage.src}
            onChange={(v) =>
              onChange({
                ...content,
                posterImage: { ...posterImage, src: v },
              })
            }
          />
          {posterImage.src && (
            <p className="text-[11px] text-muted-foreground/70 -mt-1">
              Displays while loading or on playback failure
            </p>
          )}
        </div>
      )}

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

/** Layout editor for HERO_BANNER — rendered in the Layout accordion panel */
export function HeroBannerLayoutEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const layout = (content.layout as string) || "fullwidth"
  const splitArrangement = (content.splitArrangement as string) || "text-left"
  const textHAlign = (content.textHAlign as string) || "center"
  const textVAlign = (content.textVAlign as string) || "middle"
  const splitTextAlign = (content.textAlign as string) || "left"
  const carouselSpeed = (content.carouselSpeed as number) ?? 5
  const mediaType = (content.mediaType as string) || "image"
  const images = (content.images as Array<{ src: string }>) ?? []
  const hasCarousel = mediaType === "image" && images.length >= 2

  return (
    <div className="space-y-6">
      <EditorButtonGroup
        label="Layout"
        value={layout}
        onChange={(v) => onChange({ ...content, layout: v })}
        options={[
          { value: "fullwidth", label: "Full Width" },
          { value: "split", label: "Split" },
          { value: "contained", label: "Contained" },
        ]}
        size="sm"
      />

      {(layout === "split" || layout === "contained") && (
        <LayoutArrangementPicker
          value={splitArrangement}
          onChange={(v) => onChange({ ...content, splitArrangement: v })}
        />
      )}

      {layout === "fullwidth" && (
        <>
          <EditorButtonGroup
            label="Horizontal Position"
            value={textHAlign}
            onChange={(v) => onChange({ ...content, textHAlign: v })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
            size="sm"
          />
          <EditorButtonGroup
            label="Vertical Position"
            value={textVAlign}
            onChange={(v) => onChange({ ...content, textVAlign: v })}
            options={[
              { value: "top", label: "Top" },
              { value: "middle", label: "Middle" },
              { value: "bottom", label: "Bottom" },
            ]}
            size="sm"
          />
        </>
      )}

      {(layout === "split" || layout === "contained") && (
        <EditorButtonGroup
          label="Text Alignment"
          value={splitTextAlign}
          onChange={(v) => onChange({ ...content, textAlign: v })}
          options={[
            { value: "left", label: "Left" },
            { value: "center", label: "Center" },
            { value: "right", label: "Right" },
          ]}
          size="sm"
        />
      )}

      {hasCarousel && (
        <>
          <Separator />
          <CarouselSpeedField
            value={carouselSpeed}
            onChange={(v) => onChange({ ...content, carouselSpeed: v })}
            min={2}
            max={15}
            step={1}
            description="Seconds between each image crossfade"
          />
        </>
      )}

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
  const headingLine1 = (content.headingLine1 as string) ?? ""
  const headingAccent = (content.headingAccent as string) ?? ""
  const description = (content.description as string) ?? ""
  const image = (content.image as {
    src: string
    alt: string
    objectPosition?: string
  }) ?? { src: "", alt: "" }

  return (
    <div className="space-y-6">
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

      {/* Image */}
      <div className="space-y-3">
        <ImagePickerField
          label="Image"
          value={image.src}
          onChange={(v) =>
            onChange({ ...content, image: { ...image, src: v } })
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
          placeholder="Hero image"
        />
      </div>

    </div>
  )
}

/** Layout editor for TEXT_IMAGE_HERO */
export function TextImageHeroLayoutEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const textAlign = (content.textAlign as string) ?? "left"
  return (
    <div className="space-y-6">
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
  const heading = (content.heading as string) ?? ""
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
      {/* === Content === */}
      <EditorTextarea
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="Ministry heading (use newlines for line breaks)"
        rows={4}
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
      </div>

      <p className="text-xs text-muted-foreground">
        Social links are configured in the JSON content. A dedicated social
        links editor is planned for a future update.
      </p>
    </div>
  )
}

/** Layout editor for MINISTRY_HERO */
export function MinistryHeroLayoutEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const headingStyle = (content.headingStyle as string) ?? "display"
  return (
    <div className="space-y-6">
      <EditorButtonGroup
        label="Heading Style"
        value={headingStyle}
        onChange={(v) => onChange({ ...content, headingStyle: v })}
        options={[
          { value: "display", label: "Display" },
          { value: "sans", label: "Sans" },
        ]}
      />
    </div>
  )
}
