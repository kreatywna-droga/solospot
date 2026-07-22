export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  CANCELED = 'canceled'
}

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  GRACE_PERIOD = 'grace_period'
}

export enum FeatureState {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  LIMITED = 'limited'
}

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  billingEmail?: string;
  timezone?: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  workspaceId: string;
  slug: string;
  createdAt: string;
}

export interface Environment {
  id: string;
  tenantId: string;
  type: EnvironmentType;
  config: Record<string, unknown>;
}

export interface Plan {
  type: PlanType;
  name: string;
  limits: {
    stores: number;
    users: number;
    bandwidthGb: number;
    storageGb: number;
    apiCallsPerDay: number;
    aiCreditsPerDay: number;
  };
  features: string[];
  priceMonthly?: number;
  priceYearly?: number;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt?: string;
  trialEndsAt?: string;
}

export interface License {
  id: string;
  tenantId: string;
  subscriptionId: string;
  status: LicenseStatus;
  expiresAt: string;
  gracePeriodEndsAt?: string;
}

export interface FeatureFlag {
  id: string;
  planType: PlanType;
  featureKey: string;
  state: FeatureState;
}

export interface UsageQuota {
  id: string;
  organizationId: string;
  planType: PlanType;
  limits: {
    stores: number;
    users: number;
    bandwidthGb: number;
    storageGb: number;
    apiCallsPerDay: number;
    aiCreditsPerDay: number;
  };
}

export interface UsageCounter {
  organizationId: string;
  date: string;
  apiCalls: number;
  aiUsage: number;
  publishedStores: number;
  storageUsedGb: number;
}