/**
 * G1-212: Autonomous Capability Prioritization
 *
 * Ranks capabilities by business value, technical debt, risk, and
 * implementation complexity to produce prioritized optimization targets.
 */

export interface CapabilityPriority {
  readonly capabilityId: string;
  readonly businessValue: number;
  readonly technicalDebt: number;
  readonly riskLevel: number;
  readonly implementationComplexity: number;
  readonly priorityScore: number;
}

export interface CapabilityRegistration {
  readonly capabilityId: string;
  readonly businessValue: number;
  readonly technicalDebt: number;
  readonly riskLevel: number;
  readonly implementationComplexity: number;
}

export interface DeprioritizationRecord {
  readonly capabilityId: string;
  readonly reason: string;
  readonly timestamp: number;
}

export interface PrioritizationWeights {
  readonly businessValueWeight: number;
  readonly technicalDebtWeight: number;
  readonly riskLevelWeight: number;
  readonly complexityPenaltyWeight: number;
}

const DEFAULT_WEIGHTS: PrioritizationWeights = {
  businessValueWeight: 0.4,
  technicalDebtWeight: 0.3,
  riskLevelWeight: 0.2,
  complexityPenaltyWeight: 0.1,
};

export class AutonomousCapabilityPrioritizer {
  private capabilities: Map<string, CapabilityPriority> = new Map();
  private deprioritized: DeprioritizationRecord[] = [];
  private weights: PrioritizationWeights;

  constructor(weights: PrioritizationWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  registerCapability(capability: CapabilityRegistration): CapabilityPriority {
    const priorityScore = this.calculatePriorityScore(capability);
    const entry: CapabilityPriority = { ...capability, priorityScore };
    this.capabilities.set(capability.capabilityId, entry);
    return entry;
  }

  calculatePriorityScore(capability: CapabilityRegistration): number {
    const normalizedComplexity = 10 - capability.implementationComplexity;
    return (
      capability.businessValue * this.weights.businessValueWeight +
      capability.technicalDebt * this.weights.technicalDebtWeight +
      capability.riskLevel * this.weights.riskLevelWeight +
      normalizedComplexity * this.weights.complexityPenaltyWeight
    );
  }

  rankCapabilities(capabilities: CapabilityPriority[]): CapabilityPriority[] {
    return [...capabilities].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  getTopNOptimizationTargets(capabilities: CapabilityPriority[], n: number): CapabilityPriority[] {
    return this.rankCapabilities(capabilities).slice(0, n);
  }

  deprioritize(capabilityId: string, reason: string): boolean {
    if (!this.capabilities.has(capabilityId)) return false;
    this.capabilities.delete(capabilityId);
    this.deprioritized.push({ capabilityId, reason, timestamp: Date.now() });
    return true;
  }

  getDeprioritized(): DeprioritizationRecord[] {
    return [...this.deprioritized];
  }

  getAllCapabilities(): CapabilityPriority[] {
    return [...this.capabilities.values()];
  }

  generatePrioritizationReport(): {
    totalCapabilities: number;
    rankedCapabilities: CapabilityPriority[];
    deprioritizedCount: number;
    topTarget: CapabilityPriority | undefined;
    weights: PrioritizationWeights;
  } {
    const all = this.getAllCapabilities();
    const ranked = this.rankCapabilities(all);
    return {
      totalCapabilities: all.length,
      rankedCapabilities: ranked,
      deprioritizedCount: this.deprioritized.length,
      topTarget: ranked[0],
      weights: this.weights,
    };
  }
}
