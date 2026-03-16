/**
 * Email templates for transactional emails (verification, password reset, invitations).
 * Uses the shared email layout for consistent design.
 */

import { emailLayout, emailButton, escapeHtml } from './layout'

function getBaseUrl(): string {
  return process.env.AUTH_URL || 'http://localhost:3000'
}

export function verificationEmail(token: string, rawChurchName: string): { subject: string; html: string; text: string } {
  const baseUrl = getBaseUrl()
  const churchName = escapeHtml(rawChurchName)
  const url = `${baseUrl}/cms/verify-email?token=${token}`

  const content = `
    <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:600; letter-spacing:-0.02em; color:#1d1d1f;">
      Verify your email
    </h1>
    <p style="margin:0 0 4px 0; font-size:15px; line-height:1.7; color:#424245;">
      Thanks for creating an account with ${churchName}. Verify your email address to get started.
    </p>
    ${emailButton('Verify Email', url)}
    <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#86868b;">
      Or copy this link into your browser:<br>
      <a href="${url}" style="color:#0066cc; text-decoration:none; word-break:break-all;">${url}</a>
    </p>
    <p style="margin:16px 0 0 0; font-size:13px; color:#86868b;">
      This link expires in 30 minutes. If you didn't create this account, you can safely ignore this email.
    </p>
  `

  return {
    subject: `Verify your email — ${rawChurchName}`,
    html: emailLayout(content, { churchName: rawChurchName, preheader: 'Verify your email to get started' }),
    text: `Verify your email: ${url}\n\nThis link expires in 30 minutes.`,
  }
}

export function passwordResetEmail(token: string, rawChurchName: string): { subject: string; html: string; text: string } {
  const baseUrl = getBaseUrl()
  const churchName = escapeHtml(rawChurchName)
  const url = `${baseUrl}/cms/reset-password?token=${token}`

  const content = `
    <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:600; letter-spacing:-0.02em; color:#1d1d1f;">
      Reset your password
    </h1>
    <p style="margin:0 0 4px 0; font-size:15px; line-height:1.7; color:#424245;">
      We received a request to reset the password for your ${churchName} account. Click the button below to set a new password.
    </p>
    ${emailButton('Reset Password', url)}
    <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#86868b;">
      Or copy this link into your browser:<br>
      <a href="${url}" style="color:#0066cc; text-decoration:none; word-break:break-all;">${url}</a>
    </p>
    <p style="margin:16px 0 0 0; font-size:13px; color:#86868b;">
      This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.
    </p>
  `

  return {
    subject: `Reset your password — ${rawChurchName}`,
    html: emailLayout(content, { churchName: rawChurchName, preheader: 'Reset your password' }),
    text: `Reset your password: ${url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
  }
}

export function passwordResetCodeEmail(code: string, rawChurchName: string): { subject: string; html: string; text: string } {
  const churchName = escapeHtml(rawChurchName)

  const content = `
    <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:600; letter-spacing:-0.02em; color:#1d1d1f;">
      Your password reset code
    </h1>
    <p style="margin:0 0 16px 0; font-size:15px; line-height:1.7; color:#424245;">
      Use the code below to reset your ${churchName} account password.
    </p>
    <div style="margin:0 0 16px 0; padding:16px 24px; background:#f5f5f7; border-radius:12px; text-align:center;">
      <span style="font-size:32px; font-weight:700; letter-spacing:8px; color:#1d1d1f; font-family:monospace;">
        ${code}
      </span>
    </div>
    <p style="margin:0 0 0 0; font-size:13px; color:#86868b;">
      This code expires in 15 minutes. If you didn't request this, ignore this email — your password won't change.
    </p>
  `

  return {
    subject: `${code} is your password reset code — ${rawChurchName}`,
    html: emailLayout(content, { churchName: rawChurchName, preheader: `Your password reset code is ${code}` }),
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes. If you didn't request this, ignore this email.`,
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

  const content = `
    <h1 style="margin:0 0 8px 0; font-size:24px; font-weight:600; letter-spacing:-0.02em; color:#1d1d1f;">
      You're invited
    </h1>
    <p style="margin:0 0 4px 0; font-size:15px; line-height:1.7; color:#424245;">
      <strong style="color:#1d1d1f;">${inviterName}</strong> has invited you to join <strong style="color:#1d1d1f;">${churchName}</strong> as <strong style="color:#1d1d1f;">${roleName}</strong>.
    </p>
    ${emailButton('Accept Invitation', url)}
    <p style="margin:24px 0 0 0; font-size:13px; line-height:1.6; color:#86868b;">
      Or copy this link into your browser:<br>
      <a href="${url}" style="color:#0066cc; text-decoration:none; word-break:break-all;">${url}</a>
    </p>
    <p style="margin:16px 0 0 0; font-size:13px; color:#86868b;">
      This link expires in 7 days. If you weren't expecting this invitation, you can safely ignore this email.
    </p>
  `

  return {
    subject: `You've been invited to ${rawChurchName}`,
    html: emailLayout(content, { churchName: rawChurchName, preheader: `${rawInviterName} invited you to join ${rawChurchName}` }),
    text: `${rawInviterName} has invited you to join ${rawChurchName} as ${rawRoleName}.\n\nAccept: ${url}\n\nThis link expires in 7 days.`,
  }
}
