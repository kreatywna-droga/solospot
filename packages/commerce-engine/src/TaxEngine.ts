import { z } from 'zod';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { TenantSecurityException } from './CommerceEngine';

export const TaxRateSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  ratePercent: z.number().min(0).max(100),
  code: z.string().min(1),
});
export type TaxRate = z.infer<typeof TaxRateSchema>;

export const TaxRegionRuleSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  countryCode: z.string().length(2),
  taxRateId: z.string().min(1),
  shippingTaxRateId: z.string().optional(),
});
export type TaxRegionRule = z.infer<typeof TaxRegionRuleSchema>;

export const TaxExemptionSchema = z.object({
  customerId: z.string().min(1),
  tenantId: z.string().min(1),
  reason: z.string().min(1),
  grantedAt: z.string().datetime(),
});
export type TaxExemption = z.infer<typeof TaxExemptionSchema>;

export const TaxBreakdownItemSchema = z.object({
  taxRateCode: z.string(),
  taxRatePercent: z.number(),
  taxAmount: z.number().int(),
  netAmount: z.number().int(),
});

export const TaxCalculationResultSchema = z.object({
  subtotalNet: z.number().int(),
  taxTotal: z.number().int(),
  subtotalGross: z.number().int(),
  breakdown: z.array(TaxBreakdownItemSchema),
});
export type TaxCalculationResult = z.infer<typeof TaxCalculationResultSchema>;

export class TaxEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;

  // In-memory repositories
  private readonly taxRates = new Map<string, TaxRate>();
  private readonly regionRules = new Map<string, TaxRegionRule>(); // key: `${tenantId}:${countryCode}`
  private readonly exemptions = new Map<string, TaxExemption>();   // key: `${tenantId}:${customerId}`

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register all tax events
    const taxEvents = [
      'Tax.Calculated',
      'Tax.RuleApplied',
      'Tax.ExemptionGranted',
    ];
    for (const evt of taxEvents) {
      EventRegistry.register(evt);
    }
  }

  private enforceTenantIsolation(tenantId: string, targetTenantId: string, contextMessage: string): void {
    if (tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `Cross-tenant access blocked during tax calculation: ${contextMessage}. Active: ${tenantId}, Target: ${targetTenantId}`
      );
    }
  }

  private getRegionKey(tenantId: string, countryCode: string): string {
    return `${tenantId}:${countryCode.toUpperCase()}`;
  }

  private getExemptionKey(tenantId: string, customerId: string): string {
    return `${tenantId}:${customerId}`;
  }

  /**
   * Registers a new Tax Rate.
   */
  public registerTaxRate(rate: TaxRate): void {
    TaxRateSchema.parse(rate);
    this.taxRates.set(rate.id, rate);
  }

  /**
   * Registers a new regional tax rule.
   */
  public registerRegionRule(rule: TaxRegionRule): void {
    TaxRegionRuleSchema.parse(rule);
    const key = this.getRegionKey(rule.tenantId, rule.countryCode);
    this.regionRules.set(key, rule);
  }

  /**
   * Grants tax exemption status to a specific customer.
   */
  public async grantTaxExemption(
    tenantId: string,
    customerId: string,
    reason: string,
    correlationId?: string
  ): Promise<TaxExemption> {
    const cid = correlationId || `tax_ex_${Date.now()}`;
    const exemption: TaxExemption = {
      customerId,
      tenantId,
      reason,
      grantedAt: new Date().toISOString(),
    };

    TaxExemptionSchema.parse(exemption);
    this.exemptions.set(this.getExemptionKey(tenantId, customerId), exemption);

    await this.eventBus.publish({
      eventId: `evt_tax_ex_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Tax.ExemptionGranted',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { customerId, reason },
    });

    return exemption;
  }

  /**
   * Computes Net and Tax from Gross price for a product.
   */
  public async calculateProductTax(
    tenantId: string,
    priceGross: number,
    taxRateId: string
  ): Promise<{ net: number; tax: number }> {
    const rate = this.taxRates.get(taxRateId);
    if (!rate) {
      throw new Error(`Tax rate not found: ${taxRateId}`);
    }
    this.enforceTenantIsolation(tenantId, rate.tenantId, 'Calculate product tax');

    const net = Math.round(priceGross / (1 + rate.ratePercent / 100));
    const tax = priceGross - net;

    return { net, tax };
  }

  /**
   * Computes tax total, net subtotal, and breakdown for a Cart.
   */
  public async calculateCartTax(
    tenantId: string,
    items: Array<{ priceGross: number; quantity: number; taxRateId: string }>,
    shipping?: { priceGross: number; taxRateId: string },
    countryCode = 'PL',
    customerId?: string,
    correlationId?: string
  ): Promise<TaxCalculationResult> {
    const cid = correlationId || `tax_calc_${Date.now()}`;

    // 1. Check for exemption
    const isExempt = customerId ? this.exemptions.has(this.getExemptionKey(tenantId, customerId)) : false;

    // Helper zero tax rate
    const zeroRate: TaxRate = {
      id: 'zero_tax_rate_fallback',
      tenantId,
      name: 'Zero Tax (Exempt)',
      ratePercent: 0,
      code: 'ZERO_EXEMPT',
    };

    // 2. Fetch regional rules
    const regionRule = this.regionRules.get(this.getRegionKey(tenantId, countryCode));

    const breakdownMap = new Map<string, { percent: number; net: number; tax: number }>();

    let subtotalGross = 0;
    let subtotalNet = 0;
    let taxTotal = 0;

    // Process line items
    for (const item of items) {
      let activeRate = zeroRate;

      if (!isExempt) {
        // Use region rule's default rate if defined, otherwise fall back to item's default rate
        const rateId = regionRule ? regionRule.taxRateId : item.taxRateId;
        const fetchedRate = this.taxRates.get(rateId);
        if (!fetchedRate) {
          throw new Error(`Tax rate not found: ${rateId}`);
        }
        this.enforceTenantIsolation(tenantId, fetchedRate.tenantId, 'Calculate cart item tax');
        activeRate = fetchedRate;
      }

      const totalItemGross = item.priceGross * item.quantity;
      const net = Math.round(totalItemGross / (1 + activeRate.ratePercent / 100));
      const tax = totalItemGross - net;

      subtotalGross += totalItemGross;
      subtotalNet += net;
      taxTotal += tax;

      const existing = breakdownMap.get(activeRate.code) || { percent: activeRate.ratePercent, net: 0, tax: 0 };
      existing.net += net;
      existing.tax += tax;
      breakdownMap.set(activeRate.code, existing);
    }

    // Process shipping
    if (shipping) {
      let activeRate = zeroRate;

      if (!isExempt) {
        const rateId = regionRule?.shippingTaxRateId || shipping.taxRateId;
        const fetchedRate = this.taxRates.get(rateId);
        if (!fetchedRate) {
          throw new Error(`Shipping tax rate not found: ${rateId}`);
        }
        this.enforceTenantIsolation(tenantId, fetchedRate.tenantId, 'Calculate shipping tax');
        activeRate = fetchedRate;
      }

      const net = Math.round(shipping.priceGross / (1 + activeRate.ratePercent / 100));
      const tax = shipping.priceGross - net;

      subtotalGross += shipping.priceGross;
      subtotalNet += net;
      taxTotal += tax;

      const existing = breakdownMap.get(activeRate.code) || { percent: activeRate.ratePercent, net: 0, tax: 0 };
      existing.net += net;
      existing.tax += tax;
      breakdownMap.set(activeRate.code, existing);
    }

    const breakdown = Array.from(breakdownMap.entries()).map(([code, item]) => ({
      taxRateCode: code,
      taxRatePercent: item.percent,
      taxAmount: item.tax,
      netAmount: item.net,
    }));

    const result: TaxCalculationResult = {
      subtotalNet,
      taxTotal,
      subtotalGross,
      breakdown,
    };

    TaxCalculationResultSchema.parse(result);

    await this.eventBus.publish({
      eventId: `evt_tax_calc_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'Tax.Calculated',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { subtotalGross, taxTotal },
    });

    return result;
  }
}
