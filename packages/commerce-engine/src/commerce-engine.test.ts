import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { CommerceEngine, TenantSecurityException } from './CommerceEngine';
import { Product } from './ProductDomain';
import { InsufficientInventoryException, ProductInactiveException } from './CartRuntime';
import { InvalidOrderStateException } from './CheckoutFlow';

describe('Commerce Engine', () => {
  let engine: CommerceEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    engine = new CommerceEngine({ eventBus, logger });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should successfully create products, add to cart, compute pricing and complete checkout flow', async () => {
    const tenantId = 'tenant-shop-1';

    // 1. Create Product
    const product = await engine.createProduct(tenantId, {
      id: 'prod-item-1',
      slug: 'awesome-mug',
      name: 'Awesome Mug',
      description: 'Coffee tastes better in this.',
      categories: ['mugs'],
      pricing: {
        priceGross: 5000, // 50.00 PLN
        priceNet: 4065,
        taxRate: 23,
        currency: 'PLN',
      },
      inventory: {
        sku: 'MUG-001',
        quantityAvailable: 10,
        allowBackorder: false,
      },
      isActive: true,
    });

    expect(product.tenantId).toBe(tenantId);
    expect(product.pricing.priceGross).toBe(5000);

    // 2. Create Cart
    let cart = await engine.createCart(tenantId);
    expect(cart.tenantId).toBe(tenantId);
    expect(cart.items).toHaveLength(0);

    // 3. Add Item to Cart (qty 2)
    cart = await engine.addItemToCart(tenantId, cart, product, 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('prod-item-1');
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.totals.subtotalGross).toBe(10000); // 2 * 5000

    // Apply promo code (SAVE10 gives 10% off subtotalGross)
    cart.couponCode = 'SAVE10';
    const productsMap = new Map<string, Product>([[product.id, product]]);
    const recalculatedCart = engine['addItemToCart'] // Check logic recalculate
    const finalCart = await engine.addItemToCart(tenantId, cart, product, 1); // 2 + 1 = 3 qty
    expect(finalCart.items[0].quantity).toBe(3);
    expect(finalCart.totals.subtotalGross).toBe(15000); // 3 * 5000
    expect(finalCart.totals.discountGross).toBe(1500); // 10% of 15000
    expect(finalCart.totals.grandTotalGross).toBe(13500); // 15000 - 1500

    // 4. Checkout
    const shippingAddress = {
      fullName: 'Jan Kowalski',
      street: 'Wiejska 1',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'Poland',
    };

    let order = await engine.checkoutCart(tenantId, finalCart, shippingAddress);
    expect(order.tenantId).toBe(tenantId);
    expect(order.status).toBe('PENDING_PAYMENT');
    expect(order.totals.grandTotalGross).toBe(13500);

    // 5. Confirm Payment
    order = await engine.confirmOrderPayment(tenantId, order, 'pi_stripe_12345');
    expect(order.status).toBe('PAID');
    expect(order.paymentIntentId).toBe('pi_stripe_12345');

    // 6. Fulfill Order
    order = await engine.fulfillOrder(tenantId, order);
    expect(order.status).toBe('FULFILLED');
  });

  it('Should throw TenantSecurityException if trying to mix objects or operations of different tenants (RLS)', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';

    const productA = await engine.createProduct(tenantA, {
      id: 'prod-a',
      slug: 'product-a',
      name: 'Product A',
      description: 'Owner is Tenant A',
      categories: [],
      pricing: { priceGross: 1000, priceNet: 813, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'SKU-A', quantityAvailable: 5, allowBackorder: false },
      isActive: true,
    });

    const cartB = await engine.createCart(tenantB);

    // Act & Assert: Try to add Tenant A's product to Tenant B's cart within Tenant B context
    await expect(
      engine.addItemToCart(tenantB, cartB, productA, 1)
    ).rejects.toThrow(TenantSecurityException);

    // Try to add Tenant A's product to Tenant B's cart within Tenant A context
    await expect(
      engine.addItemToCart(tenantA, cartB, productA, 1)
    ).rejects.toThrow(TenantSecurityException);
  });

  it('Should throw InsufficientInventoryException if adding more item quantity than available', async () => {
    const tenantId = 'tenant-shop-1';

    const product = await engine.createProduct(tenantId, {
      id: 'prod-item-1',
      slug: 'awesome-mug',
      name: 'Awesome Mug',
      description: 'Coffee tastes better in this.',
      categories: ['mugs'],
      pricing: { priceGross: 5000, priceNet: 4065, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'MUG-001', quantityAvailable: 3, allowBackorder: false }, // only 3 available
      isActive: true,
    });

    const cart = await engine.createCart(tenantId);

    await expect(
      engine.addItemToCart(tenantId, cart, product, 4) // requesting 4
    ).rejects.toThrow(InsufficientInventoryException);
  });

  it('Should throw ProductInactiveException if trying to purchase an inactive product', async () => {
    const tenantId = 'tenant-shop-1';

    const product = await engine.createProduct(tenantId, {
      id: 'prod-item-1',
      slug: 'awesome-mug',
      name: 'Awesome Mug',
      description: 'Coffee tastes better in this.',
      categories: ['mugs'],
      pricing: { priceGross: 5000, priceNet: 4065, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'MUG-001', quantityAvailable: 10, allowBackorder: false },
      isActive: false, // inactive!
    });

    const cart = await engine.createCart(tenantId);

    await expect(
      engine.addItemToCart(tenantId, cart, product, 1)
    ).rejects.toThrow(ProductInactiveException);
  });

  it('Should prevent invalid order transitions', async () => {
    const tenantId = 'tenant-shop-1';
    const product = await engine.createProduct(tenantId, {
      id: 'prod-item-1',
      slug: 'awesome-mug',
      name: 'Awesome Mug',
      description: 'Coffee tastes better in this.',
      categories: ['mugs'],
      pricing: { priceGross: 5000, priceNet: 4065, taxRate: 23, currency: 'PLN' },
      inventory: { sku: 'MUG-001', quantityAvailable: 10, allowBackorder: false },
      isActive: true,
    });

    let cart = await engine.createCart(tenantId);
    cart = await engine.addItemToCart(tenantId, cart, product, 1);

    const shippingAddress = {
      fullName: 'Jan Kowalski',
      street: 'Wiejska 1',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'Poland',
    };

    let order = await engine.checkoutCart(tenantId, cart, shippingAddress);

    // Try to fulfill unpaid order -> should throw
    await expect(
      engine.fulfillOrder(tenantId, order)
    ).rejects.toThrow(InvalidOrderStateException);

    // Confirm payment
    order = await engine.confirmOrderPayment(tenantId, order, 'pi_123');

    // Confirm payment again -> should throw
    await expect(
      engine.confirmOrderPayment(tenantId, order, 'pi_123')
    ).rejects.toThrow(InvalidOrderStateException);
  });
});
