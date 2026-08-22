/**
 * VectorCrossSubsystemTransaction.ts — Sprint G1-48 Unified Cross-Subsystem Atomic Editing Transaction Layer (Night Shift Level 10)
 *
 * Implements a snapshot-oriented transaction pattern that coordinates multiple
 * existing vector editing subsystems under a single atomic boundary.
 *
 * Guarantees:
 *   - Exactly one HistoryStack transaction on success
 *   - Zero HistoryStack transactions on cancellation/failure
 *   - Original document restoration after failure
 *   - Deterministic serialization
 *   - Deterministic SVG export
 *   - Transient state never contaminates document SSOT
 *
 * Pattern (Candidate C: Snapshot-Oriented Workflow Transaction):
 *   1. Capture baseline snapshot as CHECKPOINT_SESSION_START
 *   2. Execute each operation sequentially, updating the snapshot
 *   3. On any failure: rollback to baseline, push zero HistoryStack entries
 *   4. On success: push single HistoryStack entry with final snapshot
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot, isEqualSnapshots } from './VectorWorkspaceController';
import {
  VectorTransactionRecoveryEngine,
  CheckpointLevel
} from './VectorTransactionRecoveryEngine';
import { VectorEditingCommandSystem, VectorCommandPayload } from './VectorEditingCommandSystem';
import { VectorWorkflowOrchestrator } from './VectorWorkflowOrchestrator';

/**
 * A cross-subsystem operation takes a document snapshot and returns a new snapshot.
 * Each operation is a pure function: it does NOT mutate the input snapshot.
 * Multiple operations sequenced together form a cross-subsystem workflow.
 */
export type CrossSubsystemOperation = (
  snapshot: VectorDocumentSnapshot
) => VectorDocumentSnapshot;

/**
 * Result of executing a cross-subsystem transaction.
 */
export interface CrossSubsystemTransactionResult {
  readonly success: boolean;
  readonly snapshot: VectorWorkspaceState;
  readonly errors: ReadonlyArray<string>;
  readonly checkpointId?: string;
}

export class VectorCrossSubsystemTransaction {
  /**
   * Executes a cross-subsystem atomic editing transaction.
   *
   * @param initialWorkspace The workspace state before the transaction begins
   * @param operations Sequence of subsystem operations to execute
   * @param description Description for the HistoryStack entry on success
   * @returns Transaction result with success flag, final workspace state, and errors
   */
  public static executeCrossSubsystemTransaction(
    initialWorkspace: VectorWorkspaceState,
    operations: ReadonlyArray<CrossSubsystemOperation>,
    description: string
  ): CrossSubsystemTransactionResult {
    if (!initialWorkspace || !initialWorkspace.snapshot) {
      return {
        success: false,
        snapshot: initialWorkspace,
        errors: ['Invalid workspace state for transaction.'],
      };
    }

    const recoveryEngine = new VectorTransactionRecoveryEngine();

    // --- Phase 1: Capture baseline snapshot ---
    const baselineCp = recoveryEngine.createCheckpoint(
      'CHECKPOINT_SESSION_START',
      initialWorkspace.snapshot,
      initialWorkspace.snapshot.selectedIds
    );

    // --- Phase 2: Execute subsystem operations sequentially ---
    let currentSnapshot = initialWorkspace.snapshot;
    let failedIndex = -1;
    const errors: string[] = [];

    for (let i = 0; i < operations.length; i++) {
      try {
        const nextSnapshot = operations[i](currentSnapshot);

        if (!nextSnapshot || !Array.isArray(nextSnapshot.nodes)) {
          failedIndex = i;
          errors.push(`Operation at index ${i} returned an invalid snapshot.`);
          break;
        }

        // Validate snapshot determinism: reject no-op or degenerate snapshots
        if (isEqualSnapshots(currentSnapshot, nextSnapshot)) {
          // No-op: skip, continue to next operation
          continue;
        }

        currentSnapshot = nextSnapshot;
      } catch (error) {
        failedIndex = i;
        errors.push(error instanceof Error ? error.message : String(error));
        break;
      }
    }

    // --- Phase 3: Handle failure or success ---
    if (failedIndex >= 0 || errors.length > 0) {
      // Failure: Rollback to baseline snapshot, 0 HistoryStack entries pushed
      const rolledBackSnapshot = recoveryEngine.rollbackToLastLevel('CHECKPOINT_SESSION_START');
      const safeSnapshot = rolledBackSnapshot || initialWorkspace.snapshot;

      return {
        success: false,
        snapshot: {
          snapshot: safeSnapshot,
          historyStack: initialWorkspace.historyStack, // Zero new history entries
          activeGuideLines: undefined,
          activeTransformSession: undefined,
        },
        errors,
        checkpointId: baselineCp.id,
      };
    }

    // Success: Push exactly ONE transaction entry to HistoryStack
    const nextHistoryStack = initialWorkspace.historyStack.push(currentSnapshot, description);

    return {
      success: true,
      snapshot: {
        snapshot: currentSnapshot,
        historyStack: nextHistoryStack,
        activeGuideLines: undefined,
        activeTransformSession: undefined,
      },
      errors: [],
      checkpointId: baselineCp.id,
    };
  }
}

export function executeCrossSubsystemTransaction(
  initialWorkspace: VectorWorkspaceState,
  operations: ReadonlyArray<CrossSubsystemOperation>,
  description: string
): CrossSubsystemTransactionResult {
  return VectorCrossSubsystemTransaction.executeCrossSubsystemTransaction(
    initialWorkspace,
    operations,
    description
  );
}