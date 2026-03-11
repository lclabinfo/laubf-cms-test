import { sendEmail } from './send-email'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function wrap(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .btn { display: inline-block; padding: 12px 32px; background: #18181b; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 24px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280; }
    table.fields { width: 100%; border-collapse: collapse; margin: 16px 0; }
    table.fields td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    table.fields td.label { font-weight: 600; color: #6b7280; width: 140px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
    table.fields td.value { color: #18181b; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.length > 0 ? value.map(escapeHtml).join(', ') : '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return escapeHtml(String(value))
}

export async function sendContactNotificationEmail(submission: {
  id: string
  name: string
  email: string
  phone?: string | null
  formType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: any
  createdAt: Date
}): Promise<void> {
  const recipients = getNotificationRecipients()
  if (recipients.length === 0) {
    console.log('[Notification] No notification recipients configured, skipping email')
    return
  }

  const adminUrl = process.env.CMS_URL || ''
  const detailUrl = `${adminUrl}/cms/form-submissions/${submission.id}`
  const submittedAt = submission.createdAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  // Build fields table rows
  const fields = submission.fields || {}
  const fieldRows: string[] = []

  // Core fields first
  fieldRows.push(`<tr><td class="label">Name</td><td class="value">${escapeHtml(submission.name)}</td></tr>`)
  fieldRows.push(`<tr><td class="label">Email</td><td class="value"><a href="mailto:${escapeHtml(submission.email)}">${escapeHtml(submission.email)}</a></td></tr>`)
  if (submission.phone) {
    fieldRows.push(`<tr><td class="label">Phone</td><td class="value">${escapeHtml(submission.phone)}</td></tr>`)
  }

  // Dynamic fields from the JSON blob
  const fieldLabels: Record<string, string> = {
    interests: 'Interests',
    otherInterest: 'Other Interest',
    campus: 'Campus',
    otherCampus: 'Other Campus',
    comments: 'Comments',
    bibleTeacher: 'Wants Bible Teacher',
  }

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (key in fields && fields[key] !== null && fields[key] !== undefined && fields[key] !== '') {
      const val = fields[key]
      // Skip empty arrays
      if (Array.isArray(val) && val.length === 0) continue
      fieldRows.push(`<tr><td class="label">${escapeHtml(label)}</td><td class="value">${formatFieldValue(val)}</td></tr>`)
    }
  }

  fieldRows.push(`<tr><td class="label">Submitted</td><td class="value">${escapeHtml(submittedAt)}</td></tr>`)

  const subject = `New Visit Us Form Submission from ${submission.name}`

  const html = wrap(`
    <h2>New Form Submission</h2>
    <p>A new <strong>${escapeHtml(submission.formType)}</strong> form was submitted on your website.</p>
    <table class="fields">
      ${fieldRows.join('\n      ')}
    </table>
    <a href="${detailUrl}" class="btn">View in CMS</a>
    <div class="footer">This is an automated notification from your church website.</div>
  `)

  const text = [
    `New ${submission.formType} form submission from ${submission.name}`,
    '',
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    submission.phone ? `Phone: ${submission.phone}` : null,
    ...Object.entries(fieldLabels)
      .filter(([key]) => key in fields && fields[key] !== null && fields[key] !== undefined)
      .map(([key, label]) => `${label}: ${formatFieldValue(fields[key])}`),
    `Submitted: ${submittedAt}`,
    '',
    `View in CMS: ${detailUrl}`,
  ].filter(Boolean).join('\n')

  // Send to all recipients
  await Promise.all(
    recipients.map((to) =>
      sendEmail({ to, subject, html, text })
    ),
  )
}

function getNotificationRecipients(): string[] {
  const envRecipients = process.env.NOTIFICATION_EMAIL || 'info@lclab.io'
  return envRecipients
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}
