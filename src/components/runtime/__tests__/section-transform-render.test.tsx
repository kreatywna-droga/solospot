/**
 * P0 FOUNDATION GATE — live site renders saved section position (R2).
 *
 * FIRST BREAK (production): the builder persisted styles.translateX/Y but the
 * runtime dropped it at every hop, so the live site rendered sections at
 * their natural position. R2 threads styles/responsive through the runtime
 * chain and applies the SAME cascade the canvas uses
 * (BuilderCanvas.resolveEffectiveStyles):
 *   DESKTOP = base styles, TABLET = base+tablet, MOBILE = base+tablet+mobile
 * via media queries (1024px / 640px — mirrors VIEWPORT_PRESETS 768/375).
 *
 * Sections WITHOUT transform styles must render with zero DOM delta
 * (no wrapper, no <style>) — existing documents stay pixel-identical.
 */
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import { SectionRenderer } from '../SectionRenderer'
import type { RuntimeSection, RuntimeTheme } from '@/lib/runtime/RuntimeTypes'

const theme: RuntimeTheme = {
  primaryColor: '#7c3aed',
  secondaryColor: '#f1f5f9',
  font: 'Inter',
}

const renderSection = (section: Partial<RuntimeSection>): string =>
  renderToString(
    <SectionRenderer
      section={{
        id: 'sec-hero-init',
        type: 'content',
        label: 'Sekcja',
        config: { title: 'Naglowek' },
        ...section,
      }}
      theme={theme}
      storeName="SoloSpot"
      products={[]}
      navigation={[]}
    />
  )

describe('SectionRenderer renders saved section position (styles/responsive)', () => {
  it('1. base transform is applied on the wrapper (desktop = styles)', () => {
    const html = renderSection({
      styles: { translateX: '100px', translateY: '40px' },
    })
    expect(html).toContain('translate(100px, 40px)')
    // no responsive overrides ⇒ no media-query <style> block
    expect(html).not.toContain('@media')
  })

  it('2. responsive overrides render the builder cascade as media queries', () => {
    const html = renderSection({
      styles: { translateX: '100px', translateY: '40px' },
      responsive: {
        tablet: { translateX: '60px', translateY: '0px' },
        mobile: { translateX: '0px', translateY: '-20px' },
      },
    })
    // anchor + scoped stylesheet
    expect(html).toMatch(/id="sst-sec-hero-init"/)
    expect(html).toContain('#sst-sec-hero-init{transform:translate(100px, 40px)}')
    // TABLET cascade = base + tablet (mirror of resolveEffectiveStyles)
    expect(html).toContain(
      '@media (max-width:1024px){#sst-sec-hero-init{transform:translate(60px, 0px)}}'
    )
    // MOBILE cascade = base + tablet + mobile
    expect(html).toContain(
      '@media (max-width:640px){#sst-sec-hero-init{transform:translate(0px, -20px)}}'
    )
  })

  it('3. sections without transform styles render with zero DOM delta', () => {
    const html = renderSection({
      config: { title: 'Naglowek' },
    })
    expect(html).not.toContain('sst-')
    expect(html).not.toContain('@media')
    expect(html).not.toContain('translate(')
    expect(html).toContain('Naglowek')
  })

  it('4. numeric offsets are coerced to px (parity with canvas formatTransform)', () => {
    const html = renderSection({
      styles: { translateX: 64, translateY: 0 },
    })
    expect(html).toContain('translate(64px, 0px)')
  })

  it('5. transform participates with rotate/scale like the canvas engine', () => {
    const html = renderSection({
      styles: { translateX: '10px', rotate: 45, scale: 1.5 },
    })
    expect(html).toContain('translate(10px, 0px) rotate(45deg) scale(1.5)')
  })
})
