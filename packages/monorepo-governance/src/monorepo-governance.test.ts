import { describe, it, expect } from 'vitest';
import {
  DEFAULT_MONOREPO_POLICY,
  WorkspaceValidator,
  GovernanceAnalyzer,
  GovernanceReportGenerator,
  MonorepoGovernanceCLI,
  WorkspacePackageInfo,
} from './index';

describe('Monorepo Governance Platform Unit Tests', () => {
  const mockPackages: WorkspacePackageInfo[] = [
    {
      name: '@web-factor/ui-core',
      path: 'packages/ui-core',
      version: '0.1.0',
      isPrivate: true,
      types: './src/index.ts',
    },
    {
      name: 'invalid-name-package',
      path: 'packages/invalid',
      version: '0.1.0',
      isPrivate: false,
    },
  ];

  it('should validate package scope naming conventions', () => {
    expect(WorkspaceValidator.validatePackageName('@web-factor/ui-core')).toBe(true);
    expect(WorkspaceValidator.validatePackageName('invalid-package')).toBe(false);
  });

  it('should analyze workspace packages and detect violations', () => {
    const analysis = GovernanceAnalyzer.analyzeWorkspace(mockPackages);

    expect(analysis.totalPackagesCount).toBe(2);
    expect(analysis.compliantPackagesCount).toBe(1);
    expect(analysis.violations.length).toBeGreaterThan(0);
    expect(analysis.violations[0].severity).toBe('error');
  });

  it('should calculate Governance Score and generate Markdown & JSON report', () => {
    const analysis = GovernanceAnalyzer.analyzeWorkspace(mockPackages);
    const report = GovernanceReportGenerator.generateReport(analysis);

    expect(report.governanceScore).toBeGreaterThanOrEqual(0);
    expect(report.governanceScore).toBeLessThanOrEqual(100);
    expect(report.grade).toBeDefined();

    const md = GovernanceReportGenerator.toMarkdown(report);
    expect(md).toContain('# Monorepo Governance Analysis Report');
    expect(md).toContain('Governance Score');

    const json = GovernanceReportGenerator.toJSON(report);
    expect(json).toContain('"governanceScore"');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = MonorepoGovernanceCLI.parseArgs(['validate', '--target=packages/ui-core']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.targetPath).toBe('packages/ui-core');

    const help = MonorepoGovernanceCLI.getHelpText();
    expect(help).toContain('Usage: monorepo-governance <command>');
  });
});
