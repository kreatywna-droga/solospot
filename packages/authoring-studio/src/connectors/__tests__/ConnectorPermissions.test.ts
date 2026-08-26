/**
 * ConnectorPermissions.test.ts — Sprint S8 Connector Framework Tests
 *
 * Unit tests for connector permissions and access control.
 */

import { describe, it, expect } from 'vitest';
import {
  createConnectorPermissionsConfig,
  grantConnectorAction,
  denyConnectorAction,
  hasConnectorPermission,
  checkConnectorPermission,
} from '../ConnectorPermissions';

describe('ConnectorPermissions', () => {
  it('should create permissions with default deny-all', () => {
    const permissions = createConnectorPermissionsConfig('connector-1');

    expect(permissions.connectorId).toBe('connector-1');
    expect(permissions.grantedActions).toHaveLength(0);
    expect(permissions.deniedActions).toHaveLength(0);
  });

  it('should grant and check permissions', () => {
    let permissions = createConnectorPermissionsConfig('connector-1');
    permissions = grantConnectorAction(permissions, 'read');

    expect(hasConnectorPermission(permissions, 'read')).toBe(true);
    expect(hasConnectorPermission(permissions, 'write')).toBe(false);
  });

  it('should revoke permissions', () => {
    let permissions = createConnectorPermissionsConfig('connector-1');
    permissions = grantConnectorAction(permissions, 'read');
    permissions = grantConnectorAction(permissions, 'write');
    permissions = denyConnectorAction(permissions, 'read');

    expect(hasConnectorPermission(permissions, 'read')).toBe(false);
    expect(hasConnectorPermission(permissions, 'write')).toBe(true);
  });

  it('should deny specific operations', () => {
    let permissions = createConnectorPermissionsConfig('connector-1');
    permissions = grantConnectorAction(permissions, 'read');
    permissions = grantConnectorAction(permissions, 'write');
    permissions = denyConnectorAction(permissions, 'write');

    expect(hasConnectorPermission(permissions, 'read')).toBe(true);
    expect(hasConnectorPermission(permissions, 'write')).toBe(false);
  });

  it('should check permission level', () => {
    const permissions = createConnectorPermissionsConfig('connector-1', ['read'], ['delete']);

    expect(checkConnectorPermission(permissions, 'read')).toBe('granted');
    expect(checkConnectorPermission(permissions, 'delete')).toBe('denied');
    expect(checkConnectorPermission(permissions, 'write')).toBe('prompt');
  });
});