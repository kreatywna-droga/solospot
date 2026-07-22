'use client'

import { useState } from 'react'
import type { SectionComponentProps } from '@/lib/store-runtime/types'

export function NewsletterSection({ section, theme }: SectionComponentProps) {
  const [email, setEmail] = useState('')
  const config = section.config as { title?: string; cta?: string }

  return (
    <section className="py-16 lg:py-24 px-4" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.secondaryColor}15)`, fontFamily: theme.font }}>
      <div className="max-w-xl mx-auto text-center">
        {config.title && (
          <h2 className="text-3xl font-bold mb-4" style={{ color: theme.primaryColor }}>
            {config.title}
          </h2>
        )}
        <p className="text-slate-500 mb-6">Bądź na bieżąco z nowościami i promocjami.</p>
        <div className="flex gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Twój email"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': theme.primaryColor } as React.CSSProperties}
          />
          <button
            className="px-6 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.secondaryColor }}
          >
            {config.cta || 'Zapisz się'}
          </button>
        </div>
      </div>
    </section>
  )
}
