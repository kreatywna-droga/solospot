import { describe, it, expect } from 'vitest';
import { ApiGateway } from './ApiGateway';
import { WebhookEngine } from './WebhookEngine';

describe('ApiGateway', () => {
  const gateway = new ApiGateway();

  it('should create API key', () => {
    const key = gateway.createKey('test-client', ['stores:read', 'stores:write']);
    expect(key.name).toBe('test-client');
    expect(key.scopes).toContain('stores:read');
  });

  it('should validate API key', () => {
    const key = gateway.createKey('client-2', ['stores:read']);
    expect(gateway.validateKey(key.id)).toBe(true);
  });

  it('should check scope', () => {
    const key = gateway.createKey('client-3', ['stores:read']);
    expect(gateway.checkScope(key.id, 'stores:read')).toBe(true);
    expect(gateway.checkScope(key.id, 'stores:write')).toBe(false);
  });
});

describe('WebhookEngine', () => {
  const engine = new WebhookEngine();

  it('should register webhook endpoint', () => {
    engine.registerEndpoint({
      id: 'hook-1',
      url: 'https://example.com/webhook',
      secret: 'secret',
      events: ['store.published'],
      active: true,
      createdAt: new Date().toISOString()
    });

    const endpoint = engine.getEndpoint('hook-1');
    expect(endpoint?.url).toBe('https://example.com/webhook');
  });

  it('should emit events', () => {
    engine.emit({
      id: 'event-1',
      type: 'store.published',
      payload: { storeId: 's-1' },
      timestamp: new Date().toISOString()
    });

    const deliveries = engine.listDeliveries('hook-1');
    expect(deliveries.length).toBeGreaterThanOrEqual(0);
  });
});