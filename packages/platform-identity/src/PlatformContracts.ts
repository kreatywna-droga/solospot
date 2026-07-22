import { Workspace, Organization, Tenant, Environment, Plan, Subscription, License, FeatureFlag, UsageQuota, PlanType, EnvironmentType } from './PlatformIdentity';

export interface PlatformIdentity {
  workspace: Workspace;
  organization: Organization;
  tenant: Tenant;
  environment: Environment;
  subscription: Subscription;
  license: License;
  plan: Plan;
  featureFlags: Record<string, boolean>;
  quotas: UsageQuota['limits'];
}

export interface PlatformContext {
  tenantId: string;
  workspaceId: string;
  organizationId: string;
  environment: EnvironmentType;
  planType: PlanType;
  capabilities: PlatformCapabilities;
}

export interface PlatformLimits {
  maxStores: number;
  maxUsers: number;
  bandwidthGb: number;
  storageGb: number;
  apiCallsPerDay: number;
  aiCreditsPerDay: number;
}

export interface PlatformCapabilities {
  builder: boolean;
  marketplace: boolean;
  ai: boolean;
  commerce: boolean;
  media: boolean;
  customDomains: boolean;
  webhooks: boolean;
}