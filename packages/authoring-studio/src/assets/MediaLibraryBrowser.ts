/**
 * MediaLibraryBrowser.ts — Sprint S25 Professional Media Library Browser UX
 *
 * Pure, deterministic view-state layer for the professional Asset Browser:
 *   - Grid / List view mode
 *   - Deterministic stable sorting (name, createdAt, updatedAt, fileSize,
 *     dimension, duration, type) with stable tie-breakers by assetId
 *   - Multi-criteria filtering (text search, media type, category, tags,
 *     favorites, collection membership, duration/dimension ranges)
 *   - Multi-selection model (single toggle, anchor-based range, clear)
 *
 * Reuses the S15 `AnimationAssetRegistry` (AssetRegistryState) as the single
 * registry source of truth — NO second asset registry. Reuses
 * `AnimationAssetBrowser` (favorites/recents) and `AnimationAssetSearch`
 * (text search) and `MediaLibraryCollections` (collection membership).
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem, AssetRegistryState } from './AnimationAssetRegistry';
import type { AssetBrowserState } from './AnimationAssetBrowser';
import { searchAssets } from './AnimationAssetSearch';
import { getCollectionsForAsset } from './MediaLibraryCollections';
import { readAssetPayload, detectAssetMediaType, assetMediaTypeLabel, type AssetMediaType } from './assetPayload';

export type MediaLibraryViewMode = 'grid' | 'list';
export type MediaLibrarySortKey =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'fileSize'
  | 'dimension'
  | 'duration'
  | 'type';
export type MediaLibrarySortOrder = 'asc' | 'desc';

export { AssetMediaType };

export interface MediaLibrarySortConfig {
  readonly key: MediaLibrarySortKey;
  readonly order: MediaLibrarySortOrder;
}

export interface MediaLibraryFilterCriteria {
  readonly query?: string;
  readonly mediaTypes?: ReadonlyArray<AssetMediaType>;
  readonly categories?: ReadonlyArray<string>;
  readonly tags?: ReadonlyArray<string>;
  readonly favoriteOnly?: boolean;
  readonly collectionId?: string | null;
  readonly minDurationMs?: number;
  readonly maxDurationMs?: number;
  readonly minWidthPx?: number;
  readonly minHeightPx?: number;
}

export interface MediaLibrarySelectionState {
  readonly selectedAssetIds: ReadonlyArray<string>;
  readonly lastSelectedAssetId: string | null;
  readonly anchorAssetId: string | null;
}

export interface MediaLibraryViewState {
  readonly viewMode: MediaLibraryViewMode;
  readonly sort: MediaLibrarySortConfig;
  readonly filter: MediaLibraryFilterCriteria;
  readonly selection: MediaLibrarySelectionState;
}

export const DEFAULT_MEDIA_LIBRARY_VIEW_STATE: MediaLibraryViewState = {
  viewMode: 'grid' as MediaLibraryViewMode,
  sort: { key: 'updatedAt', order: 'desc' },
  filter: {},
  selection: {
    selectedAssetIds: [],
    lastSelectedAssetId: null,
    anchorAssetId: null,
  },
};

export function createMediaLibraryViewState(
  partial: Partial<MediaLibraryViewState> = {}
): MediaLibraryViewState {
  return {
    ...DEFAULT_MEDIA_LIBRARY_VIEW_STATE,
    ...partial,
    filter: {
      ...DEFAULT_MEDIA_LIBRARY_VIEW_STATE.filter,
      ...partial.filter,
    },
    selection: {
      ...DEFAULT_MEDIA_LIBRARY_VIEW_STATE.selection,
      ...partial.selection,
    },
  };
}

/* ---------------------------------------------------------------------------
 * Selection model
 * ------------------------------------------------------------------------- */

export function selectAsset(
  state: MediaLibrarySelectionState,
  assetId: string,
  multi: boolean = false
): MediaLibrarySelectionState {
  if (!multi) {
    return {
      selectedAssetIds: [assetId],
      lastSelectedAssetId: assetId,
      anchorAssetId: assetId,
    };
  }

  const isSelected = state.selectedAssetIds.includes(assetId);
  const selectedAssetIds = isSelected
    ? state.selectedAssetIds.filter((id) => id !== assetId)
    : [...state.selectedAssetIds, assetId];

  return {
    selectedAssetIds,
    lastSelectedAssetId: assetId,
    anchorAssetId: state.anchorAssetId ?? assetId,
  };
}

/**
 * Anchor-based range selection. Expands the selection between `anchorAssetId`
 * and `assetId` following the provided ordering. Deterministic.
 */
export function selectRange(
  state: MediaLibrarySelectionState,
  assetId: string,
  orderedAssetIds: ReadonlyArray<string>
): MediaLibrarySelectionState {
  const anchor = state.anchorAssetId ?? orderedAssetIds[0] ?? null;
  if (!anchor) {
    return selectAsset(state, assetId, true);
  }

  const anchorIndex = orderedAssetIds.indexOf(anchor);
  const targetIndex = orderedAssetIds.indexOf(assetId);
  if (anchorIndex === -1 || targetIndex === -1) {
    return selectAsset(state, assetId, true);
  }

  const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
  const rangeIds = orderedAssetIds.slice(start, end + 1);
  const merged = new Set<string>([...state.selectedAssetIds, ...rangeIds]);

  return {
    selectedAssetIds: Array.from(merged),
    lastSelectedAssetId: assetId,
    anchorAssetId: anchor,
  };
}

export function clearSelection(): MediaLibrarySelectionState {
  return {
    selectedAssetIds: [],
    lastSelectedAssetId: null,
    anchorAssetId: null,
  };
}

export function isAssetSelected(
  state: MediaLibrarySelectionState,
  assetId: string
): boolean {
  return state.selectedAssetIds.includes(assetId);
}

/* ---------------------------------------------------------------------------
 * Filtering
 * ------------------------------------------------------------------------- */

function matchesMediaType(
  item: AnimationAssetItem,
  types: ReadonlyArray<AssetMediaType>
): boolean {
  const kind = detectAssetMediaType(item);
  return types.map(assetMediaTypeLabel).includes(assetMediaTypeLabel(kind));
}

function matchesDimensionRange(
  item: AnimationAssetItem,
  minWidthPx?: number,
  minHeightPx?: number
): boolean {
  if (minWidthPx === undefined && minHeightPx === undefined) return true;
  const { extracted } = readAssetPayload(item);
  const w = extracted?.widthPx;
  const h = extracted?.heightPx;
  if (w === undefined || h === undefined) return false;
  return (
    (minWidthPx === undefined || w >= minWidthPx) &&
    (minHeightPx === undefined || h >= minHeightPx)
  );
}

function matchesDurationRange(
  item: AnimationAssetItem,
  minDurationMs?: number,
  maxDurationMs?: number
): boolean {
  if (minDurationMs === undefined && maxDurationMs === undefined) return true;
  const { extracted } = readAssetPayload(item);
  const durationMs: number | undefined =
    extracted?.durationMs ?? item.metadata.preview.durationMs;
  if (durationMs === undefined) return false;
  return (
    (minDurationMs === undefined || durationMs >= minDurationMs) &&
    (maxDurationMs === undefined || durationMs <= maxDurationMs)
  );
}

/**
 * Filters the registry against multi-criteria criteria. Reuses
 * `searchAssets` for the free-text query. Category/tag filtering is applied
 * on top of the search result. Order of `registryState.assets` is preserved
 * in the output (sorting pass orders afterward).
 */
export function filterAssets(
  registryState: AssetRegistryState,
  criteria: MediaLibraryFilterCriteria,
  collectionsState?: {
    collections: ReadonlyArray<{ id: string; assetIds: ReadonlyArray<string> }>;
  }
): ReadonlyArray<AnimationAssetItem> {
  // Reuse the existing text search engine for the free-text query.
  const viaSearch = searchAssets(registryState, {
    query: criteria.query,
    category: undefined,
    tag: undefined,
    author: undefined,
    version: undefined,
  });

  return viaSearch.filter((item) => {
    if (criteria.categories && !criteria.categories.includes(item.metadata.category)) {
      return false;
    }

    if (
      criteria.mediaTypes &&
      criteria.mediaTypes.length > 0 &&
      !matchesMediaType(item, criteria.mediaTypes)
    ) {
      return false;
    }

    if (criteria.tags && criteria.tags.length > 0) {
      const lowerTags = criteria.tags.map((t) => t.toLowerCase());
      if (!item.metadata.tags.some((t) => lowerTags.includes(t.toLowerCase()))) {
        return false;
      }
    }

    if (criteria.collectionId && collectionsState) {
      const memberOf = getCollectionsForAsset(collectionsState, item.metadata.assetId);
      if (!memberOf.includes(criteria.collectionId)) {
        return false;
      }
    }

    if (!matchesDimensionRange(item, criteria.minWidthPx, criteria.minHeightPx)) {
      return false;
    }

    if (!matchesDurationRange(item, criteria.minDurationMs, criteria.maxDurationMs)) {
      return false;
    }

    return true;
  });
}

/**
 * Filters a collection of items through the browser favorites set (favorites
 * are stored on `AnimationAssetBrowser` state, not on the registry).
 */
export function applyFavoriteFilter(
  items: ReadonlyArray<AnimationAssetItem>,
  browserState: AssetBrowserState
): ReadonlyArray<AnimationAssetItem> {
  return items.filter((item) =>
    browserState.favoriteAssetIds.includes(item.metadata.assetId)
  );
}

/* ---------------------------------------------------------------------------
 * Deterministic stable sorting
 * ------------------------------------------------------------------------- */

function sortKeyCompare(
  a: AnimationAssetItem,
  b: AnimationAssetItem,
  key: MediaLibrarySortKey
): number {
  const ma = a.metadata;
  const mb = b.metadata;

  let cmp = 0;
  switch (key) {
    case 'name':
      cmp = ma.name.localeCompare(mb.name);
      break;
    case 'createdAt':
      cmp = ma.createdAt - mb.createdAt;
      break;
    case 'updatedAt':
      cmp = ma.updatedAt - mb.updatedAt;
      break;
    case 'fileSize': {
      const sa = readAssetPayload(a).fileSizeBytes ?? 0;
      const sb = readAssetPayload(b).fileSizeBytes ?? 0;
      cmp = sa - sb;
      break;
    }
    case 'duration': {
      const da = readAssetPayload(a).extracted?.durationMs ?? ma.preview.durationMs ?? 0;
      const db = readAssetPayload(b).extracted?.durationMs ?? mb.preview.durationMs ?? 0;
      cmp = da - db;
      break;
    }
    case 'dimension': {
      const pa = readAssetPayload(a).extracted;
      const pb = readAssetPayload(b).extracted;
      const wa = (pa?.widthPx ?? 0) * (pa?.heightPx ?? 0);
      const wb = (pb?.widthPx ?? 0) * (pb?.heightPx ?? 0);
      cmp = wa - wb;
      break;
    }
    case 'type': {
      const ta = assetMediaTypeLabel(detectAssetMediaType(a));
      const tb = assetMediaTypeLabel(detectAssetMediaType(b));
      cmp = ta.localeCompare(tb);
      break;
    }
    default:
      cmp = 0;
  }

  // Deterministic tie-breaker: by assetId so equal keys are reproducible.
  if (cmp === 0) {
    return ma.assetId.localeCompare(mb.assetId);
  }
  return cmp;
}

function stableSort(
  items: ReadonlyArray<AnimationAssetItem>,
  compare: (a: AnimationAssetItem, b: AnimationAssetItem) => number
): AnimationAssetItem[] {
  // Decorate with original index to guarantee stability regardless of engine.
  const decorated = items.map((item, index) => ({ item, index }));
  decorated.sort((x, y) => {
    const c = compare(x.item, y.item);
    if (c !== 0) return c;
    return x.index - y.index;
  });
  return decorated.map((d) => d.item);
}

/**
 * Returns a deterministically sorted copy of the items according to `config`.
 */
export function sortAssets(
  items: ReadonlyArray<AnimationAssetItem>,
  config: MediaLibrarySortConfig
): AnimationAssetItem[] {
  const { key, order } = config;
  const sorted = stableSort(items, (a, b) => sortKeyCompare(a, b, key));
  return order === 'asc' ? sorted : sorted.reverse();
}

/**
 * Applies a full browser pipeline: search/text → category/tag → media type →
 * collection → duration/dimension ranges → favorite → sort. Returns a NEW
 * ordered array (no mutation of inputs).
 */
export function resolveViewItems(
  registryState: AssetRegistryState,
  view: MediaLibraryViewState,
  browserState?: AssetBrowserState,
  collectionsState?: {
    collections: ReadonlyArray<{ id: string; assetIds: ReadonlyArray<string> }>;
  }
): AnimationAssetItem[] {
  const filtered = filterAssets(registryState, view.filter, collectionsState);
  let items: ReadonlyArray<AnimationAssetItem> = filtered;
  if (view.filter.favoriteOnly && browserState) {
    items = applyFavoriteFilter(items, browserState);
  }
  return sortAssets(items, view.sort);
}