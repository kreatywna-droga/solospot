export interface TenantSession {
  userId: string;
  email: string;
  tenantId: string | null;
  tenant:
    | {
        id: string;
        ownerEmail: string;
        packageId: string;
        status: string;
        createdAt: string;
        store: {
          id: string;
          name: string;
          status: string;
        } | null;
      }
    | null;
  isAuthenticated: boolean;
}

export interface DashboardStats {
  storeCount: number;
  storeStatus: string | null;
  orderCount: number;
  paidOrderCount: number;
  revenue: number;
  eventCount: number;
  recentEvents: Array<{
    eventType: string;
    timestamp: string;
  }>;
  tenant: {
    id: string;
    status: string;
    packageId: string;
    createdAt: string;
  } | null;
}

export class TenantNotResolvedError extends Error {
  constructor() {
    super('TenantContext: No tenant resolved for current session');
    this.name = 'TenantNotResolvedError';
  }
}
