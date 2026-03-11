"use client"

import { useState, useMemo } from "react"
import {
  BookOpen,
  Church,
  Cross,
  Heart,
  HandHeart,
  // Communication
  Phone,
  Mail,
  MessageCircle,
  Megaphone,
  Radio,
  Podcast,
  // Media
  Video,
  Youtube,
  MonitorPlay,
  Music,
  Headphones,
  Camera,
  // People
  Users,
  User,
  Baby,
  GraduationCap,
  HandHelping,
  // Calendar/Time
  Calendar,
  Clock,
  AlarmClock,
  Timer,
  // Location
  MapPin,
  Navigation,
  Globe,
  Landmark,
  Building2,
  Home,
  // General
  Link,
  ExternalLink,
  Star,
  Info,
  Bell,
  Settings,
  Folder,
  FileText,
  Search,
  Plus,
  Sparkles,
  Zap,
  Shield,
  Flag,
  BookText,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface IconEntry {
  name: string
  icon: LucideIcon
}

const CURATED_ICONS: IconEntry[] = [
  // Faith / Church
  { name: "book-open", icon: BookOpen },
  { name: "church", icon: Church },
  { name: "cross", icon: Cross },
  { name: "heart", icon: Heart },
  { name: "hand-heart", icon: HandHeart },
  { name: "book-text", icon: BookText },
  // Communication
  { name: "phone", icon: Phone },
  { name: "mail", icon: Mail },
  { name: "message-circle", icon: MessageCircle },
  { name: "megaphone", icon: Megaphone },
  { name: "radio", icon: Radio },
  { name: "podcast", icon: Podcast },
  // Media
  { name: "video", icon: Video },
  { name: "youtube", icon: Youtube },
  { name: "monitor-play", icon: MonitorPlay },
  { name: "music", icon: Music },
  { name: "headphones", icon: Headphones },
  { name: "camera", icon: Camera },
  // People
  { name: "users", icon: Users },
  { name: "user", icon: User },
  { name: "baby", icon: Baby },
  { name: "graduation-cap", icon: GraduationCap },
  { name: "hand-helping", icon: HandHelping },
  // Calendar / Time
  { name: "calendar", icon: Calendar },
  { name: "clock", icon: Clock },
  { name: "alarm-clock", icon: AlarmClock },
  { name: "timer", icon: Timer },
  // Location
  { name: "map-pin", icon: MapPin },
  { name: "navigation", icon: Navigation },
  { name: "globe", icon: Globe },
  { name: "landmark", icon: Landmark },
  { name: "building-2", icon: Building2 },
  { name: "home", icon: Home },
  // General
  { name: "link", icon: Link },
  { name: "external-link", icon: ExternalLink },
  { name: "star", icon: Star },
  { name: "info", icon: Info },
  { name: "bell", icon: Bell },
  { name: "settings", icon: Settings },
  { name: "folder", icon: Folder },
  { name: "file-text", icon: FileText },
  { name: "search", icon: Search },
  { name: "plus", icon: Plus },
  { name: "sparkles", icon: Sparkles },
  { name: "zap", icon: Zap },
  { name: "shield", icon: Shield },
  { name: "flag", icon: Flag },
]

// Build a lookup map for rendering selected icon
const ICON_BY_NAME = new Map(CURATED_ICONS.map((e) => [e.name, e.icon]))

interface IconPickerProps {
  value: string
  onChange: (name: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return CURATED_ICONS
    const q = search.toLowerCase()
    return CURATED_ICONS.filter((e) => e.name.includes(q))
  }, [search])

  const SelectedIcon = ICON_BY_NAME.get(value) ?? BookOpen

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 font-normal"
        >
          <SelectedIcon className="size-4" />
          <span className="truncate">{value || "Select icon"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-3" align="start">
        <Input
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-[240px] overflow-y-auto">
          <TooltipProvider delayDuration={300}>
            <div className="grid grid-cols-6 gap-1">
              {filtered.map((entry) => {
                const Icon = entry.icon
                return (
                  <Tooltip key={entry.name}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(entry.name)
                          setOpen(false)
                          setSearch("")
                        }}
                        className={cn(
                          "flex items-center justify-center size-10 rounded-md transition-colors hover:bg-accent",
                          value === entry.name && "bg-accent ring-1 ring-ring"
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      {entry.name}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
              {filtered.length === 0 && (
                <p className="col-span-6 text-center text-sm text-muted-foreground py-4">
                  No icons found
                </p>
              )}
            </div>
          </TooltipProvider>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ICON_BY_NAME, CURATED_ICONS }
