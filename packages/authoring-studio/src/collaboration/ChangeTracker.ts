/**
 * ChangeTracker.ts — Sprint S7 Collaboration Workspace
 *
 * Tracks granular mutational changes made to the BuilderDocument.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type ChangeOperation = 'add' | 'update' | 'delete';

export interface DocumentChange {
  readonly changeId: string;
  readonly path: string; // e.g. "nodes.node-1.position"
  readonly operation: ChangeOperation;
  readonly previousValue?: unknown;
  readonly newValue?: unknown;
  readonly timestampMs: number;
}

export interface ChangeTrackerState {
  readonly changes: ReadonlyArray<DocumentChange>;
}

export function createChangeTrackerState(): ChangeTrackerState {
  return { changes: [] };
}

export function recordChange(
  state: ChangeTrackerState,
  path: string,
  operation: ChangeOperation,
  newValue?: unknown,
  previousValue?: unknown
): ChangeTrackerState {
  const change: DocumentChange = {
    changeId: `chg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    path,
    operation,
    previousValue,
    newValue,
    timestampMs: Date.now(),
  };

  return { ...state, changes: [...state.changes, change] };
}

export function clearChanges(state: ChangeTrackerState): ChangeTrackerState {
  return { ...state, changes: [] };
}
