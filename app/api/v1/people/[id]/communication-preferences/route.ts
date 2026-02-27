import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPersonById } from '@/lib/dal/people'
import { getCommunicationPreferences, setCommunicationPreference } from '@/lib/dal/communication-preferences'
import { type CommunicationChannel } from '@/lib/generated/prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params

    const person = await getPersonById(churchId, id)
    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    const preferences = await getCommunicationPreferences(id)

    return NextResponse.json({ success: true, data: preferences })
  } catch (error) {
    console.error('GET /api/v1/people/[id]/communication-preferences error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch preferences' } },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const body = await request.json()

    const person = await getPersonById(churchId, id)
    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    if (!body.channel || !body.category || body.isOptedIn === undefined) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'channel, category, and isOptedIn are required' } },
        { status: 400 },
      )
    }

    const preference = await setCommunicationPreference(
      id,
      body.channel as CommunicationChannel,
      body.category,
      body.isOptedIn,
    )

    return NextResponse.json({ success: true, data: preference })
  } catch (error) {
    console.error('PUT /api/v1/people/[id]/communication-preferences error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update preference' } },
      { status: 500 },
    )
  }
}
