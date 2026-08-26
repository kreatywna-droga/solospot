/**
 * ConflictMetadata.ts — Sprint S7 Collaboration Workspace
 *
 * Tracks specific nodes or paths in the document that are currently in a merge conflict state.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface ConflictMarker {
  readonly conflictId: string;
  readonly path: string; // e.g. "nodes.rect-1.fill"
  readonly baseValue: unknown;
  readonly localValue: unknown;
  readonly remoteValue: unknown;
  readonly isResolved: boolean;
  readonly resolvedValue?: unknown;
}

export interface ConflictState {
  readonly conflicts: ReadonlyArray<ConflictMarker>;
  readonly isMergeBlocked: boolean;
}

export function createConflictState(): ConflictState {
  return { conflicts: [], isMergeBlocked: false };
}

export function registerConflict(
  state: ConflictState,
  path: string,
  baseValue: unknown,
  localValue: unknown,
  remoteValue: unknown
): ConflictState {
  const marker: ConflictMarker = {
    conflictId: `conf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    path,
    baseValue,
    localValue,
    remoteValue,
    isResolved: false,
  };

  return {
    ...state,
    conflicts: [...state.conflicts, marker],
    isMergeBlocked: true,
  };
}

export function resolveConflict(
  state: ConflictState,
  conflictId: string,
  resolvedValue: unknown
): ConflictState {
  const conflicts = state.conflicts.map((c) =>
    c.conflictId === conflictId
      ? { ...c, isResolved: true, resolvedValue }
      : c
  );

  const stillBlocked = conflicts.some((c) => !c.isResolved);

  return { ...state, conflicts, isMergeBlocked: stillBlocked };
}
