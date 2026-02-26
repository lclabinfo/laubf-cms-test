import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getDailyBreads, getTodaysDailyBread, createDailyBread } from '@/lib/dal/daily-bread'

export async function GET(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl
    const today = searchParams.get('today')

    if (today === 'true') {
      const entry = await getTodaysDailyBread(churchId)
      return NextResponse.json({ success: true, data: entry })
    }

    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 30
    const data = await getDailyBreads(churchId, limit)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/daily-bread error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch daily bread' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.date || !body.passage || !body.content) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'date, passage, and content are required' } },
        { status: 400 },
      )
    }

    const entry = await createDailyBread(churchId, body)

    // Revalidate public website pages that display daily bread
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: entry }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/daily-bread error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create daily bread' } },
      { status: 500 },
    )
  }
}
