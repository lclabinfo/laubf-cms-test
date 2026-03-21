import type { ColorScheme, PaddingSize, ContainerWidth } from '@/lib/db/types'
import { SectionThemeContext, themeTokens, type SectionTheme } from '@/components/website/shared/theme-tokens'
import { cn } from '@/lib/utils'

const paddingYMap: Record<PaddingSize, string> = {
  NONE: 'py-0',
  COMPACT: 'py-16 lg:py-20',
  DEFAULT: 'py-24 lg:py-30',
  SPACIOUS: 'py-32 lg:py-40',
}

const colorSchemeToTheme: Record<ColorScheme, SectionTheme> = {
  LIGHT: 'light',
  DARK: 'dark',
  BRAND: 'brand',
  MUTED: 'muted',
}

interface SectionWrapperProps {
  colorScheme: ColorScheme
  paddingY: PaddingSize
  containerWidth: ContainerWidth
  visible: boolean
  enableAnimations: boolean
  children: React.ReactNode
  className?: string
  noContainer?: boolean
}

export function SectionWrapper({
  colorScheme,
  paddingY,
  containerWidth,
  visible,
  children,
  className,
  noContainer,
}: SectionWrapperProps) {
  if (!visible) return null

  const theme = colorSchemeToTheme[colorScheme]
  const bgClass = themeTokens[theme].bg
  const paddingClass = paddingYMap[paddingY]

  const containerClass =
    containerWidth === 'NARROW'
      ? 'container-narrow'
      : containerWidth === 'FULL'
        ? 'w-full'
        : 'container-standard'

  return (
    <SectionThemeContext.Provider value={theme}>
      <section className={cn(bgClass, paddingClass, className)}>
        {noContainer ? (
          children
        ) : (
          <div className={containerClass}>
            {children}
          </div>
        )}
      </section>
    </SectionThemeContext.Provider>
  )
}
