/**
 * StorefrontCustomerFeedbackSurveyEngine.ts — Sprint G1-125 Customer CSAT/NPS Feedback Engine (Night Shift Level 87)
 *
 * Provides pure TypeScript, headless post-purchase customer feedback collection,
 * Net Promoter Score (NPS -100 to +100) aggregation, CSAT average calculation,
 * and promoter/detractor classification.
 *
 * External survey APIs (Delighted, Trustpilot, Qualtrics) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export interface FeedbackSubmissionDTO {
  readonly feedbackId: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly npsScore: number; // 0 to 10
  readonly csatScore?: number; // 1 to 5
  readonly comment?: string;
  readonly submittedAtMs: number;
}

export interface NpsAggregateReportDTO {
  readonly tenantId: string;
  readonly totalSubmissions: number;
  readonly promotersCount: number; // NPS 9-10
  readonly passivesCount: number; // NPS 7-8
  readonly detractorsCount: number; // NPS 0-6
  readonly npsScore: number; // -100 to +100
  readonly averageCsatScore: number;
  readonly calculatedAtMs: number;
}

export interface CustomerFeedbackSurveyEngineStateDTO {
  readonly tenantId: string;
  readonly submissions: Record<string, FeedbackSubmissionDTO>; // feedbackId -> submission
}

export class StorefrontCustomerFeedbackSurveyEngine {
  private readonly tenantId: string;
  private submissions: Map<string, FeedbackSubmissionDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Submits a customer CSAT / NPS feedback response.
   */
  public submitFeedback(params: {
    feedbackId: string;
    orderId: string;
    customerId: string;
    npsScore: number;
    csatScore?: number;
    comment?: string;
  }): FeedbackSubmissionDTO {
    const { feedbackId, orderId, customerId, npsScore } = params;

    if (!feedbackId || !orderId || !customerId) {
      throw new Error('feedbackId, orderId, and customerId are required');
    }

    if (typeof npsScore !== 'number' || npsScore < 0 || npsScore > 10) {
      throw new Error('npsScore must be an integer between 0 and 10');
    }

    if (params.csatScore !== undefined && (params.csatScore < 1 || params.csatScore > 5)) {
      throw new Error('csatScore must be an integer between 1 and 5');
    }

    const now = Date.now();
    const dto: FeedbackSubmissionDTO = {
      feedbackId: feedbackId.trim(),
      tenantId: this.tenantId,
      orderId: orderId.trim(),
      customerId: customerId.trim(),
      npsScore: Math.round(npsScore),
      csatScore: params.csatScore ? Math.round(params.csatScore) : undefined,
      comment: params.comment ? params.comment.trim() : undefined,
      submittedAtMs: now
    };

    this.submissions.set(dto.feedbackId, dto);
    return dto;
  }

  /**
   * Calculates overall NPS aggregate metrics (% Promoters - % Detractors).
   */
  public calculateNpsReport(): NpsAggregateReportDTO {
    const all = Array.from(this.submissions.values());
    const totalSubmissions = all.length;

    if (totalSubmissions === 0) {
      return {
        tenantId: this.tenantId,
        totalSubmissions: 0,
        promotersCount: 0,
        passivesCount: 0,
        detractorsCount: 0,
        npsScore: 0,
        averageCsatScore: 0,
        calculatedAtMs: Date.now()
      };
    }

    let promotersCount = 0;
    let passivesCount = 0;
    let detractorsCount = 0;
    let totalCsatSum = 0;
    let csatCount = 0;

    for (const sub of all) {
      if (sub.npsScore >= 9) promotersCount++;
      else if (sub.npsScore >= 7) passivesCount++;
      else detractorsCount++;

      if (sub.csatScore !== undefined) {
        totalCsatSum += sub.csatScore;
        csatCount++;
      }
    }

    const promoterPct = (promotersCount / totalSubmissions) * 100;
    const detractorPct = (detractorsCount / totalSubmissions) * 100;
    const npsScore = Math.round(promoterPct - detractorPct);
    const averageCsatScore = csatCount > 0 ? Math.round((totalCsatSum / csatCount) * 100) / 100 : 0;

    return {
      tenantId: this.tenantId,
      totalSubmissions,
      promotersCount,
      passivesCount,
      detractorsCount,
      npsScore,
      averageCsatScore,
      calculatedAtMs: Date.now()
    };
  }

  public getSubmission(feedbackId: string): FeedbackSubmissionDTO | undefined {
    return this.submissions.get(feedbackId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CustomerFeedbackSurveyEngineStateDTO {
    const record: Record<string, FeedbackSubmissionDTO> = {};
    this.submissions.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      submissions: record
    };
  }

  public importState(state: CustomerFeedbackSurveyEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.submissions.clear();
    Object.entries(state.submissions || {}).forEach(([k, v]) => {
      this.submissions.set(k, v);
    });
  }
}
