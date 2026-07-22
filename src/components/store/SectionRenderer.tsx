'use client'

import type { SectionComponentProps } from '@/lib/store-runtime/types'
import { HeroSection } from './HeroSection'
import { ProductGridSection } from './ProductGridSection'
import { GallerySection } from './GallerySection'
import { TestimonialsSection } from './TestimonialsSection'
import { NewsletterSection } from './NewsletterSection'
import { FooterSection } from './FooterSection'
import { NavbarSection } from './NavbarSection'
import { ContactSection } from './ContactSection'
import { ContentSection } from './ContentSection'

const registry: Record<string, React.FC<SectionComponentProps>> = {
  hero: HeroSection,
  'product-grid': ProductGridSection,
  gallery: GallerySection,
  testimonials: TestimonialsSection,
  newsletter: NewsletterSection,
  footer: FooterSection,
  navbar: NavbarSection,
  contact: ContactSection,
  'category-grid': ProductGridSection,
  content: ContentSection,
}

export function SectionRenderer(props: SectionComponentProps) {
  const Component = registry[props.section.type]
  if (!Component) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm border border-dashed border-white/10 rounded-lg">
        Nieznana sekcja: <strong>{props.section.type}</strong>
      </div>
    )
  }
  return <Component {...props} />
}
