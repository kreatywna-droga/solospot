import { describe, it, expect } from 'vitest';
import {
  createWorkflowExecutionPlan,
  type WorkflowDefinition,
  type WorkflowContext,
} from '../WorkflowDefinition';

const mockWorkflow: WorkflowDefinition = {
  workflowId: 'wf-batch-export',
  name: 'Batch Export Workflow',
  description: 'Exports animation packages in batch',
  version: '1.0.0',
  steps: [
    {
      stepId: 'step-1',
      name: 'Validate Timeline',
      actionType: 'validation_check',
      parameters: {},
      continueOnError: false,
    },
    {
      stepId: 'step-2',
      name: 'Export Package',
      actionType: 'export_trigger',
      parameters: { format: 'json' },
      continueOnError: false,
    },
  ],
};

const mockContext: WorkflowContext = {
  contextId: 'ctx-1',
  targetProjectId: 'proj-store-1',
  activeUserId: 'user-1',
  variables: {},
};

describe('WorkflowEngine (PM45, ETAP 1 & DECISION-090)', () => {
  it('creates declarative workflow execution plans without Runtime execution (DECISION-090)', () => {
    const plan = createWorkflowExecutionPlan(mockWorkflow, mockContext);
    expect(plan.isExecutable).toBe(true);
    expect(plan.estimatedStepCount).toBe(2);
    expect(plan.workflowId).toBe('wf-batch-export');
  });
});
