import { describe, it, expect } from 'vitest';
import { PlatformGoldenFlow } from './PlatformGoldenFlow';
import { PlatformContextResolver } from '../../platform-identity/src/PlatformContextResolver';
import { PlatformIdentityRegistry } from '../../platform-identity/src/PlatformIdentityRegistry';
import { BillingGoldenFlow } from '../../billing-core/src/BillingGoldenFlow';
import { BillingCycle } from '../../billing-core/src/BillingDomain';
import { DomainManager } from '../../domain-manager/src/DomainManager';
import { NotificationCenter } from '../../notification-center/src/NotificationCenter';
import { WorkflowRuntime } from './WorkflowRuntime';
import { ActionEngine } from './ActionEngine';
import { PlanType, SubscriptionStatus } from '../../platform-identity/src/PlatformIdentity';

describe('PlatformGoldenFlow', () => {
  const registry = new PlatformIdentityRegistry();
  const contextResolver = new PlatformContextResolver(registry);

  registry.registerOrganization({ id: 'org-1', name: 'Org', createdAt: '' });
  registry.registerWorkspace({ id: 'ws-1', name: 'WS', organizationId: 'org-1', createdAt: '', updatedAt: '' });
  registry.registerTenant({ id: 't-1', name: 'Store', workspaceId: 'ws-1', slug: 'store', createdAt: '' });
  registry.registerPlan({ type: PlanType.STARTER, name: 'Starter', limits: { stores: 5, users: 3, bandwidthGb: 100, storageGb: 10, apiCallsPerDay: 10000, aiCreditsPerDay: 1000 }, features: ['builder', 'customDomains'], priceMonthly: 29, priceYearly: 290 });
  registry.registerSubscription({ id: 'sub-1', organizationId: 'org-1', planType: PlanType.STARTER, status: SubscriptionStatus.ACTIVE, startedAt: '' });

  const planEngine = { calculatePrice: () => 29 };
  const subscriptionEngine = { createSubscription: () => ({ id: 'sub', status: 'active', organizationId: 'org-1', planType: PlanType.STARTER, startedAt: '' }) };
  const usageEngine = { recordUsage: () => ({ id: 'usage', organizationId: 'org-1', metric: 'apiCalls', value: 0, recordedAt: '' }) };
  const invoiceEngine = { generateInvoice: () => ({ id: 'inv', subscriptionId: 'sub', organizationId: 'org-1', amount: 29, currency: 'USD', status: 'draft', billingPeriod: { start: '', end: '' }, issuedAt: '', dueDate: '', lineItems: [] }) };
  const paymentGateway = { createPaymentIntent: async () => ({ id: 'pi', status: 'pending', amount: 29, currency: 'USD' }) };
  const billingFlow = new BillingGoldenFlow(planEngine as any, subscriptionEngine as any, usageEngine as any, invoiceEngine as any, paymentGateway as any);

  const dnsEngine = { initiateVerification: () => ({ domainId: '', method: 'dns_txt', recordName: '', recordValue: '', verified: false }) };
  const sslEngine = { issueCertificate: async () => ({ domainId: '', status: 'pending', expiresAt: '' }) };
  const routing = { bindDomain: () => null };
  const domainManager = new DomainManager(dnsEngine as any, sslEngine as any, routing as any, contextResolver);

  const eventBus = { subscribe: () => ({ id: '', eventType: '' }) };
  const templateEngine = { render: () => ({ body: '' }) };
  const deliveryEngine = { enqueue: () => {}, processQueue: async () => {} };
  const preferences = { getPreference: () => ({ userId: '', channels: [], categories: [], frequency: 'instant', locale: 'en' }) };
  const notificationCenter = new NotificationCenter(eventBus as any, templateEngine as any, deliveryEngine as any, preferences as any);

  const actionEngine = new ActionEngine(contextResolver);
  const workflowRuntime = new WorkflowRuntime(actionEngine, contextResolver);

  const platformFlow = new PlatformGoldenFlow(
    contextResolver,
    billingFlow,
    domainManager,
    notificationCenter,
    workflowRuntime
  );

  it('executes complete platform flow', async () => {
    const result = await platformFlow.execute({
      organizationId: 'org-1',
      workspaceId: 'ws-1',
      tenantId: 't-1',
      planType: PlanType.STARTER,
      domain: 'mystore.com'
    });

    expect(result.subscriptionId).toBeDefined();
    expect(result.invoiceId).toBeDefined();
  });
});