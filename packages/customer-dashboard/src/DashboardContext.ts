// ── Dashboard View Types ──────────────────────────────────────────────────────

export type DashboardView =
  | 'account_home'
  | 'orders'
  | 'order_detail'
  | 'addresses'
  | 'preferences';

// ── Domain Value Objects ─────────────────────────────────────────────────────

export interface CustomerOrder {
  readonly orderId: string;
  readonly status: 'CREATED' | 'PAYMENT_PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  readonly totalCents: number;
  readonly currency: string;
  readonly createdAt: string;
  readonly trackingNumber?: string;
  readonly items: CustomerOrderItem[];
}

export interface CustomerOrderItem {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly currency: string;
}

export interface CustomerAddress {
  readonly addressId: string;
  readonly fullName: string;
  readonly street: string;
  readonly city: string;
  readonly postalCode: string;
  readonly country: string;
  readonly isDefault: boolean;
}

export interface CustomerPreferences {
  readonly locale: string;
  readonly currency: string;
  readonly marketingConsent: boolean;
  readonly newsletterConsent: boolean;
}

// ── Dashboard Context (Immutable) ────────────────────────────────────────────

export interface DashboardContext {
  readonly tenantId: string;
  readonly customerId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly locale: string;
  readonly currency: string;
  readonly currentView: DashboardView;
}

export function createDashboardContext(data: DashboardContext): DashboardContext {
  return Object.freeze({ ...data });
}

// ── Custom Exceptions ────────────────────────────────────────────────────────

export class AuthenticationRequiredException extends Error {
  constructor(reason: string = 'Session missing or expired') {
    super(`AuthenticationRequiredException: ${reason}`);
    this.name = 'AuthenticationRequiredException';
  }
}

export class DashboardTenantScopeViolationException extends Error {
  constructor(resourceTenantId: string, sessionTenantId: string) {
    super(`Tenant scope violation: resource belongs to '${resourceTenantId}', session is '${sessionTenantId}'`);
    this.name = 'DashboardTenantScopeViolationException';
  }
}

export class AddressOperationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AddressOperationException';
  }
}
