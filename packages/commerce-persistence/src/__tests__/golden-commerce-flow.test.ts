// golden-commerce-flow.test.ts
// C9.6: Commerce Persistence — golden commerce flow end-to-end

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryRepository } from '../providers/MemoryRepository'
import { MemoryProductRepository } from '../repositories/MemoryProductRepository'
import { ProductRepository } from '../repositories/ProductRepository'
import { OrderRepository, Order } from '../repositories/OrderRepository'
import { CartRepository, Cart } from '../repositories/CartRepository'
import { InventoryRepository, Inventory } from '../repositories/InventoryRepository'
import { MemoryInventoryRepository } from '../repositories/MemoryInventoryRepository'
import { CustomerRepository, Customer } from '../repositories/CustomerRepository'
import { CheckoutTransaction } from '../Transaction'
import { CommerceDataResolver } from '../CommerceDataResolver'

function makeProduct(over: Partial<any> = {}) {
  return {
    tenantId: 'tenant-1',
    slug: 'widget',
    name: 'Widget',
    description: 'A useful widget',
    categories: ['cat-1'],
    pricing: { priceGross: 100, priceNet: 81, taxRate: 23, currency: 'PLN' },
    inventory: { sku: 'SKU-W', quantityAvailable: 10, allowBackorder: false },
    isActive: true,
    ...over,
  }
}

describe('C9 Golden Commerce Flow', () => {
  let productRepo: ProductRepository
  let orderRepo: any
  let cartRepo: any
  let inventoryRepo: InventoryRepository
  let customerRepo: any
  let resolver: CommerceDataResolver

  const TENANT = 'tenant-1'

  beforeEach(async () => {
    productRepo = new MemoryProductRepository() as unknown as ProductRepository
    orderRepo = new MemoryRepository<any>()
    cartRepo = new MemoryRepository<any>()
    inventoryRepo = new MemoryInventoryRepository() as unknown as InventoryRepository
    customerRepo = new MemoryRepository<any>()
    resolver = new CommerceDataResolver(productRepo)

    await productRepo.create(makeProduct())
    await inventoryRepo.create({
      id: 'prod-1', productId: 'prod-1', quantity: 10, reserved: 0,
    } as any)
  })

  it('C9.1 repository CRUD + findByTenant', async () => {
    const p = await productRepo.create(makeProduct({ slug: 'second' }))
    expect(p.id).toBeDefined()
    const all = await productRepo.findByTenant(TENANT)
    expect(all.length).toBe(2)
  })

  it('C9.2 inventory reservation + release', async () => {
    await inventoryRepo.reserve('prod-1', 3)
    let inv = await inventoryRepo.findById('prod-1') as Inventory
    expect(inv.reserved).toBe(3)
    expect(inv.quantity - inv.reserved).toBe(7)

    await inventoryRepo.release('prod-1', 3)
    inv = await inventoryRepo.findById('prod-1') as Inventory
    expect(inv.reserved).toBe(0)
  })

  it('C9.3 tenant isolation — product from tenant-2 invisible to tenant-1', async () => {
    await productRepo.create(makeProduct({ tenantId: 'tenant-2', slug: 'other' }))
    const t1 = await productRepo.findByTenant('tenant-1')
    const t2 = await productRepo.findByTenant('tenant-2')
    expect(t1.every(p => p.tenantId === 'tenant-1')).toBe(true)
    expect(t2.every(p => p.tenantId === 'tenant-2')).toBe(true)
  })

  it('C9.4 checkout transaction commits order on success', async () => {
    let orderId = ''
    const tx = new CheckoutTransaction(
      async () => { const o = await orderRepo.create({ tenantId: TENANT, customerId: null, status: 'pending', total: 100, items: [] }); orderId = o.id; return o.id },
      async () => { await inventoryRepo.reserve('prod-1', 2) },
      async () => { await orderRepo.update(orderId, { status: 'paid' }) },
      async () => { await orderRepo.update(orderId, { status: 'completed' }) },
      async () => { await orderRepo.update(orderId, { status: 'cancelled' }) },
      async () => { await inventoryRepo.release('prod-1', 2) },
    )
    await tx.execute()
    const order = await orderRepo.findById(orderId) as Order
    const inv = await inventoryRepo.findById('prod-1') as Inventory
    expect(order.status).toBe('completed')
    expect(inv.reserved).toBe(2)
  })

  it('C9.4 checkout transaction rolls back on payment failure', async () => {
    let orderId = ''
    const tx = new CheckoutTransaction(
      async () => { const o = await orderRepo.create({ tenantId: TENANT, customerId: null, status: 'pending', total: 100, items: [] }); orderId = o.id; return o.id },
      async () => { await inventoryRepo.reserve('prod-1', 2) },
      async () => { throw new Error('Payment declined') },
      async () => { await orderRepo.update(orderId, { status: 'completed' }) },
      async () => { await orderRepo.update(orderId, { status: 'cancelled' }) },
      async () => { await inventoryRepo.release('prod-1', 2) },
    )
    await expect(tx.execute()).rejects.toThrow('Payment declined')
    const order = await orderRepo.findById(orderId) as Order
    const inv = await inventoryRepo.findById('prod-1') as Inventory
    expect(order.status).toBe('cancelled')
    expect(inv.reserved).toBe(0)
  })

  it('C9.5 commerce data resolver exposes products to runtime', async () => {
    const provider = await resolver.resolve(TENANT)
    expect(provider.getProducts().length).toBe(1)
    expect(provider.getProduct('widget')?.name).toBe('Widget')
    expect(provider.getByCategory('cat-1').length).toBe(1)
  })

  it('C9.6 full flow: customer adds to cart then checkout', async () => {
    const customer = await customerRepo.create({ tenantId: TENANT, email: 'c@x.io', name: 'Cust', metadata: {} }) as Customer
    const cart = await cartRepo.create({ tenantId: TENANT, customerId: customer.id, sessionId: null, items: [{ productId: 'prod-1', quantity: 1 }] }) as Cart

    expect(cart.items.length).toBe(1)

    let orderId = ''
    const tx = new CheckoutTransaction(
      async () => { const o = await orderRepo.create({ tenantId: TENANT, customerId: customer.id, status: 'pending', total: 100, items: [] }); orderId = o.id; return o.id },
      async () => { await inventoryRepo.reserve('prod-1', 1) },
      async () => { await orderRepo.update(orderId, { status: 'paid' }) },
      async () => { await orderRepo.update(orderId, { status: 'completed' }) },
      async () => { await orderRepo.update(orderId, { status: 'cancelled' }) },
      async () => { await inventoryRepo.release('prod-1', 1) },
    )
    await tx.execute()

    const order = await orderRepo.findById(orderId) as Order
    const inv = await inventoryRepo.findById('prod-1') as Inventory
    expect(order.status).toBe('completed')
    expect(inv.reserved).toBe(1)
  })
})
