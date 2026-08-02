import { describe, it, expect } from 'vitest';
import {
  PackageNode,
  PackageDependencyAnalyzer,
  DependencyValidator,
  DependencyReportGenerator,
  PackageDependencyCLI,
} from './index';

describe('Package Dependency Intelligence Unit Tests', () => {
  const samplePackages: PackageNode[] = [
    {
      name: '@web-factor/pkg-a',
      version: '0.1.0',
      path: 'packages/pkg-a',
      dependencies: ['@web-factor/pkg-b'],
      devDependencies: [],
    },
    {
      name: '@web-factor/pkg-b',
      version: '0.1.0',
      path: 'packages/pkg-b',
      dependencies: ['@web-factor/pkg-a'], // CIRCULAR CYCLE!
      devDependencies: [],
    },
    {
      name: '@web-factor/pkg-orphan',
      version: '0.1.0',
      path: 'packages/pkg-orphan',
      dependencies: [],
      devDependencies: [],
    },
  ];

  it('should build dependency graph and detect circular dependencies & orphans', () => {
    const graph = PackageDependencyAnalyzer.buildGraph(samplePackages);
    expect(graph.nodes.size).toBe(3);
    expect(graph.dependencies.length).toBe(2);

    const cycles = PackageDependencyAnalyzer.detectCycles(graph);
    expect(cycles.length).toBeGreaterThan(0);

    const orphans = PackageDependencyAnalyzer.detectOrphans(graph);
    expect(orphans.length).toBe(1);
    expect(orphans[0]).toBe('@web-factor/pkg-orphan');
  });

  it('should validate graph and generate Dependency Health Score report', () => {
    const graph = PackageDependencyAnalyzer.buildGraph(samplePackages);
    const issues = DependencyValidator.validateGraph(graph);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.issueType === 'cycle')).toBe(true);

    const report = DependencyReportGenerator.generateReport(graph);
    expect(report.dependencyHealthScore).toBeLessThan(100);
    expect(report.grade).toBeDefined();

    const md = DependencyReportGenerator.toMarkdown(report);
    expect(md).toContain('# Package Dependency Intelligence Analysis Report');
    expect(md).toContain('Circular dependency detected');

    const json = DependencyReportGenerator.toJSON(report);
    expect(json).toContain('"dependencyHealthScore"');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = PackageDependencyCLI.parseArgs(['validate', '--target=packages']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.targetPath).toBe('packages');

    const help = PackageDependencyCLI.getHelpText();
    expect(help).toContain('Usage: package-dependency <command>');
  });
});
