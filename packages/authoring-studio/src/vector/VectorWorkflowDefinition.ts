/**
 * VectorWorkflowDefinition.ts — Sprint G1-49 Vector Workflow Definition (Night Shift Level 11)
 *
 * Defines the contract for a deterministic workflow pipeline.
 *
 * Pure headless TS engine, NO DOM, NO React, ZERO Browser APIs.
 */

import { VectorDocumentSnapshot } from './VectorWorkspaceController';

export interface WorkflowValidationPhase {
  (snapshot: VectorDocumentSnapshot): boolean | string;
}

export interface WorkflowExecutionStep {
  readonly id: string;
  readonly operation: (snapshot: VectorDocumentSnapshot) => VectorDocumentSnapshot | Error;
}

export interface VectorWorkflowDefinition {
  readonly workflowId: string;
  readonly description: string;
  readonly validatePreFlight?: WorkflowValidationPhase;
  readonly validatePostFlight?: WorkflowValidationPhase;
  readonly steps: ReadonlyArray<WorkflowExecutionStep>;
  readonly isBatch?: boolean;
}
