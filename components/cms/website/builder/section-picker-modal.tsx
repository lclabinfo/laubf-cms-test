"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
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

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutGrid
}

// ---------------------------------------------------------------------------
// Preview thumbnails — static JSX previews for each category
// ---------------------------------------------------------------------------

const CATEGORY_PREVIEWS: Record<string, React.ReactNode> = {
  // Hero sections
  HERO_BANNER: (
    <div className="w-full h-full bg-slate-900 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-8 gap-3">
        <div className="space-y-1">
          <div className="w-20 h-2.5 bg-white/90 rounded-sm" />
          <div className="w-32 h-5 bg-white rounded-sm" />
        </div>
        <div className="w-full h-2 bg-white/30 rounded-sm" />
        <div className="flex gap-2 mt-1">
          <div className="w-14 h-5 bg-white rounded-full" />
          <div className="w-14 h-5 border border-white/50 rounded-full" />
        </div>
      </div>
    </div>
  ),
  PAGE_HERO: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 gap-3">
      <div className="w-16 h-2 bg-slate-300 rounded-sm" />
      <div className="w-40 h-5 bg-slate-900/10 rounded-sm" />
      <div className="flex gap-2 mt-2">
        <div className="w-12 h-4 bg-slate-900/10 rounded-full" />
        <div className="w-12 h-4 border border-slate-300 rounded-full" />
      </div>
      <div className="absolute top-4 right-8 w-8 h-8 bg-slate-200 rounded-lg opacity-40 rotate-12" />
      <div className="absolute bottom-6 left-6 w-10 h-7 bg-slate-200 rounded-lg opacity-30 -rotate-6" />
    </div>
  ),
  TEXT_IMAGE_HERO: (
    <div className="w-full h-full bg-white flex flex-col p-6 gap-4 justify-center">
      <div className="w-16 h-1.5 bg-slate-400/50 rounded-sm" />
      <div className="w-3/4 h-4 bg-slate-900/10 rounded-sm" />
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-slate-900/10 rounded-sm" />
        <div className="w-5/6 h-1.5 bg-slate-900/10 rounded-sm" />
      </div>
      <div className="w-full h-16 bg-slate-100 rounded-lg mt-2" />
    </div>
  ),
  EVENTS_HERO: (
    <div className="w-full h-full bg-white flex flex-col justify-center p-6 gap-2">
      <div className="w-24 h-5 bg-slate-900/10 rounded-sm" />
      <div className="w-48 h-2 bg-slate-400/30 rounded-sm" />
    </div>
  ),
  MINISTRY_HERO: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 gap-3 text-center">
      <div className="w-16 h-1.5 bg-slate-400/50 rounded-sm" />
      <div className="w-36 h-5 bg-slate-900/10 rounded-sm" />
      <div className="w-14 h-5 bg-slate-900/10 rounded-full mt-1" />
      <div className="w-full h-14 bg-slate-100 rounded-lg mt-2" />
    </div>
  ),
  // Content sections
  MEDIA_TEXT: (
    <div className="w-full h-full bg-slate-900 flex p-4 gap-4 items-center overflow-hidden">
      <div className="w-[40%] flex flex-col gap-2 shrink-0">
        <div className="w-8 h-6 bg-slate-700 rounded" />
        <div className="w-6 h-6 bg-slate-700 rounded" />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-10 h-1 bg-white/30 rounded-sm" />
        <div className="w-full h-3 bg-white/20 rounded-sm" />
        <div className="space-y-1">
          <div className="w-full h-1 bg-white/10 rounded-sm" />
          <div className="w-4/5 h-1 bg-white/10 rounded-sm" />
        </div>
      </div>
    </div>
  ),
  MEDIA_GRID: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="w-20 h-3 bg-slate-900/10 rounded-sm" />
        <div className="w-12 h-2 bg-blue-500/30 rounded-sm" />
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-100 rounded-sm aspect-video" />
        ))}
      </div>
    </div>
  ),
  SPOTLIGHT_MEDIA: (
    <div className="w-full h-full bg-white p-6 flex flex-col gap-3 justify-center">
      <div className="w-16 h-1.5 bg-slate-400/30 rounded-sm" />
      <div className="w-3/4 h-4 bg-slate-900/10 rounded-sm" />
      <div className="w-full aspect-video bg-slate-100 rounded-lg mt-2 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
          <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-transparent border-l-slate-400 ml-0.5" />
        </div>
      </div>
    </div>
  ),
  PHOTO_GALLERY: (
    <div className="w-full h-full bg-white p-4 overflow-hidden flex flex-col gap-3">
      <div className="w-16 h-3 bg-slate-900/10 rounded-sm mx-auto" />
      <div className="flex gap-2 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-16 flex-shrink-0 bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  ),
  QUOTE_BANNER: (
    <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center gap-3">
      <div className="w-16 h-1.5 bg-white/20 rounded-sm" />
      <div className="w-24 h-4 bg-white/30 rounded-sm" />
      <div className="space-y-1 mt-2 w-full">
        <div className="w-full h-1.5 bg-white/15 rounded-sm" />
        <div className="w-5/6 h-1.5 bg-white/15 rounded-sm mx-auto" />
      </div>
      <div className="w-20 h-1.5 bg-white/10 rounded-sm mt-1" />
    </div>
  ),
  CTA_BANNER: (
    <div className="w-full h-full bg-[#0d0d0d] flex flex-col items-center justify-center p-6 text-center gap-3">
      <div className="w-3/4 h-3 bg-white/20 rounded-sm" />
      <div className="w-full h-1.5 bg-white/10 rounded-sm" />
      <div className="w-5/6 h-1.5 bg-white/10 rounded-sm" />
      <div className="flex gap-2 mt-2">
        <div className="w-12 h-4 bg-white rounded-full" />
        <div className="w-12 h-4 border border-white/40 rounded-full" />
      </div>
    </div>
  ),
  ABOUT_DESCRIPTION: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 gap-3 text-center">
      <div className="w-10 h-10 bg-slate-100 rounded" />
      <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
      <div className="space-y-1 w-full">
        <div className="w-full h-1.5 bg-slate-900/10 rounded-sm" />
        <div className="w-5/6 h-1.5 bg-slate-900/10 rounded-sm mx-auto" />
      </div>
    </div>
  ),
  STATEMENT: (
    <div className="w-full h-full bg-white flex p-6 gap-6 items-start">
      <div className="w-[35%] shrink-0">
        <div className="w-full h-4 bg-slate-900/10 rounded-sm" />
      </div>
      <div className="flex-1 flex flex-col gap-3">
        <div className="w-full h-3 bg-slate-900/15 rounded-sm" />
        <div className="w-full h-3 bg-slate-400/20 rounded-sm" />
        <div className="w-full h-3 bg-slate-400/20 rounded-sm" />
      </div>
    </div>
  ),
  // Cards
  ACTION_CARD_GRID: (
    <div className="w-full h-full bg-white flex p-4 gap-4">
      <div className="w-[30%] shrink-0 flex flex-col gap-2 justify-center">
        <div className="w-full h-3 bg-slate-900/10 rounded-sm" />
        <div className="w-3/4 h-2 bg-slate-400/20 rounded-sm" />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>
  ),
  HIGHLIGHT_CARDS: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
      <div className="flex-1 grid grid-cols-2 gap-2">
        <div className="row-span-2 bg-slate-100 rounded-lg" />
        <div className="bg-slate-100 rounded-lg" />
        <div className="bg-slate-100 rounded-lg" />
      </div>
    </div>
  ),
  FEATURE_BREAKDOWN: (
    <div className="w-full h-full bg-blue-50 flex p-5 gap-4 items-center">
      <div className="flex flex-col gap-1 w-[35%] shrink-0">
        <div className="text-[18px] font-bold leading-none text-slate-300">F</div>
        <div className="text-[18px] font-bold leading-none text-slate-300">U</div>
        <div className="text-[18px] font-bold leading-none text-slate-300">L</div>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-full h-1.5 bg-slate-900/10 rounded-sm" />
        <div className="w-4/5 h-1.5 bg-slate-900/10 rounded-sm" />
        <div className="w-14 h-4 bg-slate-900/10 rounded-full mt-2" />
      </div>
    </div>
  ),
  PATHWAY_CARD: (
    <div className="w-full h-full bg-white flex items-center justify-center p-4 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 text-center">
          <div className="w-6 h-6 bg-slate-200 rounded" />
          <div className="w-full h-2 bg-slate-900/10 rounded-sm" />
          <div className="w-3/4 h-1 bg-slate-400/20 rounded-sm" />
        </div>
      ))}
    </div>
  ),
  PILLARS: (
    <div className="w-full h-full bg-white flex flex-col p-4 gap-3">
      <div className="w-20 h-3 bg-slate-900/10 rounded-sm" />
      <div className="flex-1 flex gap-3 items-center">
        <div className="flex-1 bg-slate-100 rounded-lg h-full" />
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="w-full h-2 bg-slate-900/10 rounded-sm" />
          <div className="w-3/4 h-1.5 bg-slate-400/20 rounded-sm" />
        </div>
      </div>
    </div>
  ),
  NEWCOMER: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 gap-3 text-center">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <div className="w-4 h-4 bg-slate-300 rounded-full" />
      </div>
      <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
      <div className="w-4/5 h-1.5 bg-slate-400/20 rounded-sm" />
      <div className="w-16 h-4 bg-slate-900/10 rounded-full mt-1" />
    </div>
  ),
  // Data
  ALL_MESSAGES: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="flex-1 h-6 bg-slate-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="aspect-video bg-slate-100 rounded" />
            <div className="w-full h-1.5 bg-slate-900/10 rounded-sm" />
            <div className="w-2/3 h-1 bg-slate-400/20 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  ),
  ALL_EVENTS: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="w-16 h-3 bg-slate-900/10 rounded-sm" />
      <div className="flex gap-2">
        <div className="w-8 h-4 bg-slate-900/80 rounded-full" />
        <div className="w-10 h-4 bg-slate-100 rounded-full" />
        <div className="w-12 h-4 bg-slate-100 rounded-full" />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-t border-slate-100">
            <div className="w-8 h-6 bg-slate-100 rounded" />
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="w-3/4 h-1.5 bg-slate-900/10 rounded-sm" />
              <div className="w-1/2 h-1 bg-slate-400/20 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  ALL_BIBLE_STUDIES: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="flex-1 h-6 bg-slate-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1">
            <div className="w-full h-2 bg-slate-900/10 rounded-sm" />
            <div className="w-2/3 h-1 bg-slate-400/20 rounded-sm" />
            <div className="flex gap-1 mt-auto">
              <div className="w-3 h-3 bg-slate-200 rounded" />
              <div className="w-3 h-3 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  ALL_VIDEOS: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="flex-1 h-6 bg-slate-100 rounded-lg" />
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="aspect-video bg-slate-100 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-slate-200 rounded-full" />
            </div>
            <div className="w-full h-1.5 bg-slate-900/10 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  ),
  UPCOMING_EVENTS: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3 items-center">
      <div className="w-16 h-1.5 bg-slate-400/30 rounded-sm" />
      <div className="w-28 h-3 bg-slate-900/10 rounded-sm" />
      <div className="w-full grid grid-cols-3 gap-2 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1">
            <div className="w-full aspect-[4/3] bg-slate-100 rounded" />
            <div className="w-full h-1.5 bg-slate-900/10 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  ),
  EVENT_CALENDAR: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
        <div className="flex gap-1">
          <div className="w-10 h-4 bg-slate-100 rounded" />
          <div className="w-10 h-4 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className={cn("rounded text-center", i === 5 ? "bg-slate-900/10" : "bg-slate-50")} />
        ))}
      </div>
    </div>
  ),
  RECURRING_MEETINGS: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3 items-center">
      <div className="w-28 h-3 bg-slate-900/10 rounded-sm" />
      <div className="w-full flex flex-col gap-2 flex-1">
        {[1, 2].map((i) => (
          <div key={i} className="border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-4 bg-blue-500/20 rounded-full" />
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="w-3/4 h-2 bg-slate-900/10 rounded-sm" />
              <div className="w-1/2 h-1 bg-slate-400/20 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  RECURRING_SCHEDULE: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
      <div className="grid grid-cols-2 gap-2 flex-1">
        {[1, 2].map((i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
            <div className="w-3/4 h-2 bg-slate-900/10 rounded-sm" />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((d) => (
                <div key={d} className={cn("w-4 h-4 rounded-full", d === 1 ? "bg-slate-900/20" : "bg-slate-100")} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  // Ministry
  MINISTRY_INTRO: (
    <div className="w-full h-full bg-white flex p-5 gap-4 items-center">
      <div className="w-[40%] bg-slate-100 rounded-xl h-full shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-12 h-1 bg-slate-400/30 rounded-sm" />
        <div className="w-full h-3 bg-slate-900/10 rounded-sm" />
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-slate-900/10 rounded-sm" />
          <div className="w-4/5 h-1.5 bg-slate-900/10 rounded-sm" />
        </div>
      </div>
    </div>
  ),
  MINISTRY_SCHEDULE: (
    <div className="w-full h-full bg-white flex p-5 gap-4 items-start">
      <div className="flex-1 flex flex-col gap-2">
        <div className="w-full h-3 bg-slate-900/10 rounded-sm" />
        <div className="w-3/4 h-1.5 bg-slate-400/20 rounded-sm" />
        <div className="mt-2 space-y-2">
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 bg-slate-200 rounded" />
            <div className="w-24 h-1.5 bg-slate-900/10 rounded-sm" />
          </div>
        </div>
      </div>
      <div className="w-[40%] bg-slate-100 rounded-xl h-full shrink-0" />
    </div>
  ),
  CAMPUS_CARD_GRID: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-5 gap-3">
      <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
      <div className="flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-3 py-2 border border-slate-200 rounded-xl">
            <div className="w-12 h-1.5 bg-slate-900/10 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  ),
  DIRECTORY_LIST: (
    <div className="w-full h-full bg-white flex p-5 gap-6">
      <div className="flex-1 flex flex-col items-end justify-center gap-2">
        {["Item 1", "Item 2", "Item 3"].map((text) => (
          <div key={text} className="w-20 h-3 bg-slate-300/40 rounded-sm" />
        ))}
      </div>
      <div className="w-[40%] shrink-0 flex flex-col gap-2">
        <div className="w-3/4 h-3 bg-slate-900/10 rounded-sm" />
        <div className="flex-1 bg-slate-100 rounded-lg" />
      </div>
    </div>
  ),
  MEET_TEAM: (
    <div className="w-full h-full bg-white flex flex-col items-center p-4 gap-3">
      <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
      <div className="flex gap-3 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="aspect-square w-full bg-slate-100 rounded-lg" />
            <div className="w-3/4 h-1.5 bg-slate-900/10 rounded-sm" />
            <div className="w-1/2 h-1 bg-slate-400/20 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  ),
  LOCATION_DETAIL: (
    <div className="w-full h-full bg-white flex p-5 gap-4 items-start">
      <div className="flex-1 flex flex-col gap-3">
        <div className="w-12 h-1 bg-slate-400/30 rounded-sm" />
        <div className="space-y-1">
          <div className="w-16 h-1 bg-slate-400/20 rounded-sm" />
          <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
        </div>
        <div className="space-y-1">
          <div className="w-16 h-1 bg-slate-400/20 rounded-sm" />
          <div className="w-full h-2 bg-slate-900/10 rounded-sm" />
          <div className="w-3/4 h-2 bg-slate-900/10 rounded-sm" />
        </div>
      </div>
      <div className="w-[50%] bg-slate-100 rounded-xl h-full shrink-0" />
    </div>
  ),
  // Interactive
  FORM_SECTION: (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-5 gap-3">
      <div className="w-20 h-3 bg-slate-900/10 rounded-sm" />
      <div className="w-4/5 bg-white rounded-2xl p-3 flex flex-col gap-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-5 bg-slate-50 rounded border border-slate-200" />
          <div className="h-5 bg-slate-50 rounded border border-slate-200" />
        </div>
        <div className="h-5 bg-slate-50 rounded border border-slate-200" />
        <div className="h-6 bg-slate-900/10 rounded-full" />
      </div>
    </div>
  ),
  FAQ_SECTION: (
    <div className="w-full h-full bg-white flex flex-col items-center p-5 gap-3">
      <div className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center">
        <span className="text-[10px] text-slate-400 font-bold">?</span>
      </div>
      <div className="w-24 h-3 bg-slate-900/10 rounded-sm" />
      <div className="w-full flex flex-col gap-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-slate-200 rounded-xl px-3 py-2 flex justify-between items-center">
            <div className="w-3/4 h-1.5 bg-slate-900/10 rounded-sm" />
            <div className="w-3 h-3 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  ),
  TIMELINE_SECTION: (
    <div className="w-full h-full bg-white flex p-5 gap-4">
      <div className="w-[35%] bg-slate-100 rounded-xl shrink-0" />
      <div className="flex-1 flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 shrink-0" />
            <div className="flex-1 flex flex-col gap-0.5">
              <div className="w-10 h-1 bg-slate-400/20 rounded-sm" />
              <div className="w-3/4 h-1.5 bg-slate-900/10 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  // Layout
  FOOTER: (
    <div className="w-full h-full bg-[#0d0d0d] flex p-4 gap-4">
      <div className="flex flex-col gap-2 w-[30%]">
        <div className="w-8 h-6 bg-white/20 rounded" />
        <div className="w-full h-1 bg-white/10 rounded-sm" />
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-white/15 rounded-full" />
          <div className="w-4 h-4 bg-white/15 rounded-full" />
        </div>
      </div>
      {[1, 2].map((i) => (
        <div key={i} className="flex-1 flex flex-col gap-1">
          <div className="w-10 h-1 bg-white/20 rounded-sm" />
          <div className="w-full h-1 bg-white/10 rounded-sm" />
          <div className="w-3/4 h-1 bg-white/10 rounded-sm" />
        </div>
      ))}
    </div>
  ),
  QUICK_LINKS: (
    <div className="w-full h-full bg-white p-4 flex flex-col gap-3">
      <div className="w-20 h-3 bg-slate-900/10 rounded-sm" />
      <div className="flex gap-2 flex-1 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-24 shrink-0 border border-slate-200 rounded-2xl p-2 flex flex-col gap-1">
            <div className="w-10 h-3 bg-blue-500/20 rounded-full text-[7px]" />
            <div className="w-full h-2 bg-slate-900/10 rounded-sm" />
            <div className="w-3/4 h-1 bg-slate-400/20 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  ),
  DAILY_BREAD_FEATURE: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 gap-2">
      <div className="w-8 h-8 bg-amber-100 rounded-lg" />
      <div className="w-20 h-3 bg-slate-900/10 rounded-sm" />
      <div className="w-3/4 h-1.5 bg-slate-400/20 rounded-sm" />
    </div>
  ),
  // Custom
  CUSTOM_HTML: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 gap-2">
      <div className="font-mono text-[10px] text-slate-400 leading-tight text-center">
        &lt;div&gt;
        <br />
        &nbsp;&nbsp;...
        <br />
        &lt;/div&gt;
      </div>
    </div>
  ),
  CUSTOM_EMBED: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center p-6 gap-2">
      <div className="w-full aspect-video bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
        <div className="w-5 h-5 bg-slate-200 rounded" />
      </div>
    </div>
  ),
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type PickerMode = "dialog" | "sidebar" | "popover"

interface SectionPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (type: SectionType, defaultContent: Record<string, unknown>) => void
  /** Positioning mode. 'dialog' = centered modal (default), 'sidebar' = fixed near sidebar, 'popover' = near trigger */
  mode?: PickerMode
  /** Trigger button rect for 'popover' positioning */
  triggerRect?: DOMRect | null
}

export function SectionPickerModal({
  open,
  onOpenChange,
  onSelect,
  mode = "dialog",
  triggerRect = null,
}: SectionPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<SectionCategory | null>(null)
  const [hoveredItem, setHoveredItem] = useState<SectionCatalogItem | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus search input when panel opens in sidebar/popover mode
  useEffect(() => {
    if (open && mode !== "dialog") {
      // Small delay to allow DOM to render
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open, mode])

  // Filter sections by search query and/or active category
  const filteredSections = useMemo(() => {
    let sections = SECTION_CATALOG

    // Filter by category
    if (activeCategory) {
      sections = sections.filter((s) => s.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      sections = sections.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    }

    return sections
  }, [searchQuery, activeCategory])

  // Group filtered sections by category for display
  const groupedSections = useMemo(() => {
    const groups: { category: SectionCategory; label: string; items: SectionCatalogItem[] }[] = []
    for (const cat of SECTION_CATEGORIES) {
      const items = filteredSections.filter((s) => s.category === cat.id)
      if (items.length > 0) {
        groups.push({ category: cat.id, label: cat.label, items })
      }
    }
    return groups
  }, [filteredSections])

  // The preview item = hovered item or first in list
  const previewItem = hoveredItem ?? filteredSections[0] ?? null

  const handleSelect = useCallback(
    (item: SectionCatalogItem) => {
      onSelect(item.type as SectionType, { ...item.defaultContent })
      onOpenChange(false)
      // Reset state
      setSearchQuery("")
      setActiveCategory(null)
      setHoveredItem(null)
    },
    [onSelect, onOpenChange],
  )

  const handleOpenChange = useCallback(
    (value: boolean) => {
      onOpenChange(value)
      if (!value) {
        setSearchQuery("")
        setActiveCategory(null)
        setHoveredItem(null)
      }
    },
    [onOpenChange],
  )

  // Close on Escape for non-dialog modes
  useEffect(() => {
    if (!open || mode === "dialog") return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation()
        handleOpenChange(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open, mode, handleOpenChange])

  // ---------------------------------------------------------------------------
  // Shared inner content (search + list + preview)
  // ---------------------------------------------------------------------------

  const pickerContent = (
    <>
      {/* Search header */}
      <div className="h-14 border-b border-border px-4 flex items-center shrink-0">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sections..."
            className="pl-9 h-9 text-sm bg-muted/50 border-transparent focus-visible:bg-background"
            autoFocus={mode === "dialog"}
          />
        </div>

        {/* Category filter pills (desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 ml-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
              activeCategory === null
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            All
          </button>
          {SECTION_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setActiveCategory(activeCategory === cat.id ? null : cat.id)
              }
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar list */}
        <ScrollArea className="w-[240px] border-r border-border shrink-0">
          <div className="p-2">
            {filteredSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No sections found.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setActiveCategory(null)
                  }}
                  className="text-xs text-primary mt-2 hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedSections.map((group) => (
                  <div key={group.category}>
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = getIcon(item.icon)
                        const isActive = previewItem?.type === item.type
                        return (
                          <button
                            key={item.type}
                            onMouseEnter={() => setHoveredItem(item)}
                            onClick={() => handleSelect(item)}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-md flex items-center gap-2.5 transition-colors group",
                              isActive
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                            )}
                          >
                            <div
                              className={cn(
                                "p-1 rounded-md transition-colors shrink-0",
                                isActive
                                  ? "bg-background shadow-sm ring-1 ring-border text-foreground"
                                  : "bg-muted text-muted-foreground group-hover:bg-background group-hover:shadow-sm group-hover:text-foreground",
                              )}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate leading-tight">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 leading-tight font-normal">
                                {item.description}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Right preview area */}
        {previewItem ? (
          <div
            className="flex-1 p-6 flex flex-col cursor-pointer bg-muted/30"
            onClick={() => handleSelect(previewItem)}
          >
            <div className="flex-1 bg-background rounded-lg shadow-sm border border-slate-200 overflow-hidden relative group transition-all hover:shadow-md hover:border-primary/30">
              {CATEGORY_PREVIEWS[previewItem.type] ?? (
                <div className="w-full h-full flex items-center justify-center bg-muted/20">
                  <p className="text-sm text-muted-foreground">Preview</p>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground bg-background px-3 py-1 rounded-full border border-border shadow-sm">
                  Click to add {previewItem.label}
                </span>
                {previewItem.isDataDriven && (
                  <Badge variant="secondary" className="text-[10px]">
                    Data-driven
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/30">
            <p className="text-sm text-muted-foreground">
              No section selected
            </p>
          </div>
        )}
      </div>
    </>
  )

  // ---------------------------------------------------------------------------
  // Dialog mode (default) — standard centered modal
  // ---------------------------------------------------------------------------

  if (mode === "dialog") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-3xl p-0 gap-0 overflow-hidden h-[500px] flex flex-col"
        >
          {/* Hidden accessible title */}
          <DialogTitle className="sr-only">Add Section</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a section type to add to your page.
          </DialogDescription>
          {pickerContent}
        </DialogContent>
      </Dialog>
    )
  }

  // ---------------------------------------------------------------------------
  // Sidebar / Popover mode — positioned panel with transparent backdrop
  // ---------------------------------------------------------------------------

  if (!open) return null

  // Calculate panel position
  let panelStyle: React.CSSProperties

  if (mode === "sidebar") {
    // Fixed position next to the sidebar
    panelStyle = {
      position: "fixed",
      left: "70px",
      top: "20px",
    }
  } else {
    // Popover mode — position relative to triggerRect
    const MODAL_WIDTH = 700
    const MODAL_HEIGHT = 500
    const OFFSET = 24
    const PADDING = 20

    if (triggerRect) {
      // Horizontal: center the modal on the trigger
      let left = triggerRect.left + triggerRect.width / 2 - MODAL_WIDTH / 2
      if (left < PADDING) left = PADDING
      if (left + MODAL_WIDTH > window.innerWidth - PADDING) {
        left = window.innerWidth - MODAL_WIDTH - PADDING
      }

      // Vertical: prefer below trigger, fallback above, then center
      const spaceBelow = window.innerHeight - triggerRect.bottom
      const spaceAbove = triggerRect.top
      let top: number

      if (spaceBelow >= MODAL_HEIGHT + OFFSET) {
        top = triggerRect.bottom + OFFSET
      } else if (spaceAbove >= MODAL_HEIGHT + OFFSET) {
        top = triggerRect.top - MODAL_HEIGHT - OFFSET
      } else {
        top = Math.max(PADDING, (window.innerHeight - MODAL_HEIGHT) / 2)
      }

      panelStyle = {
        position: "fixed",
        left: `${left}px`,
        top: `${top}px`,
      }
    } else {
      // Fallback: center on screen
      panelStyle = {
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
      }
    }
  }

  return (
    <>
      {/* Transparent backdrop overlay — click to close, no blur/darken */}
      <div
        className="fixed inset-0 z-[200]"
        style={{ background: "transparent" }}
        onClick={() => handleOpenChange(false)}
      />

      {/* Positioned panel */}
      <div
        className={cn(
          "z-[210] bg-background rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col",
          "w-[700px] h-[500px] max-h-[calc(100vh-40px)]",
          "animate-in fade-in zoom-in-95 duration-200",
        )}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add Section"
      >
        {pickerContent}
      </div>
    </>
  )
}
