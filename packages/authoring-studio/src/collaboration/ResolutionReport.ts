/**
 * ResolutionReport.ts — Sprint S7 Collaboration Workspace
 *
 * Generates a summary report post-merge.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { ConflictState } from './ConflictMetadata';

export interface ResolutionReport {
  readonly timestampMs: number;
  readonly totalConflicts: number;
  readonly resolvedConflicts: number;
  readonly isMergeSuccessful: boolean;
}

export function generateResolutionReport(conflictState: ConflictState): ResolutionReport {
  const total = conflictState.conflicts.length;
  const resolved = conflictState.conflicts.filter((c) => c.isResolved).length;

  return {
    timestampMs: Date.now(),
    totalConflicts: total,
    resolvedConflicts: resolved,
    isMergeSuccessful: !conflictState.isMergeBlocked,
  };
}
