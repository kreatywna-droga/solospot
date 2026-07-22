import { describe, it, expect } from 'vitest';
import { PlatformIdentityRegistry } from '../src/PlatformIdentityRegistry';
import { PlatformContextResolver } from '../src/PlatformContextResolver';
import { PlanType, SubscriptionStatus } from '../src/PlatformIdentity';

describe('C12.0.4 Golden Context', () => {
  describe('Full context flow', () => {
    it('should resolve context for complete tenant hierarchy', () => {
      const registry = new PlatformIdentityRegistry();

      registry.registerOrganization({ id: 'org-1', name: 'Acme Corp', createdAt: '2026-01-01' });
      registry.registerWorkspace({ id: 'ws-1', name: 'Acme Workspace', organizationId: 'org-1', createdAt: '2026-01-01', updatedAt: '2026-01-01' });
      registry.registerTenant({ id: 't-1', name: 'Acme Store', workspaceId: 'ws-1', slug: 'acme-store', createdAt: '2026-01-01' });

      registry.registerPlan({
        type: PlanType.STARTER,
        name: 'Starter',
        limits: { stores: 5, users: 3, bandwidthGb: 100, storageGb: 10, apiCallsPerDay: 10000, aiCreditsPerDay: 1000 },
        features: ['builder', 'marketplace', 'ai'],
        priceMonthly: 29
      });

      registry.registerSubscription({
        id: 'sub-1',
        organizationId: 'org-1',
        planType: PlanType.STARTER,
        status: SubscriptionStatus.ACTIVE,
        startedAt: '2026-01-01',
        expiresAt: '2027-01-01'
      });

      const resolver = new PlatformContextResolver(registry);
      const context = resolver.resolvePlatformContext('t-1');

      expect(context?.tenantId).toBe('t-1');
      expect(context?.workspaceId).toBe('ws-1');
      expect(context?.organizationId).toBe('org-1');
      expect(context?.planType).toBe(PlanType.STARTER);
      expect(context?.capabilities.builder).toBe(true);
      expect(context?.capabilities.ai).toBe(true);
    });
  });
});