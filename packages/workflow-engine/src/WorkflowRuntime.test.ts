import { describe, it, expect } from 'vitest';
import { WorkflowRuntime } from './WorkflowRuntime';
import { ActionEngine, ActionHandler } from './ActionEngine';
import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';
import { PlatformIdentityRegistry } from '../../platform-identity/src/PlatformIdentityRegistry';
import { Action } from './WorkflowDomain';
import { PlanType, SubscriptionStatus } from '../../platform-identity/src/PlatformIdentity';

describe('WorkflowGoldenFlow', () => {
  const registry = new PlatformIdentityRegistry();
  const contextResolver = new PlatformContextResolver(registry);
  const actionEngine = new ActionEngine(contextResolver);
  const runtime = new WorkflowRuntime(actionEngine, contextResolver);

  registry.registerOrganization({ id: 'org-1', name: 'Org', createdAt: '' });
  registry.registerWorkspace({ id: 'ws-1', name: 'WS', organizationId: 'org-1', createdAt: '', updatedAt: '' });
  registry.registerTenant({ id: 't-1', name: 'Store', workspaceId: 'ws-1', slug: 'store', createdAt: '' });
  registry.registerPlan({ type: PlanType.STARTER, name: 'Starter', limits: { stores: 5, users: 3, bandwidthGb: 100, storageGb: 10, apiCallsPerDay: 10000, aiCreditsPerDay: 1000 }, features: ['builder', 'customDomains'], priceMonthly: 29 });
  registry.registerSubscription({ id: 'sub-1', organizationId: 'org-1', planType: PlanType.STARTER, status: SubscriptionStatus.ACTIVE, startedAt: '' });

  const publishHandler: ActionHandler = {
    execute: async (action) => ({ success: true, output: { published: true } })
  };

  const notifyHandler: ActionHandler = {
    execute: async (action) => ({ success: true, output: { sent: true } })
  };

  actionEngine.registerHandler('publish.deploy', publishHandler);
  actionEngine.registerHandler('notify.email', notifyHandler);

  it('should run workflow and complete', async () => {
    const action: Action = {
      id: 'wf-act-1',
      type: 'publish.deploy',
      config: { storeId: 't-1' }
    };

    // Manually inject action into runtime for test
    (runtime as unknown as { getActionsForWorkflow: (id: string) => Action[] }).getActionsForWorkflow = () => [action];

    const execution = await runtime.runWorkflow('wf-provisioning', 'trig-billing', 't-1');

    expect(execution.status).toBe('completed');
    expect(execution.completedAt).toBeDefined();
  });

  it('should run workflow with rollback on failure', async () => {
    const failingHandler: ActionHandler = {
      execute: async () => ({ success: false })
    };

    actionEngine.registerHandler('failing.action', failingHandler);

    (runtime as unknown as { getActionsForWorkflow: (id: string) => Action[] }).getActionsForWorkflow = () => [
      { id: 'fail-1', type: 'failing.action', config: {}, compensation: { id: 'comp-1', type: 'notify.email', config: {} } }
    ];

    const execution = await runtime.runWorkflow('wf-failing', 'trig-test', 't-1');

    expect(execution.status).toBe('failed');
  });

  it('should list executions', async () => {
    const executions = runtime.listExecutions('wf-test');
    expect(Array.isArray(executions)).toBe(true);
  });
});