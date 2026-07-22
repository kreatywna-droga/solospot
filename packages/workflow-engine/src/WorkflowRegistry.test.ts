import { describe, it, expect } from 'vitest';
import { WorkflowRegistry } from './WorkflowRegistry';
import { Workflow, Trigger, Action } from './WorkflowDomain';

describe('WorkflowRegistry', () => {
  const registry = new WorkflowRegistry();

  it('should register workflow', () => {
    const workflow: Workflow = {
      id: 'wf-1',
      organizationId: 'org-1',
      name: 'Tenant Provisioning',
      versions: [
        {
          id: 'ver-1',
          workflowId: 'wf-1',
          version: 1,
          definition: { triggers: [], steps: [] },
          createdAt: new Date().toISOString()
        }
      ]
    };

    registry.registerWorkflow(workflow);
    expect(registry.getWorkflow('wf-1')).toBeDefined();
  });

  it('should register trigger', () => {
    const trigger: Trigger = {
      id: 'trig-1',
      type: 'eventbus',
      config: { eventType: 'Billing.SubscriptionActivated' },
      enabled: true
    };

    registry.registerTrigger(trigger);
    expect(registry.getTrigger('trig-1')).toBeDefined();
  });

  it('should register action', () => {
    const action: Action = {
      id: 'act-1',
      type: 'publish.deploy',
      config: { storeId: 'store-1' }
    };

    registry.registerAction(action);
    expect(registry.getAction('act-1')).toBeDefined();
  });

  it('should list workflows', () => {
    const workflows = registry.listWorkflows();
    expect(workflows.length).toBeGreaterThan(0);
  });
});