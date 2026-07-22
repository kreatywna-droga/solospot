// InventoryRepository.ts
// C9.1: Commerce Persistence — inventory repository

import { Repository } from '../interfaces/Repository'

export interface Inventory {
  id: string
  productId: string
  quantity: number
  reserved: number
  createdAt: string
  updatedAt: string
}

export interface InventoryRepository extends Repository<Inventory> {
  reserve(productId: string, quantity: number): Promise<Inventory>
  release(productId: string, quantity: number): Promise<Inventory>
  adjust(productId: string, quantity: number): Promise<Inventory>
}
