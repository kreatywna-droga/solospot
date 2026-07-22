import {
  CheckoutContext,
  CheckoutState,
  CartSummary,
  ShippingMethod,
  PaymentMethodInfo,
  createCheckoutContext,
  IllegalCheckoutStateTransitionException,
  TenantScopeViolationException,
  ALLOWED_TRANSITIONS,
} from './CheckoutContext';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';


export interface CheckoutAdapterPort {
  getCart(tenantId: string, cartId: string): Promise<CartSummary>;
  getShippingMethods(tenantId: string, cartId: string): Promise<ShippingMethod[]>;
  getPaymentMethods(tenantId: string): Promise<PaymentMethodInfo[]>;
  initiatePayment(tenantId: string, cartId: string, paymentMethodId: string, correlationId?: string): Promise<{ intentId: string }>;
  confirmOrder(tenantId: string, cartId: string, correlationId?: string): Promise<{ orderId: string }>;
}

export class CheckoutRuntime {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly adapter: CheckoutAdapterPort;

  // Active sessions per tenantId:cartId
  private readonly sessions = new Map<string, CheckoutContext>();

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    adapter: CheckoutAdapterPort;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.adapter = options.adapter;

    // Register checkout events
    const events = [
      'Checkout.Started',
      'Checkout.CustomerUpdated',
      'Checkout.ShippingSelected',
      'Checkout.PaymentSelected',
      'Checkout.Completed',
      'Checkout.Failed',
    ];
    for (const evt of events) {
      EventRegistry.register(evt);
    }
  }

  private sessionKey(tenantId: string, cartId: string): string {
    return `${tenantId}:${cartId}`;
  }

  private validateTransition(from: CheckoutState, to: CheckoutState): void {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      throw new IllegalCheckoutStateTransitionException(from, to);
    }
  }

  private async publish(eventType: string, tenantId: string, payload: Record<string, any>, cid: string): Promise<void> {
    await this.eventBus.publish({
      eventId: `evt_checkout_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload,
    });
  }

  /**
   * Starts a new checkout session for a given cart.
   * Loads cart data, shipping methods, and payment methods from the adapter.
   */
  public async startSession(
    tenantId: string,
    cartId: string,
    customerId: string | null,
    locale: string,
    correlationId?: string
  ): Promise<CheckoutContext> {
    const cid = correlationId || `checkout_start_${Date.now()}`;

    this.logger.info({
      message: `Starting checkout session for tenant: ${tenantId}, cart: ${cartId}`,
      correlationId: cid,
      tenantId,
    });

    const cartSummary = await this.adapter.getCart(tenantId, cartId);

    // Guard: Tenant scope validation
    if (cartSummary.tenantId !== tenantId) {
      throw new TenantScopeViolationException(cartSummary.tenantId, tenantId);
    }

    const [shippingMethods, paymentMethods] = await Promise.all([
      this.adapter.getShippingMethods(tenantId, cartId),
      this.adapter.getPaymentMethods(tenantId),
    ]);

    const context = createCheckoutContext({
      tenantId,
      cartId,
      customerId,
      currency: cartSummary.currency,
      locale,
      cartSummary,
      shippingMethods,
      selectedShippingId: null,
      paymentMethods,
      selectedPaymentMethod: null,
      currentState: 'CART_REVIEW',
    });

    this.sessions.set(this.sessionKey(tenantId, cartId), context);

    await this.publish('Checkout.Started', tenantId, { cartId, customerId }, cid);

    return context;
  }

  /**
   * Advances checkout state to CUSTOMER_INFO with validated customer data.
   */
  public async updateCustomerInfo(
    tenantId: string,
    cartId: string,
    customerData: { email: string; firstName: string; lastName: string },
    correlationId?: string
  ): Promise<CheckoutContext> {
    const cid = correlationId || `checkout_cust_${Date.now()}`;
    const key = this.sessionKey(tenantId, cartId);
    const current = this.sessions.get(key);
    if (!current) throw new Error(`No active checkout session for ${key}`);

    this.validateTransition(current.currentState, 'CUSTOMER_INFO');

    const updated = createCheckoutContext({ ...current, currentState: 'CUSTOMER_INFO' });
    this.sessions.set(key, updated);

    await this.publish('Checkout.CustomerUpdated', tenantId, { cartId, ...customerData }, cid);
    return updated;
  }

  /**
   * Records shipping method selection and advances to SHIPPING_SELECTION.
   */
  public async selectShipping(
    tenantId: string,
    cartId: string,
    shippingMethodId: string,
    correlationId?: string
  ): Promise<CheckoutContext> {
    const cid = correlationId || `checkout_ship_${Date.now()}`;
    const key = this.sessionKey(tenantId, cartId);
    const current = this.sessions.get(key);
    if (!current) throw new Error(`No active checkout session for ${key}`);

    this.validateTransition(current.currentState, 'SHIPPING_SELECTION');

    const method = current.shippingMethods.find((m) => m.id === shippingMethodId);
    if (!method) {
      throw new Error(`ShippingUnavailableException: method '${shippingMethodId}' not available`);
    }

    const updated = createCheckoutContext({
      ...current,
      selectedShippingId: shippingMethodId,
      currentState: 'SHIPPING_SELECTION',
    });
    this.sessions.set(key, updated);

    await this.publish('Checkout.ShippingSelected', tenantId, { cartId, shippingMethodId }, cid);
    return updated;
  }

  /**
   * Records payment method selection and advances to PAYMENT_SELECTION.
   */
  public async selectPayment(
    tenantId: string,
    cartId: string,
    paymentMethodId: string,
    correlationId?: string
  ): Promise<CheckoutContext> {
    const cid = correlationId || `checkout_pay_${Date.now()}`;
    const key = this.sessionKey(tenantId, cartId);
    const current = this.sessions.get(key);
    if (!current) throw new Error(`No active checkout session for ${key}`);

    this.validateTransition(current.currentState, 'PAYMENT_SELECTION');

    const method = current.paymentMethods.find((m) => m.id === paymentMethodId);
    if (!method) {
      throw new Error(`PaymentMethodNotFoundException: method '${paymentMethodId}' not available`);
    }

    const updated = createCheckoutContext({
      ...current,
      selectedPaymentMethod: paymentMethodId,
      currentState: 'PAYMENT_SELECTION',
    });
    this.sessions.set(key, updated);

    await this.publish('Checkout.PaymentSelected', tenantId, { cartId, paymentMethodId }, cid);
    return updated;
  }

  /**
   * Initiates payment processing. On success → CONFIRMATION. On failure → FAILED.
   */
  public async processPayment(
    tenantId: string,
    cartId: string,
    correlationId?: string
  ): Promise<{ context: CheckoutContext; orderId?: string }> {
    const cid = correlationId || `checkout_proc_${Date.now()}`;
    const key = this.sessionKey(tenantId, cartId);
    const current = this.sessions.get(key);
    if (!current) throw new Error(`No active checkout session for ${key}`);
    if (!current.selectedPaymentMethod) throw new Error('No payment method selected');

    this.validateTransition(current.currentState, 'PAYMENT_PROCESSING');

    const processing = createCheckoutContext({ ...current, currentState: 'PAYMENT_PROCESSING' });
    this.sessions.set(key, processing);

    try {
      await this.adapter.initiatePayment(tenantId, cartId, current.selectedPaymentMethod, cid);
      const { orderId } = await this.adapter.confirmOrder(tenantId, cartId, cid);

      const confirmed = createCheckoutContext({ ...processing, currentState: 'CONFIRMATION' });
      this.sessions.set(key, confirmed);

      await this.publish('Checkout.Completed', tenantId, { cartId, orderId }, cid);
      return { context: confirmed, orderId };
    } catch (err: any) {
      const failed = createCheckoutContext({ ...processing, currentState: 'FAILED' });
      this.sessions.set(key, failed);

      await this.publish('Checkout.Failed', tenantId, { cartId, error: err.message }, cid);
      this.logger.error({ message: `Checkout failed for cart ${cartId}: ${err.message}`, correlationId: cid, tenantId });
      return { context: failed };
    }
  }

  /** Returns the current session context (read-only). */
  public getSession(tenantId: string, cartId: string): CheckoutContext | undefined {
    return this.sessions.get(this.sessionKey(tenantId, cartId));
  }

  /** Clears a session after completion or abandonment. */
  public clearSession(tenantId: string, cartId: string): void {
    this.sessions.delete(this.sessionKey(tenantId, cartId));
  }
}
