"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TutorialDef } from "./tutorial-content"

interface TutorialDialogProps {
  tutorial: TutorialDef
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

function getStorageKey(tutorialId: string, userId: string) {
  return `cms-tutorial-${tutorialId}-${userId}`
}

export function markTutorialComplete(tutorialId: string, userId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(getStorageKey(tutorialId, userId), "true")
}

export function isTutorialComplete(tutorialId: string, userId: string): boolean {
  if (typeof window === "undefined") return true
  return !!localStorage.getItem(getStorageKey(tutorialId, userId))
}

export function resetTutorial(tutorialId: string, userId: string) {
  if (typeof window === "undefined") return
  localStorage.removeItem(getStorageKey(tutorialId, userId))
}

export function TutorialDialog({ tutorial, open, onOpenChange, userId }: TutorialDialogProps) {
  const [step, setStep] = useState(0)
  const totalSteps = tutorial.steps.length
  const current = tutorial.steps[step]
  const isLast = step === totalSteps - 1

  const handleComplete = useCallback(() => {
    markTutorialComplete(tutorial.id, userId)
    setStep(0)
    onOpenChange(false)
  }, [tutorial.id, userId, onOpenChange])

  const handleSkip = useCallback(() => {
    markTutorialComplete(tutorial.id, userId)
    setStep(0)
    onOpenChange(false)
  }, [tutorial.id, userId, onOpenChange])

  const handleNext = useCallback(() => {
    if (isLast) {
      handleComplete()
    } else {
      setStep((s) => s + 1)
    }
  }, [isLast, handleComplete])

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  // Reset step when dialog opens
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) setStep(0)
      onOpenChange(newOpen)
    },
    [onOpenChange]
  )

  const Icon = current.icon

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogTitle className="sr-only">{tutorial.title}</DialogTitle>
        <DialogDescription className="sr-only">
          Step {step + 1} of {totalSteps}: {current.title}
        </DialogDescription>

        {/* Icon area */}
        <div className="flex items-center justify-center bg-primary/5 py-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-8 w-8" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-5 pb-2">
          <h3 className="text-lg font-semibold tracking-tight">{current.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Step indicator + actions */}
        <div className="px-6 pb-5 pt-4">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === step
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                )}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground">
                Back
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-muted-foreground"
              >
                Skip
              </Button>
            )}
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground/60 tabular-nums">
              {step + 1} / {totalSteps}
            </span>
            <Button size="sm" onClick={handleNext}>
              {isLast ? "Get Started" : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
