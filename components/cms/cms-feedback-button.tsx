"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"
import { MessageSquareWarning, Bug, Lightbulb, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const TYPES = [
  { value: "bug", label: "Bug Report", icon: Bug },
  { value: "feature", label: "Feature Request", icon: Lightbulb },
  { value: "feedback", label: "Feedback", icon: MessageCircle },
] as const

export function CmsFeedbackButton() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>("bug")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Don't show on builder pages — the builder has its own feedback button
  if (pathname?.startsWith("/cms/website/builder")) return null

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }

    setIsSubmitting(true)
    try {
      const snapshot = {
        source: "cms",
        cmsPage: pathname,
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
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error?.message || "Failed to submit feedback")
      }

      toast.success("Feedback submitted! Thank you.")
      setOpen(false)
      setTitle("")
      setDescription("")
      setType("bug")
    } catch (err) {
      console.error("CMS feedback submit error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to submit feedback")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full shadow-lg bg-background hover:bg-muted border-border"
              onClick={() => setOpen(true)}
            >
              <MessageSquareWarning className="size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Send Feedback</TooltipContent>
        </Tooltip>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
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
              <Label htmlFor="cms-feedback-title" className="text-xs font-medium text-muted-foreground">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cms-feedback-title"
                placeholder={type === "bug" ? "What went wrong?" : type === "feature" ? "What would you like?" : "Your feedback"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cms-feedback-description" className="text-xs font-medium text-muted-foreground">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cms-feedback-description"
                placeholder={type === "bug" ? "Steps to reproduce, what you expected vs what happened..." : "Describe in detail..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <p className="text-[11px] text-muted-foreground">
              Current page ({pathname}) and browser info are automatically captured.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !title.trim() || !description.trim()}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
