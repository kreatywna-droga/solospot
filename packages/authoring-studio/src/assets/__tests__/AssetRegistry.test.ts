import { describe, it, expect } from 'vitest';
import {
  createAssetRegistryState,
  registerAsset,
  unregisterAsset,
  getAssetById,
  type AnimationAssetItem,
} from '../AnimationAssetRegistry';
import { validateAssetMetadata } from '../AnimationAssetMetadata';

const mockAsset: AnimationAssetItem = {
  metadata: {
    assetId: 'asset-fade-in-v1',
    name: 'Fade In Preset Asset',
    description: 'Reusable opacity fade preset metadata',
    category: 'preset',
    tags: ['fade', 'opacity'],
    preview: { durationMs: 600 },
    version: '1.0.0',
    author: 'AuthorStudio',
    createdAt: 1000,
    updatedAt: 1000,
  },
  payloadRef: { type: 'preset_ref', presetId: 'preset-fade-in' },
};

describe('AnimationAssetRegistry (PM42, ETAP 1 & DECISION-075, DECISION-077)', () => {
  it('validates asset metadata descriptors (DECISION-075)', () => {
    expect(validateAssetMetadata(mockAsset.metadata)).toBe(true);
    expect(validateAssetMetadata(null)).toBe(false);
  });

  it('registers asset with stable Asset ID immutably (DECISION-077)', () => {
    let state = createAssetRegistryState();
    state = registerAsset(state, mockAsset);

    expect(state.assets).toHaveLength(1);
    const found = getAssetById(state, 'asset-fade-in-v1');
    expect(found).not.toBeNull();
    expect(found?.metadata.name).toBe('Fade In Preset Asset');
  });

  it('unregisters asset from registry immutably', () => {
    let state = createAssetRegistryState([mockAsset]);
    expect(state.assets).toHaveLength(1);

    state = unregisterAsset(state, 'asset-fade-in-v1');
    expect(state.assets).toHaveLength(0);
    expect(getAssetById(state, 'asset-fade-in-v1')).toBeNull();
  });
});
