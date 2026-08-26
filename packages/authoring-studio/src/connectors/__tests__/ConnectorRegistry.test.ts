/**
 * ConnectorRegistry.test.ts — Sprint S8 Connector Framework Tests
 *
 * Unit tests for connector registry and lifecycle management.
 */

import { describe, it, expect } from 'vitest';
import {
  createConnectorRegistryState,
  registerConnector,
  getConnector,
  hasConnector,
} from '../ConnectorRegistry';
import { createConnectorDefinition } from '../ConnectorDefinition';

describe('ConnectorRegistry', () => {
  it('should create a connector definition', () => {
    const definition = createConnectorDefinition({
      connectorId: 'test-connector',
      name: 'Test Connector',
      version: '1.0.0',
      type: 'import',
      direction: 'inbound',
      requiresCredentials: false,
      requiresSession: false,
      supportedMimeTypes: ['application/json'],
      tags: ['import', 'export'],
    });

    expect((definition as any).connectorId).toBe('test-connector');
    expect((definition as any).name).toBe('Test Connector');
    expect((definition as any).tags).toContain('import');
  });

  it('should register and retrieve connectors', () => {
    const registry = createConnectorRegistryState();
    const definition = createConnectorDefinition({
      connectorId: 'storage-connector',
      name: 'Storage',
      version: '1.0.0',
      type: 'storage',
      direction: 'bidirectional',
      requiresCredentials: true,
      requiresSession: true,
    });

    const updatedRegistry = registerConnector(registry, definition);
    const retrieved = getConnector(updatedRegistry, 'storage-connector');

    expect(retrieved).toBeDefined();
    expect((retrieved as any).connectorId).toBe('storage-connector');
  });

  it('should list all registered connectors', () => {
    const registry = createConnectorRegistryState();

    const def1 = createConnectorDefinition({
      connectorId: 'connector-1',
      name: 'Connector 1',
      version: '1.0.0',
      type: 'import',
      direction: 'inbound',
      requiresCredentials: false,
      requiresSession: false,
    });

    const def2 = createConnectorDefinition({
      connectorId: 'connector-2',
      name: 'Connector 2',
      version: '1.0.0',
      type: 'export',
      direction: 'outbound',
      requiresCredentials: false,
      requiresSession: false,
    });

    const updatedRegistry = registerConnector(registry, def1);
    const finalRegistry = registerConnector(updatedRegistry, def2);

    expect(finalRegistry.connectors).toHaveLength(2);
  });

  it('should check if connector exists', () => {
    const registry = createConnectorRegistryState();
    const definition = createConnectorDefinition({
      connectorId: 'lifecycle-connector',
      name: 'Lifecycle Test',
      version: '1.0.0',
      type: 'import',
      direction: 'inbound',
      requiresCredentials: false,
      requiresSession: false,
    });

    const updatedRegistry = registerConnector(registry, definition);

    expect(hasConnector(updatedRegistry, 'lifecycle-connector')).toBe(true);
    expect(hasConnector(updatedRegistry, 'non-existent')).toBe(false);
  });

  it('should allow duplicate registration (upsert behavior)', () => {
    const registry = createConnectorRegistryState();
    const definition1 = createConnectorDefinition({
      connectorId: 'duplicate',
      name: 'Original',
      version: '1.0.0',
      type: 'import',
      direction: 'inbound',
      requiresCredentials: false,
      requiresSession: false,
    });

    const definition2 = createConnectorDefinition({
      connectorId: 'duplicate',
      name: 'Updated',
      version: '2.0.0',
      type: 'export',
      direction: 'outbound',
      requiresCredentials: false,
      requiresSession: false,
    });

    const updated1 = registerConnector(registry, definition1);
    const updated2 = registerConnector(updated1, definition2);

    expect(updated2.connectors).toHaveLength(1);
    expect((updated2.connectors[0] as any).name).toBe('Updated');
  });

  it('should return undefined for non-existent connector', () => {
    const registry = createConnectorRegistryState();
    const connector = getConnector(registry, 'non-existent');

    expect(connector).toBeUndefined();
  });
});
