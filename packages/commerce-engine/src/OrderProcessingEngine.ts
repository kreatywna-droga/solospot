import { z } from 'zod';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';
import { InvalidOrderStateException } from './CheckoutFlow';
import { InventoryEngine } from './InventoryEngine';
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
  private readonly orders = new Map<string, ProcessedOrder>(); // In-memory cache; source of truth only when no repository configured.
  private readonly inventoryEngine: InventoryEngine | undefined;
  private readonly repository: OrderPersistenceAdapter | undefined;
  /** Map: orderId -> list of stock reservation ids created for that order. */
  private readonly orderReservations = new Map<string, string[]>();

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
    inventoryEngine?: InventoryEngine;
    repository?: OrderPersistenceAdapter;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.inventoryEngine = options.inventoryEngine;
    this.repository = options.repository;

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
        await this.persistOrder(order);
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
        await this.releaseInventoryReservations(tenantId, orderId, event.correlationId);
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
        await this.persistOrder(order);
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

  private requireTenant(tenantId: string, op: string): void {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.length === 0) {
      throw new TenantSecurityException(
        `Order operation '${op}' requires a non-empty tenantId (received: ${JSON.stringify(tenantId)})`
      );
    }
  }

  /**
   * Internal: persist an order to the configured repository (if any) AND
   * update the in-memory cache. Failure to persist is logged but never
   * thrown — order lifecycle must always succeed even if storage is
   * temporarily unavailable. The reconciliation / sweeper task is the
   * recovery path for missed writes.
   */
  private async persistOrder(order: ProcessedOrder): Promise<void> {
    this.orders.set(order.id, order);
    if (!this.repository) return;
    try {
      await this.repository.upsertOrder(this.toPersistedOrder(order));
    } catch (err) {
      this.logger.error({
        message: `Order persist failed for ${order.id}: ${(err as Error).message}`,
        tenantId: order.tenantId,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  /**
   * Hydrate the in-memory cache from the persistent store on cold start.
   * Best-effort — missing persistence layer or empty result is a no-op.
   */
  private async hydrateFromRepository(tenantId: string, orderId: string): Promise<ProcessedOrder | null> {
    if (!this.repository) return null;
    const persisted = await this.repository.findByTenantAndId(tenantId, orderId);
    if (!persisted) return null;
    const order = this.fromPersistedOrder(persisted);
    this.orders.set(order.id, order);
    return order;
  }

  /**
   * Engine -> persistence DTO mapper.
   * Persistence layer uses a smaller, flat `Order` shape (id, tenantId,
   * customerId, status, total, items[], timestamps). The engine's
   * ProcessedOrder is richer (currency, shippingAddress, paymentIntentId,
   * subtotalGross, taxTotal, grandTotalGross). The non-essential engine
   * fields are kept in `metadata` so no information is lost across the seam.
   */
  private toPersistedOrder(order: ProcessedOrder): {
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  } {
    const stateToStatus: Record<ProcessedOrderState, 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'> = {
      CREATED: 'pending',
      PAYMENT_PENDING: 'pending',
      PAID: 'paid',
      PROCESSING: 'paid',
      READY_FOR_FULFILLMENT: 'shipped',
      FULFILLED: 'completed',
      CANCELLED: 'cancelled',
      REFUNDED: 'cancelled',
    };
    return {
      id: order.id,
      tenantId: order.tenantId,
      customerId: order.customerId,
      status: stateToStatus[order.status],
      total: order.grandTotalGross,
      items: order.items.map((it, idx) => ({
        id: `${order.id}_item_${idx}`,
        productId: it.productId,
        quantity: it.quantity,
        price: it.unitPriceGross,
      })),
      metadata: {
        subtotalGross: order.subtotalGross,
        taxTotal: order.taxTotal,
        grandTotalGross: order.grandTotalGross,
        currency: order.currency,
        paymentIntentId: order.paymentIntentId,
        shippingAddress: order.shippingAddress,
        engineState: order.status,
      },
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Persistence -> engine DTO mapper. Inverse of {@link toPersistedOrder}.
   */
  private fromPersistedOrder(p: {
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }): ProcessedOrder {
    const md = p.metadata as {
      subtotalGross?: number;
      taxTotal?: number;
      grandTotalGross?: number;
      currency?: string;
      paymentIntentId?: string;
      shippingAddress?: { fullName: string; street: string; city: string; zipCode: string; country: string };
      engineState?: ProcessedOrderState;
    };
    return {
      id: p.id,
      tenantId: p.tenantId,
      customerId: p.customerId ?? 'unknown',
      items: p.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPriceGross: it.price,
        totalGross: it.price * it.quantity,
      })),
      subtotalGross: md.subtotalGross ?? p.total,
      taxTotal: md.taxTotal ?? 0,
      grandTotalGross: md.grandTotalGross ?? p.total,
      currency: md.currency ?? 'PLN',
      paymentIntentId: md.paymentIntentId,
      status: md.engineState ?? 'CREATED',
      shippingAddress: md.shippingAddress ?? {
        fullName: 'unknown', street: 'unknown', city: 'unknown', zipCode: '00-000', country: 'PL',
      },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
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
   * Retrieves an order by ID (verifying tenant isolation).
   *
   * With a repository configured: cold-start orders (cache miss) are hydrated
   * from the persistent store. Cross-tenant access throws TenantSecurityException.
   */
  public async getOrder(tenantId: string, orderId: string): Promise<ProcessedOrder> {
    this.requireTenant(tenantId, 'getOrder');
    const cached = this.orders.get(orderId);
    if (cached) {
      this.enforceTenantIsolation(tenantId, cached.tenantId, 'Get order details');
      return cached;
    }
    if (this.repository) {
      const hydrated = await this.hydrateFromRepository(tenantId, orderId);
      if (hydrated) return hydrated;
    }
    throw new Error(`Order not found: ${orderId}`);
  }

  /**
   * Lists orders for a tenant.
   *
   * With a repository configured: hydrates from the persistent store on
   * cache miss; uses the in-memory cache otherwise. Sorted by createdAt desc.
   */
  public async listOrders(
    tenantId: string,
    options?: { status?: ProcessedOrderState; limit?: number }
  ): Promise<ProcessedOrder[]> {
    this.requireTenant(tenantId, 'listOrders');
    let result: ProcessedOrder[];
    if (this.repository) {
      const all = await this.repository.listByTenant(tenantId);
      result = all.map((p) => this.fromPersistedOrder(p));
    } else {
      result = [];
      for (const order of this.orders.values()) {
        if (order.tenantId !== tenantId) continue;
        result.push(order);
      }
    }
    if (options?.status) result = result.filter((o) => o.status === options.status);
    result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (options?.limit && options.limit > 0) result = result.slice(0, options.limit);
    return result;
  }

  /**
   * Reserves stock for every line item in the order. Returns the reservation
   * IDs. Stores them in the internal map so {@link confirmPayment} (commit)
   * and {@link cancelOrder} (release) can reconcile inventory correctly.
   *
   * If no inventory engine is wired this method returns an empty array and is
   * a no-op. If ANY line item reservation fails, all previously-created
   * reservations for this order are released (rollback) and the original
   * exception is re-thrown.
   */
  public async reserveStockForOrder(
    tenantId: string,
    orderId: string,
    items: ProcessedOrderItem[],
    ttlSeconds = 900,
    correlationId?: string
  ): Promise<string[]> {
    if (!this.inventoryEngine) return [];
    const cid = correlationId || `ord_res_${Date.now()}`;
    const created: string[] = [];
    try {
      for (const item of items) {
        const reservation = await this.inventoryEngine.reserveStock(
          tenantId,
          orderId,
          item.productId,
          item.quantity,
          ttlSeconds,
          cid
        );
        created.push(reservation.id);
      }
      this.orderReservations.set(orderId, created);
      return created;
    } catch (err) {
      // Rollback: release any reservations we already created.
      for (const reservationId of created) {
        try {
          await this.inventoryEngine.releaseStock(tenantId, reservationId, cid);
        } catch (releaseErr: any) {
          this.logger.error({
            message: `Inventory rollback release failed for reservation ${reservationId}: ${releaseErr.message}`,
            correlationId: cid,
            tenantId,
            error: releaseErr,
          });
        }
      }
      throw err;
    }
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
    await this.persistOrder(order);

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

    await this.persistOrder(updatedOrder);

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
   *
   * When an inventory engine is wired, all reservations created for this order
   * are committed. Commit is idempotent: re-confirming a PAID order is a no-op.
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

    await this.persistOrder(updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_paid_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.PaymentConfirmed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId, paymentIntentId },
    });

    // Commit inventory reservations for this order. Failure here does NOT roll
    // back the order state — the inventory reconciliation engine (recovery)
    // will retry the commit on the next reconciliation pass. The commit is
    // idempotent at the persistence layer.
    if (this.inventoryEngine) {
      const reservationIds = this.orderReservations.get(orderId) ?? [];
      for (const reservationId of reservationIds) {
        try {
          await this.inventoryEngine.commitStock(tenantId, reservationId, cid);
        } catch (err: any) {
          this.logger.error({
            message: `Inventory commit failed for order ${orderId} reservation ${reservationId}: ${err.message}`,
            correlationId: cid,
            tenantId,
            error: err,
          });
        }
      }
    }

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

    await this.persistOrder(updatedOrder);

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

    await this.persistOrder(updatedOrder);
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

    await this.persistOrder(updatedOrder);

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
   * Moves status to CANCELLED (allowed from PAYMENT_PENDING or PAID).
   *
   * On cancellation, any inventory reservations associated with this order are
   * released back to the available pool.
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

    await this.persistOrder(updatedOrder);

    await this.eventBus.publish({
      eventId: `evt_ord_cancelled_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Order.Cancelled',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { orderId },
    });

    await this.releaseInventoryReservations(tenantId, orderId, cid);

    return updatedOrder;
  }

  /**
   * Helper: releases all inventory reservations associated with an order.
   * Failures are logged but never thrown — cancellation must always succeed
   * even if the inventory reconciliation is partially failing.
   */
  private async releaseInventoryReservations(
    tenantId: string,
    orderId: string,
    correlationId: string | undefined
  ): Promise<void> {
    if (!this.inventoryEngine) return;
    const reservationIds = this.orderReservations.get(orderId) ?? [];
    for (const reservationId of reservationIds) {
      try {
        await this.inventoryEngine.releaseStock(tenantId, reservationId, correlationId);
      } catch (err: any) {
        this.logger.error({
          message: `Inventory release failed for order ${orderId} reservation ${reservationId}: ${err.message}`,
          correlationId,
          tenantId,
          error: err,
        });
      }
    }
    this.orderReservations.delete(orderId);
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

    await this.persistOrder(updatedOrder);

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

// ---------------------------------------------------------------------------
// G1-333 HARDEN — Order persistence seam (mirrors G1-332 inventory pattern)
// ---------------------------------------------------------------------------

/**
 * Narrow persistence contract surfaced to OrderProcessingEngine.
 *
 * The engine only needs to upsert (idempotent create-or-update) and look up
 * by tenant+id, plus list-by-tenant. The full OrderRepository interface in
 * `commerce-persistence` adds tenant-less `findById`, `findAll`, etc. which
 * the engine never uses. Bridging through this narrow contract keeps the
 * engine free of commerce-persistence imports in its core path.
 */
export interface OrderPersistenceAdapter {
  upsertOrder(order: {
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }): Promise<void>;
  findByTenantAndId(tenantId: string, id: string): Promise<{
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  } | null>;
  listByTenant(tenantId: string): Promise<Array<{
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }>>;
}

/**
 * Bridge adapter: wraps a commerce-persistence `OrderRepository` and exposes
 * the engine's narrow `OrderPersistenceAdapter` contract.
 */
export class OrderRepositoryAdapter implements OrderPersistenceAdapter {
  constructor(private readonly repo: {
    findById(id: string): Promise<unknown>;
    findByTenantAndId(tenantId: string, id: string): Promise<unknown>;
    findByTenant(tenantId: string, options?: unknown): Promise<unknown[]>;
    create(data: unknown): Promise<unknown>;
    update(id: string, data: unknown): Promise<unknown>;
  }) {}

  async upsertOrder(order: {
    id: string;
    tenantId: string;
    customerId: string | null;
    status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
    total: number;
    items: Array<{ id: string; productId: string; quantity: number; price: number }>;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  }): Promise<void> {
    const existing = await this.repo.findByTenantAndId(order.tenantId, order.id);
    if (!existing) {
      await this.repo.create({
        ...order,
        id: order.id,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
      return;
    }
    await this.repo.update(order.id, {
      status: order.status,
      total: order.total,
      items: order.items,
      metadata: order.metadata,
      updatedAt: order.updatedAt,
    });
  }

  async findByTenantAndId(tenantId: string, id: string) {
    if (!tenantId || !id) return null;
    const row = (await this.repo.findByTenantAndId(tenantId, id)) as {
      id: string;
      tenantId: string;
      customerId: string | null;
      status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
      total: number;
      items: Array<{ id: string; productId: string; quantity: number; price: number }>;
      metadata: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    } | null;
    return row ?? null;
  }

  async listByTenant(tenantId: string) {
    if (!tenantId) return [];
    const rows = (await this.repo.findByTenant(tenantId)) as Array<{
      id: string;
      tenantId: string;
      customerId: string | null;
      status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
      total: number;
      items: Array<{ id: string; productId: string; quantity: number; price: number }>;
      metadata: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>;
    return rows ?? [];
  }
}
