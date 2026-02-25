"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical } from "lucide-react"
import type { SectionType } from "@/lib/db/types"

interface CardsEditorProps {
  sectionType: SectionType
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

// --- Generic Card Item ---

interface GenericCard {
  id?: string
  title: string
  description: string
  imageUrl?: string
  href?: string
  [key: string]: unknown
}

function CardItemEditor({
  index,
  card,
  onChange,
  onRemove,
  showImage,
  showLink,
  extraFields,
}: {
  index: number
  card: GenericCard
  onChange: (card: GenericCard) => void
  onRemove: () => void
  showImage?: boolean
  showLink?: boolean
  extraFields?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3 relative group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <GripVertical className="size-4" />
          <span className="text-xs font-medium">Card {index + 1}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Title</Label>
        <Input
          value={card.title}
          onChange={(e) => onChange({ ...card, title: e.target.value })}
          placeholder="Card title"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea
          value={card.description}
          onChange={(e) =>
            onChange({ ...card, description: e.target.value })
          }
          placeholder="Card description"
          className="min-h-[60px]"
        />
      </div>

      {showImage && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Image URL</Label>
          <Input
            value={card.imageUrl ?? ""}
            onChange={(e) =>
              onChange({ ...card, imageUrl: e.target.value })
            }
            placeholder="https://..."
          />
        </div>
      )}

      {showLink && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Link URL</Label>
          <Input
            value={card.href ?? ""}
            onChange={(e) => onChange({ ...card, href: e.target.value })}
            placeholder="/page"
          />
        </div>
      )}

      {extraFields}
    </div>
  )
}

function AddCardButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      className="w-full border-dashed"
      onClick={onClick}
    >
      <Plus className="size-4 mr-2" />
      {label}
    </Button>
  )
}

// --- Action Card Grid Editor ---

function ActionCardGridEditor({
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
  }) ?? null
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
        <Label className="text-sm font-medium">Heading</Label>
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
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Line 2 (italic)
          </Label>
          <Input
            value={heading.line2}
            onChange={(e) =>
              onChange({
                ...content,
                heading: { ...heading, line2: e.target.value },
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Line 3</Label>
          <Input
            value={heading.line3}
            onChange={(e) =>
              onChange({
                ...content,
                heading: { ...heading, line3: e.target.value },
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subheading</Label>
        <Input
          value={subheading}
          onChange={(e) =>
            onChange({ ...content, subheading: e.target.value })
          }
        />
      </div>

      {ctaButton !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              CTA Button Label
            </Label>
            <Input
              value={ctaButton.label}
              onChange={(e) =>
                onChange({
                  ...content,
                  ctaButton: { ...ctaButton, label: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              CTA Button Link
            </Label>
            <Input
              value={ctaButton.href}
              onChange={(e) =>
                onChange({
                  ...content,
                  ctaButton: { ...ctaButton, href: e.target.value },
                })
              }
            />
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Cards</Label>
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
    </div>
  )
}

// --- Highlight Cards Editor ---

function HighlightCardsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const heading = (content.heading as string) ?? ""
  const subheading = (content.subheading as string) ?? ""
  const ctaLabel = (content.ctaLabel as string) ?? ""
  const ctaHref = (content.ctaHref as string) ?? ""

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Subheading</Label>
        <Input
          value={subheading}
          onChange={(e) =>
            onChange({ ...content, subheading: e.target.value })
          }
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">CTA Label</Label>
          <Input
            value={ctaLabel}
            onChange={(e) =>
              onChange({ ...content, ctaLabel: e.target.value })
            }
            placeholder="View All"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">CTA Link</Label>
          <Input
            value={ctaHref}
            onChange={(e) =>
              onChange({ ...content, ctaHref: e.target.value })
            }
            placeholder="/events"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Featured events are configured in the JSON content. The event cards
        reference event data from the CMS.
      </p>
    </div>
  )
}

// --- Pathway Card Editor ---

function PathwayCardEditor({
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          className="min-h-[80px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Pathway Cards</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Icon Key
                </Label>
                <Input
                  value={card.icon}
                  onChange={(e) => updateCard(i, "icon", e.target.value)}
                  placeholder="book-open"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title</Label>
                <Input
                  value={card.title}
                  onChange={(e) => updateCard(i, "title", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={card.description}
                onChange={(e) =>
                  updateCard(i, "description", e.target.value)
                }
                className="min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Button Label
                </Label>
                <Input
                  value={card.buttonLabel}
                  onChange={(e) =>
                    updateCard(i, "buttonLabel", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Button Link
                </Label>
                <Input
                  value={card.buttonHref}
                  onChange={(e) =>
                    updateCard(i, "buttonHref", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        ))}
        <AddCardButton label="Add Pathway Card" onClick={addCard} />
      </div>
    </div>
  )
}

// --- Pillars Editor ---

function PillarsEditor({
  content,
  onChange,
}: {
  content: Record<string, unknown>
  onChange: (c: Record<string, unknown>) => void
}) {
  const overline = (content.overline as string) ?? ""
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Overline</Label>
        <Input
          value={overline}
          onChange={(e) => onChange({ ...content, overline: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Pillar Items</Label>
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

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input
                value={item.title}
                onChange={(e) => updateItem(i, "title", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Description
              </Label>
              <Textarea
                value={item.description}
                onChange={(e) =>
                  updateItem(i, "description", e.target.value)
                }
                className="min-h-[80px]"
              />
            </div>

            {item.button && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Button Label
                  </Label>
                  <Input
                    value={item.button.label}
                    onChange={(e) =>
                      updateItem(i, "button", {
                        ...item.button,
                        label: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Button Link
                  </Label>
                  <Input
                    value={item.button.href}
                    onChange={(e) =>
                      updateItem(i, "button", {
                        ...item.button,
                        href: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Images for this pillar are configured in the JSON content.
            </p>
          </div>
        ))}
        <AddCardButton label="Add Pillar" onClick={addItem} />
      </div>
    </div>
  )
}

// --- Feature Breakdown Editor ---

function FeatureBreakdownEditor({
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

  function updateLine(index: number, value: string) {
    const updated = [...acronymLines]
    updated[index] = value
    onChange({ ...content, acronymLines: updated })
  }

  function addLine() {
    onChange({ ...content, acronymLines: [...acronymLines, ""] })
  }

  function removeLine(index: number) {
    onChange({
      ...content,
      acronymLines: acronymLines.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          className="min-h-[100px]"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Acronym Lines (first letter highlighted)
          </Label>
          <button
            type="button"
            onClick={addLine}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add Line
          </button>
        </div>
        {acronymLines.map((line, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={line}
              onChange={(e) => updateLine(i, e.target.value)}
              placeholder={`Line ${i + 1}`}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-9 text-muted-foreground hover:text-destructive"
              onClick={() => removeLine(i)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">CTA Button</Label>
          <Switch
            checked={button.visible}
            onCheckedChange={(v) =>
              onChange({
                ...content,
                button: { ...button, visible: v },
              })
            }
          />
        </div>
        {button.visible && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Button Text
              </Label>
              <Input
                value={button.label}
                onChange={(e) =>
                  onChange({
                    ...content,
                    button: { ...button, label: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Button Link
              </Label>
              <Input
                value={button.href}
                onChange={(e) =>
                  onChange({
                    ...content,
                    button: { ...button, href: e.target.value },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Newcomer Editor ---

function NewcomerEditor({
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
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Heading</Label>
        <Input
          value={heading}
          onChange={(e) => onChange({ ...content, heading: e.target.value })}
          placeholder="New Here?"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          value={description}
          onChange={(e) =>
            onChange({ ...content, description: e.target.value })
          }
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Button Label</Label>
          <Input
            value={buttonLabel}
            onChange={(e) =>
              onChange({ ...content, buttonLabel: e.target.value })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Button Link</Label>
          <Input
            value={buttonHref}
            onChange={(e) =>
              onChange({ ...content, buttonHref: e.target.value })
            }
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-sm font-medium">Image (optional)</Label>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Image URL</Label>
          <Input
            value={image?.src ?? ""}
            onChange={(e) =>
              onChange({
                ...content,
                image: e.target.value
                  ? {
                      src: e.target.value,
                      alt: image?.alt ?? "",
                      objectPosition: image?.objectPosition,
                    }
                  : undefined,
              })
            }
            placeholder="https://..."
          />
        </div>
      </div>
    </div>
  )
}

// --- Main export ---

export function CardsEditor({
  sectionType,
  content,
  onChange,
}: CardsEditorProps) {
  switch (sectionType) {
    case "ACTION_CARD_GRID":
      return <ActionCardGridEditor content={content} onChange={onChange} />
    case "HIGHLIGHT_CARDS":
      return <HighlightCardsEditor content={content} onChange={onChange} />
    case "PATHWAY_CARD":
      return <PathwayCardEditor content={content} onChange={onChange} />
    case "PILLARS":
      return <PillarsEditor content={content} onChange={onChange} />
    case "FEATURE_BREAKDOWN":
      return <FeatureBreakdownEditor content={content} onChange={onChange} />
    case "NEWCOMER":
      return <NewcomerEditor content={content} onChange={onChange} />
    default:
      return null
  }
}
