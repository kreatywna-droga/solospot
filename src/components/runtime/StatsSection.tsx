'use client'
import { Package, Users, Award, TrendingUp } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

const iconMap: Record<string, React.ReactNode> = {
  package: <Package className="w-8 h-8" />,
  users: <Users className="w-8 h-8" />,
  award: <Award className="w-8 h-8" />,
  trending: <TrendingUp className="w-8 h-8" />,
}

const defaultStats = [
  { icon: 'package', value: '10 000+', label: 'Produktów' },
  { icon: 'users', value: '5 000+', label: 'Klientów' },
  { icon: 'award', value: '15 lat', label: 'Doświadczenia' },
  { icon: 'trending', value: '98%', label: 'Satysfakcji' },
]

export function StatsSection({ section, theme }: SectionComponentProps) {
  const config = section.config as { title?: string; stats?: Array<{ icon?: string; value: string; label: string }> }
  const stats = config.stats || defaultStats

  return (
    <section className="py-16 lg:py-24 px-4" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`, fontFamily: theme.font }}>
      <div className="max-w-7xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold text-center mb-12 text-white">{config.title}</h2>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center text-white">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                {s.icon ? iconMap[s.icon] || <Award className="w-8 h-8" /> : <Award className="w-8 h-8" />}
              </div>
              <div className="text-3xl lg:text-4xl font-black mb-1">{s.value}</div>
              <div className="text-sm text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
