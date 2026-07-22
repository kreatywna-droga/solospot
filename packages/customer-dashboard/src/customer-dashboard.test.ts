import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import {
  DashboardRuntime,
  DashboardAdapterPort,
  CustomerProfile,
} from './DashboardRuntime';
import {
  DashboardContext,
  CustomerOrder,
  CustomerAddress,
  CustomerPreferences,
  AuthenticationRequiredException,
  DashboardTenantScopeViolationException,
  AddressOperationException,
} from './DashboardContext';
import {
  AccountHomeView,
  OrdersView,
  OrderDetailView,
  AddressBookView,
  PreferencesView,
} from './DashboardComponents';

describe('Customer Dashboard', () => {
  let runtime: DashboardRuntime;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  // ── Fixtures ───────────────────────────────────────────────────────────────

  const TENANT_A = 'tenant-shop-a';
  const TENANT_B = 'tenant-shop-b';
  const TOKEN_VALID = 'tok_valid_abc';
  const TOKEN_INVALID = 'tok_invalid_xxx';

  const profileA: CustomerProfile = {
    customerId: 'cust-001',
    tenantId: TENANT_A,
    email: 'jan@kowalski.pl',
    firstName: 'Jan',
    lastName: 'Kowalski',
    preferences: { locale: 'pl_PL', currency: 'PLN', marketingConsent: true, newsletterConsent: false },
  };

  const sampleOrders: CustomerOrder[] = [
    {
      orderId: 'ORD-2026-001',
      status: 'SHIPPED',
      totalCents: 12900,
      currency: 'PLN',
      createdAt: '2026-07-01T10:00:00Z',
      trackingNumber: 'INPOST-0000001',
      items: [{ productId: 'p1', name: 'Nike Air Max', quantity: 1, unitPriceCents: 12900, currency: 'PLN' }],
    },
    {
      orderId: 'ORD-2026-002',
      status: 'PAID',
      totalCents: 4900,
      currency: 'PLN',
      createdAt: '2026-07-05T14:30:00Z',
      items: [{ productId: 'p2', name: 'Skarpety sportowe', quantity: 3, unitPriceCents: 1633, currency: 'PLN' }],
    },
  ];

  const sampleAddresses: CustomerAddress[] = [
    { addressId: 'addr-1', fullName: 'Jan Kowalski', street: 'ul. Długa 1', city: 'Warszawa', postalCode: '00-001', country: 'PL', isDefault: true },
    { addressId: 'addr-2', fullName: 'Jan Kowalski', street: 'ul. Krótka 5', city: 'Kraków', postalCode: '31-001', country: 'PL', isDefault: false },
  ];

  // ── Mock Adapter (happy path by default) ─────────────────────────────────

  const mockAdapter: DashboardAdapterPort = {
    verifySession: vi.fn(),
    getOrders: vi.fn().mockResolvedValue(sampleOrders),
    getOrderById: vi.fn().mockImplementation(async (_t, _c, orderId) =>
      sampleOrders.find((o) => o.orderId === orderId) ?? null
    ),
    getAddresses: vi.fn().mockResolvedValue([...sampleAddresses]),
    addAddress: vi.fn().mockImplementation(async (_t, _c, addr) => ({
      ...addr,
      addressId: `addr-new-${Date.now()}`,
      isDefault: false,
    })),
    removeAddress: vi.fn().mockResolvedValue(undefined),
    setDefaultAddress: vi.fn().mockImplementation(async (_t, _c, addressId) =>
      sampleAddresses.map((a) => ({ ...a, isDefault: a.addressId === addressId }))
    ),
    updatePreferences: vi.fn().mockImplementation(async (_t, _c, prefs) => ({
      ...profileA.preferences,
      ...prefs,
    })),
    updateProfile: vi.fn().mockImplementation(async (_t, _c, data) => ({
      ...profileA,
      ...data,
    })),
  };

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    runtime = new DashboardRuntime({ eventBus, logger, adapter: mockAdapter });

    // Default: valid session for tenant-a
    vi.mocked(mockAdapter.verifySession).mockImplementation(async (tenantId, token) => {
      if (token === TOKEN_VALID && tenantId === TENANT_A) return profileA;
      return null;
    });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  // ── Test 1: Session Init ─────────────────────────────────────────────────

  it('Should open a session and return frozen DashboardContext with account_home view', async () => {
    const ctx = await runtime.openSession(TENANT_A, TOKEN_VALID);

    expect(ctx.currentView).toBe('account_home');
    expect(ctx.customerId).toBe('cust-001');
    expect(ctx.email).toBe('jan@kowalski.pl');
    expect(ctx.tenantId).toBe(TENANT_A);
    expect(ctx.locale).toBe('pl_PL');

    // Context must be frozen
    expect(Object.isFrozen(ctx)).toBe(true);
  });

  // ── Test 2: Orders View ──────────────────────────────────────────────────

  it('Should render OrdersView with shipped order tracking number', async () => {
    await runtime.openSession(TENANT_A, TOKEN_VALID);
    const orders = await runtime.getOrders(TOKEN_VALID);

    const ctx = runtime.requireSession(TOKEN_VALID);
    const result = new OrdersView().render(ctx, orders);

    expect(result.html).toContain('ORD-2026-001');
    expect(result.html).toContain('SHIPPED');
    expect(result.html).toContain('INPOST-0000001');
    expect(result.html).toContain('ORD-2026-002');
    expect(result.errors).toHaveLength(0);
  });

  it('Should render OrderDetailView with items and tracking', async () => {
    await runtime.openSession(TENANT_A, TOKEN_VALID);
    const order = await runtime.getOrderById(TOKEN_VALID, 'ORD-2026-001');

    const ctx = runtime.requireSession(TOKEN_VALID);
    const result = new OrderDetailView().render(ctx, order!);

    expect(result.html).toContain('ORD-2026-001');
    expect(result.html).toContain('SHIPPED');
    expect(result.html).toContain('INPOST-0000001');
    expect(result.html).toContain('Nike Air Max');
  });

  // ── Test 3: Address CRUD ─────────────────────────────────────────────────

  it('Should add, set default, and fail to remove the only address', async () => {
    await runtime.openSession(TENANT_A, TOKEN_VALID);

    // Add address
    const newAddr = await runtime.addAddress(TOKEN_VALID, {
      fullName: 'Jan Kowalski',
      street: 'ul. Nowa 99',
      city: 'Gdańsk',
      postalCode: '80-001',
      country: 'PL',
    });
    expect(newAddr.addressId).toBeDefined();
    expect(vi.mocked(mockAdapter.addAddress)).toHaveBeenCalledTimes(1);

    // Set default
    await runtime.setDefaultAddress(TOKEN_VALID, 'addr-2');
    expect(vi.mocked(mockAdapter.setDefaultAddress)).toHaveBeenCalledWith(TENANT_A, 'cust-001', 'addr-2');

    // Cannot remove default when other addresses exist
    vi.mocked(mockAdapter.getAddresses).mockResolvedValueOnce([
      { ...sampleAddresses[0], isDefault: true },
      { ...sampleAddresses[1], isDefault: false },
    ]);
    await expect(runtime.removeAddress(TOKEN_VALID, 'addr-1')).rejects.toThrow(AddressOperationException);

    // Cannot remove single address
    vi.mocked(mockAdapter.getAddresses).mockResolvedValueOnce([
      { ...sampleAddresses[0], isDefault: true },
    ]);
    await expect(runtime.removeAddress(TOKEN_VALID, 'addr-1')).rejects.toThrow(AddressOperationException);
  });

  // ── Test 4: Preference Update + Event ────────────────────────────────────

  it('Should update locale, return new context, and emit Customer.PreferenceUpdated', async () => {
    await runtime.openSession(TENANT_A, TOKEN_VALID);

    const publishSpy = vi.spyOn(eventBus, 'publish');
    const { context, preferences } = await runtime.updatePreferences(TOKEN_VALID, { locale: 'de_DE' });

    expect(context.locale).toBe('de_DE');
    expect(preferences.locale).toBe('de_DE');

    const prefEvents = publishSpy.mock.calls
      .map((c) => c[0])
      .filter((e) => e.eventType === 'Customer.PreferenceUpdated');
    expect(prefEvents).toHaveLength(1);
    expect(prefEvents[0].payload.preferences.locale).toBe('de_DE');
  });

  // ── Test 5: Tenant Isolation ─────────────────────────────────────────────

  it('Should prevent accessing orders across tenant boundaries', async () => {
    // Tenant B's session token
    vi.mocked(mockAdapter.verifySession).mockImplementation(async (tenantId, token) => {
      if (token === 'tok_b' && tenantId === TENANT_B) return { ...profileA, tenantId: TENANT_B, customerId: 'cust-b' };
      return null;
    });

    await runtime.openSession(TENANT_B, 'tok_b');

    // Reset call history — isolate this test's assertions
    vi.mocked(mockAdapter.getOrders).mockClear();

    // Orders should be queried with tenant-b scope — adapter enforces isolation
    await runtime.getOrders('tok_b');
    expect(vi.mocked(mockAdapter.getOrders)).toHaveBeenCalledWith(TENANT_B, 'cust-b');
    // Orders for tenant-a are never requested in this test
    expect(vi.mocked(mockAdapter.getOrders)).not.toHaveBeenCalledWith(TENANT_A, expect.anything());
  });

  // ── Test 6: Authentication Boundary ─────────────────────────────────────

  it('Should throw AuthenticationRequiredException for invalid token', async () => {
    await expect(
      runtime.openSession(TENANT_A, TOKEN_INVALID)
    ).rejects.toThrow(AuthenticationRequiredException);
  });

  it('Should throw AuthenticationRequiredException when accessing data without active session', () => {
    expect(() => runtime.requireSession('non-existent-token')).toThrow(AuthenticationRequiredException);
  });

  // ── Test 7: Context Immutability ─────────────────────────────────────────

  it('Should throw TypeError when mutating frozen DashboardContext', async () => {
    const ctx = await runtime.openSession(TENANT_A, TOKEN_VALID);

    expect(() => {
      (ctx as any).customerId = 'malicious-customer';
    }).toThrow(TypeError);

    expect(() => {
      (ctx as any).tenantId = 'malicious-tenant';
    }).toThrow(TypeError);
  });

  // ── Test 8: Component Error Boundary ─────────────────────────────────────

  it('Should render AddressBookView with multiple addresses and default badge', async () => {
    const ctx = await runtime.openSession(TENANT_A, TOKEN_VALID);
    const result = new AddressBookView().render(ctx, sampleAddresses);

    expect(result.html).toContain('addr-1');
    expect(result.html).toContain('Domyślny');
    expect(result.html).toContain('addr-2');
    expect(result.errors).toHaveLength(0);
  });

  it('Should render PreferencesView with correct checkboxes', async () => {
    const ctx = await runtime.openSession(TENANT_A, TOKEN_VALID);
    const result = new PreferencesView().render(ctx, profileA.preferences);

    expect(result.html).toContain('pl_PL');
    expect(result.html).toContain('selected');
    expect(result.html).toContain('marketingConsent');
    expect(result.errors).toHaveLength(0);
  });

  it('Should render AccountHomeView with customer name', async () => {
    const ctx = await runtime.openSession(TENANT_A, TOKEN_VALID);
    const result = new AccountHomeView().render(ctx);

    expect(result.html).toContain('Witaj, Jan Kowalski!');
    expect(result.html).toContain('jan@kowalski.pl');
  });
});
