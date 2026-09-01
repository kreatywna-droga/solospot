// MemoryInventoryRepository.ts
// C9.1: Commerce Persistence — in-memory implementation of InventoryRepository
// G1-332: Tenant-scoped + atomic reservation semantics in-process.

import { MemoryRepository } from '../providers/MemoryRepository'
import { InventoryRepository, Inventory, InsufficientInventoryException } from './InventoryRepository'

export class MemoryInventoryRepository extends MemoryRepository<Inventory> implements InventoryRepository {
  private readonly atomicLock = { locked: false, queue: Array<() => void>() }

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
}