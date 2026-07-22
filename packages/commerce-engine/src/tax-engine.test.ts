import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { TaxEngine } from './TaxEngine';
import { TenantSecurityException } from './CommerceEngine';

describe('Tax Engine', () => {
  let engine: TaxEngine;
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

    engine = new TaxEngine({ eventBus, logger });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should calculate VAT correctly for product from gross: 1000 groszy at 23% VAT', async () => {
    const tenantId = 'tenant-shop-xyz';
    const taxRateId = 'vat_23';

    engine.registerTaxRate({
      id: taxRateId,
      tenantId,
      name: 'VAT 23%',
      ratePercent: 23,
      code: 'VAT_23',
    });

    const result = await engine.calculateProductTax(tenantId, 1000, taxRateId);
    // Net = round(1000 / 1.23) = round(813.008) = 813 groszy
    // Tax = 1000 - 813 = 187 groszy
    expect(result.net).toBe(813);
    expect(result.tax).toBe(187);
  });

  it('Should calculate cart VAT and breakdown with shipping fee', async () => {
    const tenantId = 'tenant-shop-xyz';
    const rate23Id = 'vat_23';
    const rate8Id = 'vat_8';

    engine.registerTaxRate({
      id: rate23Id,
      tenantId,
      name: 'VAT 23%',
      ratePercent: 23,
      code: 'VAT_23',
    });

    engine.registerTaxRate({
      id: rate8Id,
      tenantId,
      name: 'VAT 8%',
      ratePercent: 8,
      code: 'VAT_8',
    });

    const items = [
      { priceGross: 2000, quantity: 2, taxRateId: rate23Id }, // 4000 gross
      { priceGross: 1080, quantity: 1, taxRateId: rate8Id },  // 1080 gross
    ];

    const shipping = { priceGross: 1500, taxRateId: rate23Id }; // 1500 gross

    const spyPublish = vi.spyOn(eventBus, 'publish');

    const result = await engine.calculateCartTax(tenantId, items, shipping, 'PL');

    // Calculations:
    // Item 1: 4000 gross / 1.23 = 3252.03 -> 3252 net, tax = 748
    // Item 2: 1080 gross / 1.08 = 1000 net, tax = 80
    // Shipping: 1500 gross / 1.23 = 1219.51 -> 1220 net, tax = 280
    //
    // Totals:
    // Gross: 4000 + 1080 + 1500 = 6580
    // Net: 3252 + 1000 + 1220 = 5472
    // Tax: 748 + 80 + 280 = 1108
    expect(result.subtotalGross).toBe(6580);
    expect(result.subtotalNet).toBe(5472);
    expect(result.taxTotal).toBe(1108);

    // Verify breakdown
    const vat23 = result.breakdown.find((b) => b.taxRateCode === 'VAT_23');
    const vat8 = result.breakdown.find((b) => b.taxRateCode === 'VAT_8');

    expect(vat23).toBeDefined();
    expect(vat23?.netAmount).toBe(3252 + 1220); // Item 1 + Shipping
    expect(vat23?.taxAmount).toBe(748 + 280);

    expect(vat8).toBeDefined();
    expect(vat8?.netAmount).toBe(1000);
    expect(vat8?.taxAmount).toBe(80);

    // Verify event dispatch
    expect(spyPublish).toHaveBeenCalled();
    const event = spyPublish.mock.calls.find((c) => c[0].eventType === 'Tax.Calculated');
    expect(event).toBeDefined();
    expect(event?.[0].payload.taxTotal).toBe(1108);
  });

  it('Should adjust taxes dynamically based on regional rule for country code DE', async () => {
    const tenantId = 'tenant-shop-xyz';
    const ratePlId = 'vat_pl_23';
    const rateDeId = 'vat_de_19';

    engine.registerTaxRate({ id: ratePlId, tenantId, name: 'VAT PL 23%', ratePercent: 23, code: 'VAT_PL_23' });
    engine.registerTaxRate({ id: rateDeId, tenantId, name: 'VAT DE 19%', ratePercent: 19, code: 'VAT_DE_19' });

    engine.registerRegionRule({
      id: 'rule_de',
      tenantId,
      countryCode: 'DE',
      taxRateId: rateDeId,
      shippingTaxRateId: rateDeId,
    });

    const items = [{ priceGross: 1190, quantity: 1, taxRateId: ratePlId }]; // Default is PL, but region rule is DE

    const result = await engine.calculateCartTax(tenantId, items, undefined, 'DE');

    // 1190 gross / 1.19 = 1000 net, tax = 190 (since DE 19% rate is applied)
    expect(result.subtotalGross).toBe(1190);
    expect(result.subtotalNet).toBe(1000);
    expect(result.taxTotal).toBe(190);
    expect(result.breakdown[0].taxRateCode).toBe('VAT_DE_19');
  });

  it('Should bypass VAT and apply zero tax for customers with exemptions', async () => {
    const tenantId = 'tenant-shop-xyz';
    const taxRateId = 'vat_23';
    const customerId = 'cust_exempt_111';

    engine.registerTaxRate({
      id: taxRateId,
      tenantId,
      name: 'VAT 23%',
      ratePercent: 23,
      code: 'VAT_23',
    });

    // Grant exemption
    await engine.grantTaxExemption(tenantId, customerId, 'B2B Reverse Charge');

    const items = [{ priceGross: 2000, quantity: 2, taxRateId: taxRateId }];
    const result = await engine.calculateCartTax(tenantId, items, undefined, 'PL', customerId);

    // Tax is bypassed -> Net = Gross, Tax = 0
    expect(result.subtotalGross).toBe(4000);
    expect(result.subtotalNet).toBe(4000);
    expect(result.taxTotal).toBe(0);
    expect(result.breakdown[0].taxRateCode).toBe('ZERO_EXEMPT');
  });

  it('Should throw TenantSecurityException on cross-tenant tax rule access', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    const taxRateA = 'rate_a';

    engine.registerTaxRate({
      id: taxRateA,
      tenantId: tenantA,
      name: 'Tenant A VAT',
      ratePercent: 23,
      code: 'VAT_A',
    });

    // Tenant B attempts to calculate product tax using Tenant A's rate -> throws TenantSecurityException
    await expect(
      engine.calculateProductTax(tenantB, 1000, taxRateA)
    ).rejects.toThrow(TenantSecurityException);

    // Tenant B attempts to calculate cart tax referencing Tenant A's rate -> throws TenantSecurityException
    await expect(
      engine.calculateCartTax(tenantB, [{ priceGross: 100, quantity: 1, taxRateId: taxRateA }])
    ).rejects.toThrow(TenantSecurityException);
  });
});
