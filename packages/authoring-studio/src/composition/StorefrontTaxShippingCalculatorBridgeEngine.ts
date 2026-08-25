/**
 * StorefrontTaxShippingCalculatorBridgeEngine.ts — Sprint G1-73 Storefront Tax & Shipping Engine (Night Shift Level 35)
 *
 * Implements a pure TypeScript, headless regional sales tax calculation, VAT rules, dynamic shipping rates, and checkout totals engine
 * for published WEB FACTOR storefronts. Calculates regional tax rates, shipping tiers, free shipping thresholds, and grand totals.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface TaxRateRuleDTO {
  readonly regionCode: string;
  readonly country: string;
  readonly ratePercentage: number;
  readonly taxName: string;
}

export interface ShippingRateRuleDTO {
  readonly shippingMethodId: string;
  readonly name: string;
  readonly baseFeeCents: number;
  readonly freeShippingThresholdCents?: number;
  readonly estimatedDays: string;
}

export interface CalculatedTotalsDTO {
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly shippingCents: number;
  readonly grandTotalCents: number;
  readonly appliedTaxName: string;
  readonly appliedShippingMethod: string;
}

export interface TaxShippingConfigDTO {
  readonly siteId: string;
  readonly taxRules: ReadonlyArray<TaxRateRuleDTO>;
  readonly shippingRules: ReadonlyArray<ShippingRateRuleDTO>;
  readonly defaultTaxRatePercentage: number;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontTaxShippingCalculatorBridgeEngine {
  /**
   * Creates a default tax and shipping configuration.
   */
  public static createDefaultTaxShippingConfig(siteId = 'default_storefront_site'): TaxShippingConfigDTO {
    return {
      siteId,
      taxRules: [
        { regionCode: 'US-CA', country: 'US', ratePercentage: 7.25, taxName: 'CA Sales Tax' },
        { regionCode: 'EU-PL', country: 'PL', ratePercentage: 23.0, taxName: 'VAT 23%' }
      ],
      shippingRules: [
        { shippingMethodId: 'std', name: 'Standard Shipping', baseFeeCents: 500, freeShippingThresholdCents: 5000, estimatedDays: '3-5 business days' },
        { shippingMethodId: 'exp', name: 'Express Shipping', baseFeeCents: 1500, estimatedDays: '1-2 business days' }
      ],
      defaultTaxRatePercentage: 5.0,
      lastUpdated: Date.now()
    };
  }

  /**
   * Adds or updates a regional tax rule.
   */
  public static addTaxRule(config: TaxShippingConfigDTO, rule: TaxRateRuleDTO): TaxShippingConfigDTO {
    if (!config || !rule) throw new Error('StorefrontTaxShippingCalculatorBridgeEngine: Config or rule is null');

    const existingIdx = config.taxRules.findIndex(r => r.regionCode === rule.regionCode);
    const updatedRules = existingIdx >= 0
      ? config.taxRules.map((r, idx) => (idx === existingIdx ? rule : r))
      : [...config.taxRules, rule];

    return {
      ...config,
      taxRules: updatedRules,
      lastUpdated: Date.now()
    };
  }

  /**
   * Adds or updates a shipping method rule.
   */
  public static addShippingRule(config: TaxShippingConfigDTO, rule: ShippingRateRuleDTO): TaxShippingConfigDTO {
    if (!config || !rule) throw new Error('StorefrontTaxShippingCalculatorBridgeEngine: Config or rule is null');

    const existingIdx = config.shippingRules.findIndex(r => r.shippingMethodId === rule.shippingMethodId);
    const updatedRules = existingIdx >= 0
      ? config.shippingRules.map((r, idx) => (idx === existingIdx ? rule : r))
      : [...config.shippingRules, rule];

    return {
      ...config,
      shippingRules: updatedRules,
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculates order tax, shipping fee, subtotal, and grand total.
   */
  public static calculateOrderTotals(
    config: TaxShippingConfigDTO,
    subtotalCents: number,
    regionCode = 'US-CA',
    shippingMethodId = 'std'
  ): CalculatedTotalsDTO {
    if (!config) throw new Error('StorefrontTaxShippingCalculatorBridgeEngine: Config is null');

    const validSubtotal = Math.max(0, subtotalCents);
    const taxRule = config.taxRules.find(r => r.regionCode.toUpperCase() === regionCode.toUpperCase());
    const taxRate = taxRule ? taxRule.ratePercentage : config.defaultTaxRatePercentage;
    const appliedTaxName = taxRule ? taxRule.taxName : 'Standard Tax';

    const taxCents = Math.round((validSubtotal * taxRate) / 100);

    const shipRule = config.shippingRules.find(s => s.shippingMethodId === shippingMethodId) || config.shippingRules[0];
    let shippingCents = shipRule ? shipRule.baseFeeCents : 0;

    if (shipRule && shipRule.freeShippingThresholdCents && validSubtotal >= shipRule.freeShippingThresholdCents) {
      shippingCents = 0; // Free shipping threshold met
    }

    const appliedShippingMethod = shipRule ? shipRule.name : 'Standard';
    const grandTotalCents = validSubtotal + taxCents + shippingCents;

    return {
      subtotalCents: validSubtotal,
      taxCents,
      shippingCents,
      grandTotalCents,
      appliedTaxName,
      appliedShippingMethod
    };
  }

  /**
   * Serializes tax/shipping config to JSON string.
   */
  public static serializeTaxShippingConfig(config: TaxShippingConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores tax/shipping config from JSON string.
   */
  public static restoreTaxShippingConfig(json: string): TaxShippingConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid tax/shipping JSON structure');
      }
      return parsed as TaxShippingConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore tax/shipping config: ${err.message}`);
    }
  }
}
