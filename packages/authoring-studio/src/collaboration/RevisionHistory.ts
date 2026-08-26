/**
 * RevisionHistory.ts — Sprint S7 Collaboration Workspace
 *
 * Manages the history of document revisions (snapshots) in a collaborative project.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';

export interface Revision {
  readonly revisionId: string;
  readonly document: BuilderDocument;
  readonly authorId: string;
  readonly commitMessage: string;
  readonly timestampMs: number;
}

export interface RevisionHistoryState {
  readonly revisions: ReadonlyArray<Revision>;
}

export function createRevisionHistoryState(): RevisionHistoryState {
  return { revisions: [] };
}

export function commitRevision(
  state: RevisionHistoryState,
  document: BuilderDocument,
  authorId: string,
  commitMessage: string
): RevisionHistoryState {
  const revision: Revision = {
    revisionId: `rev-${document.id}-${document.version}-${Date.now()}`,
    document: { ...document }, // deep clone needed in real app
    authorId,
    commitMessage,
    timestampMs: Date.now(),
  };

  return { ...state, revisions: [revision, ...state.revisions] };
}

export function getRevision(
  state: RevisionHistoryState,
  revisionId: string
): Revision | null {
  return state.revisions.find((r) => r.revisionId === revisionId) ?? null;
}
