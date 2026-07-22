// OrderRepository.ts
// C9.1: Commerce Persistence — order repository

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
  createdAt: string
  updatedAt: string
}

export interface OrderRepository extends TenantAwareRepository<Order> {
  findByCustomer(tenantId: string, customerId: string, options?: QueryOptions): Promise<Order[]>
  findByStatus(tenantId: string, status: Order['status'], options?: QueryOptions): Promise<Order[]>
}
