'use client'
import React from 'react'
import type { SectionComponentProps } from '@/lib/runtime/RuntimeTypes'
import { HeroSection } from './HeroSection'
import { ProductGridSection } from './ProductGridSection'
import { GallerySection } from './GallerySection'
import { TestimonialsSection } from './TestimonialsSection'
import { NewsletterSection } from './NewsletterSection'
import { FooterSection } from './FooterSection'
import { NavbarSection } from './NavbarSection'
import { ContactSection } from './ContactSection'
import { ContentSection } from './ContentSection'
import { FeatureGridSection } from './FeatureGridSection'
import { StatsSection } from './StatsSection'

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
  'feature-grid': FeatureGridSection,
  stats: StatsSection,
}

// ---------------------------------------------------------------------------
// Per-section Error Boundary — prevents one crashing section from killing
// the entire canvas / preview-frame iframe.
// ---------------------------------------------------------------------------

interface SectionErrorBoundaryState { hasError: boolean; error: string }

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

// ---------------------------------------------------------------------------
// SectionRenderer
// ---------------------------------------------------------------------------

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
  const normalizedProps: SectionComponentProps = {
    ...props,
    section: {
      ...props.section,
      config: rawConfig,
    },
    products: props.products ?? [],
    navigation: props.navigation ?? [],
  }

  return (
    <SectionErrorBoundary type={props.section.type}>
      <Component {...normalizedProps} />
    </SectionErrorBoundary>
  )
}
