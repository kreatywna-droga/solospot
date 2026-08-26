/**
 * ProjectAutosave.ts — Sprint S5 Project Autosave Engine (ETAP 2 & ETAP 5)
 *
 * Manages rolling autosave snapshots of BuilderDocument DTO.
 * Tracks dirty state and creates timestamped snapshot records.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';

export interface AutosaveSnapshot {
  readonly snapshotId: string;
  readonly projectId: string;
  readonly document: BuilderDocument;
  readonly savedAt: number;
  readonly isDirty: boolean;
}

export interface AutosaveState {
  readonly snapshots: ReadonlyArray<AutosaveSnapshot>;
  readonly maxSnapshots: number;
  readonly lastSavedAt: number | null;
}

export function createAutosaveState(maxSnapshots: number = 10): AutosaveState {
  return { snapshots: [], maxSnapshots, lastSavedAt: null };
}

export function createAutosaveSnapshot(
  state: AutosaveState,
  document: BuilderDocument
): { autosaveState: AutosaveState; snapshot: AutosaveSnapshot } {
  const snapshot: AutosaveSnapshot = {
    snapshotId: `autosave-${document.id}-${Date.now()}`,
    projectId: document.id,
    document: { ...document },
    savedAt: Date.now(),
    isDirty: document.isDirty,
  };

  const trimmed = [snapshot, ...state.snapshots].slice(0, state.maxSnapshots);

  return {
    autosaveState: { ...state, snapshots: trimmed, lastSavedAt: snapshot.savedAt },
    snapshot,
  };
}

export function getLatestSnapshot(state: AutosaveState): AutosaveSnapshot | null {
  return state.snapshots[0] ?? null;
}

export function clearAutosaveHistory(state: AutosaveState): AutosaveState {
  return { ...state, snapshots: [], lastSavedAt: null };
}
