import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getDomains, createDomain } from '@/lib/dal/domains'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getDomains(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/domains error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch domains' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.domain || typeof body.domain !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'domain string is required' } },
        { status: 400 },
      )
    }

    const domain = await createDomain(churchId, body.domain)

    return NextResponse.json({ success: true, data: domain }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/domains error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create domain' } },
      { status: 500 },
    )
  }
}
