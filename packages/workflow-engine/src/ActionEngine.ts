import { Action, Execution, ExecutionLog, Condition } from './WorkflowDomain';
import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';

export interface ActionHandler {
  execute(action: Action, context: Record<string, unknown>): Promise<{ success: boolean; output?: unknown }>;
}

export class ActionEngine {
  private handlers: Map<string, ActionHandler> = new Map();

  constructor(private contextResolver: PlatformContextResolver) {}

  registerHandler(type: string, handler: ActionHandler): void {
    this.handlers.set(type, handler);
  }

  async executeAction(action: Action, context: Record<string, unknown>): Promise<{ success: boolean; output?: unknown }> {
    const handler = this.handlers.get(action.type);
    if (!handler) {
      return { success: false };
    }

    if (!this.evaluateConditions(action.conditions || [], context)) {
      return { success: true, output: null };
    }

    return handler.execute(action, context);
  }

  private evaluateConditions(conditions: Condition[], context: Record<string, unknown>): boolean {
    for (const condition of conditions) {
      const value = context[condition.field];

      switch (condition.type) {
        case 'equals':
          if (value !== condition.value) return false;
          break;
        case 'contains':
          if (typeof value === 'string' && !value.includes(condition.value as string)) return false;
          break;
        case 'and':
          if (!this.evaluateConditions(condition.children || [], context)) return false;
          break;
        case 'or':
          if (condition.children && !this.evaluateConditions(condition.children, context)) return false;
          break;
      }
    }

    return true;
  }
}