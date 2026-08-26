/**
 * ConnectorRegistry.ts — Sprint S8 Connector Framework (ETAP 1)
 *
 * Registry of connector definitions with registration, lookup, and query capabilities.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

import type { ConnectorDefinition, ConnectorType } from './ConnectorDefinition';

export interface ConnectorRegistryState {
  readonly connectors: ReadonlyArray<ConnectorDefinition>;
}

export function createConnectorRegistryState(
  connectors: ReadonlyArray<ConnectorDefinition> = []
): ConnectorRegistryState {
  return {
    connectors: [...connectors],
  };
}

export function registerConnector(
  state: ConnectorRegistryState,
  connector: ConnectorDefinition
): ConnectorRegistryState {
  const filtered = state.connectors.filter(
    (c) => c.connectorId !== connector.connectorId
  );
  return {
    connectors: [...filtered, connector],
  };
}

export function unregisterConnector(
  state: ConnectorRegistryState,
  connectorId: string
): ConnectorRegistryState {
  return {
    connectors: state.connectors.filter((c) => c.connectorId !== connectorId),
  };
}

export function getConnector(
  state: ConnectorRegistryState,
  connectorId: string
): ConnectorDefinition | undefined {
  return state.connectors.find((c) => c.connectorId === connectorId);
}

export function getConnectorsByType(
  state: ConnectorRegistryState,
  type: ConnectorType
): ReadonlyArray<ConnectorDefinition> {
  return state.connectors.filter((c) => c.type === type);
}

export function getConnectorsByDirection(
  state: ConnectorRegistryState,
  direction: ConnectorDefinition['direction']
): ReadonlyArray<ConnectorDefinition> {
  return state.connectors.filter((c) => c.direction === direction);
}

export function hasConnector(
  state: ConnectorRegistryState,
  connectorId: string
): boolean {
  return state.connectors.some((c) => c.connectorId === connectorId);
}