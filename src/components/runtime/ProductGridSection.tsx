'use client'
import { Package } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { PLN: 'zł', EUR: '€', USD: '$' }
  return `${(price / 100).toFixed(2)} ${symbols[currency] || currency}`
}

export function ProductGridSection({ section, theme, products }: SectionComponentProps) {
  const config = section.config as { title?: string; count?: number }
  const displayProducts = products?.slice(0, config.count || 8) || []
  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: '#ffffff', fontFamily: theme.font }}>
      <div className="max-w-7xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.primaryColor }}>{config.title}</h2>}
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Package className="w-12 h-12 mb-3" />
            <p className="text-sm">Brak produktów do wyświetlenia</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((p) => (
              <div key={p.id} className="group cursor-pointer">
                <div className="aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-3 flex items-center justify-center">
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package className="w-10 h-10 text-slate-300" />
                  )}
                </div>
                <h3 className="font-medium text-sm lg:text-base" style={{ color: theme.primaryColor }}>{p.name}</h3>
                <p className="font-bold mt-1" style={{ color: theme.secondaryColor }}>{formatPrice(p.price, p.currency)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
