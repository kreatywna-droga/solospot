import { describe, it, expect } from 'vitest';
import { WORKFLOW_AUTOMATION_RUN } from '../EndToEndWorkflows';

describe('AutomationWorkflow (PM47, ETAP 4)', () => {
  it('validates automation run workflow specifications', () => {
    expect(WORKFLOW_AUTOMATION_RUN.workflowKey).toBe('WorkflowAutomationRun');
    expect(WORKFLOW_AUTOMATION_RUN.steps).toHaveLength(1);
    expect(WORKFLOW_AUTOMATION_RUN.steps[0].module).toBe('automation');
  });
});
