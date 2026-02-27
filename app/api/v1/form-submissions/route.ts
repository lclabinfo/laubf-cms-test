import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'

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

    // TODO: Persist to a FormSubmission table once the model is added to the schema.
    // For now, log the submission so it's captured in server logs.
    console.log('[FormSubmission]', {
      churchId,
      firstName,
      lastName,
      email,
      phone: phone || null,
      interests: interests || [],
      otherInterest: otherInterest || null,
      campus: campus || null,
      otherCampus: otherCampus || null,
      comments: comments || null,
      bibleTeacher: bibleTeacher || false,
      submittedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to process form submission' },
      { status: 500 },
    )
  }
}
