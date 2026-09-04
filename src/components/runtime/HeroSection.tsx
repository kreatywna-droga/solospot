'use client'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'
import { resolveImageUrl } from '@/lib/assets/resolveImageUrl'

export function HeroSection({ section, theme, storeName }: SectionComponentProps) {
  const config = ((section?.config || (section as any)?.props) ?? {}) as {
    title?: string; subtitle?: string; cta?: string; image?: unknown
    titleSize?: string; titleWeight?: string; titleAlign?: string; titleColor?: string
  }
  const title = config.title || storeName || 'Witaj w naszym sklepie'
  const imageUrl = resolveImageUrl(config.image)
  const hasImage = Boolean(imageUrl)

  const sizeMap: Record<string, string> = { sm: 'text-2xl', md: 'text-3xl', lg: 'text-4xl', xl: 'text-5xl', '2xl': 'text-6xl' }
  const weightMap: Record<string, string> = { light: 'font-light', normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' }
  const alignMap: Record<string, string> = { left: 'text-left', center: 'text-center', right: 'text-right' }

  const titleSize = sizeMap[config.titleSize ?? 'lg'] ?? 'text-4xl'
  const titleWeight = weightMap[config.titleWeight ?? 'bold'] ?? 'font-bold'
  const titleAlign = alignMap[config.titleAlign ?? 'center'] ?? 'text-center'
  const titleColor = config.titleColor || 'white'

  return (
    <section
      className="relative overflow-hidden py-24 lg:py-32 px-4 text-center"
      style={{
        background: hasImage
          ? `linear-gradient(135deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3)), url("${imageUrl}") center/cover no-repeat`
          : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
        fontFamily: theme.font,
      }}
    >
      {!hasImage && <div className="absolute inset-0 bg-black/20" />}
      <div className="relative max-w-3xl mx-auto">
        <h1 className={`${titleSize} ${titleWeight} ${titleAlign} mb-6 leading-tight`} style={{ color: titleColor }}>{title}</h1>
        {config.subtitle && <p className="text-lg lg:text-xl text-white/80 mb-8 max-w-xl mx-auto">{config.subtitle}</p>}
        {config.cta && <button className="px-8 py-4 rounded-full bg-white text-lg font-bold transition-all hover:scale-105" style={{ color: theme.primaryColor }}>{config.cta}</button>}
      </div>
    </section>
  )
}
