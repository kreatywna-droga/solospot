/**
 * AnimationAssetMetadata.ts — PM42 Asset Metadata Model (ETAP 1)
 *
 * DECISION-075: Asset Registry przechowuje wyłącznie metadane.
 * DECISION-077: Wszystkie zasoby posiadają stabilne Asset ID.
 *
 * Data structures for animation asset metadata & preview descriptors.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type AssetCategory = 'timeline' | 'preset' | 'template' | 'vector_graphics' | 'sound_effect' | 'custom';

export interface AssetPreviewDescriptor {
  readonly thumbnailUri?: string;
  readonly aspectRatio?: string;
  readonly durationMs?: number;
  readonly frameCount?: number;
}

export interface AnimationAssetMetadata {
  readonly assetId: string;
  readonly name: string;
  readonly description: string;
  readonly category: AssetCategory;
  readonly tags: ReadonlyArray<string>;
  readonly preview: AssetPreviewDescriptor;
  readonly version: string;
  readonly author: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

/**
 * Validates whether an asset metadata descriptor contains required identity fields.
 */
export function validateAssetMetadata(metadata: AnimationAssetMetadata | null): boolean {
  if (!metadata) return false;
  if (!metadata.assetId || metadata.assetId.trim().length === 0) return false;
  if (!metadata.name || metadata.name.trim().length === 0) return false;
  if (!metadata.version || metadata.version.trim().length === 0) return false;
  return true;
}
