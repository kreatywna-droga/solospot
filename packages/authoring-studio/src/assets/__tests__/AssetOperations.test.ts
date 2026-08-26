import { describe, it, expect } from 'vitest';
import {
  createAssetRegistryState,
  registerAsset,
  type AnimationAssetItem,
} from '../AnimationAssetRegistry';
import { INITIAL_ASSET_REFERENCE_STATE, bindAssetReference } from '../AnimationAssetReference';
import {
  importAssets,
  renameAsset,
  duplicateAsset,
  replaceAssetPayload,
  deleteAsset,
  relinkMissingAsset,
} from '../AssetOperationsEngine';

function makeAsset(assetId: string, name: string, payload: object = {}): AnimationAssetItem {
  return {
    metadata: {
      assetId, name, description: '', category: 'custom', tags: ['t'],
      preview: { thumbnailUri: 'thumb.png' }, version: '1.0.0', author: 'user',
      createdAt: 1000, updatedAt: 1000,
    },
    payloadRef: payload,
  };
}

describe('AssetOperationsEngine (S25)', () => {
  it('imports assets immutably via the S15 pipeline (single + batch)', () => {
    const result = importAssets(
      [{ fileName: 'bg.png', mimeType: 'image/png', fileSizeBytes: 4096, sourceUri: 'bg.png' }],
      createAssetRegistryState()
    );
    expect(result.nextRegistryState.assets).toHaveLength(1);
    expect(result.importedAssetIds).toHaveLength(1);
    expect(result.log[0].operation).toBe('import');
    expect(result.nextRegistryState.assets[0].metadata.name).toBe('bg.png');
  });

  it('renames an asset immutably and bumps updatedAt', () => {
    const item = makeAsset('asset_rename', 'Old Name.png');
    const result = renameAsset(createAssetRegistryState([item]), 'asset_rename', 'New Name.png');
    expect(result.nextRegistryState.assets[0].metadata.name).toBe('New Name.png');
    expect(result.nextRegistryState.assets[0].metadata.assetId).toBe('asset_rename');
    expect(result.nextRegistryState.assets[0].metadata.updatedAt).toBeGreaterThan(1000);
    expect(result.log[0].operation).toBe('rename');
  });

  it('renames throws for missing asset', () => {
    expect(() => renameAsset(createAssetRegistryState(), 'nope', 'x')).toThrow(/Asset not found/);
  });

  it('duplicates an asset under a new AssetID with copied payload', () => {
    const item = makeAsset('asset_dup', 'Logo.svg', { mimeType: 'image/svg+xml', fileSizeBytes: 500 });
    const result = duplicateAsset(createAssetRegistryState([item]), 'asset_dup');
    expect(result.nextRegistryState.assets).toHaveLength(2);
    expect(result.newAssetId).not.toBe('asset_dup');
    const copy = result.nextRegistryState.assets.find((a) => a.metadata.assetId === result.newAssetId);
    expect(copy).toBeDefined();
    expect(copy?.metadata.name).toBe('Copy of Logo.svg');
    expect(copy?.payloadRef).not.toBe(item.payloadRef); // shallow copy
  });

  it('replaces asset payload preserving AssetID + name + references', () => {
    const item = makeAsset('asset_replace', 'Icon.png', { mimeType: 'image/png', fileSizeBytes: 100 });
    const result = replaceAssetPayload(
      createAssetRegistryState([item]),
      'asset_replace',
      { fileName: 'Icon2.png', mimeType: 'image/png', fileSizeBytes: 999, sourceUri: 'Icon2.png' }
    );
    expect(result.importedAssetIds).toEqual(['asset_replace']);
    const reg = result.nextRegistryState;
    expect(getByName(reg, 'Icon.png')?.metadata.assetId).toBe('asset_replace');
  });

  it('deletes an asset and clears dangling references by default', () => {
    const item = makeAsset('asset_del', 'Del.png');
    let refState = bindAssetReference(INITIAL_ASSET_REFERENCE_STATE, 'asset_del', 'BuilderDocumentNode', 'node_1');
    refState = bindAssetReference(refState, 'asset_other', 'BuilderDocumentNode', 'node_2');

    const result = deleteAsset(createAssetRegistryState([item]), refState, 'asset_del');
    expect(result.nextRegistryState.assets).toHaveLength(0);
    expect(result.removedReferenceLinks.map((l) => l.targetId)).toEqual(['node_1']);
    expect(result.nextReferenceState.links.map((l) => l.targetId)).toEqual(['node_2']);
  });

  it('deletes an asset preserving references when requested', () => {
    const item = makeAsset('asset_del', 'Del.png');
    const refState = bindAssetReference(INITIAL_ASSET_REFERENCE_STATE, 'asset_del', 'BuilderDocumentNode', 'node_1');
    const result = deleteAsset(createAssetRegistryState([item]), refState, 'asset_del', true);
    expect(result.removedReferenceLinks).toEqual([]);
    expect(result.nextReferenceState.links).toHaveLength(1);
  });

  it('relinks missing asset references to a replacement', () => {
    const replacement = makeAsset('asset_new', 'New.png');
    let refState = bindAssetReference(INITIAL_ASSET_REFERENCE_STATE, 'asset_missing', 'BuilderDocumentNode', 'node_1');
    refState = bindAssetReference(refState, 'asset_missing', 'BuilderDocumentNode', 'node_2');

    const result = relinkMissingAsset(
      createAssetRegistryState([replacement]),
      refState,
      'asset_missing',
      'asset_new'
    );
    expect(result.relinkedAssetId).toBe('asset_new');
    expect(result.affectedNodeIds).toEqual(['node_1', 'node_2']);
    expect(result.nextReferenceState.links.every((l) => l.assetId === 'asset_new')).toBe(true);
  });

  it('relinks throws when replacement asset is missing from registry', () => {
    expect(() =>
      relinkMissingAsset(
        createAssetRegistryState(),
        INITIAL_ASSET_REFERENCE_STATE,
        'asset_missing',
        'asset_new'
      )
    ).toThrow(/Replacement asset not found/);
  });
});

function getByName(state: ReturnType<typeof createAssetRegistryState>, name: string) {
  return state.assets.find((a) => a.metadata.name === name);
}
