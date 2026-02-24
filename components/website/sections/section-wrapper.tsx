import type { ColorScheme, PaddingSize, ContainerWidth } from '@/lib/db/types'
import { cn } from '@/lib/utils'

const paddingYMap: Record<PaddingSize, string> = {
  NONE: 'py-0',
  COMPACT: 'py-16 lg:py-20',
  DEFAULT: 'py-24 lg:py-30',
  SPACIOUS: 'py-32 lg:py-40',
}

const bgMap: Record<ColorScheme, string> = {
  LIGHT: 'bg-white-1',
  DARK: 'bg-black-1',
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

  const bgClass = bgMap[colorScheme]
  const paddingClass = paddingYMap[paddingY]

  const containerClass =
    containerWidth === 'NARROW'
      ? 'container-narrow'
      : containerWidth === 'FULL'
        ? 'w-full'
        : 'container-standard'

  return (
    <section className={cn(bgClass, paddingClass, className)}>
      {noContainer ? (
        children
      ) : (
        <div className={containerClass}>
          {children}
        </div>
      )}
    </section>
  )
}
