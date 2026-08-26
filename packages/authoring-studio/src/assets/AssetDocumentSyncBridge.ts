/**
 * AssetDocumentSyncBridge.ts — Sprint S15 Asset ↔ BuilderDocument Sync Bridge (ETAP 5)
 *
 * Coordinates reference binding between Asset Registry, AssetID, BuilderDocument Nodes,
 * and RenderingEngine/CanvasRenderer.
 * Guarantees zero duplicate binary asset payloads stored inside BuilderDocument.
 */

import { AssetRegistryState, getAssetById, AnimationAssetItem } from './AnimationAssetRegistry';
import { AssetReferenceState, bindAssetReference, findReferencesForTarget } from './AnimationAssetReference';

export interface AssetNodeBindingPayload {
  readonly nodeId: string;
  readonly assetId: string;
  readonly propertyKey?: string;
}

export class AssetDocumentSyncBridge {
  private registryState: AssetRegistryState;
  private referenceState: AssetReferenceState;

  constructor(registryState: AssetRegistryState, referenceState: AssetReferenceState) {
    this.registryState = registryState;
    this.referenceState = referenceState;
  }

  /**
   * Binds an asset ID reference to a BuilderDocument node.
   */
  public bindAssetToNode(nodeId: string, assetId: string, propertyKey: string = 'assetId'): AssetReferenceState {
    this.referenceState = bindAssetReference(this.referenceState, assetId, 'BuilderDocumentNode', nodeId, propertyKey);
    return this.referenceState;
  }

  /**
   * Resolves the lightweight asset item for a given BuilderDocument node ID.
   */
  public resolveAssetForNode(nodeId: string): AnimationAssetItem | null {
    const links = findReferencesForTarget(this.referenceState, nodeId);
    if (links.length === 0) return null;

    const targetLink = links[0];
    return getAssetById(this.registryState, targetLink.assetId);
  }

  /**
   * Updates internal AssetRegistryState reference.
   */
  public updateRegistryState(nextRegistryState: AssetRegistryState): void {
    this.registryState = nextRegistryState;
  }

  /**
   * Returns active reference state.
   */
  public getReferenceState(): AssetReferenceState {
    return this.referenceState;
  }
}
