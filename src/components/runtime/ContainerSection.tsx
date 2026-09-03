'use client'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function ContainerSection({ section, theme, children }: SectionComponentProps & { children?: React.ReactNode }) {
  const config = ((section?.config || (section as any)?.props) ?? {}) as {
    display?: string
    padding?: string
    gap?: string
    align?: string
    maxWidth?: string
    background?: string
  }

  const paddingMap: Record<string, string> = {
    none: '0',
    sm: '16px',
    md: '32px',
    lg: '48px',
    xl: '64px',
  }
  const padding = paddingMap[config.padding ?? 'md'] ?? '32px'
  const gap = config.gap ?? '16'
  const align = config.align ?? 'stretch'

  const displayStyles: Record<string, React.CSSProperties> = {
    block: { display: 'block' },
    'flex-col': { display: 'flex', flexDirection: 'column', alignItems: align === 'stretch' ? 'stretch' : align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'flex-start' },
    'flex-row': { display: 'flex', flexDirection: 'row', alignItems: align === 'stretch' ? 'stretch' : align === 'center' ? 'center' : align === 'end' ? 'flex-end' : 'flex-start', flexWrap: 'wrap' },
    'grid-2': { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', alignItems: align === 'stretch' ? 'stretch' : align },
    'grid-3': { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', alignItems: align === 'stretch' ? 'stretch' : align },
    'grid-4': { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', alignItems: align === 'stretch' ? 'stretch' : align },
  }

  const layoutStyle: React.CSSProperties = {
    ...displayStyles[config.display ?? 'flex-col'],
    padding,
    gap: `${gap}px`,
    maxWidth: config.maxWidth || '1200px',
    margin: '0 auto',
    backgroundColor: config.background || 'transparent',
    minHeight: '60px',
    width: '100%',
  }

  return (
    <div style={layoutStyle}>
      {children}
    </div>
  )
}
