import { prisma } from '@/lib/db'
import { sendEmail } from './send-email'
import { emailLayout, emailButton, emailFieldsTable, escapeHtml } from './layout'

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.length > 0 ? value.map(v => escapeHtml(String(v))).join(', ') : '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return escapeHtml(String(value))
}

interface SubmissionData {
  id: string
  name: string
  email: string
  phone?: string | null
  formType: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: any
  createdAt: Date
}

// ── Admin notification ────────────────────────────────────────────────

export async function sendContactNotificationEmail(churchId: string, submission: SubmissionData): Promise<void> {
  const recipients = await getNotificationRecipients(churchId)
  const churchName = await getChurchName(churchId)

  // Always attempt confirmation email, even if no admin recipients configured
  sendConfirmationEmail(submission, churchName).catch(console.error)

  if (recipients.length === 0) {
    console.log('[Notification] No notification recipients configured, skipping admin email')
    return
  }

  const adminUrl = process.env.CMS_URL || ''
  const detailUrl = `${adminUrl}/cms/form-submissions/${submission.id}`
  const submittedAt = submission.createdAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  // Build fields rows
  const fields = submission.fields || {}
  const rows: { label: string; value: string }[] = [
    { label: 'Name', value: escapeHtml(submission.name) },
    { label: 'Email', value: `<a href="mailto:${escapeHtml(submission.email)}" style="color:#0066cc;text-decoration:none;">${escapeHtml(submission.email)}</a>` },
  ]

  if (submission.phone) {
    rows.push({ label: 'Phone', value: escapeHtml(submission.phone) })
  }

  const fieldLabels: Record<string, string> = {
    interests: 'Interests',
    otherInterest: 'Other Interest',
    campus: 'Campus',
    otherCampus: 'Other Campus',
    comments: 'Comments',
    bibleTeacher: 'Bible Teacher',
  }

  for (const [key, label] of Object.entries(fieldLabels)) {
    if (key in fields && fields[key] !== null && fields[key] !== undefined && fields[key] !== '') {
      const val = fields[key]
      if (Array.isArray(val) && val.length === 0) continue
      rows.push({ label, value: formatFieldValue(val) })
    }
  }

  rows.push({ label: 'Submitted', value: escapeHtml(submittedAt) })

  const subject = `New Form Submission — ${submission.name}`

  const content = `
    <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:600; letter-spacing:-0.02em; color:#1d1d1f;">
      New Form Submission
    </h1>
    <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#86868b;">
      Someone submitted the <strong style="color:#1d1d1f;">${escapeHtml(submission.formType)}</strong> form on your website.
    </p>
    ${emailFieldsTable(rows)}
    ${emailButton('View in CMS', detailUrl)}
  `

  const html = emailLayout(content, { churchName, preheader: `New ${submission.formType} form from ${submission.name}` })

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

  await Promise.all(
    recipients.map((to) => sendEmail({ to, subject, html, text })),
  )
}

// ── Confirmation email to submitter ───────────────────────────────────

async function sendConfirmationEmail(submission: SubmissionData, churchName: string): Promise<void> {
  const firstName = submission.name.split(' ')[0] || submission.name
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || process.env.WEBSITE_URL || ''

  const content = `
    <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:600; letter-spacing:-0.02em; color:#1d1d1f;">
      Thank you, ${escapeHtml(firstName)}.
    </h1>
    <p style="margin:0 0 4px 0; font-size:15px; line-height:1.7; color:#424245;">
      We received your form submission and wanted to let you know that someone from our team will be reaching out to you soon.
    </p>
    <p style="margin:20px 0 0 0; font-size:15px; line-height:1.7; color:#424245;">
      In the meantime, feel free to explore our website to learn more about our church, upcoming events, and ways to get connected.
    </p>
    ${websiteUrl ? emailButton('Visit Our Website', websiteUrl) : ''}
    <p style="margin:32px 0 0 0; font-size:15px; line-height:1.7; color:#424245;">
      We look forward to connecting with you.
    </p>
    <p style="margin:16px 0 0 0; font-size:15px; color:#1d1d1f; font-weight:500;">
      — The ${escapeHtml(churchName)} Team
    </p>
  `

  const html = emailLayout(content, {
    churchName,
    preheader: `Thank you for reaching out to ${churchName}`,
  })

  const text = [
    `Thank you, ${firstName}.`,
    '',
    `We received your form submission and wanted to let you know that someone from our team will be reaching out to you soon.`,
    '',
    `In the meantime, feel free to explore our website to learn more about our church, upcoming events, and ways to get connected.`,
    websiteUrl ? `\nVisit our website: ${websiteUrl}` : '',
    '',
    `We look forward to connecting with you.`,
    `— The ${churchName} Team`,
  ].filter(Boolean).join('\n')

  await sendEmail({
    to: submission.email,
    subject: `Thank you for reaching out — ${churchName}`,
    html,
    text,
  })
}

// ── Helpers ───────────────────────────────────────────────────────────

export async function getNotificationRecipients(churchId: string): Promise<string[]> {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { churchId },
      select: { notificationEmails: true },
    })
    if (settings?.notificationEmails && settings.notificationEmails.length > 0) {
      return settings.notificationEmails
    }
  } catch {
    // Fall through to env var
  }

  const envRecipients = process.env.NOTIFICATION_EMAIL || 'info@lclab.io'
  return envRecipients.split(',').map((e) => e.trim()).filter(Boolean)
}

async function getChurchName(churchId: string): Promise<string> {
  try {
    const church = await prisma.church.findUnique({
      where: { id: churchId },
      select: { name: true },
    })
    return church?.name || 'Our Church'
  } catch {
    return 'Our Church'
  }
}
