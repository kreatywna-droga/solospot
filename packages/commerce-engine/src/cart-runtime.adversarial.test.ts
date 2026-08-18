import { describe, it, expect } from 'vitest';
import {
  Cart,
  CartManager,
  CartSchema,
  InsufficientInventoryException,
  ProductInactiveException,
} from './CartRuntime';
import { Product } from './ProductDomain';

function createMockProduct(id: string, gross: number, taxRate: number, stock = 100, active = true): Product {
  const taxDec = taxRate / 100;
  const net = Math.round(gross / (1 + taxDec));
  return {
    id,
    tenantId: 'tenant-adv',
    slug: `slug-${id}`,
    name: `Product ${id}`,
    description: `Desc ${id}`,
    categories: ['adv'],
    pricing: {
      priceGross: gross,
      priceNet: net,
      taxRate,
      currency: 'PLN',
    },
    inventory: {
      sku: `SKU-${id}`,
      quantityAvailable: stock,
      allowBackorder: false,
    },
    isActive: active,
  };
}

function createEmptyCart(): Cart {
  const now = new Date().toISOString();
  return {
    id: `crt_${Math.random().toString(36).substr(2, 9)}`,
    tenantId: 'tenant-adv',
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

describe('CartRuntime — Adversarial & Chaos Verification', () => {
  it('ADV-01: Interleaved additions and removals with diverse tax rates (0%, 5%, 8%, 23%) preserve exact mathematical parity', () => {
    const pZeroTax = createMockProduct('p-0', 1000, 0);   // 10.00 PLN (0% VAT -> net 1000, tax 0)
    const pFiveTax = createMockProduct('p-5', 2100, 5);   // 21.00 PLN (5% VAT -> net 2000, tax 100)
    const pEightTax = createMockProduct('p-8', 1080, 8);  // 10.80 PLN (8% VAT -> net 1000, tax 80)
    const pStdTax = createMockProduct('p-23', 1230, 23);  // 12.30 PLN (23% VAT -> net 1000, tax 230)

    let cart = createEmptyCart();
    cart = CartManager.addItem(cart, pZeroTax, 3); // 3000 gross, 3000 net, 0 tax
    cart = CartManager.addItem(cart, pFiveTax, 2); // 4200 gross, 4000 net, 200 tax
    cart = CartManager.addItem(cart, pEightTax, 4); // 4320 gross, 4000 net, 320 tax
    cart = CartManager.addItem(cart, pStdTax, 1); // 1230 gross, 1000 net, 230 tax

    expect(cart.items).toHaveLength(4);
    expect(cart.totals.subtotalGross).toBe(3000 + 4200 + 4320 + 1230); // 12750
    expect(cart.totals.subtotalNet).toBe(3000 + 4000 + 4000 + 1000); // 12000
    expect(cart.totals.taxTotal).toBe(0 + 200 + 320 + 230); // 750
    expect(cart.totals.grandTotalGross).toBe(12750);
    expect(CartSchema.safeParse(cart).success).toBe(true);

    // Remove 5% product and recalculate
    cart = CartManager.removeItem(cart, 'p-5');
    expect(cart.items).toHaveLength(3);
    expect(cart.totals.subtotalGross).toBe(12750 - 4200); // 8550
    expect(CartSchema.safeParse(cart).success).toBe(true);
  });

  it('ADV-02: Repeated additions of same product strictly accumulate quantity and validate inventory limits', () => {
    const pLimited = createMockProduct('p-lim', 500, 23, 5); // max 5 stock
    let cart = createEmptyCart();

    cart = CartManager.addItem(cart, pLimited, 2);
    expect(cart.items[0].quantity).toBe(2);

    cart = CartManager.addItem(cart, pLimited, 2);
    expect(cart.items[0].quantity).toBe(4);

    cart = CartManager.addItem(cart, pLimited, 1);
    expect(cart.items[0].quantity).toBe(5);

    // Adding 1 more exceeds available 5 -> throws InsufficientInventoryException
    expect(() => CartManager.addItem(cart, pLimited, 1)).toThrow(InsufficientInventoryException);
    // Cart remains unaffected and valid
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.totals.subtotalGross).toBe(2500);
  });

  it('ADV-03: Updating quantity to negative or zero safely removes item and recalculates', () => {
    const p1 = createMockProduct('p1', 1000, 23);
    const p2 = createMockProduct('p2', 2000, 23);

    let cart = createEmptyCart();
    cart = CartManager.addItem(cart, p1, 2);
    cart = CartManager.addItem(cart, p2, 1);

    // Update p1 to 0
    cart = CartManager.updateQuantity(cart, 'p1', 0);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p2');
    expect(cart.totals.subtotalGross).toBe(2000);

    // Update p2 to negative (-5)
    cart = CartManager.updateQuantity(cart, 'p2', -5);
    expect(cart.items).toHaveLength(0);
    expect(cart.totals.subtotalGross).toBe(0);
    expect(cart.totals.grandTotalGross).toBe(0);
  });

  it('ADV-04: Recalculate on empty cart produces clean zeroed state without errors', () => {
    const cart = createEmptyCart();
    const recalculated = CartManager.recalculate(cart);
    expect(recalculated.items).toHaveLength(0);
    expect(recalculated.totals.subtotalGross).toBe(0);
    expect(recalculated.totals.subtotalNet).toBe(0);
    expect(recalculated.totals.taxTotal).toBe(0);
    expect(recalculated.totals.grandTotalGross).toBe(0);
    expect(CartSchema.safeParse(recalculated).success).toBe(true);
  });

  it('ADV-05: Fallback recalculation when products map is undefined uses existing pricing metadata safely', () => {
    const p1 = createMockProduct('p1', 3500, 23);
    let cart = createEmptyCart();
    cart = CartManager.addItem(cart, p1, 2);

    // Call recalculate with NO products map
    const res = CartManager.recalculate(cart);
    expect(res.totals.subtotalGross).toBe(7000);
    expect(res.totals.grandTotalGross).toBe(7000);
    expect(CartSchema.safeParse(res).success).toBe(true);
  });

  it('ADV-06: Attempting to update non-existent product in cart throws clear error', () => {
    const cart = createEmptyCart();
    expect(() => CartManager.updateQuantity(cart, 'non-existent', 5)).toThrow(/not found in cart/);
  });
});
