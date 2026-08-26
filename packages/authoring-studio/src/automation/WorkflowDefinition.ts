/**
 * WorkflowDefinition.ts & WorkflowStep.ts — PM45 Workflow Engine Specification (ETAP 1)
 *
 * DECISION-090: Workflow Engine opisuje wyłącznie deklaratywne przepływy.
 *
 * Declarative workflow definitions, step descriptors, execution context, and execution plan models.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type StepActionType = 'preset_apply' | 'export_trigger' | 'batch_rename' | 'metadata_update' | 'validation_check';

export interface WorkflowStep {
  readonly stepId: string;
  readonly name: string;
  readonly actionType: StepActionType;
  readonly parameters: Record<string, unknown>;
  readonly continueOnError: boolean;
}

export interface WorkflowContext {
  readonly contextId: string;
  readonly targetProjectId: string;
  readonly activeUserId: string;
  readonly variables: Record<string, unknown>;
}

export interface WorkflowDefinition {
  readonly workflowId: string;
  readonly name: string;
  readonly description: string;
  readonly steps: ReadonlyArray<WorkflowStep>;
  readonly version: string;
}

export interface WorkflowExecutionPlan {
  readonly planId: string;
  readonly workflowId: string;
  readonly context: WorkflowContext;
  readonly estimatedStepCount: number;
  readonly isExecutable: boolean;
}

export function createWorkflowExecutionPlan(
  workflow: WorkflowDefinition,
  context: WorkflowContext
): WorkflowExecutionPlan {
  return {
    planId: `plan-${workflow.workflowId}-${Date.now()}`,
    workflowId: workflow.workflowId,
    context,
    estimatedStepCount: workflow.steps.length,
    isExecutable: workflow.steps.length > 0,
  };
}
