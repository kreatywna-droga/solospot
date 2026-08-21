/**
 * VectorTransactionRecoveryEngine.ts — Sprint G1-47 Transaction Recovery & Rollback Engine (Night Shift Level 9)
 *
 * Implements 6-level explicit recovery checkpoints, automated SSOT document snapshot rollback,
 * transaction validation verification, and error recovery.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorDocumentSnapshot } from './VectorWorkspaceController';

export type CheckpointLevel =
  | 'CHECKPOINT_SESSION_START'
  | 'CHECKPOINT_SELECTION'
  | 'CHECKPOINT_PREVIEW'
  | 'CHECKPOINT_COMMAND'
  | 'CHECKPOINT_TRANSACTION'
  | 'CHECKPOINT_VALIDATION';

export interface RecoveryCheckpointDTO {
  readonly id: string;
  readonly level: CheckpointLevel;
  readonly timestamp: number;
  readonly snapshot: VectorDocumentSnapshot;
  readonly selectedIds: ReadonlyArray<string>;
}

export class VectorTransactionRecoveryEngine {
  private checkpoints: RecoveryCheckpointDTO[] = [];

  /**
   * Creates an immutable recovery checkpoint storing document SSOT and selection state.
   */
  public createCheckpoint(
    level: CheckpointLevel,
    snapshot: VectorDocumentSnapshot,
    selectedIds: ReadonlyArray<string> = []
  ): RecoveryCheckpointDTO {
    const id = `cp_${level.toLowerCase()}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const safeSelected = Array.isArray(selectedIds) ? selectedIds : [];
    
    // Deep clone snapshot nodes and transform objects to prevent mutation leaks
    const clonedSnapshot: VectorDocumentSnapshot = {
      nodes: snapshot.nodes.map(n => ({ ...n, transform: { ...n.transform } })),
      selectedIds: [...safeSelected],
    };

    const checkpoint: RecoveryCheckpointDTO = {
      id,
      level,
      timestamp: Date.now(),
      snapshot: clonedSnapshot,
      selectedIds: [...safeSelected],
    };

    this.checkpoints.push(checkpoint);
    return checkpoint;
  }

  /**
   * Rolls back document state to a specific checkpoint by ID.
   */
  public rollbackToCheckpoint(checkpointId: string): VectorDocumentSnapshot | null {
    const cp = this.checkpoints.find(c => c.id === checkpointId);
    if (!cp) return null;

    return {
      nodes: cp.snapshot.nodes.map(n => ({ ...n, transform: { ...n.transform } })),
      selectedIds: [...cp.selectedIds],
    };
  }

  /**
   * Rolls back document state to the latest checkpoint at specified level.
   */
  public rollbackToLastLevel(level: CheckpointLevel): VectorDocumentSnapshot | null {
    const reversed = [...this.checkpoints].reverse();
    const cp = reversed.find(c => c.level === level);
    if (!cp) return null;

    return {
      nodes: cp.snapshot.nodes.map(n => ({ ...n, transform: { ...n.transform } })),
      selectedIds: [...cp.selectedIds],
    };
  }

  /**
   * Recovers from transaction or exception failure, restoring fallback snapshot.
   */
  public recoverFromError(
    failedSnapshot: VectorDocumentSnapshot,
    fallbackSnapshot: VectorDocumentSnapshot
  ): VectorDocumentSnapshot {
    if (!fallbackSnapshot || !Array.isArray(fallbackSnapshot.nodes)) {
      return { nodes: [], selectedIds: [] };
    }

    return {
      nodes: fallbackSnapshot.nodes.map(n => ({ ...n, transform: { ...n.transform } })),
      selectedIds: [...(fallbackSnapshot.selectedIds || [])],
    };
  }

  /**
   * Clears all recorded checkpoints.
   */
  public clearCheckpoints(): void {
    this.checkpoints = [];
  }

  /**
   * Returns list of recorded checkpoints.
   */
  public getCheckpoints(): ReadonlyArray<RecoveryCheckpointDTO> {
    return [...this.checkpoints];
  }
}
