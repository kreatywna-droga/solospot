import { describe, it, expect } from 'vitest';
import { SoloSpotClient } from './SoloSpotClient';

describe('SoloSpot SDK', () => {
  const client = new SoloSpotClient({ apiKey: 'test-key' });

  it('should create store', async () => {
    const store = await client.stores.create({ name: 'My Store' });
    expect(store.id).toMatch(/^store-/);
    expect(store.name).toBe('My Store');
  });

  it('should list stores', async () => {
    const stores = await client.stores.list();
    expect(Array.isArray(stores)).toBe(true);
  });

  it('should get subscription', async () => {
    const sub = await client.billing.getSubscription('t-1');
    expect(sub.id).toBeDefined();
  });

  it('should search marketplace', async () => {
    const results = await client.marketplace.search('shop');
    expect(Array.isArray(results)).toBe(true);
  });

  it('should send notification', async () => {
    const notif = await client.notifications.send({
      recipient: 'user@example.com',
      channel: 'email',
      template: 'welcome',
      variables: { name: 'User' }
    });
    expect(notif.id).toMatch(/^notif-/);
  });
});