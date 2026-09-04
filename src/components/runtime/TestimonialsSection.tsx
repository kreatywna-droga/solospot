'use client'
import { Star } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

const defaultReviews = [
  { name: 'Anna K.', text: 'Najlepszy sklep w sieci! Szybka dostawa i świetna jakość.', rating: 5 },
  { name: 'Michał W.', text: 'Profesjonalna obsługa i piękny asortyment. Polecam!', rating: 5 },
  { name: 'Katarzyna L.', text: 'Produkty zgodne z opisem. Na pewno wrócę.', rating: 4 },
]

export function TestimonialsSection({ section, theme }: SectionComponentProps) {
  const config = ((section?.config || (section as any)?.props) ?? {}) as {
    title?: string
    background?: string
    reviews?: Array<{ name: string; text: string; rating?: number }>
  }
  const reviews = config.reviews && config.reviews.length > 0 ? config.reviews : defaultReviews
  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: config.background || 'transparent', fontFamily: theme.font }}>
      <div className="max-w-4xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.primaryColor }}>{config.title}</h2>}
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="p-6 rounded-2xl border" style={{ borderColor: `${theme.primaryColor}20` }}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-4 h-4" fill={j < (r.rating ?? 5) ? theme.secondaryColor : 'none'} color={j < (r.rating ?? 5) ? theme.secondaryColor : '#d1d5db'} />
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-4">&ldquo;{r.text}&rdquo;</p>
              <p className="font-semibold text-sm" style={{ color: theme.primaryColor }}>{r.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
