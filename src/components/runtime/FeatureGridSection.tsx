'use client'
import { Sparkles, Shield, Truck, Headphones } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="w-8 h-8" />,
  shield: <Shield className="w-8 h-8" />,
  truck: <Truck className="w-8 h-8" />,
  headphones: <Headphones className="w-8 h-8" />,
}

const defaultFeatures = [
  { icon: 'sparkles', title: 'Wysoka jakość', desc: 'Starannie wybrane produkty od sprawdzonych dostawców.' },
  { icon: 'shield', title: 'Bezpieczne zakupy', desc: 'SSL, szyfrowanie danych i bezpieczne płatności.' },
  { icon: 'truck', title: 'Szybka dostawa', desc: 'Wysyłka w 24h. Darmowa od 200 zł.' },
  { icon: 'headphones', title: 'Wsparcie 24/7', desc: 'Pomoc techniczna i obsługa klienta przez całą dobę.' },
]

export function FeatureGridSection({ section, theme }: SectionComponentProps) {
  const config = section.config as { title?: string; features?: Array<{ icon?: string; title: string; desc: string }> }
  const features = config.features || defaultFeatures

  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: '#f8fafc', fontFamily: theme.font }}>
      <div className="max-w-7xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.primaryColor }}>{config.title}</h2>}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${theme.primaryColor}15`, color: theme.primaryColor }}>
                {f.icon ? iconMap[f.icon] || <Sparkles className="w-8 h-8" /> : <Sparkles className="w-8 h-8" />}
              </div>
              <h3 className="font-bold mb-2" style={{ color: theme.primaryColor }}>{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
