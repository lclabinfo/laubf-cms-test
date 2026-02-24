import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getChurchId } from "@/lib/get-church-id"

export async function GET() {
  try {
    const churchId = await getChurchId()

    const settings = await prisma.siteSettings.findUnique({
      where: { churchId },
    })

    if (!settings) {
      return NextResponse.json({ error: "Site settings not found" }, { status: 404 })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("GET /api/v1/site-settings error:", error)
    return NextResponse.json({ error: "Failed to fetch site settings" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    const settings = await prisma.siteSettings.upsert({
      where: { churchId },
      update: {
        siteName: body.siteName,
        tagline: body.tagline,
        description: body.description,
        logoUrl: body.logoUrl,
        logoAlt: body.logoAlt,
        faviconUrl: body.faviconUrl,
        ogImageUrl: body.ogImageUrl,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        contactAddress: body.contactAddress,
        facebookUrl: body.facebookUrl,
        instagramUrl: body.instagramUrl,
        youtubeUrl: body.youtubeUrl,
        twitterUrl: body.twitterUrl,
        tiktokUrl: body.tiktokUrl,
        spotifyUrl: body.spotifyUrl,
        podcastUrl: body.podcastUrl,
        serviceTimes: body.serviceTimes,
        googleAnalyticsId: body.googleAnalyticsId,
        metaPixelId: body.metaPixelId,
        enableBlog: body.enableBlog,
        enableGiving: body.enableGiving,
        enableMemberLogin: body.enableMemberLogin,
        enablePrayerRequests: body.enablePrayerRequests,
        enableAnnouncements: body.enableAnnouncements,
        enableSearch: body.enableSearch,
        customHeadHtml: body.customHeadHtml,
        customBodyHtml: body.customBodyHtml,
        maintenanceMode: body.maintenanceMode,
        maintenanceMessage: body.maintenanceMessage,
      },
      create: {
        churchId,
        siteName: body.siteName || "My Church",
        tagline: body.tagline,
        description: body.description,
        logoUrl: body.logoUrl,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        contactAddress: body.contactAddress,
        facebookUrl: body.facebookUrl,
        instagramUrl: body.instagramUrl,
        youtubeUrl: body.youtubeUrl,
        twitterUrl: body.twitterUrl,
        tiktokUrl: body.tiktokUrl,
        spotifyUrl: body.spotifyUrl,
        podcastUrl: body.podcastUrl,
        serviceTimes: body.serviceTimes,
        googleAnalyticsId: body.googleAnalyticsId,
        metaPixelId: body.metaPixelId,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("PUT /api/v1/site-settings error:", error)
    return NextResponse.json({ error: "Failed to update site settings" }, { status: 500 })
  }
}
