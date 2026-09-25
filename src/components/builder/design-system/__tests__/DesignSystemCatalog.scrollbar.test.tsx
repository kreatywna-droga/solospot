// @vitest-environment jsdom
/**
 * SCROLLBAR CONSISTENCY REPAIR GATE v1.0 — Design System → Katalog.
 *
 * The Katalog list container (`ds-catalog-list`) had a bare `overflow-y-auto`
 * and therefore rendered the OS default (thick) scrollbar, while every other
 * SoloSpot panel (Inspector, Contextual, AI workspace, canvas) uses the shared
 * `.builder-canvas-scrollbar` class from `src/app/globals.css`
 * (6px webkit scrollbar, transparent track, thumb rgba(255,255,255,0.22) →
 * hover 0.38, `scrollbar-width: thin` + `scrollbar-color` for Firefox).
 *
 * Repair = ONE class added to the existing container. No new scrollbar
 * system, no layout/card/filter changes, no color changes beyond the bar.
 * These tests pin: (1) the class is applied at runtime, (2) the mechanism is
 * the pre-existing globals.css definition with the panel introducing no CSS
 * of its own, (3) other panels keep using the same class (visual identity),
 * (4) the scroll container/layout classes are unchanged.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DesignSystemCatalog } from '../DesignSystemCatalog'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../state/BuilderProvider', () => ({
  useBuilder: () => ({
    dispatch: vi.fn(),
    document: {
      theme: {
        primaryColor: '#D9A86C',
        secondaryColor: '#F2C27F',
        backgroundColor: '#090910',
        font: 'Inter',
        appliedStylePackId: null,
        tokens: {},
      },
      pages: [{ id: 'page-1', slug: '/', name: 'Home', sections: [] }],
    },
  }),
}))

afterEach(cleanup)

const CATALOG_SRC = readFileSync(join(__dirname, '..', 'DesignSystemCatalog.tsx'), 'utf8')
const GLOBALS_CSS = readFileSync(join(__dirname, '..', '..', '..', '..', 'app', 'globals.css'), 'utf8')
const PANEL_SOURCES = [
  'inspector/PhaseThreeInspector.tsx',
  'contextual/ContextualSettingsPanel.tsx',
  'ai/AiCopilotWorkspace.tsx',
].map((p) => ({
  p,
  src: readFileSync(join(__dirname, '..', '..', p), 'utf8'),
}))

describe('Design System → Katalog scrollbar = shared slim scrollbar', () => {
  it('1. runtime: ds-catalog-list container carries builder-canvas-scrollbar', () => {
    const { container } = render(<DesignSystemCatalog />)
    const list = container.querySelector('[data-testid="ds-catalog-list"]')
    expect(list).not.toBeNull()
    expect(list!.classList.contains('builder-canvas-scrollbar')).toBe(true)
    // scrolling behavior preserved
    expect(list!.classList.contains('overflow-y-auto')).toBe(true)
    expect(list!.classList.contains('flex-1')).toBe(true)
  })

  it('2. mechanism: uses the PRE-EXISTING globals.css definition (6px slim bar)', () => {
    expect(GLOBALS_CSS).toMatch(/\.builder-canvas-scrollbar::-webkit-scrollbar\s*\{\s*width:\s*6px/)
    expect(GLOBALS_CSS).toMatch(/\.builder-canvas-scrollbar::-webkit-scrollbar-track\s*\{\s*background:\s*transparent/)
    expect(GLOBALS_CSS).toMatch(/\.builder-canvas-scrollbar::-webkit-scrollbar-thumb\s*\{\s*background:\s*rgba\(255, 255, 255, 0\.22\)/)
    expect(GLOBALS_CSS).toMatch(/\.builder-canvas-scrollbar::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*rgba\(255, 255, 255, 0\.38\)/)
    expect(GLOBALS_CSS).toMatch(/\.builder-canvas-scrollbar\s*\{\s*scrollbar-width:\s*thin/)
  })

  it('3. contract: panel introduces NO second scrollbar system (class-only change)', () => {
    expect(CATALOG_SRC).not.toContain('::-webkit-scrollbar')
    expect(CATALOG_SRC).not.toMatch(/scrollbar-width|scrollbar-color/)
    expect(CATALOG_SRC).not.toContain('.no-scrollbar')
    // the fix itself is present exactly once on the list container
    const listLines = CATALOG_SRC.split('\n').filter((l) => l.includes('ds-catalog-list'))
    expect(listLines).toHaveLength(1)
    expect(listLines[0]).toContain('builder-canvas-scrollbar')
  })

  it('4. identity: all other panels use the SAME class (visual consistency by construction)', () => {
    for (const { p, src } of PANEL_SOURCES) {
      expect(src, `${p} must use builder-canvas-scrollbar`).toContain('builder-canvas-scrollbar')
    }
    // ...and no other custom scrollbar mechanism exists outside globals.css
    for (const { p, src } of PANEL_SOURCES) {
      expect(src, `${p} must not define its own scrollbar CSS`).not.toContain('::-webkit-scrollbar')
    }
  })
})
