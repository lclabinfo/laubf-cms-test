"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Bug, Lightbulb, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActionLogEntry } from "../use-action-logger"

const TYPES = [
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
  { value: "feedback", label: "Feedback", icon: MessageCircle },
] as const

interface BuilderFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageId: string
  pageSlug: string
  pageTitle: string
  editingSectionId: string | null
  editingSectionType: string | null
  deviceMode: string
  activeTool: string | null
  getActionHistory: () => ActionLogEntry[]
}

export function BuilderFeedbackDialog({
  open,
  onOpenChange,
  pageId,
  pageSlug,
  pageTitle,
  editingSectionId,
  editingSectionType,
  deviceMode,
  activeTool,
  getActionHistory,
}: BuilderFeedbackDialogProps) {
  const [type, setType] = useState<string>("bug")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (title.length > 200) {
      toast.error("Title must be 200 characters or less")
      return
    }
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }

    setIsSubmitting(true)
    try {
      const snapshot = {
        source: "builder",
        pageId,
        pageSlug,
        pageTitle,
        editingSectionId,
        editingSectionType,
        deviceMode,
        activeTool,
        rightDrawerOpen: !!editingSectionId,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        browserInfo: navigator.userAgent,
        url: location.href,
        timestamp: new Date().toISOString(),
      }

      const res = await fetch("/api/v1/builder-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          snapshot,
          actionHistory: getActionHistory(),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || "Failed to submit feedback")
      }

      toast.success("Feedback submitted! Thank you.")
      onOpenChange(false)
      setTitle("")
      setDescription("")
      setType("bug")
    } catch (err) {
      console.error("Feedback submit error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Type selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
            <div className="flex gap-1.5">
              {TYPES.map((t) => {
                const Icon = t.icon
                const isActive = type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:bg-muted",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feedback-title" className="text-xs font-medium text-muted-foreground">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="feedback-title"
              placeholder={type === "bug" ? "What went wrong?" : type === "feature" ? "What would you like?" : "Your feedback"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feedback-description" className="text-xs font-medium text-muted-foreground">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback-description"
              placeholder={type === "bug" ? "Steps to reproduce, what you expected vs what happened..." : "Describe in detail..."}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Page context, device mode, and recent actions are automatically captured.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !description.trim()}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
