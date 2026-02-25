import { getThemeWithCustomization } from '@/lib/dal/theme'

interface ThemeProviderProps {
  churchId: string
  children: React.ReactNode
}

export async function ThemeProvider({ churchId, children }: ThemeProviderProps) {
  const theme = await getThemeWithCustomization(churchId)
  const customization = theme
  const defaultTokens = (theme?.theme?.defaultTokens ?? {}) as Record<string, string>

  // Build token overrides — only set font variables when the database
  // has explicit customization, so that globals.css defaults (Helvetica
  // Neue, DM Serif Display, Strude) are preserved via the @theme block.
  const tokens: Record<string, string> = {
    '--color-primary': customization?.primaryColor || defaultTokens['--color-primary'] || '#1a1a2e',
    '--color-secondary': customization?.secondaryColor || defaultTokens['--color-secondary'] || '#16213e',
    '--color-background': customization?.backgroundColor || defaultTokens['--color-background'] || '#ffffff',
    '--color-text': customization?.textColor || defaultTokens['--color-text'] || '#1a1a1a',
    '--color-heading': customization?.headingColor || defaultTokens['--color-heading'] || '#0a0a0a',
    '--font-size-base': `${customization?.baseFontSize || 16}px`,
    '--border-radius': customization?.borderRadius || defaultTokens['--border-radius'] || '0.5rem',
  }

  // Only override font CSS variables when the database specifies custom
  // fonts — otherwise let the @theme definitions in globals.css apply.
  if (customization?.bodyFont) {
    tokens['--font-sans'] = `"${customization.bodyFont}", ui-sans-serif, system-ui, sans-serif`
  }
  if (customization?.headingFont) {
    tokens['--font-serif'] = `"${customization.headingFont}", ui-serif, Georgia, serif`
    tokens['--font-display'] = `"${customization.headingFont}", ui-serif, Georgia, serif`
  }

  const customCss = customization?.customCss || ''

  return (
    <div style={tokens as React.CSSProperties}>
      {customCss && (
        <style dangerouslySetInnerHTML={{ __html: customCss }} />
      )}
      {children}
    </div>
  )
}
