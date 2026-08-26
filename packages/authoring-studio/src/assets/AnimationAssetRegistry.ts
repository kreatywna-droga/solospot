/**
 * AnimationAssetRegistry.ts — PM42 Asset Registry (ETAP 1)
 *
 * DECISION-075: Asset Registry przechowuje wyłącznie metadane.
 * DECISION-077: Wszystkie zasoby posiadają stabilne Asset ID.
 *
 * Pure data model registry for managing animation asset metadata immutably.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetMetadata } from './AnimationAssetMetadata';
import { validateAssetMetadata } from './AnimationAssetMetadata';

export interface AnimationAssetItem {
  readonly metadata: AnimationAssetMetadata;
  readonly payloadRef: unknown; // DTO payload reference
}

export interface AssetRegistryState {
  readonly assets: ReadonlyArray<AnimationAssetItem>;
}

export const INITIAL_ASSET_REGISTRY_STATE: AssetRegistryState = {
  assets: [],
};

export function createAssetRegistryState(
  initialAssets: ReadonlyArray<AnimationAssetItem> = []
): AssetRegistryState {
  return {
    assets: [...initialAssets],
  };
}

/**
 * Registers or updates an asset item in the registry immutably.
 */
export function registerAsset(
  state: AssetRegistryState,
  item: AnimationAssetItem
): AssetRegistryState {
  if (!validateAssetMetadata(item.metadata)) {
    throw new Error(`Invalid asset metadata for assetId "${item.metadata?.assetId}"`);
  }

  const filtered = state.assets.filter((a) => a.metadata.assetId !== item.metadata.assetId);
  return {
    assets: [...filtered, item],
  };
}

/**
 * Unregisters an asset from the registry immutably.
 */
export function unregisterAsset(
  state: AssetRegistryState,
  assetId: string
): AssetRegistryState {
  return {
    assets: state.assets.filter((a) => a.metadata.assetId !== assetId),
  };
}

/**
 * Retrieves an asset item from the registry by assetId.
 */
export function getAssetById(
  state: AssetRegistryState,
  assetId: string
): AnimationAssetItem | null {
  return state.assets.find((a) => a.metadata.assetId === assetId) ?? null;
}

export function createAssetItem(
  metadataOrId: string | AnimationAssetMetadata,
  categoryOrPayload?: unknown,
  name?: string,
  _size?: number
): AnimationAssetItem {
  if (typeof metadataOrId === 'string') {
    const metadata: AnimationAssetMetadata = {
      assetId: metadataOrId,
      name: name ?? metadataOrId,
      description: '',
      category: (categoryOrPayload as any) ?? 'custom',
      tags: [],
      version: '1.0.0',
      author: 'system',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preview: { thumbnailUri: '' },
    };
    return { metadata, payloadRef: null };
  }
  return { metadata: metadataOrId, payloadRef: categoryOrPayload ?? null };
}

export function getAsset(state: AssetRegistryState, assetId: string): AnimationAssetItem | null {
  return getAssetById(state, assetId);
}
