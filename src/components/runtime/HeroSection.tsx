'use client'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function HeroSection({ section, theme, storeName }: SectionComponentProps) {
  const config = section.config as { title?: string; subtitle?: string; cta?: string; image?: string }
  const title = config.title || storeName
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 px-4 text-center"
      style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, fontFamily: theme.font }}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative max-w-3xl mx-auto">
        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">{title}</h1>
        {config.subtitle && <p className="text-lg lg:text-xl text-white/80 mb-8 max-w-xl mx-auto">{config.subtitle}</p>}
        {config.cta && <button className="px-8 py-4 rounded-full bg-white text-lg font-bold transition-all hover:scale-105" style={{ color: theme.primaryColor }}>{config.cta}</button>}
      </div>
    </section>
  )
}
