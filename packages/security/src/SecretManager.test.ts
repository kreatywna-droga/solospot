import { describe, it, expect } from 'vitest';
import { SecretManager } from './SecretManager';

describe('SecretManager', () => {
  const manager = new SecretManager({ masterKey: 'test-master-key-for-unit-tests' });

  it('should store and retrieve secrets within a tenant', () => {
    manager.set('tenant-a', 'api-key', 'secret-value');
    expect(manager.get('tenant-a', 'api-key')).toBe('secret-value');
  });

  it('should isolate secrets between tenants', () => {
    manager.set('tenant-a', 'api-key', 'value-a');
    manager.set('tenant-b', 'api-key', 'value-b');
    expect(manager.get('tenant-a', 'api-key')).toBe('value-a');
    expect(manager.get('tenant-b', 'api-key')).toBe('value-b');
    expect(manager.get('tenant-a', 'missing')).toBeUndefined();
  });

  it('should return undefined for missing secrets', () => {
    expect(manager.get('tenant-x', 'missing')).toBeUndefined();
  });

  it('should reject set() without tenantId', () => {
    expect(() => manager.set('', 'key', 'value')).toThrow();
  });

  it('should list keys for a tenant only', () => {
    const m = new SecretManager({ masterKey: 'test' });
    m.set('t1', 'k1', 'v1');
    m.set('t1', 'k2', 'v2');
    m.set('t2', 'k3', 'v3');
    expect(m.listKeys('t1').sort()).toEqual(['k1', 'k2']);
    expect(m.listKeys('t2')).toEqual(['k3']);
    expect(m.listKeys('t3')).toEqual([]);
  });

  it('should delete a tenant secret', () => {
    const m = new SecretManager({ masterKey: 'test' });
    m.set('t1', 'k1', 'v1');
    expect(m.delete('t1', 'k1')).toBe(true);
    expect(m.get('t1', 'k1')).toBeUndefined();
    expect(m.delete('t1', 'k1')).toBe(false);
  });
});
