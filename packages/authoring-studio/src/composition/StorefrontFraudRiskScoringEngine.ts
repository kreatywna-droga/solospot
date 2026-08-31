/**
 * StorefrontFraudRiskScoringEngine.ts — Sprint G1-112 Fraud Risk Scoring Engine (Night Shift Level 74)
 *
 * Provides pure TypeScript, headless transaction risk scoring, velocity heuristic evaluation,
 * suspicious email domain detection, high-risk order flagging, and challenge recommendations.
 *
 * External risk databases (MaxMind, Sift, Radar) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type FraudRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RecommendedFraudAction = 'ALLOW' | 'REQUEST_3DS_CHALLENGE' | 'HOLD_FOR_MANUAL_REVIEW' | 'BLOCK_TRANSACTION';

export interface FraudRiskSignalDTO {
  readonly signalName: string;
  readonly scoreContribution: number; // 0 to 100
  readonly description: string;
}

export interface FraudEvaluationResultDTO {
  readonly orderId: string;
  readonly tenantId: string;
  readonly totalRiskScore: number; // 0 to 100
  readonly riskLevel: FraudRiskLevel;
  readonly recommendedAction: RecommendedFraudAction;
  readonly triggeredSignals: ReadonlyArray<FraudRiskSignalDTO>;
  readonly evaluatedAtMs: number;
}

export interface FraudRiskScoringEngineStateDTO {
  readonly tenantId: string;
  readonly highRiskThresholdScore: number;
  readonly criticalRiskThresholdScore: number;
  readonly evaluations: Record<string, FraudEvaluationResultDTO>; // orderId -> evaluation
}

export class StorefrontFraudRiskScoringEngine {
  private readonly tenantId: string;
  private readonly highRiskThresholdScore: number;
  private readonly criticalRiskThresholdScore: number;
  private evaluations: Map<string, FraudEvaluationResultDTO> = new Map();

  private static readonly DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'dispostable.com'
  ]);

  constructor(
    tenantId = 'default_tenant',
    highRiskThresholdScore = 40,
    criticalRiskThresholdScore = 75
  ) {
    this.tenantId = tenantId;
    this.highRiskThresholdScore = highRiskThresholdScore;
    this.criticalRiskThresholdScore = criticalRiskThresholdScore;
  }

  /**
   * Adds a new disposable email domain to the blocklist (G1-154 HARDEN).
   */
  public addDisposableEmailDomain(domain: string): void {
    if (domain) {
      StorefrontFraudRiskScoringEngine.DISPOSABLE_EMAIL_DOMAINS.add(domain.trim().toLowerCase());
    }
  }



  /**
   * Evaluates order metadata against fraud heuristics to compute an overall risk score.
   */
  public evaluateOrderRisk(params: {
    orderId: string;
    customerEmail: string;
    orderAmount: number;
    billingCountryCode: string;
    shippingCountryCode: string;
    clientIpBoundary?: string;
    cardCountryCode?: string;
    recentOrdersCountInLastHour?: number;
  }): FraudEvaluationResultDTO {
    const { orderId, customerEmail, orderAmount, billingCountryCode, shippingCountryCode } = params;

    if (!orderId || !customerEmail || orderAmount < 0) {
      throw new Error('Invalid fraud evaluation parameters: orderId, customerEmail, and positive orderAmount are required');
    }

    const signals: FraudRiskSignalDTO[] = [];
    let totalRiskScore = 0;

    // Signal 1: Country Mismatch (Billing vs Shipping)
    if (billingCountryCode.toUpperCase() !== shippingCountryCode.toUpperCase()) {
      const contrib = 20;
      totalRiskScore += contrib;
      signals.push({
        signalName: 'COUNTRY_MISMATCH_BILLING_VS_SHIPPING',
        scoreContribution: contrib,
        description: `Billing country (${billingCountryCode}) differs from shipping country (${shippingCountryCode})`
      });
    }

    // Signal 2: Card Country Mismatch
    if (params.cardCountryCode && params.cardCountryCode.toUpperCase() !== billingCountryCode.toUpperCase()) {
      const contrib = 25;
      totalRiskScore += contrib;
      signals.push({
        signalName: 'CARD_COUNTRY_MISMATCH',
        scoreContribution: contrib,
        description: `Credit card issued in ${params.cardCountryCode} used for billing address in ${billingCountryCode}`
      });
    }

    // Signal 3: Disposable / Temporary Email Domain
    const emailDomain = customerEmail.split('@')[1]?.toLowerCase();
    if (emailDomain && StorefrontFraudRiskScoringEngine.DISPOSABLE_EMAIL_DOMAINS.has(emailDomain)) {
      const contrib = 35;
      totalRiskScore += contrib;
      signals.push({
        signalName: 'DISPOSABLE_EMAIL_DOMAIN',
        scoreContribution: contrib,
        description: `Order placed using known temporary email provider (${emailDomain})`
      });
    }

    // Signal 4: Velocity Burst (High order frequency in 1 hour)
    const velocity = params.recentOrdersCountInLastHour ?? 1;
    if (velocity > 5) {
      const contrib = 30;
      totalRiskScore += contrib;
      signals.push({
        signalName: 'HIGH_IP_ORDER_VELOCITY',
        scoreContribution: contrib,
        description: `High transaction velocity detected: ${velocity} orders in last 60 minutes`
      });
    }

    // Signal 5: Unusually High Transaction Amount
    if (orderAmount > 5000) {
      const contrib = 15;
      totalRiskScore += contrib;
      signals.push({
        signalName: 'HIGH_VALUE_TRANSACTION',
        scoreContribution: contrib,
        description: `Order amount (${orderAmount}) exceeds high-value verification threshold`
      });
    }

    // Cap total score at 100
    totalRiskScore = Math.min(100, totalRiskScore);

    let riskLevel: FraudRiskLevel = 'LOW';
    let recommendedAction: RecommendedFraudAction = 'ALLOW';

    if (totalRiskScore >= this.criticalRiskThresholdScore) {
      riskLevel = 'CRITICAL';
      recommendedAction = 'BLOCK_TRANSACTION';
    } else if (totalRiskScore >= this.highRiskThresholdScore) {
      riskLevel = 'HIGH';
      recommendedAction = 'HOLD_FOR_MANUAL_REVIEW';
    } else if (totalRiskScore >= 20) {
      riskLevel = 'MEDIUM';
      recommendedAction = 'REQUEST_3DS_CHALLENGE';
    }

    const result: FraudEvaluationResultDTO = {
      orderId: orderId.trim(),
      tenantId: this.tenantId,
      totalRiskScore,
      riskLevel,
      recommendedAction,
      triggeredSignals: signals,
      evaluatedAtMs: Date.now()
    };

    this.evaluations.set(orderId.trim(), result);
    return result;
  }

  /**
   * Enforces strict [0, 100] percentage bounds clamping on custom risk score inputs (G1-178 RECOVER).
   */
  public evaluateCustomRiskScoreWithClamping(rawScore: number): {
    clampedScore: number;
    riskLevel: FraudRiskLevel;
  } {
    const clampedScore = Math.max(0, Math.min(100, Math.round(rawScore)));
    let riskLevel: FraudRiskLevel = 'LOW';
    if (clampedScore >= this.criticalRiskThresholdScore) {
      riskLevel = 'CRITICAL';
    } else if (clampedScore >= this.highRiskThresholdScore) {
      riskLevel = 'HIGH';
    } else if (clampedScore >= 20) {
      riskLevel = 'MEDIUM';
    }
    return { clampedScore, riskLevel };
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public getEvaluation(orderId: string): FraudEvaluationResultDTO | undefined {
    return this.evaluations.get(orderId.trim());
  }

  public exportState(): FraudRiskScoringEngineStateDTO {
    const record: Record<string, FraudEvaluationResultDTO> = {};
    this.evaluations.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      highRiskThresholdScore: this.highRiskThresholdScore,
      criticalRiskThresholdScore: this.criticalRiskThresholdScore,
      evaluations: record
    };
  }

  public importState(state: FraudRiskScoringEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.evaluations.clear();
    Object.entries(state.evaluations || {}).forEach(([k, v]) => {
      this.evaluations.set(k, v);
    });
  }
}
