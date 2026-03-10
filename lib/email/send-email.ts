/**
 * Email sending via SendGrid.
 * Falls back to console.log if SENDGRID_API_KEY is not set (development).
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY
  const from = process.env.EMAIL_FROM || 'noreply@example.com'

  if (!apiKey) {
    console.log('[Email] SendGrid not configured. Would send:')
    console.log(`  To: ${options.to}`)
    console.log(`  Subject: ${options.subject}`)
    console.log(`  Body: ${options.text || options.html.substring(0, 200)}...`)
    return true
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: from },
        subject: options.subject,
        content: [
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          { type: 'text/html', value: options.html },
        ],
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[Email] SendGrid error:', response.status, body)
      return false
    }

    return true
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return false
  }
}
