import { describe, it, expect } from 'vitest';
import {
  DependencyAnalyzer,
  DependencyValidator,
  DependencyReportGenerator,
  DependencyCLI,
} from './index';
import type { DependencyNode } from './index';

// ===========================================================================
// Fixture Factories
// ===========================================================================

function makeNode(
  id: string,
  deps: Record<string, string> = {},
  devDependencies: Record<string, string> = {},
  usedImports: string[] = Object.keys(deps),
  isWorkspacePackage = true
): DependencyNode {
  return {
    id,
    version: '0.1.0',
    isWorkspacePackage,
    dependencies: deps,
    devDependencies,
    usedImports,
  };
}

// ===========================================================================
// 1. DependencyAnalyzer — parseGraph
// ===========================================================================
describe('DependencyAnalyzer — parseGraph', () => {
  it('converts raw objects into DependencyNode objects', () => {
    const nodes = DependencyAnalyzer.parseGraph([
      { id: '@web-factor/builder', dependencies: { 'react': '^18.0.0' } },
    ]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('@web-factor/builder');
    expect(nodes[0].isWorkspacePackage).toBe(true);
  });
});

// ===========================================================================
// 2. DependencyAnalyzer — detectCycles (circular dependency detection)
// ===========================================================================
describe('DependencyAnalyzer — detectCycles', () => {
  it('detects a direct cycle between two workspace packages (A -> B -> A)', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { '@web-factor/pkg-b': '0.1.0' });
    const nodeB = makeNode('@web-factor/pkg-b', { '@web-factor/pkg-a': '0.1.0' });

    const issues = DependencyAnalyzer.detectCycles([nodeA, nodeB]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('dependency_cycle');
    expect(issues[0].severity).toBe('critical');
    expect(issues[0].cyclePath).toBeDefined();
  });

  it('detects a transitive cycle (A -> B -> C -> A)', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { '@web-factor/pkg-b': '0.1.0' });
    const nodeB = makeNode('@web-factor/pkg-b', { '@web-factor/pkg-c': '0.1.0' });
    const nodeC = makeNode('@web-factor/pkg-c', { '@web-factor/pkg-a': '0.1.0' });

    const issues = DependencyAnalyzer.detectCycles([nodeA, nodeB, nodeC]);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.issueType === 'dependency_cycle')).toBe(true);
  });

  it('returns no issues for an acyclic graph (DAG)', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { '@web-factor/pkg-b': '0.1.0' });
    const nodeB = makeNode('@web-factor/pkg-b', { '@web-factor/pkg-c': '0.1.0' });
    const nodeC = makeNode('@web-factor/pkg-c', {});

    expect(DependencyAnalyzer.detectCycles([nodeA, nodeB, nodeC])).toHaveLength(0);
  });
});

// ===========================================================================
// 3. DependencyAnalyzer — detectUnusedDependencies (unused dependency detection)
// ===========================================================================
describe('DependencyAnalyzer — detectUnusedDependencies', () => {
  it('flags a declared dependency that is never imported in code', () => {
    const node = makeNode('@web-factor/app', { 'lodash': '^4.17.21' }, {}, ['react']);
    const issues = DependencyAnalyzer.detectUnusedDependencies([node]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('unused_declared_dependency');
    expect(issues[0].severity).toBe('warning');
  });

  it('ignores @types packages', () => {
    const node = makeNode('@web-factor/app', { '@types/react': '^18.0.0' }, {}, []);
    expect(DependencyAnalyzer.detectUnusedDependencies([node])).toHaveLength(0);
  });

  it('returns no issues when all declared dependencies are imported', () => {
    const node = makeNode('@web-factor/app', { 'lodash': '^4.17.21' }, {}, ['lodash']);
    expect(DependencyAnalyzer.detectUnusedDependencies([node])).toHaveLength(0);
  });
});

// ===========================================================================
// 4. DependencyAnalyzer — detectOrphanedPackages
// ===========================================================================
describe('DependencyAnalyzer — detectOrphanedPackages', () => {
  it('flags a workspace package that no other package depends on', () => {
    const nodeA = makeNode('@web-factor/main-app', { '@web-factor/used-lib': '0.1.0' });
    const nodeB = makeNode('@web-factor/used-lib', {});
    const nodeC = makeNode('@web-factor/orphan-lib', {});

    const issues = DependencyAnalyzer.detectOrphanedPackages([nodeA, nodeB, nodeC]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('orphaned_workspace_package');
    expect(issues[0].targetPath).toBe('@web-factor/orphan-lib');
  });
});

// ===========================================================================
// 5. DependencyAnalyzer — detectDuplicateDeclarations
// ===========================================================================
describe('DependencyAnalyzer — detectDuplicateDeclarations', () => {
  it('flags a package listed in both dependencies and devDependencies', () => {
    const node = makeNode('@web-factor/app', { 'react': '^18.0.0' }, { 'react': '^18.0.0' });
    const issues = DependencyAnalyzer.detectDuplicateDeclarations([node]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('duplicate_dependency_declaration');
    expect(issues[0].severity).toBe('error');
  });
});

// ===========================================================================
// 6. DependencyAnalyzer — detectVersionInconsistencies (version conflict detection)
// ===========================================================================
describe('DependencyAnalyzer — detectVersionInconsistencies', () => {
  it('flags conflicting semver requirements for the same third-party package', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { 'lodash': '^4.17.21' });
    const nodeB = makeNode('@web-factor/pkg-b', { 'lodash': '~3.10.1' });

    const issues = DependencyAnalyzer.detectVersionInconsistencies([nodeA, nodeB]);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe('version_mismatch');
    expect(issues[0].versionDetails).toContain('^4.17.21');
    expect(issues[0].versionDetails).toContain('~3.10.1');
  });

  it('returns no issues when all packages use the same version range', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { 'lodash': '^4.17.21' });
    const nodeB = makeNode('@web-factor/pkg-b', { 'lodash': '^4.17.21' });

    expect(DependencyAnalyzer.detectVersionInconsistencies([nodeA, nodeB])).toHaveLength(0);
  });
});

// ===========================================================================
// 7. DependencyAnalyzer — Graph Calculations
// ===========================================================================
describe('DependencyAnalyzer — Graph Calculations', () => {
  it('calculates max graph depth correctly', () => {
    // A -> B -> C (depth 2)
    const nodeA = makeNode('@web-factor/a', { '@web-factor/b': '0.1.0' });
    const nodeB = makeNode('@web-factor/b', { '@web-factor/c': '0.1.0' });
    const nodeC = makeNode('@web-factor/c', {});

    const depth = DependencyAnalyzer.calculateMaxGraphDepth([nodeA, nodeB, nodeC]);
    expect(depth).toBe(2);
  });

  it('builds directed edges list correctly', () => {
    const nodeA = makeNode('@web-factor/a', { 'react': '^18.0.0' }, { 'vitest': '^1.0.0' });
    const edges = DependencyAnalyzer.buildEdges([nodeA]);
    expect(edges).toHaveLength(2);
    expect(edges.some((e) => e.relationType === 'direct')).toBe(true);
    expect(edges.some((e) => e.relationType === 'dev')).toBe(true);
  });
});

// ===========================================================================
// 8. DependencyValidator — assessIssues & validateLimits
// ===========================================================================
describe('DependencyValidator — assessIssues', () => {
  it('returns zero counts for a clean graph', () => {
    const assessment = DependencyValidator.assessIssues([]);
    expect(assessment.totalIssues).toBe(0);
    expect(assessment.criticalCount).toBe(0);
  });

  it('groups issues by category and type correctly', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { 'lodash': '^4.17.21' });
    const nodeB = makeNode('@web-factor/pkg-b', { 'lodash': '~3.10.1' });
    const issues = DependencyAnalyzer.detectVersionInconsistencies([nodeA, nodeB]);
    const assessment = DependencyValidator.assessIssues(issues);

    expect(assessment.byCategory['version_inconsistency']).toBeDefined();
    expect(assessment.byType['version_mismatch']).toBeDefined();
  });
});

describe('DependencyValidator — validateLimits & prioritiseRecommendations', () => {
  it('passes all metrics for a clean graph', () => {
    const metrics = DependencyValidator.validateLimits([]);
    expect(metrics.every((m) => m.passing)).toBe(true);
  });

  it('fails dependencyCycleCount when cycles are present', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { '@web-factor/pkg-b': '0.1.0' });
    const nodeB = makeNode('@web-factor/pkg-b', { '@web-factor/pkg-a': '0.1.0' });
    const issues = DependencyAnalyzer.detectCycles([nodeA, nodeB]);
    const metrics = DependencyValidator.validateLimits(issues);
    expect(metrics.find((m) => m.metricName === 'dependencyCycleCount')?.passing).toBe(false);
  });

  it('prioritises cycle recommendations at priority 1', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { '@web-factor/pkg-b': '0.1.0' });
    const nodeB = makeNode('@web-factor/pkg-b', { '@web-factor/pkg-a': '0.1.0' });
    const issues = DependencyAnalyzer.detectCycles([nodeA, nodeB]);
    const recs = DependencyValidator.prioritiseRecommendations(issues);
    expect(recs[0].priority).toBe(1);
    expect(recs[0].category).toBe('circular_dependency');
    expect(recs[0].estimatedImpact).toBe('high');
  });
});

// ===========================================================================
// 9. DependencyReportGenerator
// ===========================================================================
describe('DependencyReportGenerator — calculateScore & deriveGrade', () => {
  it('returns 100 and A+ for clean assessment', () => {
    const assessment = DependencyValidator.assessIssues([]);
    const score = DependencyReportGenerator.calculateScore(assessment);
    expect(score).toBe(100);
    expect(DependencyReportGenerator.deriveGrade(score)).toBe('A+');
  });

  it('penalises critical issues (25 pts each)', () => {
    const assessment = DependencyValidator.assessIssues([]);
    assessment.criticalCount = 2;
    const score = DependencyReportGenerator.calculateScore(assessment);
    expect(score).toBe(50);
    expect(DependencyReportGenerator.deriveGrade(score)).toBe('D');
  });
});

describe('DependencyReportGenerator — generateReport & exports', () => {
  it('generates a full DependencyReport', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { 'react': '^18.0.0' });
    const assessment = DependencyValidator.assessIssues([], [nodeA]);
    const report = DependencyReportGenerator.generateReport(assessment, [], [nodeA]);

    expect(report.dependencyHealthScore).toBe(100);
    expect(report.grade).toBe('A+');
    expect(report.totalNodeCount).toBe(1);
    expect(report.totalEdgeCount).toBe(1);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('exports valid Markdown', () => {
    const assessment = DependencyValidator.assessIssues([]);
    const report = DependencyReportGenerator.generateReport(assessment, [], []);
    const md = DependencyReportGenerator.toMarkdown(report);
    expect(md).toContain('# Dependency Intelligence Health Report');
    expect(md).toContain('Dependency Health Score');
  });

  it('exports valid JSON', () => {
    const assessment = DependencyValidator.assessIssues([]);
    const report = DependencyReportGenerator.generateReport(assessment, [], []);
    const json = DependencyReportGenerator.toJSON(report);
    expect(json).toContain('"dependencyHealthScore"');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

// ===========================================================================
// 10. DependencyCLI
// ===========================================================================
describe('DependencyCLI', () => {
  it('defaults to help with no args', () => {
    expect(DependencyCLI.parseArgs([]).command).toBe('help');
  });

  it('parses analyze', () => {
    expect(DependencyCLI.parseArgs(['analyze']).command).toBe('analyze');
  });

  it('parses validate', () => {
    expect(DependencyCLI.parseArgs(['validate']).command).toBe('validate');
  });

  it('parses report', () => {
    expect(DependencyCLI.parseArgs(['report']).command).toBe('report');
  });

  it('parses options --target, --out, --format', () => {
    const res = DependencyCLI.parseArgs(['report', '--target=packages', '--format=json', '--out=deps.json']);
    expect(res.targetPath).toBe('packages');
    expect(res.format).toBe('json');
    expect(res.outputPath).toBe('deps.json');
  });

  it('help text contains commands and options', () => {
    const help = DependencyCLI.getHelpText();
    expect(help).toContain('analyze');
    expect(help).toContain('validate');
    expect(help).toContain('report');
    expect(help).toContain('--target');
    expect(help).toContain('--format');
    expect(help).toContain('--out');
  });
});

// ===========================================================================
// 11. analyzeAll — integration smoke test
// ===========================================================================
describe('DependencyAnalyzer — analyzeAll integration', () => {
  it('returns no critical findings for a clean DAG', () => {
    const nodeA = makeNode('@web-factor/app', { '@web-factor/sdk': '0.1.0' });
    const nodeB = makeNode('@web-factor/sdk', { 'react': '^18.0.0' }, {}, ['react']);
    const issues = DependencyAnalyzer.analyzeAll([nodeA, nodeB]);
    expect(issues.filter((i) => i.severity === 'critical')).toHaveLength(0);
  });

  it('returns combined issues across passes for a problematic graph', () => {
    const nodeA = makeNode('@web-factor/pkg-a', { '@web-factor/pkg-b': '0.1.0', 'lodash': '^4.17.21' }, { 'react': '^18.0.0' }, []);
    const nodeB = makeNode('@web-factor/pkg-b', { '@web-factor/pkg-a': '0.1.0', 'lodash': '~3.10.1' }, { 'react': '^18.0.0' }, []);

    const issues = DependencyAnalyzer.analyzeAll([nodeA, nodeB]);
    const types = new Set(issues.map((i) => i.issueType));
    expect(types.size).toBeGreaterThan(1);
  });
});
