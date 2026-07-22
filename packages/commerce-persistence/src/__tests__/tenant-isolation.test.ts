// tenant-isolation.test.ts
// C9.3: Commerce Persistence — tenant isolation at repository layer

import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryProductRepository } from '../repositories/MemoryProductRepository'
import { ProductRepository } from '../repositories/ProductRepository'

describe('C9.3 Tenant Isolation', () => {
  let repo: ProductRepository

  beforeEach(() => {
    repo = new MemoryProductRepository() as unknown as ProductRepository
  })

  it('should not leak products across tenants via findByTenant', async () => {
    await repo.create({
      tenantId: 'tenant-a', slug: 'a-1', name: 'A Product', description: '',
      categories: [], pricing: { priceGross: 10, priceNet: 8, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'A', quantityAvailable: 1, allowBackorder: false }, isActive: true,
    })
    await repo.create({
      tenantId: 'tenant-b', slug: 'b-1', name: 'B Product', description: '',
      categories: [], pricing: { priceGross: 20, priceNet: 16, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'B', quantityAvailable: 1, allowBackorder: false }, isActive: true,
    })

    const a = await repo.findByTenant('tenant-a')
    const b = await repo.findByTenant('tenant-b')

    expect(a).toHaveLength(1)
    expect(b).toHaveLength(1)
    expect(a[0].tenantId).toBe('tenant-a')
    expect(b[0].tenantId).toBe('tenant-b')
    expect(a[0].id).not.toBe(b[0].id)
  })

  it('should scope findBySlug to tenant', async () => {
    await repo.create({
      tenantId: 'tenant-a', slug: 'dup', name: 'A dup', description: '',
      categories: [], pricing: { priceGross: 10, priceNet: 8, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'A', quantityAvailable: 1, allowBackorder: false }, isActive: true,
    })
    await repo.create({
      tenantId: 'tenant-b', slug: 'dup', name: 'B dup', description: '',
      categories: [], pricing: { priceGross: 20, priceNet: 16, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'B', quantityAvailable: 1, allowBackorder: false }, isActive: true,
    })

    const aMatch = await (repo as any).findBySlug('tenant-a', 'dup')
    const bMatch = await (repo as any).findBySlug('tenant-b', 'dup')

    expect(aMatch.name).toBe('A dup')
    expect(bMatch.name).toBe('B dup')
  })

  it('should apply tenant filter in findAll with filters', async () => {
    await repo.create({
      tenantId: 'tenant-a', slug: 'a-active', name: 'A Active', description: '',
      categories: [], pricing: { priceGross: 10, priceNet: 8, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'A', quantityAvailable: 1, allowBackorder: false }, isActive: true,
    })
    await repo.create({
      tenantId: 'tenant-b', slug: 'b-active', name: 'B Active', description: '',
      categories: [], pricing: { priceGross: 20, priceNet: 16, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'B', quantityAvailable: 1, allowBackorder: false }, isActive: false,
    })

    const aActive = await repo.findAll({
      filters: { tenantId: 'tenant-a', isActive: true },
    })
    const bInactive = await repo.findAll({
      filters: { tenantId: 'tenant-b', isActive: false },
    })

    expect(aActive.every(p => p.tenantId === 'tenant-a')).toBe(true)
    expect(bInactive.every(p => p.tenantId === 'tenant-b')).toBe(true)
  })
})
