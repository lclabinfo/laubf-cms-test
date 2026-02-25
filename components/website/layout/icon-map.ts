/**
 * Maps database `iconName` strings (kebab-case) to lucide-react icon components.
 * Used by the navbar dropdown, mobile menu, and QuickLinksFAB.
 */
import {
  Info,
  MapPin,
  Youtube,
  Calendar,
  Megaphone,
  Heart,
  GraduationCap,
  Users,
  Landmark,
  Baby,
  Video,
  BookOpen,
  BookText,
  MonitorPlay,
  Radio,
  HandHeart,
  Church,
  Music,
  Link as LinkIcon,
  type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  info: Info,
  "map-pin": MapPin,
  youtube: Youtube,
  calendar: Calendar,
  megaphone: Megaphone,
  heart: Heart,
  "graduation-cap": GraduationCap,
  users: Users,
  landmark: Landmark,
  baby: Baby,
  video: Video,
  "book-open": BookOpen,
  "book-text": BookText,
  "monitor-play": MonitorPlay,
  radio: Radio,
  "hand-heart": HandHeart,
  church: Church,
  music: Music,
  link: LinkIcon,
}

/**
 * Resolve a kebab-case icon name from the database to a lucide-react component.
 * Returns null if the name is not found or is null/undefined.
 */
export function getLucideIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null
  return ICON_MAP[name] ?? null
}

export { ICON_MAP }
