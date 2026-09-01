// MemoryOrderRepository.ts
// G1-333 HARDEN: in-memory implementation of OrderRepository for tests + dev fallback.

import { MemoryRepository } from '../providers/MemoryRepository'
import { OrderRepository, Order } from './OrderRepository'

export class MemoryOrderRepository extends MemoryRepository<Order> implements OrderRepository {
  async findByCustomer(tenantId: string, customerId: string, options?: { limit?: number; offset?: number; orderBy?: string; orderDir?: 'asc' | 'desc' }): Promise<Order[]> {
    const all = await this.findAll({
      ...options,
      filters: { tenantId, customerId } as any,
    });
    return all.filter((o) => o.tenantId === tenantId && o.customerId === customerId);
  }

  async findByStatus(tenantId: string, status: Order['status'], options?: { limit?: number; offset?: number; orderBy?: string; orderDir?: 'asc' | 'desc' }): Promise<Order[]> {
    return this.findAll({
      ...options,
      filters: { tenantId, status } as any,
    });
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<Order | null> {
    if (!tenantId || !id) return null;
    const all = await this.findAll({ filters: { tenantId } as any });
    return all.find((o) => o.id === id && o.tenantId === tenantId) ?? null;
  }
}