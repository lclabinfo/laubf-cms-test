import { getThemeWithCustomization } from '@/lib/dal/theme'

interface CustomFontDescriptor {
  family: string
  url: string
  weight?: string
  style?: string
}

interface TokenOverrides {
  customFonts?: CustomFontDescriptor[]
  [key: string]: unknown
}

export async function FontLoader({ churchId }: { churchId: string }) {
  const theme = await getThemeWithCustomization(churchId)
  if (!theme) return null

  const headingFont = theme.headingFont
  const bodyFont = theme.bodyFont
  const overrides = (theme.tokenOverrides ?? {}) as TokenOverrides
  const customFonts = overrides.customFonts ?? []

  // Determine which fonts are custom (have a URL defined)
  const customFamilies = new Set(customFonts.map((f) => f.family))

  // Collect Google Fonts (standard fonts without a custom URL)
  const googleFonts: string[] = []
  if (headingFont && !customFamilies.has(headingFont)) {
    googleFonts.push(headingFont)
  }
  if (bodyFont && bodyFont !== headingFont && !customFamilies.has(bodyFont)) {
    googleFonts.push(bodyFont)
  }

  const googleFontsUrl =
    googleFonts.length > 0
      ? `https://fonts.googleapis.com/css2?${googleFonts
          .map(
            (f) =>
              `family=${encodeURIComponent(f)}:wght@400;500;600;700`,
          )
          .join('&')}&display=swap`
      : null

  // Build @font-face declarations for self-hosted / custom fonts
  const fontFaceCss = customFonts
    .map(
      (f) =>
        `@font-face {
  font-family: '${f.family}';
  src: url('${f.url}') format('woff2');
  font-weight: ${f.weight ?? '400'};
  font-style: ${f.style ?? 'normal'};
  font-display: swap;
}`,
    )
    .join('\n')

  return (
    <>
      {googleFontsUrl && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={googleFontsUrl} />
      )}
      {fontFaceCss && (
        <style dangerouslySetInnerHTML={{ __html: fontFaceCss }} />
      )}
    </>
  )
}
