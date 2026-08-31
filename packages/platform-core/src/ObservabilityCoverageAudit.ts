/**
 * G1-223: Observability Coverage Audit
 *
 * Audits observability coverage across components including metrics,
 * tracing, logging, and alerting. Calculates coverage scores and
 * suggests improvements.
 */

export interface ObservabilityCoverage {
  readonly componentId: string;
  readonly hasMetrics: boolean;
  readonly hasTracing: boolean;
  readonly hasLogging: boolean;
  readonly hasAlerting: boolean;
  readonly coverageScore: number;
}

export interface ImprovementSuggestion {
  readonly componentId: string;
  readonly missingCapabilities: string[];
  readonly priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class ObservabilityCoverageAuditor {
  private components: Map<string, ObservabilityCoverage> = new Map();

  registerComponent(componentId: string, coverage: ObservabilityCoverage): void {
    this.components.set(componentId, coverage);
  }

  calculateCoverageScore(componentId: string): number {
    const coverage = this.components.get(componentId);
    if (!coverage) return 0;

    let score = 0;
    if (coverage.hasMetrics) score += 25;
    if (coverage.hasTracing) score += 25;
    if (coverage.hasLogging) score += 25;
    if (coverage.hasAlerting) score += 25;
    return score;
  }

  getUndercoveredComponents(threshold: number): ObservabilityCoverage[] {
    return Array.from(this.components.values()).filter(
      (c) => c.coverageScore < threshold,
    );
  }

  suggestObservabilityImprovements(coverage: ObservabilityCoverage[]): ImprovementSuggestion[] {
    return coverage.map((c) => {
      const missingCapabilities: string[] = [];
      if (!c.hasMetrics) missingCapabilities.push('metrics');
      if (!c.hasTracing) missingCapabilities.push('tracing');
      if (!c.hasLogging) missingCapabilities.push('logging');
      if (!c.hasAlerting) missingCapabilities.push('alerting');

      let priority: ImprovementSuggestion['priority'] = 'LOW';
      if (missingCapabilities.length >= 3) priority = 'HIGH';
      else if (missingCapabilities.length >= 2) priority = 'MEDIUM';

      return {
        componentId: c.componentId,
        missingCapabilities,
        priority,
      };
    }).filter((s) => s.missingCapabilities.length > 0);
  }

  calculateAggregateCoverage(coverage: ObservabilityCoverage[]): number {
    if (coverage.length === 0) return 0;
    const total = coverage.reduce((sum, c) => sum + c.coverageScore, 0);
    return Math.round((total / coverage.length) * 100) / 100;
  }

  generateObservabilityReport(): {
    totalComponents: number;
    fullyCovered: number;
    partiallyCovered: number;
    uncovered: number;
    aggregateScore: number;
    improvements: ImprovementSuggestion[];
  } {
    const all = Array.from(this.components.values());
    const fullyCovered = all.filter((c) => c.coverageScore === 100).length;
    const uncovered = all.filter((c) => c.coverageScore === 0).length;
    const partiallyCovered = all.length - fullyCovered - uncovered;
    const aggregateScore = this.calculateAggregateCoverage(all);
    const improvements = this.suggestObservabilityImprovements(all);

    return {
      totalComponents: all.length,
      fullyCovered,
      partiallyCovered,
      uncovered,
      aggregateScore,
      improvements,
    };
  }
}
