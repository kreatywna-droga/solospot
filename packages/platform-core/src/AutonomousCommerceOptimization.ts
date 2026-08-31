/**
 * AutonomousCommerceOptimization — G1-216
 *
 * Autonomous commerce optimization: analyzes conversion funnels,
 * identifies drop-off points, suggests A/B test candidates,
 * and estimates revenue impact.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FunnelStage =
  | 'DISCOVERY'
  | 'CONSIDERATION'
  | 'CHECKOUT'
  | 'PAYMENT'
  | 'FULFILLMENT';

export interface CommerceOptimizationMetric {
  readonly metricId: string;
  readonly funnelStage: FunnelStage;
  readonly conversionRate: number;
  readonly dropOffRate: number;
  readonly optimizationAction: string;
}

export interface DropOffPoint {
  readonly metricId: string;
  readonly stage: FunnelStage;
  readonly dropOffRate: number;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface FunnelOptimization {
  readonly metricId: string;
  readonly stage: FunnelStage;
  readonly suggestedTest: string;
  readonly estimatedLift: number;
}

export interface RevenueImpact {
  readonly metricId: string;
  readonly currentRate: number;
  readonly improvement: number;
  readonly estimatedRevenueGain: number;
}

export interface PrioritizedOptimization {
  readonly metricId: string;
  readonly stage: FunnelStage;
  readonly priorityScore: number;
  readonly action: string;
}

export interface CommerceOptimizationReport {
  readonly reportId: string;
  readonly timestamp: string;
  readonly metricsAnalyzed: number;
  readonly dropOffPoints: readonly DropOffPoint[];
  readonly optimizations: readonly FunnelOptimization[];
  readonly revenueImpacts: readonly RevenueImpact[];
  readonly prioritized: readonly PrioritizedOptimization[];
  readonly overallOptimizationScore: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_ID = 'G1-216';

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class AutonomousCommerceOptimizer {
  private _lastReport: CommerceOptimizationReport | null = null;

  analyzeFunnelMetrics(metrics: readonly CommerceOptimizationMetric[]): {
    readonly totalMetrics: number;
    readonly averageConversionRate: number;
    readonly averageDropOffRate: number;
    readonly stageBreakdown: ReadonlyMap<FunnelStage, number>;
  } {
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageConversionRate: 0,
        averageDropOffRate: 0,
        stageBreakdown: new Map(),
      };
    }

    const totalConversion = metrics.reduce((s, m) => s + m.conversionRate, 0);
    const totalDropOff = metrics.reduce((s, m) => s + m.dropOffRate, 0);
    const stageBreakdown = new Map<FunnelStage, number>();

    for (const m of metrics) {
      stageBreakdown.set(m.funnelStage, (stageBreakdown.get(m.funnelStage) ?? 0) + 1);
    }

    return {
      totalMetrics: metrics.length,
      averageConversionRate: totalConversion / metrics.length,
      averageDropOffRate: totalDropOff / metrics.length,
      stageBreakdown,
    };
  }

  identifyDropOffPoints(metrics: readonly CommerceOptimizationMetric[]): readonly DropOffPoint[] {
    return metrics
      .map((m) => ({
        metricId: m.metricId,
        stage: m.funnelStage,
        dropOffRate: m.dropOffRate,
        severity: classifySeverity(m.dropOffRate),
      }))
      .sort((a, b) => b.dropOffRate - a.dropOffRate);
  }

  suggestFunnelOptimizations(metrics: readonly CommerceOptimizationMetric[]): readonly FunnelOptimization[] {
    return metrics
      .filter((m) => m.dropOffRate > 0.1)
      .map((m) => ({
        metricId: m.metricId,
        stage: m.funnelStage,
        suggestedTest: generateTestSuggestion(m.funnelStage),
        estimatedLift: estimateLift(m.dropOffRate),
      }));
  }

  calculateRevenueImpact(
    metric: CommerceOptimizationMetric,
    improvement: number,
  ): RevenueImpact {
    const estimatedRevenueGain = metric.conversionRate * improvement * 1000;
    return {
      metricId: metric.metricId,
      currentRate: metric.conversionRate,
      improvement,
      estimatedRevenueGain,
    };
  }

  prioritizeOptimizations(metrics: readonly CommerceOptimizationMetric[]): readonly PrioritizedOptimization[] {
    return metrics
      .map((m) => ({
        metricId: m.metricId,
        stage: m.funnelStage,
        priorityScore: m.dropOffRate * 100 + (1 - m.conversionRate) * 50,
        action: m.optimizationAction,
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  generateCommerceOptimizationReport(
    metrics: readonly CommerceOptimizationMetric[] = [],
  ): CommerceOptimizationReport {
    const analysis = this.analyzeFunnelMetrics(metrics);
    const dropOffPoints = this.identifyDropOffPoints(metrics);
    const optimizations = this.suggestFunnelOptimizations(metrics);
    const revenueImpacts = metrics.map((m) => this.calculateRevenueImpact(m, 0.05));
    const prioritized = this.prioritizeOptimizations(metrics);

    const overallOptimizationScore =
      metrics.length === 0
        ? 100
        : Math.max(
            0,
            100 -
              dropOffPoints.reduce((s, d) => s + d.dropOffRate * 10, 0),
          );

    const report: CommerceOptimizationReport = {
      reportId: REPORT_ID,
      timestamp: new Date().toISOString(),
      metricsAnalyzed: analysis.totalMetrics,
      dropOffPoints,
      optimizations,
      revenueImpacts,
      prioritized,
      overallOptimizationScore: Math.round(overallOptimizationScore),
    };

    this._lastReport = report;
    return report;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifySeverity(dropOffRate: number): DropOffPoint['severity'] {
  if (dropOffRate >= 0.5) return 'CRITICAL';
  if (dropOffRate >= 0.3) return 'HIGH';
  if (dropOffRate >= 0.15) return 'MEDIUM';
  return 'LOW';
}

function generateTestSuggestion(stage: FunnelStage): string {
  const suggestions: Record<FunnelStage, string> = {
    DISCOVERY: 'A/B test landing page headlines and hero images',
    CONSIDERATION: 'A/B test product detail page layout and CTA placement',
    CHECKOUT: 'A/B test checkout form length and field order',
    PAYMENT: 'A/B test payment method ordering and trust badges',
    FULFILLMENT: 'A/B test shipping option presentation and delivery estimates',
  };
  return suggestions[stage];
}

function estimateLift(dropOffRate: number): number {
  return Math.round(dropOffRate * 0.2 * 100) / 100;
}
