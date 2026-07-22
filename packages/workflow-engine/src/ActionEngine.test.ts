import { describe, it, expect } from 'vitest';
import { ActionEngine, ActionHandler } from './ActionEngine';
import { PlatformIdentityRegistry } from '../../platform-identity/src/PlatformIdentityRegistry';
import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';
import { Action, Condition } from './WorkflowDomain';

describe('ActionEngine', () => {
  const registry = new PlatformIdentityRegistry();
  const contextResolver = new PlatformContextResolver(registry);
  const engine = new ActionEngine(contextResolver);

  const mockHandler: ActionHandler = {
    execute: async (action) => ({ success: true, output: action.config })
  };

  it('should register handler', () => {
    engine.registerHandler('test.action', mockHandler);
  });

  it('should execute action', async () => {
    engine.registerHandler('test.action2', mockHandler);

    const action: Action = {
      id: 'act-1',
      type: 'test.action2',
      config: { value: 123 }
    };

    const result = await engine.executeAction(action, {});
    expect(result.success).toBe(true);
  });

  it('should evaluate conditions', async () => {
    const action: Action = {
      id: 'act-2',
      type: 'test.action',
      config: {},
      conditions: [{ type: 'equals', field: 'status', value: 'ready' }]
    };

    const result = await engine.executeAction(action, { status: 'ready' });
    expect(result.success).toBe(true);
  });

  it('should skip action when condition not met', async () => {
    const action: Action = {
      id: 'act-3',
      type: 'test.action',
      config: {},
      conditions: [{ type: 'equals', field: 'status', value: 'ready' }]
    };

    const result = await engine.executeAction(action, { status: 'pending' });
    expect(result.success).toBe(true);
    expect(result.output).toBeNull();
  });
});