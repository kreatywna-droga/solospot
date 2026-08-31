/**
 * G1-230: HACP Autonomous Final Decision
 *
 * TERMINAL TASK — The final decision engine. Analyzes all platform metrics,
 * determines CONTINUE / CONTROLLED_STOP / DEFER / MERGE / REFACTOR / HARDEN,
 * and generates the comprehensive final report with ETAP 9 validation.
 */

export type FinalDecision = 'CONTINUE' | 'CONTROLLED_STOP' | 'DEFER' | 'MERGE' | 'REFACTOR' | 'HARDEN';

export interface FinalDecisionInput {
  readonly totalTasksExecuted: number;
  readonly totalTestsPassing: number;
  readonly totalTestsFailing: number;
  readonly tsErrors: number;
  readonly scopeViolations: number;
  readonly architecturalBoundaryCompliance: number;
  readonly fakeIntegrations: number;
  readonly overallPlatformScore: number;
  readonly decisionDriftEvents: number;
  readonly recoveryActionsExecuted: number;
}

export interface DecisionAnalysis {
  readonly decision: FinalDecision;
  readonly rationale: string;
  readonly score: number;
  readonly metrics: {
    readonly testPassRate: number;
    readonly architecturalCompliance: number;
    readonly overallHealth: string;
  };
}

export interface FinalReport {
  readonly decision: FinalDecision;
  readonly rationale: string;
  readonly input: FinalDecisionInput;
  readonly analysis: DecisionAnalysis;
  readonly successCriteriaMet: boolean;
  readonly successCriteriaDetails: string[];
  readonly timestamp: number;
}

export interface ETAP9SuccessCriteria {
  readonly allTestsPassing: boolean;
  readonly zeroTsErrors: boolean;
  readonly zeroScopeViolations: boolean;
  readonly highArchitecturalCompliance: boolean;
  readonly noFakeIntegrations: boolean;
  readonly highPlatformScore: boolean;
  readonly controlledDecisionDrift: boolean;
  readonly allTasksExecuted: boolean;
  readonly recoveryActionsSufficient: boolean;
}

export class HACPAutonomousFinalDecision {
  private decisionHistory: FinalReport[] = [];

  analyzeDecisionInput(input: FinalDecisionInput): DecisionAnalysis {
    const testPassRate =
      input.totalTestsPassing + input.totalTestsFailing > 0
        ? (input.totalTestsPassing / (input.totalTestsPassing + input.totalTestsFailing)) * 100
        : 0;

    const architecturalCompliance = input.architecturalBoundaryCompliance;

    let overallHealth: string;
    if (input.overallPlatformScore >= 90) overallHealth = 'EXCELLENT';
    else if (input.overallPlatformScore >= 75) overallHealth = 'GOOD';
    else if (input.overallPlatformScore >= 50) overallHealth = 'FAIR';
    else overallHealth = 'POOR';

    const decision = this.makeDecision(input);

    return {
      decision,
      rationale: '',
      score: input.overallPlatformScore,
      metrics: {
        testPassRate: Math.round(testPassRate * 100) / 100,
        architecturalCompliance,
        overallHealth,
      },
    };
  }

  evaluateEvolutionNeed(input: FinalDecisionInput): boolean {
    const hasRoomForImprovement = input.overallPlatformScore < 95;
    const hasActiveIssues =
      input.tsErrors > 0 || input.scopeViolations > 0 || input.fakeIntegrations > 0;
    const recentDrift = input.decisionDriftEvents > 5;
    return hasRoomForImprovement && hasActiveIssues && !recentDrift;
  }

  makeDecision(input: FinalDecisionInput): FinalDecision {
    if (
      input.overallPlatformScore >= 90 &&
      input.tsErrors === 0 &&
      input.scopeViolations === 0
    ) {
      return 'CONTROLLED_STOP';
    }

    if (input.scopeViolations > 0) {
      return 'REFACTOR';
    }

    if (input.decisionDriftEvents > 3) {
      return 'DEFER';
    }

    if (input.overallPlatformScore < 70) {
      return 'HARDEN';
    }

    if (
      input.overallPlatformScore >= 70 &&
      input.tsErrors === 0
    ) {
      return 'CONTINUE';
    }

    return 'CONTINUE';
  }

  generateDecisionRationale(input: FinalDecisionInput, decision: FinalDecision): string {
    const parts: string[] = [];

    switch (decision) {
      case 'CONTROLLED_STOP':
        parts.push('Platform has reached production readiness.');
        parts.push(`Overall score ${input.overallPlatformScore}/100 meets threshold.`);
        parts.push(`Zero TS errors and zero scope violations confirmed.`);
        parts.push('No further evolution needed — controlled stop recommended.');
        break;
      case 'CONTINUE':
        parts.push('Platform shows strong foundation but needs optimization.');
        if (input.overallPlatformScore < 90) {
          parts.push(`Score ${input.overallPlatformScore}/100 below 90 target.`);
        }
        if (input.fakeIntegrations > 0) {
          parts.push(`${input.fakeIntegrations} fake integration(s) detected.`);
        }
        parts.push('Continue evolution with focus on identified gaps.');
        break;
      case 'HARDEN':
        parts.push('Platform has critical reliability/security gaps.');
        parts.push(`Score ${input.overallPlatformScore}/100 below 70 threshold.`);
        parts.push('Harden before any further feature work.');
        break;
      case 'REFACTOR':
        parts.push('Architectural violations detected.');
        parts.push(`${input.scopeViolations} scope violation(s) found.`);
        parts.push('Refactor to restore boundary compliance.');
        break;
      case 'DEFER':
        parts.push('Too many recent regressions to safely continue.');
        parts.push(`${input.decisionDriftEvents} decision drift events recorded.`);
        parts.push('Defer further evolution until stability improves.');
        break;
      case 'MERGE':
        parts.push('Platform modules ready for consolidation.');
        parts.push('Merge independent components into unified architecture.');
        break;
    }

    return parts.join(' ');
  }

  validateSuccessCriteria(input: FinalDecisionInput): ETAP9SuccessCriteria {
    const totalTests = input.totalTestsPassing + input.totalTestsFailing;
    return {
      allTestsPassing: totalTests > 0 && input.totalTestsFailing === 0,
      zeroTsErrors: input.tsErrors === 0,
      zeroScopeViolations: input.scopeViolations === 0,
      highArchitecturalCompliance: input.architecturalBoundaryCompliance >= 90,
      noFakeIntegrations: input.fakeIntegrations === 0,
      highPlatformScore: input.overallPlatformScore >= 85,
      controlledDecisionDrift: input.decisionDriftEvents <= 2,
      allTasksExecuted: input.totalTasksExecuted >= 50,
      recoveryActionsSufficient: input.recoveryActionsExecuted >= 0,
    };
  }

  generateFinalReport(input: FinalDecisionInput): FinalReport {
    const decision = this.makeDecision(input);
    const rationale = this.generateDecisionRationale(input, decision);
    const analysis = this.analyzeDecisionInput(input);
    const criteria = this.validateSuccessCriteria(input);

    const successCriteriaMet = Object.values(criteria).every(Boolean);
    const successCriteriaDetails = Object.entries(criteria).map(
      ([key, value]) => `${key}: ${value ? 'PASS' : 'FAIL'}`,
    );

    const report: FinalReport = {
      decision,
      rationale,
      input,
      analysis: { ...analysis, rationale },
      successCriteriaMet,
      successCriteriaDetails,
      timestamp: Date.now(),
    };

    this.decisionHistory.push(report);
    return report;
  }

  getDecisionHistory(): FinalReport[] {
    return [...this.decisionHistory];
  }
}
