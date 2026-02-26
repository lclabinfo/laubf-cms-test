import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPages, createPage } from '@/lib/dal/pages'

export async function GET() {
  try {
    const churchId = await getChurchId()
    const data = await getPages(churchId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('GET /api/v1/pages error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pages' } },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.title || !body.slug) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'title and slug are required' } },
        { status: 400 },
      )
    }

    const page = await createPage(churchId, body)

    // Revalidate public website so the new page is accessible
    revalidatePath('/website', 'layout')

    return NextResponse.json({ success: true, data: page }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/pages error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create page' } },
      { status: 500 },
    )
  }
}
