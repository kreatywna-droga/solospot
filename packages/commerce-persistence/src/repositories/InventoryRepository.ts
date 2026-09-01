// InventoryRepository.ts
// C9.1: Commerce Persistence — inventory repository
// G1-332: Tenant-scoped + atomic reservation support.

import { Repository } from '../interfaces/Repository'

export interface Inventory {
  id: string
  productId: string
  tenantId: string
  quantity: number
  reserved: number
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
}

export interface InventoryRepository extends Repository<Inventory> {
  /**
   * Backward-compatible logical reservation. Performs a non-atomic read-then-write.
   * Prefer {@link atomicReserve} when running against a shared persistent store.
   */
  reserve(productId: string, quantity: number): Promise<Inventory>

  /**
   * Backward-compatible logical release. Performs a non-atomic read-then-write.
   */
  release(productId: string, quantity: number): Promise<Inventory>

  /**
   * Adjust the total quantity (e.g. stock receipt, manual correction).
   */
  adjust(productId: string, quantity: number): Promise<Inventory>

  /**
   * Tenant-scoped lookup. Returns null if the product does not exist for that tenant.
   */
  findByTenantAndProduct(tenantId: string, productId: string): Promise<Inventory | null>

  /**
   * Tenant-scoped atomic reservation.
   *
   * The implementation MUST be safe against concurrent callers: if the available
   * quantity (quantity - reserved) is less than {@code quantity} for the given
   * tenant+product pair, this MUST reject without mutating state.
   *
   * Implementations against Supabase achieve this via an UPDATE filtered by
   * `quantity - reserved >= quantity`. Memory implementations achieve this by
   * acquiring a single-process lock around read+write.
   *
   * Returns the post-reserve row, or throws `InsufficientInventoryException`.
   */
  atomicReserve(tenantId: string, productId: string, quantity: number): Promise<Inventory>

  /**
   * Tenant-scoped atomic release of a previously-reserved quantity.
   */
  atomicRelease(tenantId: string, productId: string, quantity: number): Promise<Inventory>
}

export class InsufficientInventoryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientInventoryException';
  }
}