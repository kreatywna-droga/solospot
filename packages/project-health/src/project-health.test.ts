import { describe, it, expect } from 'vitest';
import {
  CodeMetricsEngine,
  QualityAnalyzer,
  HealthReportGenerator,
  ProjectHealthCLI,
} from './index';

describe('Project Health Package Unit Tests', () => {
  it('should analyze source metrics correctly', () => {
    const code = `
      export interface User { id: string; }
      export type Status = 'active' | 'inactive';
      export class UserEngine {}
      export function createUser() {}
    `;

    const metric = CodeMetricsEngine.analyzeSource('src/user.ts', code);
    expect(metric.interfaceCount).toBe(1);
    expect(metric.typeCount).toBe(1);
    expect(metric.classCount).toBe(1);
    expect(metric.functionCount).toBe(1);

    const summary = CodeMetricsEngine.aggregateMetrics([metric]);
    expect(summary.totalFiles).toBe(1);
    expect(summary.totalInterfaces).toBe(1);
  });

  it('should run quality analyzer checks', () => {
    const files = ['src/index.ts', 'src/ButtonComponent.ts', 'src/OrphanFile.ts'];
    const namingFindings = QualityAnalyzer.checkNamingConventions(files);
    expect(Array.isArray(namingFindings)).toBe(true);

    const structFindings = QualityAnalyzer.checkPackageStructure(files); // missing package.json & README.md
    expect(structFindings.some(f => f.category === 'structure')).toBe(true);
  });

  it('should calculate Health Score and generate Markdown report', () => {
    const code = 'export interface Config { val: string; }';
    const metric = CodeMetricsEngine.analyzeSource('src/index.ts', code);
    const summary = CodeMetricsEngine.aggregateMetrics([metric]);

    const findings = QualityAnalyzer.checkPackageStructure(['src/index.ts']); // missing README & package.json
    const report = HealthReportGenerator.generateReport(summary, findings);

    expect(report.healthScore).toBeGreaterThan(0);
    expect(report.healthScore).toBeLessThanOrEqual(100);
    expect(report.grade).toBeDefined();

    const md = HealthReportGenerator.toMarkdown(report);
    expect(md).toContain('# Project Health & Quality Report');
    expect(md).toContain('Overall Health Score');

    const json = HealthReportGenerator.toJSON(report);
    expect(json).toContain('"healthScore"');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = ProjectHealthCLI.parseArgs(['analyze', '--target=packages/ui-core', '--out=health.md']);

    expect(parseRes.command).toBe('analyze');
    expect(parseRes.targetPath).toBe('packages/ui-core');
    expect(parseRes.outputPath).toBe('health.md');

    const help = ProjectHealthCLI.getHelpText();
    expect(help).toContain('Usage: project-health <command>');
  });
});
