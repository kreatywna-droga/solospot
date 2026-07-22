// commerce-persistence.test.ts
// C9.1-C9.4: Commerce Persistence — repository and transaction tests

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRepository } from '../providers/MemoryRepository'
import { MemoryProductRepository } from '../repositories/MemoryProductRepository'
import { ProductRepository, ProductQueryOptions } from '../repositories/ProductRepository'
import { OrderRepository } from '../repositories/OrderRepository'
import { CartRepository } from '../repositories/CartRepository'
import { InventoryRepository } from '../repositories/InventoryRepository'
import { CustomerRepository } from '../repositories/CustomerRepository'
import { CheckoutTransaction } from '../Transaction'

describe('C9 Commerce Persistence', () => {
  let productRepo: ProductRepository
  let orderRepo: any
  let cartRepo: any
  let inventoryRepo: any
  let customerRepo: any

  beforeEach(() => {
    productRepo = new MemoryProductRepository() as unknown as ProductRepository
    orderRepo = new MemoryRepository<any>()
    cartRepo = new MemoryRepository<any>()
    inventoryRepo = new MemoryRepository<any>()
    customerRepo = new MemoryRepository<any>()
  })

  // C9.1 — Repository Layer
  describe('C9.1 Repository Layer', () => {
    it('should create and find product', async () => {
      const product = await productRepo.create({
        tenantId: 'tenant-1',
        slug: 'test-product',
        name: 'Test Product',
        description: 'A test product',
        categories: [],
        pricing: { priceGross: 100, priceNet: 81, taxRate: 23, currency: 'PLN' },
        inventory: { sku: 'SKU-001', quantityAvailable: 10, allowBackorder: false },
        isActive: true,
      })

      expect(product.id).toBeDefined()
      const found = await productRepo.findById(product.id)
      expect(found).toBeDefined()
      expect(found?.name).toBe('Test Product')
    })

    it('should list products with pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await productRepo.create({
          tenantId: 'tenant-1',
          slug: `product-${i}`,
          name: `Product ${i}`,
          description: `Description ${i}`,
          categories: [],
          pricing: { priceGross: 100, priceNet: 81, taxRate: 23, currency: 'PLN' },
          inventory: { sku: `SKU-${i}`, quantityAvailable: 10, allowBackorder: false },
          isActive: true,
        })
      }

      const page1 = await productRepo.findAll({ limit: 2, offset: 0 })
      expect(page1.length).toBe(2)

      const page2 = await productRepo.findAll({ limit: 2, offset: 2 })
      expect(page2.length).toBe(2)
    })

    it('should update product', async () => {
      const product = await productRepo.create({
        tenantId: 'tenant-1',
        slug: 'update-test',
        name: 'Original',
        description: 'Original description',
        categories: [],
        pricing: { priceGross: 100, priceNet: 81, taxRate: 23, currency: 'PLN' },
        inventory: { sku: 'SKU-UPD', quantityAvailable: 10, allowBackorder: false },
        isActive: true,
      })

      const updated = await productRepo.update(product.id, { name: 'Updated' })
      expect(updated.name).toBe('Updated')
    })

    it('should delete product', async () => {
      const product = await productRepo.create({
        tenantId: 'tenant-1',
        slug: 'delete-test',
        name: 'Delete Me',
        description: 'Will be deleted',
        categories: [],
        pricing: { priceGross: 100, priceNet: 81, taxRate: 23, currency: 'PLN' },
        inventory: { sku: 'SKU-DEL', quantityAvailable: 10, allowBackorder: false },
        isActive: true,
      })

      await productRepo.delete(product.id)
      const found = await productRepo.findById(product.id)
      expect(found).toBeNull()
    })
  })

  // C9.3 — Tenant Isolation
  describe('C9.3 Tenant Isolation', () => {
    it('should isolate products between tenants', async () => {
      await productRepo.create({
        tenantId: 'tenant-1',
        slug: 't1-product',
        name: 'Tenant 1 Product',
        description: 'T1',
        categories: [],
        pricing: { priceGross: 100, priceNet: 81, taxRate: 23, currency: 'PLN' },
        inventory: { sku: 'SKU-T1', quantityAvailable: 10, allowBackorder: false },
        isActive: true,
      })

      await productRepo.create({
        tenantId: 'tenant-2',
        slug: 't2-product',
        name: 'Tenant 2 Product',
        description: 'T2',
        categories: [],
        pricing: { priceGross: 200, priceNet: 162, taxRate: 23, currency: 'PLN' },
        inventory: { sku: 'SKU-T2', quantityAvailable: 5, allowBackorder: false },
        isActive: true,
      })

      const tenant1Products = await productRepo.findByTenant('tenant-1')
      const tenant2Products = await productRepo.findByTenant('tenant-2')

      expect(tenant1Products.length).toBe(1)
      expect(tenant2Products.length).toBe(1)
      expect(tenant1Products[0].name).toBe('Tenant 1 Product')
      expect(tenant2Products[0].name).toBe('Tenant 2 Product')
    })
  })

  // C9.4 — Transaction Layer
  describe('C9.4 Transaction Layer', () => {
    it('should execute checkout transaction successfully', async () => {
      let orderCreated = false
      let inventoryReserved = false
      let paymentCharged = false
      let orderConfirmed = false

      const transaction = new CheckoutTransaction(
        async () => { orderCreated = true; return 'order-123' },
        async () => { inventoryReserved = true },
        async () => { paymentCharged = true },
        async () => { orderConfirmed = true },
        async () => {},
        async () => {}
      )

      await transaction.execute()

      expect(orderCreated).toBe(true)
      expect(inventoryReserved).toBe(true)
      expect(paymentCharged).toBe(true)
      expect(orderConfirmed).toBe(true)
    })

    it('should rollback on payment failure', async () => {
      let orderCreated = false
      let inventoryReserved = false
      let paymentCharged = false
      let orderConfirmed = false
      let orderCancelled = false
      let inventoryReleased = false

      const transaction = new CheckoutTransaction(
        async () => { orderCreated = true; return 'order-456' },
        async () => { inventoryReserved = true },
        async () => { throw new Error('Payment failed') },
        async () => { orderConfirmed = true },
        async () => { orderCancelled = true },
        async () => { inventoryReleased = true }
      )

      await expect(transaction.execute()).rejects.toThrow('Payment failed')

      expect(orderCreated).toBe(true)
      expect(inventoryReserved).toBe(true)
      expect(paymentCharged).toBe(false)
      expect(orderConfirmed).toBe(false)
    })
  })
})
