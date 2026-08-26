/**
 * WorkspacePersistence.ts — Sprint S5 Workspace State Persistence (ETAP 3)
 *
 * Models for persisting and restoring user workspace state: open panels, zoom level,
 * timeline position, and selected objects between sessions.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface WorkspacePersistenceState {
  readonly projectId: string;
  readonly openPanelIds: ReadonlyArray<string>;
  readonly activePresetId: string;
  readonly viewportScale: number;
  readonly timelineCurrentTimeMs: number;
  readonly selectedNodeIds: ReadonlyArray<string>;
  readonly persistedAt: number;
}

export function createWorkspacePersistenceState(projectId: string): WorkspacePersistenceState {
  return {
    projectId,
    openPanelIds: ['explorer', 'inspector', 'timeline'],
    activePresetId: 'preset-default',
    viewportScale: 1.0,
    timelineCurrentTimeMs: 0,
    selectedNodeIds: [],
    persistedAt: Date.now(),
  };
}

export function serializeWorkspacePersistence(state: WorkspacePersistenceState): string {
  return JSON.stringify(state);
}

export function deserializeWorkspacePersistence(raw: string): WorkspacePersistenceState {
  const parsed = JSON.parse(raw) as WorkspacePersistenceState;
  if (!parsed || !parsed.projectId) {
    throw new Error('Invalid WorkspacePersistenceState payload.');
  }
  return parsed;
}

export function updateWorkspacePersistence(
  state: WorkspacePersistenceState,
  updates: Partial<WorkspacePersistenceState>
): WorkspacePersistenceState {
  return {
    ...state,
    ...updates,
    persistedAt: Date.now(),
  };
}
