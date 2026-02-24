import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/client"
import { getChurchId } from "@/lib/get-church-id"

export async function GET() {
  try {
    const churchId = await getChurchId()

    const customization = await prisma.themeCustomization.findUnique({
      where: { churchId },
      include: { theme: true },
    })

    if (!customization) {
      const defaultTheme = await prisma.theme.findFirst({
        where: { isDefault: true },
      })
      return NextResponse.json({
        theme: defaultTheme,
        customization: null,
      })
    }

    return NextResponse.json({
      theme: customization.theme,
      customization,
    })
  } catch (error) {
    console.error("GET /api/v1/theme error:", error)
    return NextResponse.json({ error: "Failed to fetch theme" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    let themeId = body.themeId
    if (!themeId) {
      const defaultTheme = await prisma.theme.findFirst({
        where: { isDefault: true },
      })
      if (!defaultTheme) {
        return NextResponse.json({ error: "No default theme found" }, { status: 400 })
      }
      themeId = defaultTheme.id
    }

    const customization = await prisma.themeCustomization.upsert({
      where: { churchId },
      update: {
        themeId,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        headingColor: body.headingColor,
        headingFont: body.headingFont,
        bodyFont: body.bodyFont,
        baseFontSize: body.baseFontSize,
        borderRadius: body.borderRadius,
        navbarStyle: body.navbarStyle,
        footerStyle: body.footerStyle,
        buttonStyle: body.buttonStyle,
        cardStyle: body.cardStyle,
        customCss: body.customCss,
        tokenOverrides: body.tokenOverrides,
      },
      create: {
        churchId,
        themeId,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        backgroundColor: body.backgroundColor,
        textColor: body.textColor,
        headingColor: body.headingColor,
        headingFont: body.headingFont,
        bodyFont: body.bodyFont,
        baseFontSize: body.baseFontSize,
        borderRadius: body.borderRadius,
        navbarStyle: body.navbarStyle,
        footerStyle: body.footerStyle,
        buttonStyle: body.buttonStyle,
        cardStyle: body.cardStyle,
        customCss: body.customCss,
        tokenOverrides: body.tokenOverrides,
      },
      include: { theme: true },
    })

    return NextResponse.json({
      theme: customization.theme,
      customization,
    })
  } catch (error) {
    console.error("PUT /api/v1/theme error:", error)
    return NextResponse.json({ error: "Failed to update theme" }, { status: 500 })
  }
}
