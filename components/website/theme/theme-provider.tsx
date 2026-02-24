import { getThemeWithCustomization } from '@/lib/dal/theme'

interface ThemeProviderProps {
  churchId: string
  children: React.ReactNode
}

export async function ThemeProvider({ churchId, children }: ThemeProviderProps) {
  const theme = await getThemeWithCustomization(churchId)
  const customization = theme
  const defaultTokens = (theme?.theme?.defaultTokens ?? {}) as Record<string, string>

  const tokens: Record<string, string> = {
    '--color-primary': customization?.primaryColor || defaultTokens['--color-primary'] || '#1a1a2e',
    '--color-secondary': customization?.secondaryColor || defaultTokens['--color-secondary'] || '#16213e',
    '--color-background': customization?.backgroundColor || defaultTokens['--color-background'] || '#ffffff',
    '--color-text': customization?.textColor || defaultTokens['--color-text'] || '#1a1a1a',
    '--color-heading': customization?.headingColor || defaultTokens['--color-heading'] || '#0a0a0a',
    '--font-heading': customization?.headingFont || defaultTokens['--font-heading'] || 'Inter',
    '--font-body': customization?.bodyFont || defaultTokens['--font-body'] || 'Source Sans Pro',
    '--font-size-base': `${customization?.baseFontSize || 16}px`,
    '--border-radius': customization?.borderRadius || defaultTokens['--border-radius'] || '0.5rem',
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
