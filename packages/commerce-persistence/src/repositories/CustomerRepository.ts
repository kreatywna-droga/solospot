// CustomerRepository.ts
// C9.1: Commerce Persistence — customer repository

import { QueryOptions, TenantAwareRepository } from '../interfaces/Repository'

export interface Customer {
  id: string
  tenantId: string
  email: string
  name: string
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface CustomerRepository extends TenantAwareRepository<Customer> {
  findByEmail(tenantId: string, email: string): Promise<Customer | null>
}
