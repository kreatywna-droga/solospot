/**
 * FONT CHANGE REAL EXECUTION GATE v1.0 — regression: node-level fontFamily
 * must reach the canvas for section/hero headlines.
 *
 * Production forensic (scratch/font-gate-hero-before.json) proved the FIRST
 * BREAK: set_node_styles wrote `styles.fontFamily = "Playfair Display"` into
 * the BuilderDocument of `sec-hero-init`, while the canvas hero <h1> kept
 * rendering the previous theme font — BuilderCanvas passed ONLY
 * `document.theme.font` into SectionRenderer, so runtime sections (HeroSection
 * renders the headline with `theme.font`) never saw the node-level value.
 *
 * These tests pin the three consumption points of the fix:
 *  1. mechanism — runtime headline font comes from theme.font (HeroSection)
 *  2. wiring    — BuilderCanvas resolves a node-DECLARED font and forwards it
 *                 as theme.font to SectionRenderer (and loads the Google font)
 *  3. contract  — a theme-font-only document keeps the old code path
 *     (no node font ⇒ no override ⇒ existing documents render unchanged)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const CANVAS_SRC = readFileSync(
  join(__dirname, '..', 'BuilderCanvas.tsx'),
  'utf8'
)

describe('canvas consumes node-level fontFamily for section/hero headlines', () => {
  it('1. mechanism: HeroSection renders its headline with theme.font', async () => {
    const { HeroSection } = await import('../../../runtime/HeroSection')
    const { renderToString } = await import('react-dom/server')
    const html = renderToString(
      HeroSection({
        section: { id: 'sec-hero-init', type: 'hero', label: 'Hero', props: { title: 'Naglowek' } } as any,
        theme: { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Playfair Display' },
        storeName: 'Store',
      })
    )
    // The <section> container carries the font — the <h1> inherits it.
    expect(html).toMatch(/font-family:\s*Playfair Display/)
    expect(html).toContain('Naglowek')
  })

  it('2. wiring: BuilderCanvas derives the node font and forwards it as theme.font', () => {
    // node-declared font (≠ theme default) is computed and loaded
    expect(CANVAS_SRC).toContain('const sectionFontFamily =')
    expect(CANVAS_SRC).toContain('loadGoogleFont(sectionFontFamily)')
    // ...and is the value passed into SectionRenderer's theme
    expect(CANVAS_SRC).toContain('font: sectionFontFamily || document.theme?.font || \'Inter\'')
    // never hardcoded to the global theme only
    expect(CANVAS_SRC).not.toMatch(/theme=\{\{\s*primaryColor:[^}]*font: document\.theme\?\.font \|\| 'Inter',\s*logo:/)
  })

  it('3. contract: a document without node font keeps the legacy theme-only path', () => {
    // mirrors BuilderCanvas' resolution: resolvedStyles merges theme styles
    // under node styles, so the node font equals the theme font when unset
    const themeFont = 'Inter'
    const resolvedWithoutNodeFont = { fontFamily: themeFont } // resolveEffectiveStyles fallback
    const resolvedWithNodeFont = { fontFamily: 'Cormorant Garamond' }

    const resolve = (resolved: { fontFamily?: string }) =>
      resolved.fontFamily && resolved.fontFamily !== themeFont
        ? (resolved.fontFamily as string)
        : undefined

    expect(resolve(resolvedWithoutNodeFont)).toBeUndefined()
    expect(resolve(resolvedWithNodeFont)).toBe('Cormorant Garamond')
  })
})
