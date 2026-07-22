import { PlatformIdentityRegistry } from './PlatformIdentityRegistry';
import { PlatformContext, PlatformLimits, PlatformCapabilities } from './PlatformContracts';
import { PlanType, EnvironmentType } from './PlatformIdentity';

export class PlatformContextResolver {
  private registry: PlatformIdentityRegistry;
  private cache: Map<string, PlatformContext> = new Map();

  constructor(registry: PlatformIdentityRegistry) {
    this.registry = registry;
  }

  resolvePlatformContext(tenantId: string): PlatformContext | null {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;

    const identity = this.registry.getPlatformIdentity(tenantId);
    if (!identity) return null;

    const context: PlatformContext = {
      tenantId,
      workspaceId: identity.workspace.id,
      organizationId: identity.organization.id,
      environment: EnvironmentType.PRODUCTION,
      planType: identity.subscription.planType,
      capabilities: this.getCapabilities(identity.plan.features)
    };

    this.cache.set(tenantId, context);
    return context;
  }

  getLimits(tenantId: string): PlatformLimits {
    const context = this.resolvePlatformContext(tenantId);
    if (!context) {
      return {
        maxStores: 0,
        maxUsers: 0,
        bandwidthGb: 0,
        storageGb: 0,
        apiCallsPerDay: 0,
        aiCreditsPerDay: 0
      };
    }

    const plan = this.registry.getPlan(context.planType);
    if (!plan) {
      return {
        maxStores: 0,
        maxUsers: 0,
        bandwidthGb: 0,
        storageGb: 0,
        apiCallsPerDay: 0,
        aiCreditsPerDay: 0
      };
    }

    return {
      maxStores: plan.limits.stores,
      maxUsers: plan.limits.users,
      bandwidthGb: plan.limits.bandwidthGb,
      storageGb: plan.limits.storageGb,
      apiCallsPerDay: plan.limits.apiCallsPerDay,
      aiCreditsPerDay: plan.limits.aiCreditsPerDay
    };
  }

  checkLimit(tenantId: string, limit: keyof PlatformLimits, current: number): boolean {
    const limits = this.getLimits(tenantId);
    const max = limits[limit];

    return current < max;
  }

  hasCapability(tenantId: string, capability: keyof PlatformCapabilities): boolean {
    const context = this.resolvePlatformContext(tenantId);
    if (!context) return false;

    return context.capabilities[capability] === true;
  }

  private getCapabilities(features: string[]): PlatformCapabilities {
    const caps: PlatformCapabilities = {
      builder: false,
      marketplace: false,
      ai: false,
      commerce: false,
      media: false,
      customDomains: false,
      webhooks: false
    };

    const capsRecord = caps as unknown as Record<string, boolean>;
    for (const feature of features) {
      if (feature in caps) {
        capsRecord[feature] = true;
      }
    }

    return caps;
  }
}