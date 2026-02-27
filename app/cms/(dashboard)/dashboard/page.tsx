import { requireAuth } from "@/lib/auth/require-auth"
import { prisma } from "@/lib/db"
import { ContentStatus } from "@/lib/generated/prisma/client"
import { getLatestMessage } from "@/lib/dal/messages"
import { getUpcomingEvents } from "@/lib/dal/events"
import { DashboardContent } from "@/components/cms/dashboard/dashboard-content"

export default async function DashboardPage() {
  const session = await requireAuth()
  const churchId = session.churchId

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch all dashboard data in parallel
  const [
    latestMessage,
    upcomingEvents,
    messageCountAll,
    messageCountPublished,
    messageCountDraft,
    eventCountUpcoming,
    eventCountPast,
    pageCountAll,
    pageCountPublished,
    pageCountDraft,
    videoCountAll,
    recentMessages,
    recentEvents,
    recentPages,
    pagesForHealth,
  ] = await Promise.all([
    // Latest message for health check
    getLatestMessage(churchId),

    // Upcoming events (next 5)
    getUpcomingEvents(churchId, 5),

    // Message counts
    prisma.message.count({ where: { churchId, deletedAt: null } }),
    prisma.message.count({
      where: { churchId, deletedAt: null, status: ContentStatus.PUBLISHED },
    }),
    prisma.message.count({
      where: { churchId, deletedAt: null, status: ContentStatus.DRAFT },
    }),

    // Event counts (upcoming vs past)
    prisma.event.count({
      where: { churchId, deletedAt: null, dateStart: { gte: today } },
    }),
    prisma.event.count({
      where: { churchId, deletedAt: null, dateStart: { lt: today } },
    }),

    // Page counts
    prisma.page.count({ where: { churchId, deletedAt: null } }),
    prisma.page.count({
      where: { churchId, deletedAt: null, isPublished: true },
    }),
    prisma.page.count({
      where: { churchId, deletedAt: null, isPublished: false },
    }),

    // Video count (as our "media" stand-in)
    prisma.video.count({ where: { churchId, deletedAt: null } }),

    // Recently updated messages (top 10 by updatedAt)
    prisma.message.findMany({
      where: { churchId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    }),

    // Recently updated events (top 10 by updatedAt)
    prisma.event.findMany({
      where: { churchId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
      },
    }),

    // Recently updated pages (top 10 by updatedAt)
    prisma.page.findMany({
      where: { churchId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        isPublished: true,
        updatedAt: true,
      },
    }),

    // All pages for health check (need updatedAt for freshness)
    prisma.page.findMany({
      where: { churchId, deletedAt: null },
      select: { updatedAt: true },
    }),
  ])

  // Build health statuses
  const now = new Date()

  // Message health: based on latest published message date
  let messageHealth: "green" | "yellow" | "red" = "green"
  if (latestMessage) {
    const daysSinceLastMessage = Math.floor(
      (now.getTime() - new Date(latestMessage.dateFor).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastMessage > 30) messageHealth = "red"
    else if (daysSinceLastMessage > 14) messageHealth = "yellow"
  } else {
    messageHealth = "red"
  }

  // Event health: based on upcoming event count
  let eventHealth: "green" | "yellow" | "red" = "green"
  if (eventCountUpcoming === 0) eventHealth = "red"
  else if (eventCountUpcoming < 3) eventHealth = "yellow"

  // Page health: based on page freshness
  let pageHealth: "green" | "yellow" | "red" = "green"
  if (pagesForHealth.length > 0) {
    const daysSinceUpdates = pagesForHealth.map((p) =>
      Math.floor(
        (now.getTime() - new Date(p.updatedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    )
    const hasStale = daysSinceUpdates.some((d) => d > 180)
    const hasSomewhatStale = daysSinceUpdates.some((d) => d > 90)
    if (hasStale) pageHealth = "red"
    else if (hasSomewhatStale) pageHealth = "yellow"
  }

  // Merge + sort recent activity (top 10 across all types)
  const recentActivity = [
    ...recentMessages.map((m) => ({
      id: m.id,
      title: m.title,
      type: "message" as const,
      status: m.status,
      updatedAt: m.updatedAt.toISOString(),
      href: `/cms/messages/${m.slug}`,
    })),
    ...recentEvents.map((e) => ({
      id: e.id,
      title: e.title,
      type: "event" as const,
      status: e.status,
      updatedAt: e.updatedAt.toISOString(),
      href: `/cms/events/${e.slug}`,
    })),
    ...recentPages.map((p) => ({
      id: p.id,
      title: p.title,
      type: "page" as const,
      status: p.isPublished ? ("PUBLISHED" as const) : ("DRAFT" as const),
      updatedAt: p.updatedAt.toISOString(),
      href: `/cms/website/pages`,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 10)

  // Serialize upcoming events for client component
  const upcomingEventsData = upcomingEvents.map((e) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    dateStart: e.dateStart.toISOString(),
    startTime: e.startTime,
    endTime: e.endTime,
    location: e.location,
    locationType: e.locationType,
    type: e.type,
    shortDescription: e.shortDescription,
    status: e.status,
  }))

  // Build health detail strings that explain the status
  const formatDaysAgo = (days: number) => {
    if (days === 0) return "today"
    if (days === 1) return "yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 14) return "1 week ago"
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    if (days < 60) return "1 month ago"
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)}+ years ago`
  }

  let messageHealthDetail: string
  if (latestMessage) {
    const daysSince = Math.floor(
      (now.getTime() - new Date(latestMessage.dateFor).getTime()) / (1000 * 60 * 60 * 24)
    )
    messageHealthDetail = `Last posted ${formatDaysAgo(daysSince)}`
  } else {
    messageHealthDetail = "No messages yet"
  }

  let eventHealthDetail: string
  if (eventCountUpcoming === 0) {
    eventHealthDetail = "No upcoming events"
  } else {
    eventHealthDetail = `${eventCountUpcoming} upcoming event${eventCountUpcoming === 1 ? "" : "s"}`
  }

  let pageHealthDetail: string
  if (pagesForHealth.length === 0) {
    pageHealthDetail = "No pages yet"
  } else {
    const oldestUpdate = Math.max(
      ...pagesForHealth.map((p) =>
        Math.floor((now.getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      )
    )
    pageHealthDetail = `Oldest update ${formatDaysAgo(oldestUpdate)}`
  }

  const mediaHealthDetail = videoCountAll === 0
    ? "No media yet"
    : `${videoCountAll} video${videoCountAll === 1 ? "" : "s"}`

  return (
    <DashboardContent
      counts={{
        messages: {
          total: messageCountAll,
          published: messageCountPublished,
          draft: messageCountDraft,
        },
        events: {
          upcoming: eventCountUpcoming,
          past: eventCountPast,
        },
        pages: {
          total: pageCountAll,
          published: pageCountPublished,
          draft: pageCountDraft,
        },
        videos: {
          total: videoCountAll,
        },
      }}
      health={{
        messages: messageHealth,
        events: eventHealth,
        pages: pageHealth,
        media: videoCountAll === 0 ? "yellow" : "green",
      }}
      healthDetail={{
        messages: messageHealthDetail,
        events: eventHealthDetail,
        pages: pageHealthDetail,
        media: mediaHealthDetail,
      }}
      healthCounts={{
        messages: messageCountAll,
        events: eventCountUpcoming,
        pages: pageCountAll,
        media: videoCountAll,
      }}
      upcomingEvents={upcomingEventsData}
      recentActivity={recentActivity}
    />
  )
}
