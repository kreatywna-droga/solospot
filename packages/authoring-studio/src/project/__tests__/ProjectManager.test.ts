import { describe, it, expect } from 'vitest';
import {
  createNewProject,
  saveProject,
  saveProjectAs,
  closeProject,
  openProjectFromSnapshot,
} from '../ProjectManager';
import { createProjectMetadata } from '../ProjectMetadata';
import { createProjectSettings } from '../ProjectSettings';

const PARAMS = { projectId: 'p-1', name: 'My Store', authorId: 'user-1', tenantId: 'tenant-1' };

describe('ProjectManager (Sprint S5, ETAP 1 & 2)', () => {
  it('creates a new project with open state', () => {
    const state = createNewProject(PARAMS);
    expect(state.isOpen).toBe(true);
    expect(state.document.id).toBe('p-1');
    expect(state.document.isDirty).toBe(false);
    expect(state.metadata.name).toBe('My Store');
    expect(state.settings.autosaveIntervalMs).toBe(60_000);
  });

  it('saves project immutably (dirty flag cleared)', () => {
    const state = createNewProject(PARAMS);
    const dirtyDoc = { ...state.document, isDirty: true };
    const dirtyState = { ...state, document: dirtyDoc };
    const saved = saveProject(dirtyState);
    expect(saved.document.isDirty).toBe(false);
    expect(saved.document.version).toBeGreaterThan(state.document.version);
  });

  it('saves project as new ID', () => {
    const state = createNewProject(PARAMS);
    const clone = saveProjectAs(state, 'p-2', 'Clone Store');
    expect(clone.document.id).toBe('p-2');
    expect(clone.metadata.name).toBe('Clone Store');
    expect(clone.metadata.projectId).toBe('p-2');
  });

  it('closes project', () => {
    const state = createNewProject(PARAMS);
    const closed = closeProject(state);
    expect(closed.isOpen).toBe(false);
  });

  it('opens project from snapshot', () => {
    const state = createNewProject(PARAMS);
    const meta = createProjectMetadata({ ...PARAMS });
    const settings = createProjectSettings('p-1');
    const opened = openProjectFromSnapshot(state.document, meta, settings);
    expect(opened.isOpen).toBe(true);
  });
});
