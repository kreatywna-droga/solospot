// MemoryInventoryRepository.ts
// C9.1: Commerce Persistence — in-memory implementation of InventoryRepository

import { MemoryRepository } from '../providers/MemoryRepository'
import { InventoryRepository } from './InventoryRepository'
import { Inventory } from './InventoryRepository'

export class MemoryInventoryRepository extends MemoryRepository<Inventory> implements InventoryRepository {
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
}
