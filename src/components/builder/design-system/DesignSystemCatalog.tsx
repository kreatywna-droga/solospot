'use client'

/**
 * DesignSystemCatalog — ONE Design System catalog for Builder UI
 *
 * Sources: packages/design-system (same SSOT as HACP tools).
 * Preview does NOT mutate; Apply → resolveStylePackApplication → UPDATE_THEME.
 */

import { useMemo, useState, useCallback } from 'react'
import { Search, Filter, Check, Eye, Sparkles, X } from 'lucide-react'
import { DesignSystem } from '../../../../packages/design-system/src/index'
import { resolveStylePackApplication, resolveDesignApplication, designApplicationToCommandPayload } from '../../../../packages/design-system/src/builder'
import type { DesignApplicationKind } from '../../../../packages/design-system/src/builder'
import { useBuilder } from '../state/BuilderProvider'
import { VISUAL_LANGUAGES, buildVisualLanguageCommandPlan } from '../../../../src/lib/design-brain'
import { buildTypographyApplicationPlan } from '../../../../src/lib/design-brain'
import { buildFullCompositionPlan } from '../../../../src/lib/design-brain'

type CategoryId =
  | 'style-packs'
  | 'design-combinations'
  | 'fonts'
  | 'font-pairings'
  | 'typography'
  | 'colors'
  | 'color-combinations'
  | 'buttons'
  | 'cards'
  | 'backgrounds'
  | 'hero'
  | 'sections'
  | 'images'
  | 'icons'
  | 'effects'
  | 'shadows'
  | 'radius'
  | 'spacing'
  | 'industry-presets'
  | 'themes'
  | 'visual-languages'

const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'style-packs', label: 'Style Packs' },
  { id: 'design-combinations', label: 'Kombinacje' },
  { id: 'fonts', label: 'Fonty' },
  { id: 'font-pairings', label: 'Pary fontów' },
  { id: 'typography', label: 'Typografia' },
  { id: 'colors', label: 'Palety' },
  { id: 'color-combinations', label: 'Kolory' },
  { id: 'buttons', label: 'Przyciski' },
  { id: 'cards', label: 'Karty' },
  { id: 'backgrounds', label: 'Tła' },
  { id: 'hero', label: 'Hero' },
  { id: 'sections', label: 'Sekcje' },
  { id: 'images', label: 'Obrazy' },
  { id: 'icons', label: 'Ikony' },
  { id: 'effects', label: 'Efekty' },
  { id: 'shadows', label: 'Cienie' },
  { id: 'radius', label: 'Promień' },
  { id: 'spacing', label: 'Odstępy' },
  { id: 'industry-presets', label: 'Branże' },
  { id: 'themes', label: 'Motywy' },
  { id: 'visual-languages', label: 'Języki wizualne' },
]

function matchQ(item: any, q: string): boolean {
  if (!q) return true
  const hay = [
    item?.id, item?.name, item?.description, item?.style, item?.industry, item?.category,
    Array.isArray(item?.tags) ? item.tags.join(' ') : '',
    Array.isArray(item?.mood) ? item.mood.join(' ') : '',
    Array.isArray(item?.recommendedIndustries) ? item.recommendedIndustries.join(' ') : '',
  ].filter(Boolean).join(' ').toLowerCase()
  return hay.includes(q)
}

function paletteOf(pack: any): { primary: string; secondary: string; bg: string } {
  const palette = DesignSystem.colorPalettes.find((c: any) => c.id === pack?.colorPaletteId)
  return {
    primary: palette?.primary || pack?.preview?.primary || '#D9A86C',
    secondary: palette?.secondary || '#F2C27F',
    bg: palette?.background || pack?.preview?.background || '#0A0A0F',
  }
}

export function DesignSystemCatalog() {
  const { dispatch, document: doc } = useBuilder() as { dispatch: (c: any) => void; document?: any }
  const [category, setCategory] = useState<CategoryId>('style-packs')
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('')
  const [mood, setMood] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  // Badge derives from document theme so Ctrl+Z (undo) clears it — no local state.
  const appliedId: string | null = doc?.theme?.appliedStylePackId ?? null

  const industries = useMemo(() => {
    const set = new Set<string>()
    for (const p of DesignSystem.stylePacks) set.add(String(p.industry || '').toLowerCase())
    return [...set].filter(Boolean).sort()
  }, [])

  const moods = useMemo(() => {
    const set = new Set<string>()
    for (const p of DesignSystem.stylePacks) {
      for (const m of p.mood || []) set.add(String(m).toLowerCase())
    }
    return [...set].filter(Boolean).sort()
  }, [])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const byIndustry = (list: any[]) =>
      list.filter((item) => {
        if (industry) {
          const s = [
            item?.industry, ...(item?.recommendedIndustries || []), ...(item?.bestIndustries || []),
          ].map((x) => String(x || '').toLowerCase())
          if (!s.some((x) => x.includes(industry))) return false
        }
        if (mood) {
          const m = [
            ...(Array.isArray(item?.mood) ? item.mood : item?.mood ? [item.mood] : []),
            ...(item?.tags || []),
            ...(item?.mood || []),
          ].map((x) => String(x).toLowerCase())
          if (!m.some((x) => x.includes(mood))) return false
        }
        return matchQ(item, q)
      })

    switch (category) {
      case 'style-packs':
        return byIndustry(DesignSystem.stylePacks)
      case 'design-combinations':
        return DesignSystem.designCombinations.filter((c: any) => matchQ(c, q))
      case 'industry-presets':
        return byIndustry(DesignSystem.industryPresets)
      case 'fonts':
        return DesignSystem.fonts.filter((f: any) => matchQ(f, q))
      case 'font-pairings':
        return DesignSystem.fontPairings.filter((p: any) => matchQ(p, q))
      case 'colors':
        return byIndustry(DesignSystem.colorPalettes)
      case 'color-combinations':
        return (DesignSystem as any).colorCombinations?.filter((c: any) => matchQ(c, q)) || []
      case 'typography':
        return DesignSystem.typographySystems.filter((t: any) => matchQ(t, q))
      case 'buttons':
        return DesignSystem.buttonSystems.filter((b: any) => matchQ(b, q))
      case 'cards':
        return DesignSystem.cardSystems.filter((c: any) => matchQ(c, q))
      case 'backgrounds':
        return DesignSystem.backgroundStyles.filter((b: any) => matchQ(b, q))
      case 'hero':
        return DesignSystem.heroStyles.filter((h: any) => matchQ(h, q))
      case 'sections':
        return DesignSystem.sectionStyles.filter((s: any) => matchQ(s, q))
      case 'images':
        return DesignSystem.imageTreatmentStyles.filter((i: any) => matchQ(i, q))
      case 'icons':
        return DesignSystem.iconStyles.filter((i: any) => matchQ(i, q))
      case 'effects':
        return DesignSystem.effectStyles.filter((e: any) => matchQ(e, q))
      case 'shadows':
        return DesignSystem.shadowStyles.filter((s: any) => matchQ(s, q))
      case 'radius':
        return DesignSystem.radiusStyles.filter((r: any) => matchQ(r, q))
      case 'spacing':
        return DesignSystem.spacingStyles.filter((s: any) => matchQ(s, q))
      case 'themes':
        return DesignSystem.designThemes.filter((t: any) => matchQ(t, q))
      case 'visual-languages':
        return VISUAL_LANGUAGES.filter((l) => matchQ(l, q))
      default:
        return []
    }
  }, [category, query, industry, mood])

  const CATEGORY_KIND_MAP: Record<CategoryId, string> = {
    'style-packs': 'style-pack',
    'design-combinations': 'design-combination',
    'fonts': 'font',
    'font-pairings': 'font-pairing',
    'typography': 'typography',
    'colors': 'color-palette',
    'color-combinations': 'color-combination',
    'buttons': 'button',
    'cards': 'card',
    'backgrounds': 'background',
    'hero': 'hero',
    'sections': 'section',
    'images': 'image',
    'icons': 'icon',
    'effects': 'effect',
    'shadows': 'shadow',
    'radius': 'radius',
    'spacing': 'spacing',
    'industry-presets': 'industry-preset',
    'themes': 'theme',
    'visual-languages': 'visual-language',
  }

  const CAN_APPLY: Record<CategoryId, boolean> = {
    'style-packs': true,
    'design-combinations': true,
    'fonts': true,
    'font-pairings': true,
    'typography': true,
    'colors': true,
    'color-combinations': false,
    'buttons': true,
    'cards': true,
    'backgrounds': true,
    'hero': true,
    'sections': true,
    'images': true,
    'icons': true,
    'effects': true,
    'shadows': true,
    'radius': true,
    'spacing': true,
    'industry-presets': true,
    'themes': false,
    'visual-languages': true,
  }

  const applyDesignSystemItem = useCallback(
    (itemId: string, itemCategory: CategoryId) => {
      const kind = (CATEGORY_KIND_MAP[itemCategory] || itemCategory) as DesignApplicationKind
      const raw =
        kind === 'style-pack'
          ? resolveStylePackApplication(
              itemId,
              {
                stylePacks: DesignSystem.stylePacks,
                colorPalettes: DesignSystem.colorPalettes,
                typographySystems: DesignSystem.typographySystems,
                radiusStyles: DesignSystem.radiusStyles,
                shadowStyles: DesignSystem.shadowStyles,
                backgroundStyles: DesignSystem.backgroundStyles,
                spacingStyles: DesignSystem.spacingStyles,
                compatibility: DesignSystem.compatibility,
              },
              {}
            )
          : resolveDesignApplication({ kind, id: itemId, options: {} }, DesignSystem as any)

      const resolved = raw as any
      if (!resolved) return

      const designResult =
        kind === 'style-pack'
          ? { ok: Object.keys(resolved.theme).length > 0, ...resolved }
          : resolved

      if (!designResult || !designResult.ok) return

      const payload = designApplicationToCommandPayload(designResult)
      if (!payload) return

      dispatch({
        ...payload,
        theme: {
          ...(payload.theme || {}),
          appliedStylePackId:
            kind === 'style-pack' || kind === 'industry-preset'
              ? itemId
              : (doc?.theme?.appliedStylePackId || undefined),
        } as any,
      } as any)

      // REPAIR GATE v3.0 — FONT PERSISTENCE.
      // A font/typography apply that only writes theme.font is silently
      // overridden on the canvas because each section carries its own
      // node.styles.fontFamily (default "Inter"). We ALSO write the resolved
      // font to every typography node via SET_NODE_STYLES so the canvas
      // reflects it and the change persists across reload.
      const affectsTypography = [
        'font', 'typography', 'font-pairing', 'style-pack', 'industry-preset', 'design-combination',
      ].includes(kind as string)
      if (affectsTypography && doc) {
        const headingFont =
          (designResult.theme as any)?.font ||
          (designResult.tokens as any)?.typography?.headingFont ||
          undefined
        const bodyFont =
          (designResult.tokens as any)?.typography?.bodyFont ||
          headingFont ||
          undefined
        if (headingFont || bodyFont) {
          const typePlan = buildTypographyApplicationPlan(doc, {
            heading: headingFont,
            body: bodyFont,
          })
          for (const command of typePlan.nodeCommands) dispatch(command as any)
        }
      }

      // REPAIR GATE v3.0 — CARD CONTRAST + REAL COMPOSITION.
      // Applying a Style Pack / Industry Preset must change the REAL page, not
      // just the theme. Build a full composition plan that writes contrast-safe
      // card backgrounds/text, CTA button colors, section spacing, and radius
      // via SET_NODE_STYLES (relational semantic roles — no light-on-light).
      const affectsComposition = ['style-pack', 'industry-preset'].includes(kind as string)
      if (affectsComposition && doc) {
        const theme = (designResult.theme || {}) as any
        const tokens = (designResult.tokens || {}) as any
        const colors = tokens?.colors || {}
        const compPlan = buildFullCompositionPlan(
          doc,
          {
            font: {
              heading: theme.font || tokens?.typography?.headingFont || undefined,
              body: tokens?.typography?.bodyFont || theme.font || undefined,
            },
            colors: {
              primary: colors.primary || theme.primaryColor,
              background: colors.background || theme.backgroundColor,
              surface: colors.surface || colors.background || theme.backgroundColor,
              textPrimary: colors.text || colors.textPrimary,
              textMuted: colors.muted,
              accent: colors.accent || colors.primary || theme.primaryColor,
              buttonBackground: colors.cta || colors.buttonBackground,
              border: colors.border,
            },
            radius: tokens?.radius?.default || theme.borderRadius || undefined,
            shadow: tokens?.shadows?.default || undefined,
          }
        )
        // Contrast violations are surfaced as warnings — the plan is still
        // applied but never silently produces unreadable text (roles guarantee
        // readable pairs via resolveSemanticRoles).
        for (const command of compPlan.nodeCommands) dispatch(command as any)
      }
    },
    [dispatch, DesignSystem, doc]
  )

  const applyVisualLanguage = useCallback(
    (visualLanguageId: string) => {
      const language = VISUAL_LANGUAGES.find((l) => l.id === visualLanguageId)
      if (!language || !doc) return

      const plan = buildVisualLanguageCommandPlan(language, doc, doc.pages?.[0]?.id)
      const colors = language.tokens.colors || {}
      const typography = language.tokens.typography || {}
      const radius = language.tokens.radius || {}
      const spacing = language.tokens.spacing || {}
      const shadows = language.tokens.shadows || {}
      const theme: Record<string, unknown> = {
        primaryColor: (colors as any).primary,
        secondaryColor: (colors as any).secondary,
        backgroundColor: (colors as any).background,
        text: (colors as any).text,
        accent: (colors as any).accent,
        cta: (colors as any).cta,
        font: (typography as any).headingFont || (typography as any).bodyFont,
        borderRadius: (radius as any).default || (radius as any).button || (radius as any).card,
      }
      const tokens = {
        colors,
        typography,
        radius,
        spacing,
        shadows,
        components: language.tokens.components,
        composition: language.tokens.composition,
      }

      dispatch({
        type: 'UPDATE_THEME',
        theme: {
          ...theme,
          tokens,
          appliedStylePackId: `visual-language:${visualLanguageId}`,
        } as any,
      } as any)

      for (const command of plan.compositionCommands) {
        dispatch(command as any)
      }

      // REPAIR GATE v3.0 — FONT PERSISTENCE for Visual Languages.
      // Apply the VL heading/body font to every typography node via
      // SET_NODE_STYLES so node.styles.fontFamily can't override theme.font.
      const headingFont = (typography as any)?.headingFont
      const bodyFont = (typography as any)?.bodyFont || headingFont
      if (headingFont) {
        const typePlan = buildTypographyApplicationPlan(doc, {
          heading: headingFont,
          body: bodyFont,
        })
        for (const command of typePlan.nodeCommands) dispatch(command as any)
      }
    },
    [dispatch, doc]
  )

  const previewPack = previewId
    ? DesignSystem.stylePacks.find((p) => p.id === previewId)
    : null

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Search + filters */}
      <div className="p-2.5 space-y-2 border-b border-[#3A3A40] bg-[#202024]">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj stylów, fontów, palet…"
              data-testid="ds-search-input"
              className="w-full bg-[#18181B] border border-[#3A3A40] rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D9A86C]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                aria-label="Wyczyść"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            data-testid="ds-filters-toggle"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              showFilters || industry || mood
                ? 'border-[#D9A86C]/40 bg-[#D9A86C]/15 text-[#F2C27F]'
                : 'border-[#3A3A40] text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtry
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-2" data-testid="ds-filter-row">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              data-testid="ds-filter-industry"
              className="flex-1 bg-[#18181B] border border-[#3A3A40] rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#D9A86C]"
            >
              <option value="">Branża (wszystkie)</option>
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              data-testid="ds-filter-mood"
              className="flex-1 bg-[#18181B] border border-[#3A3A40] rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#D9A86C]"
            >
              <option value="">Nastrój (wszystkie)</option>
              {moods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category chips */}
        <div className="flex flex-wrap gap-1" data-testid="ds-categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              data-testid={`ds-cat-${c.id}`}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-all ${
                category === c.id
                  ? 'bg-[#D9A86C] text-white'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-transparent hover:border-white/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2" data-testid="ds-catalog-list">
        {items.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-6">Brak wyników dla „{query}”.</p>
        )}
        {items.map((item: any) => {
          const canApply = CAN_APPLY[category] ?? false
          return (
            <div
              key={item.id}
              data-testid="ds-catalog-item"
              data-item-id={item.id}
              data-category={category}
              className={`p-2.5 rounded-xl border bg-white/[0.03] transition-all hover:border-[#D9A86C]/40 ${
                appliedId === item.id ? 'border-[#D9A86C]/70 bg-[#D9A86C]/[0.08]' : 'border-[#3A3A40]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    {item.name || item.industry || item.id}
                    {appliedId === item.id && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D9A86C] text-white font-bold">
                        ZASTOSOWANY
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 line-clamp-2">
                    {item.description ||
                      item.audience ||
                      item.fontFamily ||
                      item.style ||
                      item.id}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(item.tags || item.mood || item.recommendedIndustries || [])
                      .slice(0, 4)
                      .map((t: any) => (
                        <span
                          key={String(t)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400"
                        >
                          {String(t)}
                        </span>
                      ))}
                    {category === 'style-packs' && (() => {
                      const colors = paletteOf(item)
                      return (
                        <div className="flex gap-1 pt-0.5">
                          <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: colors.primary }} />
                          <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: colors.secondary }} />
                          <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: colors.bg }} />
                        </div>
                      )
                    })()}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setPreviewId(item.id)}
                    data-testid="ds-btn-preview"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-[#3A3A40] text-zinc-300 hover:border-white/30 hover:text-white"
                  >
                    <Eye className="w-3 h-3" /> Podgląd
                  </button>
                  {canApply && (
                    <button
                      onClick={() => category === 'visual-languages' ? applyVisualLanguage(item.id) : applyDesignSystemItem(item.id, category)}
                      data-testid="ds-btn-apply"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#D9A86C] text-white hover:bg-[#c4965a]"
                    >
                      <Check className="w-3 h-3" /> Zastosuj
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview modal — PREVIEW ≠ APPLY */}
      {previewId && (() => {
        const previewItem = items.find((i: any) => i.id === previewId)
        if (!previewItem) return null
        return (
          <div
            className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
            data-testid="ds-preview-modal"
            onClick={() => setPreviewId(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#3A3A40] bg-[#18181B] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#3A3A40]">
                <div className="flex items-center gap-2 text-white text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-[#D9A86C]" />
                  {previewItem.name || previewItem.id}
                </div>
                <button onClick={() => setPreviewId(null)} className="text-zinc-400 hover:text-white" aria-label="Zamknij">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-3" data-testid="ds-preview-content">
                <div className="rounded-xl p-4 border border-white/10">
                  <div className="text-lg font-bold mb-1 text-white">
                    {previewItem.name || previewItem.id}
                  </div>
                  <div className="text-sm mb-2 text-zinc-300">
                    {previewItem.description || previewItem.style || previewItem.preview || 'Podgląd'}
                  </div>
                  {previewItem.values && (
                    <div className="text-[11px] text-zinc-400 space-y-1">
                      {Object.entries(previewItem.values).map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-zinc-500">{key}:</span>
                          <span className="text-zinc-300">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Podgląd nie zmienia dokumentu. Kliknij „Zastosuj”, aby wykonać mutację.
                </p>
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#3A3A40]">
                <button
                  onClick={() => setPreviewId(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#3A3A40] text-zinc-300 hover:text-white"
                >
                  Zamknij
                </button>
                 {CAN_APPLY[category] && (
                   <button
                     onClick={() => {
                       if (category === 'visual-languages') {
                         applyVisualLanguage(previewItem.id)
                       } else {
                         applyDesignSystemItem(previewItem.id, category)
                       }
                       setPreviewId(null)
                     }}
                     data-testid="ds-btn-apply-from-preview"
                     className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#D9A86C] text-white hover:bg-[#c4965a]"
                   >
                     Zastosuj
                   </button>
                 )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
