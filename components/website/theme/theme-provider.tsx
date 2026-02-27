import { getThemeWithCustomization } from '@/lib/dal/theme'

/**
 * Sanitize custom CSS to prevent XSS vectors.
 * Strips script injection, JS expressions, external resource loading, and
 * IE-specific behavior properties.
 */
function sanitizeCss(css: string): string {
  let sanitized = css

  // Remove anything that looks like <script> or </script> tags
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '')

  // Remove expression() — IE CSS expression XSS
  sanitized = sanitized.replace(/expression\s*\(/gi, '')

  // Remove url(javascript:...) vectors
  sanitized = sanitized.replace(/url\s*\(\s*(['"]?\s*javascript\s*:)/gi, 'url(about:invalid')

  // Remove @import rules (could load external stylesheets)
  sanitized = sanitized.replace(/@import\b[^;]*;?/gi, '')

  // Remove behavior: property (IE-specific, loads .htc files)
  sanitized = sanitized.replace(/behavior\s*:/gi, '')

  // Remove -moz-binding (Firefox XBL binding, legacy XSS vector)
  sanitized = sanitized.replace(/-moz-binding\s*:/gi, '')

  if (sanitized !== css) {
    console.warn('[ThemeProvider] Stripped potentially unsafe content from custom CSS')
  }

  return sanitized
}

interface ThemeProviderProps {
  churchId: string
  children: React.ReactNode
}

export async function ThemeProvider({ churchId, children }: ThemeProviderProps) {
  const theme = await getThemeWithCustomization(churchId)
  const customization = theme
  const defaultTokens = (theme?.theme?.defaultTokens ?? {}) as Record<string, string>

  // Build token overrides using --ws- (website) prefix to avoid collisions
  // with Tailwind/shadcn variables (--color-primary, --color-background, etc.)
  const tokens: Record<string, string> = {
    '--ws-color-primary': customization?.primaryColor || defaultTokens['--color-primary'] || '#1a1a2e',
    '--ws-color-secondary': customization?.secondaryColor || defaultTokens['--color-secondary'] || '#16213e',
    '--ws-color-background': customization?.backgroundColor || defaultTokens['--color-background'] || '#ffffff',
    '--ws-color-text': customization?.textColor || defaultTokens['--color-text'] || '#1a1a1a',
    '--ws-color-heading': customization?.headingColor || defaultTokens['--color-heading'] || '#0a0a0a',
    '--ws-font-size-base': `${customization?.baseFontSize || 16}px`,
    '--ws-border-radius': customization?.borderRadius || defaultTokens['--border-radius'] || '0.5rem',
  }

  // Only override font CSS variables when the database specifies custom
  // fonts — otherwise let the @theme definitions in globals.css apply.
  if (customization?.bodyFont) {
    tokens['--ws-font-body'] = `"${customization.bodyFont}", ui-sans-serif, system-ui, sans-serif`
  }
  if (customization?.headingFont) {
    tokens['--ws-font-heading'] = `"${customization.headingFont}", ui-serif, Georgia, serif`
  }

  const rawCustomCss = customization?.customCss || ''
  const customCss = rawCustomCss ? sanitizeCss(rawCustomCss) : ''

  return (
    <div data-website="" style={tokens as React.CSSProperties}>
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      )}
      {children}
    </div>
  )
}
