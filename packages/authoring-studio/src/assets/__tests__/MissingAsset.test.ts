import { describe, it, expect } from 'vitest';
import { AssetRelinkEngine } from '../AssetRelinkEngine';
import { createAssetRegistryState } from '../AnimationAssetRegistry';
import { bindAssetReference } from '../AnimationAssetReference';

describe('Missing Asset Detection (S15 ETAP 7)', () => {
  it('detects missing asset references and broken nodes', () => {
    const regState = createAssetRegistryState([]); // Empty registry
    let refState = bindAssetReference({ links: [] }, 'missing_asset_id', 'BuilderDocumentNode', 'broken_node_1');

    const report = AssetRelinkEngine.detectMissingAssets(regState, refState);

    expect(report.totalReferences).toBe(1);
    expect(report.missingAssetIds).toEqual(['missing_asset_id']);
    expect(report.brokenNodeIds).toEqual(['broken_node_1']);
    expect(report.validReferencesCount).toBe(0);
  });
});
