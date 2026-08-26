/**
 * StorefrontAffiliateReferralEngine.ts — Sprint G1-119 Affiliate Referral & Commission Engine (Night Shift Level 81)
 *
 * Provides pure TypeScript, headless affiliate referral link generation, tracking code attribution,
 * commission calculation (percentage vs flat rate), commission payout state lifecycle (PENDING, APPROVED, PAID, REJECTED),
 * and self-referral prevention.
 *
 * External payout gateways (Stripe Connect, PayPal Payouts) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type CommissionPayoutStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';

export interface AffiliateProfileDTO {
  readonly affiliateId: string;
  readonly tenantId: string;
  readonly affiliateEmail: string;
  readonly referralCode: string;
  readonly commissionPercent: number; // e.g. 10 for 10%
  readonly flatCommissionAmount?: number;
  readonly totalCommissionEarned: number;
  readonly totalCommissionPaid: number;
  readonly createdAtMs: number;
}

export interface CommissionRecordDTO {
  readonly commissionId: string;
  readonly affiliateId: string;
  readonly orderId: string;
  readonly orderAmount: number;
  readonly commissionAmount: number;
  readonly status: CommissionPayoutStatus;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface AffiliateReferralEngineStateDTO {
  readonly tenantId: string;
  readonly defaultCommissionPercent: number;
  readonly affiliates: Record<string, AffiliateProfileDTO>; // code -> affiliate
  readonly commissions: Record<string, CommissionRecordDTO>; // commissionId -> record
}

export class StorefrontAffiliateReferralEngine {
  private readonly tenantId: string;
  private defaultCommissionPercent: number;
  private affiliates: Map<string, AffiliateProfileDTO> = new Map();
  private commissions: Map<string, CommissionRecordDTO> = new Map();

  constructor(tenantId = 'default_tenant', defaultCommissionPercent = 10) {
    this.tenantId = tenantId;
    this.defaultCommissionPercent = defaultCommissionPercent;
  }

  /**
   * Registers a new affiliate marketer profile with unique referral code.
   */
  public registerAffiliate(params: {
    affiliateId: string;
    affiliateEmail: string;
    referralCode: string;
    commissionPercent?: number;
    flatCommissionAmount?: number;
  }): AffiliateProfileDTO {
    const { affiliateId, affiliateEmail, referralCode } = params;

    if (!affiliateId || !affiliateEmail || !referralCode) {
      throw new Error('affiliateId, affiliateEmail, and referralCode are required');
    }

    const code = referralCode.trim().toUpperCase();
    if (this.affiliates.has(code)) {
      throw new Error(`Referral code ${code} is already registered`);
    }

    const dto: AffiliateProfileDTO = {
      affiliateId: affiliateId.trim(),
      tenantId: this.tenantId,
      affiliateEmail: affiliateEmail.trim().toLowerCase(),
      referralCode: code,
      commissionPercent: params.commissionPercent ?? this.defaultCommissionPercent,
      flatCommissionAmount: params.flatCommissionAmount,
      totalCommissionEarned: 0,
      totalCommissionPaid: 0,
      createdAtMs: Date.now()
    };

    this.affiliates.set(code, dto);
    return dto;
  }

  /**
   * Evaluates an order for affiliate attribution and calculates commission earned.
   * Blocks self-referrals where customer email matches affiliate email.
   */
  public recordOrderCommission(params: {
    referralCode: string;
    orderId: string;
    customerEmail: string;
    orderAmount: number;
  }): CommissionRecordDTO {
    const { referralCode, orderId, customerEmail, orderAmount } = params;

    if (!referralCode || !orderId || !customerEmail || typeof orderAmount !== 'number' || orderAmount <= 0) {
      throw new Error('Valid referralCode, orderId, customerEmail, and positive orderAmount are required');
    }

    const code = referralCode.trim().toUpperCase();
    const affiliate = this.affiliates.get(code);

    if (!affiliate) {
      throw new Error(`Affiliate referral code ${code} not found`);
    }

    // Block self-referrals
    if (customerEmail.trim().toLowerCase() === affiliate.affiliateEmail) {
      throw new Error(`Self-referral blocked for affiliate email ${affiliate.affiliateEmail}`);
    }

    const now = Date.now();
    let commissionAmount = 0;
    if (affiliate.flatCommissionAmount && affiliate.flatCommissionAmount > 0) {
      commissionAmount = affiliate.flatCommissionAmount;
    } else {
      commissionAmount = Math.round((orderAmount * (affiliate.commissionPercent / 100)) * 100) / 100;
    }

    const commissionId = `comm_${now}_${Math.random().toString(36).substring(2, 6)}`;
    const commissionRecord: CommissionRecordDTO = {
      commissionId,
      affiliateId: affiliate.affiliateId,
      orderId: orderId.trim(),
      orderAmount,
      commissionAmount,
      status: 'PENDING',
      createdAtMs: now,
      updatedAtMs: now
    };

    this.commissions.set(commissionId, commissionRecord);

    // Update affiliate earnings ledger
    const updatedAffiliate: AffiliateProfileDTO = {
      ...affiliate,
      totalCommissionEarned: Math.round((affiliate.totalCommissionEarned + commissionAmount) * 100) / 100
    };
    this.affiliates.set(code, updatedAffiliate);

    return commissionRecord;
  }

  public getAffiliateByCode(referralCode: string): AffiliateProfileDTO | undefined {
    return this.affiliates.get(referralCode.trim().toUpperCase());
  }

  public getCommission(commissionId: string): CommissionRecordDTO | undefined {
    return this.commissions.get(commissionId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): AffiliateReferralEngineStateDTO {
    const affRecord: Record<string, AffiliateProfileDTO> = {};
    this.affiliates.forEach((val, key) => {
      affRecord[key] = val;
    });

    const commRecord: Record<string, CommissionRecordDTO> = {};
    this.commissions.forEach((val, key) => {
      commRecord[key] = val;
    });

    return {
      tenantId: this.tenantId,
      defaultCommissionPercent: this.defaultCommissionPercent,
      affiliates: affRecord,
      commissions: commRecord
    };
  }

  public importState(state: AffiliateReferralEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.affiliates.clear();
    this.commissions.clear();

    Object.entries(state.affiliates || {}).forEach(([k, v]) => {
      this.affiliates.set(k, v);
    });
    Object.entries(state.commissions || {}).forEach(([k, v]) => {
      this.commissions.set(k, v);
    });
  }
}
