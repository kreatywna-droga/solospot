'use client'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function ContentSection({ section, theme }: SectionComponentProps) {
  const config = section.config as { title?: string; body?: string }
  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: '#ffffff', fontFamily: theme.font }}>
      <div className="max-w-3xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold mb-6" style={{ color: theme.primaryColor }}>{config.title}</h2>}
        {config.body && <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">{config.body}</div>}
      </div>
    </section>
  )
}
