"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"
import {
  EditorInput,
  EditorTextarea,
  EditorField,
  EditorToggle,
  TwoColumnGrid,
  ImagePickerField,
  CardItemEditor,
  AddCardButton,
  AddressField,
  ButtonConfig,
  type GenericCard,
} from "./shared"

// --- Action Card Grid Editor ---

export function ActionCardGridEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as {
    line1: string
    line2: string
    line3: string
  }) ?? { line1: "", line2: "", line3: "" }
  const subheading = (content.subheading as string) ?? ""
  const ctaButton = (content.ctaButton as {
    label: string
    href: string
    visible: boolean
  }) ?? { label: "", href: "", visible: false }
  const cards = (content.cards as GenericCard[]) ?? []

  function updateCard(index: number, card: GenericCard) {
    const updated = [...cards]
    updated[index] = card
    onChange({ ...content, cards: updated })
  }

  function removeCard(index: number) {
    onChange({ ...content, cards: cards.filter((_, i) => i !== index) })
  }

  function addCard() {
    onChange({
      ...content,
      cards: [
        ...cards,
        {
          id: `card-${Date.now()}`,
          title: "",
          description: "",
          imageUrl: "",
          href: "",
        },
      ],
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <EditorField label="Heading" labelSize="sm">
          <div className="space-y-3">
            <EditorInput
              label="Line 1"
              value={heading.line1}
              onChange={(v) =>
                onChange({
                  ...content,
                  heading: { ...heading, line1: v },
                })
              }
            />
            <EditorInput
              label="Line 2 (italic)"
              value={heading.line2}
              onChange={(v) =>
                onChange({
                  ...content,
                  heading: { ...heading, line2: v },
                })
              }
            />
            <EditorInput
              label="Line 3"
              value={heading.line3}
              onChange={(v) =>
                onChange({
                  ...content,
                  heading: { ...heading, line3: v },
                })
              }
            />
          </div>
        </EditorField>
      </div>

      <EditorInput
        label="Subheading"
        labelSize="sm"
        value={subheading}
        onChange={(v) => onChange({ ...content, subheading: v })}
      />

      <ButtonConfig
        id="action-card-cta"
        label="CTA Button"
        buttonData={ctaButton}
        onChange={(b) => onChange({ ...content, ctaButton: b })}
      />

      <Separator />

      <div className="space-y-3">
        <EditorField label="Cards" labelSize="sm">
          <div className="space-y-3">
            {cards.map((card, i) => (
              <CardItemEditor
                key={card.id ?? i}
                index={i}
                card={card}
                onChange={(c) => updateCard(i, c)}
                onRemove={() => removeCard(i)}
                showImage
                showLink
              />
            ))}
            <AddCardButton label="Add Card" onClick={addCard} />
          </div>
        </EditorField>
      </div>
    </div>
  )
}

// --- Pathway Card Editor ---

export function PathwayCardEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const cards = (content.cards as {
    icon: string
    title: string
    description: string
    buttonLabel: string
    buttonHref: string
    buttonVariant: string
  }[]) ?? []

  function updateCard(
    index: number,
    field: string,
    value: string,
  ) {
    const updated = [...cards]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, cards: updated })
  }

  function removeCard(index: number) {
    onChange({ ...content, cards: cards.filter((_, i) => i !== index) })
  }

  function addCard() {
    onChange({
      ...content,
      cards: [
        ...cards,
        {
          icon: "book-open",
          title: "",
          description: "",
          buttonLabel: "Learn More",
          buttonHref: "/",
          buttonVariant: "secondary",
        },
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
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        rows={4}
      />

      <Separator />

      <div className="space-y-3">
        <EditorField label="Pathway Cards" labelSize="sm">
          <div className="space-y-3">
            {cards.map((card, i) => (
              <div
                key={i}
                className="rounded-lg border p-4 space-y-3 relative"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Card {i + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeCard(i)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <TwoColumnGrid>
                  <EditorInput
                    label="Icon Key"
                    value={card.icon}
                    onChange={(v) => updateCard(i, "icon", v)}
                    placeholder="book-open"
                  />
                  <EditorInput
                    label="Title"
                    value={card.title}
                    onChange={(v) => updateCard(i, "title", v)}
                  />
                </TwoColumnGrid>

                <EditorTextarea
                  label="Description"
                  value={card.description}
                  onChange={(v) => updateCard(i, "description", v)}
                  rows={3}
                />

                <TwoColumnGrid>
                  <EditorInput
                    label="Button Label"
                    value={card.buttonLabel}
                    onChange={(v) => updateCard(i, "buttonLabel", v)}
                  />
                  <EditorInput
                    label="Button Link"
                    value={card.buttonHref}
                    onChange={(v) => updateCard(i, "buttonHref", v)}
                  />
                </TwoColumnGrid>
              </div>
            ))}
            <AddCardButton label="Add Pathway Card" onClick={addCard} />
          </div>
        </EditorField>
      </div>
    </div>
  )
}

// --- Pillars Editor ---

export function PillarsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const items = (content.items as {
    title: string
    description: string
    images: { src: string; alt: string; objectPosition?: string }[]
    button?: { label: string; href: string }
  }[]) ?? []

  function updateItem(index: number, field: string, value: unknown) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    onChange({ ...content, items: updated })
  }

  function removeItem(index: number) {
    onChange({ ...content, items: items.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({
      ...content,
      items: [
        ...items,
        {
          title: "",
          description: "",
          images: [],
          button: { label: "Learn More", href: "/" },
        },
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
      />

      <Separator />

      <div className="space-y-3">
        <EditorField label="Pillar Items" labelSize="sm">
          <div className="space-y-3">
            {items.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border p-4 space-y-3 relative"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Pillar {i + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(i)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>

                <EditorInput
                  label="Title"
                  value={item.title}
                  onChange={(v) => updateItem(i, "title", v)}
                />

                <EditorTextarea
                  label="Description"
                  value={item.description}
                  onChange={(v) => updateItem(i, "description", v)}
                  rows={4}
                />

                {item.button && (
                  <TwoColumnGrid>
                    <EditorInput
                      label="Button Label"
                      value={item.button.label}
                      onChange={(v) =>
                        updateItem(i, "button", {
                          ...item.button,
                          label: v,
                        })
                      }
                    />
                    <EditorInput
                      label="Button Link"
                      value={item.button.href}
                      onChange={(v) =>
                        updateItem(i, "button", {
                          ...item.button,
                          href: v,
                        })
                      }
                    />
                  </TwoColumnGrid>
                )}

                <p className="text-xs text-muted-foreground">
                  Images for this pillar are configured in the JSON content.
                </p>
              </div>
            ))}
            <AddCardButton label="Add Pillar" onClick={addItem} />
          </div>
        </EditorField>
      </div>
    </div>
  )
}

// --- Feature Breakdown Editor ---

export function FeatureBreakdownEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const acronymLines = (content.acronymLines as string[]) ?? []
  const button = (content.button as {
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
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        rows={5}
      />

      <Separator />

      <AddressField
        label="Acronym Lines (first letter highlighted)"
        value={acronymLines}
        onChange={(lines) => onChange({ ...content, acronymLines: lines })}
        placeholder="Line"
      />

      <Separator />

      <div className="space-y-3 rounded-lg border p-4">
        <EditorToggle
          label="CTA Button"
          checked={button.visible}
          onCheckedChange={(v) =>
            onChange({
              ...content,
              button: { ...button, visible: v },
            })
          }
        />
        {button.visible && (
          <TwoColumnGrid>
            <EditorInput
              label="Button Text"
              value={button.label}
              onChange={(v) =>
                onChange({
                  ...content,
                  button: { ...button, label: v },
                })
              }
            />
            <EditorInput
              label="Button Link"
              value={button.href}
              onChange={(v) =>
                onChange({
                  ...content,
                  button: { ...button, href: v },
                })
              }
            />
          </TwoColumnGrid>
        )}
      </div>
    </div>
  )
}

// --- Newcomer Editor ---

export function NewcomerEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const description = (content.description as string) ?? ""
  const buttonLabel = (content.buttonLabel as string) ?? ""
  const buttonHref = (content.buttonHref as string) ?? ""
  const image = (content.image as {
    src: string
    alt: string
    objectPosition?: string
  }) ?? null

  return (
    <div className="space-y-6">
      <EditorInput
        label="Heading"
        labelSize="sm"
        value={heading}
        onChange={(v) => onChange({ ...content, heading: v })}
        placeholder="New Here?"
      />

      <EditorTextarea
        label="Description"
        labelSize="sm"
        value={description}
        onChange={(v) => onChange({ ...content, description: v })}
        rows={5}
      />

      <TwoColumnGrid>
        <EditorInput
          label="Button Label"
          labelSize="sm"
          value={buttonLabel}
          onChange={(v) => onChange({ ...content, buttonLabel: v })}
        />
        <EditorInput
          label="Button Link"
          labelSize="sm"
          value={buttonHref}
          onChange={(v) => onChange({ ...content, buttonHref: v })}
        />
      </TwoColumnGrid>

      <Separator />

      <ImagePickerField
        label="Image (optional)"
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
              : undefined,
          })
        }
      />
    </div>
  )
}

