import { Organization } from '../../platform-identity/src/PlatformIdentity';
import { PlatformContext } from '../../platform-identity/src/PlatformContracts';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  BILLING = 'billing'
}

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  organizationId?: string;
  value?: unknown;
}

export interface ResourceLimit {
  organizationId: string;
  stores: number;
  users: number;
  bandwidthGb: number;
  storageGb: number;
}