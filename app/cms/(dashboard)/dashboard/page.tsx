import { requireAuth } from "@/lib/auth/require-auth"
import { prisma } from "@/lib/db"
import { getLatestPublishedDates } from "@/lib/dal/messages"
import { getUpcomingEvents } from "@/lib/dal/events"
import { DashboardContent } from "@/components/cms/dashboard/dashboard-content"
import { WelcomeBanner } from "@/components/cms/welcome-banner"

export default async function DashboardPage() {
  const session = await requireAuth()
  const churchId = session.churchId

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch all dashboard data in parallel
  const [
    latestPublishedDates,
    upcomingEvents,
    messageCountAll,
    messageCountPublished,
    messageCountDraft,
    videoPublishedCount,
    studyPublishedCount,
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
    // Latest published dates for health check (video + study separately)
    getLatestPublishedDates(churchId),

    // Upcoming events (next 5)
    getUpcomingEvents(churchId, 5),

    // Message counts
    prisma.message.count({ where: { churchId, deletedAt: null } }),
    prisma.message.count({
      where: { churchId, deletedAt: null, OR: [{ hasVideo: true }, { hasStudy: true }] },
    }),
    prisma.message.count({
      where: { churchId, deletedAt: null, hasVideo: false, hasStudy: false },
    }),
    prisma.message.count({
      where: { churchId, deletedAt: null, hasVideo: true },
    }),
    prisma.message.count({
      where: { churchId, deletedAt: null, hasStudy: true },
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
        hasVideo: true,
        hasStudy: true,
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

  // Health computation helper
  function computeHealth(latestDate: Date | null, totalCount: number): "green" | "yellow" | "red" | "neutral" {
    if (!latestDate) return totalCount === 0 ? "neutral" : "red"
    const days = Math.floor((Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
    if (days > 30) return "red"
    if (days > 14) return "yellow"
    return "green"
  }

  // Separate video and study health
  const videoHealth = computeHealth(latestPublishedDates.latestVideo, messageCountAll)
  const studyHealth = computeHealth(latestPublishedDates.latestStudy, messageCountAll)

  // Event health: based on upcoming event count
  // For new churches with no events at all, show neutral instead of red
  let eventHealth: "green" | "yellow" | "red" | "neutral" = "green"
  if (eventCountUpcoming === 0) {
    const totalEvents = eventCountUpcoming + eventCountPast
    eventHealth = totalEvents === 0 ? "neutral" : "red"
  } else if (eventCountUpcoming < 3) {
    eventHealth = "yellow"
  }

  // Page health: based on page freshness
  let pageHealth: "green" | "yellow" | "red" | "neutral" = "green"
  if (pagesForHealth.length === 0) {
    pageHealth = "neutral"
  } else {
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
      status: (m.hasVideo || m.hasStudy) ? ("PUBLISHED" as const) : ("DRAFT" as const),
      updatedAt: m.updatedAt.toISOString(),
      href: `/cms/messages/${m.id}`,
    })),
    ...recentEvents.map((e) => ({
      id: e.id,
      title: e.title,
      type: "event" as const,
      status: e.status,
      updatedAt: e.updatedAt.toISOString(),
      href: `/cms/events/${e.id}`,
    })),
    ...recentPages.map((p) => ({
      id: p.id,
      title: p.title,
      type: "page" as const,
      status: p.isPublished ? ("PUBLISHED" as const) : ("DRAFT" as const),
      updatedAt: p.updatedAt.toISOString(),
      href: `/cms/website/builder/${p.id}`,
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

  let videoHealthDetail: string
  if (latestPublishedDates.latestVideo) {
    const daysSince = Math.floor(
      (now.getTime() - latestPublishedDates.latestVideo.getTime()) / (1000 * 60 * 60 * 24)
    )
    videoHealthDetail = `Posted ${formatDaysAgo(daysSince)}`
  } else {
    videoHealthDetail = "None yet"
  }

  let studyHealthDetail: string
  if (latestPublishedDates.latestStudy) {
    const daysSince = Math.floor(
      (now.getTime() - latestPublishedDates.latestStudy.getTime()) / (1000 * 60 * 60 * 24)
    )
    studyHealthDetail = `Posted ${formatDaysAgo(daysSince)}`
  } else {
    studyHealthDetail = "None yet"
  }

  let eventHealthDetail: string
  if (eventCountUpcoming === 0) {
    eventHealthDetail = "None upcoming"
  } else {
    eventHealthDetail = `${eventCountUpcoming} upcoming`
  }

  let pageHealthDetail: string
  if (pagesForHealth.length === 0) {
    pageHealthDetail = "None yet"
  } else {
    const oldestUpdate = Math.max(
      ...pagesForHealth.map((p) =>
        Math.floor((now.getTime() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      )
    )
    pageHealthDetail = `Updated ${formatDaysAgo(oldestUpdate)}`
  }

  const mediaHealthDetail = videoCountAll === 0
    ? "None yet"
    : `${videoCountAll} video${videoCountAll === 1 ? "" : "s"}`

  return (
    <>
    <WelcomeBanner
      userName={session.user?.name ?? ""}
      userId={session.user?.id ?? ""}
      churchName={session.churchName ?? ""}
      roleName={session.roleName ?? ""}
    />
    <DashboardContent
      userId={session.user?.id ?? ""}
      counts={{
        messages: {
          total: messageCountAll,
          published: messageCountPublished,
          draft: messageCountDraft,
          videoPublished: videoPublishedCount,
          studyPublished: studyPublishedCount,
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
        videos: videoHealth,
        studies: studyHealth,
        events: eventHealth,
        pages: pageHealth,
        media: videoCountAll === 0 ? "neutral" : "green",
      }}
      healthDetail={{
        videos: videoHealthDetail,
        studies: studyHealthDetail,
        events: eventHealthDetail,
        pages: pageHealthDetail,
        media: mediaHealthDetail,
      }}
      healthCounts={{
        videos: videoPublishedCount,
        studies: studyPublishedCount,
        events: eventCountUpcoming,
        pages: pageCountAll,
        media: videoCountAll,
      }}
      upcomingEvents={upcomingEventsData}
      recentActivity={recentActivity}
    />
    </>
  )
}
