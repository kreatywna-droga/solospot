'use client'
import { Image } from 'lucide-react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'

export function GallerySection({ section, theme }: SectionComponentProps) {
  const config = section.config as { title?: string; images?: string[] }
  const images = config.images?.length ? config.images : Array(4).fill(null)
  return (
    <section className="py-16 lg:py-24 px-4" style={{ backgroundColor: '#f8fafc', fontFamily: theme.font }}>
      <div className="max-w-7xl mx-auto">
        {config.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ color: theme.primaryColor }}>{config.title}</h2>}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden">
              {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <Image className="w-8 h-8 text-slate-400" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
