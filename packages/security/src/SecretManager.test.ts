import { describe, it, expect } from 'vitest';
import { SecretManager } from './SecretManager';

describe('SecretManager', () => {
  const manager = new SecretManager();

  it('should store and retrieve secrets', () => {
    manager.set('api-key', 'secret-value');
    expect(manager.get('api-key')).toBe('secret-value');
  });

  it('should return undefined for missing secrets', () => {
    expect(manager.get('missing')).toBeUndefined();
  });
});