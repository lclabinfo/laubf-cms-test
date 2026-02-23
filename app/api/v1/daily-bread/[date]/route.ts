import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { updateDailyBread } from '@/lib/dal/daily-bread'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ date: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { date } = await params

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    const entry = await prisma.dailyBread.findUnique({
      where: { churchId_date: { churchId, date: parsedDate } },
    })

    if (!entry) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Daily bread not found for this date' } },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: entry })
  } catch (error) {
    console.error('GET /api/v1/daily-bread/[date] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch daily bread' } },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { date } = await params
    const body = await request.json()

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    const existing = await prisma.dailyBread.findUnique({
      where: { churchId_date: { churchId, date: parsedDate } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Daily bread not found for this date' } },
        { status: 404 },
      )
    }

    const updated = await updateDailyBread(churchId, existing.id, body)
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('PATCH /api/v1/daily-bread/[date] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update daily bread' } },
      { status: 500 },
    )
  }
}
