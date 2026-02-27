import { NextRequest, NextResponse } from 'next/server'
import { getChurchId } from '@/lib/api/get-church-id'
import { importPeople } from '@/lib/dal/people'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"(.*)"$/, '$1'))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"(.*)"$/, '$1'))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (values[index] !== undefined && values[index] !== '') {
        row[header] = values[index]
      }
    })
    if (row.firstName && row.lastName) {
      rows.push(row)
    }
  }

  return rows
}

export async function POST(request: NextRequest) {
  try {
    const churchId = await getChurchId()
    const body = await request.json()

    if (!body.csv || typeof body.csv !== 'string') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'csv string is required' } },
        { status: 400 },
      )
    }

    const rows = parseCSV(body.csv)
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No valid rows found in CSV' } },
        { status: 400 },
      )
    }

    const people = rows.map((row) => ({
      slug: row.slug || slugify(`${row.firstName}-${row.lastName}`),
      firstName: row.firstName,
      lastName: row.lastName,
      preferredName: row.preferredName || null,
      email: row.email || null,
      phone: row.phone || null,
      mobilePhone: row.mobilePhone || null,
      membershipStatus: (row.membershipStatus as 'VISITOR' | 'REGULAR_ATTENDEE' | 'MEMBER' | 'INACTIVE' | 'ARCHIVED') || 'VISITOR',
    }))

    const result = await importPeople(churchId, people)

    return NextResponse.json({
      success: true,
      data: {
        imported: result.created,
        errors: result.errors,
        total: rows.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/v1/people/import error:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to import people' } },
      { status: 500 },
    )
  }
}
