/**
 * Shared email layout — modern, minimal design inspired by Apple's transactional emails.
 * All emails go through this wrapper for consistent branding.
 */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface EmailLayoutOptions {
  /** Church name displayed in header */
  churchName?: string
  /** Optional preheader text (shows in email preview, hidden in body) */
  preheader?: string
}

/**
 * Wraps email content in a polished, responsive HTML layout.
 * Uses system font stack, generous whitespace, and a refined color palette.
 */
export function emailLayout(content: string, options: EmailLayoutOptions = {}): string {
  const { churchName, preheader } = options

  const preheaderBlock = preheader
    ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${churchName || 'Church'}</title>
  <!--[if mso]>
  <noscript><xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml></noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0; mso-table-rspace: 0; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }

    /* Typography */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Links */
    a { color: #1d1d1f; }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .email-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .stack-col { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f7; -webkit-font-smoothing:antialiased;">
  ${preheaderBlock}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f5f7;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email container -->
        <table role="presentation" class="email-container" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px; width:100%;">

          ${churchName ? `
          <!-- Church name header -->
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <span style="font-size:13px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#86868b;">
                ${escapeHtml(churchName)}
              </span>
            </td>
          </tr>
          ` : ''}

          <!-- Main card -->
          <tr>
            <td style="background-color:#ffffff; border-radius:16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="email-padding" style="padding: 48px 48px 40px 48px;">
                    ${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 24px 0 24px;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#86868b;">
                ${churchName ? `&copy; ${new Date().getFullYear()} ${escapeHtml(churchName)}` : ''}
              </p>
              <p style="margin:6px 0 0 0; font-size:11px; line-height:1.5; color:#aeaeb2;">
                This is an automated message. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Generates a CTA button for emails.
 * Uses a bulletproof button pattern (works without CSS/images).
 */
export function emailButton(label: string, href: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 32px 0 8px 0;">
    <tr>
      <td style="border-radius:980px; background-color:#1d1d1f;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="50%" fillcolor="#1d1d1f">
          <w:anchorlock/>
          <center style="font-size:15px;font-weight:500;color:#ffffff;font-family:sans-serif;">
            ${escapeHtml(label)}
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${href}" target="_blank" style="display:inline-block; padding:14px 36px; font-size:15px; font-weight:500; color:#ffffff; text-decoration:none; border-radius:980px; background-color:#1d1d1f; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif;">
          ${escapeHtml(label)}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`
}

/**
 * Generates a key-value table for form data display.
 */
export function emailFieldsTable(rows: { label: string; value: string }[]): string {
  const rowsHtml = rows.map(({ label, value }) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #f5f5f7; vertical-align:top; width:140px;">
        <span style="font-size:12px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:#86868b;">
          ${label}
        </span>
      </td>
      <td style="padding:12px 0 12px 16px; border-bottom:1px solid #f5f5f7; vertical-align:top;">
        <span style="font-size:15px; line-height:1.5; color:#1d1d1f;">
          ${value}
        </span>
      </td>
    </tr>`).join('')

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    ${rowsHtml}
  </table>`
}
