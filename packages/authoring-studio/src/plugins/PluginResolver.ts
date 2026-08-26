/**
 * PluginResolver.ts — PM43 Plugin Resolver & Conflict Detection (ETAP 2)
 *
 * Conflict detection and capability dependency resolution solver.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { PluginRegistryState } from './PluginRegistry';

export interface PluginConflict {
  readonly pluginIdA: string;
  readonly pluginIdB: string;
  readonly reason: string;
}

export interface ResolutionResult {
  readonly hasConflicts: boolean;
  readonly conflicts: ReadonlyArray<PluginConflict>;
}

/**
 * Solves conflict detection across registered plugins (e.g. duplicate IDs or ID collisions).
 */
export function resolvePluginConflicts(state: PluginRegistryState): ResolutionResult {
  const conflicts: PluginConflict[] = [];
  const seenIds = new Set<string>();

  for (const record of state.plugins) {
    const id = record.manifest.metadata.pluginId;
    if (seenIds.has(id)) {
      conflicts.push({
        pluginIdA: id,
        pluginIdB: id,
        reason: `Duplicate Plugin ID collision: "${id}"`,
      });
    } else {
      seenIds.add(id);
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
