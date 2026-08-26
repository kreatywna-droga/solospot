/**
 * ConflictResolver.ts & CloudSyncModel.ts — PM44 Conflict Resolver & Sync Model (ETAP 2)
 *
 * DECISION-086: Cloud Sync nie wykonuje logiki Runtime.
 *
 * Conflict resolution solver and cloud sync manager.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { SyncSession } from './SyncMetadata';

export type ResolutionStrategy = 'client_wins' | 'server_wins' | 'last_modified_wins';

export interface SyncConflict {
  readonly projectId: string;
  readonly clientData: unknown;
  readonly serverData: unknown;
  readonly clientVersion: number;
  readonly serverVersion: number;
}

export interface SyncConflictResolution {
  readonly resolvedData: unknown;
  readonly strategyUsed: ResolutionStrategy;
  readonly resolvedVersion: number;
}

/**
 * Resolves cloud synchronization conflicts deterministically based on resolution strategy.
 */
export function resolveSyncConflict(
  conflict: SyncConflict,
  strategy: ResolutionStrategy = 'last_modified_wins'
): SyncConflictResolution {
  if (strategy === 'client_wins') {
    return {
      resolvedData: conflict.clientData,
      strategyUsed: 'client_wins',
      resolvedVersion: conflict.clientVersion + 1,
    };
  }

  if (strategy === 'server_wins') {
    return {
      resolvedData: conflict.serverData,
      strategyUsed: 'server_wins',
      resolvedVersion: conflict.serverVersion,
    };
  }

  // default: last_modified_wins (highest version number)
  const isClientNewer = conflict.clientVersion >= conflict.serverVersion;
  return {
    resolvedData: isClientNewer ? conflict.clientData : conflict.serverData,
    strategyUsed: 'last_modified_wins',
    resolvedVersion: Math.max(conflict.clientVersion, conflict.serverVersion) + 1,
  };
}
