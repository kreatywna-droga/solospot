'use client'

/**
 * DesignSystemCatalog — ONE Visual Library for SoloSpot Builder UI
 *
 * Sources: packages/design-system (same SSOT as HACP tools).
 * Integrates VisualLibraryContract (INSERT vs APPLY), visual previews,
 * drag-and-drop canvas insertion, and deterministic document mutations.
 */

import { useMemo, useState, useCallback, useEffect } from 'react'
import { Search, Filter, Check, Eye, Sparkles, X, Plus, Type, Box, Layers, Image as ImageIcon, Palette, Layout } from 'lucide-react'
import { DesignSystem } from '../../../../packages/design-system/src/index'
import { resolveStylePackApplication, resolveDesignApplication, designApplicationToCommandPayload } from '../../../../packages/design-system/src/builder'
import type { DesignApplicationKind } from '../../../../packages/design-system/src/builder'
import { useBuilder } from '../state/BuilderProvider'
import { VISUAL_LANGUAGES, buildVisualLanguageCommandPlan } from '../../../../src/lib/design-brain'
import { buildTypographyApplicationPlan } from '../../../../src/lib/design-brain'
import { buildFullCompositionPlan } from '../../../../src/lib/design-brain'
import { getCategoryOperations, validateOperationTarget } from './VisualLibraryContract'
import { insertComponent } from '@/lib/experience/ComponentInsertionEngine'
import { createBuilderNode, generateNodeId } from '../../../../packages/builder-core/src'
import { loadGoogleFont } from '../../../../packages/builder-core/src/fonts/FontCatalog'

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

function getPreviewDescription(item: any): string {
  if (typeof item?.description === 'string' && item.description) return item.description
  if (typeof item?.style === 'string' && item.style) return item.style
  if (typeof item?.character === 'string' && item.character) return item.character
  if (typeof item?.character?.personality === 'string' && item.character.personality) return item.character.personality
  if (typeof item?.preview === 'string' && item.preview) return item.preview
  if (item?.preview && typeof item.preview === 'object') {
    if (typeof item.preview.sample === 'string' && item.preview.sample) return item.preview.sample
    if (typeof item.preview.body === 'string' && item.preview.body) return item.preview.body
    if (typeof item.preview.heading === 'string' && item.preview.heading) return item.preview.heading
    if (typeof item.preview.h1 === 'string' && item.preview.h1) return item.preview.h1
  }
  return 'Podgląd'
}

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

function paletteOf(pack: any): { primary: string; secondary: string; bg: string; surface?: string } {
  const palette = DesignSystem.colorPalettes.find((c: any) => c.id === pack?.colorPaletteId || c.id === pack?.id)
  return {
    primary: palette?.primary || pack?.primary || pack?.preview?.primary || '#D9A86C',
    secondary: palette?.secondary || pack?.secondary || '#F2C27F',
    bg: palette?.background || pack?.background || pack?.preview?.background || '#0A0A0F',
    surface: palette?.surface || pack?.surface || '#18181C',
  }
}

function cleanBgStyle(styleVal: any): string {
  if (!styleVal) return '#1A1A24'
  if (typeof styleVal === 'object') {
    return styleVal.value || styleVal.color || styleVal.gradient || '#1A1A24'
  }
  let str = String(styleVal).trim()
  if (str.includes(':')) {
    str = str.split(':').pop() || str
  }
  return str.replace(/;+$/, '').trim() || '#1A1A24'
}

function extractFontName(val: any): string | undefined {
  if (!val) return undefined
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    return val.name || val.fontFamily || val.id || undefined
  }
  return undefined
}

function CardVisualPreview({ item, category }: { item: any; category: CategoryId }) {
  useEffect(() => {
    if (category === 'fonts') {
      const font = extractFontName(item.fontFamily) || extractFontName(item.name) || item.id
      if (font && typeof font === 'string') void loadGoogleFont(font).catch(() => false)
    } else if (category === 'font-pairings') {
      const heading = extractFontName(item.headingFont) || extractFontName(item.heading) || extractFontName(item.displayFont)
      const body = extractFontName(item.bodyFont) || extractFontName(item.body)
      if (heading && typeof heading === 'string') void loadGoogleFont(heading).catch(() => false)
      if (body && typeof body === 'string') void loadGoogleFont(body).catch(() => false)
    }
  }, [category, item])

  switch (category) {
    case 'fonts': {
      const font = extractFontName(item.fontFamily) || extractFontName(item.name) || String(item.id || 'Inter')
      const nameStr = typeof item.name === 'string' ? item.name : font
      return (
        <div className="p-2 rounded-lg bg-black/40 border border-white/10 space-y-1">
          <div style={{ fontFamily: font }} className="text-sm font-bold text-[#F2C27F] truncate">
            {nameStr}
          </div>
          <div style={{ fontFamily: font }} className="text-[11px] text-zinc-300 truncate">
            Aa Bb Cc 123 — Szybki brązowy lis przeskakuje
          </div>
        </div>
      )
    }

    case 'font-pairings': {
      const heading = extractFontName(item.headingFont) || extractFontName(item.heading) || extractFontName(item.displayFont) || 'Playfair Display'
      const body = extractFontName(item.bodyFont) || extractFontName(item.body) || 'Inter'
      const nameStr = typeof item.name === 'string' ? item.name : 'Para Fontów'
      return (
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-1">
          <div style={{ fontFamily: heading }} className="text-xs font-bold text-[#F2C27F] truncate">
            {nameStr} (Nagłówek: {heading})
          </div>
          <div style={{ fontFamily: body }} className="text-[10px] text-zinc-300 line-clamp-2">
            Tekst podstawowy akapitu renderowany w foncie {body}. Elegancki i czytelny układ.
          </div>
        </div>
      )
    }

    case 'typography': {
      return (
        <div className="p-2 rounded-lg bg-black/40 border border-white/10 space-y-0.5">
          <div className="text-xs font-extrabold text-white truncate">H1. Nagłówek Sekcji</div>
          <div className="text-[11px] font-semibold text-zinc-300 truncate">H2. Podtytuł i opis</div>
          <div className="text-[10px] text-zinc-400 truncate">Body. Tekst akapitu z pełną typografią</div>
        </div>
      )
    }

    case 'colors':
    case 'color-combinations': {
      const palette = paletteOf(item)
      return (
        <div className="p-2 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
          <div className="flex gap-1.5 items-center">
            <span className="w-5 h-5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: palette.primary }} title="Primary" />
            <span className="w-5 h-5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: palette.secondary }} title="Secondary" />
            <span className="w-5 h-5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: palette.bg }} title="Background" />
            <span className="w-5 h-5 rounded border border-white/20 shadow-sm" style={{ backgroundColor: palette.surface }} title="Surface" />
          </div>
          <div className="text-[9px] text-zinc-400 font-mono flex gap-2">
            <span>P: {palette.primary}</span>
            <span>BG: {palette.bg}</span>
          </div>
        </div>
      )
    }

    case 'buttons': {
      const bg = item.preview?.bg || item.bg || item.primary || '#D9A86C'
      const color = item.preview?.color || item.color || '#FFFFFF'
      const radius = item.preview?.radius || item.borderRadius || '8px'
      return (
        <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center">
          <button
            type="button"
            style={{ backgroundColor: bg, color, borderRadius: radius }}
            className="px-3 py-1.5 text-xs font-bold shadow-md hover:opacity-95 transition-opacity"
          >
            {item.name || 'Przycisk'}
          </button>
        </div>
      )
    }

    case 'cards': {
      const radius = item.borderRadius || item.radius || '12px'
      return (
        <div
          style={{ borderRadius: radius }}
          className="p-2.5 bg-white/[0.05] border border-white/10 space-y-1 shadow-md"
        >
          <div className="text-xs font-bold text-[#F2C27F]">{item.name || 'Karta'}</div>
          <div className="text-[10px] text-zinc-400">Podgląd stylu karty i jej zawartości</div>
        </div>
      )
    }

    case 'backgrounds': {
      const bgStyle = cleanBgStyle(item.preview || item.style || item.gradient || item.color || '#1A1A24')
      return (
        <div
          style={{ background: bgStyle }}
          className="w-full h-9 rounded-lg border border-white/10 flex items-center justify-center text-[10px] font-semibold text-white/90 shadow-inner px-2 truncate"
        >
          {item.name || 'Tło'}
        </div>
      )
    }

    case 'icons': {
      return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-black/40 border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#D9A86C]/15 border border-[#D9A86C]/30 flex items-center justify-center text-[#F2C27F]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white truncate">{item.name || item.id}</div>
        </div>
      )
    }

    case 'images': {
      const src = item.url || item.preview || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'
      return (
        <div className="relative h-14 rounded-lg overflow-hidden border border-white/10 group">
          {/* eslint-disable-next-html-element-for-jsx */}
          <img src={src} alt={item.name || 'Media'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-1 flex items-end">
            <span className="text-[9px] text-white font-semibold truncate">{item.name || 'Obraz'}</span>
          </div>
        </div>
      )
    }

    case 'hero':
    case 'sections': {
      return (
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#D9A86C]">{category === 'hero' ? 'Sekcja Hero' : 'Sekcja'}</span>
            <Layout className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="h-6 rounded bg-white/5 border border-white/10 flex items-center px-2 text-[10px] text-zinc-300 truncate">
            {item.name || 'Układ Sekcji'}
          </div>
        </div>
      )
    }

    case 'style-packs':
    case 'themes':
    case 'industry-presets':
    case 'visual-languages': {
      const palette = paletteOf(item)
      return (
        <div className="p-2.5 rounded-lg bg-black/50 border border-white/15 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#F2C27F] truncate">{item.name || item.id}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#D9A86C]/20 text-[#F2C27F] font-semibold uppercase">
              {item.industry || 'Style Pack'}
            </span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: palette.primary }} />
            <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: palette.secondary }} />
            <span className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: palette.bg }} />
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

export function DesignSystemCatalog() {
  const { dispatch, canvas, document: doc } = useBuilder() as { dispatch: (c: any) => void; canvas?: any; document?: any }
  const [category, setCategory] = useState<CategoryId>('style-packs')
  const [query, setQuery] = useState('')
  const [industry, setIndustry] = useState('')
  const [mood, setMood] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
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

  const applyDesignSystemItem = useCallback(
    (itemId: string, itemCategory: CategoryId) => {
      const validation = validateOperationTarget(itemCategory, 'APPLY', {
        document: doc,
        pageId: canvas?.selectedPageId || doc?.pages?.[0]?.id,
        target: 'theme',
        selectedNodeId: canvas?.selectedSectionId,
      })
      if (!validation.valid) return

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

      const batchCommands: any[] = [];
      if ((payload as any).type === 'BATCH_EXECUTE' && Array.isArray((payload as any).commands)) {
        batchCommands.push(...(payload as any).commands)
      } else {
        batchCommands.push({
          ...payload,
          theme: {
            ...(payload.theme || {}),
            appliedStylePackId:
              kind === 'style-pack' || kind === 'industry-preset'
                ? itemId
                : (doc?.theme?.appliedStylePackId || undefined),
          } as any,
        } as any)
      }

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
          batchCommands.push(...typePlan.nodeCommands)
        }
      }

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
        batchCommands.push(...compPlan.nodeCommands)
      }
      if (batchCommands.length > 0) dispatch({ type: 'BATCH_EXECUTE', commands: batchCommands } as any)
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

      const batchCommands: any[] = [];
      const headingFont = (typography as any)?.headingFont
      const bodyFont = (typography as any)?.bodyFont || headingFont
      if (headingFont) {
        const typePlan = buildTypographyApplicationPlan(doc, {
          heading: headingFont,
          body: bodyFont,
        })
        batchCommands.push(...typePlan.nodeCommands)
      }
      if (batchCommands.length > 0) dispatch({ type: 'BATCH_EXECUTE', commands: batchCommands } as any)
    },
    [dispatch, doc]
  )

  const insertDesignSystemItem = useCallback(
    (item: any, itemCategory: CategoryId) => {
      const validation = validateOperationTarget(itemCategory, 'INSERT', {
        document: doc,
        pageId: canvas?.selectedPageId || doc?.pages?.[0]?.id,
        target: itemCategory === 'sections' || itemCategory === 'hero' ? 'section' : 'element',
        selectedNodeId: canvas?.selectedSectionId,
      })
      if (!validation.valid) return

      if (!doc) return
      const targetPageId = canvas?.selectedPageId || doc.pages[0]?.id
      if (!targetPageId) return

      if (itemCategory === 'fonts' || itemCategory === 'typography') {
        const font = extractFontName(item.fontFamily) || extractFontName(item.name) || 'Inter'
        insertComponent(
          {
            type: 'heading',
            label: typeof item.name === 'string' ? item.name : 'Nagłówek',
            category: 'typography',
            icon: 'Type',
            schema: [],
            previewable: true,
            allowChildren: false,
            defaultProps: { content: `Przykładowy tekst w foncie ${font}` },
            defaultStyles: { fontFamily: font, fontSize: '24px', fontWeight: 'bold' },
          },
          { document: doc, pageId: targetPageId, selectedNodeId: canvas?.selectedSectionId },
          dispatch
        )
      } else if (itemCategory === 'font-pairings') {
        const headingFont = extractFontName(item.headingFont) || extractFontName(item.heading) || extractFontName(item.displayFont) || 'Playfair Display'
        const bodyFont = extractFontName(item.bodyFont) || extractFontName(item.body) || 'Inter'
        const headingNode = createBuilderNode({
          id: generateNodeId('heading'),
          type: 'heading',
          label: typeof item.name === 'string' ? item.name : 'Nagłówek pary',
          props: { content: `Nagłówek (${headingFont})`, text: `Nagłówek (${headingFont})` },
          styles: { fontFamily: headingFont, fontSize: '28px', fontWeight: 'bold' },
          children: [],
        })
        const bodyNode = createBuilderNode({
          id: generateNodeId('text'),
          type: 'text',
          label: 'Tekst pary',
          props: { content: `Tekst akapitu w foncie ${bodyFont}.`, text: `Tekst akapitu w foncie ${bodyFont}.` },
          styles: { fontFamily: bodyFont, fontSize: '15px' },
          children: [],
        })
        const containerNode = createBuilderNode({
          id: generateNodeId('container'),
          type: 'container',
          label: `Para Fontów: ${typeof item.name === 'string' ? item.name : headingFont}`,
          props: {},
          styles: { padding: '16px', gap: '8px' },
          children: [headingNode, bodyNode],
        })
        const activePage = doc.pages.find((p: any) => p.id === targetPageId)
        if (activePage && activePage.sections.length > 0) {
          const lastSection = activePage.sections[activePage.sections.length - 1]
          dispatch({
            type: 'INSERT_NODE',
            pageId: targetPageId,
            parentId: lastSection.id,
            node: { ...containerNode, parentId: lastSection.id },
          })
        } else if (activePage) {
          dispatch({
            type: 'INSERT_NODE',
            pageId: targetPageId,
            parentId: null,
            node: { ...containerNode, parentId: null },
          })
        }
        dispatch({
          type: 'CANVAS',
          action: { type: 'SELECT_SECTION', sectionId: containerNode.id, pageId: targetPageId },
        })
      } else if (itemCategory === 'buttons') {
        insertComponent(
          {
            type: 'button',
            label: item.name || 'Przycisk',
            category: 'buttons',
            icon: 'Box',
            schema: [],
            previewable: true,
            allowChildren: false,
            defaultProps: { content: item.name || 'Przycisk' },
            defaultStyles: {
              backgroundColor: item.preview?.bg || item.bg || '#D9A86C',
              color: item.preview?.color || item.color || '#FFFFFF',
              borderRadius: item.preview?.radius || '8px',
              padding: '10px 20px',
            },
          },
          { document: doc, pageId: targetPageId, selectedNodeId: canvas?.selectedSectionId },
          dispatch
        )
      } else if (itemCategory === 'cards') {
        insertComponent(
          {
            type: 'card',
            label: item.name || 'Karta',
            category: 'cards',
            icon: 'Layers',
            schema: [],
            previewable: true,
            allowChildren: false,
            defaultProps: { title: item.name || 'Tytuł Karty', description: item.description || 'Zawartość i opis karty' },
            defaultStyles: { borderRadius: item.borderRadius || '12px', padding: '20px' },
          },
          { document: doc, pageId: targetPageId, selectedNodeId: canvas?.selectedSectionId },
          dispatch
        )
      } else if (itemCategory === 'icons') {
        insertComponent(
          {
            type: 'icon',
            label: item.name || 'Ikona',
            category: 'icons',
            icon: 'Sparkles',
            schema: [],
            previewable: true,
            allowChildren: false,
            defaultProps: { iconName: item.id || item.iconName || 'Sparkles' },
          },
          { document: doc, pageId: targetPageId, selectedNodeId: canvas?.selectedSectionId },
          dispatch
        )
      } else if (itemCategory === 'images') {
        insertComponent(
          {
            type: 'image',
            label: item.name || 'Obraz',
            category: 'images',
            icon: 'Image',
            schema: [],
            previewable: true,
            allowChildren: false,
            defaultProps: {
              src: item.url || item.preview || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
              alt: item.name || 'Obraz',
            },
          },
          { document: doc, pageId: targetPageId, selectedNodeId: canvas?.selectedSectionId },
          dispatch
        )
      } else if (itemCategory === 'sections' || itemCategory === 'hero') {
        dispatch({
          type: 'ADD_SECTION',
          pageId: targetPageId,
          sectionType: itemCategory === 'hero' ? 'hero' : (item.type || 'section'),
          label: item.name || (itemCategory === 'hero' ? 'Sekcja Hero' : 'Sekcja'),
          defaultProps: item.defaultProps || {},
        })
      }
    },
    [dispatch, doc, canvas]
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
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 builder-canvas-scrollbar" data-testid="ds-catalog-list">
        {items.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-6">Brak wyników dla „{query}”.</p>
        )}
        {items.map((item: any) => {
          const ops = getCategoryOperations(category)
          const canApply = ops.canApply
          const canInsert = ops.canInsert

          return (
            <div
              key={item.id}
              data-testid="ds-catalog-item"
              data-item-id={item.id}
              data-category={category}
              draggable={canInsert}
              onDragStart={(e) => {
                if (!canInsert) return
                const compType =
                  category === 'fonts' || category === 'font-pairings' || category === 'typography'
                    ? 'heading'
                    : category === 'buttons'
                    ? 'button'
                    : category === 'cards'
                    ? 'card'
                    : category === 'icons'
                    ? 'icon'
                    : category === 'images'
                    ? 'image'
                    : 'section'

                e.dataTransfer.setData('application/solospot-component-type', compType)
                e.dataTransfer.setData('text/plain', compType)
                if (category === 'fonts' || category === 'font-pairings' || category === 'typography') {
                  const font = item.fontFamily || item.headingFont || item.name
                  e.dataTransfer.setData(
                    'application/solospot-typography-preset',
                    JSON.stringify({
                      type: 'heading',
                      name: item.name || font,
                      defaultText: item.sample || `Tekst w ${font}`,
                      styles: { fontFamily: font },
                    })
                  )
                }
                e.dataTransfer.effectAllowed = 'copy'
              }}
              className={`p-2.5 rounded-xl border bg-white/[0.03] space-y-2 transition-all hover:border-[#D9A86C]/40 ${
                canInsert ? 'cursor-grab active:cursor-grabbing' : ''
              } ${appliedId === item.id ? 'border-[#D9A86C]/70 bg-[#D9A86C]/[0.08]' : 'border-[#3A3A40]'}`}
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
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setPreviewId(item.id)}
                    data-testid="ds-btn-preview"
                    title="Podgląd zasobu"
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border border-[#3A3A40] text-zinc-300 hover:border-white/30 hover:text-white"
                  >
                    <Eye className="w-3 h-3" /> Podgląd
                  </button>
                  {canInsert && (
                    <button
                      onClick={() => insertDesignSystemItem(item, category)}
                      data-testid="ds-btn-insert"
                      title="Wstaw element na canvas"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#3A3A40] text-white hover:bg-zinc-700 border border-white/10"
                    >
                      <Plus className="w-3 h-3" /> Wstaw
                    </button>
                  )}
                  {canApply && (
                    <button
                      onClick={() =>
                        category === 'visual-languages'
                          ? applyVisualLanguage(item.id)
                          : applyDesignSystemItem(item.id, category)
                      }
                      data-testid="ds-btn-apply"
                      title="Zastosuj styl do celu"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#D9A86C] text-white hover:bg-[#c4965a]"
                    >
                      <Check className="w-3 h-3" /> Zastosuj
                    </button>
                  )}
                </div>
              </div>

              {/* Rich Visual Preview Box */}
              <CardVisualPreview item={item} category={category} />

              {/* Tags & Guidance */}
              <div className="flex flex-wrap gap-1 items-center justify-between pt-0.5">
                <div className="flex flex-wrap gap-1">
                  {(item.tags || item.mood || item.recommendedIndustries || [])
                    .slice(0, 3)
                    .map((t: any) => (
                      <span
                        key={String(t)}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400"
                      >
                        {String(t)}
                      </span>
                    ))}
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">
                  {canInsert && canApply ? 'INSERT • APPLY' : canInsert ? 'INSERT' : 'APPLY'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview modal — PREVIEW ≠ APPLY */}
      {previewId && (() => {
        const previewItem = items.find((i: any) => i.id === previewId)
        if (!previewItem) return null
        const ops = getCategoryOperations(category)
        return (
          <div
            className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
            data-testid="ds-preview-modal"
            onClick={() => setPreviewId(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#3A3A40] bg-[#18181B] overflow-hidden shadow-2xl space-y-0"
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
                <CardVisualPreview item={previewItem} category={category} />
                <div className="rounded-xl p-3 border border-white/10 bg-black/30 space-y-2">
                  <div className="text-xs text-zinc-300">
                    {getPreviewDescription(previewItem)}
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
                  Podgląd nie zmienia dokumentu. Użyj „Wstaw”, aby dodać element na canvas, lub „Zastosuj”, aby wdrożyć styl.
                </p>
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#3A3A40]">
                <button
                  onClick={() => setPreviewId(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[#3A3A40] text-zinc-300 hover:text-white"
                >
                  Zamknij
                </button>
                {ops.canInsert && (
                  <button
                    onClick={() => {
                      insertDesignSystemItem(previewItem, category)
                      setPreviewId(null)
                    }}
                    data-testid="ds-btn-insert-from-preview"
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#3A3A40] text-white hover:bg-zinc-700 border border-white/10"
                  >
                    Wstaw
                  </button>
                )}
                {ops.canApply && (
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

