/**
 * ConnectorDefinition.ts — Sprint S8 Connector Framework (ETAP 1)
 *
 * Declarative connector definitions describing external service integrations.
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export type ConnectorType =
  | 'import'
  | 'export'
  | 'storage'
  | 'cloud_storage'
  | 'media_library'
  | 'authentication'
  | 'sync'
  | 'custom';

export type ConnectorDirection = 'inbound' | 'outbound' | 'bidirectional';

export interface ConnectorDefinition {
  readonly connectorId: string;
  readonly name: string;
  readonly description?: string;
  readonly type: ConnectorType;
  readonly direction: ConnectorDirection;
  readonly version: string;
  readonly vendor?: string;
  readonly supportedMimeTypes?: ReadonlyArray<string>;
  readonly maxPayloadSizeBytes?: number;
  readonly requiresCredentials: boolean;
  readonly requiresSession: boolean;
  readonly tags?: ReadonlyArray<string>;
}

export function createConnectorDefinition(
  definition: ConnectorDefinition
): ConnectorDefinition {
  return {
    ...definition,
    supportedMimeTypes: definition.supportedMimeTypes
      ? [...definition.supportedMimeTypes]
      : [],
    tags: definition.tags ? [...definition.tags] : [],
  };
}

export function isConnectorDefinition(value: unknown): value is ConnectorDefinition {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<ConnectorDefinition>;
  return (
    typeof candidate.connectorId === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.direction === 'string' &&
    typeof candidate.version === 'string' &&
    typeof candidate.requiresCredentials === 'boolean' &&
    typeof candidate.requiresSession === 'boolean'
  );
}