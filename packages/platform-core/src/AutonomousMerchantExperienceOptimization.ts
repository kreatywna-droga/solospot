/**
 * AutonomousMerchantExperienceOptimization — G1-217
 *
 * Autonomous merchant experience optimization: evaluates UX quality
 * across dashboard, inventory, orders, analytics, and support areas,
 * identifies pain points, and suggests improvements.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MerchantArea =
  | 'DASHBOARD'
  | 'INVENTORY'
  | 'ORDERS'
  | 'ANALYTICS'
  | 'SUPPORT';

export interface MerchantExperienceMetric {
  readonly metricId: string;
  readonly area: MerchantArea;
  readonly satisfactionScore: number;
  readonly usabilityScore: number;
  readonly improvementSuggestion: string;
}

export interface UXImprovement {
  readonly metricId: string;
  readonly area: MerchantArea;
  readonly suggestion: string;
  readonly estimatedImpact: number;
}

export interface ExperienceImpact {
  readonly metricId: string;
  readonly area: MerchantArea;
  readonly currentSatisfaction: number;
  readonly estimatedSatisfactionGain: number;
}

export interface PrioritizedImprovement {
  readonly metricId: string;
  readonly area: MerchantArea;
  readonly priorityScore: number;
  readonly suggestion: string;
}

export interface MerchantUXReport {
  readonly reportId: string;
  readonly timestamp: string;
  readonly metricsEvaluated: number;
  readonly painPoints: readonly MerchantExperienceMetric[];
  readonly improvements: readonly UXImprovement[];
  readonly experienceImpacts: readonly ExperienceImpact[];
  readonly prioritized: readonly PrioritizedImprovement[];
  readonly overallUXScore: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_ID = 'G1-217';
const PAIN_POINT_THRESHOLD = 70;

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class AutonomousMerchantExperienceOptimizer {
  private _lastReport: MerchantUXReport | null = null;

  evaluateMerchantExperience(metrics: readonly MerchantExperienceMetric[]): {
    readonly totalMetrics: number;
    readonly averageSatisfaction: number;
    readonly averageUsability: number;
    readonly areaScores: ReadonlyMap<MerchantArea, number>;
  } {
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageSatisfaction: 0,
        averageUsability: 0,
        areaScores: new Map(),
      };
    }

    const totalSat = metrics.reduce((s, m) => s + m.satisfactionScore, 0);
    const totalUsab = metrics.reduce((s, m) => s + m.usabilityScore, 0);
    const areaScores = new Map<MerchantArea, number>();

    for (const m of metrics) {
      const avg = (m.satisfactionScore + m.usabilityScore) / 2;
      areaScores.set(m.area, avg);
    }

    return {
      totalMetrics: metrics.length,
      averageSatisfaction: totalSat / metrics.length,
      averageUsability: totalUsab / metrics.length,
      areaScores,
    };
  }

  identifyPainPoints(metrics: readonly MerchantExperienceMetric[]): readonly MerchantExperienceMetric[] {
    return metrics
      .filter((m) => m.satisfactionScore < PAIN_POINT_THRESHOLD || m.usabilityScore < PAIN_POINT_THRESHOLD)
      .sort((a, b) => a.satisfactionScore - b.satisfactionScore);
  }

  suggestUXImprovements(metrics: readonly MerchantExperienceMetric[]): readonly UXImprovement[] {
    return metrics
      .filter((m) => m.satisfactionScore < PAIN_POINT_THRESHOLD || m.usabilityScore < PAIN_POINT_THRESHOLD)
      .map((m) => ({
        metricId: m.metricId,
        area: m.area,
        suggestion: m.improvementSuggestion,
        estimatedImpact: (100 - m.satisfactionScore) * 0.3 + (100 - m.usabilityScore) * 0.2,
      }));
  }

  calculateExperienceImpact(metric: MerchantExperienceMetric): ExperienceImpact {
    const estimatedSatisfactionGain = (100 - metric.satisfactionScore) * 0.25;
    return {
      metricId: metric.metricId,
      area: metric.area,
      currentSatisfaction: metric.satisfactionScore,
      estimatedSatisfactionGain,
    };
  }

  prioritizeImprovements(metrics: readonly MerchantExperienceMetric[]): readonly PrioritizedImprovement[] {
    return metrics
      .map((m) => ({
        metricId: m.metricId,
        area: m.area,
        priorityScore: (100 - m.satisfactionScore) * 0.6 + (100 - m.usabilityScore) * 0.4,
        suggestion: m.improvementSuggestion,
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  generateMerchantUXReport(
    metrics: readonly MerchantExperienceMetric[] = [],
  ): MerchantUXReport {
    const evaluation = this.evaluateMerchantExperience(metrics);
    const painPoints = this.identifyPainPoints(metrics);
    const improvements = this.suggestUXImprovements(metrics);
    const experienceImpacts = metrics.map((m) => this.calculateExperienceImpact(m));
    const prioritized = this.prioritizeImprovements(metrics);

    const overallUXScore =
      metrics.length === 0
        ? 100
        : Math.round(
            metrics.reduce((s, m) => s + (m.satisfactionScore + m.usabilityScore) / 2, 0) /
              metrics.length,
          );

    const report: MerchantUXReport = {
      reportId: REPORT_ID,
      timestamp: new Date().toISOString(),
      metricsEvaluated: evaluation.totalMetrics,
      painPoints,
      improvements,
      experienceImpacts,
      prioritized,
      overallUXScore,
    };

    this._lastReport = report;
    return report;
  }
}
