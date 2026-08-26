/**
 * StorefrontInventoryReservationEngine.ts — Sprint G1-94 Inventory Reservation & Overselling Prevention Engine (Night Shift Level 56)
 *
 * Provides pure TypeScript, headless inventory reservation management during checkout.
 * Handles temporary reservations with TTL expiration, explicit release, stock commit on purchase,
 * and concurrency protection against overselling.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type ReservationStatus = 'ACTIVE' | 'EXPIRED' | 'COMMITTED' | 'RELEASED';

export interface InventoryReservationDTO {
  readonly reservationId: string;
  readonly tenantId: string;
  readonly productId: string;
  readonly variantId: string;
  readonly quantity: number;
  readonly reservedForSessionId: string;
  readonly status: ReservationStatus;
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
}

export interface InventoryStockRecordDTO {
  readonly productId: string;
  readonly variantId: string;
  readonly totalStock: number;
  readonly allocatedStock: number; // permanently committed
}

export interface ReservationResultDTO {
  readonly success: boolean;
  readonly reservationId?: string;
  readonly failureReason?: string;
  readonly reservation?: InventoryReservationDTO;
}

export interface InventoryReservationEngineStateDTO {
  readonly tenantId: string;
  readonly defaultTtlMs: number;
  readonly stockRecords: Record<string, InventoryStockRecordDTO>;
  readonly reservations: Record<string, InventoryReservationDTO>;
}

export class StorefrontInventoryReservationEngine {
  private readonly tenantId: string;
  private readonly defaultTtlMs: number;
  private stockRecords: Map<string, InventoryStockRecordDTO> = new Map(); // key: `productId:variantId`
  private reservations: Map<string, InventoryReservationDTO> = new Map(); // key: reservationId

  constructor(tenantId = 'default_tenant', defaultTtlMs = 15 * 60 * 1000) {
    this.tenantId = tenantId;
    this.defaultTtlMs = defaultTtlMs;
  }

  /**
   * Sets initial stock level for a product/variant.
   */
  public setStockLevel(productId: string, variantId: string, totalStock: number): InventoryStockRecordDTO {
    if (totalStock < 0) {
      throw new Error('Total stock cannot be negative');
    }
    const key = `${productId}:${variantId}`;
    const record: InventoryStockRecordDTO = {
      productId,
      variantId,
      totalStock,
      allocatedStock: 0
    };
    this.stockRecords.set(key, record);
    return record;
  }

  /**
   * Calculates currently available unreserved stock.
   */
  public getAvailableStock(productId: string, variantId: string): number {
    this.cleanupExpiredReservations();
    const key = `${productId}:${variantId}`;
    const record = this.stockRecords.get(key);
    if (!record) {
      return 0;
    }

    let activeReservedQuantity = 0;
    const now = Date.now();
    for (const res of this.reservations.values()) {
      if (res.productId === productId && res.variantId === variantId && res.status === 'ACTIVE' && res.expiresAtMs > now) {
        activeReservedQuantity += res.quantity;
      }
    }

    return Math.max(0, record.totalStock - record.allocatedStock - activeReservedQuantity);
  }

  /**
   * Places a temporary inventory reservation for checkout.
   */
  public reserveInventory(params: {
    productId: string;
    variantId: string;
    quantity: number;
    sessionId: string;
    ttlMs?: number;
  }): ReservationResultDTO {
    const { productId, variantId, quantity, sessionId } = params;

    if (quantity <= 0 || !productId || !sessionId) {
      throw new Error('Invalid reservation parameters: quantity > 0, productId, and sessionId are required');
    }

    const available = this.getAvailableStock(productId, variantId);
    if (available < quantity) {
      return {
        success: false,
        failureReason: `Insufficient available stock (${available} available, ${quantity} requested)`
      };
    }

    const now = Date.now();
    const ttl = params.ttlMs ?? this.defaultTtlMs;
    const reservationId = `res_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const reservation: InventoryReservationDTO = {
      reservationId,
      tenantId: this.tenantId,
      productId,
      variantId,
      quantity,
      reservedForSessionId: sessionId,
      status: 'ACTIVE',
      createdAtMs: now,
      expiresAtMs: now + ttl
    };

    this.reservations.set(reservationId, reservation);
    return { success: true, reservationId, reservation };
  }

  /**
   * Permanently commits reserved inventory upon order completion.
   */
  public commitReservation(reservationId: string): InventoryReservationDTO {
    this.cleanupExpiredReservations();
    const existing = this.reservations.get(reservationId);
    if (!existing) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    if (existing.status !== 'ACTIVE') {
      throw new Error(`Cannot commit reservation ${reservationId} in status ${existing.status}`);
    }

    const key = `${existing.productId}:${existing.variantId}`;
    const stockRecord = this.stockRecords.get(key);
    if (stockRecord) {
      this.stockRecords.set(key, {
        ...stockRecord,
        allocatedStock: stockRecord.allocatedStock + existing.quantity
      });
    }

    const updated: InventoryReservationDTO = {
      ...existing,
      status: 'COMMITTED'
    };

    this.reservations.set(reservationId, updated);
    return updated;
  }

  /**
   * Manually releases an active reservation (e.g. cart item removed or checkout abandoned).
   */
  public releaseReservation(reservationId: string): InventoryReservationDTO {
    const existing = this.reservations.get(reservationId);
    if (!existing) {
      throw new Error(`Reservation not found: ${reservationId}`);
    }

    if (existing.status !== 'ACTIVE') {
      throw new Error(`Cannot release reservation ${reservationId} in status ${existing.status}`);
    }

    const updated: InventoryReservationDTO = {
      ...existing,
      status: 'RELEASED'
    };

    this.reservations.set(reservationId, updated);
    return updated;
  }

  /**
   * Sweeps and transitions expired reservations to EXPAIRED state.
   */
  public cleanupExpiredReservations(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [id, res] of this.reservations.entries()) {
      if (res.status === 'ACTIVE' && res.expiresAtMs <= now) {
        this.reservations.set(id, { ...res, status: 'EXPIRED' });
        cleaned++;
      }
    }
    return cleaned;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): InventoryReservationEngineStateDTO {
    const stockRecord: Record<string, InventoryStockRecordDTO> = {};
    this.stockRecords.forEach((val, key) => {
      stockRecord[key] = val;
    });

    const reservationsRecord: Record<string, InventoryReservationDTO> = {};
    this.reservations.forEach((val, key) => {
      reservationsRecord[key] = val;
    });

    return {
      tenantId: this.tenantId,
      defaultTtlMs: this.defaultTtlMs,
      stockRecords: stockRecord,
      reservations: reservationsRecord
    };
  }

  public importState(state: InventoryReservationEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.stockRecords.clear();
    this.reservations.clear();

    Object.entries(state.stockRecords || {}).forEach(([k, v]) => {
      this.stockRecords.set(k, v);
    });
    Object.entries(state.reservations || {}).forEach(([k, v]) => {
      this.reservations.set(k, v);
    });
  }
}
