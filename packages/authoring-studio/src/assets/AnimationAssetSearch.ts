/**
 * AnimationAssetSearch.ts — PM42 Asset Search Engine (ETAP 3)
 *
 * Multi-criteria search engine supporting:
 *   - Tag search
 *   - Fuzzy name/description search
 *   - Category search
 *   - Author search
 *   - Version search
 *
 * ZERO Browser API, ZERO DOM.
 */

import type { AnimationAssetItem, AssetRegistryState } from './AnimationAssetRegistry';

export interface AssetSearchCriteria {
  readonly query?: string;
  readonly category?: string;
  readonly tag?: string;
  readonly author?: string;
  readonly version?: string;
}

/**
 * Searches and filters assets in an AssetRegistryState according to search criteria.
 */
export function searchAssets(
  state: AssetRegistryState,
  criteria: AssetSearchCriteria = {}
): ReadonlyArray<AnimationAssetItem> {
  return state.assets.filter((item) => {
    const meta = item.metadata;

    // Filter by Category
    if (criteria.category && meta.category !== criteria.category) {
      return false;
    }

    // Filter by Tag
    if (criteria.tag && !meta.tags.map((t) => t.toLowerCase()).includes(criteria.tag.toLowerCase())) {
      return false;
    }

    // Filter by Author
    if (criteria.author && meta.author.toLowerCase() !== criteria.author.toLowerCase()) {
      return false;
    }

    // Filter by Version
    if (criteria.version && meta.version !== criteria.version) {
      return false;
    }

    // Filter by Text Query (Name, Description, AssetID, Tags)
    if (criteria.query && criteria.query.trim().length > 0) {
      const q = criteria.query.toLowerCase();
      const matchName = meta.name.toLowerCase().includes(q);
      const matchDesc = meta.description.toLowerCase().includes(q);
      const matchId = meta.assetId.toLowerCase().includes(q);
      const matchTag = meta.tags.some((t) => t.toLowerCase().includes(q));

      if (!matchName && !matchDesc && !matchId && !matchTag) {
        return false;
      }
    }

    return true;
  });
}
