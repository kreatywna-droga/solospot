'use client'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function ContentSection({ section, theme }: SectionComponentProps) {
  const config = ((section?.config || (section as any)?.props) ?? {}) as {
    title?: string; body?: string
    titleSize?: string; titleWeight?: string; titleColor?: string
    bodySize?: string; bodyColor?: string; background?: string
  }

  const sizeMap: Record<string, string> = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }
  const weightMap: Record<string, string> = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' }
  const bodySizeMap: Record<string, string> = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }

  const titleSize = sizeMap[config.titleSize ?? 'md'] ?? 'text-2xl'
  const titleWeight = weightMap[config.titleWeight ?? 'bold'] ?? 'font-bold'
  const titleColor = config.titleColor || theme.primaryColor
  const bodySize = bodySizeMap[config.bodySize ?? 'md'] ?? 'text-base'
  const bodyColor = config.bodyColor || '#64748b'

  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: config.background || 'transparent', fontFamily: theme.font }}>
      <div className="max-w-3xl mx-auto">
        {config.title && <h2 className={`${titleSize} ${titleWeight} mb-6`} style={{ color: titleColor }}>{config.title}</h2>}
        {config.body && <div className={`${bodySize} leading-relaxed`} style={{ color: bodyColor }}>{config.body}</div>}
      </div>
    </section>
  )
}
