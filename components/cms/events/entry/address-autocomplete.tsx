"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Loader2, Star, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { SavedAddress } from "@/lib/church-profile-data"

interface NominatimAddress {
  house_number?: string
  road?: string
  city?: string
  town?: string
  village?: string
  state?: string
  postcode?: string
  country?: string
  county?: string
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

function formatAddress(result: NominatimResult): string {
  const a = result.address
  if (!a) return result.display_name

  const city = a.city || a.town || a.village
  const parts: string[] = []

  if (a.house_number && a.road) {
    parts.push(`${a.house_number} ${a.road}`)
  } else if (a.road) {
    parts.push(a.road)
  }

  if (city) parts.push(city)

  if (a.state && a.postcode) {
    parts.push(`${a.state} ${a.postcode}`)
  } else if (a.state) {
    parts.push(a.state)
  }

  return parts.length > 0 ? parts.join(", ") : result.display_name
}

function formatSavedAddress(addr: SavedAddress): string {
  const parts = [addr.address]
  if (addr.city) parts.push(addr.city)
  if (addr.state && addr.zip) parts.push(`${addr.state} ${addr.zip}`)
  else if (addr.state) parts.push(addr.state)
  return parts.join(", ")
}

interface AddressAutocompleteProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  savedAddresses?: SavedAddress[]
  onSelectSaved?: (addr: SavedAddress) => void
}

export function AddressAutocomplete({
  id,
  value,
  onChange,
  placeholder = "Start typing an address...",
  className,
  savedAddresses = [],
  onSelectSaved,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasSaved = savedAddresses.length > 0
  // Show the dropdown when focused with no query (to show saved addresses) or when there are suggestions
  const showDropdown = open || (focused && !value.trim() && hasSaved)

  // Total items for keyboard navigation: suggestions + saved addresses
  const totalItems = suggestions.length + (hasSaved && showDropdown ? savedAddresses.length : 0)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 4) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const base = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`
      const headers = { "Accept-Language": "en" }

      // Try US-only first
      const usRes = await fetch(`${base}&countrycodes=us`, { headers })
      const usData: NominatimResult[] = await usRes.json()

      if (usData.length > 0) {
        setSuggestions(usData)
        setOpen(true)
      } else {
        // Fallback: search all countries
        const allRes = await fetch(base, { headers })
        const allData: NominatimResult[] = await allRes.json()
        setSuggestions(allData)
        setOpen(allData.length > 0)
      }
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    onChange(val)
    setActiveIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 200)
  }

  function handleSelectNominatim(result: NominatimResult) {
    onChange(formatAddress(result))
    setSuggestions([])
    setOpen(false)
    setFocused(false)
    setActiveIndex(-1)
  }

  function handleSelectSaved(addr: SavedAddress) {
    if (onSelectSaved) {
      onSelectSaved(addr)
    } else {
      onChange(formatSavedAddress(addr))
    }
    setSuggestions([])
    setOpen(false)
    setFocused(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || totalItems === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, totalItems - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault()
      if (activeIndex < suggestions.length) {
        handleSelectNominatim(suggestions[activeIndex])
      } else {
        const savedIdx = activeIndex - suggestions.length
        handleSelectSaved(savedAddresses[savedIdx])
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setFocused(false)
      setActiveIndex(-1)
    }
  }

  function handleFocus() {
    setFocused(true)
    if (suggestions.length > 0) setOpen(true)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const showSavedSection = hasSaved && showDropdown
  const hasAnythingToShow = suggestions.length > 0 || showSavedSection

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="pl-9 pr-8"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showDropdown && hasAnythingToShow}
          aria-haspopup="listbox"
          role="combobox"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showDropdown && hasAnythingToShow && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md overflow-hidden py-1"
        >
          {/* Nominatim search results */}
          {suggestions.map((s, i) => (
            <li
              key={s.place_id}
              role="option"
              aria-selected={i === activeIndex}
              className={cn(
                "flex items-start gap-2 px-3 py-2 text-sm cursor-pointer select-none",
                i === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelectNominatim(s)
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <MapPin className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="leading-snug">{formatAddress(s)}</span>
            </li>
          ))}

          {/* Saved addresses section */}
          {showSavedSection && (
            <>
              {suggestions.length > 0 && (
                <li className="border-t my-1" role="separator" />
              )}
              <li className="px-3 pt-1.5 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider select-none">
                Saved Addresses
              </li>
              {savedAddresses.map((addr, i) => {
                const itemIndex = suggestions.length + i
                return (
                  <li
                    key={addr.id}
                    role="option"
                    aria-selected={itemIndex === activeIndex}
                    className={cn(
                      "flex items-start gap-2 px-3 py-2 text-sm cursor-pointer select-none",
                      itemIndex === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelectSaved(addr)
                    }}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                  >
                    <Building2 className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium leading-snug">{addr.label}</span>
                        {addr.isPrimary && (
                          <Star className="size-3 text-amber-500 shrink-0" fill="currentColor" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground leading-snug">
                        {formatSavedAddress(addr)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </>
          )}
        </ul>
      )}
    </div>
  )
}
