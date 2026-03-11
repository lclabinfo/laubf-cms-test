"use client"

import Link from "next/link"
import {
  MessageSquare,
  CalendarPlus,
  Upload,
  FileEdit,
  BookOpen,
  Calendar,
  FileText,
  Film,
  MapPin,
  Clock,
  Globe,
  AlertCircle,
  ArrowRight,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ---------- Types ----------

type HealthStatus = "green" | "yellow" | "red" | "neutral"

type DashboardCounts = {
  messages: { total: number; published: number; draft: number; videoPublished: number; studyPublished: number }
  events: { upcoming: number; past: number }
  pages: { total: number; published: number; draft: number }
  videos: { total: number }
}

type UpcomingEvent = {
  id: string
  title: string
  slug: string
  dateStart: string
  startTime: string | null
  endTime: string | null
  location: string | null
  locationType: string
  type: string
  shortDescription: string | null
  status: string
}

type RecentActivityItem = {
  id: string
  title: string
  type: "message" | "event" | "page"
  status: string
  updatedAt: string
  href: string
}

type DashboardContentProps = {
  counts: DashboardCounts
  health: {
    videos: HealthStatus
    studies: HealthStatus
    events: HealthStatus
    pages: HealthStatus
    media: HealthStatus
  }
  healthDetail: {
    videos: string
    studies: string
    events: string
    pages: string
    media: string
  }
  healthCounts: {
    videos: number
    studies: number
    events: number
    pages: number
    media: number
  }
  upcomingEvents: UpcomingEvent[]
  recentActivity: RecentActivityItem[]
}

// ---------- Helpers ----------

// Short labels that never wrap, even on small cards.
// WCAG: keep labels concise so they don't need to shrink below 12px.
const healthConfig: Record<
  HealthStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary"; dotClass: string }
> = {
  green: { label: "Good", variant: "success", dotClass: "bg-emerald-500" },
  yellow: { label: "Aging", variant: "warning", dotClass: "bg-amber-500" },
  red: { label: "Stale", variant: "destructive", dotClass: "bg-red-500" },
  neutral: { label: "Empty", variant: "secondary", dotClass: "bg-muted-foreground/40" },
}

function formatTime(time: string | null): string {
  if (!time) return ""
  const [h, m] = time.split(":").map(Number)
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`
}

function formatDateBadge(dateStr: string) {
  const date = new Date(dateStr)
  const month = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
  const day = date.getUTCDate()
  const weekday = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })
  return { month, day, weekday }
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

const eventTypeLabel: Record<string, string> = {
  MEETING: "Meeting",
  EVENT: "Event",
  PROGRAM: "Program",
}

const contentTypeConfig: Record<string, { icon: typeof MessageSquare; color: string; label: string }> = {
  message: { icon: BookOpen, color: "text-blue-500", label: "Message" },
  event: { icon: Calendar, color: "text-emerald-500", label: "Event" },
  page: { icon: FileText, color: "text-purple-500", label: "Page" },
}

const statusBadgeVariant: Record<string, "success" | "warning" | "secondary" | "info"> = {
  PUBLISHED: "success",
  DRAFT: "secondary",
  SCHEDULED: "info",
  ARCHIVED: "warning",
}

// ---------- Component ----------

export function DashboardContent({
  counts,
  health,
  healthDetail,
  healthCounts,
  upcomingEvents,
  recentActivity,
}: DashboardContentProps) {
  return (
    <div className="pt-5 space-y-6 pb-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of your church website and content.
        </p>
      </div>

      {/* Quick Actions — prominent shortcut buttons */}
      <QuickActions />

      {/* Stats + Health — merged visual overview */}
      <StatsOverview counts={counts} health={health} healthDetail={healthDetail} healthCounts={healthCounts} />

      {/* Bottom section: stacks on mobile/tablet, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UpcomingEventsWidget events={upcomingEvents} />
        <RecentActivityWidget items={recentActivity} />
      </div>
    </div>
  )
}

// ---------- Quick Actions ----------

const quickActions = [
  {
    title: "New Message",
    href: "/cms/messages/new",
    icon: MessageSquare,
    gradient: "from-blue-500/15 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/5",
    iconBg: "bg-blue-500 text-white",
    borderColor: "border-l-blue-500",
  },
  {
    title: "New Event",
    href: "/cms/events/new",
    icon: CalendarPlus,
    gradient: "from-emerald-500/15 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5",
    iconBg: "bg-emerald-500 text-white",
    borderColor: "border-l-emerald-500",
  },
  {
    title: "Upload Media",
    href: "/cms/media",
    icon: Upload,
    gradient: "from-purple-500/15 to-purple-500/5 dark:from-purple-500/20 dark:to-purple-500/5",
    iconBg: "bg-purple-500 text-white",
    borderColor: "border-l-purple-500",
  },
  {
    title: "Edit Pages",
    href: "/cms/website/pages",
    icon: FileEdit,
    gradient: "from-amber-500/15 to-amber-500/5 dark:from-amber-500/20 dark:to-amber-500/5",
    iconBg: "bg-amber-500 text-white",
    borderColor: "border-l-amber-500",
  },
]

function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {quickActions.map((action) => (
        <Link key={action.href} href={action.href} className="group">
          <div
            className={cn(
              "relative flex items-center gap-2.5 rounded-xl border border-l-[3px] px-3 py-2.5",
              "bg-gradient-to-r transition-all",
              "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
              action.gradient,
              action.borderColor,
            )}
          >
            <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", action.iconBg)}>
              <action.icon className="size-4" />
            </div>
            <p className="text-sm font-semibold leading-tight flex-1 min-w-0">{action.title}</p>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  )
}

// ---------- Stats Overview (merged health + counts) ----------

function StatsOverview({
  counts,
  health,
  healthDetail,
  healthCounts,
}: {
  counts: DashboardCounts
  health: DashboardContentProps["health"]
  healthDetail: DashboardContentProps["healthDetail"]
  healthCounts: DashboardContentProps["healthCounts"]
}) {
  const statCards: {
    label: string
    icon: typeof Film
    value: number
    subValue: string
    healthStatus: HealthStatus
    healthText: string
    href: string
    accent: string
  }[] = [
    {
      label: "Videos",
      icon: Film,
      value: healthCounts.videos,
      subValue: `of ${counts.messages.total} messages`,
      healthStatus: health.videos,
      healthText: healthDetail.videos,
      href: "/cms/messages",
      accent: "text-blue-500",
    },
    {
      label: "Studies",
      icon: BookOpen,
      value: healthCounts.studies,
      subValue: `${counts.messages.draft} drafts`,
      healthStatus: health.studies,
      healthText: healthDetail.studies,
      href: "/cms/messages",
      accent: "text-indigo-500",
    },
    {
      label: "Events",
      icon: Calendar,
      value: healthCounts.events,
      subValue: `${counts.events.past} past`,
      healthStatus: health.events,
      healthText: healthDetail.events,
      href: "/cms/events",
      accent: "text-emerald-500",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {statCards.map((stat) => {
        const hc = healthConfig[stat.healthStatus]
        return (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="h-full transition-all hover:ring-foreground/20 hover:shadow-sm" size="sm">
              <CardContent className="flex flex-col gap-3">
                {/* Top: icon + health badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className={cn("flex size-8 items-center justify-center rounded-lg bg-muted shrink-0", stat.accent)}>
                    <stat.icon className="size-4" />
                  </div>
                  <Badge variant={hc.variant} className="text-xs">
                    {hc.label}
                  </Badge>
                </div>
                {/* Middle: big number + label */}
                <div>
                  <p className="text-2xl font-bold tracking-tight leading-none">{stat.value}</p>
                  <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
                </div>
                {/* Bottom: detail — truncated, never wraps */}
                <p className="text-xs text-muted-foreground truncate" title={`${stat.healthText} · ${stat.subValue}`}>
                  {stat.healthText}
                </p>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

// ---------- Upcoming Events ----------

function UpcomingEventsWidget({ events }: { events: UpcomingEvent[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          Upcoming Events
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cms/events">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-2">
              <Calendar className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No upcoming events</p>
            <p className="text-sm text-muted-foreground mt-0.5 mb-3">
              Create an event to get started.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/cms/events/new">
                <CalendarPlus className="size-3.5" />
                Create Event
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((event) => {
              const { month, day } = formatDateBadge(event.dateStart)
              const isMissingInfo = !event.location || !event.shortDescription

              return (
                <Link
                  key={event.id}
                  href={`/cms/events/${event.slug}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-muted/50">
                    {/* Date badge */}
                    <div className="flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 py-1.5 text-center">
                      <span className="text-xs font-semibold uppercase leading-none text-primary/70">
                        {month}
                      </span>
                      <span className="text-lg font-bold leading-tight text-primary">
                        {day}
                      </span>
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {event.title}
                        </span>
                        {isMissingInfo && (
                          <AlertCircle className="size-3.5 shrink-0 text-warning" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        {event.startTime && (
                          <span className="flex items-center gap-1 shrink-0">
                            <Clock className="size-3" />
                            {formatTime(event.startTime)}
                            {event.endTime &&
                              ` – ${formatTime(event.endTime)}`}
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            {event.locationType === "ONLINE" ? (
                              <Globe className="size-3 shrink-0" />
                            ) : (
                              <MapPin className="size-3 shrink-0" />
                            )}
                            <span className="truncate">{event.location}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Type badge — hidden on narrow screens to prevent crowding */}
                    <Badge variant="secondary" className="shrink-0 hidden sm:inline-flex">
                      {eventTypeLabel[event.type] ?? event.type}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- Recent Activity ----------

function RecentActivityWidget({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted mb-2">
              <Clock className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Content changes will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {items.map((item) => {
              const config = contentTypeConfig[item.type] ?? contentTypeConfig.page
              const Icon = config.icon
              const variant = statusBadgeVariant[item.status] ?? "secondary"

              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="block"
                >
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-muted/50">
                    <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-md bg-muted", config.color)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {config.label} &middot; {timeAgo(item.updatedAt)}
                      </p>
                    </div>
                    <Badge variant={variant} className="shrink-0">
                      {item.status.charAt(0) +
                        item.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
