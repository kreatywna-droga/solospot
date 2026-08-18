import { describe, it, expect } from 'vitest';
import {
  Cart,
  CartManager,
  CartSchema,
  InsufficientInventoryException,
  ProductInactiveException,
} from './CartRuntime';
import { Product } from './ProductDomain';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-default',
    tenantId: 'tenant-test',
    slug: 'default-product',
    name: 'Default Product',
    description: 'Default Description',
    categories: ['general'],
    pricing: {
      priceGross: 10000, // 100.00 PLN
      priceNet: 8130,
      taxRate: 23,
      currency: 'PLN',
    },
    inventory: {
      sku: 'SKU-DEFAULT',
      quantityAvailable: 100,
      allowBackorder: false,
    },
    isActive: true,
    ...overrides,
  };
}

function createEmptyCart(tenantId = 'tenant-test'): Cart {
  const now = new Date().toISOString();
  return {
    id: `crt_${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    items: [],
    totals: {
      subtotalGross: 0,
      subtotalNet: 0,
      taxTotal: 0,
      discountGross: 0,
      grandTotalGross: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
}

describe('CartRuntime — CartManager Multi-Product & Edge Cases', () => {
  it('successfully adds multiple distinct products to the same cart and calculates totals accurately', () => {
    const p1 = createMockProduct({
      id: 'prod-1',
      pricing: { priceGross: 5000, priceNet: 4065, taxRate: 23, currency: 'PLN' },
    });
    const p2 = createMockProduct({
      id: 'prod-2',
      pricing: { priceGross: 12000, priceNet: 9756, taxRate: 23, currency: 'PLN' },
    });

    let cart = createEmptyCart();
    cart = CartManager.addItem(cart, p1, 2); // 2 * 5000 = 10000
    expect(cart.items).toHaveLength(1);
    expect(cart.totals.subtotalGross).toBe(10000);

    // Add second distinct product — previously crashed here!
    cart = CartManager.addItem(cart, p2, 1); // 1 * 12000 = 12000
    expect(cart.items).toHaveLength(2);
    expect(cart.items[0].productId).toBe('prod-1');
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.items[1].productId).toBe('prod-2');
    expect(cart.items[1].quantity).toBe(1);

    // Total subtotal: 10000 + 12000 = 22000
    expect(cart.totals.subtotalGross).toBe(22000);
    expect(cart.totals.grandTotalGross).toBe(22000);
    expect(cart.totals.taxTotal).toBeGreaterThan(0);
    expect(CartSchema.safeParse(cart).success).toBe(true);
  });

  it('correctly recalculates totals with SAVE10 coupon across multiple products', () => {
    const p1 = createMockProduct({
      id: 'p1',
      pricing: { priceGross: 10000, priceNet: 8130, taxRate: 23, currency: 'PLN' },
    });
    const p2 = createMockProduct({
      id: 'p2',
      pricing: { priceGross: 20000, priceNet: 16260, taxRate: 23, currency: 'PLN' },
    });

    let cart = createEmptyCart();
    cart = CartManager.addItem(cart, p1, 1);
    cart = CartManager.addItem(cart, p2, 1);
    expect(cart.totals.subtotalGross).toBe(30000);

    cart.couponCode = 'SAVE10';
    const recalculated = CartManager.recalculate(cart);
    expect(recalculated.totals.subtotalGross).toBe(30000);
    expect(recalculated.totals.discountGross).toBe(3000); // 10% of 30000
    expect(recalculated.totals.grandTotalGross).toBe(27000); // 30000 - 3000
  });

  it('updates item quantity and adjusts totals or removes item when quantity is 0', () => {
    const p1 = createMockProduct({
      id: 'p1',
      pricing: { priceGross: 4000, priceNet: 3252, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'SKU-1', quantityAvailable: 10, allowBackorder: false },
    });
    const p2 = createMockProduct({
      id: 'p2',
      pricing: { priceGross: 6000, priceNet: 4878, taxRate: 23, currency: 'PLN' },
    });

    let cart = createEmptyCart();
    cart = CartManager.addItem(cart, p1, 2); // 8000
    cart = CartManager.addItem(cart, p2, 1); // 6000
    expect(cart.totals.subtotalGross).toBe(14000);

    // Update quantity of p1 from 2 to 3
    cart = CartManager.updateQuantity(cart, 'p1', 3, p1);
    expect(cart.items.find((i) => i.productId === 'p1')?.quantity).toBe(3);
    expect(cart.totals.subtotalGross).toBe(18000); // 3*4000 + 1*6000

    // Update quantity to 0 -> removes item
    cart = CartManager.updateQuantity(cart, 'p1', 0);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p2');
    expect(cart.totals.subtotalGross).toBe(6000);
  });

  it('removes item via removeItem and updates totals', () => {
    const p1 = createMockProduct({ id: 'p1', pricing: { priceGross: 5000, priceNet: 4065, taxRate: 23, currency: 'PLN' } });
    const p2 = createMockProduct({ id: 'p2', pricing: { priceGross: 7000, priceNet: 5691, taxRate: 23, currency: 'PLN' } });

    let cart = createEmptyCart();
    cart = CartManager.addItem(cart, p1, 1);
    cart = CartManager.addItem(cart, p2, 1);
    expect(cart.items).toHaveLength(2);
    expect(cart.totals.subtotalGross).toBe(12000);

    cart = CartManager.removeItem(cart, 'p1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p2');
    expect(cart.totals.subtotalGross).toBe(7000);
  });

  it('throws InsufficientInventoryException when requested quantity exceeds available stock', () => {
    const p1 = createMockProduct({
      id: 'p1',
      inventory: { sku: 'SKU-1', quantityAvailable: 2, allowBackorder: false },
    });

    const cart = createEmptyCart();
    expect(() => CartManager.addItem(cart, p1, 3)).toThrow(InsufficientInventoryException);
  });

  it('throws ProductInactiveException when trying to add an inactive product', () => {
    const p1 = createMockProduct({
      id: 'p1',
      isActive: false,
    });

    const cart = createEmptyCart();
    expect(() => CartManager.addItem(cart, p1, 1)).toThrow(ProductInactiveException);
  });

  it('throws Error if adding non-positive quantity', () => {
    const p1 = createMockProduct({ id: 'p1' });
    const cart = createEmptyCart();
    expect(() => CartManager.addItem(cart, p1, 0)).toThrow(/positive integer/);
    expect(() => CartManager.addItem(cart, p1, -1)).toThrow(/positive integer/);
  });
});
