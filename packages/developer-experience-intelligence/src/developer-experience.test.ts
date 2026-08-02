import { describe, it, expect } from 'vitest';
import {
  DXAnalyzer,
  DXValidator,
  DXReportGenerator,
  DeveloperExperienceCLI,
} from './index';

describe('Developer Experience Intelligence Unit Tests', () => {
  it('should analyze export naming conventions and warn on UPPERCASE exports', () => {
    const exports = ['BuilderDocument', 'createContext', 'RAW_GLOBAL_STATE'];
    const issues = DXAnalyzer.analyzeNamingConventions('@web-factor/builder-core', exports);

    expect(issues.length).toBe(1);
    expect(issues[0].category).toBe('naming');
    expect(issues[0].severity).toBe('warning');
  });

  it('should detect empty public export indices when source modules exist', () => {
    const files = ['src/Core.ts', 'src/Utils.ts'];
    const indices: string[] = [];

    const issues = DXAnalyzer.analyzeExportCompleteness('@web-factor/empty-exports', files, indices);
    expect(issues.length).toBe(1);
    expect(issues[0].category).toBe('exports');
    expect(issues[0].severity).toBe('error');
  });

  it('should assess DX issues and generate Markdown & JSON reports', () => {
    const issues = DXAnalyzer.analyzeNamingConventions('@web-factor/pkg', ['UPPER_VAL']);
    const assessment = DXValidator.assessDX(issues);

    expect(assessment.totalIssues).toBe(1);
    expect(assessment.warningCount).toBe(1);

    const report = DXReportGenerator.generateReport(issues);
    expect(report.developerExperienceScore).toBe(95);
    expect(report.grade).toBe('A+');

    const md = DXReportGenerator.toMarkdown(report);
    expect(md).toContain('# Developer Experience (DX) Intelligence Report');
    expect(md).toContain('UPPER_VAL');

    const json = DXReportGenerator.toJSON(report);
    expect(json).toContain('"developerExperienceScore": 95');
  });

  it('should parse CLI arguments correctly', () => {
    const parseRes = DeveloperExperienceCLI.parseArgs(['validate', '--target=packages/ui-core']);
    expect(parseRes.command).toBe('validate');
    expect(parseRes.targetPath).toBe('packages/ui-core');

    const help = DeveloperExperienceCLI.getHelpText();
    expect(help).toContain('Usage: developer-experience <command>');
  });
});
