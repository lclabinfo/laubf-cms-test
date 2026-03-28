import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getChurchId } from '@/lib/api/get-church-id'
import { getPageBySlugOrId, updatePageSection, deletePageSection } from '@/lib/dal/pages'
import { validateSectionContent, validateSectionUpdateFields } from '@/lib/api/validation'
import { requireApiAuth } from '@/lib/api/require-auth'
import { Prisma } from '@/lib/generated/prisma/client'
import { invalidatePages } from '@/lib/cache/invalidation'

type Params = { params: Promise<{ slug: string; id: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('website.pages.edit')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug, id } = await params
    const body = await request.json()

    // Validate allowed fields (prevent mass-assignment)
    const fieldsResult = validateSectionUpdateFields(body)
    if (!fieldsResult.valid) {
      return NextResponse.json(
        { success: false, error: fieldsResult.error },
        { status: 400 },
      )
    }

    // Validate content structure if present
    const contentResult = validateSectionContent(body.content)
    if (!contentResult.valid) {
      return NextResponse.json(
        { success: false, error: contentResult.error },
        { status: 400 },
      )
    }

    const updated = await updatePageSection(churchId, id, body)

    // Revalidate the public page so section content changes are reflected
    revalidatePath(`/website/${slug}`)
    const page = await getPageBySlugOrId(churchId, slug)
    if (page?.isHomepage) {
      revalidatePath('/website')
    }
    invalidatePages(churchId)

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    // Return 404 when the section was deleted by another user
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Section not found (may have been deleted by another user)' } },
        { status: 404 },
      )
    }
    console.error('PATCH /api/v1/pages/[slug]/sections/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update section' } },
      { status: 500 },
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireApiAuth('website.pages.edit')
    if (!authResult.authorized) return authResult.response

    const churchId = await getChurchId()
    const { slug, id } = await params

    await deletePageSection(churchId, id)

    // Revalidate the public page so deleted section is removed
    revalidatePath(`/website/${slug}`)
    const page = await getPageBySlugOrId(churchId, slug)
    if (page?.isHomepage) {
      revalidatePath('/website')
    }
    invalidatePages(churchId)

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    // Prisma P2025 = record not found — treat double-delete as idempotent success
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ success: true, data: { deleted: true } })
    }
    console.error('DELETE /api/v1/pages/[slug]/sections/[id] error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete section' } },
      { status: 500 },
    )
  }
}
