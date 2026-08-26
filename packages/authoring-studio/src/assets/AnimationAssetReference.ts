/**
 * AnimationAssetReference.ts — PM42 Asset Reference Linking (ETAP 5)
 *
 * DECISION-078: BuilderDocument pozostaje jedynym SSOT.
 *
 * Reference linking model connecting asset IDs to BuilderDocument nodes, AnimationTimelines,
 * AnimationPresets, and AnimationTemplates.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type TargetDomainObjectType = 'BuilderDocumentNode' | 'AnimationTimeline' | 'AnimationPreset' | 'AnimationTemplate';

export interface AssetReferenceLink {
  readonly linkId: string;
  readonly assetId: string;
  readonly targetType: TargetDomainObjectType;
  readonly targetId: string;
  readonly boundPropertyKey?: string;
  readonly createdAt: number;
}

export interface AssetReferenceState {
  readonly links: ReadonlyArray<AssetReferenceLink>;
}

export const INITIAL_ASSET_REFERENCE_STATE: AssetReferenceState = {
  links: [],
};

export function createAssetReferenceState(
  initialLinks: ReadonlyArray<AssetReferenceLink> = []
): AssetReferenceState {
  return {
    links: [...initialLinks],
  };
}

/**
 * Binds an asset reference link immutably.
 */
export function bindAssetReference(
  state: AssetReferenceState,
  assetId: string,
  targetType: TargetDomainObjectType,
  targetId: string,
  boundPropertyKey?: string
): AssetReferenceState {
  const linkId = `link-${assetId}-${targetType}-${targetId}`;
  const newLink: AssetReferenceLink = {
    linkId,
    assetId,
    targetType,
    targetId,
    boundPropertyKey,
    createdAt: Date.now(),
  };

  const filtered = state.links.filter((l) => l.linkId !== linkId);
  return {
    links: [...filtered, newLink],
  };
}

/**
 * Unbinds an asset reference link immutably.
 */
export function unbindAssetReference(
  state: AssetReferenceState,
  linkId: string
): AssetReferenceState {
  return {
    links: state.links.filter((l) => l.linkId !== linkId),
  };
}

/**
 * Finds all asset reference links for a given target object ID.
 */
export function findReferencesForTarget(
  state: AssetReferenceState,
  targetId: string
): ReadonlyArray<AssetReferenceLink> {
  return state.links.filter((l) => l.targetId === targetId);
}
