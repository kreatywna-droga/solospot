import { describe, it, expect } from 'vitest';
import { AssetDocumentSyncBridge } from '../AssetDocumentSyncBridge';
import { INITIAL_ASSET_REGISTRY_STATE, registerAsset } from '../AnimationAssetRegistry';
import { INITIAL_ASSET_REFERENCE_STATE } from '../AnimationAssetReference';

describe('AssetReference & Sync Bridge (S15 ETAP 5)', () => {
  it('binds asset to node and resolves asset metadata from registry', () => {
    const assetItem = {
      metadata: {
        assetId: 'asset_svg_logo',
        name: 'Logo.svg',
        description: 'Company Logo',
        category: 'vector_graphics' as const,
        tags: ['svg'],
        preview: { thumbnailUri: 'logo.svg' },
        version: '1.0.0',
        author: 'user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      payloadRef: {},
    };

    const regState = registerAsset(INITIAL_ASSET_REGISTRY_STATE, assetItem);
    const bridge = new AssetDocumentSyncBridge(regState, INITIAL_ASSET_REFERENCE_STATE);

    bridge.bindAssetToNode('node_123', 'asset_svg_logo');

    const resolved = bridge.resolveAssetForNode('node_123');
    expect(resolved).not.toBeNull();
    expect(resolved?.metadata.assetId).toBe('asset_svg_logo');
    expect(resolved?.metadata.name).toBe('Logo.svg');
  });
});
