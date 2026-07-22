import { z } from 'zod';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';
import { InsufficientInventoryException } from './CartRuntime';

export const InventoryStockSchema = z.object({
  productId: z.string().min(1),
  tenantId: z.string().min(1),
  quantityAvailable: z.number().int().nonnegative(),
  quantityReserved: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
});
export type InventoryStock = z.infer<typeof InventoryStockSchema>;

export const StockReservationSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  productId: z.string().min(1),
  orderId: z.string().min(1),
  quantity: z.number().int().positive(),
  expiresAt: z.string().datetime(),
  status: z.enum(['PENDING', 'COMMITTED', 'RELEASED']),
});
export type StockReservation = z.infer<typeof StockReservationSchema>;

export const StockMovementSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  productId: z.string().min(1),
  quantityDelta: z.number().int(),
  type: z.enum(['RECEIPT', 'SALE', 'RESERVATION_COMMIT', 'ADJUSTMENT', 'RETURN']),
  reason: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type StockMovement = z.infer<typeof StockMovementSchema>;

export class InventoryEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;

  // In-memory repositories
  private readonly stocks = new Map<string, InventoryStock>(); // key: `${tenantId}:${productId}`
  private readonly reservations = new Map<string, StockReservation>();
  private readonly movements: StockMovement[] = [];

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all inventory events
    const inventoryEvents = [
      'Inventory.Reserved',
      'Inventory.Committed',
      'Inventory.Released',
      'Inventory.LowStock',
    ];
    for (const evt of inventoryEvents) {
      EventRegistry.register(evt);
    }
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during inventory operation: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  private getStockKey(tenantId: string, productId: string): string {
    return `${tenantId}:${productId}`;
  }

  /**
   * Safe manual initialization of stock for tests or seeding.
   */
  public initializeStock(
    tenantId: string,
    productId: string,
    initialQty: number,
    threshold = 5
  ): void {
    const key = this.getStockKey(tenantId, productId);
    this.stocks.set(key, {
      productId,
      tenantId,
      quantityAvailable: initialQty,
      quantityReserved: 0,
      lowStockThreshold: threshold,
    });
  }

  /**
   * Retrieves stock record. If none exists, creates a zero-qty record.
   */
  public async getStock(tenantId: string, productId: string): Promise<InventoryStock> {
    const key = this.getStockKey(tenantId, productId);
    let stock = this.stocks.get(key);
    if (!stock) {
      stock = {
        productId,
        tenantId,
        quantityAvailable: 0,
        quantityReserved: 0,
        lowStockThreshold: 5,
      };
      this.stocks.set(key, stock);
    }
    this.enforceTenantIsolation(tenantId, stock.tenantId, 'Get product stock');
    return stock;
  }

  /**
   * Safely query all movements (for audit/test assertions).
   */
  public getMovementsForTesting(tenantId: string): StockMovement[] {
    return this.movements.filter((m) => m.tenantId === tenantId);
  }

  /**
   * Reserves stock for Checkout.
   */
  public async reserveStock(
    tenantId: string,
    orderId: string,
    productId: string,
    quantity: number,
    ttlSeconds: number,
    correlationId?: string
  ): Promise<StockReservation> {
    const cid = correlationId || `inv_res_${Date.now()}`;
    const stock = await this.getStock(tenantId, productId);

    if (stock.quantityAvailable < quantity) {
      throw new InsufficientInventoryException(
        `Cannot reserve stock for product '${productId}'. Requested: ${quantity}, Available: ${stock.quantityAvailable}`
      );
    }

    // Adjust stock values
    stock.quantityAvailable -= quantity;
    stock.quantityReserved += quantity;
    this.stocks.set(this.getStockKey(tenantId, productId), stock);

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const reservation: StockReservation = {
      id: `res_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      productId,
      orderId,
      quantity,
      expiresAt,
      status: 'PENDING',
    };

    StockReservationSchema.parse(reservation);
    this.reservations.set(reservation.id, reservation);

    await this.eventBus.publish({
      eventId: `evt_inv_res_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Inventory.Reserved',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { reservationId: reservation.id, orderId },
    });

    return reservation;
  }

  /**
   * Commits the reserved stock once payment has been confirmed.
   */
  public async commitStock(
    tenantId: string,
    reservationId: string,
    correlationId?: string
  ): Promise<StockMovement> {
    const cid = correlationId || `inv_cmt_${Date.now()}`;
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    this.enforceTenantIsolation(tenantId, reservation.tenantId, 'Commit stock reservation');

    if (reservation.status !== 'PENDING') {
      throw new Error(`Cannot commit stock for reservation '${reservationId}' in status '${reservation.status}'`);
    }

    const stock = await this.getStock(tenantId, reservation.productId);

    // Update reservation state
    reservation.status = 'COMMITTED';
    this.reservations.set(reservationId, reservation);

    // Decrease the reserved count
    stock.quantityReserved -= reservation.quantity;
    this.stocks.set(this.getStockKey(tenantId, reservation.productId), stock);

    // Record physical stock movement
    const movement: StockMovement = {
      id: `mov_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      productId: reservation.productId,
      quantityDelta: -reservation.quantity,
      type: 'RESERVATION_COMMIT',
      reason: `Order ${reservation.orderId} paid and committed`,
      createdAt: new Date().toISOString(),
    };

    StockMovementSchema.parse(movement);
    this.movements.push(movement);

    await this.eventBus.publish({
      eventId: `evt_inv_cmt_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Inventory.Committed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { reservationId, movementId: movement.id },
    });

    return movement;
  }

  /**
   * Releases stock reservation back to available storage (upon cancellation/expiry).
   */
  public async releaseStock(
    tenantId: string,
    reservationId: string,
    correlationId?: string
  ): Promise<void> {
    const cid = correlationId || `inv_rel_${Date.now()}`;
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    this.enforceTenantIsolation(tenantId, reservation.tenantId, 'Release stock reservation');

    if (reservation.status !== 'PENDING') {
      throw new Error(`Cannot release stock for reservation '${reservationId}' in status '${reservation.status}'`);
    }

    const stock = await this.getStock(tenantId, reservation.productId);

    // Update status
    reservation.status = 'RELEASED';
    this.reservations.set(reservationId, reservation);

    // Move qty back from reserved to available
    stock.quantityAvailable += reservation.quantity;
    stock.quantityReserved -= reservation.quantity;
    this.stocks.set(this.getStockKey(tenantId, reservation.productId), stock);

    await this.eventBus.publish({
      eventId: `evt_inv_rel_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Inventory.Released',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { reservationId },
    });
  }

  /**
   * Adjusts the overall stock level (receiving new inventory or manual inventory adjustment).
   */
  public async adjustStock(
    tenantId: string,
    productId: string,
    delta: number,
    type: StockMovement['type'],
    reason?: string,
    correlationId?: string
  ): Promise<InventoryStock> {
    const cid = correlationId || `inv_adj_${Date.now()}`;
    const stock = await this.getStock(tenantId, productId);

    stock.quantityAvailable += delta;
    this.stocks.set(this.getStockKey(tenantId, productId), stock);

    const movement: StockMovement = {
      id: `mov_${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      productId,
      quantityDelta: delta,
      type,
      reason,
      createdAt: new Date().toISOString(),
    };

    StockMovementSchema.parse(movement);
    this.movements.push(movement);

    // Trigger warning if stock falls below warning threshold
    if (stock.quantityAvailable <= stock.lowStockThreshold) {
      await this.eventBus.publish({
        eventId: `evt_inv_low_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Inventory.LowStock',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { productId, quantityAvailable: stock.quantityAvailable },
      });
    }

    return stock;
  }
}
