/**
 * StorefrontVendorMarketplacePayoutEngine.ts — Sprint G1-133 Multi-Vendor Marketplace Commission Split Engine (Night Shift Level 95)
 *
 * Provides pure TypeScript, headless multi-vendor order split calculations,
 * vendor commission rates, platform fee deductions per line item, and vendor earnings ledgers.
 *
 * External multi-party payment split APIs (Stripe Connect Custom/Express) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface VendorLineItemSplitDTO {
  readonly vendorId: string;
  readonly productId: string;
  readonly itemAmount: number;
  readonly vendorCommissionPercent: number; // e.g. 15 for 15% platform commission
  readonly platformCommissionFee: number;
  readonly vendorNetEarnings: number;
}

export interface OrderVendorSplitResultDTO {
  readonly orderId: string;
  readonly tenantId: string;
  readonly orderTotalAmount: number;
  readonly totalPlatformCommission: number;
  readonly totalVendorEarnings: number;
  readonly vendorSplits: ReadonlyArray<VendorLineItemSplitDTO>;
  readonly calculatedAtMs: number;
}

export interface VendorMarketplaceEngineStateDTO {
  readonly tenantId: string;
  readonly defaultVendorCommissionPercent: number;
  readonly vendorSplits: Record<string, OrderVendorSplitResultDTO>; // orderId -> split
}

export class StorefrontVendorMarketplacePayoutEngine {
  private readonly tenantId: string;
  private defaultVendorCommissionPercent: number;
  private vendorSplits: Map<string, OrderVendorSplitResultDTO> = new Map();

  constructor(tenantId = 'default_tenant', defaultVendorCommissionPercent = 15) {
    this.tenantId = tenantId;
    this.defaultVendorCommissionPercent = defaultVendorCommissionPercent;
  }

  /**
   * Calculates multi-vendor commission splits for a multi-seller shopping cart order.
   */
  public calculateOrderVendorSplits(params: {
    orderId: string;
    items: ReadonlyArray<{
      vendorId: string;
      productId: string;
      itemAmount: number;
      overrideCommissionPercent?: number;
    }>;
  }): OrderVendorSplitResultDTO {
    const { orderId, items } = params;

    if (!orderId || !items || items.length === 0) {
      throw new Error('orderId and at least one item are required');
    }

    let orderTotalAmount = 0;
    let totalPlatformCommission = 0;
    let totalVendorEarnings = 0;
    const vendorSplits: VendorLineItemSplitDTO[] = [];

    items.forEach(item => {
      if (item.itemAmount < 0) {
        throw new Error(`Item amount for product ${item.productId} cannot be negative`);
      }

      const commissionPercent = item.overrideCommissionPercent ?? this.defaultVendorCommissionPercent;
      const platformCommissionFee = Math.round((item.itemAmount * (commissionPercent / 100)) * 100) / 100;
      const vendorNetEarnings = Math.round((item.itemAmount - platformCommissionFee) * 100) / 100;

      orderTotalAmount += item.itemAmount;
      totalPlatformCommission += platformCommissionFee;
      totalVendorEarnings += vendorNetEarnings;

      vendorSplits.push({
        vendorId: item.vendorId.trim(),
        productId: item.productId.trim(),
        itemAmount: item.itemAmount,
        vendorCommissionPercent: commissionPercent,
        platformCommissionFee,
        vendorNetEarnings
      });
    });

    const now = Date.now();
    const roundedOrderTotal = Math.round(orderTotalAmount * 100) / 100;
    const roundedPlatformCommission = Math.round(totalPlatformCommission * 100) / 100;
    // Guaranteed penny-exact balance check (G1-149 RECOVER)
    const roundedVendorEarnings = Math.round((roundedOrderTotal - roundedPlatformCommission) * 100) / 100;

    const dto: OrderVendorSplitResultDTO = {
      orderId: orderId.trim(),
      tenantId: this.tenantId,
      orderTotalAmount: roundedOrderTotal,
      totalPlatformCommission: roundedPlatformCommission,
      totalVendorEarnings: roundedVendorEarnings,
      vendorSplits,
      calculatedAtMs: now
    };


    this.vendorSplits.set(dto.orderId, dto);
    return dto;
  }

  /**
   * Calculates 1099 / W-8BEN tax withholding deduction for marketplace vendors (G1-177 EXTEND).
   */
  public calculateVendorTaxWithholding(vendorEarnings: number, withholdingRatePercent = 24.0): {
    grossEarnings: number;
    withholdingRatePercent: number;
    withheldTaxAmount: number;
    netPayoutAmount: number;
  } {
    if (typeof vendorEarnings !== 'number' || vendorEarnings < 0) {
      throw new Error('vendorEarnings must be a non-negative number');
    }

    const grossEarnings = Math.round(vendorEarnings * 100) / 100;
    const withheldTaxAmount = Math.round((grossEarnings * (withholdingRatePercent / 100)) * 100) / 100;
    const netPayoutAmount = Math.round((grossEarnings - withheldTaxAmount) * 100) / 100;

    return {
      grossEarnings,
      withholdingRatePercent,
      withheldTaxAmount,
      netPayoutAmount
    };
  }

  public getOrderSplit(orderId: string): OrderVendorSplitResultDTO | undefined {
    return this.vendorSplits.get(orderId.trim());
  }


  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): VendorMarketplaceEngineStateDTO {
    const record: Record<string, OrderVendorSplitResultDTO> = {};
    this.vendorSplits.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      defaultVendorCommissionPercent: this.defaultVendorCommissionPercent,
      vendorSplits: record
    };
  }

  public importState(state: VendorMarketplaceEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.vendorSplits.clear();
    Object.entries(state.vendorSplits || {}).forEach(([k, v]) => {
      this.vendorSplits.set(k, v);
    });
  }
}
