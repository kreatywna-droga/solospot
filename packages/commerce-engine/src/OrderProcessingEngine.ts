import { z } from 'zod';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';
import { InvalidOrderStateException } from './CheckoutFlow';
export { InvalidOrderStateException };

export const ProcessedOrderStateSchema = z.enum([
  'CREATED',
  'PAYMENT_PENDING',
  'PAID',
  'PROCESSING',
  'READY_FOR_FULFILLMENT',
  'FULFILLED',
  'CANCELLED',
  'REFUNDED',
]);
export type ProcessedOrderState = z.infer<typeof ProcessedOrderStateSchema>;

export const ProcessedOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceGross: z.number().int().nonnegative(),
  totalGross: z.number().int().nonnegative(),
});
export type ProcessedOrderItem = z.infer<typeof ProcessedOrderItemSchema>;

export const ShippingDetailsSchema = z.object({
  fullName: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().min(1),
});
export type ShippingDetails = z.infer<typeof ShippingDetailsSchema>;

export const ProcessedOrderSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  customerId: z.string().min(1),
  items: z.array(ProcessedOrderItemSchema),
  subtotalGross: z.number().int().nonnegative(),
  taxTotal: z.number().int().nonnegative(),
  grandTotalGross: z.number().int().nonnegative(),
  currency: z.string().length(3),
  paymentIntentId: z.string().optional(),
  status: ProcessedOrderStateSchema,
  shippingAddress: ShippingDetailsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ProcessedOrder = z.infer<typeof ProcessedOrderSchema>;

export class OrderProcessingEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly orders = new Map<string, ProcessedOrder>(); // In-memory simulated repository

  private readonly allowedTransitions = {
    CREATED: ['PAYMENT_PENDING'],
    PAYMENT_PENDING: ['PAID', 'CANCELLED'],
    PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
    PROCESSING: ['READY_FOR_FULFILLMENT', 'REFUNDED'],
    READY_FOR_FULFILLMENT: ['FULFILLED', 'REFUNDED'],
    FULFILLED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  } as const satisfies Record<string, readonly ProcessedOrderState[]>;

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all order lifecycle events
    const orderEvents = [
      'Order.Created',
      'Order.Invoiced',
      'Order.PaymentConfirmed',
      'Order.ProcessingStarted',
      'Order.Fulfilled',
      'Order.Cancelled',
      'Order.Refunded',
    ];
    for (const evt of orderEvents) {
      EventRegistry.register(evt);
    }

    // Async subscriber to Payment.Completed
    this.eventBus.subscribe<{ orderId?: string; paymentIntentId?: string }>('Payment.Completed', async (event) => {
      const { orderId, paymentIntentId } = event.payload;
      const tenantId = event.tenantId;
      if (tenantId && orderId && paymentIntentId) {
        try {
          await this.confirmPayment(tenantId, orderId, paymentIntentId, event.correlationId);
        } catch (err: any) {
          this.logger.error({
            message: `Auto-confirm payment failed for order ${orderId}: ${err.message}`,
            correlationId: event.correlationId,
            tenantId: event.tenantId,
          });
        }
      }
    });

    this.eventBus.subscribe<{ orderId?: string; paymentIntentId?: string }>('Payment.Failed', async (event) => {
      const { orderId } = event.payload;
      const tenantId = event.tenantId;
      if (!tenantId || !orderId) return;
      try {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'PAYMENT_PENDING') return;
        this.transitionState(order.status, 'CANCELLED', orderId);
        order.status = 'CANCELLED';
        order.updatedAt = new Date().toISOString();
        this.orders.set(orderId, order);
        this.eventBus.publish({
          eventId: `evt_${Date.now()}_cancel`,
          eventType: 'Order.Cancelled',
          timestamp: new Date().toISOString(),
          correlationId: event.correlationId ?? `auto_cancel_${orderId}`,
          tenantId,
          payload: { orderId, reason: 'payment_failed' },
        });
        this.logger.info({
          message: `Order ${orderId} auto-cancelled due to Payment.Failed`,
          tenantId,
          metadata: { orderId },
        });
      } catch (err: any) {
        this.logger.error({
          message: `Auto-cancel on Payment.Failed failed for order ${orderId}: ${err.message}`,
          tenantId,
          error: err,
        });
      }
    });

    this.eventBus.subscribe<{ orderId?: string; paymentIntentId?: string }>('Payment.Refunded', async (event) => {
      const { orderId } = event.payload;
      const tenantId = event.tenantId;
      if (!tenantId || !orderId) return;
      try {
        const order = this.orders.get(orderId);
        if (!order) return;
        if (order.status !== 'PAID' && order.status !== 'FULFILLED' && order.status !== 'PROCESSING') {
          this.logger.warn({
            message: `Payment.Refunded for order ${orderId} in unexpected state ${order.status}; skipping transition`,
            tenantId,
            metadata: { orderId },
          });
          return;
        }
        this.transitionState(order.status, 'REFUNDED', orderId);
        order.status = 'REFUNDED';
        order.updatedAt = new Date().toISOString();
        this.orders.set(orderId, order);
        this.eventBus.publish({
          eventId: `evt_${Date.now()}_refund`,
          eventType: 'Order.Refunded',
          timestamp: new Date().toISOString(),
          correlationId: event.correlationId ?? `auto_refund_${orderId}`,
          tenantId,
          payload: { orderId, paymentIntentId: event.payload.paymentIntentId },
        });
        this.logger.info({
          message: `Order ${orderId} transitioned to REFUNDED on Payment.Refunded`,
          tenantId,
          metadata: { orderId },
        });
      } catch (err: any) {
        this.logger.error({
          message: `Auto-refund on Payment.Refunded failed for order ${orderId}: ${err.message}`,
          tenantId,
          error: err,
        });
      }
    });
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during order processing: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  private transitionState(current: ProcessedOrderState, target: ProcessedOrderState, orderId: string): void {
    const allowed = this.allowedTransitions[current] as readonly ProcessedOrderState[];
    if (!allowed || !allowed.includes(target)) {
      throw new InvalidOrderStateException(
        `Invalid status transition for Order '${orderId}': '${current}' -> '${target}'`
      );
    }
  }

  private async computeTaxWithFallback(tenantId: string, subtotalGross: number, currency: string): Promise<number> {
    try {
      const { TaxEngine } = await import('./TaxEngine');
      const engine = new TaxEngine({ eventBus: this.eventBus, logger: this.logger });
      const result = await engine.calculateCartTax(
        tenantId,
        [{ priceGross: subtotalGross, quantity: 1, taxRateId: 'default' }],
        undefined,
        'PL',
        undefined,
        `tax_${Date.now()}`
      );
      return result.taxTotal;
    } catch (err) {
      this.logger.error({
        message: `TaxEngine integration unavailable, falling back to flat 23% for tenant ${tenantId}: ${(err as Error).message}`,
        tenantId,
      });
      return Math.round(subtotalGross - subtotalGross / 1.23);
    }
  }

  /**
   * Retrieves an order by ID (verifying RLS).
   */
  public async getOrder(tenantId: string, orderId: string): Promise<ProcessedOrder> {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }
    this.enforceTenantIsolation(tenantId, order.tenantId, 'Get order details');
    return order;
  }

  /**
   * Lists all orders for a tenant (G1-315 merchant dashboard).
   * Returns orders sorted by createdAt descending.
   */
  public listOrders(tenantId: string, options?: { status?: ProcessedOrderState; limit?: number }): ProcessedOrder[] {
    const result: ProcessedOrder[] = [];
    for (const order of this.orders.values()) {
      if (order.tenantId !== tenantId) continue;
      if (options?.status && order.status !== options.status) continue;
      result.push(order);
    }
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (options?.limit && options.limit > 0) {
      return result.slice(0, options.limit);
    }
    return result;
  }

  /**
   * Safe manual injection for testing or DB seeding.
   */
  public setOrderForTesting(order: ProcessedOrder): void {
    this.orders.set(order.id, order);
  }

  /**
   * Creates a new order in CREATED state.
   */
  public async createOrder(
    tenantId: string,
    customerId: string,
    items: ProcessedOrderItem[],
    shippingAddress: ShippingDetails,
    currency = 'PLN',
    correlationId?: string,
    totalsOverride?: { subtotalGross?: number; taxTotal?: number; grandTotalGross?: number }
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_create_${Date.now()}`;
    const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;

    let subtotalGross = 0;
    for (const item of items) {
      subtotalGross += item.totalGross;
    }

    const calculatedTax = await this.computeTaxWithFallback(tenantId, subtotalGross, currency);
    const finalSubtotal = totalsOverride?.subtotalGross ?? subtotalGross;
    const finalTax = totalsOverride?.taxTotal ?? calculatedTax;
    const finalGrandTotal = totalsOverride?.grandTotalGross ?? (subtotalGross + calculatedTax);

    const order: ProcessedOrder = {
      id: orderId,
      tenantId,
      customerId,
      items,
      subtotalGross: finalSubtotal,
      taxTotal: finalTax,
      grandTotalGross: finalGrandTotal,
      currency,
      status: 'CREATED',
      shippingAddress,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ProcessedOrderSchema.parse(order);
    this.orders.set(orderId, order);

    await this.eventBus.publish({
      eventId: `evt_ord_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId },
    });

    return order;
  }

  /**
   * Moves status CREATED -> PAYMENT_PENDING
   */
  public async invoiceOrder(
    tenantId: string,
    orderId: string,
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_invoice_${Date.now()}`;
    const order = await this.getOrder(tenantId, orderId);

    this.transitionState(order.status, 'PAYMENT_PENDING', orderId);

    const updatedOrder: ProcessedOrder = {
      ...order,
      status: 'PAYMENT_PENDING',
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_inv_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Invoiced',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId },
    });

    return updatedOrder;
  }

  /**
   * Confirms payment for order: PAYMENT_PENDING -> PAID
   */
  public async confirmPayment(
    tenantId: string,
    orderId: string,
    paymentIntentId: string,
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_pay_confirm_${Date.now()}`;
    const order = await this.getOrder(tenantId, orderId);

    if (order.status === 'PAID') {
      return order;
    }

    this.transitionState(order.status, 'PAID', orderId);

    const updatedOrder: ProcessedOrder = {
      ...order,
      status: 'PAID',
      paymentIntentId,
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_paid_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.PaymentConfirmed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId, paymentIntentId },
    });

    return updatedOrder;
  }

  /**
   * Moves status: PAID -> PROCESSING
   */
  public async startProcessing(
    tenantId: string,
    orderId: string,
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_proc_${Date.now()}`;
    const order = await this.getOrder(tenantId, orderId);

    this.transitionState(order.status, 'PROCESSING', orderId);

    const updatedOrder: ProcessedOrder = {
      ...order,
      status: 'PROCESSING',
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_proc_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.ProcessingStarted',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId },
    });

    return updatedOrder;
  }

  /**
   * Moves status: PROCESSING -> READY_FOR_FULFILLMENT
   */
  public async prepareFulfillment(
    tenantId: string,
    orderId: string,
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const order = await this.getOrder(tenantId, orderId);
    this.transitionState(order.status, 'READY_FOR_FULFILLMENT', orderId);

    const updatedOrder: ProcessedOrder = {
      ...order,
      status: 'READY_FOR_FULFILLMENT',
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updatedOrder);
    return updatedOrder;
  }

  /**
   * Moves status: READY_FOR_FULFILLMENT -> FULFILLED
   */
  public async fulfillOrder(
    tenantId: string,
    orderId: string,
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_fulfill_${Date.now()}`;
    const order = await this.getOrder(tenantId, orderId);

    this.transitionState(order.status, 'FULFILLED', orderId);

    const updatedOrder: ProcessedOrder = {
      ...order,
      status: 'FULFILLED',
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_fulfilled_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Fulfilled',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId },
    });

    return updatedOrder;
  }

  /**
   * Moves status to CANCELLED (allowed from PAYMENT_PENDING or PAID)
   */
  public async cancelOrder(
    tenantId: string,
    orderId: string,
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_cancel_${Date.now()}`;
    const order = await this.getOrder(tenantId, orderId);

    this.transitionState(order.status, 'CANCELLED', orderId);

    const updatedOrder: ProcessedOrder = {
      ...order,
      status: 'CANCELLED',
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_cancelled_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Cancelled',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId },
    });

    return updatedOrder;
  }

  /**
   * Moves status: FULFILLED -> REFUNDED
   */
  public async refundOrder(
    tenantId: string,
    orderId: string,
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_refund_${Date.now()}`;
    const order = await this.getOrder(tenantId, orderId);

    this.transitionState(order.status, 'REFUNDED', orderId);

    const updatedOrder: ProcessedOrder = {
      ...order,
      status: 'REFUNDED',
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_refunded_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Refunded',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId },
    });

    return updatedOrder;
  }
}
