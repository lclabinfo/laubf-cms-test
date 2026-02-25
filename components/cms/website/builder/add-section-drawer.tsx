"use client"

import { useState, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { SectionType } from "@/lib/db/types"
import {
  SECTION_CATALOG,
  SECTION_CATEGORIES,
  type SectionCatalogItem,
  type SectionCategory,
} from "./section-catalog"
import {
  Search,
  ChevronRight,
  Layers,
  Image,
  Sparkles,
  SplitSquareHorizontal,
  Calendar,
  Heart,
  Columns2,
  Grid3x3,
  PlayCircle,
  GalleryHorizontalEnd,
  Quote,
  Megaphone,
  Info,
  AlignLeft,
  LayoutGrid,
  Star,
  ListOrdered,
  Signpost,
  Columns3,
  UserPlus,
  MessageSquare,
  CalendarDays,
  BookOpen,
  Video,
  CalendarCheck,
  CalendarRange,
  Repeat,
  Clock,
  BookHeart,
  CalendarClock,
  Building2,
  List,
  UsersRound,
  MapPin,
  FileEdit,
  HelpCircle,
  GitBranchPlus,
  PanelBottom,
  Link,
  Wheat,
  Code,
  ExternalLink,
  PanelTop,
  Type,
  Database,
  Users,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Icon registry — maps icon name strings to Lucide components
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Image,
  Sparkles,
  SplitSquareHorizontal,
  Calendar,
  Heart,
  Columns2,
  Grid3x3,
  PlayCircle,
  GalleryHorizontalEnd,
  Quote,
  Megaphone,
  Info,
  AlignLeft,
  LayoutGrid,
  Star,
  ListOrdered,
  Signpost,
  Columns3,
  UserPlus,
  MessageSquare,
  CalendarDays,
  BookOpen,
  Video,
  CalendarCheck,
  CalendarRange,
  Repeat,
  Clock,
  BookHeart,
  CalendarClock,
  Building2,
  List,
  UsersRound,
  MapPin,
  FileEdit,
  HelpCircle,
  GitBranchPlus,
  PanelBottom,
  Link,
  Wheat,
  Code,
  ExternalLink,
  PanelTop,
  Type,
  Database,
  Users,
  MousePointerClick,
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  PanelTop,
  Type,
  LayoutGrid,
  Database,
  Users,
  MousePointerClick,
  PanelBottom,
  Code,
}

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutGrid
}

function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICON_MAP[name] ?? LayoutGrid
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AddSectionDrawerProps {
  onAddSection: (type: SectionType, defaultContent: Record<string, unknown>) => void
  onBrowseAll: () => void
}

export function AddSectionDrawer({
  onAddSection,
  onBrowseAll,
}: AddSectionDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [openCategories, setOpenCategories] = useState<Set<SectionCategory>>(
    () => new Set(SECTION_CATEGORIES.map((c) => c.id)),
  )

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return SECTION_CATALOG
    const q = searchQuery.toLowerCase()
    return SECTION_CATALOG.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q),
    )
  }, [searchQuery])

  // Group filtered sections by category
  const groupedSections = useMemo(() => {
    const groups: {
      category: SectionCategory
      label: string
      icon: string
      items: SectionCatalogItem[]
    }[] = []
    for (const cat of SECTION_CATEGORIES) {
      const items = filteredSections.filter((s) => s.category === cat.id)
      if (items.length > 0) {
        groups.push({ category: cat.id, label: cat.label, icon: cat.icon, items })
      }
    }
    return groups
  }, [filteredSections])

  const toggleCategory = useCallback((categoryId: SectionCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (item: SectionCatalogItem) => {
      onAddSection(item.type as SectionType, { ...item.defaultContent })
    },
    [onAddSection],
  )

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="flex flex-col h-full">
      {/* Search field */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sections..."
            className="pl-8 h-8 text-xs bg-muted/50 border-transparent focus-visible:bg-background"
          />
        </div>
      </div>

      {/* Section count */}
      <div className="px-3 pb-2 shrink-0">
        <p className="text-[10px] text-muted-foreground">
          {filteredSections.length} section{filteredSections.length !== 1 ? "s" : ""} available
          {isSearching && (
            <button
              onClick={() => setSearchQuery("")}
              className="ml-1.5 text-primary hover:underline"
            >
              Clear
            </button>
          )}
        </p>
      </div>

      {/* Scrollable section list */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-3">
          {filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">
                No sections found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try a different search term
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-primary mt-3 hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {groupedSections.map((group) => {
                const CatIcon = getCategoryIcon(group.icon)
                const isOpen = isSearching || openCategories.has(group.category)

                return (
                  <Collapsible
                    key={group.category}
                    open={isOpen}
                    onOpenChange={() => {
                      if (!isSearching) toggleCategory(group.category)
                    }}
                  >
                    <CollapsibleTrigger
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors",
                        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        isSearching && "cursor-default",
                      )}
                    >
                      <CatIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 text-left">{group.label}</span>
                      <span className="text-[10px] font-normal tabular-nums text-muted-foreground/60">
                        {group.items.length}
                      </span>
                      {!isSearching && (
                        <ChevronRight
                          className={cn(
                            "w-3 h-3 shrink-0 transition-transform duration-200",
                            isOpen && "rotate-90",
                          )}
                        />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-px pl-1 pb-1">
                        {group.items.map((item) => {
                          const Icon = getIcon(item.icon)
                          return (
                            <button
                              key={item.type}
                              onClick={() => handleSelect(item)}
                              className={cn(
                                "w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 transition-colors group",
                                "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <div className="p-1 rounded bg-muted/70 group-hover:bg-background group-hover:shadow-sm group-hover:ring-1 group-hover:ring-border transition-all shrink-0">
                                <Icon className="w-3 h-3" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium truncate leading-tight">
                                    {item.label}
                                  </span>
                                  {item.isDataDriven && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[8px] px-1 py-0 h-3.5 leading-none shrink-0"
                                    >
                                      Data
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground/70 line-clamp-1 leading-tight mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Browse All button */}
      <div className="px-3 py-3 border-t shrink-0">
        <button
          onClick={onBrowseAll}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5",
            "border-2 border-dashed border-border",
            "text-xs font-medium text-muted-foreground",
            "hover:border-primary hover:text-foreground hover:bg-muted/30",
            "transition-colors",
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          Browse all with previews
        </button>
      </div>
    </div>
  )
}
