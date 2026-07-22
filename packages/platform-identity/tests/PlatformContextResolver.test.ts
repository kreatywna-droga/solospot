import { describe, it, expect } from 'vitest';
import { PlatformContextResolver } from '../src/PlatformContextResolver';
import { PlatformIdentityRegistry } from '../src/PlatformIdentityRegistry';
import { PlanType, SubscriptionStatus } from '../src/PlatformIdentity';

describe('PlatformContextResolver', () => {
  describe('resolve context', () => {
    it('should resolve platform context from tenant', () => {
      const registry = new PlatformIdentityRegistry();

      registry.registerOrganization({ id: 'org-1', name: 'Org', createdAt: '' });
      registry.registerWorkspace({ id: 'ws-1', name: 'WS', organizationId: 'org-1', createdAt: '', updatedAt: '' });
      registry.registerTenant({ id: 't-1', name: 'Store', workspaceId: 'ws-1', slug: 'store', createdAt: '' });
      registry.registerPlan({
        type: PlanType.FREE,
        name: 'Free',
        limits: { stores: 1, users: 1, bandwidthGb: 10, storageGb: 1, apiCallsPerDay: 1000, aiCreditsPerDay: 100 },
        features: ['builder', 'marketplace'],
        priceMonthly: 0
      });
      registry.registerSubscription({
        id: 'sub-1',
        organizationId: 'org-1',
        planType: PlanType.FREE,
        status: SubscriptionStatus.ACTIVE,
        startedAt: ''
      });

      const resolver = new PlatformContextResolver(registry);
      const ctx = resolver.resolvePlatformContext('t-1');

      expect(ctx?.tenantId).toBe('t-1');
      expect(ctx?.planType).toBe(PlanType.FREE);
    });

    it('should return null for unknown tenant', () => {
      const registry = new PlatformIdentityRegistry();
      const resolver = new PlatformContextResolver(registry);

      expect(resolver.resolvePlatformContext('unknown')).toBeNull();
    });
  });

  describe('limits', () => {
    it('should return plan limits', () => {
      const registry = new PlatformIdentityRegistry();

      registry.registerOrganization({ id: 'org-1', name: 'Org', createdAt: '' });
      registry.registerWorkspace({ id: 'ws-1', name: 'WS', organizationId: 'org-1', createdAt: '', updatedAt: '' });
      registry.registerTenant({ id: 't-1', name: 'Store', workspaceId: 'ws-1', slug: 'store', createdAt: '' });
      registry.registerPlan({
        type: PlanType.STARTER,
        name: 'Starter',
        limits: { stores: 5, users: 3, bandwidthGb: 100, storageGb: 10, apiCallsPerDay: 10000, aiCreditsPerDay: 1000 },
        features: [],
        priceMonthly: 29
      });
      registry.registerSubscription({
        id: 'sub-1',
        organizationId: 'org-1',
        planType: PlanType.STARTER,
        status: SubscriptionStatus.ACTIVE,
        startedAt: ''
      });

      const resolver = new PlatformContextResolver(registry);
      const limits = resolver.getLimits('t-1');

      expect(limits.maxStores).toBe(5);
    });
  });

  describe('capabilities', () => {
    it('should check builder capability', () => {
      const registry = new PlatformIdentityRegistry();

      registry.registerOrganization({ id: 'org-1', name: 'Org', createdAt: '' });
      registry.registerWorkspace({ id: 'ws-1', name: 'WS', organizationId: 'org-1', createdAt: '', updatedAt: '' });
      registry.registerTenant({ id: 't-1', name: 'Store', workspaceId: 'ws-1', slug: 'store', createdAt: '' });
      registry.registerPlan({
        type: PlanType.FREE,
        name: 'Free',
        limits: { stores: 1, users: 1, bandwidthGb: 10, storageGb: 1, apiCallsPerDay: 1000, aiCreditsPerDay: 100 },
        features: ['builder', 'marketplace'],
        priceMonthly: 0
      });
      registry.registerSubscription({
        id: 'sub-1',
        organizationId: 'org-1',
        planType: PlanType.FREE,
        status: SubscriptionStatus.ACTIVE,
        startedAt: ''
      });

      const resolver = new PlatformContextResolver(registry);

      expect(resolver.hasCapability('t-1', 'builder')).toBe(true);
      expect(resolver.hasCapability('t-1', 'ai')).toBe(false);
    });
  });
});