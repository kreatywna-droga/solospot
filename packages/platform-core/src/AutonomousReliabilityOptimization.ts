/**
 * AutonomousReliabilityOptimization — G1-219
 *
 * Autonomous reliability optimization: evaluates component reliability,
 * identifies at-risk components, suggests hardening actions, and
 * estimates uptime impact.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReliabilityMetric {
  readonly metricId: string;
  readonly component: string;
  readonly uptimePercent: number;
  readonly mtbf: number;
  readonly mttr: number;
  readonly errorRate: number;
  readonly reliabilityScore: number;
}

export interface ReliabilityRisk {
  readonly metricId: string;
  readonly component: string;
  readonly riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly riskFactors: readonly string[];
}

export interface ReliabilityImprovement {
  readonly metricId: string;
  readonly component: string;
  readonly suggestion: string;
  readonly estimatedUptimeGain: number;
}

export interface ReliabilityImpact {
  readonly metricId: string;
  readonly component: string;
  readonly currentUptime: number;
  readonly improvement: number;
  readonly estimatedUptimeGain: number;
}

export interface PrioritizedHardening {
  readonly metricId: string;
  readonly component: string;
  readonly priorityScore: number;
  readonly suggestion: string;
}

export interface ReliabilityReport {
  readonly reportId: string;
  readonly timestamp: string;
  readonly metricsEvaluated: number;
  readonly risks: readonly ReliabilityRisk[];
  readonly improvements: readonly ReliabilityImprovement[];
  readonly reliabilityImpacts: readonly ReliabilityImpact[];
  readonly prioritized: readonly PrioritizedHardening[];
  readonly overallReliabilityScore: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_ID = 'G1-219';

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class AutonomousReliabilityOptimizer {
  private _lastReport: ReliabilityReport | null = null;

  evaluateComponentReliability(metric: ReliabilityMetric): {
    readonly component: string;
    readonly rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    readonly uptimeStatus: 'HEALTHY' | 'DEGRADED' | 'AT_RISK';
    readonly score: number;
  } {
    const rating = classifyRating(metric.reliabilityScore);
    const uptimeStatus = classifyUptimeStatus(metric.uptimePercent);

    return {
      component: metric.component,
      rating,
      uptimeStatus,
      score: metric.reliabilityScore,
    };
  }

  identifyReliabilityRisks(metrics: readonly ReliabilityMetric[]): readonly ReliabilityRisk[] {
    return metrics
      .map((m) => ({
        metricId: m.metricId,
        component: m.component,
        riskLevel: classifyRiskLevel(m),
        riskFactors: identifyRiskFactors(m),
      }))
      .sort((a, b) => riskOrder(a.riskLevel) - riskOrder(b.riskLevel));
  }

  suggestReliabilityImprovements(metrics: readonly ReliabilityMetric[]): readonly ReliabilityImprovement[] {
    return metrics
      .filter((m) => m.reliabilityScore < 90 || m.uptimePercent < 99.5)
      .map((m) => ({
        metricId: m.metricId,
        component: m.component,
        suggestion: generateReliabilitySuggestion(m),
        estimatedUptimeGain: (100 - m.uptimePercent) * 0.3,
      }));
  }

  calculateReliabilityImpact(
    metric: ReliabilityMetric,
    improvement: number,
  ): ReliabilityImpact {
    const estimatedUptimeGain = improvement * (100 - metric.uptimePercent);
    return {
      metricId: metric.metricId,
      component: metric.component,
      currentUptime: metric.uptimePercent,
      improvement,
      estimatedUptimeGain,
    };
  }

  prioritizeHardening(metrics: readonly ReliabilityMetric[]): readonly PrioritizedHardening[] {
    return metrics
      .map((m) => ({
        metricId: m.metricId,
        component: m.component,
        priorityScore: (100 - m.reliabilityScore) * 0.5 + m.errorRate * 100 + (100 - m.uptimePercent) * 2,
        suggestion: generateReliabilitySuggestion(m),
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  generateReliabilityReport(
    metrics: readonly ReliabilityMetric[] = [],
  ): ReliabilityReport {
    const risks = this.identifyReliabilityRisks(metrics);
    const improvements = this.suggestReliabilityImprovements(metrics);
    const reliabilityImpacts = metrics.map((m) => this.calculateReliabilityImpact(m, 0.1));
    const prioritized = this.prioritizeHardening(metrics);

    const overallReliabilityScore =
      metrics.length === 0
        ? 100
        : Math.round(
            metrics.reduce((s, m) => s + m.reliabilityScore, 0) / metrics.length,
          );

    const report: ReliabilityReport = {
      reportId: REPORT_ID,
      timestamp: new Date().toISOString(),
      metricsEvaluated: metrics.length,
      risks,
      improvements,
      reliabilityImpacts,
      prioritized,
      overallReliabilityScore,
    };

    this._lastReport = report;
    return report;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyRating(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL' {
  if (score >= 98) return 'EXCELLENT';
  if (score >= 95) return 'GOOD';
  if (score >= 85) return 'FAIR';
  if (score >= 70) return 'POOR';
  return 'CRITICAL';
}

function classifyUptimeStatus(uptime: number): 'HEALTHY' | 'DEGRADED' | 'AT_RISK' {
  if (uptime >= 99.9) return 'HEALTHY';
  if (uptime >= 99.0) return 'DEGRADED';
  return 'AT_RISK';
}

function classifyRiskLevel(m: ReliabilityMetric): ReliabilityRisk['riskLevel'] {
  if (m.reliabilityScore < 70 || m.uptimePercent < 99.0) return 'CRITICAL';
  if (m.reliabilityScore < 85 || m.uptimePercent < 99.5) return 'HIGH';
  if (m.reliabilityScore < 95 || m.errorRate > 0.01) return 'MEDIUM';
  return 'LOW';
}

function identifyRiskFactors(m: ReliabilityMetric): string[] {
  const factors: string[] = [];
  if (m.uptimePercent < 99.0) factors.push('Low uptime');
  if (m.errorRate > 0.01) factors.push('High error rate');
  if (m.mttr > 60) factors.push('High MTTR');
  if (m.mtbf < 100) factors.push('Low MTBF');
  if (m.reliabilityScore < 85) factors.push('Low reliability score');
  return factors;
}

function generateReliabilitySuggestion(m: ReliabilityMetric): string {
  const suggestions: string[] = [];
  if (m.uptimePercent < 99.5) suggestions.push('Add health checks and auto-restart');
  if (m.errorRate > 0.01) suggestions.push('Implement circuit breakers');
  if (m.mttr > 60) suggestions.push('Improve monitoring and alerting');
  if (m.mtbf < 100) suggestions.push('Add redundancy and failover');
  return suggestions.length > 0 ? suggestions.join('; ') : 'Maintain current reliability practices';
}

function riskOrder(level: ReliabilityRisk['riskLevel']): number {
  const order: Record<ReliabilityRisk['riskLevel'], number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  return order[level];
}
