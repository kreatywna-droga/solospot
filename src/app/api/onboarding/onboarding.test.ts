import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as registerPOST } from '@/app/api/onboarding/register/route';
import { POST as checkoutPOST } from '@/app/api/onboarding/checkout/route';
import { PLATFORM_PACKAGES } from '@/lib/onboarding/OnboardingTypes';
import { mockDb, clearMockDb } from '@/lib/supabase';

// ─── Shared in-memory state ─────────────────────────────────────────────────

const subscriptions = new Map<string, Set<any>>();

// ─── Mock: PlatformEventBus ─────────────────────────────────────────────────

vi.mock('@/../packages/platform-core/src/events/PlatformEventBus', () => ({
  PlatformEventBusImpl: class {
    constructor(_logger?: any) { }
    async publish(event: any) {
      const handlers = subscriptions.get(event.eventType) || new Set();
      const wildcards = subscriptions.get('*') || new Set();
      for (const sub of [...handlers, ...wildcards]) {
        await sub.handler(event);
      }
    }
    subscribe(eventType: string, handler: any) {
      if (!subscriptions.has(eventType)) subscriptions.set(eventType, new Set());
      const id = Math.random().toString();
      subscriptions.get(eventType)!.add({ id, handler });
      return { id, eventType };
    }
    unsubscribe() { }
  },
}));

// ─── Mock: Supabase ─────────────────────────────────────────────────────────

vi.mock('@/lib/supabase');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRequest(body: object, correlationId = 'corr-onb-test') {
  return new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-correlation-id': correlationId },
    body: JSON.stringify(body),
  }) as any;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Sprint 8.2 — First Tenant Onboarding', () => {
  beforeEach(() => {
    clearMockDb();
    subscriptions.clear();
  });

  // ────────────────────────────────────────────────────
  // 1. REJESTRACJA TENANTA
  // ────────────────────────────────────────────────────

  describe('POST /api/onboarding/register', () => {
    it('Should register a new tenant and return CREATED status with checkout data', async () => {
      const res = await registerPOST(makeRequest({
        ownerEmail: 'owner@newshop.pl',
        packageId: 'standard',
        storeName: 'Mój Sklep',
      }));

      expect(res.status).toBe(201);
      const body = await res.json();

      expect(body.success).toBe(true);
      expect(body.status).toBe('CREATED');
      expect(body.ownerEmail).toBe('owner@newshop.pl');
      expect(body.packageId).toBe('standard');
      expect(body.storeName).toBe('Mój Sklep');
      expect(body.tenantId).toBeDefined();
      expect(body.checkoutOrderId).toBeDefined();
      expect(body.packagePriceGross).toBe(PLATFORM_PACKAGES.standard.priceGross);
      expect(body.currency).toBe('PLN');
      expect(body.createdAt).toBeDefined();

      // Tenant musi być zapisany w bazie
      expect(mockDb.tenants).toHaveLength(1);
      expect(mockDb.tenants[0].owner_email).toBe('owner@newshop.pl');
      expect(mockDb.tenants[0].status).toBe('CREATED');
    });

    it('Should return 409 for duplicate email', async () => {
      // Pierwsza rejestracja
      await registerPOST(makeRequest({ ownerEmail: 'dup@shop.pl', packageId: 'starter', storeName: 'Sklep 1' }));

      // Druga rejestracja z tym samym e-mailem
      const res = await registerPOST(makeRequest({ ownerEmail: 'dup@shop.pl', packageId: 'starter', storeName: 'Sklep 2' }));

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toMatch(/already exists/i);
    });

    it('Should return 400 for invalid email format', async () => {
      const res = await registerPOST(makeRequest({ ownerEmail: 'not-an-email', packageId: 'standard', storeName: 'Shop' }));
      expect(res.status).toBe(400);
    });

    it('Should return 400 for invalid packageId', async () => {
      const res = await registerPOST(makeRequest({ ownerEmail: 'owner@shop.pl', packageId: 'galaxy', storeName: 'Shop' }));
      expect(res.status).toBe(400);
    });

    it('Should return 400 for missing required fields', async () => {
      const res = await registerPOST(makeRequest({ ownerEmail: 'owner@shop.pl' }));
      expect(res.status).toBe(400);
    });

    it('Should support all four platform packages', async () => {
      const packages = ['starter', 'standard', 'professional', 'enterprise'] as const;

      for (const pkg of packages) {
        mockDb.tenants.length = 0; // reset between iterations
        const email = `owner_${pkg}@shop.pl`;
        const res = await registerPOST(makeRequest({ ownerEmail: email, packageId: pkg, storeName: `Sklep ${pkg}` }));
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.packagePriceGross).toBe(PLATFORM_PACKAGES[pkg].priceGross);
      }
    });
  });

  // ────────────────────────────────────────────────────
  // 2. INICJALIZACJA CHECKOUTU
  // ────────────────────────────────────────────────────

  describe('POST /api/onboarding/checkout', () => {
    it('Should generate a valid paymentUrl and return checkout data', async () => {
      // Najpierw rejestracja
      const regRes = await registerPOST(makeRequest({ ownerEmail: 'chk@shop.pl', packageId: 'standard', storeName: 'Checkout Shop' }));
      const { tenantId } = await regRes.json();

      // Inicjalizacja checkoutu
      const res = await checkoutPOST(makeRequest({ tenantId, packageId: 'standard' }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.tenantId).toBe(tenantId);
      expect(body.orderId).toBeDefined();
      expect(body.paymentUrl).toBeDefined();
      expect(body.paymentUrl).toContain(tenantId);
      expect(body.paymentUrl).toContain('Standard'); // product_name=WEB+FACTOR+Standard
      expect(body.amountGross).toBe(PLATFORM_PACKAGES.standard.priceGross);
      expect(body.currency).toBe('PLN');
      expect(body.expiresAt).toBeDefined();
      // Sesja płatności wygasa w przyszłości
      expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('Should return 404 for unknown tenantId', async () => {
      const res = await checkoutPOST(makeRequest({ tenantId: 'tn_nonexistent', packageId: 'starter' }));
      expect(res.status).toBe(404);
    });

    it('Should return 400 for invalid packageId in checkout', async () => {
      const regRes = await registerPOST(makeRequest({ ownerEmail: 'chk2@shop.pl', packageId: 'starter', storeName: 'Shop 2' }));
      const { tenantId } = await regRes.json();

      const res = await checkoutPOST(makeRequest({ tenantId, packageId: 'invalid_pkg' }));
      expect(res.status).toBe(400);
    });

    it('Should return 400 for missing fields', async () => {
      const res = await checkoutPOST(makeRequest({ tenantId: 'some-id' }));
      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────────────────
  // 3. PEŁNY PRZEPŁYW ONBOARDINGU (bez płatności)
  // ────────────────────────────────────────────────────

  describe('Full Onboarding Flow (Register → Checkout → Ready for Payment)', () => {
    it('Should complete onboarding up to payment redirect', async () => {
      // KROK 1: Rejestracja
      const regRes = await registerPOST(makeRequest(
        { ownerEmail: 'firstclient@enterprise.pl', packageId: 'professional', storeName: 'Enterprise Store' },
        'corr-onboarding-full-flow'
      ));
      expect(regRes.status).toBe(201);
      const regBody = await regRes.json();

      expect(regBody.tenantId).toBeDefined();
      expect(regBody.status).toBe('CREATED');
      expect(regBody.packagePriceGross).toBe(PLATFORM_PACKAGES.professional.priceGross); // 599 PLN

      // KROK 2: Inicjalizacja checkoutu
      const chkRes = await checkoutPOST(makeRequest(
        { tenantId: regBody.tenantId, packageId: 'professional' },
        'corr-onboarding-full-flow'
      ));
      expect(chkRes.status).toBe(200);
      const chkBody = await chkRes.json();

      expect(chkBody.paymentUrl).toBeDefined();
      expect(chkBody.amountGross).toBe(PLATFORM_PACKAGES.professional.priceGross);
      expect(chkBody.orderId).toContain(regBody.tenantId);

      // KROK 3: Weryfikacja stanu bazy po rejestracji
      // Tenant jest CREATED — czeka na płatność
      const savedTenant = mockDb.tenants.find((t: any) => t.id === regBody.tenantId);
      expect(savedTenant).toBeDefined();
      expect(savedTenant.package_id).toBe('professional');

      // Store NIE jest jeszcze tworzony — aktywacja jest po płatności
      const savedStore = mockDb.stores.find((s: any) => s.tenant_id === regBody.tenantId);
      expect(savedStore).toBeUndefined();
    });
  });
});
