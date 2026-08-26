/**
 * ConnectorSessionIdentity.test.ts — Sprint S8 Connector Framework Tests
 *
 * Unit tests for connector session and identity management.
 */

import { describe, it, expect } from 'vitest';
import {
  createConnectorSessionState,
  createConnectorSession,
  isSessionActive,
  getActiveSession,
  revokeSession,
  touchSession,
} from '../ConnectorSession';

describe('ConnectorSessionIdentity', () => {
  it('should create session state', () => {
    const state = createConnectorSessionState();

    expect(state.sessions).toHaveLength(0);
  });

  it('should create a new session', () => {
    const session = createConnectorSession('connector-1');

    expect(session.connectorId).toBe('connector-1');
    expect(session.status).toBe('active');
    expect(session.sessionId).toBeDefined();
  });

  it('should create session with expiration', () => {
    const expiresAt = Date.now() + 3600000;
    const session = createConnectorSession('connector-1', expiresAt);

    expect(session.expiresAt).toBe(expiresAt);
  });

  it('should check if session is active', () => {
    const session = createConnectorSession('connector-1');
    const now = Date.now();

    expect(isSessionActive(session, now)).toBe(true);
  });

  it('should detect expired session', () => {
    const session = createConnectorSession('connector-1', Date.now() - 1000);
    const now = Date.now();

    expect(isSessionActive(session, now)).toBe(false);
  });

  it('should get active session for connector', () => {
    let state = createConnectorSessionState();
    const session = createConnectorSession('connector-1');
    state = {
      sessions: [...state.sessions, session],
    };

    const active = getActiveSession(state, 'connector-1');
    expect(active).toBeDefined();
    expect(active?.sessionId).toBe(session.sessionId);
  });

  it('should revoke session', () => {
    let state = createConnectorSessionState();
    const session = createConnectorSession('connector-1');
    state = {
      sessions: [...state.sessions, session],
    };

    const revokedState = revokeSession(state, session.sessionId);
    const revoked = revokedState.sessions.find((s) => s.sessionId === session.sessionId);

    expect(revoked?.status).toBe('revoked');
  });

  it('should touch session to update lastUsedAt', () => {
    let state = createConnectorSessionState();
    const session = createConnectorSession('connector-1');
    state = {
      sessions: [...state.sessions, session],
    };

    const touchedState = touchSession(state, session.sessionId);
    const touched = touchedState.sessions.find((s) => s.sessionId === session.sessionId);

    expect(touched?.lastUsedAt).toBeDefined();
    expect(touched?.lastUsedAt).toBeGreaterThanOrEqual(session.createdAt);
  });
});