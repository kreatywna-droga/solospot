import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';
import {
  PaymentIntent,
  PaymentState,
  Transaction,
  Refund,
  PaymentProviderAdapter,
  InvalidPaymentStateException,
} from './PaymentProviderAdapter';

export class PaymentEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;

  // Set of allowed transitions for the state machine
  private readonly allowedTransitions: Record<PaymentState, Set<PaymentState>> = {
    CREATED: new Set(['PROCESSING']),
    PROCESSING: new Set(['AUTHORIZED', 'CAPTURED', 'FAILED']),
    AUTHORIZED: new Set(['CAPTURED', 'FAILED']),
    CAPTURED: new Set(['REFUNDED']),
    FAILED: new Set([]),
    REFUNDED: new Set([]),
  };

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all payment domain events
    const paymentEvents = [
      'Payment.Created',
      'Payment.ProcessingStarted',
      'Payment.Completed',
      'Payment.Failed',
      'Payment.Refunded',
    ];
    for (const evt of paymentEvents) {
      EventRegistry.register(evt);
    }
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during payment operation: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  private transitionState(current: PaymentState, target: PaymentState, intentId: string): void {
    const allowed = this.allowedTransitions[current];
    if (!allowed || !allowed.has(target)) {
      throw new InvalidPaymentStateException(
        `Invalid status transition for PaymentIntent '${intentId}': '${current}' -> '${target}'`
      );
    }
  }

  /**
   * Initializes a payment intent through a specified adapter.
   */
  public async createPaymentIntent(
    tenantId: string,
    orderId: string,
    amountGross: number,
    currency: string,
    adapter: PaymentProviderAdapter,
    correlationId?: string
  ): Promise<PaymentIntent> {
    const cid = correlationId || `pay_create_${Date.now()}`;

    this.logger.info({
      message: `Creating PaymentIntent for order: ${orderId} using provider: ${adapter.id}`,
      correlationId: cid,
      tenantId,
    });

    // Create the external intent in the payment gateway
    const externalResult = await adapter.createIntent({
      orderId,
      amountGross,
      currency,
    });

    const intent: PaymentIntent = {
      id: `intent_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      orderId,
      amountGross,
      currency,
      status: 'CREATED',
      providerId: adapter.id,
      externalId: externalResult.externalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.eventBus.publish({
      eventId: `evt_pay_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Payment.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { paymentIntentId: intent.id, orderId },
    });

    return intent;
  }

  /**
   * Transitions payment status: CREATED -> PROCESSING
   */
  public async startProcessing(
    tenantId: string,
    intent: PaymentIntent,
    correlationId?: string
  ): Promise<PaymentIntent> {
    const cid = correlationId || `pay_proc_${Date.now()}`;
    this.enforceTenantIsolation(tenantId, intent.tenantId, 'Start processing payment');
    this.transitionState(intent.status, 'PROCESSING', intent.id);

    const updatedIntent: PaymentIntent = {
      ...intent,
      status: 'PROCESSING',
      updatedAt: new Date().toISOString(),
    };

    await this.eventBus.publish({
      eventId: `evt_pay_proc_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Payment.ProcessingStarted',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { paymentIntentId: intent.id },
    });

    return updatedIntent;
  }

  /**
   * Transitions payment status: PROCESSING/AUTHORIZED -> CAPTURED (Completed)
   */
  public async completePayment(
    tenantId: string,
    intent: PaymentIntent,
    correlationId?: string
  ): Promise<PaymentIntent> {
    const cid = correlationId || `pay_comp_${Date.now()}`;
    this.enforceTenantIsolation(tenantId, intent.tenantId, 'Complete payment');
    this.transitionState(intent.status, 'CAPTURED', intent.id);

    const updatedIntent: PaymentIntent = {
      ...intent,
      status: 'CAPTURED',
      updatedAt: new Date().toISOString(),
    };

    await this.eventBus.publish({
      eventId: `evt_pay_completed_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Payment.Completed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { paymentIntentId: intent.id, orderId: intent.orderId },
    });

    return updatedIntent;
  }

  /**
   * Transitions payment status: PROCESSING/AUTHORIZED -> FAILED
   */
  public async failPayment(
    tenantId: string,
    intent: PaymentIntent,
    correlationId?: string
  ): Promise<PaymentIntent> {
    const cid = correlationId || `pay_fail_${Date.now()}`;
    this.enforceTenantIsolation(tenantId, intent.tenantId, 'Fail payment');
    this.transitionState(intent.status, 'FAILED', intent.id);

    const updatedIntent: PaymentIntent = {
      ...intent,
      status: 'FAILED',
      updatedAt: new Date().toISOString(),
    };

    await this.eventBus.publish({
      eventId: `evt_pay_failed_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Payment.Failed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { paymentIntentId: intent.id, orderId: intent.orderId },
    });

    return updatedIntent;
  }

  /**
   * Processes a refund, transitioning CAPTURED -> REFUNDED
   */
  public async refundPayment(
    tenantId: string,
    intent: PaymentIntent,
    amount: number,
    reason: string,
    adapter: PaymentProviderAdapter,
    correlationId?: string
  ): Promise<{ intent: PaymentIntent; refund: Refund }> {
    const cid = correlationId || `pay_refund_${Date.now()}`;
    this.enforceTenantIsolation(tenantId, intent.tenantId, 'Refund payment');
    this.transitionState(intent.status, 'REFUNDED', intent.id);

    if (!intent.externalId) {
      throw new Error(`Cannot refund PaymentIntent '${intent.id}' because it has no externalId.`);
    }

    const refundResult = await adapter.refundPayment(intent.externalId, amount);

    const refund: Refund = {
      id: `ref_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      paymentIntentId: intent.id,
      amount,
      reason,
      status: refundResult.success ? 'COMPLETED' : 'FAILED',
      createdAt: new Date().toISOString(),
    };

    const updatedIntent: PaymentIntent = {
      ...intent,
      status: 'REFUNDED',
      updatedAt: new Date().toISOString(),
    };

    await this.eventBus.publish({
      eventId: `evt_pay_refunded_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Payment.Refunded',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { paymentIntentId: intent.id, refundId: refund.id, success: refundResult.success },
    });

    return { intent: updatedIntent, refund };
  }
}
