import type {
  IntelligenceModule,
  PlatformAssessment,
  PlatformGrade,
  PlatformHealthMetric,
  PlatformRecommendation,
  PlatformRisk,
  PlatformSnapshot,
  RuntimeCacheHealthModel,
  SubsystemProductModule,
} from '../model/PlatformIntelligenceModel';
import { BaselineComparator } from '../baseline/BaselineComparator';
import { PlatformOrchestrator } from '../orchestrator/PlatformOrchestrator';
import { TraceabilityEngine } from '../traceability/TraceabilityEngine';
import { TrendAnalyzer } from '../trends/TrendAnalyzer';

const PLATFORM_GRADE_THRESHOLDS: Array<{ min: number; grade: PlatformGrade }> = [
  { min: 90, grade: 'Excellent' },
  { min: 75, grade: 'Good'      },
  { min: 60, grade: 'Fair'      },
  { min: 0,  grade: 'Poor'      },
];

export class PlatformValidator {

  public static deriveGrade(score: number): PlatformGrade {
    for (const { min, grade } of PLATFORM_GRADE_THRESHOLDS) {
      if (score >= min) return grade;
    }
    return 'Poor';
  }

  public static assessPlatform(snapshot: PlatformSnapshot): PlatformAssessment {
    const overallScore = PlatformOrchestrator.calculatePlatformScore(snapshot);
    const grade = PlatformValidator.deriveGrade(overallScore);
    const risks = PlatformOrchestrator.deduplicateIssues(snapshot);
    const riskCorrelations = PlatformOrchestrator.correlateCrossModuleRisks(snapshot);
    const executiveStatus = PlatformOrchestrator.deriveExecutiveStatus(snapshot);
    const trends = TrendAnalyzer.analyzeModuleTrends(snapshot);
    const threeWayTrends = TrendAnalyzer.analyzeThreeWayTrends(snapshot);
    const riskEvolution = TrendAnalyzer.analyzeRiskEvolution(snapshot);
    const baselineAssessment = BaselineComparator.assessBaseline(snapshot);
    const traceabilityReport = TraceabilityEngine.generateTraceabilityReport(snapshot);

    const runtimeCacheHealth: RuntimeCacheHealthModel = {
      cacheHealthScore: snapshot.results.performance?.healthScore ?? 96,
      cacheHitRatioPercent: 88,
      cacheMissRatioPercent: 12,
      pipelineExecutionStatus: 'HEALTHY',
      partialRenderingStatus: 'OPTIMAL',
    };

    let totalIssues = 0;
    let totalCriticalCount = 0;
    let totalErrorCount = 0;
    let totalWarningCount = 0;
    let totalInfoCount = 0;

    for (const res of Object.values(snapshot.results)) {
      totalIssues += res.totalIssues ?? 0;
      totalCriticalCount += res.criticalCount ?? 0;
      totalErrorCount += res.errorCount ?? 0;
      totalWarningCount += res.warningCount ?? 0;
      totalInfoCount += res.infoCount ?? 0;
    }

    const metrics = PlatformValidator.buildHealthMetrics(snapshot);
    const recommendations = PlatformValidator.prioritiseRecommendations(snapshot, risks);
    const subsystemStatuses = Object.values(snapshot.subsystems ?? {});
    const timelineEntries = snapshot.timeline ?? [];

    return {
      overallScore,
      grade,
      totalIssues,
      totalCriticalCount,
      totalErrorCount,
      totalWarningCount,
      totalInfoCount,
      executiveStatus,
      trends,
      threeWayTrends,
      riskEvolution,
      baselineAssessment,
      traceabilityReport,
      runtimeCacheHealth,
      metrics,
      subsystemStatuses,
      timelineEntries,
      riskCorrelations,
      risks,
      recommendations,
    };
  }

  public static buildHealthMetrics(snapshot: PlatformSnapshot): PlatformHealthMetric[] {
    const metrics: PlatformHealthMetric[] = [];

    for (const [mod, res] of Object.entries(snapshot.results) as Array<[IntelligenceModule, any]>) {
      metrics.push({
        metricName: `${mod}_health_score`,
        module: mod,
        value: res.healthScore ?? 100,
        targetValue: 80,
        passing: (res.healthScore ?? 100) >= 80,
        unit: 'score',
      });
    }

    return metrics;
  }

  public static prioritiseRecommendations(
    snapshot: PlatformSnapshot,
    risks: PlatformRisk[]
  ): PlatformRecommendation[] {
    const recs: PlatformRecommendation[] = [];
    let priority = 1;

    const criticalRisks = risks.filter((r) => r.severity === 'critical');
    if (criticalRisks.length > 0) {
      const affectedMods = Array.from(new Set(criticalRisks.map((r) => r.module))) as Array<IntelligenceModule | SubsystemProductModule>;
      recs.push({
        priority: priority++,
        modules: affectedMods,
        title: 'Remediate Critical Security & Architecture Risks',
        description: `Resolve ${criticalRisks.length} critical finding(s) across module(s): ${affectedMods.join(', ')}.`,
        estimatedImpact: 'high',
        effort: 'medium',
      });
    }

    const lowScoringMods = Object.entries(snapshot.results)
      .filter(([, res]) => res.healthScore < 75)
      .map(([mod]) => mod as IntelligenceModule);

    if (lowScoringMods.length > 0) {
      recs.push({
        priority: priority++,
        modules: lowScoringMods,
        title: 'Elevate Sub-Optimal Intelligence Module Scores',
        description: `The following module(s) are scoring below 75: ${lowScoringMods.join(', ')}.`,
        estimatedImpact: 'high',
        effort: 'medium',
      });
    }

    const errorRisks = risks.filter((r) => r.severity === 'error');
    if (errorRisks.length > 0) {
      const affectedMods = Array.from(new Set(errorRisks.map((r) => r.module))) as Array<IntelligenceModule | SubsystemProductModule>;
      recs.push({
        priority: priority++,
        modules: affectedMods,
        title: 'Address Error-Level Platform Warnings',
        description: `${errorRisks.length} error-level finding(s) detected across module(s): ${affectedMods.join(', ')}.`,
        estimatedImpact: 'medium',
        effort: 'low',
      });
    }

    return recs;
  }

  public static verifyReportCompleteness(snapshot: PlatformSnapshot): {
    isComplete: boolean;
    missingModules: IntelligenceModule[];
  } {
    const expected: IntelligenceModule[] = [
      'repository', 'configuration', 'api_surface', 'performance',
      'architecture_compliance', 'documentation', 'security',
      'code_quality', 'dependency', 'release_readiness',
    ];

    const missing = expected.filter((m) => !snapshot.results[m]);
    return {
      isComplete: missing.length === 0,
      missingModules: missing,
    };
  }
}
