import { getServiceSupabase } from '@/lib/supabase'
import type { Product, ProductRow, CreateProductRequest, UpdateProductRequest } from './ProductTypes'

export class ProductRepository {
  private readonly table = 'products'

  async getProductsByTenant(tenantId: string): Promise<Product[]> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`ProductRepository.getProductsByTenant failed: ${error.message}`)
    }

    return (data || []).map((row) => this.mapProduct(row))
  }

  async getProductsByStore(tenantId: string, storeId: string): Promise<Product[]> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`ProductRepository.getProductsByStore failed: ${error.message}`)
    }

    return (data || []).map((row) => this.mapProduct(row))
  }

  async getProduct(id: string, tenantId: string): Promise<Product | null> {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .maybeSingle()

    if (error) {
      throw new Error(`ProductRepository.getProduct failed: ${error.message}`)
    }

    if (!data) return null
    return this.mapProduct(data)
  }

  async createProduct(tenantId: string, req: CreateProductRequest): Promise<Product> {
    const supabase = getServiceSupabase()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from(this.table)
      .insert({
        tenant_id: tenantId,
        store_id: req.storeId || null,
        name: req.name.trim(),
        description: req.description?.trim() || '',
        price: req.price,
        currency: req.currency || 'PLN',
        images: req.images || [],
        status: req.status || 'DRAFT',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`ProductRepository.createProduct failed: ${error.message}`)
    }

    return this.mapProduct(data)
  }

  async updateProduct(id: string, tenantId: string, req: UpdateProductRequest): Promise<Product> {
    const supabase = getServiceSupabase()
    const now = new Date().toISOString()

    const updates: Record<string, unknown> = { updated_at: now }
    if (req.name !== undefined) updates.name = req.name.trim()
    if (req.description !== undefined) updates.description = req.description.trim()
    if (req.price !== undefined) updates.price = req.price
    if (req.currency !== undefined) updates.currency = req.currency
    if (req.images !== undefined) updates.images = req.images
    if (req.storeId !== undefined) updates.store_id = req.storeId || null
    if (req.status !== undefined) updates.status = req.status

    const { data, error } = await supabase
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(`ProductRepository.updateProduct failed: ${error.message}`)
    }

    return this.mapProduct(data)
  }

  async deleteProduct(id: string, tenantId: string): Promise<void> {
    const supabase = getServiceSupabase()
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(`ProductRepository.deleteProduct failed: ${error.message}`)
    }
  }

  private mapProduct(row: ProductRow): Product {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      storeId: row.store_id,
      name: row.name,
      description: row.description,
      price: row.price,
      currency: row.currency,
      images: row.images || [],
      status: row.status as Product['status'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
