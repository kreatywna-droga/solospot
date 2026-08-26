/**
 * StorefrontCustomerSegmentationEngine.ts — Sprint G1-117 RFM Customer Segmentation Engine (Night Shift Level 79)
 *
 * Provides pure TypeScript, headless RFM (Recency, Frequency, Monetary) customer segmentation,
 * automated customer tier assignment (VIP, REGULAR, AT_RISK, NEW_VISITOR, CHURNED),
 * and dynamic tag management.
 *
 * External CDP APIs (Klaviyo, Segment, HubSpot) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type CustomerSegmentTier = 'VIP' | 'REGULAR' | 'AT_RISK' | 'NEW_VISITOR' | 'CHURNED';

export interface CustomerRfmScoreDTO {
  readonly customerId: string;
  readonly tenantId: string;
  readonly recencyDays: number; // Days since last purchase
  readonly frequencyCount: number; // Total order count
  readonly totalMonetarySpent: number; // Total spent amount
  readonly rfmScore: number; // Composite score 1-15
  readonly assignedTier: CustomerSegmentTier;
  readonly tags: ReadonlyArray<string>;
  readonly evaluatedAtMs: number;
}

export interface CustomerSegmentationEngineStateDTO {
  readonly tenantId: string;
  readonly vipMonetaryThreshold: number;
  readonly vipFrequencyThreshold: number;
  readonly atRiskRecencyDaysThreshold: number;
  readonly customerScores: Record<string, CustomerRfmScoreDTO>; // customerId -> score
}

export class StorefrontCustomerSegmentationEngine {
  private readonly tenantId: string;
  private vipMonetaryThreshold: number;
  private vipFrequencyThreshold: number;
  private atRiskRecencyDaysThreshold: number;
  private customerScores: Map<string, CustomerRfmScoreDTO> = new Map();

  constructor(
    tenantId = 'default_tenant',
    vipMonetaryThreshold = 1000,
    vipFrequencyThreshold = 5,
    atRiskRecencyDaysThreshold = 90
  ) {
    this.tenantId = tenantId;
    this.vipMonetaryThreshold = vipMonetaryThreshold;
    this.vipFrequencyThreshold = vipFrequencyThreshold;
    this.atRiskRecencyDaysThreshold = atRiskRecencyDaysThreshold;
  }

  /**
   * Evaluates customer purchase metrics to compute composite RFM score and assign segment tier.
   */
  public evaluateCustomerSegment(params: {
    customerId: string;
    recencyDays: number;
    frequencyCount: number;
    totalMonetarySpent: number;
    customTags?: ReadonlyArray<string>;
  }): CustomerRfmScoreDTO {
    const { customerId, recencyDays, frequencyCount, totalMonetarySpent } = params;

    if (!customerId || recencyDays < 0 || frequencyCount < 0 || totalMonetarySpent < 0) {
      throw new Error('Valid customerId and non-negative recency, frequency, and monetary metrics are required');
    }

    const cleanCustomerId = customerId.trim();

    // 1. Recency Score (1-5, lower recencyDays = higher score)
    let rScore = 1;
    if (recencyDays <= 7) rScore = 5;
    else if (recencyDays <= 30) rScore = 4;
    else if (recencyDays <= 60) rScore = 3;
    else if (recencyDays <= 90) rScore = 2;

    // 2. Frequency Score (1-5)
    let fScore = 1;
    if (frequencyCount >= 10) fScore = 5;
    else if (frequencyCount >= 5) fScore = 4;
    else if (frequencyCount >= 3) fScore = 3;
    else if (frequencyCount >= 2) fScore = 2;

    // 3. Monetary Score (1-5)
    let mScore = 1;
    if (totalMonetarySpent >= 2000) mScore = 5;
    else if (totalMonetarySpent >= 1000) mScore = 4;
    else if (totalMonetarySpent >= 500) mScore = 3;
    else if (totalMonetarySpent >= 200) mScore = 2;

    const rfmScore = rScore + fScore + mScore; // Range 3 - 15

    // 4. Tier Assignment Heuristics
    let assignedTier: CustomerSegmentTier = 'REGULAR';
    const tags: string[] = params.customTags ? [...params.customTags] : [];

    if (frequencyCount === 0) {
      assignedTier = 'NEW_VISITOR';
    } else if (totalMonetarySpent >= this.vipMonetaryThreshold || frequencyCount >= this.vipFrequencyThreshold) {
      assignedTier = 'VIP';
      if (!tags.includes('VIP_CUSTOMER')) tags.push('VIP_CUSTOMER');
    } else if (recencyDays > 180) {
      assignedTier = 'CHURNED';
      if (!tags.includes('CHURNED')) tags.push('CHURNED');
    } else if (recencyDays > this.atRiskRecencyDaysThreshold) {
      assignedTier = 'AT_RISK';
      if (!tags.includes('REENGAGEMENT_TARGET')) tags.push('REENGAGEMENT_TARGET');
    }

    const dto: CustomerRfmScoreDTO = {
      customerId: cleanCustomerId,
      tenantId: this.tenantId,
      recencyDays,
      frequencyCount,
      totalMonetarySpent,
      rfmScore,
      assignedTier,
      tags,
      evaluatedAtMs: Date.now()
    };

    this.customerScores.set(cleanCustomerId, dto);
    return dto;
  }

  public getCustomerScore(customerId: string): CustomerRfmScoreDTO | undefined {
    return this.customerScores.get(customerId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CustomerSegmentationEngineStateDTO {
    const record: Record<string, CustomerRfmScoreDTO> = {};
    this.customerScores.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      vipMonetaryThreshold: this.vipMonetaryThreshold,
      vipFrequencyThreshold: this.vipFrequencyThreshold,
      atRiskRecencyDaysThreshold: this.atRiskRecencyDaysThreshold,
      customerScores: record
    };
  }

  public importState(state: CustomerSegmentationEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.customerScores.clear();
    Object.entries(state.customerScores || {}).forEach(([k, v]) => {
      this.customerScores.set(k, v);
    });
  }
}
