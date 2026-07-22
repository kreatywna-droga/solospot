// SupabaseInventoryRepository.ts
// C9.1: Commerce Persistence — Supabase inventory repository

import { SupabaseRepository } from './SupabaseRepository'
import { Inventory, InventoryRepository } from '../repositories/InventoryRepository'

export class SupabaseInventoryRepository extends SupabaseRepository<Inventory> implements InventoryRepository {
  protected getTableName(): string {
    return 'inventory'
  }

  async reserve(productId: string, quantity: number): Promise<Inventory> {
    const existing = await this.findById(productId)
    if (!existing) {
      throw new Error(`Inventory not found: ${productId}`)
    }
    const newReserved = existing.reserved + quantity
    if (newReserved > existing.quantity) {
      throw new Error(`Insufficient inventory for product: ${productId}`)
    }
    return this.update(productId, { reserved: newReserved })
  }

  async release(productId: string, quantity: number): Promise<Inventory> {
    const existing = await this.findById(productId)
    if (!existing) {
      throw new Error(`Inventory not found: ${productId}`)
    }
    const newReserved = Math.max(0, existing.reserved - quantity)
    return this.update(productId, { reserved: newReserved })
  }

  async adjust(productId: string, quantity: number): Promise<Inventory> {
    const existing = await this.findById(productId)
    if (!existing) {
      throw new Error(`Inventory not found: ${productId}`)
    }
    return this.update(productId, { quantity: Math.max(0, existing.quantity + quantity) })
  }
}
