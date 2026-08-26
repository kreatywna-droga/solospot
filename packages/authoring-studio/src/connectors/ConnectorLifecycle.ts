/**
 * ConnectorLifecycle.ts — Sprint S8 Connector Framework (ETAP 1)
 *
 * Connector lifecycle state machine: registered → initializing → active → error → disabled.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type ConnectorLifecycleStatus =
  | 'registered'
  | 'initializing'
  | 'active'
  | 'error'
  | 'disabled';

export interface ConnectorLifecycleState {
  readonly connectorId: string;
  readonly status: ConnectorLifecycleStatus;
  readonly errorMessage?: string;
  readonly lastActivatedAt?: number;
  readonly lastErrorAt?: number;
}

export interface ConnectorLifecycleRegistryState {
  readonly lifecycles: ReadonlyArray<ConnectorLifecycleState>;
}

const VALID_TRANSITIONS: Readonly<
  Record<ConnectorLifecycleStatus, ReadonlyArray<ConnectorLifecycleStatus>>
> = {
  registered: ['initializing', 'disabled'],
  initializing: ['active', 'error', 'registered'],
  active: ['error', 'disabled', 'registered'],
  error: ['initializing', 'disabled', 'registered'],
  disabled: ['registered'],
};

export function createConnectorLifecycleRegistryState(
  lifecycles: ReadonlyArray<ConnectorLifecycleState> = []
): ConnectorLifecycleRegistryState {
  return {
    lifecycles: [...lifecycles],
  };
}

export function initializeConnectorLifecycle(
  connectorId: string
): ConnectorLifecycleState {
  return {
    connectorId,
    status: 'registered',
  };
}

export function transitionConnectorStatus(
  state: ConnectorLifecycleRegistryState,
  connectorId: string,
  nextStatus: ConnectorLifecycleStatus,
  errorMessage?: string
): ConnectorLifecycleRegistryState {
  const current = state.lifecycles.find((l) => l.connectorId === connectorId);
  if (!current) {
    return state;
  }

  const allowed = VALID_TRANSITIONS[current.status];
  if (!allowed.includes(nextStatus)) {
    return state;
  }

  const now = Date.now();
  const updated: ConnectorLifecycleState = {
    ...current,
    status: nextStatus,
    errorMessage: nextStatus === 'error' ? errorMessage : undefined,
    lastActivatedAt: nextStatus === 'active' ? now : current.lastActivatedAt,
    lastErrorAt: nextStatus === 'error' ? now : current.lastErrorAt,
  };

  return {
    lifecycles: state.lifecycles.map((l) =>
      l.connectorId === connectorId ? updated : l
    ),
  };
}

export function getConnectorLifecycle(
  state: ConnectorLifecycleRegistryState,
  connectorId: string
): ConnectorLifecycleState | undefined {
  return state.lifecycles.find((l) => l.connectorId === connectorId);
}

export function isConnectorActive(
  state: ConnectorLifecycleRegistryState,
  connectorId: string
): boolean {
  return (
    state.lifecycles.find((l) => l.connectorId === connectorId)?.status ===
    'active'
  );
}

export function canTransition(
  current: ConnectorLifecycleStatus,
  next: ConnectorLifecycleStatus
): boolean {
  return VALID_TRANSITIONS[current].includes(next);
}
