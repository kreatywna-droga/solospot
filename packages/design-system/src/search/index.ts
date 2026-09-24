/**
 * Style Search — Comprehensive Style Search Engine
 *
 * Provides search functionality across all design system elements.
 */

import type { SearchFilters, SearchResult, SearchFacets, FacetCount } from '../types';

export interface StyleSearch {
  search(query: string, filters?: Record<string, unknown>): SearchResult<any>[];
  searchFonts(query: string): any[];
  searchFontPairings(query: string): any[];
  searchColorPalettes(query: string): any[];
  searchTypographySystems(query: string): any[];
  searchButtonStyles(query: string): any[];
  searchCardStyles(query: string): any[];
  searchBackgrounds(query: string): any[];
  searchIndustryPresets(query: string): any[];
  inspectStylePack(id: string): any;
  inspectStylePack(id: string): any;
}

export function createStyleSearch(
  fonts: any[],
  fontPairings: any[],
  colorPalettes: any[],
  typographySystems: any[],
  buttonSystems: any[],
  cardSystems: any[],
  designThemes: any[],
  stylePacks: any[]
): StyleSearch {
  return {
    search(query: string, filters: Record<string, unknown> = {}): SearchResult<any>[] {
      const q = query.toLowerCase();
      const results: SearchResult<any>[] = [];

      // Search style packs
      const matchingPacks = stylePacks.filter(
        (pack: any) =>
          pack.name.toLowerCase().includes(q) ||
          pack.description.toLowerCase().includes(q) ||
          pack.tags.some((t: string) => t.toLowerCase().includes(q)) ||
          pack.industry?.toLowerCase().includes(q) ||
          pack.mood?.some((m: string) => m.toLowerCase().includes(q))
      );

      if (matchingPacks.length > 0) {
        results.push({
          items: matchingPacks,
          total: matchingPacks.length,
          facets: { categories: [], styles: [], industries: [], moods: [], tags: [] },
        });
      }

      // Search fonts
      const matchingFonts = fonts.filter(
        (f: any) =>
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.tags.some((t: string) => t.toLowerCase().includes(q))
      );

      if (matchingFonts.length > 0) {
        results.push({
          items: matchingFonts,
          total: matchingFonts.length,
          facets: { categories: [], styles: [], industries: [], moods: [], tags: [] },
        });
      }

      // Search typography systems
      const matchingTypography = typographySystems.filter(
        (t: any) =>
          t.name.toLowerCase().includes(q) ||
          t.style.toLowerCase().includes(q)
      );

      if (matchingTypography.length > 0) {
        results.push({
          items: matchingTypography,
          total: matchingTypography.length,
          facets: { categories: [], styles: [], industries: [], moods: [], tags: [] },
        });
      }

      // Search color palettes
      const matchingColors = colorPalettes.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          c.style.toLowerCase().includes(q)
      );

      if (matchingColors.length > 0) {
        results.push({
          items: matchingColors,
          total: matchingColors.length,
          facets: { categories: [], styles: [], industries: [], moods: [], tags: [] },
        });
      }

      // Search button styles
      const matchingButtons = buttonSystems.filter(
        (b: any) =>
          b.name.toLowerCase().includes(q) ||
          b.styleName.toLowerCase().includes(q)
      );

      if (matchingButtons.length > 0) {
        results.push({
          items: matchingButtons,
          total: matchingButtons.length,
          facets: { categories: [], styles: [], industries: [], moods: [], tags: [] },
        });
      }

      // Search card styles
      const matchingCards = cardSystems.filter(
        (c: any) =>
          c.name.toLowerCase().includes(q) ||
          c.styleName.toLowerCase().includes(q)
      );

      if (matchingCards.length > 0) {
        results.push({
          items: matchingCards,
          total: matchingCards.length,
          facets: { categories: [], styles: [], industries: [], moods: [], tags: [] },
        });
      }

      return results;
    },
    searchFonts(query: string): any[] {
      return fonts.filter(
        (f: any) => f.name.toLowerCase().includes(query.toLowerCase())
      );
    },
    searchFontPairings(query: string): any[] {
      return fontPairings.filter(
        (p: any) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.displayFont.name.toLowerCase().includes(query.toLowerCase())
      );
    },
    searchColorPalettes(query: string): any[] {
      return colorPalettes.filter(
        (c: any) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.style.toLowerCase().includes(query.toLowerCase())
      );
    },
    searchTypographySystems(query: string): any[] {
      return typographySystems.filter(
        (t: any) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.style.toLowerCase().includes(query.toLowerCase())
      );
    },
    searchButtonStyles(query: string): any[] {
      return buttonSystems.filter(
        (b: any) =>
          b.name.toLowerCase().includes(query.toLowerCase()) ||
          b.styleName.toLowerCase().includes(query.toLowerCase())
      );
    },
    searchCardStyles(query: string): any[] {
      return cardSystems.filter(
        (c: any) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.styleName.toLowerCase().includes(query.toLowerCase())
      );
    },
    searchBackgrounds(query: string): any[] {
      return [];
    },
    searchIndustryPresets(query: string): any[] {
      return [];
    },
    inspectStylePack(id: string): any {
      return stylePacks.find((pack: any) => pack.id === id);
    },
  };
}

export function buildFacets(results: any[]): SearchFacets {
  const facets: SearchFacets = {
    categories: [],
    styles: [],
    industries: [],
    moods: [],
    tags: [],
  };

  for (const result of results) {
    for (const item of result.items) {
      if (item.category && !facets.categories.find((f: FacetCount) => f.value === item.category)) {
        facets.categories.push({ value: item.category, count: 1 });
      }
      if (item.style && !facets.styles.find((f: FacetCount) => f.value === item.style)) {
        facets.styles.push({ value: item.style, count: 1 });
      }
      if (item.industry && !facets.industries.find((f: FacetCount) => f.value === item.industry)) {
        facets.industries.push({ value: item.industry, count: 1 });
      }
      if (item.mood) {
        for (const m of item.mood) {
          if (!facets.moods.find((f: FacetCount) => f.value === m)) {
            facets.moods.push({ value: m, count: 1 });
          }
        }
      }
      if (item.tags) {
        for (const t of item.tags) {
          if (!facets.tags.find((f: FacetCount) => f.value === t)) {
            facets.tags.push({ value: t, count: 1 });
          }
        }
      }
    }
  }

  return facets;
}

export default createStyleSearch([], [], [], [], [], [], [], []);
