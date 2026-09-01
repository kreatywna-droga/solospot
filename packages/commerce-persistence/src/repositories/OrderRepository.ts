// OrderRepository.ts
// C9.1: Commerce Persistence — order repository
// G1-333 HARDEN: persistence seam for OrderProcessingEngine.

import { QueryOptions, TenantAwareRepository } from '../interfaces/Repository'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  tenantId: string
  customerId: string | null
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  total: number
  items: OrderItem[]
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface OrderRepository extends TenantAwareRepository<Order> {
  findByCustomer(tenantId: string, customerId: string, options?: QueryOptions): Promise<Order[]>
  findByStatus(tenantId: string, status: Order['status'], options?: QueryOptions): Promise<Order[]>

  /**
   * Tenant-scoped lookup by order id. Returns null if the order does not
   * exist for that tenant (cross-tenant queries are NOT permitted by this
   * method — it returns null instead of leaking the data).
   */
  findByTenantAndId(tenantId: string, id: string): Promise<Order | null>
}