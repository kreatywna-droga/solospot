/**
 * AssetRelinkEngine.ts — Sprint S15 Asset Relink & Missing Asset Engine (ETAP 7)
 *
 * Scans BuilderDocument nodes for missing asset references, generates dependency reports,
 * and executes single / global asset relinking and replacement.
 */

import { AssetRegistryState, getAssetById } from './AnimationAssetRegistry';
import { AssetReferenceState, AssetReferenceLink } from './AnimationAssetReference';

export interface MissingAssetReferenceReport {
  readonly totalReferences: number;
  readonly missingAssetIds: readonly string[];
  readonly brokenNodeIds: readonly string[];
  readonly validReferencesCount: number;
}

export interface RelinkResult {
  readonly success: boolean;
  readonly relinkedAssetId: string;
  readonly affectedNodeIds: readonly string[];
  readonly updatedReferenceState: AssetReferenceState;
}

export class AssetRelinkEngine {
  /**
   * Scans AssetReferenceState against AssetRegistryState to identify missing asset references.
   */
  public static detectMissingAssets(
    registryState: AssetRegistryState,
    referenceState: AssetReferenceState
  ): MissingAssetReferenceReport {
    const missingAssetIdsSet = new Set<string>();
    const brokenNodeIdsSet = new Set<string>();
    let validCount = 0;

    for (const link of referenceState.links) {
      const asset = getAssetById(registryState, link.assetId);
      if (!asset) {
        missingAssetIdsSet.add(link.assetId);
        brokenNodeIdsSet.add(link.targetId);
      } else {
        validCount++;
      }
    }

    return {
      totalReferences: referenceState.links.length,
      missingAssetIds: Array.from(missingAssetIdsSet),
      brokenNodeIds: Array.from(brokenNodeIdsSet),
      validReferencesCount: validCount,
    };
  }

  /**
   * Relinks all nodes pointing to oldAssetId to point to newAssetId instead.
   */
  public static relinkAsset(
    referenceState: AssetReferenceState,
    oldAssetId: string,
    newAssetId: string
  ): RelinkResult {
    const affectedNodeIds: string[] = [];

    const updatedLinks = referenceState.links.map((link) => {
      if (link.assetId === oldAssetId) {
        affectedNodeIds.push(link.targetId);
        return {
          ...link,
          assetId: newAssetId,
        };
      }
      return link;
    });

    return {
      success: affectedNodeIds.length > 0,
      relinkedAssetId: newAssetId,
      affectedNodeIds,
      updatedReferenceState: { links: updatedLinks },
    };
  }

  /**
   * Replaces an asset globally across the project.
   */
  public static replaceAssetGlobally(
    referenceState: AssetReferenceState,
    targetAssetId: string,
    replacementAssetId: string
  ): RelinkResult {
    return this.relinkAsset(referenceState, targetAssetId, replacementAssetId);
  }
}
