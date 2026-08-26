/**
 * ConnectorLifecycle.test.ts — Sprint S8 Connector Framework Tests
 *
 * Unit tests for connector lifecycle management.
 */

import { describe, it, expect } from 'vitest';
import {
  createConnectorLifecycleRegistryState,
  initializeConnectorLifecycle,
  transitionConnectorStatus,
  getConnectorLifecycle,
  isConnectorActive,
  canTransition,
} from '../ConnectorLifecycle';

describe('ConnectorLifecycle', () => {
  it('should create lifecycle in registered state', () => {
    const state = createConnectorLifecycleRegistryState();
    const lifecycle = initializeConnectorLifecycle('lifecycle-test');

    expect(lifecycle.status).toBe('registered');
    expect(lifecycle.connectorId).toBe('lifecycle-test');
  });

  it('should transition from registered to initializing', () => {
    const state = createConnectorLifecycleRegistryState();
    const initialized = initializeConnectorLifecycle('test-connector');
    const updatedState = transitionConnectorStatus(
      state,
      'test-connector',
      'initializing'
    );

    const updated = getConnectorLifecycle(updatedState, 'test-connector');
    expect(updated?.status).toBe('initializing');
  });

  it('should transition through full lifecycle', () => {
    let state = createConnectorLifecycleRegistryState();
    state = transitionConnectorStatus(
      state,
      'test-connector',
      'initializing'
    );
    state = transitionConnectorStatus(state, 'test-connector', 'active');
    state = transitionConnectorStatus(state, 'test-connector', 'error');
    state = transitionConnectorStatus(state, 'test-connector', 'initializing');
    state = transitionConnectorStatus(state, 'test-connector', 'active');
    state = transitionConnectorStatus(state, 'test-connector', 'disabled');

    const final = getConnectorLifecycle(state, 'test-connector');
    expect(final?.status).toBe('disabled');
  });

  it('should not allow invalid transitions', () => {
    const state = createConnectorLifecycleRegistryState();
    const initialized = initializeConnectorLifecycle('test-connector');
    const updatedState = transitionConnectorStatus(
      state,
      'test-connector',
      'active'
    );

    // Cannot go from registered to active directly
    const active = getConnectorLifecycle(updatedState, 'test-connector');
    expect(active?.status).toBe('registered');
  });

  it('should check if connector is active', () => {
    let state = createConnectorLifecycleRegistryState();
    state = transitionConnectorStatus(
      state,
      'test-connector',
      'initializing'
    );
    state = transitionConnectorStatus(state, 'test-connector', 'active');

    expect(isConnectorActive(state, 'test-connector')).toBe(true);
    expect(isConnectorActive(state, 'non-existent')).toBe(false);
  });

  it('should validate transitions with canTransition', () => {
    expect(canTransition('registered', 'initializing')).toBe(true);
    expect(canTransition('registered', 'active')).toBe(false);
    expect(canTransition('active', 'disabled')).toBe(true);
    expect(canTransition('disabled', 'registered')).toBe(true);
  });
});