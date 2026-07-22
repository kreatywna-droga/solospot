import { Workflow, WorkflowVersion, Trigger, Action, Condition } from './WorkflowDomain';

export class WorkflowRegistry {
  private workflows: Map<string, Workflow> = new Map();
  private triggers: Map<string, Trigger> = new Map();
  private actions: Map<string, Action> = new Map();
  private conditions: Map<string, Condition> = new Map();

  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  registerAction(action: Action): void {
    this.actions.set(action.id, action);
  }

  registerCondition(condition: Condition): void {
    this.conditions.set(`${condition.type}-${condition.field}`, condition);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getTrigger(id: string): Trigger | undefined {
    return this.triggers.get(id);
  }

  getAction(id: string): Action | undefined {
    return this.actions.get(id);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  listTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }

  listActions(): Action[] {
    return Array.from(this.actions.values());
  }
}