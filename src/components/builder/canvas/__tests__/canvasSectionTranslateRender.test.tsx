// @vitest-environment jsdom
/**
 * P0 FOUNDATION GATE — section position render regression.
 *
 * FIRST BREAK (production, scratch/p0-responsive-fresh.json): BuilderDocument
 * holds styles.translateX/translateY (drag commits + persistence verified),
 * but the canvas anchor div (`[data-section-id]`) never applied a transform on
 * mount — the offset was only visible through the drag engine's temporary
 * imperative style (BuilderCanvas.tsx:2379) and vanished on viewport remount
 * or reload (hero rendered at natural x=471 instead of x=535).
 *
 * Root cause: the section anchor's style ({opacity}) omitted
 * `formatTransform(resolveEffectiveStyles(...))` — child nodes applied it
 * (formatTransform at their render sites), sections did not.
 *
 * This test renders the REAL BuilderCanvas inside BuilderProvider and asserts
 * the anchor carries the committed transform, incl. responsive breakpoint
 * merge. It fails on the pre-fix code (no transform).
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { BuilderProvider, useBuilder } from '../../state/BuilderProvider'
import { BuilderCanvas } from '../BuilderCanvas'
import { VIEWPORT_PRESETS, ViewportLabel } from '../../../../../packages/builder-core/src/CanvasState'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

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

const baseDoc: any = {
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
          props: { title: 'Naglowek headline' },
          styles: { translateX: '100px', translateY: '40px' },
          responsive: {
            tablet: { translateX: '60px', translateY: '0px' },
          },
          visible: true,
          locked: false,
          order: 0,
          children: [],
        },
      ],
    },
  ],
}

function SetViewport({ label }: { label: ViewportLabel }) {
  const { dispatch } = useBuilder()
  useEffect(() => {
    dispatch({ type: 'CANVAS', action: { type: 'SET_VIEWPORT', viewport: VIEWPORT_PRESETS[label] } } as any)
  }, [dispatch, label])
  return null
}

const anchorTransform = (container: HTMLElement): string => {
  const anchor = container.querySelector('[data-section-id="sec-hero-init"]')
  expect(anchor).not.toBeNull()
  return (anchor as HTMLElement).style.transform
}

describe('BuilderCanvas renders saved section position (styles.translateX/Y)', () => {
  it('anchor carries committed base transform on fresh mount', async () => {
    const { container } = render(
      <BuilderProvider document={baseDoc}>
        <BuilderCanvas />
      </BuilderProvider>
    )

    const anchor = container.querySelector('[data-section-id="sec-hero-init"]')
    expect(anchor).not.toBeNull()

    await waitFor(() => {
      expect(anchorTransform(container)).toContain('translate(100px, 40px)')
    })
  })

  it('anchor transform follows the active breakpoint (responsive.tablet merge)', async () => {
    const { container } = render(
      <BuilderProvider document={baseDoc}>
        <SetViewport label="TABLET" />
        <BuilderCanvas />
      </BuilderProvider>
    )

    await waitFor(() => {
      expect(anchorTransform(container)).toContain('translate(60px, 0px)')
    })
  })
})
