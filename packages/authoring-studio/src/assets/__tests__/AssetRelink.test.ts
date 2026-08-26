import { describe, it, expect } from 'vitest';
import { AssetRelinkEngine } from '../AssetRelinkEngine';
import { bindAssetReference } from '../AnimationAssetReference';

describe('AssetRelinkEngine (S15 ETAP 7)', () => {
  it('relinks old asset reference to new asset ID across multiple nodes', () => {
    let refState = bindAssetReference({ links: [] }, 'old_asset', 'BuilderDocumentNode', 'node_1');
    refState = bindAssetReference(refState, 'old_asset', 'BuilderDocumentNode', 'node_2');

    const result = AssetRelinkEngine.relinkAsset(refState, 'old_asset', 'new_asset');

    expect(result.success).toBe(true);
    expect(result.relinkedAssetId).toBe('new_asset');
    expect(result.affectedNodeIds).toEqual(['node_1', 'node_2']);
    expect(result.updatedReferenceState.links[0].assetId).toBe('new_asset');
    expect(result.updatedReferenceState.links[1].assetId).toBe('new_asset');
  });
});
