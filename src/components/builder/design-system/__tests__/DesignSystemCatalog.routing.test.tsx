// @vitest-environment jsdom
/**
 * DesignSystemCatalog tab → content routing regression (SOLESPOT DESIGN SYSTEM
 * TAB CONTENT ROUTING FORENSIC v1.0).
 *
 * Root cause regression: DesignSystem.fonts used to contain 40 duplicate ids
 * (fullFontCatalog = dedup + overlapping additionalFonts). Duplicate ids become
 * duplicate React keys (key={item.id}), so React never deleted those fibers on
 * category switch — 40 stale font items stayed on top of every later category
 * (FONTY → BRANŻE kept showing Inter, Space Grotesk, Outfit, ...).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup, screen } from '@testing-library/react'
import { DesignSystem } from '../../../../../packages/design-system/src/index'
import { DesignSystemCatalog } from '../DesignSystemCatalog'

;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../state/BuilderProvider', () => ({
  useBuilder: () => ({ dispatch: vi.fn() }),
}))

afterEach(cleanup)

const CATS = [
  'style-packs',
  'design-combinations',
  'fonts',
  'font-pairings',
  'typography',
  'colors',
  'color-combinations',
  'buttons',
  'cards',
  'backgrounds',
  'hero',
  'sections',
  'images',
  'icons',
  'effects',
  'shadows',
  'radius',
  'spacing',
  'industry-presets',
  'themes',
] as const

const DATASET: Record<(typeof CATS)[number], { id: string }[]> = {
  'style-packs': DesignSystem.stylePacks as any[],
  'design-combinations': DesignSystem.designCombinations as any[],
  'industry-presets': DesignSystem.industryPresets as any[],
  fonts: DesignSystem.fonts as any[],
  'font-pairings': DesignSystem.fontPairings as any[],
  colors: DesignSystem.colorPalettes as any[],
  'color-combinations': ((DesignSystem as any).colorCombinations || []) as any[],
  typography: DesignSystem.typographySystems as any[],
  buttons: DesignSystem.buttonSystems as any[],
  cards: DesignSystem.cardSystems as any[],
  backgrounds: DesignSystem.backgroundStyles as any[],
  hero: DesignSystem.heroStyles as any[],
  sections: DesignSystem.sectionStyles as any[],
  images: DesignSystem.imageTreatmentStyles as any[],
  icons: DesignSystem.iconStyles as any[],
  effects: DesignSystem.effectStyles as any[],
  shadows: DesignSystem.shadowStyles as any[],
  radius: DesignSystem.radiusStyles as any[],
  spacing: DesignSystem.spacingStyles as any[],
  themes: DesignSystem.designThemes as any[],
}

function renderedIds(container: HTMLElement): string[] {
  return Array.from(
    container.querySelectorAll('[data-testid="ds-catalog-item"]')
  ).map((el) => el.getAttribute('data-item-id') || '')
}

function clickCat(container: HTMLElement, cat: string) {
  fireEvent.click(container.querySelector(`[data-testid="ds-cat-${cat}"]`) as Element)
}

function isSubsequence(sub: string[], full: string[]): boolean {
  let i = 0
  for (const id of sub) {
    while (i < full.length && full[i] !== id) i++
    if (i >= full.length) return false
    i++
  }
  return true
}

describe('DesignSystemCatalog tab → content routing', () => {
  it('every tab renders exactly its own dataset (tab → category → catalog → render)', () => {
    const { container } = render(<DesignSystemCatalog />)
    for (const cat of CATS) {
      clickCat(container, cat)
      const target = DATASET[cat].map((d) => d.id)
      expect(renderedIds(container), `category ${cat}`).toEqual(target)
      const active = container.querySelector(
        `[data-testid="ds-cat-${cat}"]`
      ) as HTMLElement
      expect(active.className).toContain('bg-[#D9A86C]')
    }
  })

  it('REGRESSION: FONTY → BRANŻE → PALETY leaves no stale font items (recording repro)', () => {
    const { container } = render(<DesignSystemCatalog />)
    clickCat(container, 'fonts')
    const fontIds = renderedIds(container)
    expect(fontIds).toEqual(DATASET.fonts.map((d) => d.id))

    clickCat(container, 'industry-presets')
    const industryIds = renderedIds(container)
    expect(industryIds).toEqual(DATASET['industry-presets'].map((d) => d.id))
    expect(industryIds.some((id) => fontIds.includes(id))).toBe(false)
    expect(industryIds[0]).toMatch(/^ind-/)

    clickCat(container, 'colors')
    const colorIds = renderedIds(container)
    expect(colorIds).toEqual(DATASET.colors.map((d) => d.id))
    expect(colorIds.some((id) => fontIds.includes(id))).toBe(false)
  })

  it('search applies to the NEW dataset after switching (fonts + "Inter" → BRANŻE)', () => {
    const { container } = render(<DesignSystemCatalog />)
    clickCat(container, 'fonts')
    const input = container.querySelector(
      '[data-testid="ds-search-input"]'
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Inter' } })
    const filteredFonts = renderedIds(container)
    expect(filteredFonts.length).toBeGreaterThan(0)
    expect(filteredFonts.length).toBeLessThan(DATASET.fonts.length)
    expect(filteredFonts[0]).toBe('inter')

    clickCat(container, 'industry-presets')
    const after = renderedIds(container)
    expect(after.some((id) => filteredFonts.includes(id))).toBe(false)
    expect(isSubsequence(after, DATASET['industry-presets'].map((d) => d.id))).toBe(
      true
    )

    fireEvent.change(input, { target: { value: '' } })
    expect(renderedIds(container)).toEqual(
      DATASET['industry-presets'].map((d) => d.id)
    )
  })

  it('industry filter does not pin the list to the previous category', () => {
    const { container } = render(<DesignSystemCatalog />)
    fireEvent.click(container.querySelector('[data-testid="ds-filters-toggle"]') as Element)
    const select = container.querySelector(
      '[data-testid="ds-filter-industry"]'
    ) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'dental' } })
    const filteredPacks = renderedIds(container)
    expect(filteredPacks.length).toBeGreaterThan(0)
    expect(isSubsequence(filteredPacks, DATASET['style-packs'].map((d) => d.id))).toBe(
      true
    )

    clickCat(container, 'fonts')
    const fonts = renderedIds(container)
    expect(fonts).toEqual(DATASET.fonts.map((d) => d.id))
    expect(fonts.some((id) => filteredPacks.includes(id))).toBe(false)

    fireEvent.change(select, { target: { value: '' } })
    clickCat(container, 'colors')
    expect(renderedIds(container)).toEqual(DATASET.colors.map((d) => d.id))
  })

  it('preview from one category does not block the next category', () => {
    const { container } = render(<DesignSystemCatalog />)
    clickCat(container, 'style-packs')
    fireEvent.click(container.querySelector('[data-testid="ds-btn-preview"]') as Element)
    expect(container.querySelector('[data-testid="ds-preview-modal"]')).toBeTruthy()
    fireEvent.click(screen.getByText('Zamknij'))
    expect(container.querySelector('[data-testid="ds-preview-modal"]')).toBeNull()

    clickCat(container, 'cards')
    expect(renderedIds(container)).toEqual(DATASET.cards.map((d) => d.id))
  })

  it('rapid switching ×50 keeps tab ↔ content in sync (no stale state, no empty panel)', () => {
    const { container } = render(<DesignSystemCatalog />)
    const order = [
      'fonts',
      'industry-presets',
      'colors',
      'fonts',
      'typography',
      'cards',
      'backgrounds',
      'style-packs',
      'fonts',
    ]
    for (let i = 0; i < 50; i++) {
      const cat = order[i % order.length]
      clickCat(container, cat)
      if (i % 5 === 0 || i === 49) {
        const target = DATASET[cat as (typeof CATS)[number]].map((d) => d.id)
        const rendered = renderedIds(container)
        expect(rendered.length, `iteration ${i} (${cat})`).toBeGreaterThan(0)
        expect(isSubsequence(rendered, target), `iteration ${i} (${cat})`).toBe(true)
        expect(rendered, `iteration ${i} (${cat})`).toEqual(target)
      }
    }
    const lastCat = order[49 % order.length] as (typeof CATS)[number]
    expect(renderedIds(container)).toEqual(DATASET[lastCat].map((d) => d.id))
  })

  it('fonts dataset itself has unique ids (duplicate React keys were the first break)', () => {
    const ids = (DATASET.fonts as { id: string }[]).map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
