// SupabaseInventoryRepository.ts
// C9.1: Commerce Persistence — Supabase inventory repository
// G1-332: Tenant-scoped + atomic reservation. Server-side filtering by
// (quantity - reserved >= n) prevents oversell under concurrent requests.
// G1-334: Stock reservation persistence, movement persistence & expiration support.

import { SupabaseRepository } from './SupabaseRepository'
import {
  Inventory,
  InventoryRepository,
  InsufficientInventoryException,
  StockReservationRecord,
  StockReservationStatus,
  StockMovementRecord,
} from '../repositories/InventoryRepository'

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

  async findByTenantAndProduct(tenantId: string, productId: string): Promise<Inventory | null> {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { data, error } = await supabase
      .from(this.getTableName())
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .maybeSingle()
    if (error) throw error
    return (data as Inventory | null) ?? null
  }

  async atomicReserve(tenantId: string, productId: string, quantity: number): Promise<Inventory> {
    if (!tenantId || !productId) {
      throw new Error(`atomicReserve requires tenantId and productId (got tenantId=${tenantId}, productId=${productId})`)
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`atomicReserve requires positive integer quantity (got ${quantity})`)
    }
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const now = new Date().toISOString()

    // Attempt RPC-based atomic reserve first (requires 0014 migration).
    const { data: rpcData, error: rpcError } = await supabase.rpc('atomic_inventory_reserve', {
      p_tenant_id: tenantId,
      p_product_id: productId,
      p_quantity: quantity,
    })
    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return {
        id: row.id,
        productId: row.product_id ?? row.productId,
        tenantId: row.tenant_id ?? row.tenantId,
        quantity: row.quantity,
        reserved: row.reserved,
        lowStockThreshold: row.low_stock_threshold ?? row.lowStockThreshold ?? 5,
        createdAt: row.created_at ?? row.createdAt,
        updatedAt: row.updated_at ?? row.updatedAt,
      }
    }

    // Fallback: optimistic concurrency via conditional update.
    // Read current state, verify availability, then update ONLY IF reserved
    // has not changed since the read — preventing oversell under concurrency.
    const { data: current, error: readErr } = await supabase
      .from(this.getTableName())
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .single()
    if (readErr || !current) {
      throw new InsufficientInventoryException(
        `Atomic reserve failed for tenant='${tenantId}', product='${productId}' (row not found)`
      )
    }
    const inv = current as Inventory
    const available = inv.quantity - inv.reserved
    if (available < quantity) {
      throw new InsufficientInventoryException(
        `Insufficient inventory for tenant='${tenantId}', product='${productId}': requested ${quantity}, available ${available}`
      )
    }
    // Conditional update: lock on the current `reserved` value to prevent
    // concurrent double-reservation.
    const { data: updated, error: updateErr } = await supabase
      .from(this.getTableName())
      .update({ reserved: inv.reserved + quantity, updatedAt: now })
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('reserved', inv.reserved)
      .select('*')
      .single()
    if (updateErr || !updated) {
      throw new InsufficientInventoryException(
        `Atomic reserve failed for tenant='${tenantId}', product='${productId}' (concurrent modification detected, retry)`
      )
    }
    return updated as Inventory
  }

  async atomicRelease(tenantId: string, productId: string, quantity: number): Promise<Inventory> {
    if (!tenantId || !productId) {
      throw new Error(`atomicRelease requires tenantId and productId (got tenantId=${tenantId}, productId=${productId})`)
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`atomicRelease requires positive integer quantity (got ${quantity})`)
    }
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const now = new Date().toISOString()

    // Attempt RPC-based atomic release first (requires 0014 migration).
    const { data: rpcData, error: rpcError } = await supabase.rpc('atomic_inventory_release', {
      p_tenant_id: tenantId,
      p_product_id: productId,
      p_quantity: quantity,
    })
    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return {
        id: row.id,
        productId: row.product_id ?? row.productId,
        tenantId: row.tenant_id ?? row.tenantId,
        quantity: row.quantity,
        reserved: row.reserved,
        lowStockThreshold: row.low_stock_threshold ?? row.lowStockThreshold ?? 5,
        createdAt: row.created_at ?? row.createdAt,
        updatedAt: row.updated_at ?? row.updatedAt,
      }
    }

    // Fallback: conditional update with optimistic concurrency.
    const { data: current, error: readErr } = await supabase
      .from(this.getTableName())
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .single()
    if (readErr || !current) {
      throw new Error(`Inventory not found for tenant='${tenantId}', product='${productId}'`)
    }
    const inv = current as Inventory
    const newReserved = Math.max(0, inv.reserved - quantity)
    const { data: updated, error: updateErr } = await supabase
      .from(this.getTableName())
      .update({ reserved: newReserved, updatedAt: now })
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('reserved', inv.reserved)
      .select('*')
      .single()
    if (updateErr || !updated) {
      throw new Error(`atomicRelease failed for tenant='${tenantId}', product='${productId}' (concurrent modification, retry)`)
    }
    return updated as Inventory
  }

  async atomicCommit(tenantId: string, productId: string, quantity: number): Promise<Inventory> {
    if (!tenantId || !productId) {
      throw new Error(`atomicCommit requires tenantId and productId (got tenantId=${tenantId}, productId=${productId})`)
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`atomicCommit requires positive integer quantity (got ${quantity})`)
    }
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const now = new Date().toISOString()

    // Attempt RPC-based atomic commit first (requires 0015 migration).
    const { data: rpcData, error: rpcError } = await supabase.rpc('atomic_inventory_commit', {
      p_tenant_id: tenantId,
      p_product_id: productId,
      p_quantity: quantity,
    })
    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
      return {
        id: row.id,
        productId: row.product_id ?? row.productId,
        tenantId: row.tenant_id ?? row.tenantId,
        quantity: row.quantity,
        reserved: row.reserved,
        lowStockThreshold: row.low_stock_threshold ?? row.lowStockThreshold ?? 5,
        createdAt: row.created_at ?? row.createdAt,
        updatedAt: row.updated_at ?? row.updatedAt,
      }
    }

    // Fallback: conditional update with optimistic concurrency.
    const { data: current, error: readErr } = await supabase
      .from(this.getTableName())
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .single()
    if (readErr || !current) {
      throw new Error(`Inventory not found for tenant='${tenantId}', product='${productId}'`)
    }
    const inv = current as Inventory
    const newQuantity = Math.max(0, inv.quantity - quantity)
    const newReserved = Math.max(0, inv.reserved - quantity)
    const { data: updated, error: updateErr } = await supabase
      .from(this.getTableName())
      .update({ quantity: newQuantity, reserved: newReserved, updatedAt: now })
      .eq('tenant_id', tenantId)
      .eq('product_id', productId)
      .eq('reserved', inv.reserved)
      .eq('quantity', inv.quantity)
      .select('*')
      .single()
    if (updateErr || !updated) {
      throw new Error(`atomicCommit failed for tenant='${tenantId}', product='${productId}' (concurrent modification, retry)`)
    }
    return updated as Inventory
  }


  // ============================================================================
  // Stock Reservations Persistence (G1-334)
  // ============================================================================

  async createReservation(reservation: StockReservationRecord): Promise<StockReservationRecord> {
    if (!reservation.tenantId) throw new Error('createReservation requires tenantId')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { data, error } = await supabase
      .from('stock_reservations')
      .insert({
        id: reservation.id,
        tenant_id: reservation.tenantId,
        product_id: reservation.productId,
        order_id: reservation.orderId,
        quantity: reservation.quantity,
        expires_at: reservation.expiresAt,
        status: reservation.status,
        created_at: reservation.createdAt,
        updated_at: reservation.updatedAt,
      })
      .select('*')
      .single()
    if (error) throw error
    return this.mapReservationRecord(data)
  }

  async updateReservationStatus(
    tenantId: string,
    reservationId: string,
    status: StockReservationStatus,
    expectedStatus?: StockReservationStatus
  ): Promise<StockReservationRecord | null> {
    if (!tenantId || !reservationId) throw new Error('updateReservationStatus requires tenantId and reservationId')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const now = new Date().toISOString()
    let query = supabase
      .from('stock_reservations')
      .update({ status, updated_at: now })
      .eq('tenant_id', tenantId)
      .eq('id', reservationId);

    if (expectedStatus) {
      query = query.eq('status', expectedStatus);
    }

    const { data, error } = await query.select('*').maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.mapReservationRecord(data);
  }

  async findReservationById(tenantId: string, reservationId: string): Promise<StockReservationRecord | null> {
    if (!tenantId || !reservationId) return null
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { data, error } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', reservationId)
      .maybeSingle()
    if (error) throw error
    return data ? this.mapReservationRecord(data) : null
  }

  async findReservationsByOrderId(tenantId: string, orderId: string): Promise<StockReservationRecord[]> {
    if (!tenantId || !orderId) return []
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { data, error } = await supabase
      .from('stock_reservations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('order_id', orderId)
    if (error) throw error
    return (data || []).map((row) => this.mapReservationRecord(row))
  }

  async findExpiredReservations(tenantId?: string, now?: string): Promise<StockReservationRecord[]> {
    const cutoff = now ?? new Date().toISOString()
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    let query = supabase
      .from('stock_reservations')
      .select('*')
      .eq('status', 'PENDING')
      .lte('expires_at', cutoff)
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data || []).map((row) => this.mapReservationRecord(row))
  }

  private mapReservationRecord(row: any): StockReservationRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id ?? row.tenantId,
      productId: row.product_id ?? row.productId,
      orderId: row.order_id ?? row.orderId,
      quantity: row.quantity,
      expiresAt: row.expires_at ?? row.expiresAt,
      status: row.status,
      createdAt: row.created_at ?? row.createdAt,
      updatedAt: row.updated_at ?? row.updatedAt,
    }
  }

  // ============================================================================
  // Stock Movements Persistence (G1-334)
  // ============================================================================

  async createMovement(movement: StockMovementRecord): Promise<StockMovementRecord> {
    if (!movement.tenantId) throw new Error('createMovement requires tenantId')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        id: movement.id,
        tenant_id: movement.tenantId,
        product_id: movement.productId,
        quantity_delta: movement.quantityDelta,
        type: movement.type,
        reason: movement.reason ?? null,
        created_at: movement.createdAt,
      })
      .select('*')
      .single()
    if (error) throw error
    return this.mapMovementRecord(data)
  }

  async listMovements(tenantId: string, productId?: string): Promise<StockMovementRecord[]> {
    if (!tenantId) return []
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(this.config.url, this.config.key)
    let query = supabase
      .from('stock_movements')
      .select('*')
      .eq('tenant_id', tenantId)
    if (productId) {
      query = query.eq('product_id', productId)
    }
    const { data, error } = await query
    if (error) throw error
    return (data || []).map((row) => this.mapMovementRecord(row))
  }

  private mapMovementRecord(row: any): StockMovementRecord {
    return {
      id: row.id,
      tenantId: row.tenant_id ?? row.tenantId,
      productId: row.product_id ?? row.productId,
      quantityDelta: row.quantity_delta ?? row.quantityDelta,
      type: row.type,
      reason: row.reason ?? undefined,
      createdAt: row.created_at ?? row.createdAt,
    }
  }
}