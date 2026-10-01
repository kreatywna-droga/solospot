// @vitest-environment jsdom
/**
 * FONT APPLY SPEED + NO-REVERT regression.
 *
 * Previous bug: BuilderProvider.dispatch awaited loadGoogleFont (a webfont
 * network request) BEFORE mutating the document, so a font change only became
 * visible after the font finished downloading, and the await + view transition
 * produced a visible "change then settle" flicker.
 *
 * Contract now:
 *   - dispatch applies the document mutation SYNCHRONOUSLY (instant); the
 *     webfont loads in the background (display=swap handles the glyph swap).
 *   - the applied font is the NEW value and does not revert on the next render.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { BuilderProvider, useBuilder } from '../BuilderProvider'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// Record how long the font "network" takes; the mutation must not wait for it.
let fontLoadResolved = false
vi.mock('../../../../../packages/builder-core/src/fonts/FontCatalog', () => ({
  loadGoogleFont: () =>
    new Promise<boolean>((resolve) => {
      setTimeout(() => {
        fontLoadResolved = true
        resolve(true)
      }, 10_000) // deliberately slow — a blocking await would hang the change
    }),
  getGoogleFontUrl: () => '',
}))

afterEach(() => {
  cleanup()
  fontLoadResolved = false
})

const makeDoc = (): any => ({
  id: 's-demo',
  tenantId: 't',
  metadata: { storeName: 'S', storeSlug: 's', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#000', secondaryColor: '#fff', font: 'Inter' },
  pages: [
    {
      id: 'p1',
      name: 'Home',
      slug: '/',
      sections: [
        { id: 'hero-1', type: 'hero', label: 'Hero', props: {}, styles: { fontFamily: 'Inter' }, responsive: {}, visible: true, locked: false, order: 0, children: [] },
      ],
    },
  ],
})

let capturedDispatch: any
let capturedFont: () => string
function Probe() {
  const { dispatch, document } = useBuilder()
  capturedDispatch = dispatch
  capturedFont = () => document.theme?.font as string
  return <div data-testid="font">{document.theme?.font}</div>
}

describe('BuilderProvider — font apply is instant and does not revert', () => {
  it('applies the new theme font synchronously without awaiting the webfont', () => {
    const { getByTestId } = render(
      <BuilderProvider document={makeDoc()}>
        <Probe />
      </BuilderProvider>
    )
    expect(getByTestId('font').textContent).toBe('Inter')

    act(() => {
      capturedDispatch({
        type: 'BATCH_EXECUTE',
        commands: [
          { type: 'UPDATE_THEME', theme: { font: 'Playfair Display' } },
          { type: 'SET_NODE_STYLES', nodeId: 'hero-1', pageId: 'p1', styles: { fontFamily: 'Playfair Display' } },
        ],
      })
    })

    // Mutation is visible immediately — BEFORE the (10s) font load resolves.
    expect(fontLoadResolved).toBe(false)
    expect(getByTestId('font').textContent).toBe('Playfair Display')
    expect(capturedFont()).toBe('Playfair Display')
  })

  it('a second render keeps the new font (no revert to the previous value)', () => {
    const { getByTestId, rerender } = render(
      <BuilderProvider document={makeDoc()}>
        <Probe />
      </BuilderProvider>
    )
    act(() => {
      capturedDispatch({ type: 'UPDATE_THEME', theme: { font: 'Lora' } })
    })
    rerender(
      <BuilderProvider document={makeDoc()}>
        <Probe />
      </BuilderProvider>
    )
    // The live context (not the re-passed prop) is the source of truth.
    expect(getByTestId('font').textContent).toBe('Lora')
  })
})
