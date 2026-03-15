"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { BookOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  BIBLE_BOOKS,
  parseBibleReference,
  formatReference,
  validateReference,
  suggestPassage,
  type BibleReference,
} from "@/lib/bible-data"

interface BiblePassageInputProps {
  value: string
  onChange: (passage: string, reference: BibleReference | null) => void
  placeholder?: string
}

export function BiblePassageInput({
  value,
  onChange,
  placeholder = "Type a book name...",
}: BiblePassageInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [parsedReference, setParsedReference] = useState<BibleReference | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  // "Did you mean?" suggestion shown below the input when user leaves with unrecognized text
  const [suggestion, setSuggestion] = useState<string | null>(null)
  // Track whether the saved value is unformatted (raw text, not from autofill)
  const [isUnformatted, setIsUnformatted] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Determine if a passage is "confirmed" (value is set externally)
  const hasConfirmedPassage = value.trim().length > 0
  // Show the badge when confirmed and not actively editing
  const showBadge = hasConfirmedPassage && !isEditing

  /**
   * On blur / click-outside:
   * 1. If input is parseable → auto-confirm silently (format + save)
   * 2. If input is NOT parseable but has text → save raw text + show "Did you mean?" suggestion
   * 3. If already confirmed → exit editing mode
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)

        const trimmed = inputValue.trim()
        if (trimmed && !hasConfirmedPassage) {
          // User is leaving with text but no confirmed value
          // Try to auto-format if parseable
          const ref = parseBibleReference(trimmed)
          const error = ref ? validateReference(ref) : null

          if (ref && !error) {
            // Valid reference — auto-confirm silently
            const formatted = formatReference(ref)
            onChange(formatted, ref)
            setInputValue("")
            setParsedReference(null)
            setIsEditing(false)
            setSuggestion(null)
            setIsUnformatted(false)
          } else {
            // Not parseable — save raw text and show suggestion
            onChange(trimmed, null)
            setIsEditing(false)
            setIsUnformatted(true)

            const suggested = suggestPassage(trimmed)
            if (suggested && suggested.toLowerCase() !== trimmed.toLowerCase()) {
              setSuggestion(suggested)
            } else {
              setSuggestion(null)
            }
          }
        } else if (trimmed && hasConfirmedPassage) {
          // User was editing an existing value but clicked outside
          // Try to auto-format the edited text
          const ref = parseBibleReference(trimmed)
          const error = ref ? validateReference(ref) : null

          if (ref && !error) {
            const formatted = formatReference(ref)
            onChange(formatted, ref)
            setInputValue("")
            setParsedReference(null)
            setIsEditing(false)
            setSuggestion(null)
            setIsUnformatted(false)
          } else {
            // Save edited raw text
            onChange(trimmed, null)
            setIsEditing(false)
            setIsUnformatted(true)

            const suggested = suggestPassage(trimmed)
            if (suggested && suggested.toLowerCase() !== trimmed.toLowerCase()) {
              setSuggestion(suggested)
            } else {
              setSuggestion(null)
            }
          }
        } else if (hasConfirmedPassage) {
          setIsEditing(false)
          setInputValue("")
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [hasConfirmedPassage, inputValue, onChange])

  // Update suggestions and parsed reference as user types
  useEffect(() => {
    if (showBadge) return

    const result = parseBibleReference(inputValue)
    const error = result ? validateReference(result) : null
    setValidationError(error)
    setParsedReference(error ? null : result)

    const trimmed = inputValue.trim().toLowerCase()

    if (trimmed.length > 0 && !result) {
      const matches = BIBLE_BOOKS.filter((b) =>
        b.toLowerCase().startsWith(trimmed)
      ).slice(0, 5)
      setSuggestions(matches)
      setShowSuggestions(matches.length > 0)
      setActiveIndex(0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setActiveIndex(0)
    }
  }, [inputValue, showBadge])

  // Scroll active suggestion into view
  useEffect(() => {
    if (showSuggestions && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [activeIndex, showSuggestions])

  const handleConfirm = useCallback(
    (ref: BibleReference) => {
      const formatted = formatReference(ref)
      onChange(formatted, ref)
      setInputValue("")
      setParsedReference(null)
      setShowSuggestions(false)
      setIsEditing(false)
      setSuggestion(null)
      setIsUnformatted(false)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange("", null)
    // Pre-fill with the formatted version (not original raw text)
    setInputValue(value)
    setParsedReference(null)
    setIsEditing(true)
    setSuggestion(null)
    setIsUnformatted(false)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [onChange, value])

  const handleEditClick = useCallback(() => {
    setIsEditing(true)
    setInputValue(value)
    setSuggestion(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [value])

  const handleSuggestionClick = useCallback((bookName: string) => {
    setInputValue(bookName + " ")
    inputRef.current?.focus()
  }, [])

  const handleAcceptSuggestion = useCallback((suggested: string) => {
    const ref = parseBibleReference(suggested)
    if (ref && !validateReference(ref)) {
      onChange(formatReference(ref), ref)
      setSuggestion(null)
      setIsUnformatted(false)
    } else {
      // Suggestion itself might not parse perfectly, just save it
      onChange(suggested, null)
      setSuggestion(null)
      setIsUnformatted(false)
    }
  }, [onChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    // Tab — treat like blur, auto-confirm if valid
    if (e.key === "Tab" && parsedReference) {
      handleConfirm(parsedReference)
      return
    }

    // If we have a valid parsed reference, Enter confirms it
    if (parsedReference) {
      if (e.key === "Enter") {
        e.preventDefault()
        handleConfirm(parsedReference)
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setShowSuggestions(false)
        setParsedReference(null)
        if (hasConfirmedPassage) {
          setIsEditing(false)
          setInputValue("")
        }
      }
      return
    }

    if (!showSuggestions || suggestions.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      handleSuggestionClick(suggestions[activeIndex])
    } else if (e.key === "Escape") {
      e.preventDefault()
      setShowSuggestions(false)
      if (hasConfirmedPassage) {
        setIsEditing(false)
        setInputValue("")
      }
    }
  }

  return (
    <div ref={containerRef} className="relative w-full text-sm">
      {showBadge ? (
        <>
          {/* Confirmed state: styled badge/pill */}
          <Badge
            variant="secondary"
            className={cn(
              "h-8 gap-1.5 pl-2 pr-1 text-sm font-normal cursor-pointer hover:bg-secondary/80",
              isUnformatted && "border-amber-500/50"
            )}
            onClick={handleEditClick}
          >
            <BookOpen className="size-3.5 text-muted-foreground" />
            <span className="truncate">{value}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              className="ml-0.5 p-0.5 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors focus:outline-none"
              type="button"
            >
              <X className="size-3" />
            </button>
          </Badge>

          {/* "Did you mean?" suggestion below the badge */}
          {suggestion && (
            <button
              type="button"
              onClick={() => handleAcceptSuggestion(suggestion)}
              className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              Did you mean <span className="font-medium">{suggestion}</span>?
            </button>
          )}
        </>
      ) : (
        <>
          {/* Editing state: clean input */}
          <div
            className="relative flex items-center h-8 w-full rounded-lg border border-input bg-transparent shadow-xs transition-colors focus-within:border-ring focus-within:ring-[1px] focus-within:ring-ring/50"
          >
            <div className="flex-grow relative px-3 h-full flex items-center">
              <input
                ref={inputRef}
                type="text"
                className="w-full h-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true)
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
            </div>

            {/* Status dot: green for valid, red for invalid */}
            {parsedReference && (
              <div className="pr-2.5 flex-shrink-0">
                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            )}
            {validationError && (
              <div className="pr-2.5 flex-shrink-0">
                <div className="size-2 rounded-full bg-destructive" />
              </div>
            )}
          </div>

          {/* Parsed reference confirmation dropdown */}
          {parsedReference && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-md shadow-md border ring-1 ring-foreground/10 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100">
              <button
                onClick={() => handleConfirm(parsedReference)}
                className="w-full text-left px-3 py-2 text-sm bg-accent/50 flex items-center justify-between group hover:bg-accent"
                type="button"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <span className="text-foreground font-medium">
                    {formatReference(parsedReference)}
                  </span>
                </div>
                <kbd className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5 bg-background">
                  Enter
                </kbd>
              </button>
            </div>
          )}

          {/* Validation error dropdown */}
          {validationError && !showSuggestions && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-md shadow-md border ring-1 ring-foreground/10 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100">
              <div className="px-3 py-2 text-sm text-destructive">
                {validationError}
              </div>
            </div>
          )}

          {/* Book suggestions dropdown */}
          {!parsedReference && showSuggestions && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover rounded-md shadow-md border ring-1 ring-foreground/10 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b">
                Books
              </div>
              <div ref={listRef} className="max-h-56 overflow-y-auto">
                {suggestions.map((book, index) => {
                  const isActive = index === activeIndex
                  return (
                    <button
                      key={book}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSuggestionClick(book)}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent"
                      )}
                      type="button"
                    >
                      <span className="font-medium">{book}</span>
                      <kbd
                        className={cn(
                          "text-[10px] border rounded px-1.5 py-0.5 bg-background transition-opacity",
                          isActive
                            ? "text-muted-foreground opacity-100"
                            : "opacity-0"
                        )}
                      >
                        Enter
                      </kbd>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
