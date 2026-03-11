import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getChurchId } from '@/lib/api/get-church-id'
import { requireApiAuth } from '@/lib/api/require-auth'
import { listSubmissions, getUnreadCount, type FormSubmissionFilters } from '@/lib/dal/form-submissions'
import { sendContactNotificationEmail } from '@/lib/email/notification'
import { rateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 submissions per minute per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: allowed } = rateLimit(`form-submit:${ip}`, 5, 60_000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 },
      )
    }

    const churchId = await getChurchId()
    const body = await request.json()

    const { firstName, lastName, email, phone, interests, otherInterest, campus, otherCampus, comments, bibleTeacher } = body

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 },
      )
    }

    // Basic validation
    const trimmedEmail = String(email).trim().toLowerCase()
    if (!EMAIL_RE.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (String(firstName).length > 100 || String(lastName).length > 100) {
      return NextResponse.json({ error: 'Name is too long' }, { status: 400 })
    }
    if (comments && String(comments).length > 2000) {
      return NextResponse.json({ error: 'Comments are too long' }, { status: 400 })
    }

    // Honeypot: reject if the hidden "website" field is filled
    if (body.website) {
      // Silently succeed to not tip off bots
      return NextResponse.json({ success: true })
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        churchId,
        formType: 'visit-us',
        name: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
        email: trimmedEmail,
        phone: phone ? String(phone).slice(0, 30) : null,
        fields: {
          interests: Array.isArray(interests) ? interests : [],
          otherInterest: otherInterest ? String(otherInterest).slice(0, 200) : null,
          campus: campus ? String(campus).slice(0, 100) : null,
          otherCampus: otherCampus ? String(otherCampus).slice(0, 100) : null,
          comments: comments ? String(comments).slice(0, 2000) : null,
          bibleTeacher: typeof bibleTeacher === 'boolean' ? bibleTeacher : false,
        },
      },
    })

    // Fire email notification async — don't block response
    sendContactNotificationEmail(churchId, submission).catch(console.error)

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
      status: searchParams.get('status') ?? undefined,
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
