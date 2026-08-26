/**
 * AnimationDependencyGraph.ts — PM42 Asset Dependency Graph (ETAP 4)
 *
 * DTO-based asset usage analyzer:
 *   - Reference count analysis
 *   - Dependency tree resolution
 *   - Duplicate asset detection
 *   - Orphan asset detection
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { AssetRegistryState } from './AnimationAssetRegistry';

export interface AssetDependencyEdge {
  readonly parentAssetId: string;
  readonly childAssetId: string;
  readonly relationship: 'uses_preset' | 'uses_template' | 'embeds_graphics';
}

export interface DependencyAnalysisReport {
  readonly orphanAssetIds: ReadonlyArray<string>;
  readonly duplicateAssetIds: ReadonlyArray<string>;
  readonly referenceCounts: Readonly<Record<string, number>>;
  readonly edges: ReadonlyArray<AssetDependencyEdge>;
}

/**
 * Analyzes an AssetRegistryState and explicit dependency edges for orphans, duplicates, and reference counts.
 */
export function analyzeAssetDependencies(
  state: AssetRegistryState,
  edges: ReadonlyArray<AssetDependencyEdge> = []
): DependencyAnalysisReport {
  const referenceCounts: Record<string, number> = {};
  const seenIds = new Set<string>();
  const duplicateAssetIds: string[] = [];

  // Initialize reference counts and check ID collisions
  for (const item of state.assets) {
    const id = item.metadata.assetId;
    if (seenIds.has(id)) {
      duplicateAssetIds.push(id);
    } else {
      seenIds.add(id);
    }
    referenceCounts[id] = 0;
  }

  // Count incoming references from edges
  for (const edge of edges) {
    if (referenceCounts[edge.childAssetId] !== undefined) {
      referenceCounts[edge.childAssetId]++;
    }
  }

  // Identify orphans (assets with 0 references)
  const orphanAssetIds = Object.keys(referenceCounts).filter((id) => referenceCounts[id] === 0);

  return {
    orphanAssetIds,
    duplicateAssetIds,
    referenceCounts,
    edges,
  };
}
