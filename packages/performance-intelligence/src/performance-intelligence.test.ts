import { describe, it, expect } from 'vitest';
import {
  PerformanceAnalyzer,
  PerformanceValidator,
  PerformanceReportGenerator,
  PerformanceCLI,
} from './index';
import type { PerformanceModuleSnapshot } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeModule(
  modulePath: string,
  overrides: Partial<Omit<PerformanceModuleSnapshot, 'modulePath'>> = {}
): PerformanceModuleSnapshot {
  return {
    modulePath,
    importCount:       overrides.importCount       ?? 5,
    fanIn:             overrides.fanIn             ?? 2,
    fanOut:            overrides.fanOut            ?? 3,
    importDepth:       overrides.importDepth       ?? 2,
    exportCount:       overrides.exportCount       ?? 10,
    estimatedSizeKb:   overrides.estimatedSizeKb   ?? 50,
    dependencies:      overrides.dependencies      ?? [],
    heavyDependencies: overrides.heavyDependencies ?? [],
  };
}

// ===========================================================================
// 1. PerformanceAnalyzer — parseModules
// ===========================================================================
describe('PerformanceAnalyzer — parseModules', () => {
  it('converts raw module data into PerformanceModuleSnapshot objects', () => {
    const modules = PerformanceAnalyzer.parseModules([
      { modulePath: 'packages/alpha', importCount: 3, fanIn: 2, fanOut: 4 },
    ]);
    expect(modules).toHaveLength(1);
    expect(modules[0].modulePath).toBe('packages/alpha');
    expect(modules[0].importCount).toBe(3);
  });

  it('applies defaults for missing fields', () => {
    const modules = PerformanceAnalyzer.parseModules([{ modulePath: 'packages/bare' }]);
    expect(modules[0].fanIn).toBe(0);
    expect(modules[0].fanOut).toBe(0);
    expect(modules[0].importDepth).toBe(0);
    expect(modules[0].estimatedSizeKb).toBe(0);
  });
});

// ===========================================================================
// 2. PerformanceAnalyzer — detectHeavyDependencies
// ===========================================================================
describe('PerformanceAnalyzer — detectHeavyDependencies', () => {
  it('flags a module that depends on a known heavy package', () => {
    const mod = makeModule('packages/alpha', { heavyDependencies: ['lodash'] });
    const issues = PerformanceAnalyzer.detectHeavyDependencies([mod]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('heavy_dependency');
    expect(issues[0].severity).toBe('warning');
    expect(issues[0].category).toBe('dependency_cost');
  });

  it('flags sub-path heavy imports (e.g. rxjs/operators)', () => {
    const mod = makeModule('packages/alpha', { heavyDependencies: ['rxjs/operators'] });
    const issues = PerformanceAnalyzer.detectHeavyDependencies([mod]);
    expect(issues).toHaveLength(1);
  });

  it('returns no issues for modules with only lightweight deps', () => {
    const mod = makeModule('packages/alpha', { heavyDependencies: ['zod'] });
    expect(PerformanceAnalyzer.detectHeavyDependencies([mod])).toHaveLength(0);
  });

  it('flags multiple heavy dependencies in one module', () => {
    const mod = makeModule('packages/alpha', { heavyDependencies: ['lodash', 'moment', 'rxjs'] });
    const issues = PerformanceAnalyzer.detectHeavyDependencies([mod]);
    expect(issues).toHaveLength(3);
  });
});

// ===========================================================================
// 3. PerformanceAnalyzer — detectOversizedModules
// ===========================================================================
describe('PerformanceAnalyzer — detectOversizedModules', () => {
  it('flags a module exceeding the 200 KB threshold', () => {
    const mod = makeModule('packages/large', { estimatedSizeKb: 250 });
    const issues = PerformanceAnalyzer.detectOversizedModules([mod]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('oversized_module');
    expect(issues[0].measuredValue).toBe(250);
    expect(issues[0].threshold).toBe(200);
  });

  it('assigns error severity when size exceeds 2× threshold', () => {
    const mod = makeModule('packages/massive', { estimatedSizeKb: 450 });
    const issues = PerformanceAnalyzer.detectOversizedModules([mod]);
    expect(issues[0].severity).toBe('error');
  });

  it('assigns warning severity for moderate overage', () => {
    const mod = makeModule('packages/medium-large', { estimatedSizeKb: 210 });
    const issues = PerformanceAnalyzer.detectOversizedModules([mod]);
    expect(issues[0].severity).toBe('warning');
  });

  it('returns no issues for modules within the threshold', () => {
    const mod = makeModule('packages/normal', { estimatedSizeKb: 150 });
    expect(PerformanceAnalyzer.detectOversizedModules([mod])).toHaveLength(0);
  });
});

// ===========================================================================
// 4. PerformanceAnalyzer — detectDeepImportChains
// ===========================================================================
describe('PerformanceAnalyzer — detectDeepImportChains', () => {
  it('flags a module with import depth exceeding 5', () => {
    const mod = makeModule('packages/deep', { importDepth: 7 });
    const issues = PerformanceAnalyzer.detectDeepImportChains([mod]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('deep_import_chain');
    expect(issues[0].category).toBe('import_depth');
    expect(issues[0].measuredValue).toBe(7);
  });

  it('assigns error severity when depth exceeds 2× threshold (>10)', () => {
    const mod = makeModule('packages/very-deep', { importDepth: 12 });
    const issues = PerformanceAnalyzer.detectDeepImportChains([mod]);
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues for modules at or below the threshold', () => {
    const mod = makeModule('packages/shallow', { importDepth: 5 });
    expect(PerformanceAnalyzer.detectDeepImportChains([mod])).toHaveLength(0);
  });

  it('flags multiple modules with excessive depth', () => {
    const modules = [
      makeModule('packages/a', { importDepth: 8 }),
      makeModule('packages/b', { importDepth: 9 }),
    ];
    expect(PerformanceAnalyzer.detectDeepImportChains(modules)).toHaveLength(2);
  });
});

// ===========================================================================
// 5. PerformanceAnalyzer — detectHotspots (hotspot classification)
// ===========================================================================
describe('PerformanceAnalyzer — detectHotspots', () => {
  it('flags a module with fan-in exceeding 10', () => {
    const mod = makeModule('packages/hub', { fanIn: 12, fanOut: 3 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    expect(issues.some((i) => i.issueType === 'high_fan_in')).toBe(true);
  });

  it('flags a module with fan-out exceeding 15', () => {
    const mod = makeModule('packages/god', { fanIn: 2, fanOut: 18 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    expect(issues.some((i) => i.issueType === 'high_fan_out')).toBe(true);
  });

  it('flags an architectural hotspot when fanIn + fanOut >= 20', () => {
    const mod = makeModule('packages/hotspot', { fanIn: 12, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    expect(issues.some((i) => i.issueType === 'architectural_hotspot')).toBe(true);
    expect(issues.find((i) => i.issueType === 'architectural_hotspot')!.severity).toBe('error');
  });

  it('returns no hotspot issues for a balanced module', () => {
    const mod = makeModule('packages/ok', { fanIn: 3, fanOut: 5 });
    expect(PerformanceAnalyzer.detectHotspots([mod])).toHaveLength(0);
  });

  it('hotspotScore utility returns fanIn + fanOut', () => {
    const mod = makeModule('pkg', { fanIn: 7, fanOut: 9 });
    expect(PerformanceAnalyzer.hotspotScore(mod)).toBe(16);
  });
});

// ===========================================================================
// 6. PerformanceAnalyzer — detectBarrelBloat
// ===========================================================================
describe('PerformanceAnalyzer — detectBarrelBloat', () => {
  it('flags a barrel exporting more than 50 symbols', () => {
    const mod = makeModule('packages/bloated', { exportCount: 60 });
    const issues = PerformanceAnalyzer.detectBarrelBloat([mod]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('barrel_bloat');
  });

  it('returns no issues for a barrel within the limit', () => {
    const mod = makeModule('packages/ok', { exportCount: 30 });
    expect(PerformanceAnalyzer.detectBarrelBloat([mod])).toHaveLength(0);
  });
});

// ===========================================================================
// 7. PerformanceAnalyzer — detectHighComplexity (module complexity)
// ===========================================================================
describe('PerformanceAnalyzer — detectHighComplexity', () => {
  it('flags a module exceeding the complexity budget (fanOut × depth > 75)', () => {
    // 16 × 6 = 96 > 75
    const mod = makeModule('packages/complex', { fanOut: 16, importDepth: 6 });
    const issues = PerformanceAnalyzer.detectHighComplexity([mod]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('high_module_complexity');
    expect(issues[0].measuredValue).toBe(96);
  });

  it('assigns error severity when complexity exceeds 2× budget (> 150)', () => {
    const mod = makeModule('packages/very-complex', { fanOut: 20, importDepth: 10 });
    const issues = PerformanceAnalyzer.detectHighComplexity([mod]);
    expect(issues[0].severity).toBe('error');
  });

  it('returns no issues for modules within the complexity budget', () => {
    const mod = makeModule('packages/simple', { fanOut: 5, importDepth: 3 });
    expect(PerformanceAnalyzer.detectHighComplexity([mod])).toHaveLength(0);
  });

  it('complexityScore utility returns fanOut × importDepth', () => {
    const mod = makeModule('pkg', { fanOut: 10, importDepth: 4 });
    expect(PerformanceAnalyzer.complexityScore(mod)).toBe(40);
  });
});

// ===========================================================================
// 8. PerformanceAnalyzer — detectSplitCandidates
// ===========================================================================
describe('PerformanceAnalyzer — detectSplitCandidates', () => {
  it('flags a module with many exports and high fan-out as a split candidate', () => {
    // exportCount > 30, fanOut > 7.5 (15/2)
    const mod = makeModule('packages/mono', { exportCount: 40, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectSplitCandidates([mod]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('split_candidate');
    expect(issues[0].severity).toBe('info');
  });

  it('returns no issues when exports are within limit', () => {
    const mod = makeModule('packages/focused', { exportCount: 20, fanOut: 10 });
    expect(PerformanceAnalyzer.detectSplitCandidates([mod])).toHaveLength(0);
  });
});

// ===========================================================================
// 9. PerformanceValidator — assessIssues
// ===========================================================================
describe('PerformanceValidator — assessIssues', () => {
  it('returns zero counts for an empty issue list', () => {
    const assessment = PerformanceValidator.assessIssues([]);
    expect(assessment.totalIssues).toBe(0);
    expect(assessment.warningCount).toBe(0);
    expect(assessment.errorCount).toBe(0);
  });

  it('correctly counts mixed severity issues', () => {
    const modules = [
      makeModule('packages/a', { heavyDependencies: ['lodash'] }),  // warning
      makeModule('packages/b', { fanIn: 12, fanOut: 10 }),          // error (hotspot)
    ];
    const issues = PerformanceAnalyzer.analyzeAll(modules);
    const assessment = PerformanceValidator.assessIssues(issues);
    expect(assessment.warningCount).toBeGreaterThanOrEqual(1);
    expect(assessment.errorCount).toBeGreaterThanOrEqual(1);
  });

  it('groups issues by category', () => {
    const mod = makeModule('packages/deep', { importDepth: 8 });
    const issues = PerformanceAnalyzer.detectDeepImportChains([mod]);
    const assessment = PerformanceValidator.assessIssues(issues);
    expect(assessment.byCategory['import_depth']).toBeDefined();
  });

  it('groups issues by type', () => {
    const mod = makeModule('packages/heavy', { heavyDependencies: ['moment'] });
    const issues = PerformanceAnalyzer.detectHeavyDependencies([mod]);
    const assessment = PerformanceValidator.assessIssues(issues);
    expect(assessment.byType['heavy_dependency']).toBeDefined();
  });
});

// ===========================================================================
// 10. PerformanceValidator — prioritiseRecommendations
// ===========================================================================
describe('PerformanceValidator — prioritiseRecommendations', () => {
  it('returns an empty list for no issues', () => {
    expect(PerformanceValidator.prioritiseRecommendations([])).toHaveLength(0);
  });

  it('assigns priority 1 to architectural hotspot recommendations', () => {
    const mod = makeModule('packages/hotspot', { fanIn: 12, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    const recs = PerformanceValidator.prioritiseRecommendations(issues);
    const hotspotRec = recs.find((r) => r.category === 'hotspot');
    expect(hotspotRec).toBeDefined();
    expect(hotspotRec!.priority).toBe(1);
  });

  it('assigns high impact to hotspot recommendations', () => {
    const mod = makeModule('packages/hotspot', { fanIn: 12, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    const recs = PerformanceValidator.prioritiseRecommendations(issues);
    const hotspotRec = recs.find((r) => r.category === 'hotspot' && r.title.includes('Hotspot'));
    expect(hotspotRec?.estimatedImpact).toBe('high');
  });

  it('includes instance count in recommendation description', () => {
    const mods = [
      makeModule('packages/heavy-a', { heavyDependencies: ['lodash'] }),
      makeModule('packages/heavy-b', { heavyDependencies: ['moment'] }),
    ];
    const issues = PerformanceAnalyzer.detectHeavyDependencies(mods);
    const recs = PerformanceValidator.prioritiseRecommendations(issues);
    const depRec = recs.find((r) => r.category === 'dependency_cost');
    expect(depRec?.description).toContain('2 instances');
  });

  it('sorts recommendations so highest-impact appears first', () => {
    const mods = [
      makeModule('packages/split', { exportCount: 40, fanOut: 10 }),  // split_candidate (low impact)
      makeModule('packages/hotspot', { fanIn: 12, fanOut: 10 }),       // hotspot (high impact)
    ];
    const issues = PerformanceAnalyzer.analyzeAll(mods);
    const recs = PerformanceValidator.prioritiseRecommendations(issues);
    expect(recs[0].priority).toBeLessThan(
      recs.find((r) => r.category === 'split_opportunity')?.priority ?? Infinity
    );
  });
});

// ===========================================================================
// 11. PerformanceValidator — validateLimits
// ===========================================================================
describe('PerformanceValidator — validateLimits', () => {
  it('passes all metrics for a clean module set', () => {
    const modules = [makeModule('packages/clean')];
    const metrics = PerformanceValidator.validateLimits([], modules);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails architecturalHotspotCount when hotspots are present', () => {
    const mod = makeModule('packages/hot', { fanIn: 12, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    const metrics = PerformanceValidator.validateLimits(issues, [mod]);
    const metric = metrics.find((m) => m.metricName === 'architecturalHotspotCount');
    expect(metric?.passing).toBe(false);
  });

  it('fails deepImportChainCount when deep chains are present', () => {
    const mod = makeModule('packages/deep', { importDepth: 8 });
    const issues = PerformanceAnalyzer.detectDeepImportChains([mod]);
    const metrics = PerformanceValidator.validateLimits(issues, [mod]);
    const metric = metrics.find((m) => m.metricName === 'deepImportChainCount');
    expect(metric?.passing).toBe(false);
  });

  it('fails averageImportDepth when average exceeds 5', () => {
    const modules = [
      makeModule('packages/a', { importDepth: 8 }),
      makeModule('packages/b', { importDepth: 9 }),
    ];
    const metrics = PerformanceValidator.validateLimits([], modules);
    const metric = metrics.find((m) => m.metricName === 'averageImportDepth');
    expect(metric?.passing).toBe(false);
  });
});

// ===========================================================================
// 12. PerformanceReportGenerator
// ===========================================================================
describe('PerformanceReportGenerator — calculateScore', () => {
  it('returns 100 for a clean assessment', () => {
    const assessment = PerformanceValidator.assessIssues([]);
    expect(PerformanceReportGenerator.calculateScore(assessment)).toBe(100);
  });

  it('penalises errors (15 pts each)', () => {
    const mod = makeModule('packages/hot', { fanIn: 12, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    const assessment = PerformanceValidator.assessIssues(issues);
    const score = PerformanceReportGenerator.calculateScore(assessment);
    expect(score).toBeLessThan(100);
  });

  it('never drops below 0', () => {
    const assessment = PerformanceValidator.assessIssues([]);
    assessment.criticalCount = 100;
    expect(PerformanceReportGenerator.calculateScore(assessment)).toBe(0);
  });
});

describe('PerformanceReportGenerator — deriveGrade', () => {
  it('returns A+ for score >= 97', () => {
    expect(PerformanceReportGenerator.deriveGrade(100)).toBe('A+');
    expect(PerformanceReportGenerator.deriveGrade(97)).toBe('A+');
  });

  it('returns A for score 90–96', () => {
    expect(PerformanceReportGenerator.deriveGrade(90)).toBe('A');
  });

  it('returns B for score 80–89', () => {
    expect(PerformanceReportGenerator.deriveGrade(80)).toBe('B');
  });

  it('returns C for score 65–79', () => {
    expect(PerformanceReportGenerator.deriveGrade(65)).toBe('C');
  });

  it('returns D for score 50–64', () => {
    expect(PerformanceReportGenerator.deriveGrade(50)).toBe('D');
  });

  it('returns F for score < 50', () => {
    expect(PerformanceReportGenerator.deriveGrade(0)).toBe('F');
  });
});

describe('PerformanceReportGenerator — generateReport', () => {
  it('produces a valid report for a clean module set', () => {
    const assessment = PerformanceValidator.assessIssues([]);
    const mod = makeModule('packages/clean');
    const report = PerformanceReportGenerator.generateReport(assessment, [], [mod]);
    expect(report.performanceHealthScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.moduleCount).toBe(1);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('includes prioritised recommendations', () => {
    const mod = makeModule('packages/hot', { fanIn: 12, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    const assessment = PerformanceValidator.assessIssues(issues);
    const report = PerformanceReportGenerator.generateReport(assessment, issues, [mod]);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.recommendations[0].priority).toBe(1);
  });
});

describe('PerformanceReportGenerator — toMarkdown', () => {
  it('contains the report heading', () => {
    const assessment = PerformanceValidator.assessIssues([]);
    const report = PerformanceReportGenerator.generateReport(assessment, [], []);
    expect(PerformanceReportGenerator.toMarkdown(report)).toContain('# Performance Intelligence Health Report');
  });

  it('lists issue types in the Markdown output', () => {
    const mod = makeModule('packages/deep', { importDepth: 8 });
    const issues = PerformanceAnalyzer.detectDeepImportChains([mod]);
    const assessment = PerformanceValidator.assessIssues(issues);
    const report = PerformanceReportGenerator.generateReport(assessment, issues, [mod]);
    expect(PerformanceReportGenerator.toMarkdown(report)).toContain('deep_import_chain');
  });

  it('includes priority labels in recommendations section', () => {
    const mod = makeModule('packages/hot', { fanIn: 12, fanOut: 10 });
    const issues = PerformanceAnalyzer.detectHotspots([mod]);
    const assessment = PerformanceValidator.assessIssues(issues);
    const report = PerformanceReportGenerator.generateReport(assessment, issues, [mod]);
    const md = PerformanceReportGenerator.toMarkdown(report);
    expect(md).toContain('P1 —');
  });
});

describe('PerformanceReportGenerator — toJSON', () => {
  it('produces valid JSON with performanceHealthScore', () => {
    const assessment = PerformanceValidator.assessIssues([]);
    const report = PerformanceReportGenerator.generateReport(assessment, [], []);
    const json = PerformanceReportGenerator.toJSON(report);
    expect(json).toContain('"performanceHealthScore"');
    expect(json).toContain('"grade"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 13. PerformanceCLI
// ===========================================================================
describe('PerformanceCLI', () => {
  it('defaults to help with no args', () => {
    expect(PerformanceCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze', () => {
    expect(PerformanceCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate', () => {
    expect(PerformanceCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report', () => {
    expect(PerformanceCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses --target', () => {
    expect(PerformanceCLI.parseArgs(['analyze', '--target=packages']).targetPath).toBe('packages');
  });

  it('parses --out', () => {
    expect(PerformanceCLI.parseArgs(['report', '--out=dist/perf.md']).outputPath).toBe('dist/perf.md');
  });

  it('parses --format=json', () => {
    expect(PerformanceCLI.parseArgs(['report', '--format=json']).format).toBe('json');
  });

  it('defaults to markdown format', () => {
    expect(PerformanceCLI.parseArgs(['report']).format).toBe('markdown');
  });

  it('parses all options together', () => {
    const result = PerformanceCLI.parseArgs(['report', '--target=.', '--format=json', '--out=perf.json']);
    expect(result.command).toBe('report');
    expect(result.targetPath).toBe('.');
    expect(result.format).toBe('json');
    expect(result.outputPath).toBe('perf.json');
  });

  it('help text contains all commands', () => {
    const help = PerformanceCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
  });

  it('help text documents all options', () => {
    const help = PerformanceCLI.getHelpText();
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 14. analyzeAll — integration smoke test
// ===========================================================================
describe('PerformanceAnalyzer — analyzeAll integration', () => {
  it('returns no errors for a clean module', () => {
    const mod = makeModule('packages/clean', {
      fanIn: 2, fanOut: 3, importDepth: 2,
      estimatedSizeKb: 50, exportCount: 10,
      heavyDependencies: [],
    });
    const issues = PerformanceAnalyzer.analyzeAll([mod]);
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('returns combined issues across multiple risk categories for a problematic module', () => {
    const mod = makeModule('packages/problematic', {
      fanIn: 15,
      fanOut: 20,
      importDepth: 8,
      estimatedSizeKb: 300,
      exportCount: 70,
      heavyDependencies: ['lodash'],
    });
    const issues = PerformanceAnalyzer.analyzeAll([mod]);
    const categories = new Set(issues.map((i) => i.category));
    expect(categories.size).toBeGreaterThan(2);
  });
});
