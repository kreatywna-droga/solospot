import { describe, it, expect } from 'vitest';
import {
  PackageManifest,
  ManifestValidator,
  PackageDependencyGraph,
  RegistryReportGenerator,
  PackageRegistryCLI,
} from './index';

describe('Package Registry Platform Unit Tests', () => {
  const sampleManifests: PackageManifest[] = [
    {
      id: 'pkg-ui-core',
      name: '@web-factor/ui-core',
      version: '1.0.0',
      type: 'component',
      author: { name: 'WEB FACTOR Team' },
      dependencies: [{ name: 'pkg-tokens', versionConstraint: '^1.0.0' }],
      capabilities: [{ id: 'cap:ui', name: 'UI Components' }],
      metadata: { description: 'UI Core components' },
    },
    {
      id: 'pkg-tokens',
      name: '@web-factor/design-tokens',
      version: '1.0.0',
      type: 'infrastructure',
      author: { name: 'WEB FACTOR Team' },
      dependencies: [],
      capabilities: [{ id: 'cap:theme', name: 'Design Tokens' }],
      metadata: { description: 'Central design tokens' },
    },
  ];

  it('should validate semver format and package manifests', () => {
    expect(ManifestValidator.validateSemver('1.2.3')).toBe(true);
    expect(ManifestValidator.validateSemver('invalid')).toBe(false);

    const validRes = ManifestValidator.validateManifest(sampleManifests[0]);
    expect(validRes.isValid).toBe(true);

    const invalidRes = ManifestValidator.validateManifest({ name: 'Test' });
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.errors.some(e => e.field === 'id')).toBe(true);
  });

  it('should build dependency graph and compute topological sort order', () => {
    const graph = new PackageDependencyGraph();
    graph.buildGraph(sampleManifests);

    const report = graph.generateReport();
    expect(report.totalNodes).toBe(2);
    expect(report.hasCycles).toBe(false);
    expect(report.loadOrder).toEqual(['pkg-tokens', 'pkg-ui-core']);
  });

  it('should generate Markdown & JSON report', () => {
    const reportData = RegistryReportGenerator.generate(sampleManifests);
    expect(reportData.totalPackages).toBe(2);
    expect(reportData.totalCapabilities).toBe(2);

    const md = RegistryReportGenerator.toMarkdown(reportData);
    expect(md).toContain('# Package Registry Analysis Report');
    expect(md).toContain('`pkg-ui-core`');

    const json = RegistryReportGenerator.toJSON(reportData);
    expect(json).toContain('"totalPackages": 2');
  });

  it('should parse CLI arguments correctly', () => {
    const cliRes = PackageRegistryCLI.parseArgs(['validate', '--manifest=packages/package-registry']);
    expect(cliRes.command).toBe('validate');
    expect(cliRes.manifestPath).toBe('packages/package-registry');

    const help = PackageRegistryCLI.getHelpText();
    expect(help).toContain('Usage: package-registry <command>');
  });
});
