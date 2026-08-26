/**
 * StorefrontAffiliateReferralPayoutEngine.ts — Sprint G1-168 Affiliate Referral Payout Engine (Night Shift Level 107)
 *
 * Provides pure TypeScript, headless affiliate referral link tracking, commission attribution
 * (PERCENTAGE vs FLAT_FEE), referral conversion verification, and affiliate ledger payouts.
 *
 * External affiliate networks (Impact, ShareASale) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type CommissionType = 'PERCENTAGE' | 'FLAT_FEE';

export interface AffiliatePartnerDTO {
  readonly affiliateId: string;
  readonly tenantId: string;
  readonly referralCode: string;
  readonly partnerEmail: string;
  readonly commissionType: CommissionType;
  readonly commissionValue: number; // e.g. 10 (%) or 15 ($)
  readonly accruedCommissionTotal: number;
  readonly status: 'ACTIVE' | 'SUSPENDED';
  readonly createdAtMs: number;
}

export interface ReferralConversionRecordDTO {
  readonly conversionId: string;
  readonly tenantId: string;
  readonly affiliateId: string;
  readonly referralCode: string;
  readonly orderId: string;
  readonly orderTotalAmount: number;
  readonly commissionEarned: number;
  readonly convertedAtMs: number;
}

export interface AffiliateReferralPayoutEngineStateDTO {
  readonly tenantId: string;
  readonly partners: Record<string, AffiliatePartnerDTO>;
  readonly conversions: Record<string, ReferralConversionRecordDTO>;
}

export class StorefrontAffiliateReferralPayoutEngine {
  private readonly tenantId: string;
  private partners: Map<string, AffiliatePartnerDTO> = new Map();
  private conversions: Map<string, ReferralConversionRecordDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers a new affiliate partner.
   */
  public registerAffiliatePartner(params: {
    affiliateId: string;
    referralCode: string;
    partnerEmail: string;
    commissionType?: CommissionType;
    commissionValue?: number;
  }): AffiliatePartnerDTO {
    const { affiliateId, referralCode, partnerEmail } = params;

    if (!affiliateId || !referralCode || !partnerEmail) {
      throw new Error('affiliateId, referralCode, and partnerEmail are required');
    }

    const cleanCode = referralCode.trim().toUpperCase();
    const now = Date.now();

    const dto: AffiliatePartnerDTO = {
      affiliateId: affiliateId.trim(),
      tenantId: this.tenantId,
      referralCode: cleanCode,
      partnerEmail: partnerEmail.trim(),
      commissionType: params.commissionType ?? 'PERCENTAGE',
      commissionValue: params.commissionValue ?? 10,
      accruedCommissionTotal: 0,
      status: 'ACTIVE',
      createdAtMs: now
    };

    this.partners.set(cleanCode, dto);
    return dto;
  }

  /**
   * Tracks a successful purchase conversion attributed to an affiliate referral code.
   */
  public recordReferralConversion(params: {
    conversionId: string;
    referralCode: string;
    orderId: string;
    orderTotalAmount: number;
  }): ReferralConversionRecordDTO {
    const { conversionId, referralCode, orderId, orderTotalAmount } = params;

    if (!conversionId || !referralCode || !orderId || typeof orderTotalAmount !== 'number' || orderTotalAmount <= 0) {
      throw new Error('Valid conversionId, referralCode, orderId, and positive orderTotalAmount are required');
    }

    const cleanCode = referralCode.trim().toUpperCase();
    const partner = this.partners.get(cleanCode);

    if (!partner || partner.status !== 'ACTIVE') {
      throw new Error(`Active affiliate partner for code ${cleanCode} not found`);
    }

    let commissionEarned = 0;
    if (partner.commissionType === 'PERCENTAGE') {
      commissionEarned = Math.round((orderTotalAmount * (partner.commissionValue / 100)) * 100) / 100;
    } else {
      commissionEarned = partner.commissionValue;
    }

    const now = Date.now();
    const dto: ReferralConversionRecordDTO = {
      conversionId: conversionId.trim(),
      tenantId: this.tenantId,
      affiliateId: partner.affiliateId,
      referralCode: cleanCode,
      orderId: orderId.trim(),
      orderTotalAmount,
      commissionEarned,
      convertedAtMs: now
    };

    const updatedPartner: AffiliatePartnerDTO = {
      ...partner,
      accruedCommissionTotal: Math.round((partner.accruedCommissionTotal + commissionEarned) * 100) / 100
    };

    this.partners.set(cleanCode, updatedPartner);
    this.conversions.set(dto.conversionId, dto);
    return dto;
  }

  public getPartnerByCode(referralCode: string): AffiliatePartnerDTO | undefined {
    return this.partners.get(referralCode.trim().toUpperCase());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): AffiliateReferralPayoutEngineStateDTO {
    const pRecord: Record<string, AffiliatePartnerDTO> = {};
    this.partners.forEach((val, key) => { pRecord[key] = val; });

    const cRecord: Record<string, ReferralConversionRecordDTO> = {};
    this.conversions.forEach((val, key) => { cRecord[key] = val; });

    return {
      tenantId: this.tenantId,
      partners: pRecord,
      conversions: cRecord
    };
  }

  public importState(state: AffiliateReferralPayoutEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.partners.clear();
    this.conversions.clear();
    Object.entries(state.partners || {}).forEach(([k, v]) => { this.partners.set(k, v); });
    Object.entries(state.conversions || {}).forEach(([k, v]) => { this.conversions.set(k, v); });
  }
}
