import { describe, it, expect } from 'vitest';
import {
  ReleaseReadinessAnalyzer,
  ReleaseReadinessValidator,
  ReleaseReadinessReportGenerator,
  ReleaseReadinessCLI,
  DEFAULT_RELEASE_GATES,
} from './index';
import type { ReleaseSnapshot } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeSnapshot(overrides: Partial<ReleaseSnapshot> = {}): ReleaseSnapshot {
  return ReleaseReadinessAnalyzer.parseSnapshot(overrides);
}

// ===========================================================================
// 1. ReleaseReadinessAnalyzer — parseSnapshot & parseGates
// ===========================================================================
describe('ReleaseReadinessAnalyzer — parseSnapshot & parseGates', () => {
  it('converts raw inputs into a clean ReleaseSnapshot object with default intelligence fields', () => {
    const snapshot = ReleaseReadinessAnalyzer.parseSnapshot({ targetVersion: '1.2.0' });
    expect(snapshot.targetVersion).toBe('1.2.0');
    expect(snapshot.hasArchitectureFreezeDoc).toBe(true);
    expect(snapshot.intelligence.securityHealthScore).toBe(100);
  });

  it('returns default gates when no gates provided', () => {
    const gates = ReleaseReadinessAnalyzer.parseGates();
    expect(gates).toHaveLength(DEFAULT_RELEASE_GATES.length);
    expect(gates[0].gateId).toBe('GATE-001');
  });
});

// ===========================================================================
// 2. ReleaseReadinessAnalyzer — Static Analysis Passes
// ===========================================================================
describe('ReleaseReadinessAnalyzer — Static Analysis Passes', () => {
  it('flags missing root README artifact', () => {
    const snapshot = makeSnapshot({ hasRootReadme: false });
    const risks = ReleaseReadinessAnalyzer.analyzeRequiredArtifacts(snapshot);
    expect(risks).toHaveLength(1);
    expect(risks[0].title).toContain('Missing Root README');
    expect(risks[0].isBlocker).toBe(false);
  });

  it('flags unapproved Architecture Freeze specification as a blocker', () => {
    const snapshot = makeSnapshot({ isArchitectureFreezeApproved: false });
    const risks = ReleaseReadinessAnalyzer.analyzeArchitectureFreeze(snapshot);
    expect(risks).toHaveLength(1);
    expect(risks[0].isBlocker).toBe(true);
    expect(risks[0].severity).toBe('critical');
  });

  it('flags unhandled breaking API changes as a blocker', () => {
    const snapshot = makeSnapshot({ intelligence: { breakingChangeCount: 3 } });
    const risks = ReleaseReadinessAnalyzer.analyzePublicApiReadiness(snapshot);
    expect(risks).toHaveLength(1);
    expect(risks[0].isBlocker).toBe(true);
    expect(risks[0].title).toContain('Unhandled Public API Breaking Changes');
  });

  it('flags missing package configuration files as a blocker', () => {
    const snapshot = makeSnapshot({ intelligence: { configMissingCount: 2 } });
    const risks = ReleaseReadinessAnalyzer.analyzeConfigurationReadiness(snapshot);
    expect(risks).toHaveLength(1);
    expect(risks[0].isBlocker).toBe(true);
  });
});

// ===========================================================================
// 3. ReleaseReadinessAnalyzer — Intelligence Report Aggregation (Read-Only)
// ===========================================================================
describe('ReleaseReadinessAnalyzer — Intelligence Report Aggregation', () => {
  it('aggregates critical security findings into a release blocker risk', () => {
    const snapshot = makeSnapshot({ intelligence: { securityCriticalCount: 2 } });
    const risks = ReleaseReadinessAnalyzer.analyzeIntelligenceReports(snapshot);
    expect(risks.some((r) => r.category === 'security_compliance' && r.isBlocker)).toBe(true);
  });

  it('aggregates circular dependency cycles into a release blocker risk', () => {
    const snapshot = makeSnapshot({ intelligence: { cycleCount: 1 } });
    const risks = ReleaseReadinessAnalyzer.analyzeIntelligenceReports(snapshot);
    expect(risks.some((r) => r.category === 'dependency_health' && r.isBlocker)).toBe(true);
  });

  it('aggregates low performance score into a non-blocker warning risk', () => {
    const snapshot = makeSnapshot({ intelligence: { performanceHealthScore: 75 } });
    const risks = ReleaseReadinessAnalyzer.analyzeIntelligenceReports(snapshot);
    const perfRisk = risks.find((r) => r.category === 'performance_standards');
    expect(perfRisk).toBeDefined();
    expect(perfRisk?.isBlocker).toBe(false);
  });
});

// ===========================================================================
// 4. ReleaseReadinessValidator — evaluateGates & Status Derivation
// ===========================================================================
describe('ReleaseReadinessValidator — evaluateGates & Status Derivation', () => {
  it('derives status "Ready" when all mandatory and optional gates pass', () => {
    const snapshot = makeSnapshot();
    const gates = DEFAULT_RELEASE_GATES;
    const risks = ReleaseReadinessAnalyzer.analyzeAll(snapshot, gates);
    const results = ReleaseReadinessValidator.evaluateGates(gates, snapshot, risks);
    const status = ReleaseReadinessValidator.deriveStatus(results, risks);

    expect(status).toBe('Ready');
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('derives status "Not Ready" when a mandatory gate fails', () => {
    const snapshot = makeSnapshot({ isArchitectureFreezeApproved: false });
    const gates = DEFAULT_RELEASE_GATES;
    const risks = ReleaseReadinessAnalyzer.analyzeAll(snapshot, gates);
    const results = ReleaseReadinessValidator.evaluateGates(gates, snapshot, risks);
    const status = ReleaseReadinessValidator.deriveStatus(results, risks);

    expect(status).toBe('Not Ready');
    expect(results.find((g) => g.gateId === 'GATE-001')?.passed).toBe(false);
  });

it('derives status "Conditionally Ready" when optional gates fail but mandatory pass', () => {
    const snapshot = makeSnapshot({ intelligence: { documentationHealthScore: 70 } });
    const gates = DEFAULT_RELEASE_GATES;
    const risks = ReleaseReadinessAnalyzer.analyzeAll(snapshot, gates);
    const results = ReleaseReadinessValidator.evaluateGates(gates, snapshot, risks);
    const status = ReleaseReadinessValidator.deriveStatus(results, risks);

    expect(status).toBe('Conditionally Ready');
    expect(results.find((g) => g.gateId === 'GATE-007')?.passed).toBe(false);
  });
});

// ===========================================================================
// 5. ReleaseReadinessValidator — assessReadiness & Recommendations
// ===========================================================================
describe('ReleaseReadinessValidator — assessReadiness & Recommendations', () => {
  it('prioritises mandatory gate remediations at priority 1', () => {
    const snapshot = makeSnapshot({ isArchitectureFreezeApproved: false });
    const gates = DEFAULT_RELEASE_GATES;
    const risks = ReleaseReadinessAnalyzer.analyzeAll(snapshot, gates);
    const results = ReleaseReadinessValidator.evaluateGates(gates, snapshot, risks);
    const recs = ReleaseReadinessValidator.prioritiseRecommendations(results, risks);

    expect(recs[0].priority).toBe(1);
    expect(recs[0].title).toContain('Fulfill Mandatory Gate');
    expect(recs[0].estimatedImpact).toBe('high');
  });

  it('validates limits correctly for a clean release snapshot', () => {
    const snapshot = makeSnapshot();
    const results = ReleaseReadinessValidator.evaluateGates(DEFAULT_RELEASE_GATES, snapshot, []);
    const metrics = ReleaseReadinessValidator.validateLimits(results, []);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });
});

// ===========================================================================
// 6. ReleaseReadinessReportGenerator
// ===========================================================================
describe('ReleaseReadinessReportGenerator — calculateScore & Report Generation', () => {
  it('returns 100 for all passing gates', () => {
    const snapshot = makeSnapshot();
    const results = ReleaseReadinessValidator.evaluateGates(DEFAULT_RELEASE_GATES, snapshot, []);
    const assessment = ReleaseReadinessValidator.assessReadiness(results, []);
    const score = ReleaseReadinessReportGenerator.calculateScore(assessment, results);

    expect(score).toBe(100);
  });

  it('generates a full ReleaseReport with status and unfulfilled gates section', () => {
    const snapshot = makeSnapshot({ isArchitectureFreezeApproved: false });
    const gates = DEFAULT_RELEASE_GATES;
    const risks = ReleaseReadinessAnalyzer.analyzeAll(snapshot, gates);
    const results = ReleaseReadinessValidator.evaluateGates(gates, snapshot, risks);
    const assessment = ReleaseReadinessValidator.assessReadiness(results, risks);

    const report = ReleaseReadinessReportGenerator.generateReport(assessment, results, risks, snapshot, gates);

    expect(report.status).toBe('Not Ready');
    expect(report.unfulfilledGates.length).toBeGreaterThan(0);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('exports valid Markdown with Status Emoji and Quality Gates Table', () => {
    const snapshot = makeSnapshot();
    const results = ReleaseReadinessValidator.evaluateGates(DEFAULT_RELEASE_GATES, snapshot, []);
    const assessment = ReleaseReadinessValidator.assessReadiness(results, []);
    const report = ReleaseReadinessReportGenerator.generateReport(assessment, results, [], snapshot, DEFAULT_RELEASE_GATES);

    const md = ReleaseReadinessReportGenerator.toMarkdown(report);
    expect(md).toContain('# Release Readiness Intelligence Report');
    expect(md).toContain('🟢 READY');
    expect(md).toContain('Quality Gates Status');
  });

  it('exports valid JSON', () => {
    const snapshot = makeSnapshot();
    const results = ReleaseReadinessValidator.evaluateGates(DEFAULT_RELEASE_GATES, snapshot, []);
    const assessment = ReleaseReadinessValidator.assessReadiness(results, []);
    const report = ReleaseReadinessReportGenerator.generateReport(assessment, results, [], snapshot, DEFAULT_RELEASE_GATES);

    const json = ReleaseReadinessReportGenerator.toJSON(report);
    expect(json).toContain('"releaseReadinessScore"');
    expect(json).toContain('"status"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 7. ReleaseReadinessCLI
// ===========================================================================
describe('ReleaseReadinessCLI', () => {
  it('defaults to help with no args', () => {
    expect(ReleaseReadinessCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze', () => {
    expect(ReleaseReadinessCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate', () => {
    expect(ReleaseReadinessCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report', () => {
    expect(ReleaseReadinessCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses options --target, --out, --format', () => {
    const res = ReleaseReadinessCLI.parseArgs(['report', '--target=.', '--format=json', '--out=rel.json']);
    expect(res.targetPath).toBe('.');
    expect(res.format).toBe('json');
    expect(res.outputPath).toBe('rel.json');
  });

  it('help text contains commands and options', () => {
    const help = ReleaseReadinessCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 8. analyzeAll — integration smoke test
// ===========================================================================
describe('ReleaseReadinessAnalyzer — analyzeAll integration', () => {
  it('returns zero blocker risks for a fully ready snapshot', () => {
    const snapshot = makeSnapshot();
    const risks = ReleaseReadinessAnalyzer.analyzeAll(snapshot, DEFAULT_RELEASE_GATES);
    expect(risks.filter((r) => r.isBlocker)).toHaveLength(0);
  });

  it('returns combined risks from multiple passes for an unprepared snapshot', () => {
    const snapshot = makeSnapshot({
      hasArchitectureFreezeDoc: false,
      intelligence: {
        breakingChangeCount: 2,
        securityCriticalCount: 1,
        cycleCount: 1,
      },
    });
    const risks = ReleaseReadinessAnalyzer.analyzeAll(snapshot, DEFAULT_RELEASE_GATES);
    expect(risks.filter((r) => r.isBlocker).length).toBeGreaterThan(2);
  });
});
