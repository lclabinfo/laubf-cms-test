"use client"

import { useState } from "react"
import { MessageSquare, Pin, PinOff, Lock, Pencil, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PersonDetail } from "./types"

const noteTypeVariant: Record<string, "default" | "info" | "warning" | "success" | "destructive" | "secondary"> = {
  GENERAL: "secondary",
  PASTORAL: "info",
  COUNSELING: "warning",
  FOLLOW_UP: "success",
  PRAYER: "default",
}

const noteTypeLabel: Record<string, string> = {
  GENERAL: "General",
  PASTORAL: "Pastoral",
  COUNSELING: "Counseling",
  FOLLOW_UP: "Follow-Up",
  PRAYER: "Prayer",
}

function formatRelativeDate(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

type Note = PersonDetail["personNotes"][number]

type Props = {
  person: PersonDetail
  churchId: string
  onUpdate: () => void
}

export function ProfileNotes({ person, churchId, onUpdate }: Props) {
  const [filter, setFilter] = useState("ALL")
  const [content, setContent] = useState("")
  const [noteType, setNoteType] = useState("GENERAL")
  const [isPinned, setIsPinned] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)

  const notes = person.personNotes
  const filteredNotes = filter === "ALL"
    ? notes
    : notes.filter((n) => n.noteType === filter)

  const handleAddNote = async () => {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/people/${person.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          noteType,
          isPinned,
          isPrivate,
          authorId: person.id, // TODO: use actual logged-in user ID
        }),
      })
      if (!res.ok) throw new Error("Failed to add note")
      toast.success("Note added")
      setContent("")
      setIsPinned(false)
      setIsPrivate(false)
      onUpdate()
    } catch {
      toast.error("Failed to add note")
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePin = async (note: Note) => {
    try {
      const res = await fetch(`/api/v1/people/${person.id}/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(note.isPinned ? "Note unpinned" : "Note pinned")
      onUpdate()
    } catch {
      toast.error("Failed to update note")
    }
  }

  const handleDeleteClick = (noteId: string) => {
    setDeleteNoteId(noteId)
  }

  const confirmDelete = async () => {
    if (!deleteNoteId) return
    setDeleteNoteId(null)
    try {
      const res = await fetch(`/api/v1/people/${person.id}/notes/${deleteNoteId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Note deleted")
      onUpdate()
    } catch {
      toast.error("Failed to delete note")
    }
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await fetch(`/api/v1/people/${person.id}/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Note updated")
      setEditingId(null)
      onUpdate()
    } catch {
      toast.error("Failed to update note")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="size-4" />
          Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add note form */}
        <div className="space-y-3 rounded-lg border p-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note..."
            rows={3}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="PASTORAL">Pastoral</SelectItem>
                <SelectItem value="COUNSELING">Counseling</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-Up</SelectItem>
                <SelectItem value="PRAYER">Prayer</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                id="note-pinned"
                size="sm"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="note-pinned" className="text-xs">Pin</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="note-private"
                size="sm"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="note-private" className="text-xs">Private</Label>
            </div>
            <Button
              size="sm"
              className="ml-auto"
              onClick={handleAddNote}
              disabled={submitting || !content.trim()}
            >
              {submitting ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>

        {/* Filter tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="GENERAL">General</TabsTrigger>
            <TabsTrigger value="PASTORAL">Pastoral</TabsTrigger>
            <TabsTrigger value="COUNSELING">Counseling</TabsTrigger>
            <TabsTrigger value="FOLLOW_UP">Follow-Up</TabsTrigger>
            <TabsTrigger value="PRAYER">Prayer</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notes list */}
        {filteredNotes.length > 0 ? (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={noteTypeVariant[note.noteType]}>
                      {noteTypeLabel[note.noteType]}
                    </Badge>
                    {note.isPinned && (
                      <Pin className="size-3.5 text-amber-500" aria-label="Pinned" />
                    )}
                    {note.isPrivate && (
                      <Lock className="size-3.5 text-muted-foreground" aria-label="Private note" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleTogglePin(note)}
                    >
                      {note.isPinned ? (
                        <PinOff className="size-3.5" />
                      ) : (
                        <Pin className="size-3.5" />
                      )}
                      <span className="sr-only">
                        {note.isPinned ? "Unpin" : "Pin"}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setEditingId(note.id)
                        setEditContent(note.content)
                      }}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(note.id)}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSaveEdit(note.id)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {note.author
                    ? `${note.author.firstName} ${note.author.lastName}`
                    : "Unknown"}{" "}
                  &middot; {formatRelativeDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {filter === "ALL" ? "No notes yet" : `No ${noteTypeLabel[filter]?.toLowerCase()} notes`}
          </p>
        )}
      </CardContent>

      {/* Delete note confirmation */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <TriangleAlert className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>
              This note will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
