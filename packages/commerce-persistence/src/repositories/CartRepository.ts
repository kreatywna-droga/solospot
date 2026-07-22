// CartRepository.ts
// C9.1: Commerce Persistence — cart repository

import { QueryOptions, TenantAwareRepository } from '../interfaces/Repository'

export interface CartItem {
  productId: string
  variantId?: string
  quantity: number
}

export interface Cart {
  id: string
  tenantId: string
  customerId: string | null
  sessionId: string | null
  items: CartItem[]
  createdAt: string
  updatedAt: string
}

export interface CartRepository extends TenantAwareRepository<Cart> {
  findByCustomer(tenantId: string, customerId: string): Promise<Cart | null>
  findBySession(tenantId: string, sessionId: string): Promise<Cart | null>
  clear(cartId: string): Promise<void>
}
