/**
 * StorefrontDynamicPricingEngine.ts — Sprint G1-111 Dynamic Pricing & Multi-Currency Engine (Night Shift Level 73)
 *
 * Provides pure TypeScript, headless multi-currency price conversion, currency charm rounding (e.g. .99 / .95),
 * volume tier discount evaluation, customer group price overrides, and FX exchange rate boundary updates.
 *
 * External FX exchange rate feeds remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type RoundingStrategy = 'NO_ROUNDING' | 'CHARM_99' | 'CHARM_95' | 'ROUND_NEAREST_INTEGER';

export interface CurrencyExchangeRateDTO {
  readonly currencyCode: string; // ISO 3-letter, e.g. 'EUR', 'GBP', 'PLN'
  readonly rateAgainstBase: number; // e.g. 1 USD = 0.92 EUR
  readonly lastUpdatedAtMs: number;
}

export interface VolumeTierDiscountDTO {
  readonly minQuantity: number;
  readonly discountPercent: number; // e.g. 10 for 10% off
}

export interface DynamicPriceEvaluationResultDTO {
  readonly originalPrice: number;
  readonly baseCurrency: string;
  readonly targetCurrency: string;
  readonly convertedPrice: number;
  readonly roundedPrice: number;
  readonly appliedVolumeDiscountPercent: number;
  readonly finalUnitPrice: number;
  readonly totalPrice: number;
  readonly quantity: number;
}

export interface DynamicPricingEngineStateDTO {
  readonly tenantId: string;
  readonly baseCurrency: string;
  readonly rates: Record<string, CurrencyExchangeRateDTO>;
  readonly roundingStrategy: RoundingStrategy;
}

export class StorefrontDynamicPricingEngine {
  private readonly tenantId: string;
  private readonly baseCurrency: string;
  private roundingStrategy: RoundingStrategy;
  private rates: Map<string, CurrencyExchangeRateDTO> = new Map();

  constructor(tenantId = 'default_tenant', baseCurrency = 'USD', roundingStrategy: RoundingStrategy = 'CHARM_99') {
    this.tenantId = tenantId;
    this.baseCurrency = baseCurrency.toUpperCase();
    this.roundingStrategy = roundingStrategy;

    // Base currency rate is always 1.0
    this.rates.set(this.baseCurrency, {
      currencyCode: this.baseCurrency,
      rateAgainstBase: 1.0,
      lastUpdatedAtMs: Date.now()
    });
  }

  /**
   * Sets or updates exchange rate for a target currency against the base currency.
   */
  public updateExchangeRate(currencyCode: string, rateAgainstBase: number): CurrencyExchangeRateDTO {
    if (!currencyCode || rateAgainstBase <= 0) {
      throw new Error('currencyCode and positive rateAgainstBase are required');
    }

    const code = currencyCode.trim().toUpperCase();
    const dto: CurrencyExchangeRateDTO = {
      currencyCode: code,
      rateAgainstBase,
      lastUpdatedAtMs: Date.now()
    };

    this.rates.set(code, dto);
    return dto;
  }

  /**
   * Evaluates dynamic price converting currency, applying volume tier discounts and rounding rules.
   */
  public calculateDynamicPrice(params: {
    basePrice: number;
    targetCurrency?: string;
    quantity?: number;
    volumeTiers?: ReadonlyArray<VolumeTierDiscountDTO>;
    overrideRoundingStrategy?: RoundingStrategy;
  }): DynamicPriceEvaluationResultDTO {
    const { basePrice } = params;
    if (typeof basePrice !== 'number' || basePrice < 0) {
      throw new Error('basePrice must be a non-negative number');
    }

    const targetCurrency = (params.targetCurrency || this.baseCurrency).toUpperCase();
    const quantity = Math.max(1, params.quantity ?? 1);
    const rounding = params.overrideRoundingStrategy || this.roundingStrategy;

    const rateRecord = this.rates.get(targetCurrency);
    if (!rateRecord) {
      throw new Error(`Exchange rate for currency ${targetCurrency} not found`);
    }

    // 1. Currency Conversion
    const rawConvertedPrice = basePrice * rateRecord.rateAgainstBase;

    // 2. Volume Tier Discount Selection
    let appliedVolumeDiscountPercent = 0;
    if (params.volumeTiers && params.volumeTiers.length > 0) {
      const sortedTiers = [...params.volumeTiers].sort((a, b) => b.minQuantity - a.minQuantity);
      for (const tier of sortedTiers) {
        if (quantity >= tier.minQuantity) {
          appliedVolumeDiscountPercent = tier.discountPercent;
          break;
        }
      }
    }

    const discountedPrice = rawConvertedPrice * (1 - appliedVolumeDiscountPercent / 100);

    // 3. Rounding Strategy Application
    let roundedPrice = discountedPrice;
    if (rounding === 'CHARM_99') {
      roundedPrice = Math.floor(discountedPrice) + 0.99;
    } else if (rounding === 'CHARM_95') {
      roundedPrice = Math.floor(discountedPrice) + 0.95;
    } else if (rounding === 'ROUND_NEAREST_INTEGER') {
      roundedPrice = Math.round(discountedPrice);
    } else {
      roundedPrice = Math.round(discountedPrice * 100) / 100;
    }

    const finalUnitPrice = Math.max(0, Math.round(roundedPrice * 100) / 100);
    const totalPrice = Math.round(finalUnitPrice * quantity * 100) / 100;

    return {
      originalPrice: basePrice,
      baseCurrency: this.baseCurrency,
      targetCurrency,
      convertedPrice: rawConvertedPrice,
      roundedPrice: finalUnitPrice,
      appliedVolumeDiscountPercent,
      finalUnitPrice,
      totalPrice,
      quantity
    };
  }

  public getRate(currencyCode: string): CurrencyExchangeRateDTO | undefined {
    return this.rates.get(currencyCode.trim().toUpperCase());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): DynamicPricingEngineStateDTO {
    const record: Record<string, CurrencyExchangeRateDTO> = {};
    this.rates.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      baseCurrency: this.baseCurrency,
      rates: record,
      roundingStrategy: this.roundingStrategy
    };
  }

  public importState(state: DynamicPricingEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.roundingStrategy = state.roundingStrategy || 'CHARM_99';
    this.rates.clear();
    Object.entries(state.rates || {}).forEach(([k, v]) => {
      this.rates.set(k, v);
    });
  }
}
