// MemoryInventoryRepository.ts
// C9.1: Commerce Persistence — in-memory implementation of InventoryRepository
// G1-332: Tenant-scoped + atomic reservation semantics in-process.
// G1-334: Stock reservation persistence, movement persistence & expiration support.

import { MemoryRepository } from '../providers/MemoryRepository'
import {
  InventoryRepository,
  Inventory,
  InsufficientInventoryException,
  StockReservationRecord,
  StockReservationStatus,
  StockMovementRecord,
} from './InventoryRepository'

export class MemoryInventoryRepository extends MemoryRepository<Inventory> implements InventoryRepository {
  private readonly atomicLock = { locked: false, queue: Array<() => void>() }
  private readonly reservations = new Map<string, StockReservationRecord>()
  private readonly movements: StockMovementRecord[] = []

  /**
   * Single-process serialization for atomic reserve/release. Multiple Vercel
   * serverless instances would still race — this only protects in-process tests.
   * Production safety comes from the Supabase implementation filtering on
   * `quantity - reserved >= n` server-side.
   */
  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    if (this.atomicLock.locked) {
      await new Promise<void>((resolve) => this.atomicLock.queue.push(resolve))
    }
    this.atomicLock.locked = true
    try {
      return await fn()
    } finally {
      const next = this.atomicLock.queue.shift()
      this.atomicLock.locked = false
      if (next) next()
    }
  }

  async reserve(productId: string, quantity: number): Promise<Inventory> {
    const existing = await this.findById(productId)
    if (!existing) throw new Error(`Inventory not found: ${productId}`)
    const newReserved = existing.reserved + quantity
    if (newReserved > existing.quantity) throw new Error(`Insufficient inventory for product: ${productId}`)
    return this.update(productId, { reserved: newReserved })
  }

  async release(productId: string, quantity: number): Promise<Inventory> {
    const existing = await this.findById(productId)
    if (!existing) throw new Error(`Inventory not found: ${productId}`)
    const newReserved = Math.max(0, existing.reserved - quantity)
    return this.update(productId, { reserved: newReserved })
  }

  async adjust(productId: string, quantity: number): Promise<Inventory> {
    const existing = await this.findById(productId)
    if (!existing) throw new Error(`Inventory not found: ${productId}`)
    return this.update(productId, { quantity: Math.max(0, existing.quantity + quantity) })
  }

  async findByTenantAndProduct(tenantId: string, productId: string): Promise<Inventory | null> {
    const all = await this.findAll({ filters: { tenantId, productId } as any })
    return all[0] ?? null
  }

  async upsertStock(input: {
    tenantId: string
    productId: string
    quantity: number
    reserved?: number
    lowStockThreshold?: number
  }): Promise<Inventory> {
    const existing = await this.findByTenantAndProduct(input.tenantId, input.productId)
    if (existing) {
      return this.update(existing.id, {
        quantity: input.quantity,
        reserved: input.reserved ?? existing.reserved,
        lowStockThreshold: input.lowStockThreshold ?? existing.lowStockThreshold,
      })
    }
    const newRecord: Inventory = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: input.tenantId,
      productId: input.productId,
      quantity: input.quantity,
      reserved: input.reserved ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return this.create(newRecord)
  }


  async atomicReserve(tenantId: string, productId: string, quantity: number): Promise<Inventory> {
    if (!tenantId || !productId) {
      throw new Error(`atomicReserve requires tenantId and productId (got tenantId=${tenantId}, productId=${productId})`)
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`atomicReserve requires positive integer quantity (got ${quantity})`)
    }
    return this.withLock(async () => {
      const inv = await this.findByTenantAndProduct(tenantId, productId)
      if (!inv) {
        throw new InsufficientInventoryException(
          `Inventory not found for tenant='${tenantId}', product='${productId}'`
        )
      }
      const available = inv.quantity - inv.reserved
      if (available < quantity) {
        throw new InsufficientInventoryException(
          `Insufficient inventory for tenant='${tenantId}', product='${productId}': requested ${quantity}, available ${available}`
        )
      }
      return this.update(inv.id, { reserved: inv.reserved + quantity })
    })
  }

  async atomicRelease(tenantId: string, productId: string, quantity: number): Promise<Inventory> {
    if (!tenantId || !productId) {
      throw new Error(`atomicRelease requires tenantId and productId (got tenantId=${tenantId}, productId=${productId})`)
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`atomicRelease requires positive integer quantity (got ${quantity})`)
    }
    return this.withLock(async () => {
      const inv = await this.findByTenantAndProduct(tenantId, productId)
      if (!inv) {
        throw new Error(`Inventory not found for tenant='${tenantId}', product='${productId}'`)
      }
      const newReserved = Math.max(0, inv.reserved - quantity)
      return this.update(inv.id, { reserved: newReserved })
    })
  }

  async atomicCommit(tenantId: string, productId: string, quantity: number): Promise<Inventory> {
    if (!tenantId || !productId) {
      throw new Error(`atomicCommit requires tenantId and productId (got tenantId=${tenantId}, productId=${productId})`)
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`atomicCommit requires positive integer quantity (got ${quantity})`)
    }
    return this.withLock(async () => {
      const inv = await this.findByTenantAndProduct(tenantId, productId)
      if (!inv) {
        throw new Error(`Inventory not found for tenant='${tenantId}', product='${productId}'`)
      }
      const newQuantity = Math.max(0, inv.quantity - quantity)
      const newReserved = Math.max(0, inv.reserved - quantity)
      return this.update(inv.id, { quantity: newQuantity, reserved: newReserved })
    })
  }


  // ============================================================================
  // Stock Reservations Persistence (G1-334)
  // ============================================================================

  async createReservation(reservation: StockReservationRecord): Promise<StockReservationRecord> {
    if (!reservation.tenantId) {
      throw new Error('createReservation requires tenantId');
    }
    this.reservations.set(reservation.id, { ...reservation });
    return { ...reservation };
  }

  async updateReservationStatus(
    tenantId: string,
    reservationId: string,
    status: StockReservationStatus,
    expectedStatus?: StockReservationStatus
  ): Promise<StockReservationRecord | null> {
    return this.withLock(async () => {
      const existing = this.reservations.get(reservationId);
      if (!existing) {
        return null;
      }
      if (existing.tenantId !== tenantId) {
        throw new Error(`Cross-tenant reservation access blocked for tenant '${tenantId}'`);
      }
      if (expectedStatus && existing.status !== expectedStatus) {
        return null;
      }
      const updated: StockReservationRecord = {
        ...existing,
        status,
        updatedAt: new Date().toISOString(),
      };
      this.reservations.set(reservationId, updated);
      return { ...updated };
    });
  }

  async findReservationById(tenantId: string, reservationId: string): Promise<StockReservationRecord | null> {
    const res = this.reservations.get(reservationId);
    if (!res || res.tenantId !== tenantId) return null;
    return { ...res };
  }

  async findReservationsByOrderId(tenantId: string, orderId: string): Promise<StockReservationRecord[]> {
    const result: StockReservationRecord[] = [];
    for (const res of this.reservations.values()) {
      if (res.tenantId === tenantId && res.orderId === orderId) {
        result.push({ ...res });
      }
    }
    return result;
  }

  async findExpiredReservations(tenantId?: string, now?: string): Promise<StockReservationRecord[]> {
    const cutoff = now ?? new Date().toISOString();
    const result: StockReservationRecord[] = [];
    for (const res of this.reservations.values()) {
      if (tenantId && res.tenantId !== tenantId) continue;
      if (res.status === 'PENDING' && res.expiresAt <= cutoff) {
        result.push({ ...res });
      }
    }
    return result;
  }

  // ============================================================================
  // Stock Movements Persistence (G1-334)
  // ============================================================================

  async createMovement(movement: StockMovementRecord): Promise<StockMovementRecord> {
    if (!movement.tenantId) {
      throw new Error('createMovement requires tenantId');
    }
    const record = { ...movement };
    this.movements.push(record);
    return record;
  }

  async listMovements(tenantId: string, productId?: string): Promise<StockMovementRecord[]> {
    return this.movements
      .filter((m) => m.tenantId === tenantId && (!productId || m.productId === productId))
      .map((m) => ({ ...m }));
  }
}