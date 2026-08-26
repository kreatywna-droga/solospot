/**
 * SnapshotManager.ts — PM44 Project Snapshots & Restore Points (ETAP 6)
 *
 * DECISION-089: Snapshot Manager zapewnia deterministyczne odtwarzanie stanu projektu.
 *
 * Project state snapshotting, restore points, and snapshot metadata indexing.
 *
 * NO DOM, NO React, NO Browser API.
 */

import type { BuilderDocument } from '../../../builder-core/src/BuilderDocument';

export interface SnapshotMetadata {
  readonly snapshotId: string;
  readonly projectId: string;
  readonly label: string;
  readonly documentVersion: number;
  readonly createdAt: number;
  readonly createdByUserId: string;
}

export interface ProjectSnapshot {
  readonly metadata: SnapshotMetadata;
  readonly documentSnapshot: BuilderDocument;
}

export interface RestorePointResult {
  readonly restoredDocument: BuilderDocument;
  readonly metadata: SnapshotMetadata;
}

export interface SnapshotManagerState {
  readonly snapshots: ReadonlyArray<ProjectSnapshot>;
}

export const INITIAL_SNAPSHOT_MANAGER_STATE: SnapshotManagerState = {
  snapshots: [],
};

export function createSnapshotManagerState(
  initialSnapshots: ReadonlyArray<ProjectSnapshot> = []
): SnapshotManagerState {
  return {
    snapshots: [...initialSnapshots],
  };
}

/**
 * Creates a deterministic project state snapshot immutably.
 */
export function createProjectSnapshot(
  state: SnapshotManagerState,
  doc: BuilderDocument,
  label: string,
  createdByUserId: string
): { updatedState: SnapshotManagerState; snapshot: ProjectSnapshot } {
  const snapshotId = `snap-${doc.id}-v${doc.version}-${Date.now()}`;
  const metadata: SnapshotMetadata = {
    snapshotId,
    projectId: doc.id,
    label,
    documentVersion: doc.version,
    createdAt: Date.now(),
    createdByUserId,
  };

  const snapshot: ProjectSnapshot = {
    metadata,
    documentSnapshot: JSON.parse(JSON.stringify(doc)),
  };

  const filtered = state.snapshots.filter((s) => s.metadata.snapshotId !== snapshotId);
  const updatedState: SnapshotManagerState = {
    snapshots: [...filtered, snapshot],
  };

  return { updatedState, snapshot };
}

/**
 * Restores project state deterministically from a restore point snapshot.
 * DECISION-089: Ensures deterministic project state restoration.
 */
export function restoreProjectSnapshot(
  state: SnapshotManagerState,
  snapshotId: string
): RestorePointResult {
  const snapshot = state.snapshots.find((s) => s.metadata.snapshotId === snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot "${snapshotId}" not found in SnapshotManager.`);
  }

  const restoredDocument: BuilderDocument = JSON.parse(JSON.stringify(snapshot.documentSnapshot));

  return {
    restoredDocument,
    metadata: snapshot.metadata,
  };
}
