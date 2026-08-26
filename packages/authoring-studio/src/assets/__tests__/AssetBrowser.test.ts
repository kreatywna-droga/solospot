import { describe, it, expect } from 'vitest';
import {
  createAssetBrowserState,
  toggleFavoriteAsset,
  touchRecentAsset,
  addAssetFolder,
} from '../AnimationAssetBrowser';

describe('AnimationAssetBrowser (PM42, ETAP 2)', () => {
  it('toggles asset favorite status immutably', () => {
    let state = createAssetBrowserState();

    state = toggleFavoriteAsset(state, 'asset-1');
    expect(state.favoriteAssetIds).toContain('asset-1');

    state = toggleFavoriteAsset(state, 'asset-1');
    expect(state.favoriteAssetIds).not.toContain('asset-1');
  });

  it('manages recent assets queue with maximum cap', () => {
    let state = createAssetBrowserState();

    for (let i = 1; i <= 25; i++) {
      state = touchRecentAsset(state, `asset-${i}`);
    }

    expect(state.recentAssetIds).toHaveLength(20);
    expect(state.recentAssetIds[0]).toBe('asset-25');
  });

  it('adds asset folders immutably', () => {
    let state = createAssetBrowserState();

    state = addAssetFolder(state, {
      id: 'folder-entrances',
      name: 'Entrances',
      assetIds: ['asset-fade-in-v1'],
    });

    expect(state.folders).toHaveLength(1);
    expect(state.folders[0].name).toBe('Entrances');
  });
});
