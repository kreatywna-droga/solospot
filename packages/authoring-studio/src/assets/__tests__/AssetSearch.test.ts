import { describe, it, expect } from 'vitest';
import { searchAssets } from '../AnimationAssetSearch';
import { createAssetRegistryState, type AnimationAssetItem } from '../AnimationAssetRegistry';

const mockAssets: ReadonlyArray<AnimationAssetItem> = [
  {
    metadata: {
      assetId: 'asset-fade-in',
      name: 'Fade In Entrance',
      description: 'Opacity transition',
      category: 'preset',
      tags: ['fade', 'opacity'],
      preview: {},
      version: '1.0.0',
      author: 'TeamA',
      createdAt: 100,
      updatedAt: 100,
    },
    payloadRef: {},
  },
  {
    metadata: {
      assetId: 'asset-slide-up',
      name: 'Slide Up Entrance',
      description: 'Transform Y slide',
      category: 'template',
      tags: ['slide', 'transform'],
      preview: {},
      version: '2.0.0',
      author: 'TeamB',
      createdAt: 200,
      updatedAt: 200,
    },
    payloadRef: {},
  },
];

describe('AnimationAssetSearch (PM42, ETAP 3)', () => {
  it('searches assets by query, category, tag, author, and version', () => {
    const registryState = createAssetRegistryState(mockAssets);

    const queryRes = searchAssets(registryState, { query: 'slide' });
    expect(queryRes).toHaveLength(1);
    expect(queryRes[0].metadata.assetId).toBe('asset-slide-up');

    const catRes = searchAssets(registryState, { category: 'preset' });
    expect(catRes).toHaveLength(1);
    expect(catRes[0].metadata.assetId).toBe('asset-fade-in');

    const tagRes = searchAssets(registryState, { tag: 'opacity' });
    expect(tagRes).toHaveLength(1);

    const authorRes = searchAssets(registryState, { author: 'TeamB' });
    expect(authorRes).toHaveLength(1);

    const versionRes = searchAssets(registryState, { version: '1.0.0' });
    expect(versionRes).toHaveLength(1);
  });
});
