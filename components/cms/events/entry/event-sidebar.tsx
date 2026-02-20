"use client"

import { useState } from "react"
import { ImageIcon, Plus, Sparkles, Upload, X, Library, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { statusDisplay } from "@/lib/status"
import type { ContentStatus } from "@/lib/status"
import {
  eventTypeDisplay,
  ministryOptions,
  campusOptions,
  tagSuggestions,
  type EventType,
  type MinistryTag,
  type CampusTag,
} from "@/lib/events-data"
import { MediaSelectorDialog } from "@/components/cms/media/media-selector-dialog"

interface EventSidebarProps {
  status: ContentStatus
  onStatusChange: (status: ContentStatus) => void
  eventType: EventType
  onEventTypeChange: (type: EventType) => void
  ministry: MinistryTag
  onMinistryChange: (ministry: MinistryTag) => void
  campus: CampusTag | undefined
  onCampusChange: (campus: CampusTag | undefined) => void
  contacts: string[]
  onContactsChange: (contacts: string[]) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  coverImage: string
  onCoverImageChange: (url: string) => void
  imageAlt: string
  onImageAltChange: (alt: string) => void
}

const statusOptions: ContentStatus[] = ["draft", "published", "scheduled", "archived"]
const eventTypes: EventType[] = ["event", "meeting", "program"]

const mockUnsplashImages = [
  "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1529070538774-1795d8de2b7b?w=800&h=400&fit=crop",
]

export function EventSidebar({
  status,
  onStatusChange,
  eventType,
  onEventTypeChange,
  ministry,
  onMinistryChange,
  campus,
  onCampusChange,
  contacts,
  onContactsChange,
  tags,
  onTagsChange,
  coverImage,
  onCoverImageChange,
  imageAlt,
  onImageAltChange,
}: EventSidebarProps) {
  const [contactInput, setContactInput] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false)

  function handleAddContact() {
    const name = contactInput.trim()
    if (!name || contacts.includes(name)) return
    onContactsChange([...contacts, name])
    setContactInput("")
  }

  function handleRemoveContact(name: string) {
    onContactsChange(contacts.filter((c) => c !== name))
  }

  function handleContactKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddContact()
    }
  }

  function handleAddTag() {
    let tag = tagInput.trim().toUpperCase()
    if (!tag) return
    if (!tag.startsWith("#")) tag = `#${tag}`
    if (tags.includes(tag)) return
    onTagsChange([...tags, tag])
    setTagInput("")
  }

  function handleRemoveTag(tag: string) {
    onTagsChange(tags.filter((t) => t !== tag))
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  function handleTagSuggestionClick(tag: string) {
    if (tags.includes(tag)) return
    onTagsChange([...tags, tag])
  }

  function handleUploadImage() {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        onCoverImageChange(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  function handleGenerateAI() {
    const random = mockUnsplashImages[Math.floor(Math.random() * mockUnsplashImages.length)]
    onCoverImageChange(random)
  }

  // Filter suggestions to only show tags not already added
  const availableSuggestions = tagSuggestions.filter(t => !tags.includes(t))

  return (
    <div className="w-72 shrink-0 space-y-6">
      {/* Organization & Classification */}
      <div className="rounded-xl border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Organization</h3>
        </div>

        <div className="p-4 space-y-5">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="event-status">Status</Label>
            <Select value={status} onValueChange={(v) => onStatusChange(v as ContentStatus)}>
              <SelectTrigger id="event-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => {
                  const config = statusDisplay[s]
                  return (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                          {config.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Select value={eventType} onValueChange={(v) => onEventTypeChange(v as EventType)}>
              <SelectTrigger id="event-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {eventTypeDisplay[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ministry */}
          <div className="space-y-2">
            <Label htmlFor="event-ministry">Ministry</Label>
            <Select value={ministry} onValueChange={(v) => onMinistryChange(v as MinistryTag)}>
              <SelectTrigger id="event-ministry">
                <SelectValue placeholder="Select ministry" />
              </SelectTrigger>
              <SelectContent>
                {ministryOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campus */}
          <div className="space-y-2">
            <Label htmlFor="event-campus">Campus (optional)</Label>
            <Select
              value={campus ?? "__none__"}
              onValueChange={(v) => onCampusChange(v === "__none__" ? undefined : v as CampusTag)}
            >
              <SelectTrigger id="event-campus">
                <SelectValue placeholder="No campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">No campus</span>
                </SelectItem>
                {campusOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Points of Contact */}
          <div className="space-y-2">
            <Label>Points of Contact</Label>
            {contacts.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {contacts.map((name) => (
                  <Badge key={name} variant="secondary" className="gap-1 pr-1">
                    {name}
                    <button
                      onClick={() => handleRemoveContact(name)}
                      className="rounded-full hover:bg-foreground/10 p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                onKeyDown={handleContactKeyDown}
                placeholder="Add a person..."
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleAddContact}
                disabled={!contactInput.trim()}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border bg-card">
        <div className="px-4 py-3 border-b flex items-center gap-2">
          <Hash className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Tags</h3>
        </div>

        <div className="p-4 space-y-3">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="gap-1 pr-1 text-xs">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="rounded-full hover:bg-foreground/10 p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-1.5">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag..."
              className="flex-1 text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Tag suggestions */}
          {availableSuggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Suggestions
              </span>
              <div className="flex flex-wrap gap-1">
                {availableSuggestions.slice(0, 8).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer text-[10px] hover:bg-muted"
                    onClick={() => handleTagSuggestionClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cover Image */}
      <div className="rounded-xl border bg-card">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">Cover Image</h3>
        </div>

        <div className="p-4 space-y-3">
          {/* Preview */}
          <div className="aspect-video rounded-lg border bg-muted/50 overflow-hidden">
            {coverImage ? (
              <img
                src={coverImage}
                alt={imageAlt || "Event cover"}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="size-8 mb-1" />
                <span className="text-xs">No image selected</span>
              </div>
            )}
          </div>

          {/* Alt text */}
          <div className="space-y-1.5">
            <Label htmlFor="image-alt" className="text-xs">Alt Text</Label>
            <Input
              id="image-alt"
              value={imageAlt}
              onChange={(e) => onImageAltChange(e.target.value)}
              placeholder="Describe the image..."
              className="text-sm h-8"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5">
            {coverImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCoverImageChange("")}
              >
                <X className="size-3.5" />
                Remove
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleUploadImage}>
              <Upload className="size-3.5" />
              Upload
            </Button>
            <Button variant="outline" size="sm" onClick={handleGenerateAI}>
              <Sparkles className="size-3.5" />
              Generate AI
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMediaSelectorOpen(true)}>
              <Library className="size-3.5" />
              Library
            </Button>
          </div>
          <MediaSelectorDialog
            open={mediaSelectorOpen}
            onOpenChange={setMediaSelectorOpen}
            onSelect={(items) => {
              if (items.length > 0) {
                onCoverImageChange(items[0].url)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
