import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import {
  listBuilderFeedback,
  createBuilderFeedback,
  getBuilderFeedbackCounts,
  type BuilderFeedbackFilters,
} from '@/lib/dal/builder-feedback'

export async function POST(request: NextRequest) {
  try {
    // Any authenticated user can submit feedback
    const authResult = await requireApiAuth()
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const body = await request.json()

    // Validate required fields
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Title is required' } },
        { status: 400 },
      )
    }
    if (body.title.length > 200) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Title must be 200 characters or less' } },
        { status: 400 },
      )
    }
    if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Description is required' } },
        { status: 400 },
      )
    }

    const VALID_TYPES = ['bug', 'feature', 'feedback']
    const type = VALID_TYPES.includes(body.type) ? body.type : 'bug'

    // Look up user name + church name
    const { prisma } = await import('@/lib/db')
    const [user, church] = await Promise.all([
      prisma.user.findUnique({
        where: { id: authResult.userId },
        select: { firstName: true, lastName: true },
      }),
      prisma.church.findUnique({
        where: { id: churchId },
        select: { name: true, slug: true },
      }),
    ])
    const userName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : 'Unknown'

    // Merge church info into snapshot
    const snapshot = {
      ...(body.snapshot || {}),
      churchName: church?.name ?? null,
      churchSlug: church?.slug ?? null,
    }

    const feedback = await createBuilderFeedback({
      churchId,
      userId: authResult.userId,
      userName,
      title: body.title.trim(),
      description: body.description.trim(),
      type,
      snapshot,
      actionHistory: Array.isArray(body.actionHistory) ? body.actionHistory : null,
    })

    return NextResponse.json({ success: true, data: feedback }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/builder-feedback error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to submit feedback' } },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (!authResult.authorized) return authResult.response

    // Owner-only (rolePriority >= 1000)
    if (authResult.rolePriority < 1000) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Owner access required' } },
        { status: 403 },
      )
    }

    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    // Support countOnly param
    if (searchParams.get('countOnly') === 'true') {
      const counts = await getBuilderFeedbackCounts(churchId)
      return NextResponse.json({ success: true, data: counts })
    }

    const filters: BuilderFeedbackFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    }

    const result = await listBuilderFeedback(churchId, filters)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    console.error('GET /api/v1/builder-feedback error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feedback' } },
      { status: 500 },
    )
  }
}
