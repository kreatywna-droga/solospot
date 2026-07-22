import { Action, Execution, ExecutionLog } from './WorkflowDomain';
import { ActionEngine } from './ActionEngine';
import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';

export class WorkflowRuntime {
  private executions: Map<string, Execution> = new Map();

  constructor(private actionEngine: ActionEngine, private contextResolver: PlatformContextResolver) {}

  async runWorkflow(workflowId: string, triggerId: string, tenantId: string): Promise<Execution> {
    const execution: Execution = {
      id: `exec-${Date.now()}`,
      workflowId,
      triggerId,
      status: 'running',
      startedAt: new Date().toISOString()
    };

    this.executions.set(execution.id, execution);

    // Simulate workflow steps
    const actions = this.getActionsForWorkflow(workflowId);
    for (const action of actions) {
      const context = this.contextResolver.resolvePlatformContext(tenantId);
      const result = await this.executeWithRetry(action, context as unknown as Record<string, unknown> || {}, execution);

      if (!result.success && !action.compensation) {
        execution.status = 'failed';
        this.executions.set(execution.id, execution);
        return execution;
      }

      if (!result.success && action.compensation) {
        await this.actionEngine.executeAction(action.compensation, context as unknown as Record<string, unknown>);
        execution.status = 'failed';
        this.executions.set(execution.id, execution);
        return execution;
      }
    }

    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    this.executions.set(execution.id, execution);

    return execution;
  }

  private async executeWithRetry(
    action: Action,
    context: Record<string, unknown>,
    execution: Execution
  ): Promise<{ success: boolean; output?: unknown }> {
    let retries = action.retry || 0;
    let lastResult = { success: false };

    while (retries >= 0) {
      lastResult = await this.actionEngine.executeAction(action, context || {});
      if (lastResult.success) break;
      retries--;

      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return lastResult;
  }

  private getActionsForWorkflow(workflowId: string): Action[] {
    // In production, fetch from registry
    return [];
  }

  getExecution(id: string): Execution | undefined {
    return this.executions.get(id);
  }

  listExecutions(workflowId: string): Execution[] {
    return Array.from(this.executions.values()).filter(e => e.workflowId === workflowId);
  }
}