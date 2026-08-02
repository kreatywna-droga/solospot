import { describe, it, expect } from 'vitest';
import {
  ComplianceAnalyzer,
  ComplianceValidator,
  ComplianceReportGenerator,
  ComplianceCLI,
  DEFAULT_ARCHITECTURE_RULES,
} from './index';
import type {
  ArchitectureRule,
  ModuleDescriptor,
} from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeModule(
  modulePath: string,
  layer: ModuleDescriptor['layer'],
  dependencyLayers: Record<string, ModuleDescriptor['layer']> = {},
  dependencies: string[] = Object.keys(dependencyLayers),
  declaredAdrIds: string[] = []
): ModuleDescriptor {
  return { modulePath, layer, dependencies, dependencyLayers, declaredAdrIds };
}

function makeRule(
  ruleId: string,
  fromLayer: ArchitectureRule['fromLayer'],
  toLayer: ArchitectureRule['toLayer'],
  allowed: boolean,
  severity: ArchitectureRule['violationSeverity'] = 'error',
  adrId?: string
): ArchitectureRule {
  return {
    ruleId,
    name: `${fromLayer} → ${toLayer} ${allowed ? 'allowed' : 'forbidden'}`,
    fromLayer,
    toLayer,
    allowed,
    violationSeverity: severity,
    adrId,
  };
}

// ===========================================================================
// 1. ComplianceAnalyzer — parseModules / parseRules
// ===========================================================================
describe('ComplianceAnalyzer — parseModules', () => {
  it('converts raw data into ModuleDescriptor objects', () => {
    const modules = ComplianceAnalyzer.parseModules([
      { modulePath: 'packages/ui-core', layer: 'ui', dependencies: ['@infra/db'] },
    ]);
    expect(modules).toHaveLength(1);
    expect(modules[0].layer).toBe('ui');
    expect(modules[0].dependencies).toContain('@infra/db');
  });

  it('defaults empty dependencies when not provided', () => {
    const modules = ComplianceAnalyzer.parseModules([
      { modulePath: 'packages/bare', layer: 'shared' },
    ]);
    expect(modules[0].dependencies).toHaveLength(0);
  });
});

describe('ComplianceAnalyzer — parseRules', () => {
  it('returns default rules when no rules provided', () => {
    const rules = ComplianceAnalyzer.parseRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules).toStrictEqual(DEFAULT_ARCHITECTURE_RULES);
  });

  it('parses custom rules', () => {
    const custom = [makeRule('CUSTOM-001', 'ui', 'infrastructure', false, 'critical')];
    const rules = ComplianceAnalyzer.parseRules(custom);
    expect(rules).toHaveLength(1);
    expect(rules[0].ruleId).toBe('CUSTOM-001');
  });
});

// ===========================================================================
// 2. ComplianceAnalyzer — detectLayerViolations (layer violation detection)
// ===========================================================================
describe('ComplianceAnalyzer — detectLayerViolations', () => {
  it('flags a UI module importing from infrastructure', () => {
    const module = makeModule('packages/ui-comp', 'ui', { 'packages/db-adapter': 'infrastructure' });
    const rules = [makeRule('RULE-001', 'ui', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe('layer_violation');
    expect(violations[0].severity).toBe('critical');
    expect(violations[0].ruleId).toBe('RULE-001');
  });

  it('flags a domain module importing from application', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/app': 'application' });
    const rules = [makeRule('RULE-006', 'domain', 'application', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    expect(violations).toHaveLength(1);
    expect(violations[0].sourceLayer).toBe('domain');
    expect(violations[0].targetLayer).toBe('application');
  });

  it('returns no violations when the dependency direction is allowed', () => {
    const module = makeModule('packages/ui', 'ui', { 'packages/shared': 'shared' });
    const rules = [makeRule('RULE-003', 'ui', 'shared', true, 'info')];
    expect(ComplianceAnalyzer.detectLayerViolations([module], rules)).toHaveLength(0);
  });

  it('flags multiple violations in a single module', () => {
    const module = makeModule('packages/ui', 'ui', {
      'packages/db': 'infrastructure',
      'packages/domain': 'domain',
    });
    const rules = [
      makeRule('RULE-001', 'ui', 'infrastructure', false, 'critical'),
      makeRule('RULE-002', 'ui', 'domain',         false, 'error'),
    ];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    expect(violations).toHaveLength(2);
  });

  it('returns no violations for a compliant module set', () => {
    const module = makeModule('packages/app', 'application', { 'packages/shared': 'shared' });
    const rules  = [makeRule('RULE-APP-SHARED', 'application', 'shared', true, 'info')];
    expect(ComplianceAnalyzer.detectLayerViolations([module], rules)).toHaveLength(0);
  });
});

// ===========================================================================
// 3. ComplianceAnalyzer — detectForbiddenDependencies
// ===========================================================================
describe('ComplianceAnalyzer — detectForbiddenDependencies', () => {
  it('flags a UI module importing an infra-like path heuristically', () => {
    const module = makeModule('packages/ui-comp', 'ui', {}, ['packages/db-adapter/src/database']);
    const rules  = DEFAULT_ARCHITECTURE_RULES;
    const violations = ComplianceAnalyzer.detectForbiddenDependencies([module], rules);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe('forbidden_dependency');
    expect(violations[0].severity).toBe('critical');
  });

  it('flags a domain module with a direct redis import', () => {
    const module = makeModule('packages/domain', 'domain', {}, ['lib/cache/redis']);
    const violations = ComplianceAnalyzer.detectForbiddenDependencies([module], DEFAULT_ARCHITECTURE_RULES);
    expect(violations).toHaveLength(1);
    expect(violations[0].adrId).toBe('ADR-001');
  });

  it('returns no violations for clean modules', () => {
    const module = makeModule('packages/ui', 'ui', { 'packages/shared': 'shared' }, ['packages/shared']);
    expect(ComplianceAnalyzer.detectForbiddenDependencies([module], DEFAULT_ARCHITECTURE_RULES)).toHaveLength(0);
  });
});

// ===========================================================================
// 4. ComplianceAnalyzer — detectModuleBoundaryBreaches
// ===========================================================================
describe('ComplianceAnalyzer — detectModuleBoundaryBreaches', () => {
  it('flags an import from a /src/ internal path', () => {
    const module = makeModule('packages/consumer', 'application', {}, [
      'packages/builder/src/internal/BuilderCore',
    ]);
    const violations = ComplianceAnalyzer.detectModuleBoundaryBreaches([module]);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe('module_boundary_breach');
    expect(violations[0].severity).toBe('error');
  });

  it('flags an import from a /internal/ path', () => {
    const module = makeModule('packages/consumer', 'ui', {}, [
      '@web-factor/builder/internal/types',
    ]);
    const violations = ComplianceAnalyzer.detectModuleBoundaryBreaches([module]);
    expect(violations).toHaveLength(1);
  });

  it('returns no violations for barrel-only imports', () => {
    const module = makeModule('packages/consumer', 'ui', {}, ['@web-factor/builder']);
    expect(ComplianceAnalyzer.detectModuleBoundaryBreaches([module])).toHaveLength(0);
  });
});

// ===========================================================================
// 5. ComplianceAnalyzer — detectADRViolations (ADR compliance)
// ===========================================================================
describe('ComplianceAnalyzer — detectADRViolations', () => {
  it('flags an ADR-001 violation when domain imports infrastructure', () => {
    const module = makeModule('packages/domain', 'domain', {
      'packages/db-adapter': 'infrastructure',
    });
    const rules = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical', 'ADR-001')];
    const violations = ComplianceAnalyzer.detectADRViolations([module], rules);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe('adr_violation');
    expect(violations[0].adrId).toBe('ADR-001');
  });

  it('flags an ADR-003 violation when application imports infrastructure directly', () => {
    const module = makeModule('packages/app', 'application', {
      'packages/db': 'infrastructure',
    });
    const rules = [makeRule('RULE-005', 'application', 'infrastructure', false, 'error', 'ADR-003')];
    const violations = ComplianceAnalyzer.detectADRViolations([module], rules);
    expect(violations).toHaveLength(1);
    expect(violations[0].adrId).toBe('ADR-003');
  });

  it('returns no ADR violations for a compliant module', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/shared': 'shared' });
    const rules = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical', 'ADR-001')];
    expect(ComplianceAnalyzer.detectADRViolations([module], rules)).toHaveLength(0);
  });

  it('returns no violations when no rules have ADR IDs', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    expect(ComplianceAnalyzer.detectADRViolations([module], rules)).toHaveLength(0);
  });
});

// ===========================================================================
// 6. ComplianceAnalyzer — detectSeparationOfConcernsViolations
// ===========================================================================
describe('ComplianceAnalyzer — detectSeparationOfConcernsViolations', () => {
  it('flags a module that imports from both UI and infrastructure', () => {
    const module = makeModule('packages/mixed', 'application', {
      'packages/button': 'ui',
      'packages/db':     'infrastructure',
    });
    const violations = ComplianceAnalyzer.detectSeparationOfConcernsViolations([module]);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe('separation_of_concerns');
  });

  it('returns no violation when only one concern layer is imported', () => {
    const module = makeModule('packages/app', 'application', {
      'packages/domain': 'domain',
    });
    expect(ComplianceAnalyzer.detectSeparationOfConcernsViolations([module])).toHaveLength(0);
  });
});

// ===========================================================================
// 7. ComplianceAnalyzer — detectDirectInfrastructureAccess
// ===========================================================================
describe('ComplianceAnalyzer — detectDirectInfrastructureAccess', () => {
  it('flags a UI module directly accessing infrastructure', () => {
    const module = makeModule('packages/ui', 'ui', {
      'packages/postgres-adapter': 'infrastructure',
    });
    const violations = ComplianceAnalyzer.detectDirectInfrastructureAccess([module]);
    expect(violations).toHaveLength(1);
    expect(violations[0].violationType).toBe('direct_infrastructure_access');
    expect(violations[0].severity).toBe('critical');
  });

  it('flags a domain module directly accessing infrastructure', () => {
    const module = makeModule('packages/domain', 'domain', {
      'packages/email-sender': 'infrastructure',
    });
    expect(ComplianceAnalyzer.detectDirectInfrastructureAccess([module])).toHaveLength(1);
  });

  it('does not flag infrastructure modules importing from infrastructure', () => {
    const module = makeModule('packages/infra-a', 'infrastructure', {
      'packages/infra-b': 'infrastructure',
    });
    expect(ComplianceAnalyzer.detectDirectInfrastructureAccess([module])).toHaveLength(0);
  });

  it('does not flag application modules accessing infrastructure (different rule covers it)', () => {
    const module = makeModule('packages/app', 'application', {
      'packages/db': 'infrastructure',
    });
    // application is not in the NON_INFRA_LAYERS list for this specific check
    expect(ComplianceAnalyzer.detectDirectInfrastructureAccess([module])).toHaveLength(0);
  });
});

// ===========================================================================
// 8. ComplianceValidator — assessViolations
// ===========================================================================
describe('ComplianceValidator — assessViolations', () => {
  it('returns zero counts for no violations', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    expect(assessment.totalViolations).toBe(0);
    expect(assessment.criticalCount).toBe(0);
  });

  it('correctly counts mixed severity violations', () => {
    const domainModule = makeModule('packages/domain', 'domain', {
      'packages/db': 'infrastructure',
    });
    const uiModule = makeModule('packages/ui', 'ui', {
      'packages/db': 'infrastructure',
    });
    const rules = [
      makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical'),
      makeRule('RULE-001', 'ui',     'infrastructure', false, 'error'),
    ];
    const violations = ComplianceAnalyzer.detectLayerViolations([domainModule, uiModule], rules);
    const assessment = ComplianceValidator.assessViolations(violations);
    expect(assessment.criticalCount).toBe(1);
    expect(assessment.errorCount).toBe(1);
  });

  it('groups violations by type', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const assessment = ComplianceValidator.assessViolations(violations);
    expect(assessment.byType['layer_violation']).toBeDefined();
  });

  it('groups violations by rule ID', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const assessment = ComplianceValidator.assessViolations(violations);
    expect(assessment.byRule['RULE-007']).toBeDefined();
  });
});

// ===========================================================================
// 9. ComplianceValidator — prioritiseRecommendations
// ===========================================================================
describe('ComplianceValidator — prioritiseRecommendations', () => {
  it('returns empty recommendations for no violations', () => {
    expect(ComplianceValidator.prioritiseRecommendations([])).toHaveLength(0);
  });

  it('assigns priority 1 to direct infrastructure access recommendations', () => {
    const module = makeModule('packages/ui', 'ui', { 'packages/db': 'infrastructure' });
    const violations = ComplianceAnalyzer.detectDirectInfrastructureAccess([module]);
    const recs = ComplianceValidator.prioritiseRecommendations(violations);
    expect(recs[0].priority).toBe(1);
    expect(recs[0].violationType).toBe('direct_infrastructure_access');
  });

  it('assigns high impact to layer violation recommendations', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const recs = ComplianceValidator.prioritiseRecommendations(violations);
    const layerRec = recs.find((r) => r.violationType === 'layer_violation');
    expect(layerRec?.estimatedImpact).toBe('high');
  });

  it('includes instance count in the description', () => {
    const modules = [
      makeModule('packages/a', 'domain', { 'packages/db': 'infrastructure' }),
      makeModule('packages/b', 'domain', { 'packages/cache': 'infrastructure' }),
    ];
    const rules = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations(modules, rules);
    const recs = ComplianceValidator.prioritiseRecommendations(violations);
    expect(recs[0].description).toContain('2 instances');
  });

  it('assigns boundary breach recommendation a lower priority than layer violations', () => {
    const modules = [
      makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' }),
      makeModule('packages/consumer', 'ui', {}, ['@web-factor/builder/src/internal']),
    ];
    const rules = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = [
      ...ComplianceAnalyzer.detectLayerViolations([modules[0]], rules),
      ...ComplianceAnalyzer.detectModuleBoundaryBreaches([modules[1]]),
    ];
    const recs = ComplianceValidator.prioritiseRecommendations(violations);
    const layerP = recs.find((r) => r.violationType === 'layer_violation')?.priority ?? 99;
    const boundaryP = recs.find((r) => r.violationType === 'module_boundary_breach')?.priority ?? 99;
    expect(layerP).toBeLessThan(boundaryP);
  });
});

// ===========================================================================
// 10. ComplianceValidator — validateLimits
// ===========================================================================
describe('ComplianceValidator — validateLimits', () => {
  it('passes all metrics for a fully compliant module set', () => {
    const module = makeModule('packages/clean', 'shared');
    const rules  = DEFAULT_ARCHITECTURE_RULES;
    const metrics = ComplianceValidator.validateLimits([], [module], rules);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails criticalViolationCount when critical violations exist', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const metrics = ComplianceValidator.validateLimits(violations, [module], rules);
    expect(metrics.find((m) => m.metricName === 'criticalViolationCount')?.passing).toBe(false);
  });

  it('fails rulePassRate when a rule is violated', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const metrics = ComplianceValidator.validateLimits(violations, [module], rules);
    expect(metrics.find((m) => m.metricName === 'rulePassRate')?.passing).toBe(false);
  });

  it('fails moduleComplianceRate when a module has violations', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const metrics = ComplianceValidator.validateLimits(violations, [module], rules);
    expect(metrics.find((m) => m.metricName === 'moduleComplianceRate')?.passing).toBe(false);
  });
});

// ===========================================================================
// 11. ComplianceReportGenerator
// ===========================================================================
describe('ComplianceReportGenerator — calculateScore', () => {
  it('returns 100 for a clean assessment', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    expect(ComplianceReportGenerator.calculateScore(assessment)).toBe(100);
  });

  it('penalises critical violations (25 pts each)', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    assessment.criticalCount = 2;
    assessment.totalViolations = 2;
    expect(ComplianceReportGenerator.calculateScore(assessment)).toBe(50);
  });

  it('never drops below 0', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    assessment.criticalCount = 100;
    expect(ComplianceReportGenerator.calculateScore(assessment)).toBe(0);
  });
});

describe('ComplianceReportGenerator — deriveGrade', () => {
  it('returns A+ for score >= 97', () => {
    expect(ComplianceReportGenerator.deriveGrade(100)).toBe('A+');
    expect(ComplianceReportGenerator.deriveGrade(97)).toBe('A+');
  });

  it('returns A for 90–96', () => {
    expect(ComplianceReportGenerator.deriveGrade(90)).toBe('A');
  });

  it('returns B for 80–89', () => {
    expect(ComplianceReportGenerator.deriveGrade(80)).toBe('B');
  });

  it('returns F for < 50', () => {
    expect(ComplianceReportGenerator.deriveGrade(0)).toBe('F');
  });
});

describe('ComplianceReportGenerator — generateReport', () => {
  it('produces a valid report for a clean module set', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    const rules = DEFAULT_ARCHITECTURE_RULES;
    const module = makeModule('packages/clean', 'shared');
    const report = ComplianceReportGenerator.generateReport(assessment, [], [module], rules);
    expect(report.complianceScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.moduleCount).toBe(1);
    expect(report.ruleCount).toBe(rules.length);
    expect(report.passingRuleCount).toBe(rules.length);
  });

  it('includes prioritised recommendations when violations exist', () => {
    const module = makeModule('packages/domain', 'domain', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-007', 'domain', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const assessment = ComplianceValidator.assessViolations(violations);
    const report = ComplianceReportGenerator.generateReport(assessment, violations, [module], rules);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.passingRuleCount).toBe(0);
  });
});

describe('ComplianceReportGenerator — toMarkdown', () => {
  it('contains the report heading', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    const report = ComplianceReportGenerator.generateReport(assessment, [], [], DEFAULT_ARCHITECTURE_RULES);
    const md = ComplianceReportGenerator.toMarkdown(report);
    expect(md).toContain('# Architecture Compliance Intelligence Report');
  });

  it('includes violation type in the Markdown output', () => {
    const module = makeModule('packages/ui', 'ui', { 'packages/db': 'infrastructure' });
    const rules  = [makeRule('RULE-001', 'ui', 'infrastructure', false, 'critical')];
    const violations = ComplianceAnalyzer.detectLayerViolations([module], rules);
    const assessment = ComplianceValidator.assessViolations(violations);
    const report = ComplianceReportGenerator.generateReport(assessment, violations, [module], rules);
    expect(ComplianceReportGenerator.toMarkdown(report)).toContain('layer_violation');
  });

  it('includes the passing rule count', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    const rules = DEFAULT_ARCHITECTURE_RULES;
    const report = ComplianceReportGenerator.generateReport(assessment, [], [], rules);
    const md = ComplianceReportGenerator.toMarkdown(report);
    expect(md).toContain('Passing Rules');
  });
});

describe('ComplianceReportGenerator — toJSON', () => {
  it('produces valid JSON with complianceScore', () => {
    const assessment = ComplianceValidator.assessViolations([]);
    const report = ComplianceReportGenerator.generateReport(assessment, [], [], DEFAULT_ARCHITECTURE_RULES);
    const json = ComplianceReportGenerator.toJSON(report);
    expect(json).toContain('"complianceScore"');
    expect(json).toContain('"grade"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 12. ComplianceCLI
// ===========================================================================
describe('ComplianceCLI', () => {
  it('defaults to help with no args', () => {
    expect(ComplianceCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze', () => {
    expect(ComplianceCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate', () => {
    expect(ComplianceCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report', () => {
    expect(ComplianceCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses --target', () => {
    expect(ComplianceCLI.parseArgs(['analyze', '--target=packages']).targetPath).toBe('packages');
  });

  it('parses --out', () => {
    expect(ComplianceCLI.parseArgs(['report', '--out=dist/compliance.md']).outputPath).toBe('dist/compliance.md');
  });

  it('parses --format=json', () => {
    expect(ComplianceCLI.parseArgs(['report', '--format=json']).format).toBe('json');
  });

  it('defaults to markdown format', () => {
    expect(ComplianceCLI.parseArgs(['report']).format).toBe('markdown');
  });

  it('parses all options together', () => {
    const result = ComplianceCLI.parseArgs(['report', '--target=.', '--format=json', '--out=compliance.json']);
    expect(result.command).toBe('report');
    expect(result.targetPath).toBe('.');
    expect(result.format).toBe('json');
    expect(result.outputPath).toBe('compliance.json');
  });

  it('help text contains all commands', () => {
    const help = ComplianceCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
  });

  it('help text documents all options', () => {
    const help = ComplianceCLI.getHelpText();
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 13. analyzeAll — integration smoke test
// ===========================================================================
describe('ComplianceAnalyzer — analyzeAll integration', () => {
  it('returns no violations for a fully compliant module set', () => {
    const module = makeModule('packages/shared-utils', 'shared');
    const violations = ComplianceAnalyzer.analyzeAll([module], DEFAULT_ARCHITECTURE_RULES);
    expect(violations.filter((v) => v.severity === 'critical')).toHaveLength(0);
  });

  it('returns combined violations from multiple passes for a broken module', () => {
    const module = makeModule(
      'packages/broken-ui',
      'ui',
      { 'packages/db-adapter': 'infrastructure', 'packages/domain': 'domain' },
      ['packages/db-adapter', 'packages/domain', 'packages/builder/src/internal/Core']
    );
    const violations = ComplianceAnalyzer.analyzeAll([module], DEFAULT_ARCHITECTURE_RULES);
    const types = new Set(violations.map((v) => v.violationType));
    expect(types.size).toBeGreaterThan(1);
  });
});
