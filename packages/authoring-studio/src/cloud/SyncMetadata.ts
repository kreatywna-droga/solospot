/**
 * SyncMetadata.ts & SyncSession.ts — PM44 Cloud Sync Models (ETAP 2)
 *
 * DECISION-086: Cloud Sync nie wykonuje logiki Runtime.
 *
 * Cloud synchronization metadata and session state models.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'conflict' | 'error';

export interface SyncMetadata {
  readonly clientVersion: number;
  readonly serverVersion: number;
  readonly lastSyncedAt: number;
  readonly syncHash: string;
}

export interface SyncSession {
  readonly sessionId: string;
  readonly projectId: string;
  readonly status: SyncStatus;
  readonly metadata: SyncMetadata;
  readonly errorMessage?: string;
}

export function createSyncSession(
  projectId: string,
  clientVersion: number,
  serverVersion: number
): SyncSession {
  return {
    sessionId: `sync-${projectId}-${Date.now()}`,
    projectId,
    status: clientVersion === serverVersion ? 'synced' : 'syncing',
    metadata: {
      clientVersion,
      serverVersion,
      lastSyncedAt: Date.now(),
      syncHash: `hash-${clientVersion}-${serverVersion}`,
    },
  };
}
