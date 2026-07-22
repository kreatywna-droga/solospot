// schema.ts
// C9.2: Commerce Persistence — typed row shapes matching Supabase schema

export interface ProductRow {
  id: string
  tenant_id: string
  slug: string
  name: string
  description: string | null
  categories: string[]
  pricing: {
    priceGross: number
    priceNet: number
    taxRate: number
    currency: string
  }
  inventory: {
    sku: string
    quantityAvailable: number
    allowBackorder: boolean
  }
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VariantRow {
  id: string
  product_id: string
  sku: string
  price: number
  inventory: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CustomerRow {
  id: string
  tenant_id: string
  email: string
  name: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface CartRow {
  id: string
  tenant_id: string
  customer_id: string | null
  session_id: string | null
  items: CartItemRow[]
  created_at: string
  updated_at: string
}

export interface CartItemRow {
  product_id: string
  variant_id?: string
  quantity: number
}

export interface OrderRow {
  id: string
  tenant_id: string
  customer_id: string | null
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  total: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  price: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface InventoryRow {
  product_id: string
  quantity: number
  reserved: number
  created_at: string
  updated_at: string
}
