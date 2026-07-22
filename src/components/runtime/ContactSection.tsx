'use client'
import { Phone, MapPin, Clock } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function ContactSection({ section, theme }: SectionComponentProps) {
  const config = section.config as { title?: string; phone?: string; address?: string }
  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: '#f8fafc', fontFamily: theme.font }}>
      <div className="max-w-4xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.primaryColor }}>{config.title}</h2>}
        <div className="grid md:grid-cols-3 gap-6">
          {config.phone && (
            <div className="p-6 text-center rounded-2xl border" style={{ borderColor: `${theme.primaryColor}20` }}>
              <Phone className="w-6 h-6 mx-auto mb-3" style={{ color: theme.secondaryColor }} />
              <p className="text-sm font-medium">{config.phone}</p>
            </div>
          )}
          {config.address && (
            <div className="p-6 text-center rounded-2xl border" style={{ borderColor: `${theme.primaryColor}20` }}>
              <MapPin className="w-6 h-6 mx-auto mb-3" style={{ color: theme.secondaryColor }} />
              <p className="text-sm font-medium">{config.address}</p>
            </div>
          )}
          <div className="p-6 text-center rounded-2xl border" style={{ borderColor: `${theme.primaryColor}20` }}>
            <Clock className="w-6 h-6 mx-auto mb-3" style={{ color: theme.secondaryColor }} />
            <p className="text-sm font-medium">Pn-Pt: 9:00-18:00</p>
          </div>
        </div>
      </div>
    </section>
  )
}
