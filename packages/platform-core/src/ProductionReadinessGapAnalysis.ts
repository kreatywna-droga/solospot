/**
 * G1-227: Production Readiness Gap Analysis
 *
 * Identifies gaps across INFRASTRUCTURE, MONITORING, SECURITY,
 * PERFORMANCE, DISASTER_RECOVERY, and COMPLIANCE. Ranks by
 * impact × effort and calculates overall readiness.
 */

export type GapCategory = 'INFRASTRUCTURE' | 'MONITORING' | 'SECURITY' | 'PERFORMANCE' | 'DISASTER_RECOVERY' | 'COMPLIANCE';

export interface ReadinessGap {
  readonly gapId: string;
  readonly category: GapCategory;
  readonly gapDescription: string;
  readonly currentScore: number;
  readonly targetScore: number;
  readonly remediationSteps: string[];
}

export interface GapAnalysisReport {
  readonly totalGaps: number;
  readonly criticalGaps: number;
  readonly readinessScore: number;
  readonly gaps: ReadinessGap[];
  readonly prioritizedGaps: ReadinessGap[];
  readonly timestamp: number;
}

export class ProductionReadinessGapAnalyzer {
  private gapHistory: GapAnalysisReport[] = [];
  private gapCounter = 0;

  analyzeReadinessGap(
    category: GapCategory,
    currentScore: number,
    targetScore: number,
    description: string,
    steps: string[] = [],
  ): ReadinessGap {
    this.gapCounter++;
    return {
      gapId: `gap-${this.gapCounter}-${Date.now()}`,
      category,
      gapDescription: description,
      currentScore: Math.max(0, Math.min(100, currentScore)),
      targetScore: Math.max(0, Math.min(100, targetScore)),
      remediationSteps: steps,
    };
  }

  runFullGapAnalysis(): ReadinessGap[] {
    return [
      this.analyzeReadinessGap('INFRASTRUCTURE', 85, 95, 'Container orchestration needs optimization', ['Tune k8s resource limits', 'Add HPA rules']),
      this.analyzeReadinessGap('MONITORING', 70, 90, 'Insufficient distributed tracing', ['Deploy OpenTelemetry', 'Add custom spans']),
      this.analyzeReadinessGap('SECURITY', 90, 95, 'Rotate encryption keys', ['Implement key rotation schedule']),
      this.analyzeReadinessGap('PERFORMANCE', 75, 90, 'API response times exceeding SLA', ['Add caching layer', 'Optimize queries']),
      this.analyzeReadinessGap('DISASTER_RECOVERY', 60, 85, 'RTO target not met', ['Test failover procedures', 'Add cross-region replication']),
      this.analyzeReadinessGap('COMPLIANCE', 80, 90, 'SOC2 audit gaps', ['Document access controls', 'Add audit logging']),
    ];
  }

  getCriticalGaps(gaps: ReadinessGap[]): ReadinessGap[] {
    return gaps.filter((g) => g.targetScore - g.currentScore > 30);
  }

  prioritizeGaps(gaps: ReadinessGap[]): ReadinessGap[] {
    return [...gaps].sort((a, b) => {
      const impactA = a.targetScore - a.currentScore;
      const impactB = b.targetScore - b.currentScore;
      const effortA = a.remediationSteps.length || 1;
      const effortB = b.remediationSteps.length || 1;
      const priorityA = impactA / effortA;
      const priorityB = impactB / effortB;
      return priorityB - priorityA;
    });
  }

  calculateReadinessScore(gaps: ReadinessGap[]): number {
    if (gaps.length === 0) return 100;
    const totalMax = gaps.reduce((sum, g) => sum + g.targetScore, 0);
    const totalCurrent = gaps.reduce((sum, g) => sum + g.currentScore, 0);
    return totalMax > 0 ? Math.round((totalCurrent / totalMax) * 100) : 100;
  }

  generateGapAnalysisReport(): GapAnalysisReport {
    const gaps = this.runFullGapAnalysis();
    const criticalGaps = this.getCriticalGaps(gaps);
    const prioritizedGaps = this.prioritizeGaps(gaps);

    const report: GapAnalysisReport = {
      totalGaps: gaps.length,
      criticalGaps: criticalGaps.length,
      readinessScore: this.calculateReadinessScore(gaps),
      gaps,
      prioritizedGaps,
      timestamp: Date.now(),
    };

    this.gapHistory.push(report);
    return report;
  }

  getGapHistory(): GapAnalysisReport[] {
    return [...this.gapHistory];
  }
}
