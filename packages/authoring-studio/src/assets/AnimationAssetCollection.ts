/**
 * AnimationAssetCollection.ts — PM42 Asset Collection Pipeline (ETAP 8)
 *
 * Export collection, import collection, collection manifest, and format validation.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem } from './AnimationAssetRegistry';

export interface AssetCollectionManifest {
  readonly collectionId: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly assetCount: number;
  readonly exportedAt: string;
}

export interface AnimationAssetCollectionData {
  readonly manifest: AssetCollectionManifest;
  readonly assets: ReadonlyArray<AnimationAssetItem>;
}

export interface CollectionValidationReport {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<string>;
}

/**
 * Validates an AnimationAssetCollectionData payload.
 */
export function validateAssetCollection(data: unknown): CollectionValidationReport {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || data === null) {
    errors.push('Collection payload is null or not an object.');
    return { isValid: false, errors };
  }

  const collection = data as AnimationAssetCollectionData;
  if (!collection.manifest) {
    errors.push('Collection missing required manifest.');
  }

  if (!collection.assets || !Array.isArray(collection.assets)) {
    errors.push('Collection missing assets array.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates an exportable asset collection payload.
 */
export function createAssetCollection(
  collectionId: string,
  name: string,
  description: string,
  assets: ReadonlyArray<AnimationAssetItem>
): AnimationAssetCollectionData {
  const manifest: AssetCollectionManifest = {
    collectionId,
    name,
    description,
    version: '1.0.0',
    assetCount: assets.length,
    exportedAt: new Date().toISOString(),
  };

  return {
    manifest,
    assets: JSON.parse(JSON.stringify(assets)),
  };
}
