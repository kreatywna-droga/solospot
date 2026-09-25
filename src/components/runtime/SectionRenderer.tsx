'use client'
import React from 'react'
import type { SectionComponentProps, RuntimeSection } from '@/lib/runtime/RuntimeTypes'
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
import { ContainerSection } from './ContainerSection'
import { ExperienceRuntimeScene } from '@/components/builder/experience/ExperienceRuntimeScene'

export function BaseSection({ section, children }: SectionComponentProps & { children?: React.ReactNode }) {
  const config = ((section?.config || (section as any)?.props) ?? {}) as {
    background?: string
    padding?: string
    minHeight?: string
    maxWidth?: string
  }
  const paddingMap: Record<string, string> = {
    none: '0',
    sm: '24px 16px',
    md: '48px 24px',
    lg: '80px 32px',
    xl: '120px 32px',
  }
  const padding = paddingMap[config.padding ?? 'md'] ?? (config.padding || '48px 24px')
  return (
    <section
      className="w-full relative transition-all"
      style={{
        backgroundColor: config.background || 'transparent',
        minHeight: config.minHeight && config.minHeight !== 'auto' ? config.minHeight : '80px',
        padding,
      }}
    >
      <div style={{ maxWidth: config.maxWidth || '1280px', margin: '0 auto', width: '100%' }}>
        {children}
      </div>
    </section>
  )
}

const registry: Record<string, React.FC<SectionComponentProps>> = {
  section: BaseSection as React.FC<SectionComponentProps>,
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
  container: ContainerSection,
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
// P0 GATE — section transform parity (live site == builder canvas)
//
// The builder persists node position in `styles.translateX/Y/rotate/scale`
// (base = DESKTOP) plus `responsive.tablet/mobile` overrides (cascade:
// TABLET = base+tablet, MOBILE = base+tablet+mobile — mirrors
// BuilderCanvas.resolveEffectiveStyles). This helper renders the exact same
// cascade on the live site via media queries. Sections without transform
// styles render completely unchanged (zero DOM delta).
// ---------------------------------------------------------------------------

function cssLength(value: unknown): string {
  if (value === undefined || value === null || value === '') return '0px'
  return typeof value === 'number' ? `${value}px` : String(value)
}

export function sectionTransform(styles: Record<string, any> | undefined): string | undefined {
  if (!styles) return undefined
  const parts: string[] = []
  if (styles.translateX || styles.translateY) {
    parts.push(`translate(${cssLength(styles.translateX || '0px')}, ${cssLength(styles.translateY || '0px')})`)
  }
  if (styles.rotate !== undefined && styles.rotate !== 0) {
    parts.push(`rotate(${styles.rotate}deg)`)
  }
  if (styles.scale !== undefined && styles.scale !== 1) {
    parts.push(`scale(${styles.scale})`)
  }
  if (styles.transform) {
    parts.push(String(styles.transform))
  }
  return parts.length > 0 ? parts.join(' ') : undefined
}

// Breakpoints mirror the builder's viewport presets (DESKTOP 1280 / TABLET 768 /
// MOBILE 375): <=1024 receives TABLET overrides, <=640 additionally MOBILE.
const TABLET_MAX_WIDTH = 1024
const MOBILE_MAX_WIDTH = 640

function applySectionTransform(section: RuntimeSection, node: React.ReactNode): React.ReactNode {
  const baseStyles = (section.styles || undefined) as Record<string, any> | undefined
  const resp = (section.responsive || undefined) as Record<string, any> | undefined
  const baseT = sectionTransform(baseStyles)
  const tabT = resp?.tablet ? sectionTransform({ ...baseStyles, ...resp.tablet }) : undefined
  const mobT = resp?.mobile ? sectionTransform({ ...baseStyles, ...resp.tablet, ...resp.mobile }) : undefined
  if (!baseT && !tabT && !mobT) return node

  const hasMedia = Boolean((resp?.tablet && tabT) || (resp?.mobile && mobT))
  if (!hasMedia) {
    if (!baseT) return node
    return <div style={{ transform: baseT }}>{node}</div>
  }

  const anchor = `sst-${String(section.id).replace(/[^a-zA-Z0-9_-]/g, '_')}`
  const rules: string[] = []
  if (baseT) rules.push(`#${anchor}{transform:${baseT}}`)
  if (resp?.tablet && tabT) rules.push(`@media (max-width:${TABLET_MAX_WIDTH}px){#${anchor}{transform:${tabT}}}`)
  if (resp?.mobile && mobT) rules.push(`@media (max-width:${MOBILE_MAX_WIDTH}px){#${anchor}{transform:${mobT}}}`)
  return (
    <div id={anchor}>
      <style dangerouslySetInnerHTML={{ __html: rules.join('') }} />
      {node}
    </div>
  )
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

  const videoSrc = rawConfig.backgroundVideo || rawConfig.backgroundVideoUrl || rawConfig.videoSrc || ''
  const overlayOpacity = parseFloat(String(rawConfig.overlayOpacity ?? '0'))

  const content = videoSrc ? (
    <div className="relative w-full">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          src={String(videoSrc)}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {overlayOpacity > 0 && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: String(rawConfig.overlayColor || '#000000'),
              opacity: overlayOpacity,
            }}
          />
        )}
      </div>
      <div className="relative z-10">
        <Component {...normalizedProps} />
      </div>
    </div>
  ) : (
    <Component {...normalizedProps} />
  );

  return applySectionTransform(
    props.section,
    <SectionErrorBoundary type={props.section.type}>
      <div>
        {rawConfig.experienceConfig ? (
          <ExperienceRuntimeScene
            config={rawConfig.experienceConfig}
            isPlaying={true}
            isInteractive={true}
          >
            {content}
          </ExperienceRuntimeScene>
        ) : (
          content
        )}
      </div>
    </SectionErrorBoundary>
  );
}
