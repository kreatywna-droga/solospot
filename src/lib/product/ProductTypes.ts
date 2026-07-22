export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'

export interface Product {
  id: string
  tenantId: string
  storeId: string | null
  name: string
  description: string
  price: number
  currency: string
  images: string[]
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface CreateProductRequest {
  name: string
  description?: string
  price: number
  currency?: string
  images?: string[]
  storeId?: string
  status?: ProductStatus
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  currency?: string
  images?: string[]
  storeId?: string
  status?: ProductStatus
}

export interface ProductRow {
  id: string
  tenant_id: string
  store_id: string | null
  name: string
  description: string
  price: number
  currency: string
  images: string[]
  status: string
  created_at: string
  updated_at: string
}
