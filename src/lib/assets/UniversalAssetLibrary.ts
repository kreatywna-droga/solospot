/**
 * UniversalAssetLibrary.ts
 *
 * Aggregates all 12 curated asset categories (534+ license-cleared assets)
 * and provides high-performance indexed queries, tag searching, and semantic candidate getters.
 */

import type {
  UniversalAsset,
  VisualAssetCategory,
  AssetFilterOptions,
  VisualAssetMood,
  VisualAssetStyle,
  AssetOrientation,
} from './AssetTypes';

import { PEOPLE_ASSETS } from './data/people-assets';
import { BUSINESS_ASSETS } from './data/business-assets';
import { TECH_ASSETS } from './data/tech-assets';
import { PRODUCT_ASSETS } from './data/product-assets';
import { ARCHITECTURE_ASSETS } from './data/architecture-assets';
import { NATURE_ASSETS } from './data/nature-assets';
import { CREATIVE_ASSETS } from './data/creative-assets';
import { TRAVEL_ASSETS } from './data/travel-assets';
import { FOOD_ASSETS } from './data/food-assets';
import { BACKGROUND_ASSETS } from './data/background-assets';
import { VIDEO_ASSETS } from './data/video-assets';
import { SPATIAL3D_ASSETS } from './data/spatial3d-assets';

export const ALL_CURATED_ASSETS: UniversalAsset[] = [
  ...PEOPLE_ASSETS,
  ...BUSINESS_ASSETS,
  ...TECH_ASSETS,
  ...PRODUCT_ASSETS,
  ...ARCHITECTURE_ASSETS,
  ...NATURE_ASSETS,
  ...CREATIVE_ASSETS,
  ...TRAVEL_ASSETS,
  ...FOOD_ASSETS,
  ...BACKGROUND_ASSETS,
  ...VIDEO_ASSETS,
  ...SPATIAL3D_ASSETS,
];

// In-memory indexing for O(1) ID access and fast category queries
const ASSET_BY_ID = new Map<string, UniversalAsset>();
const ASSETS_BY_CATEGORY = new Map<string, UniversalAsset[]>();

for (const asset of ALL_CURATED_ASSETS) {
  ASSET_BY_ID.set(asset.id, asset);
  const cat = asset.category || 'other';
  let catList = ASSETS_BY_CATEGORY.get(cat);
  if (!catList) {
    catList = [];
    ASSETS_BY_CATEGORY.set(cat, catList);
  }
  catList.push(asset);
}

/**
 * Get total asset count in the curated library
 */
export function getTotalAssetCount(): number {
  return ALL_CURATED_ASSETS.length;
}

/**
 * Get count breakdown by category
 */
export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  ASSETS_BY_CATEGORY.forEach((list, cat) => {
    counts[cat] = list.length;
  });
  return counts;
}

/**
 * Retrieve a specific asset by its canonical ID (e.g. 'ast-peo-001')
 */
export function getAssetById(id: string): UniversalAsset | undefined {
  return ASSET_BY_ID.get(id);
}

/**
 * Retrieve all assets in a specific category
 */
export function getAssetsByCategory(category: VisualAssetCategory | string): UniversalAsset[] {
  return ASSETS_BY_CATEGORY.get(category) || [];
}

/**
 * Comprehensive search & filter across the entire Universal Asset Library
 */
export function queryAssets(filters: AssetFilterOptions = {}): UniversalAsset[] {
  const {
    query,
    category,
    visualCategory,
    type,
    mood,
    style,
    industry,
    orientation,
    tags,
    limit,
    offset = 0,
  } = filters;

  const targetCategory = visualCategory || (category !== 'all' ? category : undefined);

  let pool: UniversalAsset[];
  if (targetCategory && targetCategory !== 'all' && ASSETS_BY_CATEGORY.has(targetCategory)) {
    pool = ASSETS_BY_CATEGORY.get(targetCategory)!;
  } else {
    pool = ALL_CURATED_ASSETS;
  }

  const queryTerms = query
    ? query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0)
    : [];

  const results = pool.filter((asset) => {
    // Media type filter
    if (type && type !== 'all' && asset.type !== type) {
      return false;
    }

    // Orientation filter
    if (orientation && asset.orientation !== orientation) {
      return false;
    }

    // Mood filter
    if (mood && asset.mood && asset.mood !== mood) {
      return false;
    }

    // Style filter
    if (style && asset.style && asset.style !== style) {
      return false;
    }

    // Industry filter
    if (industry && asset.industry && !asset.industry.includes(industry.toLowerCase())) {
      return false;
    }

    // Tag list filter
    if (tags && tags.length > 0) {
      const assetTags = asset.tags || [];
      const hasAllTags = tags.every((t: string) => assetTags.includes(t.toLowerCase()));
      if (!hasAllTags) return false;
    }

    // Search query matching across title, author, subcategory, and tags
    if (queryTerms.length > 0) {
      const searchableString = [
        asset.title || '',
        asset.author || '',
        asset.subcategory || '',
        asset.category || '',
        asset.mood || '',
        asset.style || '',
        ...(asset.tags || []),
        ...(asset.industry || []),
      ]
        .join(' ')
        .toLowerCase();

      const matchesAllTerms = queryTerms.every((term) => searchableString.includes(term));
      if (!matchesAllTerms) return false;
    }

    return true;
  });

  if (limit !== undefined && limit > 0) {
    return results.slice(offset, offset + limit);
  }

  return offset > 0 ? results.slice(offset) : results;
}

/**
 * Get hero image candidates best suited for an industry and style
 */
export function getHeroCandidates(industry?: string, style?: string): UniversalAsset[] {
  return queryAssets({
    orientation: 'landscape',
    type: 'image',
    industry,
    style: style as VisualAssetStyle,
    limit: 20,
  });
}

/**
 * Get team / portrait candidates
 */
export function getTeamCandidates(roleOrIndustry?: string): UniversalAsset[] {
  return queryAssets({
    visualCategory: 'people',
    industry: roleOrIndustry,
    limit: 30,
  });
}

/**
 * Get product shot candidates
 */
export function getProductCandidates(industry?: string): UniversalAsset[] {
  return queryAssets({
    visualCategory: 'product',
    industry,
    limit: 20,
  });
}

/**
 * Get atmospheric background candidates (images and videos)
 */
export function getBackgroundCandidates(mood?: string, style?: string): UniversalAsset[] {
  const backgrounds = queryAssets({
    visualCategory: 'background',
    mood: mood as VisualAssetMood,
    style: style as VisualAssetStyle,
    orientation: 'landscape',
  });
  const videos = queryAssets({
    visualCategory: 'video',
    orientation: 'landscape',
  });
  return [...backgrounds, ...videos];
}
