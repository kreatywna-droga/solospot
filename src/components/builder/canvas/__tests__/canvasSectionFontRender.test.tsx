// @vitest-environment jsdom
/**
 * FONT CHANGE REAL EXECUTION GATE v1.0 — behavioral canvas regression.
 *
 * FIRST BREAK (production, scratch/font-gate-hero-before.json): set_node_styles
 * wrote styles.fontFamily = "Playfair Display" into the hero section's
 * BuilderDocument while the canvas kept rendering the old theme font, because
 * BuilderCanvas passed only document.theme.font into SectionRenderer.
 *
 * This test renders the REAL BuilderCanvas inside BuilderProvider and asserts
 * the hero <section> (whose headline inherits font-family) carries the
 * node-level font. It fails on the pre-fix code (theme-only font).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { BuilderProvider } from '../../state/BuilderProvider'
import { BuilderCanvas } from '../BuilderCanvas'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// jsdom gaps used by BuilderCanvas measuring code
if (typeof (globalThis as any).ResizeObserver === 'undefined') {
  ;(globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (typeof (globalThis as any).matchMedia === 'undefined') {
  ;(globalThis as any).matchMedia = (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  })
}

afterEach(cleanup)

const doc: any = {
  id: 's-demo',
  metadata: { storeName: 'SoloSpot', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#7c3aed', secondaryColor: '#f1f5f9', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [
    {
      id: 'page-home',
      name: 'Strona',
      slug: '/',
      sections: [
        {
          id: 'sec-hero-init',
          type: 'hero',
          label: 'Hero',
          parentId: null,
          // node-level fontFamily — written by set_node_styles (FONT GATE v1)
          props: { title: 'Naglowek headline' },
          styles: { fontFamily: 'Playfair Display' },
          responsive: {},
          visible: true,
          locked: false,
          order: 0,
          children: [],
        },
      ],
    },
  ],
}

describe('BuilderCanvas renders node-level section fontFamily', () => {
  it('hero headline container carries styles.fontFamily (not only theme.font)', async () => {
    const { container } = render(
      <BuilderProvider document={doc}>
        <BuilderCanvas />
      </BuilderProvider>
    )

    const hero = container.querySelector('[data-section-id="sec-hero-init"]')
    expect(hero).not.toBeNull()

    // HeroSection's own <section> is the headline container (h1 inherits it).
    const runtimeSection = hero!.querySelector('section')
    expect(runtimeSection).not.toBeNull()
    // Rendered value is a safe stack ("Playfair Display", serif) to avoid the
    // FOUT flash; assert the requested family leads the stack.
    const font = (runtimeSection as HTMLElement).style.fontFamily.replace(/"/g, '')
    expect(font.startsWith('Playfair Display')).toBe(true)
    expect(font).toContain('serif')
  })

  it('node-declared font reaches the section even when it equals theme.font (no revert)', async () => {
    // After a font apply, the node declares fontFamily === theme.font. FONT GATE
    // must still forward it so sections that ignore the global default keep the
    // applied font instead of reverting to a stale baked one.
    const equalDoc: any = JSON.parse(JSON.stringify(doc))
    equalDoc.theme.font = 'Playfair Display'
    equalDoc.pages[0].sections[0].styles.fontFamily = 'Playfair Display'

    const { container } = render(
      <BuilderProvider document={equalDoc}>
        <BuilderCanvas />
      </BuilderProvider>
    )
    const hero = container.querySelector('[data-section-id="sec-hero-init"]')
    const runtimeSection = hero!.querySelector('section')
    const font = (runtimeSection as HTMLElement).style.fontFamily.replace(/"/g, '')
    expect(font.startsWith('Playfair Display')).toBe(true)
  })
})
