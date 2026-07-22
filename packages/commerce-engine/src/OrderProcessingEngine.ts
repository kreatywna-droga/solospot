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

  private readonly allowedTransitions: Record<ProcessedOrderState, Set<ProcessedOrderState>> = {
    CREATED: new Set(['PAYMENT_PENDING']),
    PAYMENT_PENDING: new Set(['PAID', 'CANCELLED']),
    PAID: new Set(['PROCESSING', 'CANCELLED']),
    PROCESSING: new Set(['READY_FOR_FULFILLMENT']),
    READY_FOR_FULFILLMENT: new Set(['FULFILLED']),
    FULFILLED: new Set(['REFUNDED']),
    CANCELLED: new Set([]),
    REFUNDED: new Set([]),
  };

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all order lifecycle events
    const orderEvents = [
      'Order.Created',
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
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during order processing: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  private transitionState(current: ProcessedOrderState, target: ProcessedOrderState, orderId: string): void {
    const allowed = this.allowedTransitions[current];
    if (!allowed || !allowed.has(target)) {
      throw new InvalidOrderStateException(
        `Invalid status transition for Order '${orderId}': '${current}' -> '${target}'`
      );
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
    correlationId?: string
  ): Promise<ProcessedOrder> {
    const cid = correlationId || `ord_create_${Date.now()}`;
    const orderId = `ord_${Math.random().toString(36).substr(2, 9)}`;

    let subtotalGross = 0;
    for (const item of items) {
      subtotalGross += item.totalGross;
    }

    // Assume flat tax rate 23% for totals calculation
    const taxTotal = Math.round(subtotalGross - (subtotalGross / 1.23));

    const order: ProcessedOrder = {
      id: orderId,
      tenantId,
      customerId,
      items,
      subtotalGross,
      taxTotal,
      grandTotalGross: subtotalGross,
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
