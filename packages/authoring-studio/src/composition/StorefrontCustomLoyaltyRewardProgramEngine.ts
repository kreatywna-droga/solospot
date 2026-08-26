/**
 * StorefrontCustomLoyaltyRewardProgramEngine.ts — Sprint G1-175 Customer Loyalty Reward Program Engine (Night Shift Level 109)
 *
 * Provides pure TypeScript, headless customer loyalty point ledgers (EARNED, REDEEMED, EXPIRED),
 * points accrual calculation with tier multipliers, and point redemption threshold vouchers.
 *
 * External loyalty platforms (Smile.io, Yotpo) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type LoyaltyTransactionType = 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'ADJUSTED';

export interface LoyaltyPointLedgerEntryDTO {
  readonly entryId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly orderId?: string;
  readonly transactionType: LoyaltyTransactionType;
  readonly pointsAmount: number;
  readonly balanceAfter: number;
  readonly timestampMs: number;
}

export interface CustomerLoyaltyAccountDTO {
  readonly customerId: string;
  readonly tenantId: string;
  readonly currentPointsBalance: number;
  readonly lifetimePointsEarned: number;
  readonly tierMultiplier: number;
  readonly lastUpdatedMs: number;
}

export interface CustomLoyaltyRewardProgramEngineStateDTO {
  readonly tenantId: string;
  readonly pointsPerCurrencyUnit: number;
  readonly accounts: Record<string, CustomerLoyaltyAccountDTO>;
}

export class StorefrontCustomLoyaltyRewardProgramEngine {
  private readonly tenantId: string;
  private pointsPerCurrencyUnit: number;
  private accounts: Map<string, CustomerLoyaltyAccountDTO> = new Map();
  private ledger: Map<string, LoyaltyPointLedgerEntryDTO> = new Map();

  constructor(tenantId = 'default_tenant', pointsPerCurrencyUnit = 1) {
    this.tenantId = tenantId;
    this.pointsPerCurrencyUnit = pointsPerCurrencyUnit;
  }

  /**
   * Accrues loyalty points for a completed order.
   */
  public earnPointsForOrder(params: {
    entryId: string;
    customerId: string;
    orderId: string;
    orderTotalAmount: number;
    tierMultiplier?: number;
  }): CustomerLoyaltyAccountDTO {
    const { entryId, customerId, orderId, orderTotalAmount } = params;

    if (!entryId || !customerId || !orderId || typeof orderTotalAmount !== 'number' || orderTotalAmount <= 0) {
      throw new Error('Valid entryId, customerId, orderId, and positive orderTotalAmount are required');
    }

    const cleanCustomerId = customerId.trim();
    const existing = this.accounts.get(cleanCustomerId) ?? {
      customerId: cleanCustomerId,
      tenantId: this.tenantId,
      currentPointsBalance: 0,
      lifetimePointsEarned: 0,
      tierMultiplier: params.tierMultiplier ?? 1.0,
      lastUpdatedMs: Date.now()
    };

    const multiplier = params.tierMultiplier ?? existing.tierMultiplier;
    const earnedPoints = Math.floor(orderTotalAmount * this.pointsPerCurrencyUnit * multiplier);
    const newBalance = existing.currentPointsBalance + earnedPoints;
    const now = Date.now();

    const updatedAccount: CustomerLoyaltyAccountDTO = {
      ...existing,
      currentPointsBalance: newBalance,
      lifetimePointsEarned: existing.lifetimePointsEarned + earnedPoints,
      tierMultiplier: multiplier,
      lastUpdatedMs: now
    };

    const ledgerEntry: LoyaltyPointLedgerEntryDTO = {
      entryId: entryId.trim(),
      tenantId: this.tenantId,
      customerId: cleanCustomerId,
      orderId: orderId.trim(),
      transactionType: 'EARNED',
      pointsAmount: earnedPoints,
      balanceAfter: newBalance,
      timestampMs: now
    };

    this.accounts.set(cleanCustomerId, updatedAccount);
    this.ledger.set(ledgerEntry.entryId, ledgerEntry);
    return updatedAccount;
  }

  /**
   * Redeems loyalty points for a discount voucher reward.
   */
  public redeemPoints(params: {
    entryId: string;
    customerId: string;
    pointsToRedeem: number;
  }): CustomerLoyaltyAccountDTO {
    const { entryId, customerId, pointsToRedeem } = params;

    if (!entryId || !customerId || pointsToRedeem <= 0) {
      throw new Error('Valid entryId, customerId, and positive pointsToRedeem are required');
    }

    const cleanCustomerId = customerId.trim();
    const account = this.accounts.get(cleanCustomerId);

    if (!account || account.currentPointsBalance < pointsToRedeem) {
      throw new Error(`Insufficient loyalty point balance for customer ${cleanCustomerId}`);
    }

    const newBalance = account.currentPointsBalance - pointsToRedeem;
    const now = Date.now();

    const updatedAccount: CustomerLoyaltyAccountDTO = {
      ...account,
      currentPointsBalance: newBalance,
      lastUpdatedMs: now
    };

    const ledgerEntry: LoyaltyPointLedgerEntryDTO = {
      entryId: entryId.trim(),
      tenantId: this.tenantId,
      customerId: cleanCustomerId,
      transactionType: 'REDEEMED',
      pointsAmount: -pointsToRedeem,
      balanceAfter: newBalance,
      timestampMs: now
    };

    this.accounts.set(cleanCustomerId, updatedAccount);
    this.ledger.set(ledgerEntry.entryId, ledgerEntry);
    return updatedAccount;
  }

  public getAccount(customerId: string): CustomerLoyaltyAccountDTO | undefined {
    return this.accounts.get(customerId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CustomLoyaltyRewardProgramEngineStateDTO {
    const accRecord: Record<string, CustomerLoyaltyAccountDTO> = {};
    this.accounts.forEach((val, key) => { accRecord[key] = val; });

    return {
      tenantId: this.tenantId,
      pointsPerCurrencyUnit: this.pointsPerCurrencyUnit,
      accounts: accRecord
    };
  }

  public importState(state: CustomLoyaltyRewardProgramEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.accounts.clear();
    Object.entries(state.accounts || {}).forEach(([k, v]) => { this.accounts.set(k, v); });
  }
}
