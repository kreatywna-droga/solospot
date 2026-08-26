import { describe, it, expect } from 'vitest';
import { createAssetRegistryState, type AnimationAssetItem } from '../AnimationAssetRegistry';
import { createAssetBrowserState } from '../AnimationAssetBrowser';
import {
  createMediaLibraryViewState,
  resolveViewItems,
  filterAssets,
  sortAssets,
  selectAsset,
  selectRange,
  clearSelection,
  isAssetSelected,
  applyFavoriteFilter,
} from '../MediaLibraryBrowser';
import {
  createMediaLibraryCollectionsState,
  createCollection,
  addCollection,
  addAssetToCollection,
  type MediaCollection,
} from '../MediaLibraryCollections';

function makeAsset(
  assetId: string,
  name: string,
  category: 'preset' | 'template' | 'vector_graphics' | 'sound_effect' | 'custom',
  tags: string[],
  opts: {
    mimeType?: string; fileSizeBytes?: number; thumbnailUri?: string;
    durationMs?: number; widthPx?: number; heightPx?: number;
  } = {}
): AnimationAssetItem {
  return {
    metadata: {
      assetId, name, description: '', category, tags,
      preview: { thumbnailUri: opts.thumbnailUri, durationMs: opts.durationMs },
      version: '1.0.0', author: 'user', createdAt: 1000, updatedAt: 1000,
    },
    payloadRef: {
      mimeType: opts.mimeType, fileSizeBytes: opts.fileSizeBytes, sourceUri: opts.thumbnailUri,
      extracted: { widthPx: opts.widthPx, heightPx: opts.heightPx, durationMs: opts.durationMs },
    },
  };
};

const registry = createAssetRegistryState([
  makeAsset('a_img', 'Image.png', 'vector_graphics', ['png', 'banner'], {
    mimeType: 'image/png', fileSizeBytes: 2048, widthPx: 1920, heightPx: 1080,
  }),
  makeAsset('a_aud', 'Boom.mp3', 'sound_effect', ['sfx', 'impact'], {
    mimeType: 'audio/mpeg', fileSizeBytes: 128000, durationMs: 5000,
  }),
  makeAsset('a_vid', 'Clip.mp4', 'custom', ['video', 'hero'], {
    mimeType: 'video/mp4', fileSizeBytes: 5_000_000, durationMs: 10000, widthPx: 1280, heightPx: 720,
  }),
]);

describe('MediaLibraryBrowserUX (S25)', () => {
    it('sorts by name asc/desc with stable assetId tie-break', () => {
    const asc = resolveViewItems(registry, createMediaLibraryViewState({ sort: { key: 'name', order: 'asc' } }));
    // 'Boom.mp3' < 'Clip.mp4' < 'Image.png'
    expect(asc.map((a) => a.metadata.assetId)).toEqual(['a_aud', 'a_vid', 'a_img']);
    const desc = resolveViewItems(registry, createMediaLibraryViewState({ sort: { key: 'name', order: 'desc' } }));
    expect(desc.map((a) => a.metadata.assetId)).toEqual(['a_img', 'a_vid', 'a_aud']);
  });

  it('sorts by file size deterministically (asc/desc)', () => {
    expect(sortAssets(registry.assets, { key: 'fileSize', order: 'asc' }).map((a) => a.metadata.assetId))
      .toEqual(['a_img', 'a_aud', 'a_vid']);
    expect(sortAssets(registry.assets, { key: 'fileSize', order: 'desc' }).map((a) => a.metadata.assetId))
      .toEqual(['a_vid', 'a_aud', 'a_img']);
  });

  it('sorts by duration deterministically', () => {
    expect(sortAssets(registry.assets, { key: 'duration', order: 'asc' }).map((a) => a.metadata.assetId))
      .toEqual(['a_img', 'a_aud', 'a_vid']);
  });

  it('sorts by type deterministically', () => {
    expect(sortAssets(registry.assets, { key: 'type', order: 'asc' }).map((a) => a.metadata.assetId))
      .toEqual(['a_aud', 'a_img', 'a_vid']);
  });

  it('filters by text query reusing searchAssets', () => {
    expect(filterAssets(registry, { query: 'clip' }).map((a) => a.metadata.assetId)).toEqual(['a_vid']);
  });

  it('filters by media type', () => {
    expect(filterAssets(registry, { mediaTypes: ['audio'] }).map((a) => a.metadata.assetId)).toEqual(['a_aud']);
  });

  it('filters by category', () => {
    expect(filterAssets(registry, { categories: ['vector_graphics'] }).map((a) => a.metadata.assetId)).toEqual(['a_img']);
  });

  it('filters by tag', () => {
    expect(filterAssets(registry, { tags: ['banner'] }).map((a) => a.metadata.assetId)).toEqual(['a_img']);
  });

  it('filters by duration range', () => {
    expect(filterAssets(registry, { minDurationMs: 6000 }).map((a) => a.metadata.assetId)).toEqual(['a_vid']);
  });

  it('filters by dimension range', () => {
    expect(filterAssets(registry, { minWidthPx: 1280, minHeightPx: 720 }).map((a) => a.metadata.assetId))
      .toEqual(['a_img', 'a_vid']);
  });

    it('filters by collection membership', () => {
    const base = createMediaLibraryCollectionsState();
    const col: MediaCollection = {
      ...createCollection(base, 'c1', 'Hero assets', ''),
      assetIds: ['a_img', 'a_vid'],
    };
    const withCol = addCollection(base, col);
    expect(filterAssets(registry, { collectionId: 'c1' }, withCol).map((a) => a.metadata.assetId))
      .toEqual(['a_img', 'a_vid']);
  });

  it('applies favorite filter via browser state', () => {
    const browser = createAssetBrowserState({ favoriteAssetIds: ['a_vid'] });
    const view = createMediaLibraryViewState({ filter: { favoriteOnly: true } });
    expect(resolveViewItems(registry, view, browser, undefined).map((a) => a.metadata.assetId)).toEqual(['a_vid']);
  });

  it('selects a single asset', () => {
    const s = selectAsset({ selectedAssetIds: [], lastSelectedAssetId: null, anchorAssetId: null }, 'a_img');
    expect(isAssetSelected(s, 'a_img')).toBe(true);
    expect(s.lastSelectedAssetId).toBe('a_img');
  });

  it('toggles multi-selection', () => {
    let s = selectAsset({ selectedAssetIds: [], lastSelectedAssetId: null, anchorAssetId: null }, 'a_img');
    s = selectAsset(s, 'a_vid', true);
    expect(s.selectedAssetIds).toEqual(['a_img', 'a_vid']);
    s = selectAsset(s, 'a_img', true);
    expect(s.selectedAssetIds).toEqual(['a_vid']);
  });

  it('selects a deterministic range from anchor', () => {
    const ordered = ['a_img', 'a_aud', 'a_vid'];
    let s = selectAsset({ selectedAssetIds: [], lastSelectedAssetId: null, anchorAssetId: null }, 'a_img');
    s = selectRange(s, 'a_vid', ordered);
    expect(s.selectedAssetIds).toEqual(['a_img', 'a_aud', 'a_vid']);
  });

  it('clears selection', () => {
    let s = selectAsset({ selectedAssetIds: [], lastSelectedAssetId: null, anchorAssetId: null }, 'a_img');
    s = clearSelection();
    expect(s.selectedAssetIds).toEqual([]);
    expect(s.anchorAssetId).toBeNull();
  });

  it('applyFavoriteFilter restricts to favorite ids', () => {
    const browser = createAssetBrowserState({ favoriteAssetIds: ['a_img', 'a_aud'] });
    const result = applyFavoriteFilter(registry.assets, browser);
    expect(result.map((a) => a.metadata.assetId).sort()).toEqual(['a_aud', 'a_img']);
  });

  it('addAssetToCollection is idempotent', () => {
    let state = createMediaLibraryCollectionsState();
    state = addCollection(state, { ...createCollection(state, 'c1', 'c', ''), assetIds: [] });
    state = addAssetToCollection(state, 'c1', 'a1');
    state = addAssetToCollection(state, 'c1', 'a1');
    expect(state.collections[0].assetIds).toEqual(['a1']);
  });
});
