/**
 * G1-221: Production Failure Scenario Matrix
 *
 * Manages failure scenarios across infrastructure, application, data,
 * security, and network domains. Calculates risk scores and prioritizes
 * scenarios for production readiness.
 */

export interface FailureScenario {
  readonly scenarioId: string;
  readonly category: 'INFRASTRUCTURE' | 'APPLICATION' | 'DATA' | 'SECURITY' | 'NETWORK';
  readonly severity: 'P0' | 'P1' | 'P2' | 'P3';
  readonly description: string;
  readonly affectedDomains: string[];
  readonly estimatedImpact: number;
  readonly detectionMechanism: string;
  readonly recoveryProcedure: string;
}

export interface RiskScoredScenario {
  readonly scenario: FailureScenario;
  readonly riskScore: number;
}

const SEVERITY_MULTIPLIER: Record<string, number> = {
  P0: 1.0,
  P1: 0.75,
  P2: 0.5,
  P3: 0.25,
};

export class ProductionFailureScenarioMatrix {
  private scenarios: Map<string, FailureScenario> = new Map();

  registerScenario(scenario: FailureScenario): void {
    this.scenarios.set(scenario.scenarioId, scenario);
  }

  getScenariosByCategory(category: FailureScenario['category']): FailureScenario[] {
    return Array.from(this.scenarios.values()).filter((s) => s.category === category);
  }

  getScenariosBySeverity(severity: FailureScenario['severity']): FailureScenario[] {
    return Array.from(this.scenarios.values()).filter((s) => s.severity === severity);
  }

  getScenariosByDomain(domain: string): FailureScenario[] {
    return Array.from(this.scenarios.values()).filter((s) =>
      s.affectedDomains.includes(domain),
    );
  }

  calculateRiskScore(scenario: FailureScenario): number {
    const severityWeight = SEVERITY_MULTIPLIER[scenario.severity] ?? 0.25;
    const impactWeight = Math.min(scenario.estimatedImpact / 100, 1);
    const domainWeight = Math.min(scenario.affectedDomains.length / 5, 1);
    const probability = (severityWeight + impactWeight + domainWeight) / 3;
    return Math.round(severityWeight * probability * impactWeight * 1000) / 1000;
  }

  prioritizeScenarios(scenarios: FailureScenario[]): RiskScoredScenario[] {
    return scenarios
      .map((scenario) => ({
        scenario,
        riskScore: this.calculateRiskScore(scenario),
      }))
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  getUncoveredDomains(scenarios: FailureScenario[]): string[] {
    const allCategories: FailureScenario['category'][] = [
      'INFRASTRUCTURE',
      'APPLICATION',
      'DATA',
      'SECURITY',
      'NETWORK',
    ];
    const coveredCategories = new Set(scenarios.map((s) => s.category));
    return allCategories.filter((cat) => !coveredCategories.has(cat));
  }

  generateMatrixReport(): {
    totalScenarios: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    topRisk: RiskScoredScenario[];
    uncoveredDomains: string[];
  } {
    const all = Array.from(this.scenarios.values());
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const s of all) {
      byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
      bySeverity[s.severity] = (bySeverity[s.severity] ?? 0) + 1;
    }

    const topRisk = this.prioritizeScenarios(all).slice(0, 5);
    const uncoveredDomains = this.getUncoveredDomains(all);

    return {
      totalScenarios: all.length,
      byCategory,
      bySeverity,
      topRisk,
      uncoveredDomains,
    };
  }
}
