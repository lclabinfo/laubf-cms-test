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
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ---------- Types ----------

type HealthStatus = "green" | "yellow" | "red" | "neutral"

type DashboardCounts = {
  messages: { total: number; published: number; draft: number }
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
    messages: HealthStatus
    events: HealthStatus
    pages: HealthStatus
    media: HealthStatus
  }
  healthDetail: {
    messages: string
    events: string
    pages: string
    media: string
  }
  healthCounts: {
    messages: number
    events: number
    pages: number
    media: number
  }
  upcomingEvents: UpcomingEvent[]
  recentActivity: RecentActivityItem[]
}

// ---------- Helpers ----------

const healthBadge: Record<
  HealthStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  green: { label: "Healthy", variant: "success" },
  yellow: { label: "Needs attention", variant: "warning" },
  red: { label: "Stale", variant: "destructive" },
  neutral: { label: "Get started", variant: "secondary" },
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
  return { month, day }
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

const contentTypeIcon: Record<string, typeof MessageSquare> = {
  message: BookOpen,
  event: Calendar,
  page: FileText,
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
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of your church website and content.
        </p>
      </div>

      {/* Widget 1: Quick Actions */}
      <QuickActions />

      {/* Widget 2: Content Health */}
      <ContentHealth health={health} healthDetail={healthDetail} healthCounts={healthCounts} />

      {/* Widget 3: At a Glance */}
      <AtAGlance counts={counts} />

      {/* Widget 4: Upcoming Events */}
      <UpcomingEventsWidget events={upcomingEvents} />

      {/* Widget 5: Recent Activity */}
      <RecentActivityWidget items={recentActivity} />
    </div>
  )
}

// ---------- Widget 1: Quick Actions ----------

const quickActions = [
  {
    title: "New Message",
    description: "Add a sermon or Bible study",
    href: "/cms/messages/new",
    icon: MessageSquare,
    color: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    title: "New Event",
    description: "Create a church event",
    href: "/cms/events/new",
    icon: CalendarPlus,
    color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  {
    title: "Upload Media",
    description: "Add photos or videos",
    href: "/cms/media",
    icon: Upload,
    color: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
  },
  {
    title: "Edit Pages",
    description: "Manage website pages",
    href: "/cms/website/pages",
    icon: FileEdit,
    color: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  },
]

function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {quickActions.map((action) => (
        <Link key={action.href} href={action.href} className="group">
          <Card className="h-full transition-all hover:ring-foreground/20 hover:shadow-sm">
            <CardContent className="flex items-start gap-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${action.color}`}
              >
                <action.icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{action.title}</p>
                <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
                  {action.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

// ---------- Widget 2: Content Health ----------

function ContentHealth({
  health,
  healthDetail,
  healthCounts,
}: {
  health: DashboardContentProps["health"]
  healthDetail: DashboardContentProps["healthDetail"]
  healthCounts: DashboardContentProps["healthCounts"]
}) {
  const items = [
    {
      label: "Messages",
      icon: BookOpen,
      count: healthCounts.messages,
      detail: healthDetail.messages,
      status: health.messages,
      href: "/cms/messages",
    },
    {
      label: "Events",
      icon: Calendar,
      count: healthCounts.events,
      detail: healthDetail.events,
      status: health.events,
      href: "/cms/events",
    },
    {
      label: "Pages",
      icon: FileText,
      count: healthCounts.pages,
      detail: healthDetail.pages,
      status: health.pages,
      href: "/cms/website/pages",
    },
    {
      label: "Media",
      icon: Film,
      count: healthCounts.media,
      detail: healthDetail.media,
      status: health.media,
      href: "/cms/media",
    },
  ]

  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground mb-3">
        Content Health
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const badge = healthBadge[item.status]
          return (
            <Link key={item.label} href={item.href}>
              <Card className="transition-all hover:ring-foreground/20 hover:shadow-sm" size="sm">
                <CardContent className="flex items-center gap-3">
                  <item.icon className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count} total &middot; {item.detail}
                    </p>
                  </div>
                  <Badge variant={badge.variant} className="shrink-0">
                    {badge.label}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ---------- Widget 3: At a Glance ----------

function AtAGlance({ counts }: { counts: DashboardCounts }) {
  const metrics = [
    {
      label: "Messages",
      value: counts.messages.total,
      detail: `${counts.messages.published} published, ${counts.messages.draft} draft`,
    },
    {
      label: "Events",
      value: counts.events.upcoming + counts.events.past,
      detail: `${counts.events.upcoming} upcoming, ${counts.events.past} past`,
    },
    {
      label: "Pages",
      value: counts.pages.total,
      detail: `${counts.pages.published} published, ${counts.pages.draft} draft`,
    },
    {
      label: "Videos",
      value: counts.videos.total,
      detail: `${counts.videos.total} total`,
    },
  ]

  return (
    <section>
      <h2 className="text-sm font-medium text-muted-foreground mb-3">
        At a Glance
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((metric) => (
          <Card key={metric.label} size="sm">
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <p className="text-sm font-medium mt-1">{metric.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {metric.detail}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

// ---------- Widget 4: Upcoming Events ----------

function UpcomingEventsWidget({ events }: { events: UpcomingEvent[] }) {
  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cms/events">View all</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No upcoming events</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Create an event to get started.
              </p>
              <Button size="sm" asChild>
                <Link href="/cms/events/new">Create Event</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
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
                      <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center">
                        <span className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                          {month}
                        </span>
                        <span className="text-lg font-semibold leading-tight">
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
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatTime(event.startTime)}
                              {event.endTime &&
                                ` - ${formatTime(event.endTime)}`}
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

                      {/* Type badge */}
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
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
    </section>
  )
}

// ---------- Widget 5: Recent Activity ----------

function RecentActivityWidget({ items }: { items: RecentActivityItem[] }) {
  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle>Recently Updated Content</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Content changes will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = contentTypeIcon[item.type] ?? FileText
                const variant = statusBadgeVariant[item.status] ?? "secondary"

                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.href}
                    className="block"
                  >
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-muted/50">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Updated {timeAgo(item.updatedAt)}
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
    </section>
  )
}
