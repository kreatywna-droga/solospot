import { describe, it, expect } from 'vitest';
import {
  createWorkspacePersistenceState,
  serializeWorkspacePersistence,
  deserializeWorkspacePersistence,
  updateWorkspacePersistence,
} from '../WorkspacePersistence';

describe('WorkspacePersistence (Sprint S5, ETAP 3)', () => {
  it('creates default workspace persistence state', () => {
    const state = createWorkspacePersistenceState('p-ws-1');
    expect(state.projectId).toBe('p-ws-1');
    expect(state.viewportScale).toBe(1.0);
    expect(state.openPanelIds).toContain('timeline');
  });

  it('serializes and deserializes workspace state', () => {
    const state = createWorkspacePersistenceState('p-ws-2');
    const serialized = serializeWorkspacePersistence(state);
    const restored = deserializeWorkspacePersistence(serialized);
    expect(restored.projectId).toBe('p-ws-2');
    expect(restored.viewportScale).toBe(1.0);
  });

  it('updates workspace persistence fields immutably', () => {
    const state = createWorkspacePersistenceState('p-ws-3');
    const updated = updateWorkspacePersistence(state, { viewportScale: 1.5, timelineCurrentTimeMs: 1000 });
    expect(updated.viewportScale).toBe(1.5);
    expect(updated.timelineCurrentTimeMs).toBe(1000);
    expect(updated).not.toBe(state);
    expect(state.viewportScale).toBe(1.0); // original unchanged
  });
});
