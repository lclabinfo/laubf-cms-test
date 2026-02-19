"use client"

import { useState } from "react"
import { ImageIcon, Plus, Sparkles, Upload, X, Library } from "lucide-react"
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
import { eventTypeDisplay, ministries, type EventType } from "@/lib/events-data"
import { MediaSelectorDialog } from "@/components/cms/media/media-selector-dialog"

interface EventSidebarProps {
  status: ContentStatus
  onStatusChange: (status: ContentStatus) => void
  eventType: EventType
  onEventTypeChange: (type: EventType) => void
  ministry: string
  onMinistryChange: (ministry: string) => void
  contacts: string[]
  onContactsChange: (contacts: string[]) => void
  coverImage: string
  onCoverImageChange: (url: string) => void
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
  contacts,
  onContactsChange,
  coverImage,
  onCoverImageChange,
}: EventSidebarProps) {
  const [contactInput, setContactInput] = useState("")
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
            <Label htmlFor="event-ministry">Ministry / Category</Label>
            <Select value={ministry} onValueChange={onMinistryChange}>
              <SelectTrigger id="event-ministry">
                <SelectValue placeholder="Select ministry" />
              </SelectTrigger>
              <SelectContent>
                {ministries.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
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
                alt="Event cover"
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="size-8 mb-1" />
                <span className="text-xs">No image selected</span>
              </div>
            )}
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
