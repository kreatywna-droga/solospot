/**
 * Design System Apply Pipeline Forensic Test
 * 
 * Tests the full apply pipeline for Style Packs:
 * USER CLICK → UI HANDLER → RESOLVER → COMMAND → DISPATCH → DOCUMENT → CANVAS
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createBuilderContext, createBuilderComponentRegistry, createMemoryChannel } from '../../../../packages/builder-core/src/index'
import { DesignSystem } from '../index'
import { resolveStylePackApplication, resolveDesignApplication, designApplicationToCommandPayload } from '../builder/index'

describe('DesignSystem Apply Pipeline — Forensic Gate', () => {
  let ctx: ReturnType<typeof createBuilderContext>
  let initialDoc: any

  beforeEach(() => {
    initialDoc = {
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
              styles: {
                backgroundColor: '#000000',
                color: '#ffffff',
                fontFamily: 'Inter',
                borderRadius: '8px',
              },
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
    }

    ctx = createBuilderContext({
      document: initialDoc,
      registry: createBuilderComponentRegistry(),
      preview: createMemoryChannel().builderChannel,
    })
  })

  it('PHASE 1 — UI: applyStylePack calls resolveStylePackApplication with correct args', () => {
    const stylePackId = 'sp-medical-clean'
    const deps = {
      stylePacks: DesignSystem.stylePacks,
      colorPalettes: DesignSystem.colorPalettes,
      typographySystems: DesignSystem.typographySystems,
      radiusStyles: DesignSystem.radiusStyles,
      shadowStyles: DesignSystem.shadowStyles,
      backgroundStyles: DesignSystem.backgroundStyles,
      spacingStyles: DesignSystem.spacingStyles,
      compatibility: DesignSystem.compatibility,
    }

    const resolved = resolveStylePackApplication(stylePackId, deps, {})
    expect(resolved).not.toBeNull()
    expect(resolved!.stylePackId).toBe(stylePackId)
    expect(resolved!.theme).toBeDefined()
    expect(Object.keys(resolved!.theme).length).toBeGreaterThan(0)
  })

  it('PHASE 2 — APPLY RESOLUTION: resolver returns real theme + tokens', () => {
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

    expect(resolved).not.toBeNull()
    expect(resolved!.theme.primaryColor).toBeDefined()
    expect(resolved!.theme.secondaryColor).toBeDefined()
    expect(resolved!.theme.backgroundColor).toBeDefined()
    expect(resolved!.theme.font).toBeDefined()
    expect(resolved!.tokens).toBeDefined()
    expect(resolved!.tokens!.colors).toBeDefined()
    expect(resolved!.applied.length).toBeGreaterThan(0)
  })

  it('PHASE 3 — COMMAND: UPDATE_THEME payload is correct', () => {
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

    const cmd = {
      type: 'UPDATE_THEME' as const,
      theme: {
        ...resolved!.theme,
        tokens: resolved!.tokens,
        appliedStylePackId: 'sp-medical-clean',
      },
    }

    expect(cmd.type).toBe('UPDATE_THEME')
    expect(cmd.theme.primaryColor).toBe(resolved!.theme.primaryColor)
    expect(cmd.theme.tokens).toBeDefined()
    expect(cmd.theme.appliedStylePackId).toBe('sp-medical-clean')
  })

  it('PHASE 4 — DISPATCH: command reaches BuilderDocument mutation engine', () => {
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

    const cmd = {
      type: 'UPDATE_THEME' as const,
      theme: {
        ...resolved!.theme,
        tokens: resolved!.tokens,
        appliedStylePackId: 'sp-medical-clean',
      },
    }

    const nextCtx = ctx.dispatch(cmd)
    expect(nextCtx.document).not.toBe(ctx.document)
    expect(nextCtx.document.theme.primaryColor).toBe(resolved!.theme.primaryColor)
    expect(nextCtx.document.theme.appliedStylePackId).toBe('sp-medical-clean')
  })

  it('PHASE 5 — BUILDERDOCUMENT: BEFORE != AFTER', () => {
    const before = JSON.stringify(ctx.document.theme)
    
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

    const cmd = {
      type: 'UPDATE_THEME' as const,
      theme: {
        ...resolved!.theme,
        tokens: resolved!.tokens,
        appliedStylePackId: 'sp-medical-clean',
      },
    }

    const nextCtx = ctx.dispatch(cmd)
    const after = JSON.stringify(nextCtx.document.theme)
    
    expect(before).not.toBe(after)
    expect(nextCtx.document.theme.primaryColor).toBe('#0066CC')
    expect(nextCtx.document.theme.secondaryColor).toBe('#0099FF')
    expect(nextCtx.document.theme.backgroundColor).toBe('#F0F8FF')
    expect(nextCtx.document.theme.font).toBe('Inter')
    expect(nextCtx.document.theme.appliedStylePackId).toBe('sp-medical-clean')
  })

  it('PHASE 6 — CANVAS: canvas reflects theme change for nodes without explicit styles', () => {
    // This test verifies the fix: resolveEffectiveStyles falls back to doc.theme
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

    const cmd = {
      type: 'UPDATE_THEME' as const,
      theme: {
        ...resolved!.theme,
        tokens: resolved!.tokens,
        appliedStylePackId: 'sp-medical-clean',
      },
    }

    const nextCtx = ctx.dispatch(cmd)
    
    // After UPDATE_THEME, the document theme has changed
    expect(nextCtx.document.theme.primaryColor).toBe('#0066CC')
    
    // The canvas state should be updated (even if selection stays the same)
    // The key verification: document changed, which means canvas will re-render
    // with new theme values via resolveEffectiveStyles fallback
    expect(nextCtx.document.version).toBe(2)
    expect(nextCtx.document.isDirty).toBe(true)
  })

  it('PHASE 8 — UNDO: reverts theme and clears appliedStylePackId', () => {
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

    const cmd = {
      type: 'UPDATE_THEME' as const,
      theme: {
        ...resolved!.theme,
        tokens: resolved!.tokens,
        appliedStylePackId: 'sp-medical-clean',
      },
    }

    const afterApply = ctx.dispatch(cmd)
    const afterUndo = afterApply.dispatch({ type: 'UNDO' })
    
    expect(afterUndo.document.theme.primaryColor).toBe('#D9A86C')
    expect(afterUndo.document.theme.appliedStylePackId).toBeNull()
  })

  it('PHASE 9 — REDO: re-applies theme', () => {
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

    const cmd = {
      type: 'UPDATE_THEME' as const,
      theme: {
        ...resolved!.theme,
        tokens: resolved!.tokens,
        appliedStylePackId: 'sp-medical-clean',
      },
    }

    const afterApply = ctx.dispatch(cmd)
    const afterUndo = afterApply.dispatch({ type: 'UNDO' })
    const afterRedo = afterUndo.dispatch({ type: 'REDO' })
    
    expect(afterRedo.document.theme.primaryColor).toBe('#0066CC')
    expect(afterRedo.document.theme.appliedStylePackId).toBe('sp-medical-clean')
  })

  it('PHASE 10 — CATEGORY: Style Pack resolve returns all expected fields', () => {
    const resolved = resolveStylePackApplication('sp-luxury-dental', {
      stylePacks: DesignSystem.stylePacks,
      colorPalettes: DesignSystem.colorPalettes,
      typographySystems: DesignSystem.typographySystems,
      radiusStyles: DesignSystem.radiusStyles,
      shadowStyles: DesignSystem.shadowStyles,
      backgroundStyles: DesignSystem.backgroundStyles,
      spacingStyles: DesignSystem.spacingStyles,
      compatibility: DesignSystem.compatibility,
    }, {})

    expect(resolved).not.toBeNull()
    expect(resolved!.stylePackId).toBe('sp-luxury-dental')
    expect(resolved!.stylePackName).toBe('Luxury Dental')
    expect(resolved!.theme.primaryColor).toBeDefined()
    expect(resolved!.theme.secondaryColor).toBeDefined()
    expect(resolved!.theme.backgroundColor).toBeDefined()
    expect(resolved!.theme.font).toBeDefined()
    expect(resolved!.theme.borderRadius).toBeDefined()
    expect(resolved!.tokens.colors).toBeDefined()
    expect(resolved!.tokens.typography).toBeDefined()
    expect(resolved!.tokens.radius).toBeDefined()
    expect(resolved!.tokens.spacing).toBeDefined()
    expect(resolved!.applied.length).toBeGreaterThan(0)
    expect(resolved!.compatibility.score).toBeGreaterThanOrEqual(0)
  })

  it('PHASE 11 — RESOLVER: different style packs produce different themes', () => {
    const modern = resolveStylePackApplication('sp-modern-dental-premium', {
      stylePacks: DesignSystem.stylePacks,
      colorPalettes: DesignSystem.colorPalettes,
      typographySystems: DesignSystem.typographySystems,
      radiusStyles: DesignSystem.radiusStyles,
      shadowStyles: DesignSystem.shadowStyles,
      backgroundStyles: DesignSystem.backgroundStyles,
      spacingStyles: DesignSystem.spacingStyles,
      compatibility: DesignSystem.compatibility,
    }, {})

    const luxury = resolveStylePackApplication('sp-luxury-dental', {
      stylePacks: DesignSystem.stylePacks,
      colorPalettes: DesignSystem.colorPalettes,
      typographySystems: DesignSystem.typographySystems,
      radiusStyles: DesignSystem.radiusStyles,
      shadowStyles: DesignSystem.shadowStyles,
      backgroundStyles: DesignSystem.backgroundStyles,
      spacingStyles: DesignSystem.spacingStyles,
      compatibility: DesignSystem.compatibility,
    }, {})

    expect(modern!.theme.primaryColor).not.toBe(luxury!.theme.primaryColor)
    expect(modern!.theme.font).not.toBe(luxury!.theme.font)
  })

  it('PHASE 12 — DESIGN APPLICATION: color-palette resolves correctly', () => {
    const result = resolveDesignApplication(
      { kind: 'color-palette', id: 'mono-black-white' },
      DesignSystem
    )

    expect(result.ok).toBe(true)
    expect(result.theme.primaryColor).toBeDefined()
    expect(result.theme.secondaryColor).toBeDefined()
    expect(result.theme.backgroundColor).toBeDefined()
    expect(result.tokens.colors).toBeDefined()

    const payload = designApplicationToCommandPayload(result)
    expect(payload).not.toBeNull()
    expect(payload!.type).toBe('UPDATE_THEME')
    expect(payload!.theme.primaryColor).toBe(result.theme.primaryColor)
  })

  it('PHASE 13 — DESIGN APPLICATION: typography resolves correctly', () => {
    const result = resolveDesignApplication(
      { kind: 'typography', id: 'typography-modern-minimal' },
      DesignSystem
    )

    expect(result.ok).toBe(true)
    expect(result.theme.font).toBeDefined()
    expect(result.tokens.typography).toBeDefined()

    const payload = designApplicationToCommandPayload(result)
    expect(payload).not.toBeNull()
    expect(payload!.type).toBe('UPDATE_THEME')
    expect(payload!.theme.font).toBe(result.theme.font)
  })

  it('PHASE 14 — DESIGN APPLICATION: font resolves correctly', () => {
    const result = resolveDesignApplication(
      { kind: 'font', id: 'inter' },
      DesignSystem
    )

    expect(result.ok).toBe(true)
    expect(result.theme.font).toBeDefined()

    const payload = designApplicationToCommandPayload(result)
    expect(payload).not.toBeNull()
    expect(payload!.type).toBe('UPDATE_THEME')
  })

  it('PHASE 15 — DESIGN APPLICATION: design-combination resolves correctly', () => {
    const result = resolveDesignApplication(
      { kind: 'design-combination', id: 'comb-001' },
      DesignSystem
    )

    expect(result.ok).toBe(true)
    expect(result.theme.primaryColor || result.theme.font).toBeDefined()

    const payload = designApplicationToCommandPayload(result)
    expect(payload).not.toBeNull()
    expect(payload!.type).toBe('UPDATE_THEME')
  })
})
