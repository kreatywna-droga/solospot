import { describe, it, expect } from 'vitest';
import {
  createPluginLifecycleSession,
  transitionLifecycleState,
} from '../PluginLifecycle';

describe('PluginLifecycle (PM43, ETAP 7)', () => {
  it('manages plugin lifecycle state machine transitions immutably', () => {
    let session = createPluginLifecycleSession('plugin-sample');
    expect(session.currentState).toBe('uninstalled');

    session = transitionLifecycleState(session, 'installed');
    session = transitionLifecycleState(session, 'loaded');
    session = transitionLifecycleState(session, 'initialized');
    session = transitionLifecycleState(session, 'active');

    expect(session.currentState).toBe('active');
    expect(session.history).toHaveLength(5);
  });
});
