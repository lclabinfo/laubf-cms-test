import { NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getContactFrequency } from '@/lib/dal/events'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getContactFrequency(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/events/contact-frequency error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch contact frequency' } },
      { status: 500 },
    )
  }
}
