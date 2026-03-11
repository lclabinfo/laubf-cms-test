"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpotlightStep {
  /** CSS selector for the target element (e.g. '[data-tutorial="msg-table"]') */
  target: string
  /** Short title */
  title: string
  /** Concise description (1-2 sentences max) */
  description: string
  /** Preferred popover placement relative to target */
  placement?: "top" | "bottom" | "left" | "right"
}

export interface SpotlightTourDef {
  id: string
  steps: SpotlightStep[]
}

interface SpotlightTourProps {
  tour: SpotlightTourDef
  userId: string
  active: boolean
  onEnd: () => void
  /** Called before each step so the parent can prepare the DOM (e.g. switch tabs).
   *  Receives the step index. */
  onBeforeStep?: (stepIndex: number) => void
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

function storageKey(id: string, userId: string) {
  return `cms-spotlight-${id}-${userId}`
}

export function isSpotlightComplete(id: string, userId: string): boolean {
  if (typeof window === "undefined") return true
  return !!localStorage.getItem(storageKey(id, userId))
}

export function markSpotlightComplete(id: string, userId: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(storageKey(id, userId), "true")
}

export function resetSpotlight(id: string, userId: string) {
  if (typeof window === "undefined") return
  localStorage.removeItem(storageKey(id, userId))
}

// ---------------------------------------------------------------------------
// Positioning helpers
// ---------------------------------------------------------------------------

const PAD = 6
const GAP = 10
const POP_W = 320

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function getTargetRect(selector: string): Rect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  }
}

function calcPopoverPos(
  rect: Rect,
  popH: number,
  preferred?: "top" | "bottom" | "left" | "right"
): { top: number; left: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const placements = preferred
    ? [preferred, "bottom", "top", "right", "left"]
    : ["bottom", "top", "right", "left"]

  for (const p of placements) {
    let t = 0
    let l = 0
    switch (p) {
      case "bottom":
        t = rect.top + rect.height + GAP
        l = rect.left + rect.width / 2 - POP_W / 2
        if (t + popH < vh - 8) return { top: t, left: clampX(l, vw) }
        break
      case "top":
        t = rect.top - popH - GAP
        l = rect.left + rect.width / 2 - POP_W / 2
        if (t > 8) return { top: t, left: clampX(l, vw) }
        break
      case "right":
        t = rect.top + rect.height / 2 - popH / 2
        l = rect.left + rect.width + GAP
        if (l + POP_W < vw - 8) return { top: clampY(t, vh, popH), left: l }
        break
      case "left":
        t = rect.top + rect.height / 2 - popH / 2
        l = rect.left - POP_W - GAP
        if (l > 8) return { top: clampY(t, vh, popH), left: l }
        break
    }
  }

  return {
    top: Math.min(rect.top + rect.height + GAP, vh - popH - 8),
    left: clampX(rect.left + rect.width / 2 - POP_W / 2, vw),
  }
}

function clampX(l: number, vw: number) {
  return Math.max(8, Math.min(l, vw - POP_W - 8))
}

function clampY(t: number, vh: number, popH: number) {
  return Math.max(8, Math.min(t, vh - popH - 8))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TRANSITION_MS = 350 // spotlight CSS transition duration

export function SpotlightTour({ tour, userId, active, onEnd, onBeforeStep }: SpotlightTourProps) {
  const [step, setStep] = useState(0)
  // displayStep only updates AFTER the spotlight has finished moving,
  // so the popover text doesn't change while the box is still animating.
  const [displayStep, setDisplayStep] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [popPos, setPopPos] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [popVisible, setPopVisible] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(0)

  const steps = tour.steps
  const total = steps.length
  const current = steps[step]
  const display = steps[displayStep]
  const isLast = step === total - 1

  useEffect(() => setMounted(true), [])

  // Lock body scroll
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [active])

  // Measure target and compute popover position
  const measure = useCallback(() => {
    if (!current) return
    const r = getTargetRect(current.target)
    if (!r) return
    setRect(r)
    if (popRef.current) {
      const popH = popRef.current.offsetHeight || 160
      setPopPos(calcPopoverPos(r, popH, current.placement))
    }
  }, [current])

  // When step changes: hide popover → call onBeforeStep → wait for DOM → move spotlight → wait for transition → show popover with new text
  useEffect(() => {
    if (!active || !current) return

    const isNewStep = prevStepRef.current !== step
    prevStepRef.current = step

    if (!isNewStep) {
      // Initial mount or same step — just measure and show
      const el = document.querySelector(current.target)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })
      const t = setTimeout(() => {
        measure()
        setDisplayStep(step)
        setPopVisible(true)
      }, 100)
      return () => clearTimeout(t)
    }

    // --- New step transition ---
    // 1. Hide popover immediately
    setPopVisible(false)

    // 2. Call onBeforeStep (e.g. switch tabs)
    onBeforeStep?.(step)

    // 3. After DOM settles, scroll into view and move spotlight
    const domTimer = setTimeout(() => {
      const el = document.querySelector(current.target)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" })

      // 4. After scroll, measure new position (spotlight starts animating via CSS)
      const scrollTimer = setTimeout(() => {
        measure()

        // 5. After spotlight transition completes, update text and show popover
        const transTimer = setTimeout(() => {
          setDisplayStep(step)
          setPopVisible(true)
        }, TRANSITION_MS)

        return () => clearTimeout(transTimer)
      }, 120)

      return () => clearTimeout(scrollTimer)
    }, 200)

    return () => clearTimeout(domTimer)
  }, [step, active, current, measure, onBeforeStep])

  // Recalc popover position after it renders (for accurate height)
  useEffect(() => {
    if (!active || !rect || !popVisible) return
    const frame = requestAnimationFrame(() => {
      if (popRef.current && rect) {
        const popH = popRef.current.offsetHeight
        const newStep = steps[displayStep]
        setPopPos(calcPopoverPos(rect, popH, newStep?.placement))
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [active, rect, popVisible, displayStep, steps])

  // Recalc on resize
  useEffect(() => {
    if (!active) return
    const handler = () => measure()
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [active, measure])

  // Keyboard navigation
  useEffect(() => {
    if (!active) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish()
      if (e.key === "ArrowRight" || e.key === "Enter") next()
      if (e.key === "ArrowLeft" && step > 0) goTo(step - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  function finish() {
    markSpotlightComplete(tour.id, userId)
    setStep(0)
    setDisplayStep(0)
    setRect(null)
    setPopPos(null)
    setPopVisible(false)
    onEnd()
  }

  function next() {
    if (isLast) finish()
    else goTo(step + 1)
  }

  function goTo(idx: number) {
    setStep(idx)
  }

  if (!active || !mounted) return null

  const easing = "cubic-bezier(0.4,0,0.2,1)"

  return createPortal(
    <div className="spotlight-tour">
      {/* Click-blocking overlay */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={finish}
        aria-hidden
      />

      {/* Spotlight overlay */}
      {rect && (
        <div
          className="fixed z-[9998] rounded-lg pointer-events-none"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
            transition: `top ${TRANSITION_MS}ms ${easing}, left ${TRANSITION_MS}ms ${easing}, width ${TRANSITION_MS}ms ${easing}, height ${TRANSITION_MS}ms ${easing}`,
          }}
        />
      )}

      {/* Spotlight border ring */}
      {rect && (
        <div
          className="fixed z-[9998] rounded-lg pointer-events-none border-2 border-primary/30"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            transition: `top ${TRANSITION_MS}ms ${easing}, left ${TRANSITION_MS}ms ${easing}, width ${TRANSITION_MS}ms ${easing}, height ${TRANSITION_MS}ms ${easing}`,
          }}
        />
      )}

      {/* Popover */}
      <div
        ref={popRef}
        className={cn(
          "fixed z-[10000] rounded-xl border bg-popover text-popover-foreground shadow-2xl",
          "transition-opacity duration-200 ease-out",
          popVisible && popPos ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: POP_W,
          ...(popPos ?? { top: 0, left: 0 }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={finish}
          className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Close tour"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>

        {/* Content — uses displayStep so text updates only after spotlight lands */}
        <div className="px-4 pt-3.5 pb-2 pr-9">
          <p className="font-semibold text-[13px] leading-snug">{display?.title}</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {display?.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center px-4 pb-3 pt-1">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo(step - 1)}
              className="h-8 px-3 text-xs text-muted-foreground"
            >
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={finish}
              className="h-8 px-3 text-xs text-muted-foreground"
            >
              Skip
            </Button>
          )}

          {/* Step dots */}
          <div className="flex-1 flex justify-center gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === step ? "w-4 bg-primary" : "w-1 bg-muted-foreground/25 hover:bg-muted-foreground/40"
                )}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={next}
            className="h-8 px-5 text-xs font-medium"
          >
            {isLast ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
