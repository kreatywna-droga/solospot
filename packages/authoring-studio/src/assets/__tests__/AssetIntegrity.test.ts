import { describe, it, expect } from 'vitest';
import { createAssetRegistryState, type AnimationAssetItem } from '../AnimationAssetRegistry';
import {
  INITIAL_ASSET_REFERENCE_STATE,
  bindAssetReference,
} from '../AnimationAssetReference';
import {
  scanAssetIntegrity,
  repairReferences,
  resolveDuplicateAssets,
  isReplacementEligible,
} from '../AssetIntegrityScanner';

function makeItem(assetId: string, name: string = assetId): AnimationAssetItem {
  return {
    metadata: {
      assetId, name, description: '', category: 'custom', tags: [],
      preview: { thumbnailUri: `thumb_${assetId}.png` },
      version: '1.0.0', author: 'user', createdAt: 1000, updatedAt: 1000,
    },
    payloadRef: { mimeType: 'image/png', fileSizeBytes: 1024 },
  };
}

describe('AssetIntegrityScanner (S25)', () => {
  const registry = createAssetRegistryState([
    makeItem('shared'),
    makeItem('shared'), // duplicate assetId (collision)
    makeItem('used'),
    makeItem('orphan'),
  ]);

  const refState = (() => {
    let s = bindAssetReference(INITIAL_ASSET_REFERENCE_STATE, 'shared', 'BuilderDocumentNode', 'node1');
    s = bindAssetReference(s, 'missing', 'BuilderDocumentNode', 'node2');
    s = bindAssetReference(s, 'used', 'BuilderDocumentNode', 'node3');
    return s;
  })();

  const edges = [
    { parentAssetId: 'used', childAssetId: 'shared', relationship: 'uses_preset' as const },
  ];

  it('detects missing assets, broken references, duplicates and orphans', () => {
    const report = scanAssetIntegrity(registry, refState, edges);
    expect(report.totalAssets).toBe(4);
    expect(report.totalReferences).toBe(3);
    expect(report.missingAssetIds).toEqual(['missing']);
    expect(report.brokenNodeIds).toEqual(['node2']);
    expect(report.duplicateAssetIds).toEqual(['shared']);
    expect(report.validReferencesCount).toBe(2);
    // 'orphan' and 'used' have no incoming edges → orphans
    expect([...report.orphanAssetIds].sort()).toEqual(['orphan', 'used']);
    const types = report.issues.map((i) => i.type);
    expect(types).toContain('missing_asset');
    expect(types).toContain('broken_reference');
    expect(types).toContain('duplicate_asset');
    expect(types).toContain('orphan_asset');
  });

  it('isReplacementEligible validates replacement presence', () => {
    expect(isReplacementEligible(makeItem('x'), 'missing')).toBe(true);
    expect(isReplacementEligible(null, 'missing')).toBe(false);
  });

  it('repairReferences relinks missing -> replacement and keeps links intact', () => {
    const repair = repairReferences(registry, refState, 'missing', 'shared');
    expect(repair.relinkedAssetId).toBe('shared');
    expect(repair.affectedNodeIds).toEqual(['node2']);
    expect(repair.removedUnresolvedLinks).toEqual([]);
    expect(repair.nextReferenceState.links.filter((l) => l.assetId === 'shared').map((l) => l.targetId))
      .toEqual(['node1', 'node2']);
  });

    it('repairReferences drops links that still point to a missing asset when no replacement found', () => {
    const reg = createAssetRegistryState([makeItem('used')]);
    const ref = bindAssetReference(INITIAL_ASSET_REFERENCE_STATE, 'missing', 'BuilderDocumentNode', 'node2');
    // 'nope' is not present in the registry → no eligible replacement
    const repair = repairReferences(reg, ref, 'missing', 'nope');
    expect(repair.relinkedAssetId).toBeNull();
    expect(repair.removedUnresolvedLinks.map((l) => l.targetId)).toEqual(['node2']);
    expect(repair.nextReferenceState.links).toEqual([]);
  });

  it('resolveDuplicateAssets keeps canonical and rebinds duplicate references', () => {
    const reg = createAssetRegistryState([makeItem('logo_v1'), makeItem('logo_v1_copy')]);
    let re = bindAssetReference(INITIAL_ASSET_REFERENCE_STATE, 'logo_v1_copy', 'BuilderDocumentNode', 'nodeA');
    re = bindAssetReference(re, 'logo_v1', 'BuilderDocumentNode', 'nodeB');

    const result = resolveDuplicateAssets(reg, re, 'logo_v1', 'logo_v1_copy');
    expect(result.removedAssetIds).toEqual(['logo_v1_copy']);
    expect(result.nextRegistryState.assets.map((a) => a.metadata.assetId)).toEqual(['logo_v1']);
    expect(result.nextReferenceState.links.map((l) => l.assetId).sort()).toEqual(['logo_v1', 'logo_v1']);
  });

  it('resolveDuplicateAssets throws for identical keep/duplicate or missing keep', () => {
    const reg = createAssetRegistryState([makeItem('a')]);
    expect(() => resolveDuplicateAssets(reg, INITIAL_ASSET_REFERENCE_STATE, 'a', 'a')).toThrow(/must differ/);
    expect(() => resolveDuplicateAssets(reg, INITIAL_ASSET_REFERENCE_STATE, 'missing', 'x')).toThrow(/Keep asset not found/);
  });
});
