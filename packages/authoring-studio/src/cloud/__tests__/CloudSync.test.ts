import { describe, it, expect } from 'vitest';
import { createSyncSession } from '../SyncMetadata';
import { resolveSyncConflict } from '../ConflictResolver';

describe('CloudSync (PM44, ETAP 2 & DECISION-086)', () => {
  it('manages sync sessions without Runtime execution (DECISION-086)', () => {
    const session = createSyncSession('proj-store-1', 5, 5);
    expect(session.status).toBe('synced');
    expect(session.metadata.clientVersion).toBe(5);
  });

  it('resolves sync conflicts deterministically based on resolution strategies', () => {
    const conflict = {
      projectId: 'proj-store-1',
      clientData: { version: 'client' },
      serverData: { version: 'server' },
      clientVersion: 10,
      serverVersion: 8,
    };

    const clientWins = resolveSyncConflict(conflict, 'client_wins');
    expect(clientWins.resolvedData).toEqual({ version: 'client' });

    const serverWins = resolveSyncConflict(conflict, 'server_wins');
    expect(serverWins.resolvedData).toEqual({ version: 'server' });

    const lastModifiedWins = resolveSyncConflict(conflict, 'last_modified_wins');
    expect(lastModifiedWins.resolvedData).toEqual({ version: 'client' });
  });
});
