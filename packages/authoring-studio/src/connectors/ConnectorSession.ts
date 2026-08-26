/**
 * ConnectorSession.ts — Sprint S8 Authentication Models (ETAP 4)
 *
 * Session models for connector authentication. No OAuth implementation.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution, NO network communication.
 */

export type ConnectorSessionStatus = 'active' | 'expired' | 'revoked' | 'pending';

export interface ConnectorSession {
  readonly sessionId: string;
  readonly connectorId: string;
  readonly status: ConnectorSessionStatus;
  readonly createdAt: number;
  readonly expiresAt?: number;
  readonly lastUsedAt?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ConnectorSessionState {
  readonly sessions: ReadonlyArray<ConnectorSession>;
}

export function createConnectorSessionState(
  sessions: ReadonlyArray<ConnectorSession> = []
): ConnectorSessionState {
  return {
    sessions: [...sessions],
  };
}

export function createConnectorSession(
  connectorId: string,
  expiresAt?: number,
  metadata?: Readonly<Record<string, unknown>>
): ConnectorSession {
  return {
    sessionId: `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    connectorId,
    status: 'active',
    createdAt: Date.now(),
    expiresAt,
    metadata: metadata ? { ...metadata } : undefined,
  };
}

export function isSessionActive(
  session: ConnectorSession,
  now: number = Date.now()
): boolean {
  if (session.status !== 'active') {
    return false;
  }
  if (session.expiresAt !== undefined && now > session.expiresAt) {
    return false;
  }
  return true;
}

export function getActiveSession(
  state: ConnectorSessionState,
  connectorId: string
): ConnectorSession | undefined {
  return state.sessions.find(
    (s) => s.connectorId === connectorId && isSessionActive(s)
  );
}

export function revokeSession(
  state: ConnectorSessionState,
  sessionId: string
): ConnectorSessionState {
  return {
    sessions: state.sessions.map((s) =>
      s.sessionId === sessionId ? { ...s, status: 'revoked' } : s
    ),
  };
}

export function touchSession(
  state: ConnectorSessionState,
  sessionId: string
): ConnectorSessionState {
  return {
    sessions: state.sessions.map((s) =>
      s.sessionId === sessionId ? { ...s, lastUsedAt: Date.now() } : s
    ),
  };
}
