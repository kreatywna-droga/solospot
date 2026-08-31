/**
 * G1-222: Cross-Domain Recovery Matrix
 *
 * Manages recovery capabilities across domains, validates coverage
 * against failure scenarios, and identifies recovery gaps.
 */

export interface RecoveryCapability {
  readonly capabilityId: string;
  readonly domain: string;
  readonly failureType: string;
  readonly recoveryTimeObjective: number;
  readonly recoveryPointObjective: number;
  readonly recoveryStrategy: string;
  readonly dependencies: string[];
}

export interface RecoveryGap {
  readonly scenarioId: string;
  readonly category: string;
  readonly severity: string;
  readonly missingCapability: string;
}

export class CrossDomainRecoveryMatrix {
  private capabilities: Map<string, RecoveryCapability> = new Map();

  registerRecoveryCapability(capability: RecoveryCapability): void {
    this.capabilities.set(capability.capabilityId, capability);
  }

  getRecoveryForFailure(domain: string, failureType: string): RecoveryCapability | undefined {
    return Array.from(this.capabilities.values()).find(
      (c) => c.domain === domain && c.failureType === failureType,
    );
  }

  validateRecoveryCoverage(
    failureScenarios: Array<{ scenarioId: string; category: string; affectedDomains: string[] }>,
  ): { covered: string[]; uncovered: string[] } {
    const covered: string[] = [];
    const uncovered: string[] = [];

    for (const scenario of failureScenarios) {
      let hasCoverage = false;
      for (const domain of scenario.affectedDomains) {
        const cap = Array.from(this.capabilities.values()).find(
          (c) => c.domain === domain,
        );
        if (cap) {
          hasCoverage = true;
          break;
        }
      }
      if (hasCoverage) {
        covered.push(scenario.scenarioId);
      } else {
        uncovered.push(scenario.scenarioId);
      }
    }

    return { covered, uncovered };
  }

  calculateAggregateRto(capabilities: RecoveryCapability[]): number {
    if (capabilities.length === 0) return 0;
    return Math.max(...capabilities.map((c) => c.recoveryTimeObjective));
  }

  identifyRecoveryGaps(
    failureScenarios: Array<{ scenarioId: string; category: string; severity: string; affectedDomains: string[] }>,
    capabilities: RecoveryCapability[],
  ): RecoveryGap[] {
    const gaps: RecoveryGap[] = [];
    const capDomains = new Set(capabilities.map((c) => c.domain));

    for (const scenario of failureScenarios) {
      for (const domain of scenario.affectedDomains) {
        if (!capDomains.has(domain)) {
          gaps.push({
            scenarioId: scenario.scenarioId,
            category: scenario.category,
            severity: scenario.severity,
            missingCapability: domain,
          });
        }
      }
    }

    return gaps;
  }

  generateRecoveryMatrixReport(): {
    totalCapabilities: number;
    domainsCovered: string[];
    averageRto: number;
    averageRpo: number;
    capabilitiesByDomain: Record<string, number>;
  } {
    const all = Array.from(this.capabilities.values());
    const domains = new Set(all.map((c) => c.domain));
    const capabilitiesByDomain: Record<string, number> = {};

    for (const cap of all) {
      capabilitiesByDomain[cap.domain] = (capabilitiesByDomain[cap.domain] ?? 0) + 1;
    }

    const avgRto = all.length > 0
      ? all.reduce((sum, c) => sum + c.recoveryTimeObjective, 0) / all.length
      : 0;
    const avgRpo = all.length > 0
      ? all.reduce((sum, c) => sum + c.recoveryPointObjective, 0) / all.length
      : 0;

    return {
      totalCapabilities: all.length,
      domainsCovered: Array.from(domains),
      averageRto: Math.round(avgRto * 100) / 100,
      averageRpo: Math.round(avgRpo * 100) / 100,
      capabilitiesByDomain,
    };
  }
}
