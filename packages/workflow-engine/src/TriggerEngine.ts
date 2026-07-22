import { Trigger, Execution } from './WorkflowDomain';
import { PlatformEventBus } from '../../platform-core/src/events/PlatformEventBus';

export class TriggerEngine {
  private triggers: Map<string, Trigger> = new Map();

  constructor(private eventBus: PlatformEventBus) {}

  registerTrigger(trigger: Trigger): void {
    this.triggers.set(trigger.id, trigger);

    if (trigger.type === 'eventbus') {
      this.eventBus.subscribe((trigger.config.eventType as string) || '*', async (event) => {
        await this.executeWorkflow(trigger, { payload: event });
      });
    }
  }

  private async executeWorkflow(trigger: Trigger, event: { payload?: unknown }): Promise<Execution | null> {
    const execution: Execution = {
      id: `exec-${Date.now()}`,
      workflowId: trigger.id,
      triggerId: trigger.id,
      status: 'pending',
      startedAt: new Date().toISOString()
    };

    return execution;
  }

  getTrigger(id: string): Trigger | undefined {
    return this.triggers.get(id);
  }

  listTriggers(): Trigger[] {
    return Array.from(this.triggers.values());
  }
}