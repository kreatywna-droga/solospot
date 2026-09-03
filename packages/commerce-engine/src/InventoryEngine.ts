import { z } from 'zod';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';
import { InsufficientInventoryException } from './CartRuntime';
import {
  InventoryRepository,
  InsufficientInventoryException as RepoInsufficientInventoryException,
} from '../../commerce-persistence/src/repositories/InventoryRepository';

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
  status: z.enum(['PENDING', 'COMMITTED', 'RELEASED', 'EXPIRED']),
});
export type StockReservation = z.infer<typeof StockReservationSchema>;

export const StockMovementSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  productId: z.string().min(1),
  quantityDelta: z.number().int(),
  type: z.enum(['RECEIPT', 'SALE', 'RESERVATION_COMMIT', 'ADJUSTMENT', 'RETURN', 'RESERVATION_RELEASE', 'EXPIRED']),
  reason: z.string().optional(),
  createdAt: z.string().datetime(),
});
export type StockMovement = z.infer<typeof StockMovementSchema>;

/**
 * Optional persistence contract surfaced to InventoryEngine.
 *
 * InventoryEngine accepts any object that implements the atomic reserve / release
 * primitives plus a tenant-scoped lookup. The existing
 * `SupabaseInventoryRepository` (and the memory sibling) satisfy this contract.
 *
 * When no repository is supplied the engine falls back to its in-memory maps —
 * used by the original 5 unit tests. When a repository IS supplied, the maps
 * become a hot-path CACHE and the repository is the source of truth.
 */
export interface InventoryPersistenceAdapter {
  findByTenantAndProduct(tenantId: string, productId: string): Promise<{
    tenantId: string;
    productId: string;
    quantity: number;
    reserved: number;
    lowStockThreshold: number;
  } | null>;
  atomicReserve(tenantId: string, productId: string, quantity: number): Promise<{
    tenantId: string;
    productId: string;
    quantity: number;
    reserved: number;
    lowStockThreshold: number;
  }>;
  atomicRelease(tenantId: string, productId: string, quantity: number): Promise<{
    tenantId: string;
    productId: string;
    quantity: number;
    reserved: number;
    lowStockThreshold: number;
  }>;
  atomicCommit?(tenantId: string, productId: string, quantity: number): Promise<{
    tenantId: string;
    productId: string;
    quantity: number;
    reserved: number;
    lowStockThreshold: number;
  }>;

  upsertStock(input: {
    tenantId: string;
    productId: string;
    quantity: number;
    reserved?: number;
    lowStockThreshold?: number;
  }): Promise<{
    tenantId: string;
    productId: string;
    quantity: number;
    reserved: number;
    lowStockThreshold: number;
  }>;

  // Stock Reservation Persistence (G1-334)
  createReservation?(reservation: StockReservation): Promise<StockReservation>;
  updateReservationStatus?(
    tenantId: string,
    reservationId: string,
    status: StockReservation['status'],
    expectedStatus?: StockReservation['status']
  ): Promise<StockReservation | null>;
  findReservationById?(tenantId: string, reservationId: string): Promise<StockReservation | null>;
  findReservationsByOrderId?(tenantId: string, orderId: string): Promise<StockReservation[]>;
  findExpiredReservations?(tenantId?: string, now?: string): Promise<StockReservation[]>;

  // Stock Movement Persistence (G1-334)
  createMovement?(movement: StockMovement): Promise<StockMovement>;
  listMovements?(tenantId: string, productId?: string): Promise<StockMovement[]>;
}

export class InventoryEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly repository: InventoryPersistenceAdapter | undefined;

  // CACHE — only authoritative when no repository is configured.
  private readonly stocks = new Map<string, InventoryStock>(); // key: `${tenantId}:${productId}`
  private readonly reservations = new Map<string, StockReservation>();
  private readonly movements: StockMovement[] = [];

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    repository?: InventoryPersistenceAdapter;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.repository = options.repository;

    // Register all inventory events
    const inventoryEvents = [
      'Inventory.Reserved',
      'Inventory.Committed',
      'Inventory.Released',
      'Inventory.LowStock',
      'Inventory.Expired',
    ];
    for (const evt of inventoryEvents) {
      EventRegistry.register(evt);
    }
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (!tenantId) {
      throw new TenantSecurityException(
        `Tenant context missing during inventory operation: ${contextMessage}. Active: <missing>, Target: ${targetTenantId}`
      );
    }
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during inventory operation: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  private getStockKey(tenantId: string, productId: string): string {
    return `${tenantId}:${productId}`;
  }

  private requireTenant(tenantId: string, op: string): void {
    if (!tenantId || typeof tenantId !== 'string' || tenantId.length === 0) {
      throw new TenantSecurityException(
        `Inventory operation '${op}' requires a non-empty tenantId (received: ${JSON.stringify(tenantId)})`
      );
    }
  }

  private requirePositiveQuantity(productId: string, quantity: number, op: string): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InsufficientInventoryException(
        `Inventory operation '${op}' requires positive integer quantity for product '${productId}' (received: ${quantity})`
      );
    }
  }

  /**
   * Hydrates the in-memory cache from the persistent store. Safe to call
   * multiple times — overwrites the cache entry.
   */
  private async hydrateFromRepository(tenantId: string, productId: string): Promise<InventoryStock | null> {
    if (!this.repository) return null;
    const row = await this.repository.findByTenantAndProduct(tenantId, productId);
    if (!row) return null;
    const stock: InventoryStock = {
      tenantId,
      productId,
      quantityAvailable: row.quantity - row.reserved,
      quantityReserved: row.reserved,
      lowStockThreshold: row.lowStockThreshold,
    };
    this.stocks.set(this.getStockKey(tenantId, productId), stock);
    return stock;
  }

  /**
   * Safe manual initialization of stock for tests or seeding.
   *
   * When a repository is configured, the stock row is UPSERTED into the
   * persistent store. The in-memory cache is refreshed from the persisted row.
   */
  public async initializeStock(
    tenantId: string,
    productId: string,
    initialQty: number,
    threshold = 5
  ): Promise<void> {
    this.requireTenant(tenantId, 'initializeStock');
    if (!Number.isInteger(initialQty) || initialQty < 0) {
      throw new Error(`initializeStock requires non-negative integer initialQty (got ${initialQty})`);
    }

    if (this.repository) {
      const row = await this.repository.upsertStock({
        tenantId,
        productId,
        quantity: initialQty,
        reserved: 0,
        lowStockThreshold: threshold,
      });
      const stock: InventoryStock = {
        tenantId,
        productId,
        quantityAvailable: row.quantity - row.reserved,
        quantityReserved: row.reserved,
        lowStockThreshold: row.lowStockThreshold,
      };
      this.stocks.set(this.getStockKey(tenantId, productId), stock);
      return;
    }

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
   * Retrieves stock record.
   *
   * With a repository: hydrated from the persistent store (cache miss → DB read).
   * Without a repository: returns the cached stock, lazily creating a zero-qty
   * record (legacy semantics — preserved for existing unit tests).
   */
  public async getStock(tenantId: string, productId: string): Promise<InventoryStock> {
    this.requireTenant(tenantId, 'getStock');

    if (this.repository) {
      const key = this.getStockKey(tenantId, productId);
      const cached = this.stocks.get(key);
      if (cached) return cached;
      const hydrated = await this.hydrateFromRepository(tenantId, productId);
      if (hydrated) return hydrated;
      // No persisted row yet — surface a zero-qty stock record.
      const stock: InventoryStock = {
        productId,
        tenantId,
        quantityAvailable: 0,
        quantityReserved: 0,
        lowStockThreshold: 5,
      };
      this.stocks.set(key, stock);
      return stock;
    }

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
   * Look up a stock reservation by ID (durable if repository available).
   */
  public async getReservation(tenantId: string, reservationId: string): Promise<StockReservation | null> {
    this.requireTenant(tenantId, 'getReservation');
    const cached = this.reservations.get(reservationId);
    if (cached) {
      this.enforceTenantIsolation(tenantId, cached.tenantId, 'Get reservation');
      return cached;
    }
    if (this.repository?.findReservationById) {
      const found = await this.repository.findReservationById(tenantId, reservationId);
      if (found) {
        this.reservations.set(found.id, found);
        return found;
      }
    }
    return null;
  }

  /**
   * Look up all reservations for an order ID (durable if repository available).
   */
  public async getReservationsForOrder(tenantId: string, orderId: string): Promise<StockReservation[]> {
    this.requireTenant(tenantId, 'getReservationsForOrder');
    if (this.repository?.findReservationsByOrderId) {
      const found = await this.repository.findReservationsByOrderId(tenantId, orderId);
      for (const res of found) {
        this.reservations.set(res.id, res);
      }
      return found;
    }
    const result: StockReservation[] = [];
    for (const res of this.reservations.values()) {
      if (res.tenantId === tenantId && res.orderId === orderId) {
        result.push(res);
      }
    }
    return result;
  }

  /**
   * Query all movements for a tenant (from repository if configured, else in-memory).
   */
  public async getMovements(tenantId: string, productId?: string): Promise<StockMovement[]> {
    this.requireTenant(tenantId, 'getMovements');
    if (this.repository?.listMovements) {
      return this.repository.listMovements(tenantId, productId);
    }
    return this.movements.filter((m) => m.tenantId === tenantId && (!productId || m.productId === productId));
  }

  /**
   * Backward-compatible testing helper.
   */
  public getMovementsForTesting(tenantId: string): StockMovement[] {
    return this.movements.filter((m) => m.tenantId === tenantId);
  }

  /**
   * Helper to persist stock movement.
   */
  private async recordMovement(movement: StockMovement): Promise<StockMovement> {
    StockMovementSchema.parse(movement);
    this.movements.push(movement);
    if (this.repository?.createMovement) {
      try {
        await this.repository.createMovement(movement);
      } catch (err) {
        this.logger.error({
          message: `Failed to persist stock movement ${movement.id}: ${(err as Error).message}`,
          tenantId: movement.tenantId,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }
    return movement;
  }

  /**
   * Reserves stock for Checkout.
   *
   * With a repository: invokes atomic reserve (server-side conditional update)
   * and persists the reservation record.
   */
  public async reserveStock(
    tenantId: string,
    orderId: string,
    productId: string,
    quantity: number,
    ttlSeconds: number,
    correlationId?: string
  ): Promise<StockReservation> {
    this.requireTenant(tenantId, 'reserveStock');
    this.requirePositiveQuantity(productId, quantity, 'reserveStock');

    const cid = correlationId || `inv_res_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const reservationId = `res_${Math.random().toString(36).substr(2, 9)}`;

    if (this.repository) {
      let persisted;
      try {
        persisted = await this.repository.atomicReserve(tenantId, productId, quantity);
      } catch (err) {
        if (err instanceof RepoInsufficientInventoryException) {
          throw new InsufficientInventoryException(err.message);
        }
        this.logger.error({
          message: `Inventory atomic reserve failed for tenant='${tenantId}', product='${productId}': ${(err as Error).message}`,
          tenantId,
          error: err instanceof Error ? err : new Error(String(err)),
        });
        throw err;
      }
      // Refresh cache from authoritative row.
      const stock: InventoryStock = {
        tenantId,
        productId,
        quantityAvailable: persisted.quantity - persisted.reserved,
        quantityReserved: persisted.reserved,
        lowStockThreshold: persisted.lowStockThreshold,
      };
      this.stocks.set(this.getStockKey(tenantId, productId), stock);

      const reservation: StockReservation = {
        id: reservationId,
        tenantId,
        productId,
        orderId,
        quantity,
        expiresAt,
        status: 'PENDING',
      };
      StockReservationSchema.parse(reservation);
      this.reservations.set(reservation.id, reservation);

      if (this.repository.createReservation) {
        try {
          await this.repository.createReservation(reservation);
        } catch (err) {
          this.logger.error({
            message: `Failed to persist reservation ${reservation.id}: ${(err as Error).message}`,
            tenantId,
            error: err instanceof Error ? err : new Error(String(err)),
          });
          // Compensate: release the stock that was atomically reserved in the DB
          try {
            await this.repository.atomicRelease(tenantId, productId, quantity);
            this.logger.info({
              message: `Compensated: released stock for failed reservation ${reservation.id}`,
              tenantId,
              correlationId: cid,
            });
          } catch (releaseErr) {
            this.logger.error({
              message: `CRITICAL: Failed to compensate stock for failed reservation ${reservation.id}: ${(releaseErr as Error).message}`,
              tenantId,
              error: releaseErr instanceof Error ? releaseErr : new Error(String(releaseErr)),
            });
          }
          throw err;
        }
      }

      await this.eventBus.publish({
        eventId: `evt_inv_res_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Inventory.Reserved',
        timestamp: nowIso,
        correlationId: cid,
        tenantId,
        payload: { reservationId: reservation.id, orderId, productId, quantity },
      });
      return reservation;
    }

    const stock = await this.getStock(tenantId, productId);
    if (stock.quantityAvailable < quantity) {
      throw new InsufficientInventoryException(
        `Cannot reserve stock for product '${productId}'. Requested: ${quantity}, Available: ${stock.quantityAvailable}`
      );
    }

    stock.quantityAvailable -= quantity;
    stock.quantityReserved += quantity;
    this.stocks.set(this.getStockKey(tenantId, productId), stock);

    const reservation: StockReservation = {
      id: reservationId,
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
      timestamp: nowIso,
      correlationId: cid,
      tenantId,
      payload: { reservationId: reservation.id, orderId, productId, quantity },
    });

    return reservation;
  }

  /**
   * Commits the reserved stock once payment has been confirmed.
   *
   * Idempotent: re-committing an already COMMITTED reservation returns cleanly.
   */
  public async commitStock(
    tenantId: string,
    reservationId: string,
    correlationId?: string
  ): Promise<StockMovement> {
    this.requireTenant(tenantId, 'commitStock');
    const cid = correlationId || `inv_cmt_${Date.now()}`;
    let reservation = await this.getReservation(tenantId, reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    this.enforceTenantIsolation(tenantId, reservation.tenantId, 'Commit stock reservation');

    // Idempotency: double-commit is a safe no-op.
    if (reservation.status === 'COMMITTED') {
      this.logger.info({
        message: `Stock reservation '${reservationId}' is already COMMITTED; idempotently skipping`,
        tenantId,
      });
      return {
        id: `mov_dup_${reservationId}`,
        tenantId: reservation.tenantId,
        productId: reservation.productId,
        quantityDelta: -reservation.quantity,
        type: 'RESERVATION_COMMIT',
        reason: `Order ${reservation.orderId} already committed (idempotent)`,
        createdAt: new Date().toISOString(),
      };
    }

    if (reservation.status !== 'PENDING') {
      throw new Error(`Cannot commit stock for reservation '${reservationId}' in status '${reservation.status}'`);
    }

    reservation.status = 'COMMITTED';
    this.reservations.set(reservationId, reservation);

    if (this.repository?.updateReservationStatus) {
      try {
        await this.repository.updateReservationStatus(tenantId, reservationId, 'COMMITTED');
      } catch (err) {
        this.logger.error({
          message: `Failed to persist reservation status change for ${reservationId}: ${(err as Error).message}`,
          tenantId,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }

    if (this.repository) {
      let committedRow;
      if (typeof this.repository.atomicCommit === 'function') {
        committedRow = await this.repository.atomicCommit(reservation.tenantId, reservation.productId, reservation.quantity);
      } else {
        await this.repository.atomicRelease(reservation.tenantId, reservation.productId, reservation.quantity);
        committedRow = await this.repository.findByTenantAndProduct(reservation.tenantId, reservation.productId);
      }
      if (committedRow) {
        const stock: InventoryStock = {
          tenantId: reservation.tenantId,
          productId: reservation.productId,
          quantityAvailable: Math.max(0, committedRow.quantity - committedRow.reserved),
          quantityReserved: Math.max(0, committedRow.reserved),
          lowStockThreshold: committedRow.lowStockThreshold,
        };
        this.stocks.set(this.getStockKey(reservation.tenantId, reservation.productId), stock);
      }
    } else {
      const stock = await this.getStock(tenantId, reservation.productId);
      stock.quantityReserved -= reservation.quantity;
      stock.quantityAvailable = Math.max(0, stock.quantityAvailable);
      this.stocks.set(this.getStockKey(tenantId, reservation.productId), stock);
    }

    const movement: StockMovement = {
      id: `mov_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: reservation.tenantId,
      productId: reservation.productId,
      quantityDelta: -reservation.quantity,
      type: 'RESERVATION_COMMIT',
      reason: `Order ${reservation.orderId} paid and committed`,
      createdAt: new Date().toISOString(),
    };

    await this.recordMovement(movement);

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
   *
   * Idempotent: re-releasing an already RELEASED reservation returns cleanly.
   */
  public async releaseStock(
    tenantId: string,
    reservationId: string,
    correlationId?: string
  ): Promise<void> {
    this.requireTenant(tenantId, 'releaseStock');
    const cid = correlationId || `inv_rel_${Date.now()}`;
    let reservation = await this.getReservation(tenantId, reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    this.enforceTenantIsolation(tenantId, reservation.tenantId, 'Release stock reservation');

    // Idempotency: double-release is a safe no-op.
    if (reservation.status === 'RELEASED' || reservation.status === 'EXPIRED') {
      this.logger.info({
        message: `Stock reservation '${reservationId}' is already '${reservation.status}'; idempotently skipping release`,
        tenantId,
      });
      return;
    }

    if (reservation.status !== 'PENDING') {
      throw new Error(`Cannot release stock for reservation '${reservationId}' in status '${reservation.status}'`);
    }

    reservation.status = 'RELEASED';
    this.reservations.set(reservationId, reservation);

    if (this.repository?.updateReservationStatus) {
      try {
        await this.repository.updateReservationStatus(tenantId, reservationId, 'RELEASED');
      } catch (err) {
        this.logger.error({
          message: `Failed to persist reservation release status for ${reservationId}: ${(err as Error).message}`,
          tenantId,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }

    if (this.repository) {
      await this.repository.atomicRelease(reservation.tenantId, reservation.productId, reservation.quantity);
      const hydrated = await this.repository.findByTenantAndProduct(reservation.tenantId, reservation.productId);
      if (hydrated) {
        const stock: InventoryStock = {
          tenantId: reservation.tenantId,
          productId: reservation.productId,
          quantityAvailable: hydrated.quantity - hydrated.reserved,
          quantityReserved: hydrated.reserved,
          lowStockThreshold: hydrated.lowStockThreshold,
        };
        this.stocks.set(this.getStockKey(reservation.tenantId, reservation.productId), stock);
      }
    } else {
      const stock = await this.getStock(tenantId, reservation.productId);
      stock.quantityAvailable += reservation.quantity;
      stock.quantityReserved -= reservation.quantity;
      this.stocks.set(this.getStockKey(tenantId, reservation.productId), stock);
    }

    const movement: StockMovement = {
      id: `mov_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: reservation.tenantId,
      productId: reservation.productId,
      quantityDelta: 0,
      type: 'RESERVATION_RELEASE',
      reason: `Reservation ${reservation.id} released`,
      createdAt: new Date().toISOString(),
    };
    await this.recordMovement(movement);

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
   * Sweeps expired pending reservations and releases reserved stock.
   *
   * Idempotent & tenant-isolated. Safe against process restarts and concurrent calls.
   */
  public async sweepExpiredReservations(
    tenantId?: string,
    now?: string,
    correlationId?: string
  ): Promise<{ sweptCount: number; expiredReservationIds: string[] }> {
    const cid = correlationId || `inv_sweep_${Date.now()}`;
    const cutoff = now ?? new Date().toISOString();

    this.logger.info({
      message: `Sweeping expired reservations for ${tenantId || 'all tenants'} (cutoff: ${cutoff})`,
      correlationId: cid,
      tenantId: tenantId || 'system',
    });

    let expiredList: StockReservation[] = [];
    if (this.repository?.findExpiredReservations) {
      expiredList = await this.repository.findExpiredReservations(tenantId, cutoff);
    } else {
      for (const res of this.reservations.values()) {
        if (tenantId && res.tenantId !== tenantId) continue;
        if (res.status === 'PENDING' && res.expiresAt <= cutoff) {
          expiredList.push(res);
        }
      }
    }

    const expiredReservationIds: string[] = [];

    for (const reservation of expiredList) {
      try {
        const current = await this.getReservation(reservation.tenantId, reservation.id);
        if (!current || current.status !== 'PENDING') continue;

        reservation.status = 'EXPIRED';
        this.reservations.set(reservation.id, reservation);

        if (this.repository?.updateReservationStatus) {
          const updated = await this.repository.updateReservationStatus(reservation.tenantId, reservation.id, 'EXPIRED', 'PENDING');
          if (!updated) {
            // Another concurrent worker or lifecycle event already updated status
            continue;
          }
        }

        if (this.repository) {
          await this.repository.atomicRelease(reservation.tenantId, reservation.productId, reservation.quantity);
          const hydrated = await this.repository.findByTenantAndProduct(reservation.tenantId, reservation.productId);
          if (hydrated) {
            const stock: InventoryStock = {
              tenantId: reservation.tenantId,
              productId: reservation.productId,
              quantityAvailable: hydrated.quantity - hydrated.reserved,
              quantityReserved: hydrated.reserved,
              lowStockThreshold: hydrated.lowStockThreshold,
            };
            this.stocks.set(this.getStockKey(reservation.tenantId, reservation.productId), stock);
          }
        } else {
          const stock = await this.getStock(reservation.tenantId, reservation.productId);
          stock.quantityAvailable += reservation.quantity;
          stock.quantityReserved = Math.max(0, stock.quantityReserved - reservation.quantity);
          this.stocks.set(this.getStockKey(reservation.tenantId, reservation.productId), stock);
        }

        const movement: StockMovement = {
          id: `mov_exp_${Math.random().toString(36).substr(2, 9)}`,
          tenantId: reservation.tenantId,
          productId: reservation.productId,
          quantityDelta: 0,
          type: 'EXPIRED',
          reason: `Reservation ${reservation.id} expired at ${reservation.expiresAt}`,
          createdAt: new Date().toISOString(),
        };
        await this.recordMovement(movement);

        await this.eventBus.publish({
          eventId: `evt_inv_exp_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'Inventory.Released',
          timestamp: new Date().toISOString(),
          correlationId: cid,
          tenantId: reservation.tenantId,
          payload: { reservationId: reservation.id, reason: 'expired' },
        });

        expiredReservationIds.push(reservation.id);
      } catch (err: any) {
        this.logger.error({
          message: `Failed to sweep expired reservation ${reservation.id}: ${err.message}`,
          correlationId: cid,
          tenantId: reservation.tenantId,
          error: err,
        });
      }
    }

    return {
      sweptCount: expiredReservationIds.length,
      expiredReservationIds,
    };
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
    this.requireTenant(tenantId, 'adjustStock');
    const cid = correlationId || `inv_adj_${Date.now()}`;

    if (this.repository) {
      const current = await this.repository.findByTenantAndProduct(tenantId, productId);
      const baseQty = current?.quantity ?? 0;
      const baseReserved = current?.reserved ?? 0;
      const baseThreshold = current?.lowStockThreshold ?? 5;
      const nextQty = Math.max(0, baseQty + delta);
      const nextAvailable = nextQty - baseReserved;
      if (nextAvailable < 0) {
        throw new InsufficientInventoryException(
          `adjustStock would cause negative available stock for tenant='${tenantId}', product='${productId}'`
        );
      }
      await this.repository.upsertStock({
        tenantId,
        productId,
        quantity: nextQty,
        reserved: baseReserved,
        lowStockThreshold: baseThreshold,
      });
      const stock: InventoryStock = {
        tenantId,
        productId,
        quantityAvailable: nextAvailable,
        quantityReserved: baseReserved,
        lowStockThreshold: baseThreshold,
      };
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
      await this.recordMovement(movement);

      if (nextAvailable <= baseThreshold) {
        await this.eventBus.publish({
          eventId: `evt_inv_low_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'Inventory.LowStock',
          timestamp: new Date().toISOString(),
          correlationId: cid,
          tenantId,
          payload: { productId, quantityAvailable: nextAvailable },
        });
      }
      return stock;
    }

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

    await this.recordMovement(movement);

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

/**
 * Bridge adapter: wraps a commerce-persistence `InventoryRepository` and exposes
 * the engine's narrow `InventoryPersistenceAdapter` contract.
 */
export class InventoryRepositoryAdapter implements InventoryPersistenceAdapter {
  constructor(private readonly repo: InventoryRepository) {}

  async findByTenantAndProduct(tenantId: string, productId: string) {
    const inv = await this.repo.findByTenantAndProduct(tenantId, productId);
    if (!inv) return null;
    return {
      tenantId: inv.tenantId,
      productId: inv.productId,
      quantity: inv.quantity,
      reserved: inv.reserved,
      lowStockThreshold: inv.lowStockThreshold ?? 5,
    };
  }

  async atomicReserve(tenantId: string, productId: string, quantity: number) {
    const inv = await this.repo.atomicReserve(tenantId, productId, quantity);
    return {
      tenantId: inv.tenantId,
      productId: inv.productId,
      quantity: inv.quantity,
      reserved: inv.reserved,
      lowStockThreshold: inv.lowStockThreshold ?? 5,
    };
  }

  async atomicRelease(tenantId: string, productId: string, quantity: number) {
    const inv = await this.repo.atomicRelease(tenantId, productId, quantity);
    return {
      tenantId: inv.tenantId,
      productId: inv.productId,
      quantity: inv.quantity,
      reserved: inv.reserved,
      lowStockThreshold: inv.lowStockThreshold ?? 5,
    };
  }

  async atomicCommit(tenantId: string, productId: string, quantity: number) {
    const inv = await this.repo.atomicCommit(tenantId, productId, quantity);
    return {
      tenantId: inv.tenantId,
      productId: inv.productId,
      quantity: inv.quantity,
      reserved: inv.reserved,
      lowStockThreshold: inv.lowStockThreshold ?? 5,
    };
  }

  async upsertStock(input: {
    tenantId: string;
    productId: string;
    quantity: number;
    reserved?: number;
    lowStockThreshold?: number;
  }) {
    const existing = await this.repo.findByTenantAndProduct(input.tenantId, input.productId);
    const now = new Date().toISOString();
    if (!existing) {
      const created = await this.repo.create({
        id: `inv_${Math.random().toString(36).slice(2, 12)}`,
        tenantId: input.tenantId,
        productId: input.productId,
        quantity: input.quantity,
        reserved: input.reserved ?? 0,
        lowStockThreshold: input.lowStockThreshold ?? 5,
        createdAt: now,
        updatedAt: now,
      } as any);
      return {
        tenantId: created.tenantId,
        productId: created.productId,
        quantity: created.quantity,
        reserved: created.reserved,
        lowStockThreshold: created.lowStockThreshold ?? 5,
      };
    }
    const updated = await this.repo.update(existing.id, {
      quantity: input.quantity,
      reserved: input.reserved ?? existing.reserved,
      lowStockThreshold: input.lowStockThreshold ?? existing.lowStockThreshold ?? 5,
    } as any);
    return {
      tenantId: updated.tenantId,
      productId: updated.productId,
      quantity: updated.quantity,
      reserved: updated.reserved,
      lowStockThreshold: updated.lowStockThreshold ?? 5,
    };
  }

  async createReservation(reservation: StockReservation): Promise<StockReservation> {
    const rec = await this.repo.createReservation({
      id: reservation.id,
      tenantId: reservation.tenantId,
      productId: reservation.productId,
      orderId: reservation.orderId,
      quantity: reservation.quantity,
      expiresAt: reservation.expiresAt,
      status: reservation.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return {
      id: rec.id,
      tenantId: rec.tenantId,
      productId: rec.productId,
      orderId: rec.orderId,
      quantity: rec.quantity,
      expiresAt: rec.expiresAt,
      status: rec.status,
    };
  }

  async updateReservationStatus(
    tenantId: string,
    reservationId: string,
    status: StockReservation['status'],
    expectedStatus?: StockReservation['status']
  ): Promise<StockReservation | null> {
    const rec = await this.repo.updateReservationStatus(tenantId, reservationId, status, expectedStatus);
    if (!rec) return null;
    return {
      id: rec.id,
      tenantId: rec.tenantId,
      productId: rec.productId,
      orderId: rec.orderId,
      quantity: rec.quantity,
      expiresAt: rec.expiresAt,
      status: rec.status,
    };
  }

  async findReservationById(tenantId: string, reservationId: string): Promise<StockReservation | null> {
    const rec = await this.repo.findReservationById(tenantId, reservationId);
    if (!rec) return null;
    return {
      id: rec.id,
      tenantId: rec.tenantId,
      productId: rec.productId,
      orderId: rec.orderId,
      quantity: rec.quantity,
      expiresAt: rec.expiresAt,
      status: rec.status,
    };
  }

  async findReservationsByOrderId(tenantId: string, orderId: string): Promise<StockReservation[]> {
    const records = await this.repo.findReservationsByOrderId(tenantId, orderId);
    return records.map((rec) => ({
      id: rec.id,
      tenantId: rec.tenantId,
      productId: rec.productId,
      orderId: rec.orderId,
      quantity: rec.quantity,
      expiresAt: rec.expiresAt,
      status: rec.status,
    }));
  }

  async findExpiredReservations(tenantId?: string, now?: string): Promise<StockReservation[]> {
    const records = await this.repo.findExpiredReservations(tenantId, now);
    return records.map((rec) => ({
      id: rec.id,
      tenantId: rec.tenantId,
      productId: rec.productId,
      orderId: rec.orderId,
      quantity: rec.quantity,
      expiresAt: rec.expiresAt,
      status: rec.status,
    }));
  }

  async createMovement(movement: StockMovement): Promise<StockMovement> {
    const rec = await this.repo.createMovement({
      id: movement.id,
      tenantId: movement.tenantId,
      productId: movement.productId,
      quantityDelta: movement.quantityDelta,
      type: movement.type,
      reason: movement.reason,
      createdAt: movement.createdAt,
    });
    return {
      id: rec.id,
      tenantId: rec.tenantId,
      productId: rec.productId,
      quantityDelta: rec.quantityDelta,
      type: rec.type,
      reason: rec.reason,
      createdAt: rec.createdAt,
    };
  }

  async listMovements(tenantId: string, productId?: string): Promise<StockMovement[]> {
    const records = await this.repo.listMovements(tenantId, productId);
    return records.map((rec) => ({
      id: rec.id,
      tenantId: rec.tenantId,
      productId: rec.productId,
      quantityDelta: rec.quantityDelta,
      type: rec.type,
      reason: rec.reason,
      createdAt: rec.createdAt,
    }));
  }
}