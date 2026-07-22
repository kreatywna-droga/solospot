import { describe, it, expect } from 'vitest';
import { TriggerEngine } from './TriggerEngine';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { Trigger } from './WorkflowDomain';

describe('TriggerEngine', () => {
  const eventBus = new PlatformEventBusImpl();
  const engine = new TriggerEngine(eventBus);

  it('should register trigger', () => {
    const trigger: Trigger = {
      id: 'trig-1',
      type: 'eventbus',
      config: { eventType: 'Test.Event' },
      enabled: true
    };

    engine.registerTrigger(trigger);
    expect(engine.getTrigger('trig-1')).toBeDefined();
  });

  it('should list triggers', () => {
    const triggers = engine.listTriggers();
    expect(triggers.length).toBeGreaterThan(0);
  });
});