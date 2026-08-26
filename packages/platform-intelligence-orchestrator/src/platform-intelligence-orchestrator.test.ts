import { describe, expect, it } from 'vitest';
import { DEFAULT_ARCHITECTURE_RULES } from '../../architecture-compliance-intelligence/src/analyzer/ComplianceAnalyzer';
import { DEFAULT_RELEASE_GATES } from '../../release-readiness-intelligence/src/analyzer/ReleaseReadinessAnalyzer';
import { BaselineComparator, DEFAULT_PLATFORM_BASELINE } from './baseline/BaselineComparator';
import { CLI_PRESET_PROFILES } from './cli/PlatformCLI';
import type { IntelligenceResult, PlatformSnapshot } from './model/PlatformIntelligenceModel';
import { PlatformOrchestrator } from './orchestrator/PlatformOrchestrator';
import { PlatformReportGenerator } from './report/PlatformReportGenerator';
import { TraceabilityEngine } from './traceability/TraceabilityEngine';
import { TrendAnalyzer } from './trends/TrendAnalyzer';
import { PlatformValidator } from './validator/PlatformValidator';

function mockModuleResult(
  module: any,
  healthScore: number,
  criticalCount = 0,
  errorCount = 0
): IntelligenceResult {
  return {
    module,
    moduleName: `${module.toUpperCase()} Module`,
    healthScore,
    grade: healthScore >= 90 ? 'Excellent' : 'Good',
    totalIssues: criticalCount + errorCount,
    criticalCount,
    errorCount,
    warningCount: 0,
    infoCount: 0,
    summaryMessage: `Mock report for ${module}`,
    rawIssues: [],
  };
}

describe('Platform Intelligence Orchestrator (PM13 Enhancements)', () => {
  it('should include PM13 Runtime & Performance rules RULE-RT-006..010', () => {
    const rtRuleIds = DEFAULT_ARCHITECTURE_RULES.filter((r) => r.ruleId.startsWith('RULE-RT-')).map((r) => r.ruleId);
    expect(rtRuleIds).toContain('RULE-RT-006');
    expect(rtRuleIds).toContain('RULE-RT-007');
    expect(rtRuleIds).toContain('RULE-RT-008');
    expect(rtRuleIds).toContain('RULE-RT-009');
    expect(rtRuleIds).toContain('RULE-RT-010');
  });

  it('should include PM13 Quality Gates in default release gates', () => {
    const gateIds = DEFAULT_RELEASE_GATES.map((g) => g.gateId);
    expect(gateIds).toContain('RUNTIME_CACHE_VALIDATED');
    expect(gateIds).toContain('PREVIEW_RUNTIME_VALIDATED');
    expect(gateIds).toContain('PIPELINE_STAGE_COMPLETENESS');
    expect(gateIds).toContain('PARTIAL_RENDERING_VALIDATED');
    expect(gateIds).toContain('NO_PERFORMANCE_REGRESSION');
  });

  it('should compute runtimeCacheHealth metrics in PlatformValidator assessment', () => {
    const results: IntelligenceResult[] = [
      mockModuleResult('repository', 100),
      mockModuleResult('configuration', 100),
      mockModuleResult('api_surface', 100),
      mockModuleResult('performance', 95),
      mockModuleResult('architecture_compliance', 98),
      mockModuleResult('documentation', 96),
      mockModuleResult('security', 100),
      mockModuleResult('code_quality', 94),
      mockModuleResult('dependency', 100),
      mockModuleResult('release_readiness', 100),
    ];

    const snapshot = PlatformOrchestrator.aggregateReports(results);
    const assessment = PlatformValidator.assessPlatform(snapshot);

    expect(assessment.runtimeCacheHealth).toBeDefined();
    expect(assessment.runtimeCacheHealth?.cacheHitRatioPercent).toBe(88);
    expect(assessment.runtimeCacheHealth?.pipelineExecutionStatus).toBe('HEALTHY');
  });

  it('should generate Markdown, JSON, and CSV export containing Runtime Cache & Performance Health', () => {
    const results: IntelligenceResult[] = [
      mockModuleResult('repository', 100),
      mockModuleResult('configuration', 100),
      mockModuleResult('api_surface', 100),
      mockModuleResult('performance', 95),
      mockModuleResult('architecture_compliance', 98),
      mockModuleResult('documentation', 96),
      mockModuleResult('security', 100),
      mockModuleResult('code_quality', 94),
      mockModuleResult('dependency', 100),
      mockModuleResult('release_readiness', 100),
    ];

    const snapshot = PlatformOrchestrator.aggregateReports(results);
    const assessment = PlatformValidator.assessPlatform(snapshot);
    const report = PlatformReportGenerator.generateReport(assessment, snapshot);
    
    const md = PlatformReportGenerator.toMarkdown(report);
    const json = PlatformReportGenerator.toJSON(report);
    const csv = PlatformReportGenerator.toCSV(report);

    expect(md).toContain('Runtime Cache & Performance Health');
    expect(md).toContain('Cache Hit Ratio');
    expect(json).toContain('runtimeCacheHealth');
expect(csv).toContain('"RuntimeCache","cache_health"');
  });
});
