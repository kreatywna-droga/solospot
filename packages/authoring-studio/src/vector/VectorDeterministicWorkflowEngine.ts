/**
 * VectorDeterministicWorkflowEngine.ts — Sprint G1-49 Vector Deterministic Workflow Engine (Night Shift Level 11)
 *
 * Implements a strict, deterministic pipeline for complex cross-subsystem workflows.
 * Guarantees exactly 1 HistoryStack entry for a successful workflow, and 0 for failures.
 * Incorporates Checkpointing, Execution, Rollback, and Validation phases.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from './VectorWorkspaceController';
import { VectorWorkflowDefinition } from './VectorWorkflowDefinition';
import { VectorTransactionRecoveryEngine } from './VectorTransactionRecoveryEngine';

export interface WorkflowExecutionResult {
  readonly success: boolean;
  readonly state: VectorWorkspaceState;
  readonly error?: string;
  readonly failedStepId?: string;
}

export class VectorDeterministicWorkflowEngine {
  private static recoveryEngine = new VectorTransactionRecoveryEngine();

  public static getRecoveryEngine(): VectorTransactionRecoveryEngine {
    return VectorDeterministicWorkflowEngine.recoveryEngine;
  }

  /**
   * Executes a deterministic workflow pipeline.
   * 
   * Pipeline Steps:
   * 1. Checkpoint - Records initial state
   * 2. Pre-flight Validation - Validates baseline
   * 3. Execution - Sequentially executes steps with intermediate error catching
   * 4. Post-flight Validation - Validates resulting snapshot integrity
   * 5. Commit/Rollback - Applies to HistoryStack or rolls back to Checkpoint.
   */
  public static executeWorkflow(
    state: VectorWorkspaceState,
    workflow: VectorWorkflowDefinition
  ): WorkflowExecutionResult {
    if (!state || !state.snapshot) {
      return { success: false, state, error: 'Invalid state' };
    }

    if (!workflow || !Array.isArray(workflow.steps)) {
      return { success: false, state, error: 'Invalid workflow definition' };
    }

    // 1. Checkpoint
    const checkpoint = VectorDeterministicWorkflowEngine.recoveryEngine.createCheckpoint(
      'CHECKPOINT_TRANSACTION',
      state.snapshot,
      state.snapshot.selectedIds
    );

    // 2. Pre-flight Validation
    if (workflow.validatePreFlight) {
      try {
        const valResult = workflow.validatePreFlight(state.snapshot);
        if (valResult !== true) {
          return {
            success: false,
            state, // untouched
            error: typeof valResult === 'string' ? valResult : 'Pre-flight validation failed',
          };
        }
      } catch (err) {
        return {
          success: false,
          state, // untouched
          error: `Pre-flight validation exception: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    let currentSnapshot = checkpoint.snapshot;

    // 3. Execution Phase
    for (const step of workflow.steps) {
      try {
        const nextSnapshot = step.operation(currentSnapshot);
        
        if (nextSnapshot instanceof Error) {
          // Explicit rollback
          return {
            success: false,
            state, // rollback to original (unchanged HistoryStack)
            error: nextSnapshot.message,
            failedStepId: step.id,
          };
        }
        if (!nextSnapshot || !Array.isArray(nextSnapshot.nodes)) {
           // Explicit rollback
          return {
             success: false,
             state,
             error: `Step ${step.id} returned invalid snapshot`,
             failedStepId: step.id,
          };
        }

        // Subsystem serialization failure check (e.g. topology destroyed the tree)
        if (nextSnapshot.nodes.some((n: any) => !n || !n.id || !n.type)) {
          return {
            success: false,
            state,
            error: `Step ${step.id} corrupted snapshot nodes`,
            failedStepId: step.id,
          };
        }

        currentSnapshot = nextSnapshot;
      } catch (err) {
        // Unexpected Subsystem Failure / Exception -> Rollback
        return {
          success: false,
          state,
          error: `Step ${step.id} threw an exception: ${err instanceof Error ? err.message : String(err)}`,
          failedStepId: step.id,
        };
      }
    }

    // 4. Post-flight Validation
    if (workflow.validatePostFlight) {
      try {
        const valResult = workflow.validatePostFlight(currentSnapshot);
        if (valResult !== true) {
          return {
            success: false,
            state, // rollback
            error: typeof valResult === 'string' ? valResult : 'Post-flight validation failed',
          };
        }
      } catch (err) {
        return {
          success: false,
          state, // rollback
          error: `Post-flight validation exception: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }

    // Empty workflows or no-op workflows shouldn't polute the stack
    if (JSON.stringify(state.snapshot) === JSON.stringify(currentSnapshot)) {
      return { success: true, state };
    }

    // 5. Commit to HistoryStack (exactly 1 transaction)
    try {
      const nextHistoryStack = state.historyStack.push(currentSnapshot, workflow.description);

      return {
        success: true,
        state: {
          snapshot: currentSnapshot,
          historyStack: nextHistoryStack,
          activeGuideLines: undefined,
          activeTransformSession: undefined,
        },
      };
    } catch (err) {
      // HistoryStack Integrity Violation Attempt -> Rollback
      return {
        success: false,
        state,
        error: `HistoryStack commit failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Resumes an interrupted workflow by executing remaining steps from a given intermediate snapshot.
   * Note: This is an advanced recovery feature for Controlled Interruptions.
   */
  public static resumeWorkflow(
    state: VectorWorkspaceState,
    workflow: VectorWorkflowDefinition,
    intermediateSnapshot: VectorDocumentSnapshot,
    startStepIndex: number
  ): WorkflowExecutionResult {
    if (!state || !state.snapshot || !intermediateSnapshot) {
      return { success: false, state, error: 'Invalid resume state' };
    }

    if (startStepIndex < 0 || startStepIndex >= workflow.steps.length) {
      return { success: false, state, error: 'Invalid start step index' };
    }

    let currentSnapshot = intermediateSnapshot;

    for (let i = startStepIndex; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      try {
        const nextSnapshot = step.operation(currentSnapshot);
        if (nextSnapshot instanceof Error) {
          return { success: false, state, error: nextSnapshot.message, failedStepId: step.id };
        }
        if (!nextSnapshot || !Array.isArray(nextSnapshot.nodes)) {
          return { success: false, state, error: `Step ${step.id} returned invalid snapshot`, failedStepId: step.id };
        }
        currentSnapshot = nextSnapshot;
      } catch (err) {
        return { success: false, state, error: `Step ${step.id} threw an exception`, failedStepId: step.id };
      }
    }

    if (workflow.validatePostFlight) {
      try {
        const valResult = workflow.validatePostFlight(currentSnapshot);
        if (valResult !== true) {
          return { success: false, state, error: typeof valResult === 'string' ? valResult : 'Post-flight validation failed' };
        }
      } catch (err) {
         return { success: false, state, error: 'Post-flight validation exception' };
      }
    }

    if (JSON.stringify(state.snapshot) === JSON.stringify(currentSnapshot)) {
      return { success: true, state };
    }

    try {
      const nextHistoryStack = state.historyStack.push(currentSnapshot, `${workflow.description} (Resumed)`);
      return {
        success: true,
        state: {
          snapshot: currentSnapshot,
          historyStack: nextHistoryStack,
          activeGuideLines: undefined,
          activeTransformSession: undefined,
        },
      };
    } catch (err) {
      return { success: false, state, error: 'HistoryStack commit failed' };
    }
  }
}
