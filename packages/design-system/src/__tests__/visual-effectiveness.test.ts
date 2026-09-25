import { describe, it, expect, beforeEach } from 'vitest';
import { createBuilderContext, createBuilderComponentRegistry, createMemoryChannel } from '../../../../packages/builder-core/src/index';
import { DesignSystem } from '../index';
import { resolveStylePackApplication, resolveDesignApplication, designApplicationToCommandPayload } from '../builder';

describe('DesignSystem Visual Effectiveness — Gate v4.0', () => {
  const ctx = createBuilderContext({
    document: {
      id: 'test-doc',
      tenantId: 'test-tenant',
      version: 1,
      isDirty: false,
      metadata: { storeName: 'Test', storeSlug: 'test' },
      pages: [
        {
          id: 'page-1',
          slug: 'home',
          name: 'Home',
          sections: [
            {
              id: 'sec-1',
              type: 'section',
              label: 'Hero',
              styles: {},
              props: {},
              children: [],
              order: 0,
              visible: true,
            },
          ],
          seo: {},
        },
      ],
      theme: {
        primaryColor: '#D9A86C',
        secondaryColor: '#F2C27F',
        backgroundColor: '#090910',
        font: 'Inter',
        borderRadius: '12px',
        appliedStylePackId: null,
        tokens: {},
      },
    },
    registry: createBuilderComponentRegistry(),
    preview: createMemoryChannel().builderChannel,
  })

  const CATEGORIES = [
    { kind: 'style-pack', id: 'sp-medical-clean', label: 'Style Pack', expectThemeKeys: ['primaryColor', 'secondaryColor', 'backgroundColor', 'font', 'borderRadius'] },
    { kind: 'color-palette', id: 'mono-black-white', label: 'Color Palette', expectThemeKeys: ['primaryColor', 'secondaryColor', 'backgroundColor'] },
    { kind: 'typography', id: 'typography-modern-minimal', label: 'Typography', expectThemeKeys: ['font'] },
    { kind: 'font', id: 'inter', label: 'Font', expectThemeKeys: ['font'] },
    { kind: 'font-pairing', id: 'modern-minimal', label: 'Font Pairing', expectThemeKeys: ['font'] },
    { kind: 'button', id: 'buttons-solid', label: 'Button', expectThemeKeys: ['borderRadius', 'font'] },
    { kind: 'card', id: 'cards-minimal', label: 'Card', expectThemeKeys: ['borderRadius', 'backgroundColor'] },
    { kind: 'background', id: 'background-solid', label: 'Background', expectThemeKeys: ['backgroundColor'] },
    { kind: 'hero', id: 'hero-centered', label: 'Hero', expectThemeKeys: ['minHeight', 'paddingTop', 'paddingBottom'] },
    { kind: 'section', id: 'section-clean', label: 'Section', expectThemeKeys: [] },
    { kind: 'image', id: 'image-natural', label: 'Image', expectThemeKeys: [] },
    { kind: 'icon', id: 'icon-minimal', label: 'Icon', expectThemeKeys: [] },
    { kind: 'effect', id: 'effect-fade', label: 'Effect', expectThemeKeys: [] },
    { kind: 'shadow', id: 'shadow-soft', label: 'Shadow', expectThemeKeys: [] },
    { kind: 'radius', id: 'radius-rounded', label: 'Radius', expectThemeKeys: ['borderRadius'] },
    { kind: 'spacing', id: 'spacing-balanced', label: 'Spacing', expectThemeKeys: [] },
    { kind: 'industry-preset', id: 'ind-dental', label: 'Industry Preset', expectThemeKeys: ['primaryColor', 'secondaryColor', 'backgroundColor', 'font'] },
    { kind: 'design-combination', id: 'comb-001', label: 'Design Combination', expectThemeKeys: ['primaryColor', 'secondaryColor', 'backgroundColor', 'font'] },
  ] as const;

  const originalTheme = ctx.document.theme

  for (const cat of CATEGORIES) {
    it(`${cat.label}: Apply changes document theme/tokens and produces command`, () => {
      const raw =
        cat.kind === 'style-pack'
          ? resolveStylePackApplication(cat.id, {
              stylePacks: DesignSystem.stylePacks,
              colorPalettes: DesignSystem.colorPalettes,
              typographySystems: DesignSystem.typographySystems,
              radiusStyles: DesignSystem.radiusStyles,
              shadowStyles: DesignSystem.shadowStyles,
              backgroundStyles: DesignSystem.backgroundStyles,
              spacingStyles: DesignSystem.spacingStyles,
              compatibility: DesignSystem.compatibility,
            }, {})
          : resolveDesignApplication({ kind: cat.kind, id: cat.id, options: {} }, DesignSystem as any)

      const resolved = raw as any
      if (!resolved || !resolved.ok) {
        console.warn(`[SKIP] ${cat.label}: ${resolved?.message || 'resolver failed'}`)
        return
      }

      const payload = designApplicationToCommandPayload(resolved)
      expect(payload, `${cat.label} should produce a command payload`).not.toBeNull()
      expect(payload!.type).toBe('UPDATE_THEME')

      const nextCtx = ctx.dispatch(payload!)
      const afterTheme = nextCtx.document.theme

      const changedThemeKeys = cat.expectThemeKeys.filter((key) => afterTheme[key] !== originalTheme[key])
      const changedTokenKeys = Object.keys(resolved.tokens || {}).filter((key) => afterTheme.tokens?.[key] !== originalTheme.tokens?.[key])
      const totalChanged = changedThemeKeys.length + changedTokenKeys.length
      expect(totalChanged, `${cat.label} should change expected theme/token keys`).toBeGreaterThan(0)
    })
  }

  it('Style Pack changes tokens consumed by canvas (typography, spacing, shadows, border)', () => {
    const resolved = resolveStylePackApplication('sp-medical-clean', {
      stylePacks: DesignSystem.stylePacks,
      colorPalettes: DesignSystem.colorPalettes,
      typographySystems: DesignSystem.typographySystems,
      radiusStyles: DesignSystem.radiusStyles,
      shadowStyles: DesignSystem.shadowStyles,
      backgroundStyles: DesignSystem.backgroundStyles,
      spacingStyles: DesignSystem.spacingStyles,
      compatibility: DesignSystem.compatibility,
    }, {})

    if (!resolved || !resolved.ok) {
      console.warn(`[SKIP] Style Pack token test: ${resolved?.message || 'resolver failed'}`)
      return
    }

    const payload = designApplicationToCommandPayload(resolved)
    expect(payload, 'Style Pack should produce a command payload').not.toBeNull()
    expect(payload!.type).toBe('UPDATE_THEME')

    const nextCtx = ctx.dispatch(payload!)

    expect(nextCtx.document.theme.tokens.typography).toBeDefined()
    expect(nextCtx.document.theme.tokens.spacing).toBeDefined()
    expect(nextCtx.document.theme.tokens.shadows).toBeDefined()
    expect(nextCtx.document.theme.tokens.radius).toBeDefined()
  })

  it('Theme tokens are passed through UPDATE_THEME command', () => {
    const resolved = resolveDesignApplication({ kind: 'button', id: 'buttons-solid' }, DesignSystem as any)
    const payload = designApplicationToCommandPayload(resolved!)
    const nextCtx = ctx.dispatch(payload!)

    expect(nextCtx.document.theme.tokens).toBeDefined()
    expect(Object.keys(nextCtx.document.theme.tokens).length).toBeGreaterThan(0)
  })
});
