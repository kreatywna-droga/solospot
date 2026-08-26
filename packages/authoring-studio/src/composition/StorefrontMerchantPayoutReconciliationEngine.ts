/**
 * StorefrontMerchantPayoutReconciliationEngine.ts — Sprint G1-123 Merchant Payout & Fee Reconciliation Engine (Night Shift Level 85)
 *
 * Provides pure TypeScript, headless merchant payout calculation, platform fee deduction percentages,
 * reserve withholdings, payout batch manifest generation, and payout status lifecycles.
 *
 * External payout infrastructure (Stripe Connect, Bank ACH/SEPA transfer webhooks) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type PayoutBatchStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'PAID' | 'FAILED' | 'HELD';

export interface PayoutLineItemDTO {
  readonly orderId: string;
  readonly grossAmount: number;
  readonly platformFeeAmount: number;
  readonly netAmount: number;
  readonly currency: string;
}

export interface MerchantPayoutBatchDTO {
  readonly payoutId: string;
  readonly tenantId: string;
  readonly merchantId: string;
  readonly totalGrossAmount: number;
  readonly totalPlatformFees: number;
  readonly totalReserveAmount: number;
  readonly netPayoutAmount: number;
  readonly currency: string;
  readonly status: PayoutBatchStatus;
  readonly lineItems: ReadonlyArray<PayoutLineItemDTO>;
  readonly scheduledForMs: number;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface MerchantPayoutEngineStateDTO {
  readonly tenantId: string;
  readonly defaultPlatformFeePercent: number;
  readonly defaultReservePercent: number;
  readonly payouts: Record<string, MerchantPayoutBatchDTO>; // payoutId -> payout
}

export class StorefrontMerchantPayoutReconciliationEngine {
  private readonly tenantId: string;
  private defaultPlatformFeePercent: number;
  private defaultReservePercent: number;
  private payouts: Map<string, MerchantPayoutBatchDTO> = new Map();

  constructor(
    tenantId = 'default_tenant',
    defaultPlatformFeePercent = 2.5, // 2.5% platform fee
    defaultReservePercent = 5.0 // 5% rolling reserve for refunds/chargebacks
  ) {
    this.tenantId = tenantId;
    this.defaultPlatformFeePercent = defaultPlatformFeePercent;
    this.defaultReservePercent = defaultReservePercent;
  }

  /**
   * Generates a merchant payout batch manifest reconciling order sales, platform fees, and reserves.
   */
  public generatePayoutBatch(params: {
    payoutId: string;
    merchantId: string;
    orders: ReadonlyArray<{ orderId: string; amount: number }>;
    currency?: string;
    overridePlatformFeePercent?: number;
    overrideReservePercent?: number;
  }): MerchantPayoutBatchDTO {
    const { payoutId, merchantId, orders } = params;

    if (!payoutId || !merchantId || !orders || orders.length === 0) {
      throw new Error('payoutId, merchantId, and at least one order are required');
    }

    const feePercent = params.overridePlatformFeePercent ?? this.defaultPlatformFeePercent;
    const reservePercent = params.overrideReservePercent ?? this.defaultReservePercent;
    const currency = params.currency ? params.currency.trim().toUpperCase() : 'USD';

    let totalGrossAmount = 0;
    let totalPlatformFees = 0;
    const lineItems: PayoutLineItemDTO[] = [];

    orders.forEach(ord => {
      if (ord.amount < 0) {
        throw new Error(`Order ${ord.orderId} amount cannot be negative`);
      }
      const fee = Math.round((ord.amount * (feePercent / 100)) * 100) / 100;
      const net = Math.round((ord.amount - fee) * 100) / 100;

      totalGrossAmount += ord.amount;
      totalPlatformFees += fee;

      lineItems.push({
        orderId: ord.orderId.trim(),
        grossAmount: ord.amount,
        platformFeeAmount: fee,
        netAmount: net,
        currency
      });
    });

    totalGrossAmount = Math.round(totalGrossAmount * 100) / 100;
    totalPlatformFees = Math.round(totalPlatformFees * 100) / 100;

    const totalReserveAmount = Math.round((totalGrossAmount * (reservePercent / 100)) * 100) / 100;
    const netPayoutAmount = Math.max(0, Math.round((totalGrossAmount - totalPlatformFees - totalReserveAmount) * 100) / 100);

    const now = Date.now();
    const dto: MerchantPayoutBatchDTO = {
      payoutId: payoutId.trim(),
      tenantId: this.tenantId,
      merchantId: merchantId.trim(),
      totalGrossAmount,
      totalPlatformFees,
      totalReserveAmount,
      netPayoutAmount,
      currency,
      status: 'SCHEDULED',
      lineItems,
      scheduledForMs: now + 86400000, // 24h default schedule
      createdAtMs: now,
      updatedAtMs: now
    };

    this.payouts.set(dto.payoutId, dto);
    return dto;
  }

  /**
   * Updates payout batch status (e.g. upon receiving ACH/SEPA payment completion webhook).
   */
  public updatePayoutStatus(payoutId: string, status: PayoutBatchStatus): MerchantPayoutBatchDTO {
    const payout = this.payouts.get(payoutId.trim());
    if (!payout) {
      throw new Error(`Payout batch ${payoutId} not found`);
    }

    const updated: MerchantPayoutBatchDTO = {
      ...payout,
      status,
      updatedAtMs: Date.now()
    };

    this.payouts.set(payout.payoutId, updated);
    return updated;
  }

  public getPayout(payoutId: string): MerchantPayoutBatchDTO | undefined {
    return this.payouts.get(payoutId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): MerchantPayoutEngineStateDTO {
    const record: Record<string, MerchantPayoutBatchDTO> = {};
    this.payouts.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      defaultPlatformFeePercent: this.defaultPlatformFeePercent,
      defaultReservePercent: this.defaultReservePercent,
      payouts: record
    };
  }

  public importState(state: MerchantPayoutEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.payouts.clear();
    Object.entries(state.payouts || {}).forEach(([k, v]) => {
      this.payouts.set(k, v);
    });
  }
}
