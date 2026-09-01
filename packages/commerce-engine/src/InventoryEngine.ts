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
   * record (legacy semantics — preserved for the 5 existing unit tests).
   */
  public async getStock(tenantId: string, productId: string): Promise<InventoryStock> {
    this.requireTenant(tenantId, 'getStock');

    if (this.repository) {
      const key = this.getStockKey(tenantId, productId);
      const cached = this.stocks.get(key);
      if (cached) return cached;
      const hydrated = await this.hydrateFromRepository(tenantId, productId);
      if (hydrated) return hydrated;
      // No persisted row yet — surface a zero-qty stock record (the caller can
      // decide to initialize via initializeStock).
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
   * Safely query all movements (for audit/test assertions).
   *
   * Only returns the in-memory cache. Movements are not persisted in this
   * iteration — they remain a derived view of reservation commits, accessible
   * via `StockMovement` aggregation on the `StockReservation` history if a
   * future task requires long-term audit.
   */
  public getMovementsForTesting(tenantId: string): StockMovement[] {
    return this.movements.filter((m) => m.tenantId === tenantId);
  }

  /**
   * Reserves stock for Checkout.
   *
   * With a repository: invokes atomic reserve (server-side conditional update).
   * Without a repository: legacy in-memory arithmetic.
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

    if (this.repository) {
      let persisted;
      try {
        persisted = await this.repository.atomicReserve(tenantId, productId, quantity);
      } catch (err) {
        if (err instanceof RepoInsufficientInventoryException) {
          // Re-throw as the engine's canonical exception type.
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
        id: `res_${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        productId,
        orderId,
        quantity,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
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
   *
   * With a repository: invokes atomic release (server-side conditional
   * decrement of `reserved`) and additionally persists the quantity reduction
   * (commit consumes stock).
   */
  public async commitStock(
    tenantId: string,
    reservationId: string,
    correlationId?: string
  ): Promise<StockMovement> {
    this.requireTenant(tenantId, 'commitStock');
    const cid = correlationId || `inv_cmt_${Date.now()}`;
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    this.enforceTenantIsolation(tenantId, reservation.tenantId, 'Commit stock reservation');

    if (reservation.status !== 'PENDING') {
      throw new Error(`Cannot commit stock for reservation '${reservationId}' in status '${reservation.status}'`);
    }

    reservation.status = 'COMMITTED';
    this.reservations.set(reservationId, reservation);

    if (this.repository) {
      // Release the reserved counter and decrement total quantity atomically.
      // atomicRelease handles reserved; for the quantity decrement we do a
      // follow-up upsert (stock receipt path) — this stays within the engine's
      // persistence contract.
      await this.repository.atomicRelease(reservation.tenantId, reservation.productId, reservation.quantity);
      // Persist the commit: quantity drops by reservation.quantity.
      const hydrated = await this.repository.findByTenantAndProduct(reservation.tenantId, reservation.productId);
      if (hydrated) {
        await this.repository.upsertStock({
          tenantId: reservation.tenantId,
          productId: reservation.productId,
          quantity: Math.max(0, hydrated.quantity - reservation.quantity),
          reserved: Math.max(0, hydrated.reserved),
          lowStockThreshold: hydrated.lowStockThreshold,
        });
        const stock: InventoryStock = {
          tenantId: reservation.tenantId,
          productId: reservation.productId,
          quantityAvailable: Math.max(0, hydrated.quantity - reservation.quantity) - Math.max(0, hydrated.reserved),
          quantityReserved: Math.max(0, hydrated.reserved),
          lowStockThreshold: hydrated.lowStockThreshold,
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
    this.requireTenant(tenantId, 'releaseStock');
    const cid = correlationId || `inv_rel_${Date.now()}`;
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    this.enforceTenantIsolation(tenantId, reservation.tenantId, 'Release stock reservation');

    if (reservation.status !== 'PENDING') {
      throw new Error(`Cannot release stock for reservation '${reservationId}' in status '${reservation.status}'`);
    }

    reservation.status = 'RELEASED';
    this.reservations.set(reservationId, reservation);

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
      StockMovementSchema.parse(movement);
      this.movements.push(movement);

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

    StockMovementSchema.parse(movement);
    this.movements.push(movement);

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
 *
 * This is the single place where the engine meets the persistence layer.
 * It implements only upsert + atomic reserve/release — the engine's only
 * authoritative writes when a repository is configured.
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
}