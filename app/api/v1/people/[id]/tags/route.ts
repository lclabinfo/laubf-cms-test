import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPersonById } from '@/lib/dal/people'
import { prisma } from '@/lib/db'

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

    const tags = await prisma.personTag.findMany({
      where: { personId: id },
      orderBy: { tagName: 'asc' },
    })

    return NextResponse.json({ success: true, data: tags })
  } catch (error) {
    console.error('GET /api/v1/people/[id]/tags error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tags' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
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

    if (!body.tagName) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tagName is required' } },
        { status: 400 },
      )
    }

    const tag = await prisma.personTag.upsert({
      where: { personId_tagName: { personId: id, tagName: body.tagName } },
      update: {},
      create: { personId: id, tagName: body.tagName },
    })

    return NextResponse.json({ success: true, data: tag }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/people/[id]/tags error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add tag' } },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const churchId = await getChurchId()
    const { id } = await params
    const { searchParams } = request.nextUrl
    const tagName = searchParams.get('tagName')

    const person = await getPersonById(churchId, id)
    if (!person) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Person not found' } },
        { status: 404 },
      )
    }

    if (!tagName) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'tagName query param is required' } },
        { status: 400 },
      )
    }

    await prisma.personTag.delete({
      where: { personId_tagName: { personId: id, tagName } },
    })

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('DELETE /api/v1/people/[id]/tags error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove tag' } },
      { status: 500 },
    )
  }
}
