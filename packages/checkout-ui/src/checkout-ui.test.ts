import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import {
  CheckoutRuntime,
  CheckoutAdapterPort,
} from './CheckoutRuntime';
import {
  CartSummary,
  ShippingMethod,
  PaymentMethodInfo,
  CheckoutContext,
  IllegalCheckoutStateTransitionException,
  TenantScopeViolationException,
  ALLOWED_TRANSITIONS,
} from './CheckoutContext';
import {
  CartSummaryComponent,
  ShippingSelectorComponent,
  ConfirmationViewComponent,
  renderWithErrorBoundary,
} from './CheckoutComponents';

describe('Checkout UI', () => {
  let runtime: CheckoutRuntime;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  // ── Mock Data ────────────────────────────────────────────────────────────

  const mockCart: CartSummary = {
    cartId: 'cart-001',
    tenantId: 'tenant-shop-a',
    items: [
      { productId: 'prod-1', name: 'Nike Air Max', quantity: 2, unitPriceCents: 34900, currency: 'PLN' },
    ],
    totalCents: 69800,
    currency: 'PLN',
  };

  const mockShippingMethods: ShippingMethod[] = [
    { id: 'inpost-1', provider: 'InPost', name: 'InPost Paczkomat', priceCents: 1299, currency: 'PLN', estimatedDays: 2 },
    { id: 'dhl-1', provider: 'DHL', name: 'DHL Express', priceCents: 2499, currency: 'PLN', estimatedDays: 1 },
  ];

  const mockPaymentMethods: PaymentMethodInfo[] = [
    { id: 'mock-pay', type: 'mock', label: 'Mock Payment (Test)' },
    { id: 'blik', type: 'blik', label: 'BLIK' },
  ];

  // ── Happy-path Adapter ───────────────────────────────────────────────────

  const happyAdapter: CheckoutAdapterPort = {
    getCart: vi.fn().mockResolvedValue(mockCart),
    getShippingMethods: vi.fn().mockResolvedValue(mockShippingMethods),
    getPaymentMethods: vi.fn().mockResolvedValue(mockPaymentMethods),
    initiatePayment: vi.fn().mockResolvedValue({ intentId: 'intent-abc' }),
    confirmOrder: vi.fn().mockResolvedValue({ orderId: 'ORD-2026-0001' }),
  };

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    runtime = new CheckoutRuntime({ eventBus, logger, adapter: happyAdapter });
    vi.clearAllMocks();
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  // ── Test 1: Happy Path ───────────────────────────────────────────────────

  it('Should complete full happy-path checkout: CART_REVIEW → CONFIRMATION', async () => {
    const tenantId = 'tenant-shop-a';
    const cartId = 'cart-001';

    // Start session
    const ctx1 = await runtime.startSession(tenantId, cartId, 'cust-1', 'pl_PL');
    expect(ctx1.currentState).toBe('CART_REVIEW');
    expect(ctx1.cartSummary.totalCents).toBe(69800);
    expect(ctx1.shippingMethods).toHaveLength(2);
    expect(ctx1.paymentMethods).toHaveLength(2);

    // Update customer info → CUSTOMER_INFO
    const ctx2 = await runtime.updateCustomerInfo(tenantId, cartId, {
      email: 'jan@kowalski.pl',
      firstName: 'Jan',
      lastName: 'Kowalski',
    });
    expect(ctx2.currentState).toBe('CUSTOMER_INFO');

    // Select shipping → SHIPPING_SELECTION
    const ctx3 = await runtime.selectShipping(tenantId, cartId, 'inpost-1');
    expect(ctx3.currentState).toBe('SHIPPING_SELECTION');
    expect(ctx3.selectedShippingId).toBe('inpost-1');

    // Select payment → PAYMENT_SELECTION
    const ctx4 = await runtime.selectPayment(tenantId, cartId, 'mock-pay');
    expect(ctx4.currentState).toBe('PAYMENT_SELECTION');
    expect(ctx4.selectedPaymentMethod).toBe('mock-pay');

    // Process payment → CONFIRMATION
    const { context: ctx5, orderId } = await runtime.processPayment(tenantId, cartId);
    expect(ctx5.currentState).toBe('CONFIRMATION');
    expect(orderId).toBe('ORD-2026-0001');
  });

  // ── Test 2: Tenant Isolation ─────────────────────────────────────────────

  it('Should throw TenantScopeViolationException when cart belongs to different tenant', async () => {
    const isolationAdapter: CheckoutAdapterPort = {
      ...happyAdapter,
      getCart: vi.fn().mockResolvedValue({ ...mockCart, tenantId: 'tenant-shop-b' }), // Different tenant
    };

    const isolatedRuntime = new CheckoutRuntime({ eventBus, logger, adapter: isolationAdapter });

    await expect(
      isolatedRuntime.startSession('tenant-shop-a', 'cart-001', null, 'pl_PL')
    ).rejects.toThrow(TenantScopeViolationException);
  });

  // ── Test 3: Payment Failure → FAILED state ───────────────────────────────

  it('Should transition to FAILED when payment adapter throws, and emit Checkout.Failed event', async () => {
    const failAdapter: CheckoutAdapterPort = {
      ...happyAdapter,
      getCart: vi.fn().mockResolvedValue(mockCart),
      getShippingMethods: vi.fn().mockResolvedValue(mockShippingMethods),
      getPaymentMethods: vi.fn().mockResolvedValue(mockPaymentMethods),
      initiatePayment: vi.fn().mockRejectedValue(new Error('Card declined by bank')),
      confirmOrder: vi.fn(),
    };

    const failRuntime = new CheckoutRuntime({ eventBus, logger, adapter: failAdapter });

    const tenantId = 'tenant-shop-a';
    const cartId = 'cart-fail-001';

    await failRuntime.startSession(tenantId, cartId, null, 'pl_PL');
    await failRuntime.updateCustomerInfo(tenantId, cartId, { email: 'a@b.pl', firstName: 'A', lastName: 'B' });
    await failRuntime.selectShipping(tenantId, cartId, 'inpost-1');
    await failRuntime.selectPayment(tenantId, cartId, 'mock-pay');

    const publishSpy = vi.spyOn(eventBus, 'publish');
    const { context, orderId } = await failRuntime.processPayment(tenantId, cartId);

    expect(context.currentState).toBe('FAILED');
    expect(orderId).toBeUndefined();

    const failedEvents = publishSpy.mock.calls
      .map((call) => call[0])
      .filter((e) => e.eventType === 'Checkout.Failed');
    expect(failedEvents).toHaveLength(1);
    expect(failedEvents[0].payload).toMatchObject({ error: 'Card declined by bank' });
  });

  // ── Test 4: ShippingUnavailableException ─────────────────────────────────

  it('Should throw when selecting unavailable shipping method ID', async () => {
    const tenantId = 'tenant-shop-a';
    const cartId = 'cart-001';

    await runtime.startSession(tenantId, cartId, null, 'pl_PL');
    await runtime.updateCustomerInfo(tenantId, cartId, { email: 'a@b.pl', firstName: 'A', lastName: 'B' });

    await expect(
      runtime.selectShipping(tenantId, cartId, 'non-existent-carrier')
    ).rejects.toThrow(/ShippingUnavailableException/);

    // Session still stays in CUSTOMER_INFO
    const session = runtime.getSession(tenantId, cartId);
    expect(session?.currentState).toBe('CUSTOMER_INFO');
  });

  // ── Test 5: Context Immutability ─────────────────────────────────────────

  it('Should throw TypeError when attempting to mutate frozen CheckoutContext', async () => {
    const ctx = await runtime.startSession('tenant-shop-a', 'cart-001', null, 'pl_PL');

    expect(() => {
      (ctx as any).tenantId = 'malicious-tenant';
    }).toThrow(TypeError);

    expect(() => {
      (ctx as any).cartId = 'hijacked-cart';
    }).toThrow(TypeError);
  });

  // ── Test 6: Illegal State Transition ────────────────────────────────────

  it('Should throw IllegalCheckoutStateTransitionException on invalid state jump', async () => {
    const tenantId = 'tenant-shop-a';
    const cartId = 'cart-001';

    await runtime.startSession(tenantId, cartId, null, 'pl_PL');
    // State is CART_REVIEW — jumping directly to SHIPPING_SELECTION is illegal

    await expect(
      runtime.selectShipping(tenantId, cartId, 'inpost-1')
    ).rejects.toThrow(IllegalCheckoutStateTransitionException);
  });

  // ── Test 7: Component Rendering ─────────────────────────────────────────

  it('Should render CartSummary component with correct product rows', async () => {
    const ctx = await runtime.startSession('tenant-shop-a', 'cart-001', null, 'pl_PL');
    const result = new CartSummaryComponent().render(ctx);

    expect(result.html).toContain('Nike Air Max');
    expect(result.html).toContain('349.00 PLN');
    expect(result.html).toContain('698.00 PLN');
    expect(result.errors).toHaveLength(0);
  });

  it('Should render ShippingSelector with no-methods error block', () => {
    const emptyCtx: CheckoutContext = {
      tenantId: 'tenant-shop-a',
      cartId: 'cart-001',
      customerId: null,
      currency: 'PLN',
      locale: 'pl_PL',
      cartSummary: mockCart,
      shippingMethods: [],
      selectedShippingId: null,
      paymentMethods: mockPaymentMethods,
      selectedPaymentMethod: null,
      currentState: 'SHIPPING_SELECTION',
    };

    const result = new ShippingSelectorComponent().render(emptyCtx);
    expect(result.html).toContain('checkout-error');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/ShippingUnavailableException/);
  });

  it('Should render ConfirmationView with order ID', () => {
    const ctx = {
      tenantId: 'tenant-shop-a',
      cartId: 'cart-001',
      customerId: null,
      currency: 'PLN',
      locale: 'pl_PL',
      cartSummary: mockCart,
      shippingMethods: mockShippingMethods,
      selectedShippingId: 'inpost-1',
      paymentMethods: mockPaymentMethods,
      selectedPaymentMethod: 'mock-pay',
      currentState: 'CONFIRMATION' as const,
    };

    const result = new ConfirmationViewComponent('ORD-2026-0001').render(ctx);
    expect(result.html).toContain('ORD-2026-0001');
    expect(result.html).toContain('Dziękujemy za zamówienie!');
  });

  it('Should swallow component errors and return error HTML via renderWithErrorBoundary', () => {
    const brokenComponent = {
      render: () => { throw new Error('DB connection lost in component'); },
    };

    const ctx: CheckoutContext = {
      tenantId: 'tenant-shop-a',
      cartId: 'cart-001',
      customerId: null,
      currency: 'PLN',
      locale: 'pl_PL',
      cartSummary: mockCart,
      shippingMethods: [],
      selectedShippingId: null,
      paymentMethods: [],
      selectedPaymentMethod: null,
      currentState: 'CART_REVIEW',
    };

    const result = renderWithErrorBoundary(brokenComponent, ctx);
    expect(result.html).toContain('checkout-error');
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBe('DB connection lost in component');
  });
});
