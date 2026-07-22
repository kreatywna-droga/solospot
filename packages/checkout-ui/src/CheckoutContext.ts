import { z } from 'zod';

// ── Checkout State Machine ────────────────────────────────────────────────────

export type CheckoutState =
  | 'CART_REVIEW'
  | 'CUSTOMER_INFO'
  | 'SHIPPING_SELECTION'
  | 'PAYMENT_SELECTION'
  | 'PAYMENT_PROCESSING'
  | 'CONFIRMATION'
  | 'FAILED';

export const ALLOWED_TRANSITIONS: Record<CheckoutState, CheckoutState[]> = {
  CART_REVIEW:         ['CUSTOMER_INFO'],
  CUSTOMER_INFO:       ['SHIPPING_SELECTION'],
  SHIPPING_SELECTION:  ['PAYMENT_SELECTION'],
  PAYMENT_SELECTION:   ['PAYMENT_PROCESSING'],
  PAYMENT_PROCESSING:  ['CONFIRMATION', 'FAILED'],
  CONFIRMATION:        [],
  FAILED:              ['CART_REVIEW'],
};

export class IllegalCheckoutStateTransitionException extends Error {
  constructor(from: CheckoutState, to: CheckoutState) {
    super(`Illegal checkout state transition: '${from}' → '${to}'`);
    this.name = 'IllegalCheckoutStateTransitionException';
  }
}

export class TenantScopeViolationException extends Error {
  constructor(cartTenantId: string, sessionTenantId: string) {
    super(`Tenant scope violation: cart belongs to '${cartTenantId}', but checkout session belongs to '${sessionTenantId}'`);
    this.name = 'TenantScopeViolationException';
  }
}

// ── Shared Value Objects ─────────────────────────────────────────────────────

export interface CartItem {
  readonly productId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
  readonly currency: string;
}

export interface CartSummary {
  readonly cartId: string;
  readonly tenantId: string;
  readonly items: CartItem[];
  readonly totalCents: number;
  readonly currency: string;
}

export interface ShippingMethod {
  readonly id: string;
  readonly provider: string;
  readonly name: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly estimatedDays: number;
}

export interface PaymentMethodInfo {
  readonly id: string;
  readonly type: 'card' | 'bank_transfer' | 'blik' | 'mock';
  readonly label: string;
}

// ── Checkout Context (Immutable via Object.freeze) ───────────────────────────

export interface CheckoutContext {
  readonly tenantId: string;
  readonly cartId: string;
  readonly customerId: string | null;
  readonly currency: string;
  readonly locale: string;
  readonly cartSummary: CartSummary;
  readonly shippingMethods: ShippingMethod[];
  readonly selectedShippingId: string | null;
  readonly paymentMethods: PaymentMethodInfo[];
  readonly selectedPaymentMethod: string | null;
  readonly currentState: CheckoutState;
}

export function createCheckoutContext(data: Omit<CheckoutContext, never>): CheckoutContext {
  return Object.freeze({
    ...data,
    cartSummary: Object.freeze({ ...data.cartSummary, items: Object.freeze([...data.cartSummary.items]) }),
    shippingMethods: Object.freeze([...data.shippingMethods]),
    paymentMethods: Object.freeze([...data.paymentMethods]),
  }) as CheckoutContext;
}

// ── Checkout Component Contract ──────────────────────────────────────────────

export interface CheckoutRenderResult {
  html: string;
  state: CheckoutState;
  errors: string[];
}

export interface CheckoutComponent {
  render(context: CheckoutContext): CheckoutRenderResult;
}
