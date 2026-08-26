/**
 * ProjectRecovery.ts — Sprint S5 Crash Recovery & Session Restore (ETAP 5)
 *
 * Models for dirty document detection, session recovery tokens, and crash recovery metadata.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';
import type { AutosaveSnapshot } from './ProjectAutosave';

export type RecoveryStatus = 'clean' | 'dirty' | 'crashed' | 'recovered';

export interface RecoveryToken {
  readonly tokenId: string;
  readonly projectId: string;
  readonly snapshotId: string;
  readonly createdAt: number;
  readonly status: RecoveryStatus;
}

export interface SessionRecoveryReport {
  readonly projectId: string;
  readonly isDirty: boolean;
  readonly canRecover: boolean;
  readonly recoveryToken: RecoveryToken | null;
  readonly latestSnapshot: AutosaveSnapshot | null;
}

export function detectDirtyDocument(document: BuilderDocument): boolean {
  return document.isDirty === true;
}

export function createRecoveryToken(
  projectId: string,
  snapshot: AutosaveSnapshot
): RecoveryToken {
  return {
    tokenId: `recovery-${projectId}-${Date.now()}`,
    projectId,
    snapshotId: snapshot.snapshotId,
    createdAt: Date.now(),
    status: 'dirty',
  };
}

export function buildSessionRecoveryReport(
  document: BuilderDocument,
  latestSnapshot: AutosaveSnapshot | null
): SessionRecoveryReport {
  const isDirty = detectDirtyDocument(document);

  const recoveryToken =
    isDirty && latestSnapshot
      ? createRecoveryToken(document.id, latestSnapshot)
      : null;

  return {
    projectId: document.id,
    isDirty,
    canRecover: latestSnapshot !== null,
    recoveryToken,
    latestSnapshot,
  };
}

export function markRecoveryComplete(token: RecoveryToken): RecoveryToken {
  return { ...token, status: 'recovered' };
}
