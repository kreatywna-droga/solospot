import { describe, it, expect } from 'vitest';
import {
  createAutosaveState,
  createAutosaveSnapshot,
  getLatestSnapshot,
  clearAutosaveHistory,
} from '../ProjectAutosave';
import { createNewProject } from '../ProjectManager';

describe('ProjectAutosave (Sprint S5, ETAP 2 & 5)', () => {
  it('creates autosave state with empty snapshots', () => {
    const state = createAutosaveState(5);
    expect(state.snapshots).toHaveLength(0);
    expect(state.maxSnapshots).toBe(5);
    expect(state.lastSavedAt).toBeNull();
  });

  it('creates and prepends autosave snapshot', () => {
    const autosaveState = createAutosaveState();
    const project = createNewProject({ projectId: 'p-as-1', name: 'AS Test', authorId: 'u1', tenantId: 't1' });

    const { autosaveState: updated, snapshot } = createAutosaveSnapshot(autosaveState, project.document);
    expect(updated.snapshots).toHaveLength(1);
    expect(snapshot.projectId).toBe('p-as-1');
    expect(updated.lastSavedAt).not.toBeNull();
  });

  it('trims snapshots beyond maxSnapshots', () => {
    let state = createAutosaveState(3);
    const project = createNewProject({ projectId: 'p-trim', name: 'Trim', authorId: 'u1', tenantId: 't1' });

    for (let i = 0; i < 5; i++) {
      const { autosaveState: next } = createAutosaveSnapshot(state, project.document);
      state = next;
    }
    expect(state.snapshots).toHaveLength(3);
  });

  it('gets latest snapshot', () => {
    let state = createAutosaveState();
    const project = createNewProject({ projectId: 'p-latest', name: 'Latest', authorId: 'u1', tenantId: 't1' });
    const { autosaveState: updated } = createAutosaveSnapshot(state, project.document);
    const latest = getLatestSnapshot(updated);
    expect(latest).not.toBeNull();
    expect(latest?.projectId).toBe('p-latest');
  });

  it('clears autosave history', () => {
    let state = createAutosaveState();
    const project = createNewProject({ projectId: 'p-clear', name: 'Clear', authorId: 'u1', tenantId: 't1' });
    const { autosaveState: withSnapshot } = createAutosaveSnapshot(state, project.document);
    const cleared = clearAutosaveHistory(withSnapshot);
    expect(cleared.snapshots).toHaveLength(0);
  });
});
