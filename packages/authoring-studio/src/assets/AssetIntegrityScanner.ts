/**
 * AssetIntegrityScanner.ts — Sprint S25 Professional Asset Integrity
 *
 * Consolidates S15 `AssetRelinkEngine` (missing-asset detection + relink) and
 * S15 `AnimationDependencyGraph` (duplicate/orphan/reference-count analysis)
 * into a single professional integrity report and repair surface.
 *
 * Reuses the S15 `AnimationAssetRegistry` as the SSOT. NO second asset
 * registry, NO second relink engine, NO second dependency graph.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { AnimationAssetItem, AssetRegistryState } from './AnimationAssetRegistry';
import type { AssetReferenceState, AssetReferenceLink } from './AnimationAssetReference';
import { AssetRelinkEngine } from './AssetRelinkEngine';
import {
  analyzeAssetDependencies,
  type AssetDependencyEdge,
  type DependencyAnalysisReport,
} from './AnimationDependencyGraph';
import { getAssetById, unregisterAsset } from './AnimationAssetRegistry';

export type IntegritySeverity = 'error' | 'warning' | 'info';
export type IntegrityIssueType =
  | 'missing_asset'
  | 'broken_reference'
  | 'duplicate_asset'
  | 'orphan_asset'
  | 'unresolved_reference';

export interface AssetIntegrityIssue {
  readonly severity: IntegritySeverity;
  readonly type: IntegrityIssueType;
  readonly assetId?: string;
  readonly targetId?: string;
  readonly message: string;
}

export interface AssetIntegrityReport {
  readonly totalAssets: number;
  readonly totalReferences: number;
  readonly missingAssetIds: ReadonlyArray<string>;
  readonly brokenNodeIds: ReadonlyArray<string>;
  readonly duplicateAssetIds: ReadonlyArray<string>;
  readonly orphanAssetIds: ReadonlyArray<string>;
  readonly validReferencesCount: number;
  readonly issues: ReadonlyArray<AssetIntegrityIssue>;
  readonly dependencyReport: DependencyAnalysisReport;
}

export interface AssetIntegrityRepair {
  readonly nextReferenceState: AssetReferenceState;
  readonly relinkedAssetId: string | null;
  readonly affectedNodeIds: ReadonlyArray<string>;
  readonly removedUnresolvedLinks: ReadonlyArray<AssetReferenceLink>;
  readonly message: string;
}

/**
 * Scans the registry + reference graph for integrity issues. Reuses the
 * S15 `AssetRelinkEngine.detectMissingAssets` and
 * `AnimationDependencyGraph.analyzeAssetDependencies`. Deterministic ordering
 * (sorted by assetId) for reproducible audit output.
 */
export function scanAssetIntegrity(
  registryState: AssetRegistryState,
  referenceState: AssetReferenceState,
  edges: ReadonlyArray<AssetDependencyEdge> = []
): AssetIntegrityReport {
  const missingReport = AssetRelinkEngine.detectMissingAssets(registryState, referenceState);
  const dependencyReport = analyzeAssetDependencies(registryState, edges);

  const issues: AssetIntegrityIssue[] = [];

  for (const assetId of missingReport.missingAssetIds) {
    issues.push({
      severity: 'error',
      type: 'missing_asset',
      assetId,
      message: `Asset "${assetId}" is referenced but not present in the registry.`,
    });
  }

  for (const nodeId of missingReport.brokenNodeIds) {
    issues.push({
      severity: 'error',
      type: 'broken_reference',
      targetId: nodeId,
      message: `BuilderDocument node "${nodeId}" references a missing asset.`,
    });
  }

  // Per-link unresolved references (targeted repair granularity).
  for (const link of referenceState.links) {
    if (!getAssetById(registryState, link.assetId)) {
      if (!issues.some((i) => i.type === 'unresolved_reference' && i.targetId === link.targetId)) {
        issues.push({
          severity: 'error',
          type: 'unresolved_reference',
          assetId: link.assetId,
          targetId: link.targetId,
          message: `Reference link "${link.linkId}" points to missing asset "${link.assetId}".`,
        });
      }
    }
  }

  for (const dupId of dependencyReport.duplicateAssetIds) {
    issues.push({
      severity: 'warning',
      type: 'duplicate_asset',
      assetId: dupId,
      message: `Duplicate asset ID detected: "${dupId}".`,
    });
  }

  for (const orphanId of dependencyReport.orphanAssetIds) {
    issues.push({
      severity: 'info',
      type: 'orphan_asset',
      assetId: orphanId,
      message: `Asset "${orphanId}" is not referenced by any node.`,
    });
  }

  const sorted = [...issues].sort((a, b) => {
    const sa = a.assetId ?? a.targetId ?? '';
    const sb = b.assetId ?? b.targetId ?? '';
    return sa.localeCompare(sb);
  });

  return {
    totalAssets: registryState.assets.length,
    totalReferences: referenceState.links.length,
    missingAssetIds: Array.from(new Set(missingReport.missingAssetIds)).sort(),
    brokenNodeIds: Array.from(new Set(missingReport.brokenNodeIds)).sort(),
    duplicateAssetIds: Array.from(new Set(dependencyReport.duplicateAssetIds)).sort(),
    orphanAssetIds: Array.from(new Set(dependencyReport.orphanAssetIds)).sort(),
    validReferencesCount: missingReport.validReferencesCount,
    issues: sorted,
    dependencyReport,
  };
}

/**
 * Validates whether a candidate replacement asset is eligible to replace a
 * missing asset (must exist in the registry). Category/MIME-family fidelity is
 * a soft policy surfaced via the integrity report, not a hard gate here.
 */
export function isReplacementEligible(
  replacement: AnimationAssetItem | null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _missingAssetId: string
): boolean {
  return Boolean(replacement);
}

/**
 * Repairs references to a missing asset by relinking them to a replacement
 * asset, then drops any links that still point to a missing asset. Returns the
 * repaired reference state. Reuses `AssetRelinkEngine.relinkAsset`.
 */
export function repairReferences(
  registryState: AssetRegistryState,
  referenceState: AssetReferenceState,
  missingAssetId: string,
  replacementAssetId: string
): AssetIntegrityRepair {
  const replacement = getAssetById(registryState, replacementAssetId);

  let nextReference = referenceState;
  let relinkedAssetId: string | null = null;
  let affectedNodeIds: ReadonlyArray<string> = [];

  if (isReplacementEligible(replacement, missingAssetId)) {
    const result = AssetRelinkEngine.relinkAsset(referenceState, missingAssetId, replacementAssetId);
    nextReference = result.updatedReferenceState;
    relinkedAssetId = replacementAssetId;
    affectedNodeIds = result.affectedNodeIds;
  }

  // Drop any links that still point to a missing asset after relinking.
  const missingIds = new Set<string>();
  for (const link of nextReference.links) {
    if (!getAssetById(registryState, link.assetId)) {
      missingIds.add(link.assetId);
    }
  }
  const removedUnresolvedLinks = nextReference.links.filter((l) => missingIds.has(l.assetId));
  const remaining = nextReference.links.filter((l) => !missingIds.has(l.assetId));

  return {
    nextReferenceState: { links: remaining },
    relinkedAssetId,
    affectedNodeIds,
    removedUnresolvedLinks,
    message: relinkedAssetId
      ? `Relinked ${affectedNodeIds.length} reference(s) to "${replacementAssetId}".`
      : 'No eligible replacement; unresolved references removed.',
  };
}

/**
 * Resolves a duplicate asset ID by keeping `keepAssetId` and removing all other
 * assets sharing the duplicate ID, then re-binding references accordingly.
 */
export function resolveDuplicateAssets(
  registryState: AssetRegistryState,
  referenceState: AssetReferenceState,
  keepAssetId: string,
  duplicateAssetId: string
): {
  nextRegistryState: AssetRegistryState;
  nextReferenceState: AssetReferenceState;
  removedAssetIds: ReadonlyArray<string>;
} {
  if (keepAssetId === duplicateAssetId) {
    throw new Error('keepAssetId and duplicateAssetId must differ');
  }

  const kept = getAssetById(registryState, keepAssetId);
  if (!kept) {
    throw new Error(`Keep asset not found: ${keepAssetId}`);
  }

  let nextRegistry = registryState;
  const removedAssetIds: string[] = [];

  for (const item of registryState.assets) {
    if (item.metadata.assetId === duplicateAssetId) {
      removedAssetIds.push(duplicateAssetId);
      nextRegistry = unregisterAsset(nextRegistry, item.metadata.assetId);
    }
  }

  const repair = repairReferences(registryState, referenceState, duplicateAssetId, keepAssetId);

  return {
    nextRegistryState: nextRegistry,
    nextReferenceState: repair.nextReferenceState,
    removedAssetIds: Array.from(new Set(removedAssetIds)),
  };
}

// Re-exported so the integrity surface is self-contained (no second relink engine).
export { AssetRelinkEngine };

