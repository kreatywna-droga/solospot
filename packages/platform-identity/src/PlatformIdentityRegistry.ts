import {
  Workspace,
  Organization,
  Tenant,
  Environment,
  Plan,
  Subscription,
  License,
  FeatureFlag,
  UsageQuota,
  PlanType,
  EnvironmentType,
  LicenseStatus
} from './PlatformIdentity';
import { PlatformIdentity, PlatformContext } from './PlatformContracts';

export class PlatformIdentityRegistry {
  private workspaces: Map<string, Workspace> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private tenants: Map<string, Tenant> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();
  private plans: Map<PlanType, Plan> = new Map();
  private featureFlags: Map<string, FeatureFlag[]> = new Map();
  private usageQuotas: Map<string, UsageQuota> = new Map();
  private cache: Map<string, PlatformIdentity> = new Map();

  registerWorkspace(workspace: Workspace): void {
    this.workspaces.set(workspace.id, workspace);
  }

  registerOrganization(organization: Organization): void {
    this.organizations.set(organization.id, organization);
  }

  registerTenant(tenant: Tenant): void {
    this.tenants.set(tenant.id, tenant);
  }

  registerPlan(plan: Plan): void {
    this.plans.set(plan.type, plan);
  }

  registerSubscription(subscription: Subscription): void {
    this.subscriptions.set(subscription.id, subscription);
  }

  getWorkspace(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  getOrganization(organizationId: string): Organization | undefined {
    return this.organizations.get(organizationId);
  }

  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  getPlan(planType: PlanType): Plan | undefined {
    return this.plans.get(planType);
  }

  getTenantSubscriptions(tenantId: string): Subscription[] {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return [];

    const workspace = this.workspaces.get(tenant.workspaceId);
    if (!workspace) return [];

    const orgId = workspace.organizationId;
    const subs: Subscription[] = [];

    for (const sub of this.subscriptions.values()) {
      if (sub.organizationId === orgId) {
        subs.push(sub);
      }
    }

    return subs;
  }

  getActiveSubscription(tenantId: string): Subscription | undefined {
    const subscriptions = this.getTenantSubscriptions(tenantId);
    return subscriptions.find(s => s.status === 'active');
  }

  getFeatureFlags(planType: PlanType): Record<string, boolean> {
    const flags = this.featureFlags.get(planType) || [];
    const result: Record<string, boolean> = {};

    for (const flag of flags) {
      result[flag.featureKey] = flag.state === 'enabled';
    }

    return result;
  }

  getTenantLimits(tenantId: string): UsageQuota['limits'] | undefined {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;

    const workspace = this.workspaces.get(tenant.workspaceId);
    if (!workspace) return undefined;

    const quota = this.usageQuotas.get(workspace.organizationId);
    return quota?.limits;
  }

  getPlatformIdentity(tenantId: string): PlatformIdentity | undefined {
    const cached = this.cache.get(tenantId);
    if (cached) return cached;

    const tenant = this.tenants.get(tenantId);
    if (!tenant) return undefined;

    const workspace = this.workspaces.get(tenant.workspaceId);
    if (!workspace) return undefined;

    const organization = this.organizations.get(workspace.organizationId);
    if (!organization) return undefined;

    const subscription = this.getActiveSubscription(tenantId);
    if (!subscription) return undefined;

    const plan = this.plans.get(subscription.planType);
    if (!plan) return undefined;

    const identity: PlatformIdentity = {
      workspace,
      organization,
      tenant,
      environment: {
        id: `env-${tenantId}-prod`,
        tenantId,
        type: EnvironmentType.PRODUCTION,
        config: {}
      },
      subscription,
      license: {
        id: `license-${tenantId}`,
        tenantId,
        subscriptionId: subscription.id,
        status: 'active' as LicenseStatus,
        expiresAt: subscription.expiresAt || ''
      },
      plan,
      featureFlags: this.getFeatureFlags(subscription.planType),
      quotas: plan.limits
    };

    this.cache.set(tenantId, identity);
    return identity;
  }
}