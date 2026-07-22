import { ProductRepository } from './ProductRepository'
import type { Product, CreateProductRequest, UpdateProductRequest } from './ProductTypes'
import { validateCreateProduct, validateUpdateProduct } from './ProductValidator'

export class ProductService {
  private readonly repo: ProductRepository

  constructor() {
    this.repo = new ProductRepository()
  }

  async listProducts(tenantId: string): Promise<Product[]> {
    if (!tenantId) throw new Error('Tenant ID is required')
    return this.repo.getProductsByTenant(tenantId)
  }

  async getProduct(tenantId: string, productId: string): Promise<Product> {
    if (!tenantId) throw new Error('Tenant ID is required')
    const product = await this.repo.getProduct(productId, tenantId)
    if (!product) throw new Error('Product not found')
    return product
  }

  async createProduct(tenantId: string, req: CreateProductRequest): Promise<Product> {
    if (!tenantId) throw new Error('Tenant ID is required')

    const validation = validateCreateProduct(req)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    return this.repo.createProduct(tenantId, {
      ...req,
      name: req.name.trim(),
    })
  }

  async updateProduct(tenantId: string, productId: string, req: UpdateProductRequest): Promise<Product> {
    if (!tenantId) throw new Error('Tenant ID is required')

    const validation = validateUpdateProduct(req)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    return this.repo.updateProduct(productId, tenantId, req)
  }

  async deleteProduct(tenantId: string, productId: string): Promise<void> {
    if (!tenantId) throw new Error('Tenant ID is required')

    const product = await this.repo.getProduct(productId, tenantId)
    if (!product) throw new Error('Product not found')

    await this.repo.deleteProduct(productId, tenantId)
  }
}
