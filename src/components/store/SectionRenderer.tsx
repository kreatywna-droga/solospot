'use client'

import React from 'react'
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

const DEFAULT_SECTION_CONFIGS: Record<string, Record<string, unknown>> = {
  navbar: { style: 'transparent', sticky: false },
  hero: { title: 'Witaj w naszym sklepie', subtitle: '', cta: '' },
  'product-grid': { title: 'Produkty', count: 8 },
  'category-grid': { title: 'Kategorie' },
  gallery: { title: 'Galeria', images: [] },
  testimonials: { title: 'Opinie klientów' },
  newsletter: { title: 'Zapisz się do newslettera', cta: 'Zapisz się' },
  footer: { text: 'Wszelkie prawa zastrzeżone.' },
  contact: { title: 'Kontakt' },
  content: { title: '', content: '' },
}

interface SectionErrorBoundaryState {
  hasError: boolean
  error: string
}

class SectionErrorBoundary extends React.Component<
  { type: string; children: React.ReactNode },
  SectionErrorBoundaryState
> {
  constructor(props: { type: string; children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(err: Error): SectionErrorBoundaryState {
    return { hasError: true, error: err.message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-8 text-center text-red-400 text-xs border border-dashed border-red-500/30 rounded-lg bg-red-500/5">
          <div className="font-mono font-bold mb-1">{this.props.type}</div>
          <div className="text-red-300/70">{this.state.error}</div>
        </div>
      )
    }
    return this.props.children
  }
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

  const rawConfig = props.section.config ?? (props.section as any).props ?? {}
  const defaults = DEFAULT_SECTION_CONFIGS[props.section.type] ?? {}
  const safeConfig = { ...defaults, ...rawConfig }

  const normalizedProps: SectionComponentProps = {
    ...props,
    section: {
      ...props.section,
      config: safeConfig,
    },
    storeName: props.storeName || 'SoloSpot Store',
    theme: {
      primaryColor: props.theme?.primaryColor || '#7c3aed',
      secondaryColor: props.theme?.secondaryColor || '#ec4899',
      font: props.theme?.font || 'Inter',
      logo: props.theme?.logo,
    },
  }

  return (
    <SectionErrorBoundary type={props.section.type}>
      <Component {...normalizedProps} />
    </SectionErrorBoundary>
  )
}
