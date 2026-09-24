/**
 * DesignSystemRuntime — shared read-only access to packages/design-system
 *
 * Single SSOT for Builder UI and HACP. Never mutates BuilderDocument.
 */

import {
  DesignSystem,
} from '../../../packages/design-system/src/index';

export interface DesignSystemReadResult {
  ok: boolean;
  target: string;
  data?: unknown;
  error?: string;
}

function limitItems<T>(items: T[], limit?: number): T[] {
  const n = typeof limit === 'number' && limit > 0 ? Math.min(limit, 50) : 20;
  return items.slice(0, n);
}

function flattenSearch(query: string, filters: Record<string, unknown>) {
  const results = DesignSystem.search.search(query || '', filters);
  return results.map((r) => ({
    category: r.facets?.categories?.[0]?.value ?? 'unknown',
    total: r.total,
    items: r.items,
  }));
}

export function executeDesignSystemReadTool(
  name: string,
  args: Record<string, unknown>
): DesignSystemReadResult {
  const query = (args.query as string) || '';
  const limit = args.limit as number | undefined;
  const industry = args.industry as string | undefined;
  const mood = args.mood as string | undefined;
  const style = args.style as string | undefined;
  const category = args.category as string | undefined;

  switch (name) {
    case 'search_design_styles': {
      const filters: Record<string, unknown> = {};
      if (category) filters.category = category;
      if (industry) filters.industry = industry;
      if (mood) filters.mood = mood;
      if (style) filters.style = style;
      const buckets = flattenSearch(query, filters).map((b) => ({
        ...b,
        items: limitItems(b.items, limit),
      }));
      return { ok: true, target: 'design-styles', data: { query, buckets } };
    }
    case 'search_style_packs': {
      const filters: Record<string, unknown> = { category: 'style-packs' };
      if (industry) filters.industry = industry;
      if (mood) filters.mood = mood;
      const packs = DesignSystem.search.searchStylePacks(query).filter((p: any) => {
        if (industry && !String(p.industry).includes(industry)) return false;
        if (mood && !(p.mood || []).some((m: string) => m.includes(mood))) return false;
        return true;
      });
      return {
        ok: true,
        target: 'style-packs',
        data: { count: packs.length, stylePacks: limitItems(packs, limit) },
      };
    }
    case 'search_fonts': {
      const fonts = DesignSystem.search.searchFonts(query).filter((f: any) => {
        if (category && !String(f.category).toLowerCase().includes(category.toLowerCase()))
          return false;
        return true;
      });
      return { ok: true, target: 'fonts', data: { count: fonts.length, fonts: limitItems(fonts, limit) } };
    }
    case 'search_font_pairings':
      return {
        ok: true,
        target: 'font-pairings',
        data: {
          fontPairings: limitItems(DesignSystem.search.searchFontPairings(query), limit),
        },
      };
    case 'search_color_palettes': {
      let palettes = DesignSystem.search.searchColorPalettes(query);
      if (industry) {
        palettes = palettes.filter((p: any) =>
          (p.recommendedIndustries || []).some(
            (i: string) => i.toLowerCase().includes(industry.toLowerCase())
          )
        );
      }
      return {
        ok: true,
        target: 'color-palettes',
        data: { count: palettes.length, colorPalettes: limitItems(palettes, limit) },
      };
    }
    case 'search_typography_systems':
      return {
        ok: true,
        target: 'typography',
        data: {
          typographySystems: limitItems(
            DesignSystem.search.searchTypographySystems(query),
            limit
          ),
        },
      };
    case 'search_button_styles':
      return {
        ok: true,
        target: 'buttons',
        data: { buttonStyles: limitItems(DesignSystem.search.searchButtonStyles(query), limit) },
      };
    case 'search_card_styles':
      return {
        ok: true,
        target: 'cards',
        data: { cardStyles: limitItems(DesignSystem.search.searchCardStyles(query), limit) },
      };
    case 'search_backgrounds':
      return {
        ok: true,
        target: 'backgrounds',
        data: { backgrounds: limitItems(DesignSystem.search.searchBackgrounds(query), limit) },
      };
    case 'search_industry_presets': {
      let presets = DesignSystem.search.searchIndustryPresets(query || industry || '');
      if (industry) {
        presets = presets.filter(
          (p: any) =>
            String(p.industry).toLowerCase().includes(industry.toLowerCase()) ||
            p.id.toLowerCase().includes(industry.toLowerCase())
        );
      }
      return {
        ok: true,
        target: 'industry-presets',
        data: { count: presets.length, industryPresets: limitItems(presets, limit) },
      };
    }
    case 'inspect_design_style': {
      const styleId = (args.styleId as string) || '';
      const pack = DesignSystem.stylePacks.find((p) => p.id === styleId);
      const typography = DesignSystem.typographySystems.find((t) => t.id === styleId);
      const palette = DesignSystem.colorPalettes.find((c) => c.id === styleId);
      const found = pack || typography || palette;
      if (!found) {
        return { ok: false, target: styleId, error: `Nie znaleziono stylu "${styleId}".` };
      }
      const compat = DesignSystem.compatibility.generateReport(styleId);
      return {
        ok: true,
        target: styleId,
        data: { style: found, compatibility: compat },
      };
    }
    case 'inspect_style_pack': {
      const packId = (args.packId as string) || '';
      const pack = DesignSystem.search.inspectStylePack(packId);
      if (!pack) {
        return { ok: false, target: packId, error: `Style Pack "${packId}" nie istnieje.` };
      }
      const typography = DesignSystem.typographySystems.find((t) => t.id === pack.typographyId);
      const palette = DesignSystem.colorPalettes.find((c) => c.id === pack.colorPaletteId);
      const radius = DesignSystem.radiusStyles.find((r) => r.id === pack.radiusId);
      const shadow = DesignSystem.shadowStyles.find((s) => s.id === pack.shadowId);
      const background = DesignSystem.backgroundStyles.find((b) => b.id === pack.backgroundId);
      const buttons = DesignSystem.buttonSystems.find((b) => b.id === pack.buttonSystemId);
      const cards = DesignSystem.cardSystems.find((c) => c.id === pack.cardSystemId);
      const compat = DesignSystem.compatibility.generateReport(pack.id);
      return {
        ok: true,
        target: pack.id,
        data: {
          stylePack: pack,
          typography,
          palette,
          radius,
          shadow,
          background,
          buttons,
          cards,
          compatibility: compat,
        },
      };
    }
    default:
      return { ok: false, target: name, error: `Nieznany tool Design System: ${name}` };
  }
}

export function getDesignSystemSnapshot() {
  return {
    version: DesignSystem.version,
    stylePacks: DesignSystem.stylePacks.length,
    industryPresets: DesignSystem.industryPresets.length,
    fonts: DesignSystem.fonts.length,
    colorPalettes: DesignSystem.colorPalettes.length,
    typographySystems: DesignSystem.typographySystems.length,
    buttonSystems: DesignSystem.buttonSystems.length,
    cardSystems: DesignSystem.cardSystems.length,
    backgrounds: DesignSystem.backgroundStyles.length,
  };
}
