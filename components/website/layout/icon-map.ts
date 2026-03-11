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
  // Additional icons for icon picker support
  Cross,
  Phone,
  Mail,
  MessageCircle,
  Podcast,
  Headphones,
  Camera,
  User,
  HandHelping,
  Clock,
  AlarmClock,
  Timer,
  Navigation,
  Globe,
  Building2,
  Home,
  ExternalLink,
  Star,
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
  type LucideIcon,
} from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  // Original icons
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
  // Faith / Church
  cross: Cross,
  // Communication
  phone: Phone,
  mail: Mail,
  "message-circle": MessageCircle,
  podcast: Podcast,
  // Media
  headphones: Headphones,
  camera: Camera,
  // People
  user: User,
  "hand-helping": HandHelping,
  // Calendar / Time
  clock: Clock,
  "alarm-clock": AlarmClock,
  timer: Timer,
  // Location
  navigation: Navigation,
  globe: Globe,
  "building-2": Building2,
  home: Home,
  // General
  "external-link": ExternalLink,
  star: Star,
  bell: Bell,
  settings: Settings,
  folder: Folder,
  "file-text": FileText,
  search: Search,
  plus: Plus,
  sparkles: Sparkles,
  zap: Zap,
  shield: Shield,
  flag: Flag,
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
