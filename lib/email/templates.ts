/**
 * Email templates for transactional emails.
 */

function getBaseUrl(): string {
  return process.env.AUTH_URL || 'http://localhost:3000'
}

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
    .code { background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`
}

export function verificationEmail(token: string, rawChurchName: string): { subject: string; html: string; text: string } {
  const baseUrl = getBaseUrl()
  const churchName = escapeHtml(rawChurchName)
  const url = `${baseUrl}/cms/verify-email?token=${token}`
  return {
    subject: `Verify your email — ${rawChurchName}`,
    html: wrap(`
      <h2>Welcome!</h2>
      <p>Thanks for creating an account. Please verify your email address by clicking the button below.</p>
      <a href="${url}" class="btn">Verify Email</a>
      <p>Or copy this link: <span class="code">${url}</span></p>
      <p>This link expires in 24 hours.</p>
      <div class="footer">If you didn't create this account, you can safely ignore this email.</div>
    `),
    text: `Verify your email: ${url}\n\nThis link expires in 24 hours.`,
  }
}

export function passwordResetEmail(token: string, rawChurchName: string): { subject: string; html: string; text: string } {
  const baseUrl = getBaseUrl()
  const churchName = escapeHtml(rawChurchName)
  const url = `${baseUrl}/cms/reset-password?token=${token}`
  return {
    subject: `Reset your password — ${rawChurchName}`,
    html: wrap(`
      <h2>Password Reset</h2>
      <p>Someone requested a password reset for your account. Click the button below to set a new password.</p>
      <a href="${url}" class="btn">Reset Password</a>
      <p>Or copy this link: <span class="code">${url}</span></p>
      <p>This link expires in 1 hour.</p>
      <div class="footer">If you didn't request this, ignore this email. Your password won't change.</div>
    `),
    text: `Reset your password: ${url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  }
}

export function invitationEmail(
  token: string,
  rawChurchName: string,
  rawInviterName: string,
  rawRoleName: string,
): { subject: string; html: string; text: string } {
  const baseUrl = getBaseUrl()
  const churchName = escapeHtml(rawChurchName)
  const inviterName = escapeHtml(rawInviterName)
  const roleName = escapeHtml(rawRoleName)
  const url = `${baseUrl}/cms/accept-invite?token=${token}`
  return {
    subject: `You've been invited to ${rawChurchName} CMS`,
    html: wrap(`
      <h2>You're Invited!</h2>
      <p><strong>${inviterName}</strong> has invited you to join <strong>${churchName}</strong> as <strong>${roleName}</strong>.</p>
      <a href="${url}" class="btn">Accept Invitation</a>
      <p>Or copy this link: <span class="code">${url}</span></p>
      <p>This link expires in 7 days.</p>
      <div class="footer">If you weren't expecting this invitation, you can safely ignore this email.</div>
    `),
    text: `${rawInviterName} has invited you to join ${rawChurchName} as ${rawRoleName}.\n\nAccept: ${url}\n\nThis link expires in 7 days.`,
  }
}
