/**
 * AutonomousCustomerJourneyOptimization — G1-218
 *
 * Autonomous customer journey optimization: maps the complete customer
 * journey, identifies friction points, suggests optimizations, and
 * estimates customer lifetime value impact.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JourneyStageName =
  | 'AWARENESS'
  | 'CONSIDERATION'
  | 'PURCHASE'
  | 'POST_PURCHASE'
  | 'RETENTION';

export interface CustomerJourneyStage {
  readonly stageId: string;
  readonly stageName: JourneyStageName;
  readonly conversionRate: number;
  readonly averageTimeMs: number;
  readonly dropOffRate: number;
}

export interface FrictionPoint {
  readonly stageId: string;
  readonly stageName: JourneyStageName;
  readonly dropOffRate: number;
  readonly averageTimeMs: number;
  readonly frictionScore: number;
}

export interface JourneyOptimization {
  readonly stageId: string;
  readonly stageName: JourneyStageName;
  readonly suggestion: string;
  readonly estimatedConversionLift: number;
}

export interface LifetimeValueImpact {
  readonly stageId: string;
  readonly stageName: JourneyStageName;
  readonly currentConversion: number;
  readonly improvement: number;
  readonly estimatedCLVGain: number;
}

export interface PrioritizedJourneyOptimization {
  readonly stageId: string;
  readonly stageName: JourneyStageName;
  readonly priorityScore: number;
  readonly suggestion: string;
}

export interface JourneyOptimizationReport {
  readonly reportId: string;
  readonly timestamp: string;
  readonly stagesMapped: number;
  readonly frictionPoints: readonly FrictionPoint[];
  readonly optimizations: readonly JourneyOptimization[];
  readonly lifetimeValueImpacts: readonly LifetimeValueImpact[];
  readonly prioritized: readonly PrioritizedJourneyOptimization[];
  readonly overallJourneyScore: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPORT_ID = 'G1-218';

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class AutonomousCustomerJourneyOptimizer {
  private _lastReport: JourneyOptimizationReport | null = null;

  mapCustomerJourney(stages: readonly CustomerJourneyStage[]): {
    readonly totalStages: number;
    readonly overallConversion: number;
    readonly averageTimeMs: number;
    readonly overallDropOff: number;
  } {
    if (stages.length === 0) {
      return { totalStages: 0, overallConversion: 0, averageTimeMs: 0, overallDropOff: 0 };
    }

    const overallConversion = stages.reduce((s, st) => s * st.conversionRate, 1);
    const avgTime = stages.reduce((s, st) => s + st.averageTimeMs, 0) / stages.length;
    const overallDropOff = stages.reduce((s, st) => s + st.dropOffRate, 0) / stages.length;

    return {
      totalStages: stages.length,
      overallConversion,
      averageTimeMs: avgTime,
      overallDropOff: overallDropOff,
    };
  }

  identifyFrictionPoints(stages: readonly CustomerJourneyStage[]): readonly FrictionPoint[] {
    return stages
      .map((st) => ({
        stageId: st.stageId,
        stageName: st.stageName,
        dropOffRate: st.dropOffRate,
        averageTimeMs: st.averageTimeMs,
        frictionScore: st.dropOffRate * 60 + (st.averageTimeMs / 10000) * 40,
      }))
      .sort((a, b) => b.frictionScore - a.frictionScore);
  }

  suggestJourneyOptimizations(stages: readonly CustomerJourneyStage[]): readonly JourneyOptimization[] {
    return stages
      .filter((st) => st.dropOffRate > 0.15)
      .map((st) => ({
        stageId: st.stageId,
        stageName: st.stageName,
        suggestion: generateJourneySuggestion(st.stageName),
        estimatedConversionLift: st.dropOffRate * 0.25,
      }));
  }

  calculateLifetimeValueImpact(
    stage: CustomerJourneyStage,
    improvement: number,
  ): LifetimeValueImpact {
    const estimatedCLVGain = stage.conversionRate * improvement * 5000;
    return {
      stageId: stage.stageId,
      stageName: stage.stageName,
      currentConversion: stage.conversionRate,
      improvement,
      estimatedCLVGain,
    };
  }

  prioritizeJourneyOptimizations(stages: readonly CustomerJourneyStage[]): readonly PrioritizedJourneyOptimization[] {
    return stages
      .map((st) => ({
        stageId: st.stageId,
        stageName: st.stageName,
        priorityScore: st.dropOffRate * 100 + (st.averageTimeMs / 1000) * 10,
        suggestion: generateJourneySuggestion(st.stageName),
      }))
      .sort((a, b) => b.priorityScore - a.priorityScore);
  }

  generateJourneyOptimizationReport(
    stages: readonly CustomerJourneyStage[] = [],
  ): JourneyOptimizationReport {
    const mapping = this.mapCustomerJourney(stages);
    const frictionPoints = this.identifyFrictionPoints(stages);
    const optimizations = this.suggestJourneyOptimizations(stages);
    const lifetimeValueImpacts = stages.map((st) => this.calculateLifetimeValueImpact(st, 0.05));
    const prioritized = this.prioritizeJourneyOptimizations(stages);

    const overallJourneyScore =
      stages.length === 0
        ? 100
        : Math.max(
            0,
            Math.round(
              100 -
                frictionPoints.reduce((s, f) => s + f.frictionScore, 0) / stages.length,
            ),
          );

    const report: JourneyOptimizationReport = {
      reportId: REPORT_ID,
      timestamp: new Date().toISOString(),
      stagesMapped: mapping.totalStages,
      frictionPoints,
      optimizations,
      lifetimeValueImpacts,
      prioritized,
      overallJourneyScore,
    };

    this._lastReport = report;
    return report;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateJourneySuggestion(stageName: JourneyStageName): string {
  const suggestions: Record<JourneyStageName, string> = {
    AWARENESS: 'Improve brand messaging and ad targeting',
    CONSIDERATION: 'Add social proof and comparison tools',
    PURCHASE: 'Streamline checkout and reduce friction',
    POST_PURCHASE: 'Enhance order tracking and communication',
    RETENTION: 'Implement loyalty program and personalized offers',
  };
  return suggestions[stageName];
}
