import { describe, it, expect } from 'vitest';
import { DomainManager } from './DomainManager';
import { DnsEngine } from './DnsEngine';
import { SslEngine } from './SslEngine';
import { DomainRouting } from './DomainRouting';
import { PlatformIdentityRegistry } from '../../platform-identity/src/PlatformIdentityRegistry';
import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';
import { PlanType, SubscriptionStatus } from '../../platform-identity/src/PlatformIdentity';

describe('DomainGoldenFlow', () => {
  const registry = new PlatformIdentityRegistry();
  const resolver = new PlatformContextResolver(registry);
  const dnsEngine = new DnsEngine();
  const sslEngine = new SslEngine();
  const routing = new DomainRouting();
  const manager = new DomainManager(dnsEngine, sslEngine, routing, resolver);

  registry.registerOrganization({ id: 'org-1', name: 'Org', createdAt: '' });
  registry.registerWorkspace({ id: 'ws-1', name: 'WS', organizationId: 'org-1', createdAt: '', updatedAt: '' });
  registry.registerTenant({ id: 't-1', name: 'Store', workspaceId: 'ws-1', slug: 'store', createdAt: '' });
  registry.registerPlan({
    type: PlanType.STARTER,
    name: 'Starter',
    limits: { stores: 5, users: 3, bandwidthGb: 100, storageGb: 10, apiCallsPerDay: 10000, aiCreditsPerDay: 1000 },
    features: ['builder', 'marketplace', 'ai', 'customDomains'],
    priceMonthly: 29
  });
  registry.registerSubscription({ id: 'sub-1', organizationId: 'org-1', planType: PlanType.STARTER, status: SubscriptionStatus.ACTIVE, startedAt: '' });

  it('should create domain with platform context', () => {
    const domain = manager.createDomain('t-1', 'mystore.com');
    expect(domain?.tenantId).toBe('t-1');
    expect(domain?.hostname).toBe('mystore.com');
  });

  it('should verify domain', () => {
    const domain = manager.createDomain('t-1', 'verified.com');
    const verification = manager.verifyDomain(domain!.id);
    expect(verification?.verified).toBe(false);
  });

  it('should list domains for organization', () => {
    manager.createDomain('t-1', 'listed.com');
    const domains = manager.listDomains('org-1');
    expect(domains.length).toBeGreaterThan(0);
  });

  it('should reject domain for insufficient plan', () => {
    registry.registerOrganization({ id: 'org-2', name: 'Org2', createdAt: '' });
    registry.registerWorkspace({ id: 'ws-2', name: 'WS2', organizationId: 'org-2', createdAt: '', updatedAt: '' });
    registry.registerTenant({ id: 't-2', name: 'Free Store', workspaceId: 'ws-2', slug: 'free-store', createdAt: '' });
    registry.registerSubscription({ id: 'sub-2', organizationId: 'org-2', planType: PlanType.FREE, status: SubscriptionStatus.ACTIVE, startedAt: '' });

    const domain = manager.createDomain('t-2', 'freedomain.com');
    expect(domain).toBeNull();
  });
});