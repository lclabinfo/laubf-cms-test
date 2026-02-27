"use client"

import { useState, useRef } from "react"
import { Tag, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { PersonDetail } from "./types"

type Props = {
  person: PersonDetail
  onUpdate: () => void
}

export function ProfileTags({ person, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [removingTag, setRemovingTag] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const tags = person.personTags

  const handleAdd = async () => {
    const tagName = tagInput.trim()
    if (!tagName) return
    if (tags.some((t) => t.tagName.toLowerCase() === tagName.toLowerCase())) {
      toast.error("Tag already exists")
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/v1/people/${person.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagName }),
      })
      if (!res.ok) throw new Error("Failed to add tag")
      toast.success("Tag added")
      setTagInput("")
      onUpdate()
    } catch {
      toast.error("Failed to add tag")
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (tagName: string) => {
    setRemovingTag(tagName)
    try {
      const res = await fetch(
        `/api/v1/people/${person.id}/tags?tagName=${encodeURIComponent(tagName)}`,
        { method: "DELETE" },
      )
      if (!res.ok) throw new Error("Failed to remove tag")
      toast.success("Tag removed")
      onUpdate()
    } catch {
      toast.error("Failed to remove tag")
    } finally {
      setRemovingTag(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === "Escape") {
      setAdding(false)
      setTagInput("")
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="size-4" />
          Tags
        </CardTitle>
        {!adding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAdding(true)
              setTimeout(() => inputRef.current?.focus(), 50)
            }}
          >
            <Plus className="mr-1 size-3.5" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a tag name..."
              className="h-8 text-sm"
            />
            <Button size="sm" onClick={handleAdd} disabled={saving || !tagInput.trim()}>
              {saving ? "..." : "Add"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false)
                setTagInput("")
              }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
                {tag.tagName}
                <button
                  type="button"
                  onClick={() => handleRemove(tag.tagName)}
                  disabled={removingTag === tag.tagName}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  aria-label={`Remove ${tag.tagName} tag`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          !adding && (
            <p className="text-sm text-muted-foreground text-center py-2">No tags</p>
          )
        )}
      </CardContent>
    </Card>
  )
}
