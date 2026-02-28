"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, BookOpen, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BIBLE_BOOKS,
  parseBibleReference,
  formatReference,
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
  placeholder = "e.g. John 3:16",
}: BiblePassageInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [parsedReference, setParsedReference] = useState<BibleReference | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Determine if a passage is "confirmed" (value is set externally)
  const hasConfirmedPassage = value.trim().length > 0

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Update suggestions and parsed reference as user types
  useEffect(() => {
    if (hasConfirmedPassage) return

    const result = parseBibleReference(inputValue)
    setParsedReference(result)

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
  }, [inputValue, hasConfirmedPassage])

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
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange("", null)
    setInputValue("")
    setParsedReference(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [onChange])

  const handleSuggestionClick = useCallback((bookName: string) => {
    setInputValue(bookName + " ")
    inputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
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
    }
  }

  return (
    <div ref={containerRef} className="relative w-full text-sm">
      {/* Input container */}
      <div
        className={cn(
          "relative flex items-center h-9 w-full rounded-md border bg-transparent shadow-xs transition-colors",
          hasConfirmedPassage
            ? "border-primary/40 bg-primary/5"
            : "border-input focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
        )}
      >
        {/* Search icon */}
        <div className="pl-2.5 flex-shrink-0 text-muted-foreground">
          <Search className="size-4" />
        </div>

        <div className="flex-grow relative px-2 h-full flex items-center">
          {hasConfirmedPassage ? (
            <div className="flex items-center w-full justify-between">
              <span className="font-medium text-foreground truncate">
                {value}
              </span>
              <button
                onClick={handleClear}
                className="ml-2 p-0.5 text-muted-foreground hover:text-destructive rounded transition-colors focus:outline-none"
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
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
          )}
        </div>

        {/* Green dot for valid reference */}
        {!hasConfirmedPassage && parsedReference && (
          <div className="pr-2.5 flex-shrink-0">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Parsed reference confirmation dropdown */}
      {!hasConfirmedPassage && parsedReference && (
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

      {/* Book suggestions dropdown */}
      {!hasConfirmedPassage && !parsedReference && showSuggestions && (
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
    </div>
  )
}
