import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { listSubmissions, getUnreadCount, type FormSubmissionFilters } from '@/lib/dal/form-submissions'
import { sendContactNotificationEmail } from '@/lib/email/notification'

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    const { firstName, lastName, email, phone, interests, otherInterest, campus, otherCampus, comments, bibleTeacher } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 },
      )
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        churchId,
        formType: 'visit-us',
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone: phone || null,
        fields: { interests, otherInterest, campus, otherCampus, comments, bibleTeacher },
      },
    })

    // Fire email notification async — don't block response
    sendContactNotificationEmail(submission).catch(console.error)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to process form submission' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth('submissions.view')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { searchParams } = request.nextUrl

    // Support countOnly param for sidebar badge
    if (searchParams.get('countOnly') === 'true') {
      const count = await getUnreadCount(churchId)
      return NextResponse.json({ success: true, data: { unreadCount: count } })
    }

    const filters: FormSubmissionFilters & { page?: number; pageSize?: number } = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined,
      search: searchParams.get('search') ?? undefined,
      formType: searchParams.get('formType') ?? undefined,
      isRead: searchParams.has('isRead')
        ? searchParams.get('isRead') === 'true'
        : undefined,
    }

    const result = await listSubmissions(churchId, filters)

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
    console.error('GET /api/v1/form-submissions error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch submissions' } },
      { status: 500 },
    )
  }
}
