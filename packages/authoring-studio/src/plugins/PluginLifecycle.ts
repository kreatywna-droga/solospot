/**
 * PluginLifecycle.ts — PM43 Plugin Lifecycle Management (ETAP 7)
 *
 * Lifecycle transitions state machine:
 *   - install
 *   - load
 *   - initialize
 *   - activate
 *   - deactivate
 *   - unload
 *   - uninstall
 *
 * NO DOM, NO React, NO Browser API.
 */

export type LifecycleState =
  | 'uninstalled'
  | 'installed'
  | 'loaded'
  | 'initialized'
  | 'active'
  | 'inactive'
  | 'error';

export interface PluginLifecycleSession {
  readonly pluginId: string;
  readonly currentState: LifecycleState;
  readonly history: ReadonlyArray<{ state: LifecycleState; timestamp: number }>;
}

export function createPluginLifecycleSession(pluginId: string): PluginLifecycleSession {
  const now = Date.now();
  return {
    pluginId,
    currentState: 'uninstalled',
    history: [{ state: 'uninstalled', timestamp: now }],
  };
}

/**
 * Transitions plugin lifecycle session state immutably.
 */
export function transitionLifecycleState(
  session: PluginLifecycleSession,
  targetState: LifecycleState
): PluginLifecycleSession {
  const now = Date.now();
  return {
    ...session,
    currentState: targetState,
    history: [...session.history, { state: targetState, timestamp: now }],
  };
}
