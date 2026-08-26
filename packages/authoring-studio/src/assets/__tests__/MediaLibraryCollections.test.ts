import { describe, it, expect } from 'vitest';
import {
  createMediaLibraryCollectionsState,
  createCollection,
  addCollection,
  renameCollection,
  deleteCollection,
  addAssetToCollection,
  removeAssetFromCollection,
  getCollectionsForAsset,
  isInCollection,
  deriveBrowserOnCollectionDelete,
} from '../MediaLibraryCollections';
import { createAssetBrowserState } from '../AnimationAssetBrowser';

describe('MediaLibraryCollections (S25)', () => {
  it('creates a collection with metadata', () => {
    const state = createMediaLibraryCollectionsState();
    const col = createCollection(state, 'c1', 'Hero Assets', 'Key hero assets');
    expect(col.id).toBe('c1');
    expect(col.name).toBe('Hero Assets');
    expect(col.assetIds).toEqual([]);
    expect(col.createdAt).toBe(col.updatedAt);
  });

  it('adds a collection immutably', () => {
    const state = createMediaLibraryCollectionsState();
    const col = createCollection(state, 'c1', 'Hero Assets', '');
    const next = addCollection(state, { ...col, assetIds: ['a1', 'a2'] });
    expect(next.collections).toHaveLength(1);
    expect(next.collections[0].assetIds).toEqual(['a1', 'a2']);
    // original unchanged
    expect(state.collections).toHaveLength(0);
  });

  it('renames a collection immutably', () => {
    let state = createMediaLibraryCollectionsState();
    const col = createCollection(state, 'c1', 'Hero Assets', '');
    state = addCollection(state, col);

    state = renameCollection(state, 'c1', 'Hero Assets v2');
    expect(state.collections[0].name).toBe('Hero Assets v2');
    expect(state.collections[0].updatedAt).toBeGreaterThanOrEqual(col.updatedAt);
  });

  it('renames throws for missing collection', () => {
    const state = createMediaLibraryCollectionsState();
    expect(() => renameCollection(state, 'nope', 'X')).toThrow(/Collection not found/);
  });

  it('deletes a collection immutably', () => {
    let state = createMediaLibraryCollectionsState();
    state = addCollection(state, { ...createCollection(state, 'c1', 'One', ''), assetIds: ['a1'] });
    state = addCollection(state, { ...createCollection(state, 'c2', 'Two', ''), assetIds: ['a2'] });

    state = deleteCollection(state, 'c1');
    expect(state.collections.map((c) => c.id)).toEqual(['c2']);
    expect(() => deleteCollection(state, 'missing')).toThrow(/Collection not found/);
  });

  it('adds/removes asset references idempotently', () => {
    let state = createMediaLibraryCollectionsState();
    state = addCollection(state, { ...createCollection(state, 'c1', 'One', ''), assetIds: [] });

    state = addAssetToCollection(state, 'c1', 'a1');
    expect(state.collections[0].assetIds).toEqual(['a1']);
    // idempotent
    state = addAssetToCollection(state, 'c1', 'a1');
    expect(state.collections[0].assetIds).toEqual(['a1']);

    state = addAssetToCollection(state, 'c1', 'a2');
    state = removeAssetFromCollection(state, 'c1', 'a1');
    expect(state.collections[0].assetIds).toEqual(['a2']);
    expect(() => addAssetToCollection(state, 'missing', 'a1')).toThrow(/Collection not found/);
  });

  it('resolves membership and collection-scoped browser state', () => {
    let state = createMediaLibraryCollectionsState();
    state = addCollection(state, { ...createCollection(state, 'c1', 'One', ''), assetIds: ['a1', 'a2'] });

    expect(getCollectionsForAsset(state, 'a1')).toEqual(['c1']);
    expect(getCollectionsForAsset(state, 'a3')).toEqual([]);
    expect(isInCollection(state, 'a1', 'c1')).toBe(true);
    expect(isInCollection(state, 'a3', 'c1')).toBe(false);

    const browser = createAssetBrowserState({ activeFolderId: 'c1', favoriteAssetIds: [] });
    const derived = deriveBrowserOnCollectionDelete(state, 'c1', browser);
    expect(derived.activeFolderId).toBeNull(); // cleared because it pointed at deleted collection
  });
});
