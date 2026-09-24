/**
 * Style Search — Comprehensive Style Search Engine
 *
 * Real catalog search with category + metadata filters.
 * Single SSOT used by Builder UI and HACP tools.
 */

import type { SearchFilters, SearchResult, SearchFacets, FacetCount } from '../types';

export interface StyleSearchCatalogs {
  fonts?: any[];
  fontPairings?: any[];
  colorPalettes?: any[];
  typographySystems?: any[];
  buttonSystems?: any[];
  cardSystems?: any[];
  designThemes?: any[];
  stylePacks?: any[];
  industryPresets?: any[];
  backgrounds?: any[];
  radiusStyles?: any[];
  shadowStyles?: any[];
  spacingStyles?: any[];
  sectionStyles?: any[];
  heroStyles?: any[];
  imageStyles?: any[];
  iconStyles?: any[];
  effectStyles?: any[];
}

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
  searchStylePacks(query: string): any[];
  inspectStylePack(id: string): any;
}

function matchQuery(item: any, q: string): boolean {
  if (!q) return true;
  const hay = [
    item?.id,
    item?.name,
    item?.description,
    item?.style,
    item?.styleName,
    item?.industry,
    item?.category,
    Array.isArray(item?.tags) ? item.tags.join(' ') : '',
    Array.isArray(item?.mood) ? item.mood.join(' ') : '',
    Array.isArray(item?.recommendedIndustries) ? item.recommendedIndustries.join(' ') : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function matchFilters(item: any, filters: Record<string, unknown>): boolean {
  const industry = filters.industry as string | undefined;
  const mood = filters.mood as string | undefined;
  const style = filters.style as string | undefined;
  const category = filters.category as string | undefined;
  const tags = filters.tags as string[] | undefined;
  const useCase = filters.useCase as string | undefined;

  if (industry) {
    const ind = String(item?.industry ?? item?.category ?? '').toLowerCase();
    const rec = Array.isArray(item?.recommendedIndustries)
      ? item.recommendedIndustries.map((s: unknown) => String(s).toLowerCase())
      : [];
    const best = Array.isArray(item?.bestIndustries)
      ? item.bestIndustries.map((s: unknown) => String(s).toLowerCase())
      : [];
    const metaInd = Array.isArray(item?.metadata?.bestIndustries)
      ? (item.metadata.bestIndustries as unknown[]).map((s) => String(s).toLowerCase())
      : [];
    const i = industry.toLowerCase();
    if (![ind, ...rec, ...best, ...metaInd].some((x) => x.includes(i) || i.includes(x))) {
      return false;
    }
  }

  if (mood) {
    const m = mood.toLowerCase();
    const moods = Array.isArray(item?.mood) ? item.mood.map((s: unknown) => String(s).toLowerCase()) : [];
    const tagsM = Array.isArray(item?.tags) ? item.tags.map((s: unknown) => String(s).toLowerCase()) : [];
    if (![...moods, ...tagsM].some((x) => x.includes(m) || m.includes(x))) return false;
  }

  if (style) {
    const s = style.toLowerCase();
    const styles = [
      item?.style,
      item?.styleName,
      item?.subcategory,
      item?.category,
    ]
      .filter(Boolean)
      .map((x: unknown) => String(x).toLowerCase());
    if (!styles.some((x: string) => x.includes(s) || s.includes(x))) return false;
  }

  if (category) {
    const c = category.toLowerCase();
    const cats = [item?.category, item?.type, item?.style]
      .filter(Boolean)
      .map((x: unknown) => String(x).toLowerCase());
    if (!cats.some((x: string) => x.includes(c) || c.includes(x))) return false;
  }

  if (tags?.length) {
    const itemTags = (Array.isArray(item?.tags) ? item.tags : []).map((t: unknown) =>
      String(t).toLowerCase()
    );
    if (!tags.every((t) => itemTags.includes(t.toLowerCase()))) return false;
  }

  if (useCase) {
    const u = useCase.toLowerCase();
    const cases = [
      ...(Array.isArray(item?.bestUseCases) ? item.bestUseCases : []),
      ...(Array.isArray(item?.goodUseCases) ? item.goodUseCases : []),
      ...(Array.isArray(item?.metadata?.goodUseCases) ? (item.metadata.goodUseCases as unknown[]) : []),
      item?.description,
    ]
      .filter(Boolean)
      .map((x: unknown) => String(x).toLowerCase());
    if (!cases.some((x) => x.includes(u) || u.includes(x))) return false;
  }

  return true;
}

function bucket(items: any[], category: string): SearchResult<any> | null {
  if (!items.length) return null;
  return {
    items,
    total: items.length,
    facets: {
      categories: [{ value: category, count: items.length }],
      styles: [],
      industries: [],
      moods: [],
      tags: [],
    },
  };
}

export function createStyleSearch(
  fonts: any[],
  fontPairings: any[],
  colorPalettes: any[],
  typographySystems: any[],
  buttonSystems: any[],
  cardSystems: any[],
  designThemes: any[],
  stylePacks: any[],
  extra: StyleSearchCatalogs = {}
): StyleSearch {
  const industryPresets = extra.industryPresets ?? [];
  const backgrounds = extra.backgrounds ?? [];
  const radiusStyles = extra.radiusStyles ?? [];
  const shadowStyles = extra.shadowStyles ?? [];
  const spacingStyles = extra.spacingStyles ?? [];
  const sectionStyles = extra.sectionStyles ?? [];
  const heroStyles = extra.heroStyles ?? [];
  const imageStyles = extra.imageStyles ?? [];
  const iconStyles = extra.iconStyles ?? [];
  const effectStyles = extra.effectStyles ?? [];

  const filterList = (list: any[], q: string, filters: Record<string, unknown>) =>
    list.filter((item) => matchQuery(item, q) && matchFilters(item, filters));

  return {
    search(query: string, filters: Record<string, unknown> = {}): SearchResult<any>[] {
      const q = (query || '').toLowerCase().trim();
      const categoryFilter = filters.category as string | undefined;
      const results: SearchResult<any>[] = [];

      const maybePush = (items: any[], category: string) => {
        if (categoryFilter && categoryFilter.toLowerCase() !== category.toLowerCase()) return;
        const b = bucket(items, category);
        if (b) results.push(b);
      };

      maybePush(filterList(stylePacks, q, filters), 'style-packs');
      maybePush(filterList(industryPresets, q, filters), 'industry-presets');
      maybePush(filterList(fonts, q, filters), 'fonts');
      maybePush(filterList(fontPairings, q, filters), 'font-pairings');
      maybePush(filterList(typographySystems, q, filters), 'typography');
      maybePush(filterList(colorPalettes, q, filters), 'colors');
      maybePush(filterList(buttonSystems, q, filters), 'buttons');
      maybePush(filterList(cardSystems, q, filters), 'cards');
      maybePush(filterList(backgrounds, q, filters), 'backgrounds');
      maybePush(filterList(designThemes, q, filters), 'themes');
      maybePush(filterList(radiusStyles, q, filters), 'radius');
      maybePush(filterList(shadowStyles, q, filters), 'shadows');
      maybePush(filterList(spacingStyles, q, filters), 'spacing');
      maybePush(filterList(sectionStyles, q, filters), 'sections');
      maybePush(filterList(heroStyles, q, filters), 'hero');
      maybePush(filterList(imageStyles, q, filters), 'images');
      maybePush(filterList(iconStyles, q, filters), 'icons');
      maybePush(filterList(effectStyles, q, filters), 'effects');

      return results;
    },
    searchFonts(query: string): any[] {
      return filterList(fonts, query.toLowerCase(), {});
    },
    searchFontPairings(query: string): any[] {
      return filterList(fontPairings, query.toLowerCase(), {});
    },
    searchColorPalettes(query: string): any[] {
      return filterList(colorPalettes, query.toLowerCase(), {});
    },
    searchTypographySystems(query: string): any[] {
      return filterList(typographySystems, query.toLowerCase(), {});
    },
    searchButtonStyles(query: string): any[] {
      return filterList(buttonSystems, query.toLowerCase(), {});
    },
    searchCardStyles(query: string): any[] {
      return filterList(cardSystems, query.toLowerCase(), {});
    },
    searchBackgrounds(query: string): any[] {
      return filterList(backgrounds, query.toLowerCase(), {});
    },
    searchIndustryPresets(query: string): any[] {
      return filterList(industryPresets, query.toLowerCase(), {});
    },
    searchStylePacks(query: string): any[] {
      return filterList(stylePacks, query.toLowerCase(), {});
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

  const bump = (arr: FacetCount[], value: string) => {
    const existing = arr.find((f) => f.value === value);
    if (existing) existing.count += 1;
    else arr.push({ value, count: 1 });
  };

  for (const result of results) {
    for (const item of result.items ?? []) {
      if (item.category) bump(facets.categories, String(item.category));
      if (item.style) bump(facets.styles, String(item.style));
      if (item.styleName) bump(facets.styles, String(item.styleName));
      if (item.industry) bump(facets.industries, String(item.industry));
      if (Array.isArray(item.mood)) for (const m of item.mood) bump(facets.moods, String(m));
      if (Array.isArray(item.tags)) for (const t of item.tags) bump(facets.tags, String(t));
    }
  }

  return facets;
}

export default createStyleSearch([], [], [], [], [], [], [], []);
