/**
 * ExecutionPlan.ts — Execution State Tracking for HACP
 *
 * Tracks the state of a multi-step execution plan.
 * The model SELECTS, the controller EXECUTES, HACP SECURES.
 *
 * ExecutionPlan does NOT replace BuilderDocument.
 * It is purely an execution tracking mechanism.
 */

import type { IntentCategory } from './IntentClassifier';

export type PlanStepAction =
  | 'CLASSIFY_INTENT'
  | 'SEARCH_LIBRARY'
  | 'SELECT_TEMPLATE'
  | 'SELECT_EXPERIENCE'
  | 'INSERT_SECTION'
  | 'INSERT_EXPERIENCE'
  | 'CONFIGURE_EXPERIENCE'
  | 'EDIT_NODE'
  | 'MOVE_SECTION'
  | 'DELETE_NODE'
  | 'APPLY_STYLE'
  | 'APPLY_THEME'
  | 'VERIFY'
  | 'REFINE'
  | 'DONE'
  | 'FAILED'
  | 'CLARIFICATION_REQUIRED';

export type PlanStepStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'FAILED' | 'SKIPPED';

export interface PlanStep {
  action: PlanStepAction;
  target?: string;
  status: PlanStepStatus;
  result?: unknown;
  error?: string;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

export interface ExecutionPlan {
  id: string;
  intent: IntentCategory;
  originalPrompt: string;
  steps: PlanStep[];
  currentStepIndex: number;
  status: 'PLANNING' | 'EXECUTING' | 'VERIFYING' | 'REFINING' | 'DONE' | 'FAILED';
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, unknown>;
}

export class ExecutionPlanManager {
  private static counter = 0;

  /**
   * Create a new execution plan from a classified intent.
   */
  static createPlan(
    intent: IntentCategory,
    prompt: string,
    targets: string[],
    parameters: Record<string, unknown> = {}
  ): ExecutionPlan {
    const steps = this.buildStepsForIntent(intent, targets, parameters);

    return {
      id: `plan-${Date.now()}-${++this.counter}`,
      intent,
      originalPrompt: prompt,
      steps,
      currentStepIndex: 0,
      status: 'PLANNING',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: parameters,
    };
  }

  /**
   * Build step sequence for a given intent.
   */
  private static buildStepsForIntent(
    intent: IntentCategory,
    targets: string[],
    parameters: Record<string, unknown>
  ): PlanStep[] {
    switch (intent) {
      case 'INSERT_SECTION':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          {
            action: 'SEARCH_LIBRARY',
            target: targets[0] || 'section',
            status: 'PENDING',
          },
          { action: 'SELECT_TEMPLATE', status: 'PENDING' },
          { action: 'INSERT_SECTION', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'INSERT_EXPERIENCE':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          {
            action: 'SEARCH_LIBRARY',
            target: targets[0] || 'experience',
            status: 'PENDING',
          },
          { action: 'SELECT_EXPERIENCE', status: 'PENDING' },
          { action: 'INSERT_EXPERIENCE', status: 'PENDING' },
          { action: 'CONFIGURE_EXPERIENCE', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'INSERT_SITE_TEMPLATE':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          {
            action: 'SEARCH_LIBRARY',
            target: targets[0] || 'template',
            status: 'PENDING',
          },
          { action: 'SELECT_TEMPLATE', status: 'PENDING' },
          { action: 'INSERT_SECTION', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'EDIT_NODE':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'EDIT_NODE', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'MOVE_SECTION':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'MOVE_SECTION', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'DELETE':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'DELETE_NODE', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'STYLE':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'APPLY_STYLE', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'DESIGN_SYSTEM':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'APPLY_THEME', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'SITE_GENERATION':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          {
            action: 'SEARCH_LIBRARY',
            target: 'website-template',
            status: 'PENDING',
          },
          { action: 'SELECT_TEMPLATE', status: 'PENDING' },
          { action: 'INSERT_SECTION', status: 'PENDING' },
          { action: 'VERIFY', status: 'PENDING' },
          { action: 'REFINE', status: 'PENDING' },
        ];

      case 'INSPECT':
      case 'AUDIT':
      case 'DEBUG':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'VERIFY', status: 'PENDING' },
        ];

      case 'UNDO':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'DONE', status: 'PENDING' },
        ];

      case 'REDO':
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'DONE', status: 'PENDING' },
        ];

      default:
        return [
          { action: 'CLASSIFY_INTENT', status: 'DONE' },
          { action: 'DONE', status: 'PENDING' },
        ];
    }
  }

  /**
   * Mark current step as done and advance.
   */
  static advancePlan(plan: ExecutionPlan, result?: unknown): ExecutionPlan {
    const updated = { ...plan, updatedAt: Date.now() };
    const currentStep = updated.steps[updated.currentStepIndex];
    if (currentStep) {
      updated.steps[updated.currentStepIndex] = {
        ...currentStep,
        status: 'DONE',
        result,
      };
    }
    updated.currentStepIndex++;
    if (updated.currentStepIndex >= updated.steps.length) {
      updated.status = 'DONE';
    }
    return updated;
  }

  /**
   * Mark current step as failed.
   */
  static failPlan(plan: ExecutionPlan, error: string): ExecutionPlan {
    const updated = { ...plan, updatedAt: Date.now(), status: 'FAILED' as const };
    const currentStep = updated.steps[updated.currentStepIndex];
    if (currentStep) {
      updated.steps[updated.currentStepIndex] = {
        ...currentStep,
        status: 'FAILED',
        error,
      };
    }
    return updated;
  }

  /**
   * Get current step from plan.
   */
  static getCurrentStep(plan: ExecutionPlan): PlanStep | undefined {
    return plan.steps[plan.currentStepIndex];
  }

  /**
   * Add a step to the plan (for dynamic step injection).
   */
  static addStep(plan: ExecutionPlan, step: PlanStep, afterIndex?: number): ExecutionPlan {
    const updated = { ...plan, updatedAt: Date.now() };
    const insertAt = afterIndex !== undefined ? afterIndex + 1 : updated.steps.length;
    updated.steps = [
      ...updated.steps.slice(0, insertAt),
      step,
      ...updated.steps.slice(insertAt),
    ];
    return updated;
  }
}
